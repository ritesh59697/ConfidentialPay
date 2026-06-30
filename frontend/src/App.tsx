import { useState, useEffect, useRef } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { WagmiProvider, useReadContracts }  from "wagmi";
import { wagmiConfig } from "@/lib/wagmi";
import { RainbowKitProvider, lightTheme } from "@rainbow-me/rainbowkit";
import { BrowserRouter, Routes, Route, NavLink, Link } from "react-router-dom";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { Sun, Moon, Menu, X, Bell, ArrowUpRight, CheckCircle } from "lucide-react";
import LandingPage       from "@/pages/LandingPage";
import SenderDashboard   from "@/pages/SenderDashboard";
import ReceiverDashboard from "@/pages/ReceiverDashboard";
import ProfilePage       from "@/pages/ProfilePage";
import { useReceivedInvoiceIds } from "@/hooks/useInvoice";
import { INVOICE_VAULT_ADDRESS, INVOICE_VAULT_ABI } from "@/lib/contracts";
import "@rainbow-me/rainbowkit/styles.css";

const queryClient = new QueryClient();

const CustomAvatar = () => {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (ref.current) {
      const parent = ref.current.parentElement;
      if (parent) {
        parent.style.display = "none";
      }
    }
  }, []);

  return <div ref={ref} style={{ display: "none" }} />;
};

export default function App() {
  useEffect(() => {
    document.body.classList.remove("dark");
  }, []);

  const activeRainbowTheme = lightTheme({
    accentColor: "#000000",
    accentColorForeground: "white",
    borderRadius: "none",
  });

  return (
    <WagmiProvider config={wagmiConfig}>
      <QueryClientProvider client={queryClient}>
        <RainbowKitProvider theme={activeRainbowTheme} avatar={CustomAvatar}>
          <BrowserRouter>
            <div className="min-h-screen flex flex-col bg-[#e4e2db] dark:bg-[#090a0f] text-black dark:text-white selection:bg-red-500 selection:text-white transition-colors duration-200">
              <Header />
              <main className="flex-grow max-w-5xl w-full mx-auto px-4 py-8 relative z-10">
                <Routes>
                  <Route path="/"         element={<LandingPage />} />
                  <Route path="/send"     element={<SenderDashboard />} />
                  <Route path="/receive"  element={<ReceiverDashboard />} />
                  <Route path="/profile"  element={<ProfilePage />} />
                </Routes>
              </main>
              <Footer />
            </div>
          </BrowserRouter>
        </RainbowKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
}

function Header() {
  const [isOpen, setIsOpen] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const { data: receivedIds = [] } = useReceivedInvoiceIds();

  // Batch read invoice status details using useReadContracts to determine count of pending received invoices
  const { data: results } = useReadContracts({
    contracts: receivedIds.map((id) => ({
      address: INVOICE_VAULT_ADDRESS,
      abi: INVOICE_VAULT_ABI,
      functionName: "getInvoiceMeta",
      args: [id],
    })),
    query: { enabled: receivedIds.length > 0 },
  });

  const pendingCount = (results as any)
    ? (results as any).filter((r: any) => r.status === "success" && r.result && Number(r.result[5]) === 0).length
    : 0;

  const pendingInvoices = (results as any)
    ? (results as any)
        .map((r: any, idx: number) => ({
          id: receivedIds[idx],
          meta: r.result,
          status: r.status,
        }))
        .filter((item: any) => item.status === "success" && item.meta && Number(item.meta[5]) === 0)
    : [];

  const navClass = ({ isActive }: { isActive: boolean }) =>
    `text-xs md:text-sm font-black uppercase px-3.5 py-1.5 border-[3px] border-black dark:border-[1px] dark:border-white/20 transition-all ${
      isActive
        ? "bg-yellow-400 text-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] dark:shadow-[1.5px_1.5px_0px_0px_rgba(255,255,255,0.15)] translate-x-[-1px] translate-y-[-1px]"
        : "bg-white dark:bg-[#121620] text-black dark:text-white hover:bg-gray-100 dark:hover:bg-zinc-800 hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] dark:hover:shadow-[1.5px_1.5px_0px_0px_rgba(255,255,255,0.12)] hover:translate-x-[-1px] hover:translate-y-[-1px]"
    }`;

  const mobileNavClass = ({ isActive }: { isActive: boolean }) =>
    `block text-sm font-black uppercase px-4 py-3 border-[3px] border-black dark:border-[1px] dark:border-white/20 transition-all text-center ${
      isActive
        ? "bg-yellow-400 text-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]"
        : "bg-white dark:bg-[#121620] text-black dark:text-white hover:bg-gray-100 dark:hover:bg-zinc-800 hover:shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]"
    }`;

  return (
    <header className="border-b-4 border-black dark:border-b dark:border-white/15 bg-[#e4e2db] dark:bg-[#090a0f] sticky top-0 z-50 transition-colors duration-200">
      <div className="max-w-5xl mx-auto px-4 h-16 flex items-center justify-between">
        <div className="flex items-center gap-4 md:gap-6">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2.5 group" onClick={() => setIsOpen(false)}>
            <div className="w-9 h-9 border-[3px] border-black dark:border-[1px] dark:border-white/20 bg-[#EAB308] flex items-center justify-center shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] dark:shadow-[1.5px_1.5px_0px_0px_rgba(255,255,255,0.15)] group-hover:translate-x-[-1px] group-hover:translate-y-[-1px] group-hover:shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] dark:group-hover:shadow-[2.5px_2.5px_0px_0px_rgba(255,255,255,0.2)] transition-all">
              <svg viewBox="0 0 100 100" className="w-6 h-6">
                <path
                  d="M50,15 L22,25 V52 C22,70 50,83 50,83 C50,83 78,70 78,52 V25 Z"
                  fill="#0F0F0F"
                />
                <path
                  d="M39,48 V41 C39,34.5 44,30.5 50,30.5 C56,30.5 61,34.5 61,41 V48"
                  fill="none"
                  stroke="#EAB308"
                  strokeWidth="5.5"
                  strokeLinecap="round"
                />
                <path
                  d="M33,48 H67 V68 C67,71.5 64,74.5 60,74.5 H40 C36,74.5 33,71.5 33,68 Z"
                  fill="#EAB308"
                />
                <circle cx="50" cy="58" r="3.5" fill="#0F0F0F" />
                <polygon points="48,58 46.5,68 53.5,68 52,58" fill="#0F0F0F" />
              </svg>
            </div>
            <span className="font-black text-[10px] sm:text-xs md:text-sm tracking-wide inline-block text-black dark:text-white uppercase group-hover:text-red-500 transition-colors">
              ConfidentialPay
            </span>
          </Link>
 
          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center gap-1.5">
            <NavLink to="/"        className={navClass} end>Home</NavLink>
            <NavLink to="/send"    className={navClass}>Send</NavLink>
            <NavLink to="/receive" className={navClass}>Receive</NavLink>
            <NavLink to="/profile" className={navClass}>Profile</NavLink>
          </nav>
        </div>

        <div className="flex items-center gap-3">
          {/* Notification Bell */}
          <div className="relative">
            <button
              onClick={() => {
                setShowNotifications(!showNotifications);
                setIsOpen(false);
              }}
              className="relative p-2 bg-white dark:bg-[#121620] border-[3px] border-black dark:border-white/20 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] dark:shadow-[1.5px_1.5px_0px_0px_rgba(255,255,255,0.15)] hover:translate-x-[-1px] hover:translate-y-[-1px] hover:shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] dark:hover:shadow-[2.5px_2.5px_0px_0px_rgba(255,255,255,0.2)] active:translate-x-[0px] active:translate-y-[0px] active:shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] transition-all flex items-center justify-center text-black dark:text-white"
              aria-label="Toggle notifications dropdown"
            >
              <Bell size={18} className={pendingCount > 0 ? "animate-bounce" : ""} />
              {pendingCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[9px] font-black w-4.5 h-4.5 rounded-full flex items-center justify-center border border-black dark:border-white animate-pulse">
                  {pendingCount}
                </span>
              )}
            </button>

            {showNotifications && (
              <>
                {/* Invisible backdrop to dismiss when clicking outside */}
                <div
                  className="fixed inset-0 z-40 bg-transparent cursor-default"
                  onClick={() => setShowNotifications(false)}
                />
                
                {/* Popover Dropdown Card */}
                <div className="absolute right-0 mt-3 w-80 bg-white dark:bg-[#121620] border-[3px] border-black dark:border-white shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] dark:shadow-[4px_4px_0px_0px_rgba(255,255,255,0.15)] z-50 p-4 space-y-3 animate-in fade-in slide-in-from-top-2 duration-150">
                  <div className="flex items-center justify-between border-b-2 border-black dark:border-white/10 pb-2">
                    <span className="font-mono text-xs font-black uppercase text-black dark:text-white">
                      Notifications ({pendingCount})
                    </span>
                    <button
                      onClick={() => setShowNotifications(false)}
                      className="hover:text-red-500 transition-colors"
                    >
                      <X size={14} />
                    </button>
                  </div>

                  {pendingCount === 0 ? (
                    <div className="py-5 text-center space-y-2 select-none">
                      <div className="text-gray-400 dark:text-gray-600 flex justify-center">
                        <CheckCircle size={32} className="stroke-[2.5]" />
                      </div>
                      <p className="text-xs font-bold uppercase text-gray-500 dark:text-gray-400 font-mono">
                        All caught up!
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-2.5 max-h-60 overflow-y-auto pr-1">
                      {pendingInvoices.map((inv: any) => {
                        const invId = inv.id.toString();
                        const sender = inv.meta[1];
                        const shortSender = `${sender.slice(0, 6)}...${sender.slice(-4)}`;
                        return (
                          <Link
                            key={invId}
                            to="/receive"
                            onClick={() => setShowNotifications(false)}
                            className="block p-2.5 border-2 border-black dark:border-white/10 bg-yellow-50 dark:bg-[#1a1e29] hover:bg-yellow-100 dark:hover:bg-[#222838] transition-colors shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[-1px] hover:translate-y-[-1px] hover:shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] active:translate-x-[0px] active:translate-y-[0px] active:shadow-[1px_1px_0px_0px_rgba(0,0,0,1)]"
                          >
                            <div className="flex items-start gap-2">
                              <div className="p-1 bg-yellow-400 text-black border border-black rounded-sm flex-shrink-0 mt-0.5">
                                <ArrowUpRight size={14} className="stroke-[2.5]" />
                              </div>
                              <div className="space-y-0.5">
                                <p className="text-[11px] font-black uppercase text-black dark:text-white">
                                  Invoice #{invId} Pending
                                </p>
                                <p className="text-[10px] text-gray-500 dark:text-gray-400 font-mono">
                                  From: {shortSender}
                                </p>
                              </div>
                            </div>
                          </Link>
                        );
                      })}
                    </div>
                  )}
                </div>
              </>
            )}
          </div>

          <div className="border-[3px] border-black dark:border-[1px] dark:border-white/20 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] dark:shadow-[1.5px_1.5px_0px_0px_rgba(255,255,255,0.15)] bg-white dark:bg-[#121620]">
            <ConnectButton showBalance={false} chainStatus="icon" accountStatus="address" />
          </div>

          {/* Mobile Hamburger Button */}
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="md:hidden p-2 bg-white dark:bg-[#121620] border-[3px] border-black dark:border-white/20 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[-1px] hover:translate-y-[-1px] hover:shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] active:translate-x-[0px] active:translate-y-[0px] active:shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] transition-all flex items-center justify-center text-black dark:text-white"
            aria-label="Toggle menu"
          >
             {isOpen ? (
               <svg viewBox="0 0 24 24" className="w-5 h-5 stroke-current" strokeWidth="2.5" strokeLinecap="square">
                 <line x1="5" y1="5" x2="19" y2="19" />
                 <line x1="5" y1="19" x2="19" y2="5" />
               </svg>
             ) : (
               <svg viewBox="0 0 24 24" className="w-5 h-5 stroke-current" strokeWidth="2.5" strokeLinecap="square">
                 <line x1="4" y1="8" x2="20" y2="8" />
                 <line x1="4" y1="16" x2="20" y2="16" />
               </svg>
             )}
          </button>
        </div>
      </div>

      {/* Mobile Drawer Dropdown */}
      {isOpen && (
        <div className="md:hidden border-t-4 border-black dark:border-white/15 bg-[#f4f2ec] dark:bg-[#0d0e14] p-4 space-y-3 animate-in slide-in-from-top-4 duration-200">
          <nav className="flex flex-col gap-2.5">
            <NavLink to="/"        className={mobileNavClass} onClick={() => setIsOpen(false)} end>Home</NavLink>
            <NavLink to="/send"    className={mobileNavClass} onClick={() => setIsOpen(false)}>Send</NavLink>
            <NavLink to="/receive" className={mobileNavClass} onClick={() => setIsOpen(false)}>Receive</NavLink>
            <NavLink to="/profile" className={mobileNavClass} onClick={() => setIsOpen(false)}>Profile</NavLink>
          </nav>
        </div>
      )}
    </header>
  );
}

function Footer() {
  return (
    <footer className="mt-auto border-t-4 border-black dark:border-white/15 bg-white dark:bg-[#121620] py-8 px-4 transition-colors duration-200">
      <div className="max-w-5xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
        {/* Left Side: Brand and Copyright */}
        <div className="flex flex-col items-center md:items-start gap-2">
          <div className="flex items-center gap-2.5">
            <div className="w-6 h-6 border-2 border-black dark:border-white bg-[#EAB308] flex items-center justify-center shadow-[1px_1px_0px_0px_rgba(0,0,0,1)]">
              <svg viewBox="0 0 100 100" className="w-4 h-4">
                <path d="M50,15 L22,25 V52 C22,70 50,83 50,83 C50,83 78,70 78,52 V25 Z" fill="#0F0F0F" />
                <path d="M39,48 V41 C39,34.5 44,30.5 50,30.5 C56,30.5 61,34.5 61,41 V48" fill="none" stroke="#EAB308" strokeWidth="5.5" strokeLinecap="round" />
                <path d="M33,48 H67 V68 C67,71.5 64,74.5 60,74.5 H40 C36,74.5 33,71.5 33,68 Z" fill="#EAB308" />
                <circle cx="50" cy="58" r="3.5" fill="#0F0F0F" />
                <polygon points="48,58 46.5,68 53.5,68 52,58" fill="#0F0F0F" />
              </svg>
            </div>
            <span className="font-black text-xs tracking-wider uppercase text-black dark:text-white">
              ConfidentialPay
            </span>
          </div>
          <p className="text-[11px] text-gray-500 dark:text-gray-400 font-mono text-center md:text-left mt-1">
            © {new Date().getFullYear()} ConfidentialPay. All rights reserved.
          </p>
        </div>

        {/* Right Side: Links */}
        <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 font-mono text-xs font-bold">
          <a
            href="https://github.com/ritesh59697/ConfidentialPay.git"
            target="_blank"
            rel="noreferrer"
            className="text-black dark:text-white hover:text-red-500 dark:hover:text-red-400 underline decoration-2 decoration-black dark:decoration-white/20 hover:decoration-red-500 transition-colors"
          >
            GitHub
          </a>
          <a
            href="https://docs.zama.ai/fhevm"
            target="_blank"
            rel="noreferrer"
            className="text-black dark:text-white hover:text-red-500 dark:hover:text-red-400 underline decoration-2 decoration-black dark:decoration-white/20 hover:decoration-red-500 transition-colors"
          >
            Zama Docs
          </a>
          <a
            href="https://sepolia.etherscan.io/address/0xB3Bfeee1cA3De9E736A742345C761947962Ca081"
            target="_blank"
            rel="noreferrer"
            className="text-black dark:text-white hover:text-red-500 dark:hover:text-red-400 underline decoration-2 decoration-black dark:decoration-white/20 hover:decoration-red-500 transition-colors"
          >
            Contract (Sepolia)
          </a>
        </div>
      </div>
    </footer>
  );
}
