import { useCallback } from "react";
import { useWriteContract, useReadContract, useAccount, usePublicClient } from "wagmi";
import { useZamaSDK } from "@zama-fhe/react-sdk";
import { CUSDT_ABI, CUSDT_ADDRESS, INVOICE_VAULT_ABI, INVOICE_VAULT_ADDRESS } from "@/lib/contracts";

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
  const sdk = useZamaSDK();
  const { address } = useAccount();

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

      // 1. Encrypt the amount client-side — never sent in plaintext
      const { encryptedValues, inputProof } = await sdk.encrypt({
        values: [{ value: amount, type: "euint64" }],
        contractAddress: INVOICE_VAULT_ADDRESS,
        userAddress: address,
      });
      const encAmount = encryptedValues[0]; // encrypted euint64 handle

      // 2. Submit the encrypted value to the contract
      const txHash = await writeContractAsync({
        address: INVOICE_VAULT_ADDRESS,
        abi: INVOICE_VAULT_ABI,
        functionName: "createInvoice",
        args: [recipient, encAmount, inputProof, metadataURI],
      });

      return txHash;
    },
    [sdk, address, writeContractAsync]
  );

  return { createInvoice, isPending, error };
}

// ─── usePayInvoice ────────────────────────────────────────────────────────────

export function usePayInvoice() {
  const { writeContractAsync, isPending, error } = useWriteContract();
  const { address } = useAccount();
  const publicClient = usePublicClient();

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
      return txHash;
    },
    [address, publicClient, writeContractAsync]
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
 * Uses the Zama SDK's decryption tools to reveal the encrypted amount
 * locally. Only the wallet that holds ACL permission can do this.
 */
export function useDecryptInvoiceAmount() {
  const sdk = useZamaSDK();

  const decryptAmount = useCallback(
    async (encryptedHandle: `0x${string}`) => {
      // Before decrypting, check and grant EIP-712 permit for the contract
      const hasPermit = await sdk.permits.hasPermit([INVOICE_VAULT_ADDRESS]);
      if (!hasPermit) {
        await sdk.permits.grantPermit([INVOICE_VAULT_ADDRESS]);
      }

      // Decrypt using the Zama SDK relayer query
      const results = await sdk.decryption.decryptValues([
        { encryptedValue: encryptedHandle, contractAddress: INVOICE_VAULT_ADDRESS },
      ]);
      const decrypted = results[encryptedHandle];
      return BigInt(decrypted);
    },
    [sdk]
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
