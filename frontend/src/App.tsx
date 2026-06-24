import { useState, useEffect } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { WagmiProvider }  from "wagmi";
import { ZamaProvider }   from "@zama-fhe/react-sdk";
import { RainbowKitProvider, lightTheme, darkTheme } from "@rainbow-me/rainbowkit";
import { BrowserRouter, Routes, Route, NavLink, Link } from "react-router-dom";
import { wagmiConfig, zamaConfig } from "@/lib/zama";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { Sun, Moon } from "lucide-react";
import LandingPage       from "@/pages/LandingPage";
import SenderDashboard   from "@/pages/SenderDashboard";
import ReceiverDashboard from "@/pages/ReceiverDashboard";
import "@rainbow-me/rainbowkit/styles.css";

const queryClient = new QueryClient();

export default function App() {
  const [theme, setTheme] = useState(() => {
    return localStorage.getItem("theme") || "light";
  });

  useEffect(() => {
    if (theme === "dark") {
      document.body.classList.add("dark");
    } else {
      document.body.classList.remove("dark");
    }
    localStorage.setItem("theme", theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme((prev) => (prev === "light" ? "dark" : "light"));
  };

  const isDark = theme === "dark";
  const activeRainbowTheme = isDark
    ? darkTheme({
        accentColor: "#ffffff",
        accentColorForeground: "black",
        borderRadius: "none",
      })
    : lightTheme({
        accentColor: "#000000",
        accentColorForeground: "white",
        borderRadius: "none",
      });

  return (
    <WagmiProvider config={wagmiConfig}>
      <QueryClientProvider client={queryClient}>
        <ZamaProvider config={zamaConfig}>
          <RainbowKitProvider theme={activeRainbowTheme}>
            <BrowserRouter>
              <div className="min-h-screen bg-[#e4e2db] dark:bg-[#090a0f] text-black dark:text-white selection:bg-red-500 selection:text-white transition-colors duration-200">
                <Header theme={theme} toggleTheme={toggleTheme} />
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

interface HeaderProps {
  theme: string;
  toggleTheme: () => void;
}

function Header({ theme, toggleTheme }: HeaderProps) {
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
            <div className="w-9 h-9 border-[3px] border-black dark:border-[1px] dark:border-white/20 bg-emerald-400 flex items-center justify-center text-xs font-black text-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] dark:shadow-[1.5px_1.5px_0px_0px_rgba(255,255,255,0.15)] group-hover:translate-x-[-1px] group-hover:translate-y-[-1px] group-hover:shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] dark:group-hover:shadow-[2.5px_2.5px_0px_0px_rgba(255,255,255,0.2)] transition-all">
              CP
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
          </nav>
        </div>

        <div className="flex items-center gap-3">
          {/* Theme Toggle Button */}
          <button
            onClick={toggleTheme}
            className="w-9 h-9 border-[3px] border-black dark:border-[1px] dark:border-white/20 bg-white dark:bg-[#121620] text-black dark:text-white flex items-center justify-center shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] dark:shadow-[1.5px_1.5px_0px_0px_rgba(255,255,255,0.15)] hover:translate-x-[-1px] hover:translate-y-[-1px] hover:shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] dark:hover:shadow-[2.5px_2.5px_0px_0px_rgba(255,255,255,0.2)] active:translate-x-[1px] active:translate-y-[1px] active:shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] transition-all"
            title={`Switch to ${theme === "light" ? "Dark" : "Light"} Mode`}
          >
            {theme === "light" ? <Moon size={18} /> : <Sun size={18} />}
          </button>

          <div className="border-[3px] border-black dark:border-[1px] dark:border-white/20 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] dark:shadow-[1.5px_1.5px_0px_0px_rgba(255,255,255,0.15)] bg-white dark:bg-[#121620]">
            <ConnectButton showBalance={false} chainStatus="icon" />
          </div>
        </div>
      </div>
    </header>
  );
}
