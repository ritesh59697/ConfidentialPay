import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { WagmiProvider }  from "wagmi";
import { ZamaProvider }   from "@zama-fhe/react-sdk";
import { RainbowKitProvider, darkTheme } from "@rainbow-me/rainbowkit";
import { BrowserRouter, Routes, Route, NavLink } from "react-router-dom";
import { zamaConfig } from "@/lib/zama";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import SenderDashboard   from "@/pages/SenderDashboard";
import ReceiverDashboard from "@/pages/ReceiverDashboard";
import "@rainbow-me/rainbowkit/styles.css";

const queryClient = new QueryClient();

export default function App() {
  return (
    <WagmiProvider config={zamaConfig}>
      <QueryClientProvider client={queryClient}>
        <ZamaProvider config={zamaConfig}>
          <RainbowKitProvider theme={darkTheme({ accentColor: "#2563EB" })}>
            <BrowserRouter>
              <div className="min-h-screen bg-gray-950 text-white">
                <Header />
                <main className="max-w-5xl mx-auto px-4 py-10">
                  <Routes>
                    <Route path="/"         element={<SenderDashboard />} />
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
    `text-sm font-medium px-3 py-1.5 rounded-md transition-colors ${
      isActive
        ? "bg-blue-600 text-white"
        : "text-gray-400 hover:text-white hover:bg-gray-800"
    }`;

  return (
    <header className="border-b border-gray-800 bg-gray-950/80 backdrop-blur sticky top-0 z-50">
      <div className="max-w-5xl mx-auto px-4 h-16 flex items-center justify-between">
        <div className="flex items-center gap-8">
          {/* Logo */}
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-md bg-blue-600 flex items-center justify-center text-xs font-bold">
              CP
            </div>
            <span className="font-semibold text-sm tracking-tight">ConfidentialPay</span>
          </div>

          {/* Nav */}
          <nav className="flex items-center gap-1">
            <NavLink to="/"        className={navClass}>Send invoices</NavLink>
            <NavLink to="/receive" className={navClass}>Receive & pay</NavLink>
          </nav>
        </div>

        <ConnectButton showBalance={false} chainStatus="icon" />
      </div>
    </header>
  );
}
