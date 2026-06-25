// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import { FHE, euint64, externalEuint64 } from "@fhevm/solidity/lib/FHE.sol";
import { ZamaEthereumConfig } from "@fhevm/solidity/config/ZamaConfig.sol";

interface IERC7984 {
    function isOperator(address holder, address spender) external view returns (bool);
    function confidentialTransferFrom(address from, address to, euint64 amount) external returns (euint64 transferred);
}

/**
 * @title InvoiceVault
 * @notice Confidential B2B invoice and payment system using FHE.
 *         Invoice amounts are stored encrypted on-chain.
 *         Only the sender and recipient can decrypt their own invoices.
 *         Payment settlement uses confidential ERC-7984 cUSDT transfers.
 */
contract InvoiceVault is ZamaEthereumConfig {

    // ─── Types ────────────────────────────────────────────────────────────

    enum InvoiceStatus { Pending, Paid, Cancelled }

    struct Invoice {
        uint256 id;
        address sender;
        address recipient;
        euint64 amount;           // FHE-encrypted amount — never exposed on-chain
        string  metadataURI;      // IPFS URI: description, filename, due date
        uint256 createdAt;
        InvoiceStatus status;
    }

    // ─── State ────────────────────────────────────────────────────────────

    uint256 public nextInvoiceId;
    mapping(uint256 => Invoice) private invoices;

    // Track invoice IDs per address for dashboard queries
    mapping(address => uint256[]) private sentInvoices;
    mapping(address => uint256[]) private receivedInvoices;

    // cUSDT wrapped token address (ERC-7984)
    IERC7984 public immutable cUSDT;

    // ─── Events ───────────────────────────────────────────────────────────

    /// @dev Amounts are intentionally omitted from events — FHE privacy
    event InvoiceCreated(uint256 indexed id, address indexed sender, address indexed recipient, uint256 createdAt);
    event InvoicePaid(uint256 indexed id, uint256 paidAt);
    event InvoiceCancelled(uint256 indexed id);

    // ─── Errors ───────────────────────────────────────────────────────────

    error NotAuthorized();
    error InvoiceNotPending();
    error InvoiceNotFound();
    error OperatorNotSet(address token);
    error ZeroAddress();

    // ─── Constructor ──────────────────────────────────────────────────────

    constructor(address _cUSDT) {
        if (_cUSDT == address(0)) revert ZeroAddress();
        cUSDT = IERC7984(_cUSDT);
    }

    // ─── Core Functions ───────────────────────────────────────────────────

    /**
     * @notice Create a confidential invoice.
     * @param recipient   The address that will receive and pay this invoice.
     * @param encAmount   Client-encrypted euint64 amount (encrypted with Zama SDK before submission).
     * @param metadataURI IPFS URI pointing to off-chain invoice metadata (description, due date).
     * @return id         The new invoice's ID.
     */
    function createInvoice(
        address recipient,
        externalEuint64 encAmount,
        bytes calldata inputProof,
        string calldata metadataURI
    ) external returns (uint256 id) {
        if (recipient == address(0)) revert ZeroAddress();
        if (recipient == msg.sender) revert NotAuthorized();

        id = nextInvoiceId++;

        euint64 amount = FHE.fromExternal(encAmount, inputProof);

        // Grant the vault persistent access so it can later pass this handle to cUSDT.
        FHE.allowThis(amount);
        FHE.allow(amount, msg.sender);
        FHE.allow(amount, recipient);

        invoices[id] = Invoice({
            id: id,
            sender: msg.sender,
            recipient: recipient,
            amount: amount,
            metadataURI: metadataURI,
            createdAt: block.timestamp,
            status: InvoiceStatus.Pending
        });

        sentInvoices[msg.sender].push(id);
        receivedInvoices[recipient].push(id);

        emit InvoiceCreated(id, msg.sender, recipient, block.timestamp);
    }

    /**
     * @notice Pay a pending invoice using confidential cUSDT.
     *         The transfer amount stays encrypted end-to-end.
     * @param invoiceId The ID of the invoice to pay.
     */
    function payInvoice(uint256 invoiceId) external {
        Invoice storage inv = _getInvoice(invoiceId);

        if (inv.status != InvoiceStatus.Pending) revert InvoiceNotPending();
        if (inv.recipient != msg.sender) revert NotAuthorized();
        if (!cUSDT.isOperator(msg.sender, address(this))) revert OperatorNotSet(address(cUSDT));

        FHE.allowTransient(inv.amount, address(cUSDT));
        cUSDT.confidentialTransferFrom(msg.sender, inv.sender, inv.amount);

        inv.status = InvoiceStatus.Paid;
        emit InvoicePaid(invoiceId, block.timestamp);
    }

    /**
     * @notice Cancel a pending invoice. Only the original sender can cancel.
     */
    function cancelInvoice(uint256 invoiceId) external {
        Invoice storage inv = _getInvoice(invoiceId);
        if (inv.sender != msg.sender) revert NotAuthorized();
        if (inv.status != InvoiceStatus.Pending) revert InvoiceNotPending();

        inv.status = InvoiceStatus.Cancelled;
        emit InvoiceCancelled(invoiceId);
    }

    // ─── View Functions ───────────────────────────────────────────────────

    /**
     * @notice Get invoice metadata (everything except the encrypted amount).
     *         Amount must be decrypted separately via the Zama SDK (EIP-712 user-decrypt).
     */
    function getInvoiceMeta(uint256 invoiceId) external view returns (
        uint256 id,
        address sender,
        address recipient,
        string memory metadataURI,
        uint256 createdAt,
        InvoiceStatus status
    ) {
        Invoice storage inv = _getInvoice(invoiceId);
        return (inv.id, inv.sender, inv.recipient, inv.metadataURI, inv.createdAt, inv.status);
    }

    /**
     * @notice Returns the encrypted handle for the invoice amount.
     *         Use the Zama SDK's userDecrypt() to reveal it client-side — only
     *         sender and recipient hold the ACL permission to do so.
     */
    function getEncryptedAmount(uint256 invoiceId) external view returns (euint64) {
        Invoice storage inv = _getInvoice(invoiceId);
        if (inv.sender != msg.sender && inv.recipient != msg.sender) revert NotAuthorized();
        return inv.amount;
    }

    /**
     * @notice Get all invoice IDs sent by an address.
     */
    function getSentInvoiceIds(address user) external view returns (uint256[] memory) {
        return sentInvoices[user];
    }

    /**
     * @notice Get all invoice IDs received by an address.
     */
    function getReceivedInvoiceIds(address user) external view returns (uint256[] memory) {
        return receivedInvoices[user];
    }

    /**
     * @notice Verifiable proof that an invoice was paid — without revealing the amount.
     *         This is the key FHE superpower: prove a fact about encrypted data.
     */
    function isInvoicePaid(uint256 invoiceId) external view returns (bool) {
        return invoices[invoiceId].status == InvoiceStatus.Paid;
    }

    // ─── Internal ─────────────────────────────────────────────────────────

    function _getInvoice(uint256 invoiceId) internal view returns (Invoice storage) {
        Invoice storage inv = invoices[invoiceId];
        if (inv.createdAt == 0) revert InvoiceNotFound();
        return inv;
    }
}
