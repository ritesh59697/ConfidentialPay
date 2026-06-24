import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { WagmiProvider }  from "wagmi";
import { ZamaProvider }   from "@zama-fhe/react-sdk";
import { RainbowKitProvider, darkTheme } from "@rainbow-me/rainbowkit";
import { BrowserRouter, Routes, Route, NavLink, Link } from "react-router-dom";
import { wagmiConfig, zamaConfig } from "@/lib/zama";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import LandingPage       from "@/pages/LandingPage";
import SenderDashboard   from "@/pages/SenderDashboard";
import ReceiverDashboard from "@/pages/ReceiverDashboard";
import { ShieldAlert } from "lucide-react";
import "@rainbow-me/rainbowkit/styles.css";

const queryClient = new QueryClient();

export default function App() {
  return (
    <WagmiProvider config={wagmiConfig}>
      <QueryClientProvider client={queryClient}>
        <ZamaProvider config={zamaConfig}>
          <RainbowKitProvider
            theme={darkTheme({
              accentColor: "#2563eb", // blue-600
              accentColorForeground: "white",
              borderRadius: "medium",
              overlayBlur: "small",
            })}
          >
            <BrowserRouter>
              <div className="min-h-screen bg-gray-950 text-white selection:bg-blue-600/30 selection:text-blue-300">
                <Header />
                <main className="max-w-5xl mx-auto px-4 py-8 relative z-10">
                  <Routes>
                    <Route path="/"         element={<LandingPage />} />
                    <Route path="/send"     element={<SenderDashboard />} />
                    <Route path="/receive"  element={<ReceiverDashboard />} />
                  </Routes>
                </main>
              </div>
            </BrowserRouter>
          </RainbowKitProvider>
        </ZamaProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
}

function Header() {
  const navClass = ({ isActive }: { isActive: boolean }) =>
    `text-xs md:text-sm font-medium px-3.5 py-1.5 rounded-lg transition-all duration-200 ${
      isActive
        ? "bg-blue-600/10 text-blue-400 border border-blue-500/20 shadow-[0_0_12px_rgba(59,130,246,0.1)]"
        : "text-gray-400 border border-transparent hover:text-white hover:bg-gray-900/60"
    }`;

  return (
    <header className="border-b border-gray-900 bg-gray-950/70 backdrop-blur-md sticky top-0 z-50 transition-all">
      <div className="max-w-5xl mx-auto px-4 h-16 flex items-center justify-between">
        <div className="flex items-center gap-6 md:gap-8">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2.5 group">
            <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-xs font-bold text-white shadow-md shadow-blue-600/25 group-hover:scale-105 transition-transform">
              CP
            </div>
            <span className="font-semibold text-sm tracking-tight hidden sm:inline-block text-white group-hover:text-blue-400 transition-colors">
              ConfidentialPay
            </span>
          </Link>

          {/* Nav */}
          <nav className="flex items-center gap-1 md:gap-1.5">
            <NavLink to="/"        className={navClass} end>Home</NavLink>
            <NavLink to="/send"    className={navClass}>Send invoices</NavLink>
            <NavLink to="/receive" className={navClass}>Receive & pay</NavLink>
          </nav>
        </div>

        <div className="flex items-center gap-3">
          <ConnectButton showBalance={false} chainStatus="icon" />
        </div>
      </div>
    </header>
  );
}
