import { useCallback } from "react";
import { useWriteContract, useReadContract, useAccount, usePublicClient, useSignTypedData } from "wagmi";
import { bytesToHex } from "viem";
import { CUSDT_ABI, CUSDT_ADDRESS, INVOICE_VAULT_ABI, INVOICE_VAULT_ADDRESS } from "@/lib/contracts";
import { getFhevm, getDecryptionSession, userDecrypt } from "@/lib/fhevm";
import { useQueryClient } from "@tanstack/react-query";

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
  const { address } = useAccount();
  const publicClient = usePublicClient();
  const queryClient = useQueryClient();

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
      if (!address) throw new Error("Wallet not connected");

      // 1. Encrypt the amount client-side using relayer-sdk
      const fhevm = await getFhevm();
      const input = fhevm.createEncryptedInput(INVOICE_VAULT_ADDRESS, address);
      input.add64(amount);
      const encrypted = await input.encrypt();
      const encAmount = bytesToHex(encrypted.handles[0]);
      const inputProof = bytesToHex(encrypted.inputProof);

      // 2. Submit the encrypted value and ZK input proof to the contract
      const txHash = await writeContractAsync({
        address: INVOICE_VAULT_ADDRESS,
        abi: INVOICE_VAULT_ABI,
        functionName: "createInvoice",
        args: [recipient, encAmount, inputProof, metadataURI],
      });

      if (publicClient) {
        await publicClient.waitForTransactionReceipt({ hash: txHash });
      }
      queryClient.invalidateQueries();

      return txHash;
    },
    [address, publicClient, queryClient, writeContractAsync]
  );

  return { createInvoice, isPending, error };
}

// ─── usePayInvoice ────────────────────────────────────────────────────────────

export function usePayInvoice() {
  const { writeContractAsync, isPending, error } = useWriteContract();
  const { address } = useAccount();
  const publicClient = usePublicClient();
  const queryClient = useQueryClient();

  const payInvoice = useCallback(
    async (invoiceId: bigint) => {
      if (!address) throw new Error("Wallet not connected");
      if (!publicClient) throw new Error("Public client not ready");
      if (CUSDT_ADDRESS === "0x0000000000000000000000000000000000000000") {
        throw new Error("cUSDT address is not configured");
      }

      const isOperator = await publicClient.readContract({
        address: CUSDT_ADDRESS,
        abi: CUSDT_ABI,
        functionName: "isOperator",
        args: [address, INVOICE_VAULT_ADDRESS],
      });

      if (!isOperator) {
        const oneYearFromNow = Math.floor(Date.now() / 1000) + 365 * 24 * 60 * 60;
        const approvalHash = await writeContractAsync({
          address: CUSDT_ADDRESS,
          abi: CUSDT_ABI,
          functionName: "setOperator",
          args: [INVOICE_VAULT_ADDRESS, oneYearFromNow],
        });
        await publicClient.waitForTransactionReceipt({ hash: approvalHash });
      }

      const txHash = await writeContractAsync({
        address: INVOICE_VAULT_ADDRESS,
        abi: INVOICE_VAULT_ABI,
        functionName: "payInvoice",
        args: [invoiceId],
      });

      await publicClient.waitForTransactionReceipt({ hash: txHash });
      queryClient.invalidateQueries();

      return txHash;
    },
    [address, publicClient, queryClient, writeContractAsync]
  );

  return { payInvoice, isPending, error };
}

// ─── useCancelInvoice ─────────────────────────────────────────────────────────

export function useCancelInvoice() {
  const { writeContractAsync, isPending, error } = useWriteContract();
  const publicClient = usePublicClient();
  const queryClient = useQueryClient();

  const cancelInvoice = useCallback(
    async (invoiceId: bigint) => {
      const txHash = await writeContractAsync({
        address: INVOICE_VAULT_ADDRESS,
        abi: INVOICE_VAULT_ABI,
        functionName: "cancelInvoice",
        args: [invoiceId],
      });

      if (publicClient) {
        await publicClient.waitForTransactionReceipt({ hash: txHash });
      }
      queryClient.invalidateQueries();

      return txHash;
    },
    [publicClient, queryClient, writeContractAsync]
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
 * Uses the Zama SDK's decryption tools to reveal the encrypted amount
 * locally. Only the wallet that holds ACL permission can do this.
 */
export function useDecryptInvoiceAmount() {
  const { signTypedDataAsync } = useSignTypedData();
  const { address } = useAccount();

  const decryptAmount = useCallback(
    async (encryptedHandle: `0x${string}`) => {
      if (!address) throw new Error("Wallet not connected");

      // 1. Get or create decryption session
      const session = await getDecryptionSession(
        "confidentialpay",
        address,
        [INVOICE_VAULT_ADDRESS],
        signTypedDataAsync as any
      );

      // 2. Decrypt the amount using the session key
      const amount = await userDecrypt(session, encryptedHandle, INVOICE_VAULT_ADDRESS);
      return amount;
    },
    [address, signTypedDataAsync]
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
