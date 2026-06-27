import { getDefaultConfig } from "@rainbow-me/rainbowkit";
import { http } from "wagmi";
import { sepolia } from "wagmi/chains";

export const wagmiConfig = getDefaultConfig({
  appName: "ConfidentialPay",
  projectId: import.meta.env.VITE_WALLETCONNECT_PROJECT_ID || "95632616f73117498cd9b183617300c0",
  chains: [sepolia],
  transports: {
    [sepolia.id]: http(import.meta.env.VITE_SEPOLIA_RPC_URL),
  },
});
