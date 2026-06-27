import { ethers } from "hardhat";

async function main() {
  const addr = "0xB3Bfeee1cA3De9E736A742345C761947962Ca081";
  console.log(`\nConnecting to InvoiceVault at ${addr} on Sepolia...`);
  const vault = await ethers.getContractAt("InvoiceVault", addr);

  try {
    const cUSDT = await vault.cUSDT();
    console.log("  cUSDT address stored in contract:", cUSDT);
  } catch (err: any) {
    console.log("  Failed to fetch cUSDT():", err.message);
  }

  try {
    const protoId = await vault.confidentialProtocolId();
    console.log("  confidentialProtocolId:", protoId.toString());
  } catch (err: any) {
    console.log("  Failed to fetch confidentialProtocolId():", err.message);
  }

  try {
    const nextId = await vault.nextInvoiceId();
    console.log("  nextInvoiceId:", nextId.toString());
  } catch (err: any) {
    console.log("  Failed to fetch nextInvoiceId():", err.message);
  }
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});
