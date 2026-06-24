import { useState } from "react";
import { useAccount } from "wagmi";
import { Lock, Send, Plus, X, CheckCircle, Clock, XCircle } from "lucide-react";
import { useCreateInvoice, useCancelInvoice, useSentInvoiceIds, useInvoiceMeta } from "@/hooks/useInvoice";
import { INVOICE_STATUS, type InvoiceStatusCode } from "@/lib/contracts";

// ─── Create Invoice Form ──────────────────────────────────────────────────────

function CreateInvoiceForm({ onClose }: { onClose: () => void }) {
  const [recipient, setRecipient]     = useState("");
  const [amount, setAmount]           = useState("");
  const [description, setDescription] = useState("");
  const [txHash, setTxHash]           = useState<string | null>(null);
  const { createInvoice, isPending }  = useCreateInvoice();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    // In a real app, upload invoice metadata to IPFS and pass the CID
    // For MVP, we store description inline as a data URI
    const metadataURI = `data:application/json,${encodeURIComponent(
      JSON.stringify({ description, createdAt: new Date().toISOString() })
    )}`;

    const amountBigInt = BigInt(Math.round(parseFloat(amount) * 1_000_000)); // 6 decimals

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
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 text-center">
        <CheckCircle className="mx-auto mb-3 text-green-400" size={40} />
        <h3 className="font-semibold text-lg mb-1">Invoice created</h3>
        <p className="text-sm text-gray-400 mb-4">
          The amount is encrypted on-chain. Only you and the recipient can decrypt it.
        </p>
        <a
          href={`https://sepolia.etherscan.io/tx/${txHash}`}
          target="_blank"
          rel="noreferrer"
          className="text-xs text-blue-400 hover:text-blue-300 font-mono"
        >
          {txHash.slice(0, 20)}…{txHash.slice(-8)}
        </a>
        <button
          onClick={onClose}
          className="mt-4 block w-full text-sm text-gray-400 hover:text-white transition-colors"
        >
          Done
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="bg-gray-900 border border-gray-800 rounded-xl p-6 space-y-4">
      <div className="flex items-center justify-between mb-2">
        <h3 className="font-semibold">New confidential invoice</h3>
        <button type="button" onClick={onClose} className="text-gray-500 hover:text-white">
          <X size={18} />
        </button>
      </div>

      <div>
        <label className="block text-xs text-gray-400 mb-1.5">Recipient wallet address</label>
        <input
          type="text"
          placeholder="0x..."
          value={recipient}
          onChange={(e) => setRecipient(e.target.value)}
          required
          className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2.5 text-sm font-mono placeholder-gray-600 focus:outline-none focus:border-blue-500"
        />
      </div>

      <div>
        <label className="block text-xs text-gray-400 mb-1.5">
          Amount (USDT)
          <span className="ml-2 text-gray-600">— encrypted with FHE before submission</span>
        </label>
        <div className="relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm">$</span>
          <input
            type="number"
            min="0.01"
            step="0.01"
            placeholder="0.00"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            required
            className="w-full bg-gray-800 border border-gray-700 rounded-lg pl-7 pr-3 py-2.5 text-sm placeholder-gray-600 focus:outline-none focus:border-blue-500"
          />
        </div>
      </div>

      <div>
        <label className="block text-xs text-gray-400 mb-1.5">Description</label>
        <textarea
          placeholder="What's this invoice for?"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={3}
          className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2.5 text-sm placeholder-gray-600 resize-none focus:outline-none focus:border-blue-500"
        />
      </div>

      {/* FHE explanation callout */}
      <div className="flex items-start gap-2.5 bg-blue-950/40 border border-blue-900/50 rounded-lg px-3 py-2.5 text-xs text-blue-300">
        <Lock size={13} className="mt-0.5 flex-shrink-0 text-blue-400" />
        <span>
          The amount is encrypted on your device using FHE before it ever leaves your browser.
          Nobody — not even Zama or Ethereum nodes — can see the value on-chain.
        </span>
      </div>

      <button
        type="submit"
        disabled={isPending || !recipient || !amount}
        className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-40 disabled:cursor-not-allowed text-white font-medium text-sm py-2.5 rounded-lg transition-colors"
      >
        <Send size={15} />
        {isPending ? "Encrypting & sending…" : "Send invoice"}
      </button>
    </form>
  );
}

// ─── Invoice Row ──────────────────────────────────────────────────────────────

function SentInvoiceRow({ invoiceId }: { invoiceId: bigint }) {
  const { data } = useInvoiceMeta(invoiceId);
  const { cancelInvoice, isPending } = useCancelInvoice();

  if (!data) return (
    <div className="h-14 bg-gray-900 rounded-lg animate-pulse" />
  );

  const [id, , recipient, , createdAt, status] = data;

  const statusConfig = {
    0: { label: "Pending",   icon: Clock,       color: "text-yellow-400" },
    1: { label: "Paid",      icon: CheckCircle, color: "text-green-400"  },
    2: { label: "Cancelled", icon: XCircle,     color: "text-gray-500"   },
  }[status as 0 | 1 | 2];

  const StatusIcon = statusConfig.icon;

  return (
    <div className="bg-gray-900 border border-gray-800 rounded-xl px-4 py-3.5 flex items-center justify-between gap-3">
      <div className="flex items-center gap-3">
        <span className="text-xs text-gray-500 font-mono w-6">#{id.toString()}</span>
        <div>
          <p className="text-sm font-mono text-gray-300 leading-none">
            {recipient.slice(0, 6)}…{recipient.slice(-4)}
          </p>
          <p className="text-xs text-gray-600 mt-0.5">
            {new Date(Number(createdAt) * 1000).toLocaleDateString()}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-3">
        {/* Amount is encrypted — shown as shield icon */}
        <span className="flex items-center gap-1 text-xs text-gray-500">
          <Lock size={11} />
          <span className="font-mono">****</span>
        </span>

        <span className={`flex items-center gap-1.5 text-xs font-medium ${statusConfig.color}`}>
          <StatusIcon size={13} />
          {statusConfig.label}
        </span>

        {status === 0 && (
          <button
            onClick={() => cancelInvoice(id)}
            disabled={isPending}
            className="text-xs text-gray-500 hover:text-red-400 transition-colors disabled:opacity-40"
          >
            Cancel
          </button>
        )}
      </div>
    </div>
  );
}

// ─── Sender Dashboard ─────────────────────────────────────────────────────────

export default function SenderDashboard() {
  const { isConnected } = useAccount();
  const [showForm, setShowForm] = useState(false);
  const { data: invoiceIds, isLoading } = useSentInvoiceIds();

  if (!isConnected) {
    return (
      <div className="text-center py-20 text-gray-500">
        <Lock size={40} className="mx-auto mb-4 opacity-30" />
        <p className="text-sm">Connect your wallet to send confidential invoices</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold">Sent invoices</h1>
          <p className="text-sm text-gray-500 mt-0.5">Amounts are encrypted — only visible to you and the recipient</p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
        >
          <Plus size={15} />
          New invoice
        </button>
      </div>

      {/* Create form */}
      {showForm && (
        <CreateInvoiceForm onClose={() => setShowForm(false)} />
      )}

      {/* Invoice list */}
      {isLoading ? (
        <div className="space-y-2">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-14 bg-gray-900 rounded-xl animate-pulse" />
          ))}
        </div>
      ) : invoiceIds && invoiceIds.length > 0 ? (
        <div className="space-y-2">
          {[...invoiceIds].reverse().map((id) => (
            <SentInvoiceRow key={id.toString()} invoiceId={id} />
          ))}
        </div>
      ) : (
        <div className="text-center py-16 border border-dashed border-gray-800 rounded-xl">
          <p className="text-sm text-gray-500">No invoices yet</p>
          <button
            onClick={() => setShowForm(true)}
            className="mt-3 text-sm text-blue-400 hover:text-blue-300 transition-colors"
          >
            Create your first invoice
          </button>
        </div>
      )}
    </div>
  );
}
