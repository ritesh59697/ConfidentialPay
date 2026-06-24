import { useState, useEffect } from "react";
import { useAccount } from "wagmi";
import { Lock, Send, Plus, X, CheckCircle, Clock, XCircle, FileText, ArrowUpRight, BarChart3, AlertCircle } from "lucide-react";
import { useCreateInvoice, useCancelInvoice, useSentInvoiceIds, useInvoiceMeta } from "@/hooks/useInvoice";

// ─── Create Invoice Form Modal ────────────────────────────────────────────────

function CreateInvoiceForm({ onClose }: { onClose: () => void }) {
  const [recipient, setRecipient]     = useState("");
  const [amount, setAmount]           = useState("");
  const [description, setDescription] = useState("");
  const [txHash, setTxHash]           = useState<string | null>(null);
  const { createInvoice, isPending }  = useCreateInvoice();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    // Store description and timestamp inline as a data URI
    const metadataURI = `data:application/json,${encodeURIComponent(
      JSON.stringify({ description, createdAt: new Date().toISOString() })
    )}`;

    const amountBigInt = BigInt(Math.round(parseFloat(amount) * 1_000_000)); // 6 decimals (USDT)

    try {
      const hash = await createInvoice({
        recipient: recipient as `0x${string}`,
        amount: amountBigInt,
        metadataURI,
      });
      setTxHash(hash);
    } catch (err) {
      console.error("Failed to create invoice:", err);
    }
  }

  if (txHash) {
    return (
      <div className="fixed inset-0 bg-gray-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-8 max-w-md w-full text-center space-y-4 shadow-2xl animate-float">
          <div className="mx-auto w-12 h-12 bg-green-500/10 border border-green-500/25 rounded-full flex items-center justify-center text-green-400">
            <CheckCircle size={24} />
          </div>
          <div>
            <h3 className="font-semibold text-lg text-white">Invoice Created & Encrypted</h3>
            <p className="text-xs text-gray-400 mt-1 leading-relaxed">
              The amount has been encrypted locally using Fully Homomorphic Encryption (FHE) and broadcasted to Sepolia.
            </p>
          </div>
          
          <div className="bg-gray-950/60 border border-gray-850 rounded-xl p-3.5 space-y-1 text-left">
            <span className="block text-xxs text-gray-500 font-mono uppercase tracking-wider">Transaction hash</span>
            <a
              href={`https://sepolia.etherscan.io/tx/${txHash}`}
              target="_blank"
              rel="noreferrer"
              className="text-xs text-blue-400 hover:text-blue-300 font-mono block truncate flex items-center gap-1"
            >
              <span>{txHash}</span>
              <ArrowUpRight size={12} className="flex-shrink-0" />
            </a>
          </div>

          <button
            onClick={onClose}
            className="w-full py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-medium text-sm rounded-xl transition-colors shadow-lg shadow-blue-600/20"
          >
            Go back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-gray-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-gray-900 border border-gray-800 rounded-2xl max-w-lg w-full overflow-hidden shadow-2xl transition-all scale-100 flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-850 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-blue-500/10 flex items-center justify-center text-blue-400 border border-blue-500/10">
              <FileText size={15} />
            </div>
            <h3 className="font-semibold text-sm md:text-base text-white">New Confidential Invoice</h3>
          </div>
          <button type="button" onClick={onClose} className="text-gray-400 hover:text-white p-1 rounded-lg hover:bg-gray-800/50 transition-colors">
            <X size={18} />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          <div className="space-y-1.5">
            <label className="block text-xs font-medium text-gray-300">Recipient Wallet Address</label>
            <input
              type="text"
              placeholder="0x..."
              value={recipient}
              onChange={(e) => setRecipient(e.target.value)}
              required
              className="w-full bg-gray-950 border border-gray-800 rounded-xl px-3.5 py-2.5 text-sm font-mono text-white placeholder-gray-600 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors"
            />
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-medium text-gray-300">
              Amount (USDT)
            </label>
            <div className="relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500 text-sm font-medium">$</span>
              <input
                type="number"
                min="0.01"
                step="0.01"
                placeholder="0.00"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                required
                className="w-full bg-gray-950 border border-gray-800 rounded-xl pl-8 pr-3.5 py-2.5 text-sm font-mono text-white placeholder-gray-600 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-medium text-gray-300">Description</label>
            <textarea
              placeholder="Provide a description or purpose for this invoice..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              className="w-full bg-gray-950 border border-gray-800 rounded-xl px-3.5 py-2.5 text-sm text-white placeholder-gray-600 resize-none focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors"
            />
          </div>

          {/* FHE Alert Callout */}
          <div className="flex items-start gap-3 bg-blue-950/20 border border-blue-900/30 rounded-xl p-3.5 text-xs text-blue-300">
            <Lock size={14} className="mt-0.5 flex-shrink-0 text-blue-400" />
            <span className="leading-relaxed">
              <strong>FHE Shielding Active:</strong> The amount is fully encrypted locally in your browser before broadcast. Validator nodes see only a ciphertext hash.
            </span>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 border border-gray-800 hover:bg-gray-850 text-gray-300 hover:text-white font-medium text-xs rounded-xl transition-all"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isPending || !recipient || !amount}
              className="flex-1 flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-40 disabled:cursor-not-allowed text-white font-semibold text-xs py-2.5 rounded-xl transition-colors shadow-lg shadow-blue-600/10"
            >
              <Send size={12} />
              {isPending ? "Encrypting & Sending…" : "Send Invoice"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── Invoice Row Component ────────────────────────────────────────────────────

function SentInvoiceRow({ invoiceId, onStatusLoaded }: { invoiceId: bigint; onStatusLoaded?: (id: string, status: number) => void }) {
  const { data } = useInvoiceMeta(invoiceId);
  const { cancelInvoice, isPending } = useCancelInvoice();

  const status = data ? Number(data[5]) : null;

  useEffect(() => {
    if (status !== null && onStatusLoaded) {
      onStatusLoaded(invoiceId.toString(), status);
    }
  }, [status, invoiceId, onStatusLoaded]);

  if (!data) return <div className="h-16 bg-gray-900/40 border border-gray-850 rounded-xl animate-pulse" />;

  const [id, , recipient, metadataURI, createdAt] = data;

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

  const statusConfig = {
    0: { label: "Pending",   icon: Clock,       color: "text-yellow-400 bg-yellow-400/5 border-yellow-400/10" },
    1: { label: "Paid",      icon: CheckCircle, color: "text-green-400 bg-green-400/5 border-green-400/10"  },
    2: { label: "Cancelled", icon: XCircle,     color: "text-gray-500 bg-gray-500/5 border-gray-500/10"   },
  }[status as 0 | 1 | 2] || { label: "Unknown", icon: Clock, color: "text-gray-400" };

  const StatusIcon = statusConfig.icon;

  return (
    <div className="bg-gray-900/30 border border-gray-900 rounded-2xl px-5 py-4 flex flex-col md:flex-row md:items-center justify-between gap-4 glass-card-hover">
      {/* Sender details and Description */}
      <div className="flex items-start gap-3.5">
        <div className="w-10 h-10 rounded-xl bg-blue-600/10 border border-blue-500/20 flex items-center justify-center text-blue-400 flex-shrink-0 mt-0.5">
          <FileText size={18} />
        </div>
        <div className="space-y-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-500 font-mono">#{id.toString()}</span>
            <span className="text-sm font-semibold text-gray-100 truncate">{description}</span>
          </div>
          <div className="flex items-center gap-2 text-xxs text-gray-500 font-light">
            <span>To:</span>
            <span className="font-mono text-gray-400">{recipient.slice(0, 6)}…{recipient.slice(-4)}</span>
            <span>·</span>
            <span>{new Date(Number(createdAt) * 1000).toLocaleDateString()}</span>
          </div>
        </div>
      </div>

      {/* Status, Amount, & Action buttons */}
      <div className="flex items-center justify-between md:justify-end gap-5 border-t border-gray-850 md:border-0 pt-3 md:pt-0">
        <div className="flex items-center gap-2">
          {/* Amount: fully private */}
          <div className="flex items-center gap-1 px-2.5 py-1 bg-gray-950/60 border border-gray-800 rounded-lg text-gray-400 text-xs font-mono select-none">
            <Lock size={10} className="text-gray-500" />
            <span>Encrypted</span>
          </div>

          <div className={`inline-flex items-center gap-1.5 text-xxs font-medium px-2.5 py-1 rounded-full border ${statusConfig.color}`}>
            <StatusIcon size={12} />
            <span>{statusConfig.label}</span>
          </div>
        </div>

        {status === 0 && (
          <button
            onClick={() => cancelInvoice(id)}
            disabled={isPending}
            className="text-xs text-gray-500 hover:text-red-400 font-medium px-2 py-1 hover:bg-red-500/5 rounded-lg border border-transparent hover:border-red-500/10 transition-all disabled:opacity-40"
          >
            Cancel
          </button>
        )}
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
          <span className="block text-xxs text-gray-500 uppercase tracking-wider font-mono">Total Created</span>
          <span className="block text-2xl font-bold text-white tabular-nums">{total}</span>
        </div>
        <div className="w-10 h-10 rounded-xl bg-blue-600/10 border border-blue-500/10 flex items-center justify-center text-blue-400">
          <FileText size={18} />
        </div>
      </div>

      {/* Stat 2 */}
      <div className="bg-gray-900/40 border border-gray-900 rounded-2xl p-5 flex items-center justify-between">
        <div className="space-y-1">
          <span className="block text-xxs text-gray-500 uppercase tracking-wider font-mono">Awaiting Payment</span>
          <span className="block text-2xl font-bold text-yellow-400 tabular-nums">{pending}</span>
        </div>
        <div className="w-10 h-10 rounded-xl bg-yellow-500/10 border border-yellow-500/10 flex items-center justify-center text-yellow-400">
          <Clock size={18} />
        </div>
      </div>

      {/* Stat 3 */}
      <div className="bg-gray-900/40 border border-gray-900 rounded-2xl p-5 flex items-center justify-between">
        <div className="space-y-1">
          <span className="block text-xxs text-gray-500 uppercase tracking-wider font-mono">Paid Settlement</span>
          <span className="block text-2xl font-bold text-green-400 tabular-nums">{paid}</span>
        </div>
        <div className="w-10 h-10 rounded-xl bg-green-500/10 border border-green-500/10 flex items-center justify-center text-green-400">
          <CheckCircle size={18} />
        </div>
      </div>
    </div>
  );
}

// ─── Sender Dashboard Main Component ──────────────────────────────────────────

export default function SenderDashboard() {
  const { isConnected } = useAccount();
  const [showForm, setShowForm] = useState(false);
  const { data: invoiceIds, isLoading } = useSentInvoiceIds();
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
          <h2 className="text-lg font-bold text-white">Invoice Management Dashboard</h2>
          <p className="text-xs text-gray-400 leading-relaxed font-light">
            To view or create B2B invoices with Fully Homomorphic Encryption, you must connect an Ethereum wallet to Sepolia.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-xl md:text-2xl font-bold tracking-tight">Sent Invoices Ledger</h1>
          <p className="text-xs text-gray-400 font-light">
            Create and track confidential invoices. Amounts remain hidden on-chain.
          </p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="w-full sm:w-auto flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold px-4 py-2.5 rounded-xl transition-all shadow-lg shadow-blue-600/10 hover:scale-[1.01]"
        >
          <Plus size={14} />
          <span>New Invoice</span>
        </button>
      </div>

      {/* Stats tiles */}
      <StatsBanner statusMap={statusMap} />

      {/* Create Modal Form */}
      {showForm && <CreateInvoiceForm onClose={() => setShowForm(false)} />}

      {/* Invoice list */}
      <div className="space-y-3">
        <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider font-mono pl-1">Invoices</h3>
        
        {isLoading ? (
          <div className="space-y-2">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-16 bg-gray-900/40 border border-gray-850 rounded-2xl animate-pulse" />
            ))}
          </div>
        ) : invoiceIds && invoiceIds.length > 0 ? (
          <div className="space-y-2.5">
            {[...invoiceIds].reverse().map((id) => (
              <SentInvoiceRow
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
              <p className="text-sm font-medium text-gray-400">No Sent Invoices Found</p>
              <p className="text-xs text-gray-500 max-w-xs mx-auto leading-relaxed">
                You haven't created any confidential invoices yet from this wallet.
              </p>
            </div>
            <button
              onClick={() => setShowForm(true)}
              className="text-xs text-blue-400 hover:text-blue-300 font-semibold px-3 py-1.5 bg-blue-600/5 hover:bg-blue-600/10 border border-blue-500/10 rounded-lg transition-all"
            >
              Create your first invoice
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
