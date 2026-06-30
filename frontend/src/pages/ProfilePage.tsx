import { useState } from "react";
import { useAccount, useReadContract, useDisconnect } from "wagmi";
import { User, Copy, ExternalLink, LogOut, FileText, ArrowUpRight, ArrowDownLeft, Lock, Unlock, Sparkles, Eye, ShieldAlert } from "lucide-react";
import { useSentInvoiceIds, useReceivedInvoiceIds, useInvoiceMeta, useDecryptInvoiceAmount } from "@/hooks/useInvoice";
import { CUSDT_ADDRESS, CUSDT_ABI, INVOICE_VAULT_ADDRESS } from "@/lib/contracts";

export default function ProfilePage() {
  const { address, isConnected } = useAccount();
  const { disconnect } = useDisconnect();
  const [activeTab, setActiveTab] = useState<"sent" | "received">("received");

  // Read plaintext token info (since MockERC20 exposes plaintext balanceOf)
  const { data: balance } = useReadContract({
    address: CUSDT_ADDRESS,
    abi: CUSDT_ABI,
    functionName: "balanceOf",
    args: address ? [address] : undefined,
    query: { enabled: !!address },
  });

  const { data: symbol = "cUSDT" } = useReadContract({
    address: CUSDT_ADDRESS,
    abi: CUSDT_ABI,
    functionName: "symbol",
  });

  const [isBalanceRevealed, setIsBalanceRevealed] = useState(false);
  const [copied, setCopied] = useState(false);

  const { data: sentIds = [] } = useSentInvoiceIds();
  const { data: receivedIds = [] } = useReceivedInvoiceIds();

  function copyAddress() {
    if (address) {
      navigator.clipboard.writeText(address);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }

  if (!isConnected || !address) {
    return (
      <div className="w-full max-w-md mx-auto mt-16 p-8 bg-white dark:bg-[#121620] border-[3px] border-black dark:border-white shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] dark:shadow-[8px_8px_0px_0px_rgba(255,255,255,1)] space-y-6">
        <div className="w-16 h-16 border-[3px] border-black dark:border-white bg-yellow-400 mx-auto flex items-center justify-center text-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
          <ShieldAlert size={32} />
        </div>
        <div className="text-center space-y-2">
          <h2 className="text-2xl font-black uppercase tracking-tight text-black dark:text-white">Profile Locked</h2>
          <p className="text-xs text-gray-600 dark:text-gray-400 font-mono">
            Connect your wallet to view your profile, confidential token balance, and full transaction history.
          </p>
        </div>
      </div>
    );
  }

  const formattedBalance = balance
    ? (Number(balance) / 1e18).toFixed(2)
    : "0.00";

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-3 duration-300">
      {/* ─── Profile Header Card ─── */}
      <div className="bg-white dark:bg-[#121620] border-[3px] border-black dark:border-white p-6 md:p-8 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] dark:shadow-[8px_8px_0px_0px_rgba(255,255,255,1)] flex flex-col md:flex-row items-center md:items-stretch gap-6 md:gap-8">

        {/* Avatar block */}
        <div className="w-24 h-24 md:w-32 md:h-32 border-[3px] border-black dark:border-white bg-emerald-400 text-black flex items-center justify-center flex-shrink-0 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] dark:shadow-[4px_4px_0px_0px_rgba(255,255,255,1)]">
          <User size={64} className="stroke-[2.5]" />
        </div>

        {/* User Details */}
        <div className="flex-1 flex flex-col justify-between space-y-4 md:space-y-0 text-center md:text-left">
          <div className="space-y-2">
            <h2 className="text-2xl md:text-3xl font-black uppercase tracking-wider text-black dark:text-white">
              My Profile
            </h2>
            <div className="flex flex-wrap items-center justify-center md:justify-start gap-2">
              <span className="font-mono text-sm px-2.5 py-1 bg-[#f4f2ec] dark:bg-[#151821] border-2 border-black dark:border-white font-bold select-all text-zinc-800 dark:text-gray-300">
                {address.slice(0, 10)}…{address.slice(-8)}
              </span>
              <button
                onClick={copyAddress}
                className="p-1 bg-white dark:bg-[#121620] border-2 border-black dark:border-white hover:bg-gray-100 dark:hover:bg-zinc-800 transition-colors shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] dark:shadow-[2px_2px_0px_0px_rgba(255,255,255,1)] active:translate-x-[1px] active:translate-y-[1px] active:shadow-[1px_1px_0px_0px_rgba(0,0,0,1)]"
                title="Copy address"
              >
                <Copy size={14} className="text-black dark:text-white" />
              </button>
              <a
                href={`https://sepolia.etherscan.io/address/${address}`}
                target="_blank"
                rel="noreferrer"
                className="p-1 bg-white dark:bg-[#121620] border-2 border-black dark:border-white hover:bg-gray-100 dark:hover:bg-zinc-800 transition-colors shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] dark:shadow-[2px_2px_0px_0px_rgba(255,255,255,1)] active:translate-x-[1px] active:translate-y-[1px] active:shadow-[1px_1px_0px_0px_rgba(0,0,0,1)]"
                title="View on Etherscan"
              >
                <ExternalLink size={14} className="text-black dark:text-white" />
              </a>
            </div>
            {copied && (
              <p className="text-[10px] text-emerald-600 dark:text-emerald-400 font-mono font-bold uppercase animate-fade-in">
                ✓ Address Copied!
              </p>
            )}
          </div>

          <button
            onClick={() => disconnect()}
            className="self-center md:self-start py-2 px-4 btn-brutal-gray text-xs flex items-center gap-1.5 font-bold uppercase border-2 border-black"
          >
            <LogOut size={13} />
            Disconnect Wallet
          </button>
        </div>

        {/* ─── Balance Card ─── */}
        <div className="w-full md:w-80 p-5 bg-[#f4f2ec] dark:bg-[#151821] border-[3px] border-black dark:border-white flex flex-col justify-between shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] dark:shadow-[4px_4px_0px_0px_rgba(255,255,255,1)]">
          <div className="space-y-1">
            <span className="text-[10px] text-gray-500 dark:text-gray-400 uppercase tracking-wider font-mono font-bold block">
              Confidential Balance
            </span>
            <div className="flex flex-wrap items-baseline gap-2 break-all">
              {isBalanceRevealed ? (
                <span className="text-3xl font-black text-black dark:text-white font-mono tabular-nums animate-fade-in">
                  ${formattedBalance}
                </span>
              ) : (
                <div className="flex items-center gap-1.5 px-3 py-1.5 bg-white dark:bg-[#121620] border-2 border-black dark:border-white text-pink-600 dark:text-pink-400 text-xs font-mono font-bold uppercase select-none shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                  <Lock size={12} />
                  <span>Shielded</span>
                </div>
              )}
              <span className="text-xs font-bold text-gray-600 dark:text-gray-400">{symbol}</span>
            </div>
          </div>

          <button
            onClick={() => setIsBalanceRevealed(!isBalanceRevealed)}
            className="w-full mt-4 py-2 btn-brutal-blue text-xs flex items-center justify-center gap-1.5 font-bold uppercase border-2 border-black"
          >
            {isBalanceRevealed ? <Lock size={13} /> : <Eye size={13} />}
            <span>{isBalanceRevealed ? "Shield Balance" : "Reveal Balance"}</span>
          </button>
        </div>
      </div>

      {/* ─── History Navigation Tabs ─── */}
      <div className="space-y-4">
        <div className="flex items-center gap-2 border-b-4 border-black dark:border-white pb-0.5">
          <button
            onClick={() => setActiveTab("received")}
            className={`px-4 py-2.5 font-black text-xs md:text-sm uppercase tracking-wide border-t-4 border-x-4 border-black dark:border-white transition-all select-none ${activeTab === "received"
                ? "bg-white dark:bg-[#121620] text-black dark:text-white translate-y-[4px]"
                : "bg-gray-200 dark:bg-zinc-800 text-gray-600 dark:text-gray-400 hover:text-black dark:hover:text-white hover:bg-gray-100 dark:hover:bg-zinc-700"
              }`}
          >
            Received Ledger ({receivedIds.length})
          </button>
          <button
            onClick={() => setActiveTab("sent")}
            className={`px-4 py-2.5 font-black text-xs md:text-sm uppercase tracking-wide border-t-4 border-x-4 border-black dark:border-white transition-all select-none ${activeTab === "sent"
                ? "bg-white dark:bg-[#121620] text-black dark:text-white translate-y-[4px]"
                : "bg-gray-200 dark:bg-zinc-800 text-gray-600 dark:text-gray-400 hover:text-black dark:hover:text-white hover:bg-gray-100 dark:hover:bg-zinc-700"
              }`}
          >
            Sent Ledger ({sentIds.length})
          </button>
        </div>

        {/* ─── Ledger Content ─── */}
        <div className="space-y-4">
          {activeTab === "received" ? (
            receivedIds.length === 0 ? (
              <EmptyState message="No incoming invoices found. Invoices sent to your address will appear here." />
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {[...receivedIds].reverse().map((id) => (
                  <ProfileInvoiceCard key={id.toString()} invoiceId={id} type="received" />
                ))}
              </div>
            )
          ) : (
            sentIds.length === 0 ? (
              <EmptyState message="No sent invoices found. Invoices you create for client addresses will appear here." />
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {[...sentIds].reverse().map((id) => (
                  <ProfileInvoiceCard key={id.toString()} invoiceId={id} type="sent" />
                ))}
              </div>
            )
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Profile Invoice Row/Card ──────────────────────────────────────────────────

function ProfileInvoiceCard({ invoiceId, type }: { invoiceId: bigint; type: "sent" | "received" }) {
  const { data: meta } = useInvoiceMeta(invoiceId);

  // Since we need permissioned getEncryptedAmount, hook it up correctly
  const { address } = useAccount();
  const { data: encHandleActual } = useReadContract({
    address: INVOICE_VAULT_ADDRESS,
    abi: [
      {
        name: "getEncryptedAmount",
        type: "function",
        stateMutability: "view",
        inputs: [{ name: "invoiceId", type: "uint256" }],
        outputs: [{ name: "", type: "bytes32" }],
      },
    ],
    functionName: "getEncryptedAmount",
    args: [invoiceId],
    account: address,
  });

  const { decryptAmount } = useDecryptInvoiceAmount();
  const [decryptedAmount, setDecryptedAmount] = useState<bigint | null>(null);
  const [isDecrypting, setIsDecrypting] = useState(false);

  if (!meta) return <div className="h-32 bg-white dark:bg-[#121620] border-[3px] border-black dark:border-white shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] dark:shadow-[4px_4px_0px_0px_rgba(255,255,255,1)] animate-pulse" />;

  const [id, sender, recipient, metadataURI, createdAt, status] = meta;

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
    if (!encHandleActual) return;
    setIsDecrypting(true);
    try {
      const amount = await decryptAmount(encHandleActual as `0x${string}`);
      setDecryptedAmount(amount);
    } catch (err) {
      console.error("Decrypt failed:", err);
    } finally {
      setIsDecrypting(false);
    }
  }

  const statusConfig = {
    0: { label: "Pending", badgeClass: "badge-brutal-yellow" },
    1: { label: "Paid", badgeClass: "badge-brutal-green" },
    2: { label: "Cancelled", badgeClass: "badge-brutal-gray" },
  }[Number(status) as 0 | 1 | 2] || { label: "Unknown", badgeClass: "badge-brutal-gray" };

  return (
    <div className="bg-white dark:bg-[#121620] border-[3px] border-black dark:border-white p-5 space-y-4 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] dark:shadow-[4px_4px_0px_0px_rgba(255,255,255,1)]">
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-3">
          <div className={`w-9 h-9 border-2 border-black dark:border-white flex items-center justify-center flex-shrink-0 mt-0.5 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] dark:shadow-[2px_2px_0px_0px_rgba(255,255,255,1)] ${type === "sent" ? "bg-red-400" : "bg-blue-400"
            }`}>
            {type === "sent" ? <ArrowUpRight size={16} /> : <ArrowDownLeft size={16} />}
          </div>
          <div>
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-xxs text-red-600 dark:text-yellow-400 font-mono font-bold">#{id.toString()}</span>
              <h4 className="font-black text-xs text-black dark:text-white uppercase tracking-wide truncate max-w-[150px]">{description}</h4>
              <span className={`text-[9px] font-mono font-bold uppercase px-1.5 py-0.5 border border-black ${statusConfig.badgeClass}`}>
                {statusConfig.label}
              </span>
            </div>
            <p className="text-[10px] text-gray-500 font-mono mt-1">
              {type === "sent" ? "To: " : "From: "}
              <span className="font-bold text-zinc-800 dark:text-zinc-300">
                {type === "sent" ? `${recipient.slice(0, 6)}…${recipient.slice(-4)}` : `${sender.slice(0, 6)}…${sender.slice(-4)}`}
              </span>
              {" · "}
              {new Date(Number(createdAt) * 1000).toLocaleDateString()}
            </p>
          </div>
        </div>

        {/* Decrypted Amount */}
        <div className="text-right">
          {decryptedAmount !== null ? (
            <div>
              <p className="text-sm font-black text-black dark:text-white font-mono select-all">
                ${(Number(decryptedAmount) / 1_000_000).toFixed(2)}
              </p>
              <span className="text-[8px] text-emerald-600 dark:text-emerald-400 font-mono font-bold uppercase tracking-wider block mt-0.5">
                ✓ Decrypted
              </span>
            </div>
          ) : (
            <div className="flex items-center justify-end gap-1 px-1.5 py-1 bg-[#f4f2ec] dark:bg-[#151821] border border-black dark:border-white text-pink-600 dark:text-pink-400 text-[9px] font-mono font-bold uppercase select-none shadow-[1px_1px_0px_0px_rgba(0,0,0,1)]">
              <Lock size={9} />
              <span>Shielded</span>
            </div>
          )}
        </div>
      </div>

      {decryptedAmount === null && (
        <button
          onClick={handleDecrypt}
          disabled={isDecrypting}
          className="w-full py-1.5 btn-brutal-gray border-2 border-black text-[10px] uppercase font-bold flex items-center justify-center gap-1"
        >
          <Unlock size={11} />
          <span>{isDecrypting ? "Decrypting..." : "Reveal Amount"}</span>
        </button>
      )}
    </div>
  );
}

// ─── Empty state helper ───

function EmptyState({ message }: { message: string }) {
  return (
    <div className="w-full bg-[#f4f2ec] dark:bg-[#121620] border-[3px] border-black dark:border-white p-8 text-center shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
      <FileText className="mx-auto text-gray-500 mb-2" size={32} />
      <p className="text-xs text-gray-600 dark:text-gray-400 font-mono max-w-md mx-auto">
        {message}
      </p>
    </div>
  );
}
