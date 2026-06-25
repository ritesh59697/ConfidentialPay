// ─── Contract Addresses ───────────────────────────────────────────────────────
// Update INVOICE_VAULT after deploying: npx hardhat run scripts/deploy.ts --network sepolia

export const INVOICE_VAULT_ADDRESS =
  (import.meta.env.VITE_INVOICE_VAULT_ADDRESS as `0x${string}`) ||
  "0x0000000000000000000000000000000000000000";

export const CUSDT_ADDRESS =
  (import.meta.env.VITE_CUSDT_ADDRESS as `0x${string}`) ||
  "0x0000000000000000000000000000000000000000";

// ─── InvoiceVault ABI (minimal — only what the frontend needs) ────────────────

export const INVOICE_VAULT_ABI = [
  // Write
  {
    name: "createInvoice",
    type: "function",
    stateMutability: "nonpayable",
    inputs: [
      { name: "recipient",    type: "address"  },
      { name: "encAmount",    type: "bytes32"  }, // einput
      { name: "inputProof",   type: "bytes"    },
      { name: "metadataURI",  type: "string"   },
    ],
    outputs: [{ name: "id", type: "uint256" }],
  },
  {
    name: "payInvoice",
    type: "function",
    stateMutability: "nonpayable",
    inputs: [{ name: "invoiceId", type: "uint256" }],
    outputs: [],
  },
  {
    name: "cancelInvoice",
    type: "function",
    stateMutability: "nonpayable",
    inputs: [{ name: "invoiceId", type: "uint256" }],
    outputs: [],
  },
  // Read
  {
    name: "getInvoiceMeta",
    type: "function",
    stateMutability: "view",
    inputs: [{ name: "invoiceId", type: "uint256" }],
    outputs: [
      { name: "id",           type: "uint256" },
      { name: "sender",       type: "address" },
      { name: "recipient",    type: "address" },
      { name: "metadataURI",  type: "string"  },
      { name: "createdAt",    type: "uint256" },
      { name: "status",       type: "uint8"   }, // 0=Pending 1=Paid 2=Cancelled
    ],
  },
  {
    name: "getEncryptedAmount",
    type: "function",
    stateMutability: "view",
    inputs: [{ name: "invoiceId", type: "uint256" }],
    outputs: [{ name: "", type: "bytes32" }], // euint64 handle
  },
  {
    name: "getSentInvoiceIds",
    type: "function",
    stateMutability: "view",
    inputs: [{ name: "user", type: "address" }],
    outputs: [{ name: "", type: "uint256[]" }],
  },
  {
    name: "getReceivedInvoiceIds",
    type: "function",
    stateMutability: "view",
    inputs: [{ name: "user", type: "address" }],
    outputs: [{ name: "", type: "uint256[]" }],
  },
  {
    name: "isInvoicePaid",
    type: "function",
    stateMutability: "view",
    inputs: [{ name: "invoiceId", type: "uint256" }],
    outputs: [{ name: "", type: "bool" }],
  },
  // Events
  {
    name: "InvoiceCreated",
    type: "event",
    inputs: [
      { name: "id",        type: "uint256", indexed: true  },
      { name: "sender",    type: "address", indexed: true  },
      { name: "recipient", type: "address", indexed: true  },
      { name: "createdAt", type: "uint256", indexed: false },
    ],
  },
  {
    name: "InvoicePaid",
    type: "event",
    inputs: [
      { name: "id",     type: "uint256", indexed: true  },
      { name: "paidAt", type: "uint256", indexed: false },
    ],
  },
] as const;

export const CUSDT_ABI = [
  {
    name: "setOperator",
    type: "function",
    stateMutability: "nonpayable",
    inputs: [
      { name: "operator", type: "address" },
      { name: "until", type: "uint48" },
    ],
    outputs: [],
  },
  {
    name: "isOperator",
    type: "function",
    stateMutability: "view",
    inputs: [
      { name: "holder", type: "address" },
      { name: "spender", type: "address" },
    ],
    outputs: [{ name: "", type: "bool" }],
  },
] as const;

// ─── Invoice Status Helpers ───────────────────────────────────────────────────

export const INVOICE_STATUS = {
  0: "Pending",
  1: "Paid",
  2: "Cancelled",
} as const;

export type InvoiceStatusCode = keyof typeof INVOICE_STATUS;
