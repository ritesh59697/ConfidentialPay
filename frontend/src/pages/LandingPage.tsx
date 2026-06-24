import { useState } from "react";
import { Link } from "react-router-dom";
import { Lock, Unlock, ArrowRight, Shield, Zap, CheckCircle2, ChevronDown, Terminal, EyeOff, ShieldCheck } from "lucide-react";

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
    <div className="relative min-h-screen pt-4 overflow-hidden text-black dark:text-white">
      {/* Hero Section */}
      <section className="relative max-w-4xl mx-auto px-4 pt-12 pb-16 text-center space-y-8">
        <div className="inline-flex items-center gap-2 bg-yellow-400 border-[3px] border-black dark:border-white px-4 py-1.5 text-xs font-black text-black uppercase tracking-wider shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] dark:shadow-[3px_3px_0px_0px_rgba(255,255,255,1)]">
          <Shield size={14} className="text-black fill-black animate-pulse" />
          <span>Zama FHEVM — Builder Track Season 3</span>
        </div>

        <div className="border-4 border-black dark:border-white bg-white dark:bg-[#121620] p-8 shadow-[8px_8px_0px_0px_#000000] dark:shadow-[8px_8px_0px_0px_#ffffff]">
          <h1 className="text-3xl md:text-5xl font-black tracking-tight leading-[1.15] max-w-3xl mx-auto uppercase">
            Private B2B Invoices & Payments <br />
            <span className="spray-red mt-2 inline-block">
              <span className="marker-circle text-white dark:text-black bg-black dark:bg-white font-black">Fully Encrypted On-Chain</span>
            </span>
          </h1>

          <p className="text-zinc-800 dark:text-zinc-300 text-sm md:text-base max-w-2xl mx-auto font-black uppercase tracking-wide leading-relaxed mt-6">
            On a public blockchain, every payment is exposed. ConfidentialPay uses Fully Homomorphic Encryption to secure amounts and payment histories—while maintaining public, verifiable proof-of-payment.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-5 pt-8">
            <Link
              to="/send"
              className="w-full sm:w-auto btn-brutal-yellow px-8 py-3.5 flex items-center justify-center gap-2 text-sm"
            >
              <span>Send Invoice</span>
              <ArrowRight size={18} />
            </Link>
            <Link
              to="/receive"
              className="w-full sm:w-auto btn-brutal-cyan px-8 py-3.5 flex items-center justify-center gap-2 text-sm"
            >
              <span>Receive & Pay</span>
            </Link>
          </div>
        </div>
      </section>

      {/* Interactive FHE Encryption Simulator */}
      <section className="max-w-4xl mx-auto px-4 pb-20">
        <div className="border-4 border-black dark:border-white bg-white dark:bg-[#121620] p-6 md:p-8 relative shadow-[8px_8px_0px_0px_#000000] dark:shadow-[8px_8px_0px_0px_#ffffff]">
          <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none">
            <Terminal size={140} />
          </div>

          <div className="relative mb-8 text-center md:text-left max-w-xl">
            <h2 className="text-xl md:text-2xl font-black uppercase tracking-wide">FHE Flow Visualizer</h2>
            <p className="text-gray-600 dark:text-gray-400 text-xs md:text-sm font-black mt-1 uppercase tracking-wide">
              See how TFHE operates on-chain. Plaintext inputs are masked client-side.
            </p>
          </div>

          {/* Three-step visual columns */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 relative z-10">
            {/* Column 1: Client Side Input */}
            <div className="card-brutal-blue p-5 flex flex-col justify-between space-y-4">
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-xs font-black text-blue-600 dark:text-blue-400 uppercase tracking-wider">
                  <span className="w-2.5 h-2.5 rounded-none bg-blue-600 border border-black dark:border-white" />
                  <span>1. Browser Input</span>
                </div>
                <div className="bg-[#f4f2ec] dark:bg-[#151821] border-[3px] border-black dark:border-white p-4 space-y-3">
                  <div>
                    <label className="block text-xxs text-gray-550 dark:text-gray-400 uppercase font-mono font-bold mb-1">Invoice Value</label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 font-mono font-bold">$</span>
                      <input
                        type="text"
                        value={amountInput}
                        onChange={(e) => {
                          if (encryptStep === "idle") setAmountInput(e.target.value);
                        }}
                        disabled={encryptStep !== "idle"}
                        className="w-full bg-white dark:bg-[#121620] border-[3px] border-black dark:border-white pl-7 pr-3 py-2 text-sm font-mono text-black dark:text-white font-bold focus:outline-none focus:bg-[#fcfcfa] dark:focus:bg-[#1d222e] disabled:opacity-75"
                      />
                    </div>
                  </div>
                  <button
                    onClick={triggerEncryptionSim}
                    disabled={encryptStep !== "idle"}
                    className="w-full py-2.5 btn-brutal-blue text-xs flex items-center justify-center gap-1.5"
                  >
                    <Lock size={14} />
                    <span>Encrypt & Send</span>
                  </button>
                </div>
              </div>
              <p className="text-[10px] text-gray-600 dark:text-gray-400 leading-normal font-mono font-bold uppercase">
                *The input amount is mathematically encrypted client-side using the TFHE public key before broadcast.
              </p>
            </div>

            {/* Column 2: On-Chain Ciphertext */}
            <div className="card-brutal-magenta p-5 flex flex-col justify-between space-y-4">
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-xs font-black text-pink-600 dark:text-pink-400 uppercase tracking-wider">
                  <span className="w-2.5 h-2.5 rounded-none bg-pink-600 border border-black dark:border-white" />
                  <span>2. EVM Node View</span>
                </div>
                <div className="bg-[#f4f2ec] dark:bg-[#151821] border-[3px] border-black dark:border-white p-4 font-mono space-y-2 min-h-[120px] flex flex-col justify-center">
                  {encryptStep === "idle" && (
                    <div className="text-center text-xs text-gray-500 dark:text-gray-400 font-bold uppercase">Awaiting input...</div>
                  )}
                  {encryptStep === "encrypting" && (
                    <div className="flex flex-col items-center gap-2 justify-center py-2">
                      <div className="w-6 h-6 border-[3px] border-pink-600 border-t-transparent animate-spin" />
                      <span className="text-[10px] text-pink-600 dark:text-pink-400 font-bold uppercase animate-pulse">Running TFHE.asEuint64()...</span>
                    </div>
                  )}
                  {(encryptStep === "encrypted" || encryptStep === "decrypting" || encryptStep === "decrypted") && (
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-[10px] border-b-[2px] border-black dark:border-white pb-1.5 mb-1.5">
                        <span className="text-pink-600 dark:text-pink-400 font-bold">euint64 handle</span>
                        <span className="badge-brutal-magenta py-0.5 text-[8px]">Shielded</span>
                      </div>
                      <div className="text-[10px] text-gray-600 dark:text-gray-400 break-all leading-normal select-all">
                        {cipherText}
                      </div>
                    </div>
                  )}
                </div>
              </div>
              <p className="text-[10px] text-gray-600 dark:text-gray-400 leading-normal font-mono font-bold uppercase">
                *Ethereum nodes only see this hash. All network calculations (e.g. payInvoice) happen homomorphically.
              </p>
            </div>

            {/* Column 3: Decrypted view */}
            <div className="card-brutal-green p-5 flex flex-col justify-between space-y-4">
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-xs font-black text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">
                  <span className="w-2.5 h-2.5 rounded-none bg-emerald-600 border border-black dark:border-white" />
                  <span>3. Decrypted Recipient</span>
                </div>
                <div className="bg-[#f4f2ec] dark:bg-[#151821] border-[3px] border-black dark:border-white p-4 flex flex-col justify-center min-h-[120px]">
                  {encryptStep === "idle" || encryptStep === "encrypting" ? (
                    <div className="text-center text-xs text-gray-500 dark:text-gray-400 font-bold uppercase">Awaiting encryption...</div>
                  ) : encryptStep === "encrypted" ? (
                    <button
                      onClick={triggerDecryptionSim}
                      className="w-full py-2.5 btn-brutal-green text-xs flex items-center justify-center gap-1.5"
                    >
                      <Unlock size={14} />
                      <span>Decrypt</span>
                    </button>
                  ) : encryptStep === "decrypting" ? (
                    <div className="flex flex-col items-center gap-2 justify-center py-2">
                      <div className="w-6 h-6 border-[3px] border-emerald-600 border-t-transparent animate-spin" />
                      <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold uppercase animate-pulse">Permit signature...</span>
                    </div>
                  ) : (
                    <div className="text-center space-y-1">
                      <div className="inline-flex items-center justify-center w-7 h-7 rounded-none bg-emerald-100 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 mb-1 border-2 border-emerald-500 dark:border-emerald-400">
                        <CheckCircle2 size={16} />
                      </div>
                      <div className="text-lg font-black text-black dark:text-white font-mono tabular-nums">${amountInput} USDT</div>
                      <div className="text-[9px] text-emerald-600 dark:text-emerald-400 font-mono font-bold uppercase">Decrypted successfully</div>
                    </div>
                  )}
                </div>
              </div>
              <div className="flex justify-between items-center gap-2 font-mono">
                <p className="text-[10px] text-gray-650 dark:text-gray-400 leading-normal font-bold">
                  *Only keyholders decrypt via EIP-712.
                </p>
                {encryptStep === "decrypted" && (
                  <button
                    onClick={resetSimulation}
                    className="text-xs text-red-500 hover:text-red-400 font-black uppercase underline decoration-2 decoration-red-500"
                  >
                    Reset
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Core Pillars / Feature section */}
      <section className="max-w-4xl mx-auto px-4 pb-16 grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="card-brutal-cyan p-6 space-y-3">
          <div className="w-11 h-11 border-[3px] border-black dark:border-white bg-cyan-400 flex items-center justify-center text-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] dark:shadow-[2px_2px_0px_0px_rgba(255,255,255,1)]">
            <EyeOff size={22} />
          </div>
          <h3 className="font-black text-lg text-black dark:text-white uppercase tracking-wide">Confidential Amounts</h3>
          <p className="text-xs text-gray-700 dark:text-gray-300 leading-relaxed font-semibold">
            Invoice amounts, balances, and transfer sizes are fully hidden on the blockchain. Shielded arithmetic prevents public monitoring of business relations.
          </p>
        </div>

        <div className="card-brutal-magenta p-6 space-y-3">
          <div className="w-11 h-11 border-[3px] border-black dark:border-white bg-pink-400 flex items-center justify-center text-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] dark:shadow-[2px_2px_0px_0px_rgba(255,255,255,1)]">
            <ShieldCheck size={22} />
          </div>
          <h3 className="font-black text-lg text-black dark:text-white uppercase tracking-wide">Verifiable Proof</h3>
          <p className="text-xs text-gray-700 dark:text-gray-300 leading-relaxed font-semibold">
            Need to prove an invoice was settled? Anyone can call the contract's `isInvoicePaid` function to check the boolean flag, proving settlement without disclosing costs.
          </p>
        </div>

        <div className="card-brutal-yellow p-6 space-y-3">
          <div className="w-11 h-11 border-[3px] border-black dark:border-white bg-yellow-400 flex items-center justify-center text-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] dark:shadow-[2px_2px_0px_0px_rgba(255,255,255,1)]">
            <Zap size={22} />
          </div>
          <h3 className="font-black text-lg text-black dark:text-white uppercase tracking-wide">Native Settlement</h3>
          <p className="text-xs text-gray-700 dark:text-gray-300 leading-relaxed font-semibold">
            No complex trust parameters or off-chain state verification networks. Settlements occur inside Ethereum EVM transactions, executing securely on Sepolia testnet.
          </p>
        </div>
      </section>

      {/* Tech Architecture Step-by-Step */}
      <section className="max-w-4xl mx-auto px-4 pb-20 space-y-8">
        <div className="text-center max-w-xl mx-auto space-y-2">
          <h2 className="text-2xl font-black uppercase tracking-wider">Flow Architecture</h2>
          <p className="text-sm text-gray-600 dark:text-gray-400 font-black uppercase tracking-wide">
            How ConfidentialPay utilizes Zama's FHEVM protocol to manage invoices.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {/* Step 1 */}
          <div className="border-[3px] border-black dark:border-white p-5 bg-white dark:bg-[#121620] shadow-[4px_4px_0px_0px_#60a5fa] relative flex flex-col justify-between min-h-[160px] hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-[6px_6px_0px_0px_#60a5fa] transition-all">
            <div className="badge-brutal-blue self-start">STEP 01</div>
            <div className="mt-4">
              <h4 className="font-black text-sm uppercase">Encrypt Local</h4>
              <p className="text-[10px] text-gray-600 dark:text-gray-400 leading-normal font-bold uppercase mt-1">
                Sender fills invoice. Zama SDK encrypts amount on-device using the network public key.
              </p>
            </div>
          </div>

          {/* Step 2 */}
          <div className="border-[3px] border-black dark:border-white p-5 bg-white dark:bg-[#121620] shadow-[4px_4px_0px_0px_#f472b6] relative flex flex-col justify-between min-h-[160px] hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-[6px_6px_0px_0px_#f472b6] transition-all">
            <div className="badge-brutal-magenta self-start">STEP 02</div>
            <div className="mt-4">
              <h4 className="font-black text-sm uppercase">On-Chain Save</h4>
              <p className="text-[10px] text-gray-600 dark:text-gray-400 leading-normal font-bold uppercase mt-1">
                InvoiceVault registers invoice. The value is stored securely as an encrypted FHE `euint64` handle.
              </p>
            </div>
          </div>

          {/* Step 3 */}
          <div className="border-[3px] border-black dark:border-white p-5 bg-white dark:bg-[#121620] shadow-[4px_4px_0px_0px_#4ade80] relative flex flex-col justify-between min-h-[160px] hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-[6px_6px_0px_0px_#4ade80] transition-all">
            <div className="badge-brutal-green self-start">STEP 03</div>
            <div className="mt-4">
              <h4 className="font-black text-sm uppercase">FHE Transfer</h4>
              <p className="text-[10px] text-gray-600 dark:text-gray-400 leading-normal font-bold uppercase mt-1">
                Recipient pays. cUSDT handles transfers on-chain homomorphically, masking balances.
              </p>
            </div>
          </div>

          {/* Step 4 */}
          <div className="border-[3px] border-black dark:border-white p-5 bg-white dark:bg-[#121620] shadow-[4px_4px_0px_0px_#facc15] relative flex flex-col justify-between min-h-[160px] hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-[6px_6px_0px_0px_#facc15] transition-all">
            <div className="badge-brutal-yellow self-start">STEP 04</div>
            <div className="mt-4">
              <h4 className="font-black text-sm uppercase">Permit Decrypt</h4>
              <p className="text-[10px] text-gray-600 dark:text-gray-400 leading-normal font-bold uppercase mt-1">
                Only sender or recipient can generate EIP-712 permit to decrypt and view their invoice values.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Accordions */}
      <section className="max-w-2xl mx-auto px-4 pb-20 space-y-8 text-black dark:text-white">
        <h2 className="text-2xl font-black uppercase tracking-wider text-center">Frequently Asked Questions</h2>
        <div className="space-y-4">
          {faqs.map((faq, index) => {
            const isOpen = activeFaq === index;
            return (
              <div
                key={index}
                className={`border-[3px] border-black dark:border-white bg-white dark:bg-[#121620] transition-all shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] dark:shadow-[4px_4px_0px_0px_rgba(255,255,255,1)] ${
                  isOpen ? "shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] dark:shadow-[2px_2px_0px_0px_rgba(255,255,255,1)] translate-x-[2px] translate-y-[2px]" : ""
                }`}
              >
                <button
                  onClick={() => setActiveFaq(isOpen ? null : index)}
                  className="w-full flex items-center justify-between gap-4 p-5 text-left font-black text-sm md:text-base text-black dark:text-white uppercase"
                >
                  <span>{faq.q}</span>
                  <ChevronDown
                    size={18}
                    className={`text-black dark:text-white transition-transform duration-150 ${isOpen ? "rotate-180 text-red-500 dark:text-red-400" : ""}`}
                  />
                </button>
                <div
                  className={`transition-all duration-150 ease-out overflow-hidden ${
                    isOpen ? "max-h-[300px] border-t-[3px] border-black dark:border-white p-5 pt-4 bg-[#f4f2ec] dark:bg-[#151821]" : "max-h-0"
                  }`}
                >
                  <p className="text-xs md:text-sm text-gray-700 dark:text-gray-300 leading-relaxed font-semibold">
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
