import { createConfig } from "@zama-fhe/react-sdk/wagmi";
import { sepolia } from "viem/chains";
import { sepolia as sepoliaFhe, type FheChain } from "@zama-fhe/sdk/chains";
import { web } from "@zama-fhe/sdk/web";

// Extend the Sepolia FHE chain with your relayer URL
// For local dev, run the Zama relayer or use the public testnet endpoint
const sepoliaFheChain = {
  ...sepoliaFhe,
  relayerUrl:
    import.meta.env.VITE_RELAYER_URL ||
    "https://relayer.testnet.zama.org/11155111", // Public Zama testnet relayer
} as const satisfies FheChain;

// createConfig from @zama-fhe/react-sdk/wagmi builds both wagmi + Zama config
export const zamaConfig = createConfig({
  chains: [sepoliaFheChain],
  relayers: { [sepolia.id]: web() },
});

// The walletClient and publicClient are provided by wagmi via ZamaProvider
// No manual client construction needed — the provider wires everything up
