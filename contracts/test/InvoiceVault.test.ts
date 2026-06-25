import { expect } from "chai";
import { ethers } from "hardhat";
import * as hre from "hardhat";
import { InvoiceVault } from "../typechain-types";

describe("InvoiceVault", () => {
  let vault: InvoiceVault;
  let mockCUSDT: string;
  let mock: any;
  let sender: any, recipient: any, stranger: any;

  beforeEach(async () => {
    [sender, recipient, stranger] = await ethers.getSigners();

    // Deploy a minimal ERC-20 mock as cUSDT stand-in for unit tests
    const MockToken = await ethers.getContractFactory("MockERC20");
    mock = await MockToken.deploy("Confidential USDT", "cUSDT");
    mockCUSDT = await mock.getAddress();

    const InvoiceVault = await ethers.getContractFactory("InvoiceVault");
    vault = await InvoiceVault.deploy(mockCUSDT) as InvoiceVault;

    await hre.fhevm.assertCoprocessorInitialized(vault, "InvoiceVault");
  });

  describe("createInvoice", () => {
    it("creates an invoice and emits InvoiceCreated", async () => {
      const { encAmount, inputProof } = await createEncryptedAmount(1000n, await vault.getAddress(), sender.address);

      const tx = await vault.connect(sender).createInvoice(
        recipient.address,
        encAmount,
        inputProof,
        "ipfs://QmMockMetadata"
      );
      const receipt = await tx.wait();
      const block = await ethers.provider.getBlock(receipt!.blockNumber);
      const timestamp = block!.timestamp;

      await expect(tx)
        .to.emit(vault, "InvoiceCreated")
        .withArgs(0, sender.address, recipient.address, timestamp);
    });

    it("reverts when recipient is zero address", async () => {
      await expect(
        vault.connect(sender).createInvoice(
          ethers.ZeroAddress,
          ethers.toBeHex(100n, 32),
          "0x",
          "ipfs://test"
        )
      ).to.be.revertedWithCustomError(vault, "ZeroAddress");
    });

    it("reverts when sender tries to invoice themselves", async () => {
      await expect(
        vault.connect(sender).createInvoice(
          sender.address,
          ethers.toBeHex(100n, 32),
          "0x",
          "ipfs://test"
        )
      ).to.be.revertedWithCustomError(vault, "NotAuthorized");
    });
  });

  describe("getInvoiceMeta", () => {
    it("returns correct metadata after creation", async () => {
      const { encAmount, inputProof } = await createEncryptedAmount(500n, await vault.getAddress(), sender.address);
      await vault.connect(sender).createInvoice(
        recipient.address, encAmount, inputProof, "ipfs://QmTest"
      );

      const [id, s, r, uri, , status] = await vault.getInvoiceMeta(0);
      expect(id).to.equal(0);
      expect(s).to.equal(sender.address);
      expect(r).to.equal(recipient.address);
      expect(uri).to.equal("ipfs://QmTest");
      expect(status).to.equal(0); // Pending
    });
  });

  describe("cancelInvoice", () => {
    it("allows sender to cancel a pending invoice", async () => {
      const { encAmount, inputProof } = await createEncryptedAmount(200n, await vault.getAddress(), sender.address);
      await vault.connect(sender).createInvoice(
        recipient.address, encAmount, inputProof, "ipfs://x"
      );
      await expect(vault.connect(sender).cancelInvoice(0))
        .to.emit(vault, "InvoiceCancelled").withArgs(0);

      const [,,,,,status] = await vault.getInvoiceMeta(0);
      expect(status).to.equal(2); // Cancelled
    });

    it("reverts if stranger tries to cancel", async () => {
      const { encAmount, inputProof } = await createEncryptedAmount(200n, await vault.getAddress(), sender.address);
      await vault.connect(sender).createInvoice(
        recipient.address, encAmount, inputProof, "ipfs://x"
      );
      await expect(vault.connect(stranger).cancelInvoice(0))
        .to.be.revertedWithCustomError(vault, "NotAuthorized");
    });
  });

  describe("payInvoice", () => {
    it("allows recipient to pay a pending invoice", async () => {
      const { encAmount, inputProof } = await createEncryptedAmount(1500n, await vault.getAddress(), sender.address);
      await vault.connect(sender).createInvoice(
        recipient.address, encAmount, inputProof, "ipfs://invoice-to-pay"
      );
      await mock.connect(recipient).setOperator(await vault.getAddress(), Math.floor(Date.now() / 1000) + 3600);

      const tx = await vault.connect(recipient).payInvoice(0);
      const receipt = await tx.wait();
      const block = await ethers.provider.getBlock(receipt!.blockNumber);
      const timestamp = block!.timestamp;

      await expect(tx)
        .to.emit(vault, "InvoicePaid")
        .withArgs(0, timestamp);

      const [,,,,,status] = await vault.getInvoiceMeta(0);
      expect(status).to.equal(1); // Paid
    });

    it("reverts when a stranger tries to pay", async () => {
      const { encAmount, inputProof } = await createEncryptedAmount(1500n, await vault.getAddress(), sender.address);
      await vault.connect(sender).createInvoice(
        recipient.address, encAmount, inputProof, "ipfs://invoice-to-pay"
      );
      await mock.connect(stranger).setOperator(await vault.getAddress(), Math.floor(Date.now() / 1000) + 3600);

      await expect(vault.connect(stranger).payInvoice(0))
        .to.be.revertedWithCustomError(vault, "NotAuthorized");
    });

    it("reverts when recipient has not approved the vault as operator", async () => {
      const { encAmount, inputProof } = await createEncryptedAmount(1500n, await vault.getAddress(), sender.address);
      await vault.connect(sender).createInvoice(
        recipient.address, encAmount, inputProof, "ipfs://invoice-to-pay"
      );

      await expect(vault.connect(recipient).payInvoice(0))
        .to.be.revertedWithCustomError(vault, "OperatorNotSet");
    });
  });

  describe("isInvoicePaid", () => {
    it("returns false for a new invoice", async () => {
      const { encAmount, inputProof } = await createEncryptedAmount(100n, await vault.getAddress(), sender.address);
      await vault.connect(sender).createInvoice(
        recipient.address, encAmount, inputProof, "ipfs://y"
      );
      expect(await vault.isInvoicePaid(0)).to.equal(false);
    });
  });

  describe("dashboard queries", () => {
    it("tracks sent and received invoice IDs", async () => {
      const amount1 = await createEncryptedAmount(300n, await vault.getAddress(), sender.address);
      await vault.connect(sender).createInvoice(
        recipient.address, amount1.encAmount, amount1.inputProof, "ipfs://a"
      );
      const amount2 = await createEncryptedAmount(400n, await vault.getAddress(), sender.address);
      await vault.connect(sender).createInvoice(
        recipient.address, amount2.encAmount, amount2.inputProof, "ipfs://b"
      );

      const sent = await vault.getSentInvoiceIds(sender.address);
      const received = await vault.getReceivedInvoiceIds(recipient.address);

      expect(sent.length).to.equal(2);
      expect(received.length).to.equal(2);
      expect(sent[0]).to.equal(0n);
      expect(sent[1]).to.equal(1n);
    });
  });
});

async function createEncryptedAmount(value: number | bigint, contractAddress: string, userAddress: string) {
  const input = hre.fhevm.createEncryptedInput(contractAddress, userAddress);
  input.add64(value);
  const encrypted = await input.encrypt();
  return {
    encAmount: encrypted.handles[0],
    inputProof: encrypted.inputProof
  };
}
