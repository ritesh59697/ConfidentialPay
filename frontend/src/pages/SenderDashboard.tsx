import { useState, useEffect } from "react";
import { useAccount } from "wagmi";
import { Lock, Send, Plus, X, CheckCircle, Clock, XCircle, FileText, ArrowUpRight, AlertCircle } from "lucide-react";
import { useCreateInvoice, useCancelInvoice, useSentInvoiceIds, useInvoiceMeta } from "@/hooks/useInvoice";

// ─── Create Invoice Form Modal ────────────────────────────────────────────────

function CreateInvoiceForm({ onClose }: { onClose: () => void }) {
  const [recipient, setRecipient]     = useState("");
  const [amount, setAmount]           = useState("");
  const [description, setDescription] = useState("");
  const [txHash, setTxHash]           = useState<string | null>(null);
  const [error, setError]             = useState<string | null>(null);
  const { createInvoice, isPending }  = useCreateInvoice();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

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
    } catch (err: unknown) {
      console.error("Failed to create invoice:", err);
      // Extract a user-friendly error message
      let msg = "Transaction failed. Please try again.";
      if (err instanceof Error) {
        if (err.message.includes("User rejected") || err.message.includes("user rejected")) {
          msg = "Transaction rejected in wallet.";
        } else if (err.message.includes("FHE") || err.message.includes("encrypt")) {
          msg = "FHE encryption failed. Make sure the Zama SDK is initialised and the network is Sepolia.";
        } else if (err.message.includes("insufficient funds")) {
          msg = "Insufficient ETH to pay gas fees.";
        } else if (err.message.includes("network") || err.message.includes("RPC")) {
          msg = "Network error. Check your RPC connection and try again.";
        } else {
          msg = err.message.length > 120 ? err.message.slice(0, 120) + "…" : err.message;
        }
      }
      setError(msg);
    }
  }

  if (txHash) {
    return (
      <div className="fixed inset-0 bg-[#0c0f16]/90 z-50 flex items-center justify-center p-4">
        <div className="bg-white dark:bg-[#121620] border-4 border-black dark:border-white p-8 max-w-md w-full text-center space-y-5 shadow-[6px_6px_0px_0px_#4ade80] text-black dark:text-white">
          <div className="mx-auto w-12 h-12 bg-emerald-400 border-[3px] border-black dark:border-white flex items-center justify-center text-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] dark:shadow-[2px_2px_0px_0px_rgba(255,255,255,1)]">
            <CheckCircle size={24} />
          </div>
          <div>
            <h3 className="font-black text-lg text-black dark:text-white uppercase tracking-wide">Invoice Created</h3>
            <p className="text-xs text-gray-700 dark:text-gray-300 mt-2 leading-relaxed font-semibold">
              The amount has been encrypted locally using Fully Homomorphic Encryption (FHE) and broadcasted to Sepolia.
            </p>
          </div>
          
          <div className="bg-[#f4f2ec] dark:bg-[#151821] border-[3px] border-black dark:border-white p-4 space-y-1 text-left">
            <span className="block text-[10px] text-gray-600 dark:text-gray-400 font-mono uppercase font-bold">Transaction Hash</span>
            <a
              href={`https://sepolia.etherscan.io/tx/${txHash}`}
              target="_blank"
              rel="noreferrer"
              className="text-xs text-blue-600 dark:text-blue-400 hover:text-blue-500 dark:hover:text-blue-300 font-mono block truncate flex items-center gap-1 underline decoration-1 decoration-blue-500"
            >
              <span>{txHash}</span>
              <ArrowUpRight size={14} className="flex-shrink-0" />
            </a>
          </div>

          <button
            onClick={onClose}
            className="w-full py-2.5 btn-brutal-blue text-xs"
          >
            Go back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-[#0c0f16]/95 z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-[#121620] border-4 border-black dark:border-white max-w-lg w-full overflow-hidden shadow-[8px_8px_0px_0px_#facc15] flex flex-col text-black dark:text-white">
        {/* Header */}
        <div className="px-6 py-4 border-b-4 border-black dark:border-white bg-white dark:bg-[#121620] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 border-[3px] border-black dark:border-white bg-yellow-400 flex items-center justify-center text-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] dark:shadow-[2px_2px_0px_0px_rgba(255,255,255,1)]">
              <FileText size={16} />
            </div>
            <h3 className="font-black text-sm md:text-base text-black dark:text-white uppercase tracking-wide">New Confidential Invoice</h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 border-[3px] border-black dark:border-white bg-white dark:bg-[#121620] text-black dark:text-white hover:bg-gray-100 dark:hover:bg-zinc-800 flex items-center justify-center shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] dark:shadow-[2px_2px_0px_0px_rgba(255,255,255,1)] active:translate-x-[1px] active:translate-y-[1px] active:shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] dark:active:shadow-[1px_1px_0px_0px_rgba(255,255,255,1)] transition-all"
          >
            <X size={16} />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          <div className="space-y-1.5">
            <label className="block text-xs font-black uppercase text-gray-700 dark:text-gray-300">Recipient Wallet Address</label>
            <input
              type="text"
              placeholder="0x..."
              value={recipient}
              onChange={(e) => { setRecipient(e.target.value); setError(null); }}
              required
              className="w-full bg-[#f4f2ec] dark:bg-[#151821] border-[3px] border-black dark:border-white px-3.5 py-2.5 text-sm font-mono text-black dark:text-white placeholder-gray-500 focus:outline-none focus:bg-white dark:focus:bg-[#1d222e] transition-colors font-bold"
            />
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-black uppercase text-gray-700 dark:text-gray-300">
              Amount (USDT)
            </label>
            <div className="relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-650 dark:text-gray-400 font-mono font-bold">$</span>
              <input
                type="number"
                min="0.01"
                step="0.01"
                placeholder="0.00"
                value={amount}
                onChange={(e) => { setAmount(e.target.value); setError(null); }}
                required
                className="w-full bg-[#f4f2ec] dark:bg-[#151821] border-[3px] border-black dark:border-white pl-8 pr-3.5 py-2.5 text-sm font-mono text-black dark:text-white placeholder-gray-500 focus:outline-none focus:bg-white dark:focus:bg-[#1d222e] transition-colors font-bold"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-black uppercase text-gray-700 dark:text-gray-300">Description</label>
            <textarea
              placeholder="Provide a description or purpose for this invoice..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              className="w-full bg-[#f4f2ec] dark:bg-[#151821] border-[3px] border-black dark:border-white px-3.5 py-2.5 text-sm text-black dark:text-white placeholder-gray-500 resize-none focus:outline-none focus:bg-white dark:focus:bg-[#1d222e] transition-colors font-semibold"
            />
          </div>

          {/* FHE Alert Callout */}
          <div className="flex items-start gap-3 border-[3px] border-black dark:border-white bg-[#f4f2ec] dark:bg-[#151821] p-4 shadow-[3px_3px_0px_0px_#60a5fa]">
            <Lock size={16} className="mt-0.5 flex-shrink-0 text-blue-600 dark:text-blue-400" />
            <span className="text-[11px] text-gray-700 dark:text-gray-300 leading-normal font-semibold">
              <strong>FHE Shielding Active:</strong> The amount is fully encrypted locally in your browser before broadcast. Validator nodes see only a ciphertext hash.
            </span>
          </div>

          {/* Error display */}
          {error && (
            <div className="flex items-start gap-3 border-[3px] border-red-500 bg-red-50 dark:bg-red-950/30 p-4 shadow-[3px_3px_0px_0px_#ef4444]">
              <AlertCircle size={16} className="mt-0.5 flex-shrink-0 text-red-600 dark:text-red-400" />
              <span className="text-[11px] text-red-700 dark:text-red-400 leading-normal font-semibold break-all">
                <strong>Error:</strong> {error}
              </span>
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center gap-4 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 btn-brutal-gray text-xs"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isPending || !recipient || !amount}
              className="flex-1 py-2.5 btn-brutal-yellow text-xs flex items-center justify-center gap-2"
            >
              <Send size={12} />
              <span>{isPending ? "Encrypting & Sending…" : "Send Invoice"}</span>
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

  if (!data) return <div className="h-16 bg-white border-[3px] border-black animate-pulse shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]" />;

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
    0: { label: "Pending",   icon: Clock,       badgeClass: "badge-brutal-yellow" },
    1: { label: "Paid",      icon: CheckCircle, badgeClass: "badge-brutal-green"  },
    2: { label: "Cancelled", icon: XCircle,     badgeClass: "badge-brutal-gray"   },
  }[status as 0 | 1 | 2] || { label: "Unknown", icon: Clock, badgeClass: "badge-brutal-gray" };

  const StatusIcon = statusConfig.icon;

  return (
    <div className="bg-white dark:bg-[#121620] border-[3px] border-black dark:border-white px-5 py-4 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] dark:shadow-[4px_4px_0px_0px_rgba(255,255,255,1)] hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] dark:hover:shadow-[6px_6px_0px_0px_rgba(255,255,255,1)] transition-all text-black dark:text-white">
      {/* Sender details and Description */}
      <div className="flex items-start gap-3.5">
        <div className="w-10 h-10 border-[3px] border-black dark:border-white bg-[#f4f2ec] dark:bg-[#151821] flex items-center justify-center text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5">
          <FileText size={18} />
        </div>
        <div className="space-y-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-xs text-red-500 font-mono font-bold">#{id.toString()}</span>
            <span className="text-sm font-black text-black dark:text-white uppercase tracking-wide truncate">{description}</span>
          </div>
          <div className="flex items-center gap-2 text-[10px] text-gray-600 dark:text-gray-400 font-mono font-bold">
            <span>To:</span>
            <span className="text-zinc-800 dark:text-gray-300">{recipient.slice(0, 6)}…{recipient.slice(-4)}</span>
            <span>·</span>
            <span>{new Date(Number(createdAt) * 1000).toLocaleDateString()}</span>
          </div>
        </div>
      </div>

      {/* Status, Amount, & Action buttons */}
      <div className="flex items-center justify-between md:justify-end gap-5 border-t border-gray-200 dark:border-zinc-700 md:border-0 pt-3 md:pt-0">
        <div className="flex items-center gap-3">
          {/* Amount: fully private */}
          <div className="flex items-center gap-1.5 px-2.5 py-1.5 bg-[#f4f2ec] dark:bg-[#151821] border-[2px] border-black dark:border-white text-pink-600 dark:text-pink-400 text-xxs font-mono font-bold uppercase select-none shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] dark:shadow-[2px_2px_0px_0px_rgba(255,255,255,1)]">
            <Lock size={11} />
            <span>Shielded</span>
          </div>

          <div className={`inline-flex items-center gap-1 ${statusConfig.badgeClass} text-[10px] py-1`}>
            <StatusIcon size={12} />
            <span>{statusConfig.label}</span>
          </div>
        </div>

        {status === 0 && (
          <button
            onClick={() => cancelInvoice(id)}
            disabled={isPending}
            className="text-xs text-red-600 dark:text-red-400 hover:text-white hover:bg-red-500 font-black uppercase px-2.5 py-1.5 border-2 border-black dark:border-white shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] dark:shadow-[2px_2px_0px_0px_rgba(255,255,255,1)] active:translate-x-[1px] active:translate-y-[1px] active:shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] dark:active:shadow-[1px_1px_0px_0px_rgba(255,255,255,1)] transition-all disabled:opacity-40"
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
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
      {/* Stat 1 */}
      <div className="card-brutal-blue p-5 flex items-center justify-between text-black">
        <div className="space-y-1">
          <span className="block text-xxs text-gray-500 uppercase tracking-wider font-mono font-bold">Total Created</span>
          <span className="block text-3xl font-black text-black tabular-nums">{total}</span>
        </div>
        <div className="w-10 h-10 border-[3px] border-black bg-blue-400 flex items-center justify-center text-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
          <FileText size={18} />
        </div>
      </div>

      {/* Stat 2 */}
      <div className="card-brutal-yellow p-5 flex items-center justify-between text-black">
        <div className="space-y-1">
          <span className="block text-xxs text-gray-500 uppercase tracking-wider font-mono font-bold">Pending Payment</span>
          <span className="block text-3xl font-black text-yellow-600 tabular-nums">{pending}</span>
        </div>
        <div className="w-10 h-10 border-[3px] border-black bg-yellow-400 flex items-center justify-center text-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
          <Clock size={18} />
        </div>
      </div>

      {/* Stat 3 */}
      <div className="card-brutal-green p-5 flex items-center justify-between text-black">
        <div className="space-y-1">
          <span className="block text-xxs text-gray-500 uppercase tracking-wider font-mono font-bold">Settled Invoices</span>
          <span className="block text-3xl font-black text-emerald-600 tabular-nums">{paid}</span>
        </div>
        <div className="w-10 h-10 border-[3px] border-black bg-emerald-400 flex items-center justify-center text-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
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
      <div className="border-4 border-black dark:border-white p-8 bg-white dark:bg-[#121620] shadow-[6px_6px_0px_0px_#f472b6] text-center max-w-md mx-auto space-y-5 py-12 mt-12 text-black dark:text-white">
        <div className="w-14 h-14 border-[3px] border-black dark:border-white bg-pink-400 flex items-center justify-center text-black mx-auto shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] dark:shadow-[2px_2px_0px_0px_rgba(255,255,255,1)]">
          <Lock size={26} />
        </div>
        <div className="space-y-2">
          <h2 className="text-lg font-black uppercase text-black dark:text-white tracking-wide">Dashboard Locked</h2>
          <p className="text-xs text-gray-700 dark:text-gray-300 leading-relaxed font-semibold">
            To view or create B2B invoices with Fully Homomorphic Encryption, you must connect an Ethereum wallet to Sepolia.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 text-black dark:text-white">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-xl md:text-2xl font-black uppercase tracking-wider">Sent Ledger</h1>
          <p className="text-xs text-gray-650 dark:text-gray-400 font-bold uppercase tracking-wide">
            Create and track confidential invoices. Amounts remain hidden on-chain.
          </p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="w-full sm:w-auto py-2.5 px-6 btn-brutal-yellow text-xs flex items-center justify-center gap-2"
        >
          <Plus size={16} />
          <span>New Invoice</span>
        </button>
      </div>

      {/* Stats tiles */}
      <StatsBanner statusMap={statusMap} />

      {/* Create Modal Form */}
      {showForm && <CreateInvoiceForm onClose={() => setShowForm(false)} />}

      {/* Invoice list */}
      <div className="space-y-3">
        <h3 className="text-xs font-black text-gray-500 uppercase tracking-widest font-mono pl-1">Invoices</h3>
        
        {isLoading ? (
          <div className="space-y-3">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-16 bg-white dark:bg-[#121620] border-[3px] border-black dark:border-white animate-pulse shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] dark:shadow-[4px_4px_0px_0px_rgba(255,255,255,1)]" />
            ))}
          </div>
        ) : invoiceIds && invoiceIds.length > 0 ? (
          <div className="space-y-3">
            {[...invoiceIds].reverse().map((id) => (
              <SentInvoiceRow
                key={id.toString()}
                invoiceId={id}
                onStatusLoaded={handleStatusLoaded}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-16 border-[3px] border-black dark:border-white bg-white dark:bg-[#121620] shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] dark:shadow-[6px_6px_0px_0px_rgba(255,255,255,1)] space-y-5 max-w-xl mx-auto text-black dark:text-white">
            <div className="w-12 h-12 border-[3px] border-black dark:border-white bg-[#f4f2ec] dark:bg-[#151821] flex items-center justify-center mx-auto text-gray-450 dark:text-gray-400 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] dark:shadow-[2px_2px_0px_0px_rgba(255,255,255,1)]">
              <AlertCircle size={22} />
            </div>
            <div className="space-y-1">
              <p className="text-sm font-black uppercase text-black dark:text-white tracking-wide">No Sent Invoices Found</p>
              <p className="text-xs text-gray-650 dark:text-gray-400 max-w-xs mx-auto leading-relaxed font-semibold">
                You haven't created any confidential invoices yet from this wallet.
              </p>
            </div>
            <button
              onClick={() => setShowForm(true)}
              className="py-2.5 px-4 btn-brutal-cyan text-xs inline-flex items-center gap-1.5"
            >
              <Plus size={14} />
              <span>Create invoice</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
