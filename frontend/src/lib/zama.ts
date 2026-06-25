import { createConfig as createZamaConfig } from "@zama-fhe/react-sdk/wagmi";
import { getDefaultConfig } from "@rainbow-me/rainbowkit";
import { http } from "wagmi";
import { sepolia } from "wagmi/chains";
import { sepolia as sepoliaFhe, type FheChain } from "@zama-fhe/sdk/chains";
import { web } from "@zama-fhe/sdk/web";

// Extend the Sepolia FHE chain with your relayer URL
// In dev, route through Vite's /relayer proxy to bypass CORS.
// The proxy target uses the SDK's current /v2 relayer API.
// In production, use the full relayer URL from the env var.
const isDev = import.meta.env.DEV;
const relayerUrl = isDev
  ? `${window.location.origin}/relayer`
  : (import.meta.env.VITE_RELAYER_URL || sepoliaFhe.relayerUrl);

const sepoliaFheChain = {
  ...sepoliaFhe,
  relayerUrl,
} as const satisfies FheChain;

// 1. Create a standard Wagmi configuration with RainbowKit settings
export const wagmiConfig = getDefaultConfig({
  appName: "ConfidentialPay",
  projectId: import.meta.env.VITE_WALLETCONNECT_PROJECT_ID || "95632616f73117498cd9b183617300c0",
  chains: [sepolia],
  transports: {
    [sepolia.id]: http(import.meta.env.VITE_SEPOLIA_RPC_URL),
  },
});

// 2. Wrap Wagmi config inside the Zama FHE config
export const zamaConfig = createZamaConfig({
  chains: [sepoliaFheChain],
  wagmiConfig,
  relayers: { [sepolia.id]: web() },
});
