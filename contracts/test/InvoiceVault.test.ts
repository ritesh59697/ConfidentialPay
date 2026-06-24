import { expect } from "chai";
import { ethers } from "hardhat";
import { InvoiceVault } from "../typechain-types";

/**
 * NOTE: Full FHE tests require the FHEVM mock environment.
 * Run: npx hardhat test (uses local mock — no real FHE compute)
 *
 * For encrypted type testing, the FHEVM hardhat plugin automatically
 * provides cleartext mock values during local tests.
 */

describe("InvoiceVault", () => {
  let vault: InvoiceVault;
  let mockCUSDT: string;
  let sender: any, recipient: any, stranger: any;

  beforeEach(async () => {
    [sender, recipient, stranger] = await ethers.getSigners();

    // Deploy a minimal ERC-20 mock as cUSDT stand-in for unit tests
    const MockToken = await ethers.getContractFactory("MockERC20");
    const mock = await MockToken.deploy("Confidential USDT", "cUSDT");
    mockCUSDT = await mock.getAddress();

    const InvoiceVault = await ethers.getContractFactory("InvoiceVault");
    vault = await InvoiceVault.deploy(mockCUSDT) as InvoiceVault;
  });

  describe("createInvoice", () => {
    it("creates an invoice and emits InvoiceCreated", async () => {
      // In FHEVM mock mode, encAmount is a plaintext value wrapped as einput
      const encAmount = ethers.toBeHex(1000n, 32); // mock encrypted value
      const inputProof = "0x";                       // mock proof

      await expect(
        vault.connect(sender).createInvoice(
          recipient.address,
          encAmount,
          inputProof,
          "ipfs://QmMockMetadata"
        )
      ).to.emit(vault, "InvoiceCreated")
        .withArgs(0, sender.address, recipient.address, await getTimestamp());
    });

    it("reverts when recipient is zero address", async () => {
      await expect(
        vault.connect(sender).createInvoice(
          ethers.ZeroAddress,
          ethers.toBeHex(100n, 32),
          "0x",
          "ipfs://test"
        )
      ).to.be.revertedWithCustomError(vault, "ZeroAddress");
    });

    it("reverts when sender tries to invoice themselves", async () => {
      await expect(
        vault.connect(sender).createInvoice(
          sender.address,
          ethers.toBeHex(100n, 32),
          "0x",
          "ipfs://test"
        )
      ).to.be.revertedWithCustomError(vault, "NotAuthorized");
    });
  });

  describe("getInvoiceMeta", () => {
    it("returns correct metadata after creation", async () => {
      await vault.connect(sender).createInvoice(
        recipient.address, ethers.toBeHex(500n, 32), "0x", "ipfs://QmTest"
      );

      const [id, s, r, uri, , status] = await vault.getInvoiceMeta(0);
      expect(id).to.equal(0);
      expect(s).to.equal(sender.address);
      expect(r).to.equal(recipient.address);
      expect(uri).to.equal("ipfs://QmTest");
      expect(status).to.equal(0); // Pending
    });
  });

  describe("cancelInvoice", () => {
    it("allows sender to cancel a pending invoice", async () => {
      await vault.connect(sender).createInvoice(
        recipient.address, ethers.toBeHex(200n, 32), "0x", "ipfs://x"
      );
      await expect(vault.connect(sender).cancelInvoice(0))
        .to.emit(vault, "InvoiceCancelled").withArgs(0);

      const [,,,,,status] = await vault.getInvoiceMeta(0);
      expect(status).to.equal(2); // Cancelled
    });

    it("reverts if stranger tries to cancel", async () => {
      await vault.connect(sender).createInvoice(
        recipient.address, ethers.toBeHex(200n, 32), "0x", "ipfs://x"
      );
      await expect(vault.connect(stranger).cancelInvoice(0))
        .to.be.revertedWithCustomError(vault, "NotAuthorized");
    });
  });

  describe("isInvoicePaid", () => {
    it("returns false for a new invoice", async () => {
      await vault.connect(sender).createInvoice(
        recipient.address, ethers.toBeHex(100n, 32), "0x", "ipfs://y"
      );
      expect(await vault.isInvoicePaid(0)).to.equal(false);
    });
  });

  describe("dashboard queries", () => {
    it("tracks sent and received invoice IDs", async () => {
      await vault.connect(sender).createInvoice(
        recipient.address, ethers.toBeHex(300n, 32), "0x", "ipfs://a"
      );
      await vault.connect(sender).createInvoice(
        recipient.address, ethers.toBeHex(400n, 32), "0x", "ipfs://b"
      );

      const sent = await vault.getSentInvoiceIds(sender.address);
      const received = await vault.getReceivedInvoiceIds(recipient.address);

      expect(sent.length).to.equal(2);
      expect(received.length).to.equal(2);
      expect(sent[0]).to.equal(0n);
      expect(sent[1]).to.equal(1n);
    });
  });
});

async function getTimestamp() {
  const block = await ethers.provider.getBlock("latest");
  return block!.timestamp;
}
