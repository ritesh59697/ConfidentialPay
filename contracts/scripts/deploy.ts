import { ethers } from "hardhat";

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("Deploying ConfidentialPay contracts with:", deployer.address);
  console.log("Balance:", ethers.formatEther(await ethers.provider.getBalance(deployer.address)), "ETH");

  let cusdtAddress = process.env.CUSDT_ADDRESS;

  if (!cusdtAddress || cusdtAddress === "0x0000000000000000000000000000000000000000") {
    console.log("\n⚠️  No CUSDT_ADDRESS found in environment. Deploying MockERC20 on Sepolia...");
    const MockERC20 = await ethers.getContractFactory("MockERC20");
    const mock = await MockERC20.deploy("Confidential USDT Mock", "cUSDT");
    await mock.waitForDeployment();
    cusdtAddress = await mock.getAddress();
    console.log("✅ MockERC20 deployed to:", cusdtAddress);
  } else {
    console.log("Using existing cUSDT contract at:", cusdtAddress);
  }

  const InvoiceVault = await ethers.getContractFactory("InvoiceVault");
  const vault = await InvoiceVault.deploy(cusdtAddress);
  await vault.waitForDeployment();

  const vaultAddress = await vault.getAddress();
  console.log("\n✅ InvoiceVault deployed to:", vaultAddress);

  console.log("\nNext steps:");
  console.log("  1. Copy these environment variables into your frontend/.env file:");
  console.log(`     VITE_INVOICE_VAULT_ADDRESS="${vaultAddress}"`);
  console.log(`     VITE_CUSDT_ADDRESS="${cusdtAddress}"`);
  console.log(`  2. Verify contracts on Etherscan:`);
  console.log(`     npx hardhat verify --network sepolia ${vaultAddress} ${cusdtAddress}`);
  if (!process.env.CUSDT_ADDRESS || process.env.CUSDT_ADDRESS === "0x0000000000000000000000000000000000000000") {
    console.log(`     npx hardhat verify --network sepolia ${cusdtAddress} "Confidential USDT Mock" "cUSDT"`);
  }
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});

