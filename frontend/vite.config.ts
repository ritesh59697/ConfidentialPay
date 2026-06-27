import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: { "@": path.resolve(__dirname, "./src") },
  },
  optimizeDeps: {
    exclude: ["@zama-fhe/relayer-sdk"],
  },
  worker: {
    format: "es",
  },
  server: {
    headers: {
      "Cross-Origin-Opener-Policy": "same-origin",
      "Cross-Origin-Embedder-Policy": "require-corp",
    },
    proxy: {
      // Proxy /relayer/* to Zama's testnet relayer, bypassing CORS on localhost.
      // relayerUrl in zama.ts = "<origin>/relayer/v2"
      // SDK uses the URL as-is (recognizes /v2 suffix as API version 2).
      // Vite strips /relayer → /v2/some-api → https://relayer.testnet.zama.org/v2/some-api
      "/relayer": {
        target: "https://relayer.testnet.zama.org",
        changeOrigin: true,
        rewrite: (p) => p.replace(/^\/relayer/, ""),
        secure: true,
      },
    },
  },
});
