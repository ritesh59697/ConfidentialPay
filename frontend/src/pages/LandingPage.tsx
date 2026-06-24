import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Lock, Unlock, ArrowRight, Shield, Activity, Zap, CheckCircle2, ChevronDown, Terminal, EyeOff, ShieldCheck } from "lucide-react";

export default function LandingPage() {
  const [amountInput, setAmountInput] = useState("45,000");
  const [encryptStep, setEncryptStep] = useState<"idle" | "encrypting" | "encrypted" | "decrypting" | "decrypted">("idle");
  const [cipherText, setCipherText] = useState("0x0000000000000000000000000000000000000000");
  const [activeFaq, setActiveFaq] = useState<number | null>(null);

  // Generate a random cipher handle for the demo
  const triggerEncryptionSim = () => {
    if (encryptStep !== "idle") return;
    setEncryptStep("encrypting");
    
    setTimeout(() => {
      const chars = "0123456789abcdef";
      let mockHash = "0x";
      for (let i = 0; i < 40; i++) {
        mockHash += chars[Math.floor(Math.random() * 16)];
      }
      setCipherText(mockHash);
      setEncryptStep("encrypted");
    }, 1800);
  };

  const triggerDecryptionSim = () => {
    if (encryptStep !== "encrypted") return;
    setEncryptStep("decrypting");
    
    setTimeout(() => {
      setEncryptStep("decrypted");
    }, 1500);
  };

  const resetSimulation = () => {
    setEncryptStep("idle");
    setCipherText("0x0000000000000000000000000000000000000000");
  };

  const faqs = [
    {
      q: "What is Fully Homomorphic Encryption (FHE)?",
      a: "FHE is a groundbreaking cryptographic primitive that allows smart contracts to perform computations directly on encrypted data. Traditional blockchains require all state data to be public. FHE keeps variables encrypted at rest, in transit, and during calculation, allowing private values to be compared, added, or transferred without ever revealing the underlying plaintext numbers to validator nodes or public block explorers."
    },
    {
      q: "How does ConfidentialPay utilize FHE?",
      a: "When you create an invoice, the amount is encrypted on your local device using Zama's SDK. The transaction parameters sent to the Ethereum blockchain contain only the encrypted payload (euint64 handle). When the recipient pays, the smart contract deducts the encrypted invoice amount from their encrypted cUSDT balance and adds it to yours—all calculations occur homomorphically on-chain. Only authorized keyholders can generate an EIP-712 permit signature to decrypt and view their own data."
    },
    {
      q: "How is this different from Zero-Knowledge Proofs (ZKPs)?",
      a: "ZKPs prove that a statement is true (e.g., 'I have enough money') without revealing the details, but they require the user to compute the proof off-chain. FHE allows the blockchain itself to compute new states dynamically using private values. This enables composable private applications, such as automatic on-chain invoice matching, multi-party private arithmetic, and encrypted token swaps without central coordinators."
    },
    {
      q: "Is it secure to use on Sepolia testnet?",
      a: "Yes, Zama's FHEVM utilizes advanced lattice-based cryptography (specifically TFHE). The security of TFHE is based on the Ring Learning With Errors (LWE) problem, which is mathematically proven to be secure even against future quantum computer attacks."
    }
  ];

  return (
    <div className="relative min-h-screen pt-4 overflow-hidden">
      {/* Ambient gradient backdrops */}
      <div className="absolute top-[-20%] left-[-10%] w-[60vw] h-[60vw] rounded-full bg-blue-900/10 blur-[120px] animate-pulse-glow" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[50vw] h-[50vw] rounded-full bg-indigo-900/10 blur-[120px] animate-pulse-glow" style={{ animationDelay: "-3s" }} />

      {/* Hero Section */}
      <section className="relative max-w-5xl mx-auto px-4 pt-16 pb-20 text-center space-y-8">
        <div className="inline-flex items-center gap-2 bg-blue-950/50 border border-blue-900/40 rounded-full px-3.5 py-1.5 text-xs text-blue-400 font-medium">
          <Shield size={12} className="text-blue-500 animate-pulse" />
          <span>Powered by Zama FHEVM — Builder Track Season 3</span>
        </div>

        <h1 className="text-4xl md:text-6xl font-bold tracking-tight leading-[1.15] max-w-4xl mx-auto">
          Private B2B Invoices & Payments <br />
          <span className="text-shimmer">Fully Encrypted On-Chain</span>
        </h1>

        <p className="text-gray-400 text-base md:text-lg max-w-2xl mx-auto font-light leading-relaxed">
          On a public blockchain, every payment is exposed. ConfidentialPay uses Fully Homomorphic Encryption to secure amounts and payment histories—while maintaining public verifiable proof-of-payment.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
          <Link
            to="/send"
            className="w-full sm:w-auto flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-500 text-white font-medium px-6 py-3 rounded-xl transition-all shadow-lg shadow-blue-600/20 hover:shadow-blue-500/30 hover:scale-[1.01]"
          >
            <span>Send Invoice</span>
            <ArrowRight size={16} />
          </Link>
          <Link
            to="/receive"
            className="w-full sm:w-auto flex items-center justify-center gap-2 bg-gray-900 hover:bg-gray-800 border border-gray-800 text-gray-200 font-medium px-6 py-3 rounded-xl transition-all hover:border-gray-700"
          >
            <span>Receive & Pay</span>
          </Link>
        </div>
      </section>

      {/* Interactive FHE Encryption Simulator */}
      <section className="max-w-5xl mx-auto px-4 pb-24">
        <div className="glass-panel rounded-3xl p-6 md:p-8 relative overflow-hidden">
          <div className="absolute top-0 right-0 p-4 opacity-5">
            <Terminal size={140} />
          </div>

          <div className="relative mb-8 text-center md:text-left max-w-xl">
            <h2 className="text-xl md:text-2xl font-bold">Interactive FHE Flow Visualizer</h2>
            <p className="text-gray-400 text-xs md:text-sm mt-1">
              See what actually happens when you submit an invoice. Only FHE allows arithmetic on encrypted data.
            </p>
          </div>

          {/* Three-step visual columns */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 relative z-10">
            {/* Column 1: Client Side Input */}
            <div className="bg-gray-950/60 border border-gray-800/80 rounded-2xl p-5 space-y-4">
              <div className="flex items-center gap-2 text-xs font-semibold text-blue-400 uppercase tracking-wider">
                <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                <span>1. Client Browser (Plaintext)</span>
              </div>
              <div className="bg-gray-900/80 border border-gray-800 rounded-xl p-4 space-y-3">
                <div>
                  <label className="block text-xxs text-gray-500 uppercase font-mono mb-1">Invoice Value</label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">$</span>
                    <input
                      type="text"
                      value={amountInput}
                      onChange={(e) => {
                        if (encryptStep === "idle") setAmountInput(e.target.value);
                      }}
                      disabled={encryptStep !== "idle"}
                      className="w-full bg-gray-950 border border-gray-800 rounded-lg pl-7 pr-3 py-2 text-sm font-mono text-white focus:outline-none focus:border-blue-500 disabled:opacity-75"
                    />
                  </div>
                </div>
                <button
                  onClick={triggerEncryptionSim}
                  disabled={encryptStep !== "idle"}
                  className="w-full py-2 bg-blue-600 hover:bg-blue-500 disabled:bg-gray-800 disabled:text-gray-500 text-white font-medium text-xs rounded-lg transition-colors flex items-center justify-center gap-1.5"
                >
                  <Lock size={12} />
                  <span>Encrypt & Submit</span>
                </button>
              </div>
              <p className="text-xxs text-gray-500 leading-relaxed font-light">
                *The input amount is mathematically encrypted client-side using the TFHE public key before broadcast.
              </p>
            </div>

            {/* Column 2: On-Chain Ciphertext */}
            <div className="bg-gray-950/60 border border-gray-800/80 rounded-2xl p-5 flex flex-col justify-between space-y-4">
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-xs font-semibold text-purple-400 uppercase tracking-wider">
                  <span className="w-1.5 h-1.5 rounded-full bg-purple-500" />
                  <span>2. Ethereum Node (Encrypted)</span>
                </div>
                <div className="bg-gray-900/80 border border-gray-800 rounded-xl p-4 font-mono space-y-2 relative min-h-[110px] flex flex-col justify-center">
                  {encryptStep === "idle" && (
                    <div className="text-center text-xs text-gray-600">Awaiting submission...</div>
                  )}
                  {encryptStep === "encrypting" && (
                    <div className="flex flex-col items-center gap-2 justify-center py-2">
                      <div className="w-5 h-5 rounded-full border-2 border-purple-500 border-t-transparent animate-spin" />
                      <span className="text-[10px] text-purple-400 animate-pulse">Running TFHE.asEuint64()...</span>
                    </div>
                  )}
                  {(encryptStep === "encrypted" || encryptStep === "decrypting" || encryptStep === "decrypted") && (
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-xxs border-b border-gray-800 pb-1.5 mb-1.5">
                        <span className="text-purple-400">euint64 ciphertext handle</span>
                        <span className="text-green-500">Secure</span>
                      </div>
                      <div className="text-[11px] text-gray-400 break-all leading-normal select-all">
                        {cipherText}
                      </div>
                    </div>
                  )}
                </div>
              </div>
              <p className="text-xxs text-gray-500 leading-relaxed font-light">
                *Ethereum nodes only see this hash. All network calculations (e.g. payInvoice) happen homomorphically.
              </p>
            </div>

            {/* Column 3: Decrypted Recipient view */}
            <div className="bg-gray-950/60 border border-gray-800/80 rounded-2xl p-5 flex flex-col justify-between space-y-4">
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-xs font-semibold text-emerald-400 uppercase tracking-wider">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                  <span>3. Recipient (Decrypted)</span>
                </div>
                <div className="bg-gray-900/80 border border-gray-800 rounded-xl p-4 flex flex-col justify-center min-h-[110px]">
                  {encryptStep === "idle" || encryptStep === "encrypting" ? (
                    <div className="text-center text-xs text-gray-600">Awaiting encryption...</div>
                  ) : encryptStep === "encrypted" ? (
                    <button
                      onClick={triggerDecryptionSim}
                      className="w-full py-2 bg-emerald-600/20 hover:bg-emerald-600/30 border border-emerald-500/30 text-emerald-400 font-medium text-xs rounded-lg transition-colors flex items-center justify-center gap-1.5"
                    >
                      <Unlock size={12} />
                      <span>Decrypt (Signs EIP-712)</span>
                    </button>
                  ) : encryptStep === "decrypting" ? (
                    <div className="flex flex-col items-center gap-2 justify-center py-2">
                      <div className="w-5 h-5 rounded-full border-2 border-emerald-500 border-t-transparent animate-spin" />
                      <span className="text-[10px] text-emerald-400 animate-pulse">Requesting decryption key...</span>
                    </div>
                  ) : (
                    <div className="text-center space-y-1">
                      <div className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-emerald-950 text-emerald-400 mb-1 border border-emerald-500/20">
                        <CheckCircle2 size={13} />
                      </div>
                      <div className="text-lg font-bold text-white tabular-nums">${amountInput} USDT</div>
                      <div className="text-[10px] text-emerald-400 font-mono">Decrypted Successfully</div>
                    </div>
                  )}
                </div>
              </div>
              <div className="flex justify-between items-center gap-2">
                <p className="text-xxs text-gray-500 leading-relaxed font-light">
                  *Only sender and recipient wallets have ACL permission to decrypt.
                </p>
                {encryptStep === "decrypted" && (
                  <button
                    onClick={resetSimulation}
                    className="text-xxs text-blue-400 hover:text-blue-300 font-medium whitespace-nowrap"
                  >
                    Reset Visualizer
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Core Pillars / Feature section */}
      <section className="max-w-5xl mx-auto px-4 pb-20 grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-gray-900/40 border border-gray-800/80 rounded-2xl p-6 space-y-3 glass-card-hover">
          <div className="w-10 h-10 rounded-xl bg-blue-600/10 border border-blue-500/20 flex items-center justify-center text-blue-400">
            <EyeOff size={20} />
          </div>
          <h3 className="font-semibold text-lg text-white">Confidential Amounts</h3>
          <p className="text-xs text-gray-400 leading-relaxed font-light">
            Invoice amounts, balances, and transfer sizes are fully hidden on the blockchain. Shielded arithmetic prevents public monitoring of business relations.
          </p>
        </div>

        <div className="bg-gray-900/40 border border-gray-800/80 rounded-2xl p-6 space-y-3 glass-card-hover">
          <div className="w-10 h-10 rounded-xl bg-purple-600/10 border border-purple-500/20 flex items-center justify-center text-purple-400">
            <ShieldCheck size={20} />
          </div>
          <h3 className="font-semibold text-lg text-white">Verifiable Proof of Payment</h3>
          <p className="text-xs text-gray-400 leading-relaxed font-light">
            Need to prove an invoice was settled? Anyone can call the contract's `isInvoicePaid` function to check the boolean flag, proving settlement without disclosing costs.
          </p>
        </div>

        <div className="bg-gray-900/40 border border-gray-800/80 rounded-2xl p-6 space-y-3 glass-card-hover">
          <div className="w-10 h-10 rounded-xl bg-emerald-600/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
            <Zap size={20} />
          </div>
          <h3 className="font-semibold text-lg text-white">Native On-Chain Settlement</h3>
          <p className="text-xs text-gray-400 leading-relaxed font-light">
            No complex trust parameters or off-chain state verification networks. Settlements occur inside Ethereum EVM transactions, executing securely on Sepolia testnet.
          </p>
        </div>
      </section>

      {/* Tech Architecture Step-by-Step */}
      <section className="max-w-5xl mx-auto px-4 pb-24 space-y-8">
        <div className="text-center max-w-xl mx-auto space-y-2">
          <h2 className="text-2xl font-bold tracking-tight">On-Chain Flow Architecture</h2>
          <p className="text-sm text-gray-400 font-light">
            How ConfidentialPay utilizes Zama's FHEVM protocol to manage end-to-end B2B invoices.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 relative">
          {/* Step 1 */}
          <div className="bg-gray-900/20 border border-gray-800 rounded-xl p-5 space-y-2 relative">
            <div className="text-xxs font-mono text-blue-500 font-semibold bg-blue-950/50 inline-block px-2 py-0.5 rounded-full mb-1">STEP 01</div>
            <h4 className="font-semibold text-sm">Encrypt Client-Side</h4>
            <p className="text-xxs text-gray-400 leading-relaxed font-light">
              Sender fills recipient and amount. The Zama SDK encrypts the amount on-device using the network's public key.
            </p>
          </div>

          {/* Step 2 */}
          <div className="bg-gray-900/20 border border-gray-800 rounded-xl p-5 space-y-2 relative">
            <div className="text-xxs font-mono text-purple-500 font-semibold bg-purple-950/50 inline-block px-2 py-0.5 rounded-full mb-1">STEP 02</div>
            <h4 className="font-semibold text-sm">On-Chain Storage</h4>
            <p className="text-xxs text-gray-400 leading-relaxed font-light">
              InvoiceVault contract registers the invoice details. The amount is saved as an encrypted TFHE `euint64` object.
            </p>
          </div>

          {/* Step 3 */}
          <div className="bg-gray-900/20 border border-gray-800 rounded-xl p-5 space-y-2 relative">
            <div className="text-xxs font-mono text-emerald-500 font-semibold bg-emerald-950/50 inline-block px-2 py-0.5 rounded-full mb-1">STEP 03</div>
            <h4 className="font-semibold text-sm">Encrypted Settlement</h4>
            <p className="text-xxs text-gray-400 leading-relaxed font-light">
              Recipient pays the invoice. cUSDT handles transfers homomorphically, deducting and adding encrypted funds.
            </p>
          </div>

          {/* Step 4 */}
          <div className="bg-gray-900/20 border border-gray-800 rounded-xl p-5 space-y-2 relative">
            <div className="text-xxs font-mono text-indigo-500 font-semibold bg-indigo-950/50 inline-block px-2 py-0.5 rounded-full mb-1">STEP 04</div>
            <h4 className="font-semibold text-sm">Permitted Decrypt</h4>
            <p className="text-xxs text-gray-400 leading-relaxed font-light">
              Only authorized parties can request decryption via EIP-712 permits. Relayer returns cleartext only to them.
            </p>
          </div>
        </div>
      </section>

      {/* FAQ Accordions */}
      <section className="max-w-3xl mx-auto px-4 pb-24 space-y-8">
        <h2 className="text-2xl font-bold tracking-tight text-center">Frequently Asked Questions</h2>
        <div className="space-y-4">
          {faqs.map((faq, index) => {
            const isOpen = activeFaq === index;
            return (
              <div
                key={index}
                className="bg-gray-900/40 border border-gray-800 rounded-xl overflow-hidden transition-colors"
              >
                <button
                  onClick={() => setActiveFaq(isOpen ? null : index)}
                  className="w-full flex items-center justify-between gap-4 p-5 text-left font-medium text-sm md:text-base text-gray-100 hover:text-white"
                >
                  <span>{faq.q}</span>
                  <ChevronDown
                    size={16}
                    className={`text-gray-400 transition-transform ${isOpen ? "rotate-180" : ""}`}
                  />
                </button>
                <div
                  className={`transition-all duration-200 ease-in-out ${
                    isOpen ? "max-h-[300px] border-t border-gray-800/80 p-5 pt-4 opacity-100" : "max-h-0 opacity-0 overflow-hidden"
                  }`}
                >
                  <p className="text-xs md:text-sm text-gray-400 leading-relaxed font-light">
                    {faq.a}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}
