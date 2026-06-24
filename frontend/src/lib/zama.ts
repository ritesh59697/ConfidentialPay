import { createConfig as createZamaConfig } from "@zama-fhe/react-sdk/wagmi";
import { getDefaultConfig } from "@rainbow-me/rainbowkit";
import { http } from "wagmi";
import { sepolia } from "wagmi/chains";
import { sepolia as sepoliaFhe, type FheChain } from "@zama-fhe/sdk/chains";
import { web } from "@zama-fhe/sdk/web";

// Extend the Sepolia FHE chain with your relayer URL
const sepoliaFheChain = {
  ...sepoliaFhe,
  relayerUrl:
    import.meta.env.VITE_RELAYER_URL ||
    "https://relayer.testnet.zama.org/11155111", // Public Zama testnet relayer
} as const satisfies FheChain;

// 1. Create a standard Wagmi configuration with RainbowKit settings
export const wagmiConfig = getDefaultConfig({
  appName: "ConfidentialPay",
  projectId: "95632616f73117498cd9b183617300c0", // WalletConnect project ID placeholder
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

