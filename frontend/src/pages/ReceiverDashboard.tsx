import { useState, useEffect } from "react";
import { useAccount } from "wagmi";
import { Lock, Unlock, CheckCircle, Clock, XCircle, ShieldCheck, FileText, ArrowDownLeft, AlertCircle, Sparkles } from "lucide-react";
import {
  useReceivedInvoiceIds,
  useInvoiceMeta,
  usePayInvoice,
  useDecryptInvoiceAmount,
  useIsInvoicePaid,
} from "@/hooks/useInvoice";
import { useReadContract } from "wagmi";
import { INVOICE_VAULT_ABI, INVOICE_VAULT_ADDRESS } from "@/lib/contracts";

// ─── Proof of Payment Badge ───────────────────────────────────────────────────

function PaymentProofBadge({ invoiceId }: { invoiceId: bigint }) {
  const { data: isPaid } = useIsInvoicePaid(invoiceId);

  if (!isPaid) return null;

  return (
    <div className="flex items-center gap-2 bg-green-950/20 border border-green-900/35 rounded-xl px-4 py-3 text-xs text-green-400">
      <ShieldCheck size={14} className="text-green-400 flex-shrink-0 animate-pulse" />
      <span className="leading-relaxed">
        <strong>Verified On-Chain:</strong> Invoice #{invoiceId.toString()} has been settled in full. 
        Thanks to FHE, the transfer occurred with full privacy, leaving no payment amount exposed publicly.
      </span>
    </div>
  );
}

// ─── Received Invoice Card ────────────────────────────────────────────────────

function ReceivedInvoiceCard({
  invoiceId,
  onStatusLoaded,
}: {
  invoiceId: bigint;
  onStatusLoaded?: (id: string, status: number) => void;
}) {
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

  const status = meta ? Number(meta[5]) : null;

  useEffect(() => {
    if (status !== null && onStatusLoaded) {
      onStatusLoaded(invoiceId.toString(), status);
    }
  }, [status, invoiceId, onStatusLoaded]);

  if (!meta) return <div className="h-40 bg-gray-900/40 border border-gray-850 rounded-2xl animate-pulse" />;

  const [id, sender, , metadataURI, createdAt] = meta;

  // Parse description from JSON metadata URI
  let description = "Confidential Invoice";
  if (metadataURI && metadataURI.startsWith("data:application/json,")) {
    try {
      const decoded = decodeURIComponent(metadataURI.replace("data:application/json,", ""));
      const json = JSON.parse(decoded);
      description = json.description || "Confidential Invoice";
    } catch (e) {
      console.warn("Failed to parse metadata", e);
    }
  }

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

  const statusConfig = {
    0: { label: "Pending",   icon: Clock,       color: "text-yellow-400 bg-yellow-400/5 border-yellow-400/10" },
    1: { label: "Paid",      icon: CheckCircle, color: "text-green-400 bg-green-400/5 border-green-400/10"  },
    2: { label: "Cancelled", icon: XCircle,     color: "text-gray-500 bg-gray-500/5 border-gray-500/10"   },
  }[status as 0 | 1 | 2] || { label: "Unknown", icon: Clock, color: "text-gray-400" };

  const StatusIcon = statusConfig.icon;

  return (
    <div className={`bg-gray-900/30 border rounded-2xl p-5 space-y-4 glass-card-hover ${
      isPaid ? "border-green-950/40" : isCancelled ? "border-gray-900 opacity-60" : "border-gray-900"
    }`}>
      {/* Header Info */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-600/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 mt-0.5">
            <ArrowDownLeft size={18} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-500 font-mono">#{id.toString()}</span>
              <h4 className="font-semibold text-sm text-gray-100">{description}</h4>
            </div>
            <p className="text-xxs text-gray-500 font-light mt-0.5">
              From: <span className="font-mono text-gray-400">{sender.slice(0, 6)}…{sender.slice(-4)}</span>
              {" · "}{new Date(Number(createdAt) * 1000).toLocaleDateString()}
            </p>
          </div>
        </div>

        {/* Amount Area */}
        <div className="text-right">
          {decryptedAmount !== null ? (
            <div className="space-y-0.5">
              <p className="text-lg font-bold text-white tabular-nums select-all">
                ${(Number(decryptedAmount) / 1_000_000).toFixed(2)}
              </p>
              <span className="inline-flex items-center gap-1 text-[10px] text-emerald-400 font-medium">
                <Sparkles size={9} /> Decrypted
              </span>
            </div>
          ) : (
            <div className="flex items-center justify-end gap-1.5 px-2.5 py-1 bg-gray-950/60 border border-gray-800 rounded-lg text-gray-500 text-xs font-mono select-none">
              <Lock size={10} />
              <span>Encrypted</span>
            </div>
          )}
        </div>
      </div>

      {/* Invoice Row Footer Actions */}
      <div className="flex flex-col gap-3">
        {isPending && !txHash && (
          <div className="flex items-center gap-2 pt-1">
            {decryptedAmount === null ? (
              <button
                onClick={handleDecrypt}
                disabled={isDecrypting}
                className="flex-1 flex items-center justify-center gap-1.5 bg-gray-850 hover:bg-gray-800 border border-gray-800 hover:border-gray-700 text-gray-200 text-xs font-medium py-2 rounded-xl transition-all disabled:opacity-40"
              >
                <Unlock size={12} />
                {isDecrypting ? "Requesting Decryption…" : "Reveal Amount"}
              </button>
            ) : (
              <button
                onClick={handlePay}
                disabled={isPaying}
                className="flex-1 flex items-center justify-center gap-1.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold py-2 rounded-xl transition-all shadow-lg shadow-blue-600/10 disabled:opacity-40"
              >
                <CheckCircle size={12} />
                {isPaying ? "Sending Payment…" : `Pay $${(Number(decryptedAmount) / 1_000_000).toFixed(2)} USDT`}
              </button>
            )}
          </div>
        )}

        {/* Transaction confirmation link */}
        {txHash && (
          <div className="bg-gray-950/60 border border-gray-850 rounded-xl p-3 flex items-center justify-between">
            <span className="text-[10px] text-green-400 font-medium flex items-center gap-1.5">
              <CheckCircle size={11} /> Invoice Paid
            </span>
            <a
              href={`https://sepolia.etherscan.io/tx/${txHash}`}
              target="_blank"
              rel="noreferrer"
              className="text-xxs text-blue-400 hover:text-blue-300 font-mono block truncate max-w-[200px]"
            >
              Tx: {txHash.slice(0, 16)}…
            </a>
          </div>
        )}

        {/* Verified proof of payment */}
        <PaymentProofBadge invoiceId={id} />
      </div>
    </div>
  );
}

// ─── Stats Banner Component ───────────────────────────────────────────────────

function StatsBanner({ statusMap }: { statusMap: Record<string, number> }) {
  const values = Object.values(statusMap);
  const total = values.length;
  const pending = values.filter((s) => s === 0).length;
  const paid = values.filter((s) => s === 1).length;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
      {/* Stat 1 */}
      <div className="bg-gray-900/40 border border-gray-900 rounded-2xl p-5 flex items-center justify-between">
        <div className="space-y-1">
          <span className="block text-xxs text-gray-500 uppercase tracking-wider font-mono">Total Received</span>
          <span className="block text-2xl font-bold text-white tabular-nums">{total}</span>
        </div>
        <div className="w-10 h-10 rounded-xl bg-indigo-600/10 border border-indigo-500/10 flex items-center justify-center text-indigo-400">
          <FileText size={18} />
        </div>
      </div>

      {/* Stat 2 */}
      <div className="bg-gray-900/40 border border-gray-900 rounded-2xl p-5 flex items-center justify-between">
        <div className="space-y-1">
          <span className="block text-xxs text-gray-500 uppercase tracking-wider font-mono">Awaiting Action</span>
          <span className="block text-2xl font-bold text-yellow-400 tabular-nums">{pending}</span>
        </div>
        <div className="w-10 h-10 rounded-xl bg-yellow-500/10 border border-yellow-500/10 flex items-center justify-center text-yellow-400">
          <Clock size={18} />
        </div>
      </div>

      {/* Stat 3 */}
      <div className="bg-gray-900/40 border border-gray-900 rounded-2xl p-5 flex items-center justify-between">
        <div className="space-y-1">
          <span className="block text-xxs text-gray-500 uppercase tracking-wider font-mono">Total Paid</span>
          <span className="block text-2xl font-bold text-green-400 tabular-nums">{paid}</span>
        </div>
        <div className="w-10 h-10 rounded-xl bg-green-500/10 border border-green-500/10 flex items-center justify-center text-green-400">
          <CheckCircle size={18} />
        </div>
      </div>
    </div>
  );
}

// ─── Receiver Dashboard Main Component ─────────────────────────────────────────

export default function ReceiverDashboard() {
  const { isConnected } = useAccount();
  const { data: invoiceIds, isLoading } = useReceivedInvoiceIds();
  const [statusMap, setStatusMap] = useState<Record<string, number>>({});

  const handleStatusLoaded = (id: string, status: number) => {
    setStatusMap((prev) => {
      if (prev[id] === status) return prev;
      return { ...prev, [id]: status };
    });
  };

  // Sync state map size with list
  useEffect(() => {
    if (invoiceIds) {
      const keys = new Set(invoiceIds.map((id) => id.toString()));
      setStatusMap((prev) => {
        const cleaned = { ...prev };
        let altered = false;
        for (const k in cleaned) {
          if (!keys.has(k)) {
            delete cleaned[k];
            altered = true;
          }
        }
        return altered ? cleaned : prev;
      });
    }
  }, [invoiceIds]);

  if (!isConnected) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center max-w-md mx-auto space-y-4">
        <div className="w-14 h-14 rounded-2xl bg-gray-900 border border-gray-805 flex items-center justify-center text-gray-600">
          <Lock size={26} className="opacity-45" />
        </div>
        <div className="space-y-1.5">
          <h2 className="text-lg font-bold text-white">Invoice Settlement Dashboard</h2>
          <p className="text-xs text-gray-400 leading-relaxed font-light">
            To review or pay confidential incoming invoices, you must connect an Ethereum wallet to Sepolia.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div className="space-y-1">
        <h1 className="text-xl md:text-2xl font-bold tracking-tight">Received Invoices</h1>
        <p className="text-xs text-gray-400 font-light">
          Review, decrypt, and settle incoming invoices with confidential cUSDT.
        </p>
      </div>

      {/* Stats Summary Banner */}
      <StatsBanner statusMap={statusMap} />

      {/* EIP-712 Callout Info */}
      <div className="flex items-start gap-3 bg-gray-900 border border-gray-900 rounded-2xl px-5 py-4 text-xs text-gray-400 leading-relaxed">
        <ShieldCheck size={16} className="text-blue-500 mt-0.5 flex-shrink-0" />
        <span>
          <strong>Gated Decryption:</strong> To reveal private invoice amounts, you must sign an EIP-712 permit. Your wallet proves it holds ownership, allowing the relayer to securely return plaintext.
        </span>
      </div>

      {/* Invoices List */}
      <div className="space-y-3">
        <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider font-mono pl-1">Incoming</h3>
        
        {isLoading ? (
          <div className="space-y-3">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-36 bg-gray-900/40 border border-gray-850 rounded-2xl animate-pulse" />
            ))}
          </div>
        ) : invoiceIds && invoiceIds.length > 0 ? (
          <div className="space-y-3.5">
            {[...invoiceIds].reverse().map((id) => (
              <ReceivedInvoiceCard
                key={id.toString()}
                invoiceId={id}
                onStatusLoaded={handleStatusLoaded}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-20 border border-dashed border-gray-850 rounded-2xl space-y-4">
            <div className="w-10 h-10 rounded-full bg-gray-900/50 flex items-center justify-center mx-auto text-gray-600 border border-gray-850">
              <AlertCircle size={18} />
            </div>
            <div className="space-y-1">
              <p className="text-sm font-medium text-gray-400 font-semibold">No Invoices Received</p>
              <p className="text-xs text-gray-500 max-w-xs mx-auto leading-relaxed">
                No active confidential invoices have been sent to this wallet address yet.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
