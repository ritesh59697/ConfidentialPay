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
    <div className="flex items-start gap-3 border-[2px] border-black bg-zinc-955 p-3.5 shadow-[2px_2px_0px_0px_#4ade80] text-emerald-400 text-xs">
      <ShieldCheck size={16} className="text-emerald-400 flex-shrink-0" />
      <span className="leading-normal font-medium">
        <strong>Verified On-Chain:</strong> Invoice #{invoiceId.toString()} has been settled in full. 
        Calculations occurred homomorphically, keeping amounts confidential.
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

  if (!meta) return <div className="h-40 bg-zinc-900 border-[3px] border-black animate-pulse shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]" />;

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
    0: { label: "Pending",   icon: Clock,       badgeClass: "badge-brutal-yellow" },
    1: { label: "Paid",      icon: CheckCircle, badgeClass: "badge-brutal-green"  },
    2: { label: "Cancelled", icon: XCircle,     badgeClass: "badge-brutal-gray"   },
  }[status as 0 | 1 | 2] || { label: "Unknown", icon: Clock, badgeClass: "badge-brutal-gray" };

  const StatusIcon = statusConfig.icon;

  return (
    <div className={`bg-zinc-900 border-[3px] border-black p-5 space-y-4 transition-all shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] ${
      isPaid ? "shadow-[4px_4px_0px_0px_#4ade80]" : isCancelled ? "opacity-60" : ""
    }`}>
      {/* Header Info */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 border-[3px] border-black bg-zinc-950 flex items-center justify-center text-indigo-400 flex-shrink-0 mt-0.5 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
            <ArrowDownLeft size={18} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-yellow-400 font-mono font-bold">#{id.toString()}</span>
              <h4 className="font-black text-sm text-white uppercase tracking-wide truncate">{description}</h4>
            </div>
            <p className="text-[10px] text-gray-400 font-mono mt-0.5">
              From: <span className="text-gray-300 font-bold">{sender.slice(0, 6)}…{sender.slice(-4)}</span>
              {" · "}{new Date(Number(createdAt) * 1000).toLocaleDateString()}
            </p>
          </div>
        </div>

        {/* Amount Area */}
        <div className="text-right">
          {decryptedAmount !== null ? (
            <div className="space-y-0.5">
              <p className="text-lg font-black text-white font-mono tabular-nums select-all">
                ${(Number(decryptedAmount) / 1_000_000).toFixed(2)}
              </p>
              <span className="inline-flex items-center gap-1 text-[10px] text-emerald-400 font-mono font-bold uppercase">
                <Sparkles size={9} /> Decrypted
              </span>
            </div>
          ) : (
            <div className="flex items-center justify-end gap-1.5 px-2.5 py-1.5 bg-zinc-955 border-2 border-black text-pink-400 text-xxs font-mono font-bold uppercase select-none shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
              <Lock size={11} />
              <span>Shielded</span>
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
                className="flex-1 py-2.5 btn-brutal-gray text-xs flex items-center justify-center gap-1.5"
              >
                <Unlock size={14} />
                <span>{isDecrypting ? "Permit signature..." : "Reveal Amount"}</span>
              </button>
            ) : (
              <button
                onClick={handlePay}
                disabled={isPaying}
                className="flex-1 py-2.5 btn-brutal-yellow text-xs flex items-center justify-center gap-1.5"
              >
                <CheckCircle size={14} />
                <span>{isPaying ? "Paying..." : `Pay $${(Number(decryptedAmount) / 1_000_000).toFixed(2)} USDT`}</span>
              </button>
            )}
          </div>
        )}

        {/* Transaction confirmation link */}
        {txHash && (
          <div className="bg-zinc-950 border-2 border-black p-3 flex items-center justify-between shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
            <span className="text-[10px] text-green-400 font-bold uppercase flex items-center gap-1.5">
              <CheckCircle size={12} /> Invoice Paid
            </span>
            <a
              href={`https://sepolia.etherscan.io/tx/${txHash}`}
              target="_blank"
              rel="noreferrer"
              className="text-xxs text-blue-400 hover:text-blue-300 font-mono block truncate max-w-[200px] underline decoration-1 decoration-blue-500"
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
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
      {/* Stat 1 */}
      <div className="card-brutal-blue p-5 flex items-center justify-between">
        <div className="space-y-1">
          <span className="block text-xxs text-gray-300 uppercase tracking-wider font-mono font-bold">Total Received</span>
          <span className="block text-3xl font-black text-white tabular-nums">{total}</span>
        </div>
        <div className="w-10 h-10 border-[3px] border-black bg-blue-400 flex items-center justify-center text-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
          <FileText size={18} />
        </div>
      </div>

      {/* Stat 2 */}
      <div className="card-brutal-yellow p-5 flex items-center justify-between">
        <div className="space-y-1">
          <span className="block text-xxs text-gray-300 uppercase tracking-wider font-mono font-bold">Awaiting Action</span>
          <span className="block text-3xl font-black text-yellow-400 tabular-nums">{pending}</span>
        </div>
        <div className="w-10 h-10 border-[3px] border-black bg-yellow-400 flex items-center justify-center text-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
          <Clock size={18} />
        </div>
      </div>

      {/* Stat 3 */}
      <div className="card-brutal-green p-5 flex items-center justify-between">
        <div className="space-y-1">
          <span className="block text-xxs text-gray-300 uppercase tracking-wider font-mono font-bold">Total Settled</span>
          <span className="block text-3xl font-black text-emerald-400 tabular-nums">{paid}</span>
        </div>
        <div className="w-10 h-10 border-[3px] border-black bg-emerald-400 flex items-center justify-center text-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
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
      <div className="border-4 border-black p-8 bg-zinc-900 shadow-[6px_6px_0px_0px_#f472b6] text-center max-w-md mx-auto space-y-5 py-12 mt-12">
        <div className="w-14 h-14 border-[3px] border-black bg-pink-400 flex items-center justify-center text-black mx-auto shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
          <Lock size={26} />
        </div>
        <div className="space-y-2">
          <h2 className="text-lg font-black uppercase text-white tracking-wide">Dashboard Locked</h2>
          <p className="text-xs text-gray-300 leading-relaxed font-medium">
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
        <h1 className="text-xl md:text-2xl font-black uppercase tracking-wider">Received Invoices</h1>
        <p className="text-xs text-gray-400 font-medium uppercase">
          Review, decrypt, and settle incoming invoices with confidential cUSDT.
        </p>
      </div>

      {/* Stats Summary Banner */}
      <StatsBanner statusMap={statusMap} />

      {/* EIP-712 Callout Info */}
      <div className="flex items-start gap-4 border-[3px] border-black bg-zinc-900 p-5 shadow-[4px_4px_0px_0px_#60a5fa]">
        <ShieldCheck size={18} className="text-blue-400 mt-0.5 flex-shrink-0" />
        <span className="text-xs text-gray-300 leading-relaxed font-medium">
          <strong>Gated Decryption:</strong> To reveal private invoice amounts, you must sign an EIP-712 permit. Your wallet proves it holds ownership, allowing the relayer to securely return plaintext.
        </span>
      </div>

      {/* Invoices List */}
      <div className="space-y-3">
        <h3 className="text-xs font-black text-gray-500 uppercase tracking-widest font-mono pl-1">Incoming</h3>
        
        {isLoading ? (
          <div className="space-y-3">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-36 bg-zinc-900 border-[3px] border-black animate-pulse shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]" />
            ))}
          </div>
        ) : invoiceIds && invoiceIds.length > 0 ? (
          <div className="space-y-4">
            {[...invoiceIds].reverse().map((id) => (
              <ReceivedInvoiceCard
                key={id.toString()}
                invoiceId={id}
                onStatusLoaded={handleStatusLoaded}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-16 border-[3px] border-black bg-zinc-900 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] space-y-4 max-w-xl mx-auto">
            <div className="w-12 h-12 border-[3px] border-black bg-zinc-950 flex items-center justify-center mx-auto text-gray-400 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
              <AlertCircle size={22} />
            </div>
            <div className="space-y-1">
              <p className="text-sm font-black uppercase text-white tracking-wide">No Invoices Received</p>
              <p className="text-xs text-gray-400 max-w-xs mx-auto leading-relaxed font-medium">
                No active confidential invoices have been sent to this wallet address yet.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
