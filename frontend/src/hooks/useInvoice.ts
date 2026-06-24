import { useCallback } from "react";
import { useWriteContract, useReadContract, useAccount } from "wagmi";
import { useZamaToken } from "@zama-fhe/react-sdk";
import { INVOICE_VAULT_ABI, INVOICE_VAULT_ADDRESS, CUSDT_ADDRESS } from "@/lib/contracts";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface InvoiceMeta {
  id: bigint;
  sender: `0x${string}`;
  recipient: `0x${string}`;
  metadataURI: string;
  createdAt: bigint;
  status: 0 | 1 | 2;
  decryptedAmount?: bigint; // populated after SDK decrypt
}

// ─── useCreateInvoice ─────────────────────────────────────────────────────────

/**
 * Encrypts the invoice amount client-side using the Zama SDK,
 * then submits the encrypted value + proof to InvoiceVault.createInvoice().
 */
export function useCreateInvoice() {
  const { writeContractAsync, isPending, error } = useWriteContract();
  const token = useZamaToken(CUSDT_ADDRESS); // Zama SDK wrappedToken instance

  const createInvoice = useCallback(
    async ({
      recipient,
      amount,
      metadataURI,
    }: {
      recipient: `0x${string}`;
      amount: bigint;       // plaintext amount in USDT (6 decimals)
      metadataURI: string;
    }) => {
      // 1. Encrypt the amount client-side — never sent in plaintext
      const { handles, inputProof } = await token.encrypt64(amount);
      const encAmount = handles[0]; // encrypted euint64 handle

      // 2. Submit the encrypted value to the contract
      const txHash = await writeContractAsync({
        address: INVOICE_VAULT_ADDRESS,
        abi: INVOICE_VAULT_ABI,
        functionName: "createInvoice",
        args: [recipient, encAmount, inputProof, metadataURI],
      });

      return txHash;
    },
    [token, writeContractAsync]
  );

  return { createInvoice, isPending, error };
}

// ─── usePayInvoice ────────────────────────────────────────────────────────────

export function usePayInvoice() {
  const { writeContractAsync, isPending, error } = useWriteContract();

  const payInvoice = useCallback(
    async (invoiceId: bigint) => {
      const txHash = await writeContractAsync({
        address: INVOICE_VAULT_ADDRESS,
        abi: INVOICE_VAULT_ABI,
        functionName: "payInvoice",
        args: [invoiceId],
      });
      return txHash;
    },
    [writeContractAsync]
  );

  return { payInvoice, isPending, error };
}

// ─── useCancelInvoice ─────────────────────────────────────────────────────────

export function useCancelInvoice() {
  const { writeContractAsync, isPending, error } = useWriteContract();

  const cancelInvoice = useCallback(
    async (invoiceId: bigint) => {
      return writeContractAsync({
        address: INVOICE_VAULT_ADDRESS,
        abi: INVOICE_VAULT_ABI,
        functionName: "cancelInvoice",
        args: [invoiceId],
      });
    },
    [writeContractAsync]
  );

  return { cancelInvoice, isPending, error };
}

// ─── useInvoiceMeta ───────────────────────────────────────────────────────────

export function useInvoiceMeta(invoiceId: bigint | undefined) {
  return useReadContract({
    address: INVOICE_VAULT_ADDRESS,
    abi: INVOICE_VAULT_ABI,
    functionName: "getInvoiceMeta",
    args: invoiceId !== undefined ? [invoiceId] : undefined,
    query: { enabled: invoiceId !== undefined },
  });
}

// ─── useDecryptInvoiceAmount ──────────────────────────────────────────────────

/**
 * Uses the Zama SDK's userDecrypt (EIP-712) to reveal the encrypted amount
 * locally. Only the wallet that holds ACL permission can do this.
 */
export function useDecryptInvoiceAmount() {
  const token = useZamaToken(CUSDT_ADDRESS);

  const decryptAmount = useCallback(
    async (encryptedHandle: `0x${string}`) => {
      // userDecrypt signs an EIP-712 permit and sends to the Zama relayer
      // The relayer decrypts and returns the value — only to the authorized wallet
      const decrypted = await token.userDecrypt(encryptedHandle);
      return decrypted as bigint;
    },
    [token]
  );

  return { decryptAmount };
}

// ─── useSentInvoiceIds ────────────────────────────────────────────────────────

export function useSentInvoiceIds() {
  const { address } = useAccount();
  return useReadContract({
    address: INVOICE_VAULT_ADDRESS,
    abi: INVOICE_VAULT_ABI,
    functionName: "getSentInvoiceIds",
    args: address ? [address] : undefined,
    query: { enabled: !!address },
  });
}

// ─── useReceivedInvoiceIds ────────────────────────────────────────────────────

export function useReceivedInvoiceIds() {
  const { address } = useAccount();
  return useReadContract({
    address: INVOICE_VAULT_ADDRESS,
    abi: INVOICE_VAULT_ABI,
    functionName: "getReceivedInvoiceIds",
    args: address ? [address] : undefined,
    query: { enabled: !!address },
  });
}

// ─── useIsInvoicePaid ─────────────────────────────────────────────────────────

/**
 * Proof of payment — returns true/false without revealing amount.
 * Anyone can verify this. That's the FHE superpower.
 */
export function useIsInvoicePaid(invoiceId: bigint | undefined) {
  return useReadContract({
    address: INVOICE_VAULT_ADDRESS,
    abi: INVOICE_VAULT_ABI,
    functionName: "isInvoicePaid",
    args: invoiceId !== undefined ? [invoiceId] : undefined,
    query: { enabled: invoiceId !== undefined },
  });
}
