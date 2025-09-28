import { HardhatEthersSigner } from "@nomicfoundation/hardhat-ethers/signers";
import { ethers, fhevm, deployments } from "hardhat";
import { CustomerDB } from "../types";
import { expect } from "chai";
import { FhevmType } from "@fhevm/hardhat-plugin";

type Signers = {
  alice: HardhatEthersSigner;
};

describe("CustomerDBSepolia", function () {
  let signers: Signers;
  let customerDBContract: CustomerDB;
  let customerDBContractAddress: string;
  let step: number;
  let steps: number;

  function progress(message: string) {
    console.log(`${++step}/${steps} ${message}`);
  }

  before(async function () {
    if (fhevm.isMock) {
      console.warn(`This hardhat test suite can only run on Sepolia Testnet`);
      this.skip();
    }

    try {
      const CustomerDBDeployment = await deployments.get("CustomerDB");
      customerDBContractAddress = CustomerDBDeployment.address;
      customerDBContract = await ethers.getContractAt("CustomerDB", CustomerDBDeployment.address);
    } catch (e) {
      (e as Error).message += ". Call 'npx hardhat deploy --network sepolia --tags CustomerDB'";
      throw e;
    }

    const ethSigners: HardhatEthersSigner[] = await ethers.getSigners();
    signers = { alice: ethSigners[0] };
  });

  beforeEach(async () => {
    step = 0;
    steps = 0;
  });

  it("should add a purchase and retrieve it successfully", async function () {
    steps = 8;

    this.timeout(4 * 60000);

    const productId = 1001;
    const price = 2500;
    const quantity = 2;

    progress(`Getting initial purchase count for ${signers.alice.address}...`);
    const initialCount = await customerDBContract.getPurchaseCount(signers.alice.address);
    progress(`Initial purchase count: ${initialCount}`);

    progress(`Encrypting purchase data (productId: ${productId}, price: ${price}, quantity: ${quantity})...`);
    const encryptedInput = await fhevm
      .createEncryptedInput(customerDBContractAddress, signers.alice.address)
      .add32(productId)
      .add64(price)
      .add32(quantity)
      .encrypt();

    progress(
      `Call addPurchase() CustomerDB=${customerDBContractAddress} handles=[${ethers.hexlify(encryptedInput.handles[0])}, ${ethers.hexlify(encryptedInput.handles[1])}, ${ethers.hexlify(encryptedInput.handles[2])}] signer=${signers.alice.address}...`,
    );
    const tx = await customerDBContract
      .connect(signers.alice)
      .addPurchase(
        encryptedInput.handles[0], // productId
        encryptedInput.handles[1], // price
        encryptedInput.handles[2], // quantity
        encryptedInput.inputProof
      );
    await tx.wait();
    progress(`Transaction completed: ${tx.hash}`);

    progress(`Getting updated purchase count...`);
    const newCount = await customerDBContract.getPurchaseCount(signers.alice.address);
    progress(`New purchase count: ${newCount}`);
    expect(newCount).to.eq(Number(initialCount) + 1);

    progress(`Retrieving encrypted purchase data...`);
    const [encryptedProductId, encryptedPrice, encryptedQuantity, timestamp] =
      await customerDBContract.getMyPurchase(Number(initialCount));

    progress(`Decrypting purchase data...`);
    const clearProductId = await fhevm.userDecryptEuint(
      FhevmType.euint32,
      encryptedProductId,
      customerDBContractAddress,
      signers.alice,
    );

    const clearPrice = await fhevm.userDecryptEuint(
      FhevmType.euint64,
      encryptedPrice,
      customerDBContractAddress,
      signers.alice,
    );

    const clearQuantity = await fhevm.userDecryptEuint(
      FhevmType.euint32,
      encryptedQuantity,
      customerDBContractAddress,
      signers.alice,
    );

    progress(
      `Decrypted values - ProductID: ${clearProductId}, Price: ${clearPrice}, Quantity: ${clearQuantity}, Timestamp: ${timestamp}`,
    );

    expect(clearProductId).to.eq(productId);
    expect(clearPrice).to.eq(price);
    expect(clearQuantity).to.eq(quantity);
    expect(timestamp).to.be.greaterThan(0);
  });

  it("should handle multiple purchases correctly", async function () {
    steps = 12;

    this.timeout(6 * 60000);

    const purchases = [
      { productId: 2001, price: 1500, quantity: 1 },
      { productId: 2002, price: 3200, quantity: 3 },
    ];

    progress(`Getting initial purchase count...`);
    const initialCount = await customerDBContract.getPurchaseCount(signers.alice.address);

    for (let i = 0; i < purchases.length; i++) {
      const purchase = purchases[i];

      progress(`Encrypting purchase ${i + 1} data (productId: ${purchase.productId}, price: ${purchase.price}, quantity: ${purchase.quantity})...`);
      const encryptedInput = await fhevm
        .createEncryptedInput(customerDBContractAddress, signers.alice.address)
        .add32(purchase.productId)
        .add64(purchase.price)
        .add32(purchase.quantity)
        .encrypt();

      progress(`Adding purchase ${i + 1}...`);
      const tx = await customerDBContract
        .connect(signers.alice)
        .addPurchase(
          encryptedInput.handles[0],
          encryptedInput.handles[1],
          encryptedInput.handles[2],
          encryptedInput.inputProof
        );
      await tx.wait();
      progress(`Purchase ${i + 1} added successfully`);
    }

    progress(`Getting final purchase count...`);
    const finalCount = await customerDBContract.getPurchaseCount(signers.alice.address);
    expect(finalCount).to.eq(Number(initialCount) + purchases.length);

    // Verify the last two purchases
    for (let i = 0; i < purchases.length; i++) {
      const purchaseIndex = Number(initialCount) + i;
      progress(`Retrieving and decrypting purchase ${purchaseIndex}...`);

      const [encryptedProductId, encryptedPrice, encryptedQuantity] =
        await customerDBContract.getMyPurchase(purchaseIndex);

      const clearProductId = await fhevm.userDecryptEuint(
        FhevmType.euint32,
        encryptedProductId,
        customerDBContractAddress,
        signers.alice,
      );

      const clearPrice = await fhevm.userDecryptEuint(
        FhevmType.euint64,
        encryptedPrice,
        customerDBContractAddress,
        signers.alice,
      );

      const clearQuantity = await fhevm.userDecryptEuint(
        FhevmType.euint32,
        encryptedQuantity,
        customerDBContractAddress,
        signers.alice,
      );

      expect(clearProductId).to.eq(purchases[i].productId);
      expect(clearPrice).to.eq(purchases[i].price);
      expect(clearQuantity).to.eq(purchases[i].quantity);

      progress(`Purchase ${purchaseIndex} verified successfully`);
    }
  });
});