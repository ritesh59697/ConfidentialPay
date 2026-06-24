import { useState } from "react";
import { useAccount } from "wagmi";
import { Lock, Unlock, CheckCircle, Clock, XCircle, ShieldCheck } from "lucide-react";
import {
  useReceivedInvoiceIds,
  useInvoiceMeta,
  usePayInvoice,
  useDecryptInvoiceAmount,
} from "@/hooks/useInvoice";
import { useIsInvoicePaid } from "@/hooks/useInvoice";
import { useReadContract } from "wagmi";
import { INVOICE_VAULT_ABI, INVOICE_VAULT_ADDRESS } from "@/lib/contracts";

// ─── Proof of Payment Badge ───────────────────────────────────────────────────

function PaymentProofBadge({ invoiceId }: { invoiceId: bigint }) {
  const { data: isPaid } = useIsInvoicePaid(invoiceId);

  if (!isPaid) return null;

  return (
    <div className="flex items-center gap-2 bg-green-950/40 border border-green-900/50 rounded-lg px-3 py-2 text-xs text-green-400">
      <ShieldCheck size={13} />
      <span>
        <strong>Verified on-chain:</strong> Invoice #{invoiceId.toString()} was paid in full —
        amount remains encrypted.
      </span>
    </div>
  );
}

// ─── Received Invoice Card ────────────────────────────────────────────────────

function ReceivedInvoiceCard({ invoiceId }: { invoiceId: bigint }) {
  const { data: meta }                        = useInvoiceMeta(invoiceId);
  const { data: encHandle }                   = useReadContract({
    address: INVOICE_VAULT_ADDRESS,
    abi: INVOICE_VAULT_ABI,
    functionName: "getEncryptedAmount",
    args: [invoiceId],
  });
  const { payInvoice, isPending: isPaying }   = usePayInvoice();
  const { decryptAmount }                     = useDecryptInvoiceAmount();
  const [decryptedAmount, setDecryptedAmount] = useState<bigint | null>(null);
  const [isDecrypting, setIsDecrypting]       = useState(false);
  const [txHash, setTxHash]                   = useState<string | null>(null);

  if (!meta) return <div className="h-32 bg-gray-900 rounded-xl animate-pulse" />;

  const [id, sender, , , createdAt, status] = meta;

  async function handleDecrypt() {
    if (!encHandle) return;
    setIsDecrypting(true);
    try {
      // Signs an EIP-712 permit — amount revealed only to this wallet
      const amount = await decryptAmount(encHandle as `0x${string}`);
      setDecryptedAmount(amount);
    } catch (err) {
      console.error("Decrypt failed:", err);
    } finally {
      setIsDecrypting(false);
    }
  }

  async function handlePay() {
    try {
      const hash = await payInvoice(id);
      setTxHash(hash);
    } catch (err) {
      console.error("Payment failed:", err);
    }
  }

  const isPaid      = status === 1;
  const isCancelled = status === 2;
  const isPending   = status === 0;

  return (
    <div className={`bg-gray-900 border rounded-xl p-4 space-y-3 ${
      isPaid ? "border-green-900/50" : isCancelled ? "border-gray-800/50 opacity-60" : "border-gray-800"
    }`}>
      {/* Header row */}
      <div className="flex items-start justify-between gap-2">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-500 font-mono">#{id.toString()}</span>
            {isPaid && (
              <span className="flex items-center gap-1 text-xs text-green-400 font-medium">
                <CheckCircle size={11} /> Paid
              </span>
            )}
            {isPending && (
              <span className="flex items-center gap-1 text-xs text-yellow-400 font-medium">
                <Clock size={11} /> Pending
              </span>
            )}
            {isCancelled && (
              <span className="flex items-center gap-1 text-xs text-gray-500 font-medium">
                <XCircle size={11} /> Cancelled
              </span>
            )}
          </div>
          <p className="text-xs text-gray-500 mt-0.5">
            From <span className="font-mono">{sender.slice(0, 6)}…{sender.slice(-4)}</span>
            {" · "}{new Date(Number(createdAt) * 1000).toLocaleDateString()}
          </p>
        </div>

        {/* Amount area */}
        <div className="text-right flex-shrink-0">
          {decryptedAmount !== null ? (
            <div>
              <p className="text-lg font-semibold tabular-nums">
                ${(Number(decryptedAmount) / 1_000_000).toFixed(2)}
              </p>
              <p className="text-xs text-gray-500">USDT</p>
            </div>
          ) : (
            <div className="flex items-center gap-1.5 text-gray-500">
              <Lock size={13} />
              <span className="text-sm font-mono">****</span>
            </div>
          )}
        </div>
      </div>

      {/* Actions */}
      {isPending && (
        <div className="flex gap-2 pt-1">
          {decryptedAmount === null ? (
            <button
              onClick={handleDecrypt}
              disabled={isDecrypting}
              className="flex-1 flex items-center justify-center gap-1.5 bg-gray-800 hover:bg-gray-700 disabled:opacity-40 text-sm py-2 rounded-lg transition-colors"
            >
              <Unlock size={13} />
              {isDecrypting ? "Decrypting…" : "Reveal amount"}
            </button>
          ) : (
            <button
              onClick={handlePay}
              disabled={isPaying}
              className="flex-1 flex items-center justify-center gap-1.5 bg-blue-600 hover:bg-blue-500 disabled:opacity-40 text-white text-sm font-medium py-2 rounded-lg transition-colors"
            >
              <CheckCircle size={13} />
              {isPaying ? "Paying…" : `Pay $${(Number(decryptedAmount) / 1_000_000).toFixed(2)} USDT`}
            </button>
          )}
        </div>
      )}

      {/* Tx confirmation */}
      {txHash && (
        <a
          href={`https://sepolia.etherscan.io/tx/${txHash}`}
          target="_blank"
          rel="noreferrer"
          className="block text-xs text-green-400 hover:text-green-300 font-mono"
        >
          ✓ Paid · {txHash.slice(0, 16)}…
        </a>
      )}

      {/* Proof of payment badge — the FHE superpower */}
      <PaymentProofBadge invoiceId={id} />
    </div>
  );
}

// ─── Receiver Dashboard ───────────────────────────────────────────────────────

export default function ReceiverDashboard() {
  const { isConnected } = useAccount();
  const { data: invoiceIds, isLoading } = useReceivedInvoiceIds();

  if (!isConnected) {
    return (
      <div className="text-center py-20 text-gray-500">
        <Lock size={40} className="mx-auto mb-4 opacity-30" />
        <p className="text-sm">Connect your wallet to view received invoices</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold">Received invoices</h1>
        <p className="text-sm text-gray-500 mt-0.5">
          Click "Reveal amount" to decrypt — only your wallet can see the value
        </p>
      </div>

      {/* How decryption works callout */}
      <div className="flex items-start gap-2.5 bg-gray-900 border border-gray-800 rounded-xl px-4 py-3 text-xs text-gray-400">
        <ShieldCheck size={14} className="mt-0.5 flex-shrink-0 text-blue-400" />
        <span>
          Amounts are decrypted using an <strong className="text-gray-300">EIP-712 signature</strong> — 
          your wallet proves it has permission, and the Zama relayer returns the plaintext only to you.
          The value never touches the blockchain in the clear.
        </span>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-32 bg-gray-900 rounded-xl animate-pulse" />
          ))}
        </div>
      ) : invoiceIds && invoiceIds.length > 0 ? (
        <div className="space-y-3">
          {[...invoiceIds].reverse().map((id) => (
            <ReceivedInvoiceCard key={id.toString()} invoiceId={id} />
          ))}
        </div>
      ) : (
        <div className="text-center py-16 border border-dashed border-gray-800 rounded-xl">
          <p className="text-sm text-gray-500">No invoices received yet</p>
        </div>
      )}
    </div>
  );
}
