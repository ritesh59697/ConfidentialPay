import { ethers } from "hardhat";

async function main() {
  const txHash = "0x78b28eb806ff4f73406087ad95b432be51421cd6b65ca978e91b8383b8edc3cd";
  console.log(`Fetching tx: ${txHash}...`);
  const tx = await ethers.provider.getTransaction(txHash);
  if (!tx) {
    console.log("Transaction not found");
    return;
  }

  const InvoiceVault = await ethers.getContractFactory("InvoiceVault");
  const decoded = InvoiceVault.interface.decodeFunctionData("createInvoice", tx.data);
  
  console.log("Decoded arguments:");
  console.log("  recipient:", decoded[0]);
  console.log("  encAmount.unwrap():", decoded[1]);
  console.log("  inputProof:", ethers.hexlify(decoded[2]));
  console.log("  metadataURI:", decoded[3]);
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});
