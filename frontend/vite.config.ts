import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: { "@": path.resolve(__dirname, "./src") },
  },
  server: {
    headers: {
      "Cross-Origin-Opener-Policy": "same-origin",
      "Cross-Origin-Embedder-Policy": "require-corp",
    },
    proxy: {
      // Proxy /relayer/* to Zama's testnet relayer, bypassing CORS on localhost.
      // The SDK's relayerUrl is set to `<origin>/relayer` so calls like /relayer/foo
      // are forwarded to https://relayer.testnet.zama.org/v2/foo
      "/relayer": {
        target: "https://relayer.testnet.zama.org/v2",
        changeOrigin: true,
        rewrite: (p) => p.replace(/^\/relayer/, ""),
        secure: true,
      },
    },
  },
});
