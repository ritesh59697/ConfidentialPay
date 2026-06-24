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
import "@rainbow-me/rainbowkit/styles.css";

const queryClient = new QueryClient();

export default function App() {
  return (
    <WagmiProvider config={wagmiConfig}>
      <QueryClientProvider client={queryClient}>
        <ZamaProvider config={zamaConfig}>
          <RainbowKitProvider
            theme={darkTheme({
              accentColor: "#facc15", // yellow-400
              accentColorForeground: "black",
              borderRadius: "none",
              overlayBlur: "none",
            })}
          >
            <BrowserRouter>
              <div className="min-h-screen bg-[#0c0f16] text-white selection:bg-yellow-400 selection:text-black">
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
    `text-xs md:text-sm font-black uppercase px-3.5 py-1.5 border-[3px] border-black transition-all ${
      isActive
        ? "bg-yellow-400 text-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] translate-x-[-1px] translate-y-[-1px]"
        : "bg-zinc-800 text-gray-300 hover:text-white hover:bg-zinc-700 hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[-1px] hover:translate-y-[-1px]"
    }`;

  return (
    <header className="border-b-4 border-black bg-zinc-900 sticky top-0 z-50">
      <div className="max-w-5xl mx-auto px-4 h-16 flex items-center justify-between">
        <div className="flex items-center gap-4 md:gap-6">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2.5 group">
            <div className="w-9 h-9 border-[3px] border-black bg-emerald-400 flex items-center justify-center text-xs font-black text-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] group-hover:translate-x-[-1px] group-hover:translate-y-[-1px] group-hover:shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] transition-all">
              CP
            </div>
            <span className="font-black text-xs md:text-sm tracking-wide hidden sm:inline-block text-white uppercase group-hover:text-emerald-400 transition-colors">
              ConfidentialPay
            </span>
          </Link>

          {/* Nav */}
          <nav className="flex items-center gap-1.5">
            <NavLink to="/"        className={navClass} end>Home</NavLink>
            <NavLink to="/send"    className={navClass}>Send</NavLink>
            <NavLink to="/receive" className={navClass}>Receive</NavLink>
          </nav>
        </div>

        <div className="flex items-center gap-3">
          <div className="border-[3px] border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] bg-zinc-800">
            <ConnectButton showBalance={false} chainStatus="icon" />
          </div>
        </div>
      </div>
    </header>
  );
}
