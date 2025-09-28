import { HardhatEthersSigner } from "@nomicfoundation/hardhat-ethers/signers";
import { ethers, fhevm } from "hardhat";
import { CustomerDB, CustomerDB__factory } from "../types";
import { expect } from "chai";
import { FhevmType } from "@fhevm/hardhat-plugin";

type Signers = {
  deployer: HardhatEthersSigner;
  alice: HardhatEthersSigner;
  bob: HardhatEthersSigner;
};

async function deployFixture() {
  const factory = (await ethers.getContractFactory("CustomerDB")) as CustomerDB__factory;
  const customerDBContract = (await factory.deploy()) as CustomerDB;
  const customerDBContractAddress = await customerDBContract.getAddress();

  return { customerDBContract, customerDBContractAddress };
}

describe("CustomerDB", function () {
  let signers: Signers;
  let customerDBContract: CustomerDB;
  let customerDBContractAddress: string;

  before(async function () {
    const ethSigners: HardhatEthersSigner[] = await ethers.getSigners();
    signers = { deployer: ethSigners[0], alice: ethSigners[1], bob: ethSigners[2] };
  });

  beforeEach(async function () {
    // Check whether the tests are running against an FHEVM mock environment
    if (!fhevm.isMock) {
      console.warn(`This hardhat test suite cannot run on Sepolia Testnet`);
      this.skip();
    }

    ({ customerDBContract, customerDBContractAddress } = await deployFixture());
  });

  it("should have zero purchases initially", async function () {
    const purchaseCount = await customerDBContract.getPurchaseCount(signers.alice.address);
    expect(purchaseCount).to.eq(0);

    const totalPurchases = await customerDBContract.getTotalPurchases();
    expect(totalPurchases).to.eq(0);
  });

  it("should add a purchase successfully", async function () {
    const productId = 1001;
    const price = 2500;
    const quantity = 2;

    // Encrypt the purchase data
    const encryptedInput = await fhevm
      .createEncryptedInput(customerDBContractAddress, signers.alice.address)
      .add32(productId)
      .add64(price)
      .add32(quantity)
      .encrypt();

    const tx = await customerDBContract
      .connect(signers.alice)
      .addPurchase(
        encryptedInput.handles[0], // productId
        encryptedInput.handles[1], // price
        encryptedInput.handles[2], // quantity
        encryptedInput.inputProof
      );
    await tx.wait();

    // Check purchase count increased
    const purchaseCount = await customerDBContract.getPurchaseCount(signers.alice.address);
    expect(purchaseCount).to.eq(1);

    const totalPurchases = await customerDBContract.getTotalPurchases();
    expect(totalPurchases).to.eq(1);
  });

  it("should retrieve and decrypt purchase data correctly", async function () {
    const productId = 1001;
    const price = 2500;
    const quantity = 2;

    // Add a purchase
    const encryptedInput = await fhevm
      .createEncryptedInput(customerDBContractAddress, signers.alice.address)
      .add32(productId)
      .add64(price)
      .add32(quantity)
      .encrypt();

    const tx = await customerDBContract
      .connect(signers.alice)
      .addPurchase(
        encryptedInput.handles[0],
        encryptedInput.handles[1],
        encryptedInput.handles[2],
        encryptedInput.inputProof
      );
    await tx.wait();

    // Retrieve and decrypt the purchase
    const [encryptedProductId, encryptedPrice, encryptedQuantity, timestamp] =
      await customerDBContract.getMyPurchase(0);

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

    expect(clearProductId).to.eq(productId);
    expect(clearPrice).to.eq(price);
    expect(clearQuantity).to.eq(quantity);
    expect(timestamp).to.be.greaterThan(0);
  });

  it("should allow multiple purchases for the same user", async function () {
    const purchases = [
      { productId: 1001, price: 2500, quantity: 2 },
      { productId: 1002, price: 3000, quantity: 1 },
      { productId: 1003, price: 1500, quantity: 3 },
    ];

    // Add multiple purchases
    for (const purchase of purchases) {
      const encryptedInput = await fhevm
        .createEncryptedInput(customerDBContractAddress, signers.alice.address)
        .add32(purchase.productId)
        .add64(purchase.price)
        .add32(purchase.quantity)
        .encrypt();

      const tx = await customerDBContract
        .connect(signers.alice)
        .addPurchase(
          encryptedInput.handles[0],
          encryptedInput.handles[1],
          encryptedInput.handles[2],
          encryptedInput.inputProof
        );
      await tx.wait();
    }

    // Check purchase count
    const purchaseCount = await customerDBContract.getPurchaseCount(signers.alice.address);
    expect(purchaseCount).to.eq(purchases.length);

    // Verify each purchase
    for (let i = 0; i < purchases.length; i++) {
      const [encryptedProductId, encryptedPrice, encryptedQuantity] =
        await customerDBContract.getMyPurchase(i);

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
    }
  });

  it("should isolate purchases between different users", async function () {
    const alicePurchase = { productId: 1001, price: 2500, quantity: 2 };
    const bobPurchase = { productId: 1002, price: 3000, quantity: 1 };

    // Alice adds a purchase
    let encryptedInput = await fhevm
      .createEncryptedInput(customerDBContractAddress, signers.alice.address)
      .add32(alicePurchase.productId)
      .add64(alicePurchase.price)
      .add32(alicePurchase.quantity)
      .encrypt();

    let tx = await customerDBContract
      .connect(signers.alice)
      .addPurchase(
        encryptedInput.handles[0],
        encryptedInput.handles[1],
        encryptedInput.handles[2],
        encryptedInput.inputProof
      );
    await tx.wait();

    // Bob adds a purchase
    encryptedInput = await fhevm
      .createEncryptedInput(customerDBContractAddress, signers.bob.address)
      .add32(bobPurchase.productId)
      .add64(bobPurchase.price)
      .add32(bobPurchase.quantity)
      .encrypt();

    tx = await customerDBContract
      .connect(signers.bob)
      .addPurchase(
        encryptedInput.handles[0],
        encryptedInput.handles[1],
        encryptedInput.handles[2],
        encryptedInput.inputProof
      );
    await tx.wait();

    // Check that each user has their own purchases
    const aliceCount = await customerDBContract.getPurchaseCount(signers.alice.address);
    const bobCount = await customerDBContract.getPurchaseCount(signers.bob.address);

    expect(aliceCount).to.eq(1);
    expect(bobCount).to.eq(1);

    // Verify Alice can only decrypt her own data
    const [aliceProductId] = await customerDBContract.connect(signers.alice).getMyPurchase(0);
    const clearAliceProductId = await fhevm.userDecryptEuint(
      FhevmType.euint32,
      aliceProductId,
      customerDBContractAddress,
      signers.alice,
    );
    expect(clearAliceProductId).to.eq(alicePurchase.productId);

    // Verify Bob can only decrypt his own data
    const [bobProductId] = await customerDBContract.connect(signers.bob).getMyPurchase(0);
    const clearBobProductId = await fhevm.userDecryptEuint(
      FhevmType.euint32,
      bobProductId,
      customerDBContractAddress,
      signers.bob,
    );
    expect(clearBobProductId).to.eq(bobPurchase.productId);
  });

  it("should revert when accessing non-existent purchase", async function () {
    // Try to access purchase at index 0 when no purchases exist
    await expect(customerDBContract.getMyPurchase(0)).to.be.revertedWith("Invalid purchase index");
  });

  it("should check purchase existence correctly", async function () {
    // Check non-existent purchase
    expect(await customerDBContract.purchaseExists(0)).to.be.false;

    // Add a purchase
    const encryptedInput = await fhevm
      .createEncryptedInput(customerDBContractAddress, signers.alice.address)
      .add32(1001)
      .add64(2500)
      .add32(2)
      .encrypt();

    const tx = await customerDBContract
      .connect(signers.alice)
      .addPurchase(
        encryptedInput.handles[0],
        encryptedInput.handles[1],
        encryptedInput.handles[2],
        encryptedInput.inputProof
      );
    await tx.wait();

    // Check that purchase now exists
    expect(await customerDBContract.purchaseExists(0)).to.be.true;
  });
});