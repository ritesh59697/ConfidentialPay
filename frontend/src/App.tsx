import { useState, useEffect, useRef } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { WagmiProvider }  from "wagmi";
import { wagmiConfig } from "@/lib/wagmi";
import { RainbowKitProvider, lightTheme } from "@rainbow-me/rainbowkit";
import { BrowserRouter, Routes, Route, NavLink, Link } from "react-router-dom";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { Sun, Moon } from "lucide-react";
import LandingPage       from "@/pages/LandingPage";
import SenderDashboard   from "@/pages/SenderDashboard";
import ReceiverDashboard from "@/pages/ReceiverDashboard";
import ProfilePage       from "@/pages/ProfilePage";
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
            <div className="min-h-screen bg-[#e4e2db] dark:bg-[#090a0f] text-black dark:text-white selection:bg-red-500 selection:text-white transition-colors duration-200">
              <Header />
              <main className="max-w-5xl mx-auto px-4 py-8 relative z-10">
                <Routes>
                  <Route path="/"         element={<LandingPage />} />
                  <Route path="/send"     element={<SenderDashboard />} />
                  <Route path="/receive"  element={<ReceiverDashboard />} />
                  <Route path="/profile"  element={<ProfilePage />} />
                </Routes>
              </main>
            </div>
          </BrowserRouter>
        </RainbowKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
}

function Header() {
  const navClass = ({ isActive }: { isActive: boolean }) =>
    `text-xs md:text-sm font-black uppercase px-3.5 py-1.5 border-[3px] border-black dark:border-[1px] dark:border-white/20 transition-all ${
      isActive
        ? "bg-yellow-400 text-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] dark:shadow-[1.5px_1.5px_0px_0px_rgba(255,255,255,0.15)] translate-x-[-1px] translate-y-[-1px]"
        : "bg-white dark:bg-[#121620] text-black dark:text-white hover:bg-gray-100 dark:hover:bg-zinc-800 hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] dark:hover:shadow-[1.5px_1.5px_0px_0px_rgba(255,255,255,0.12)] hover:translate-x-[-1px] hover:translate-y-[-1px]"
    }`;

  return (
    <header className="border-b-4 border-black dark:border-b dark:border-white/15 bg-[#e4e2db] dark:bg-[#090a0f] sticky top-0 z-50 transition-colors duration-200">
      <div className="max-w-5xl mx-auto px-4 h-16 flex items-center justify-between">
        <div className="flex items-center gap-4 md:gap-6">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2.5 group">
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
            <span className="font-black text-xs md:text-sm tracking-wide hidden sm:inline-block text-black dark:text-white uppercase group-hover:text-red-500 transition-colors">
              ConfidentialPay
            </span>
          </Link>
 
          {/* Nav */}
          <nav className="flex items-center gap-1.5">
            <NavLink to="/"        className={navClass} end>Home</NavLink>
            <NavLink to="/send"    className={navClass}>Send</NavLink>
            <NavLink to="/receive" className={navClass}>Receive</NavLink>
            <NavLink to="/profile" className={navClass}>Profile</NavLink>
          </nav>
        </div>

        <div className="flex items-center gap-3">
          <div className="border-[3px] border-black dark:border-[1px] dark:border-white/20 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] dark:shadow-[1.5px_1.5px_0px_0px_rgba(255,255,255,0.15)] bg-white dark:bg-[#121620]">
            <ConnectButton showBalance={false} chainStatus="icon" accountStatus="address" />
          </div>
        </div>
      </div>
    </header>
  );
}
