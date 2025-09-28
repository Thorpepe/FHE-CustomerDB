import { FhevmType } from "@fhevm/hardhat-plugin";
import { task } from "hardhat/config";
import type { TaskArguments } from "hardhat/types";

/**
 * Tutorial: Deploy and Interact Locally (--network localhost)
 * ===========================================================
 *
 * 1. From a separate terminal window:
 *
 *   npx hardhat node
 *
 * 2. Deploy the CustomerDB contract
 *
 *   npx hardhat --network localhost deploy --tags CustomerDB
 *
 * 3. Interact with the CustomerDB contract
 *
 *   npx hardhat --network localhost task:customerdb-address
 *   npx hardhat --network localhost task:add-purchase --productid 1001 --price 2500 --quantity 2
 *   npx hardhat --network localhost task:get-purchase-count
 *   npx hardhat --network localhost task:decrypt-purchase --index 0
 *
 *
 * Tutorial: Deploy and Interact on Sepolia (--network sepolia)
 * ===========================================================
 *
 * 1. Deploy the CustomerDB contract
 *
 *   npx hardhat --network sepolia deploy --tags CustomerDB
 *
 * 2. Interact with the CustomerDB contract
 *
 *   npx hardhat --network sepolia task:customerdb-address
 *   npx hardhat --network sepolia task:add-purchase --productid 1001 --price 2500 --quantity 2
 *   npx hardhat --network sepolia task:get-purchase-count
 *   npx hardhat --network sepolia task:decrypt-purchase --index 0
 *
 */

/**
 * Example:
 *   - npx hardhat --network localhost task:customerdb-address
 *   - npx hardhat --network sepolia task:customerdb-address
 */
task("task:customerdb-address", "Prints the CustomerDB address").setAction(async function (_taskArguments: TaskArguments, hre) {
  const { deployments } = hre;

  const customerDB = await deployments.get("CustomerDB");

  console.log("CustomerDB address is " + customerDB.address);
});

/**
 * Example:
 *   - npx hardhat --network localhost task:add-purchase --productid 1001 --price 2500 --quantity 2
 *   - npx hardhat --network sepolia task:add-purchase --productid 1001 --price 2500 --quantity 2
 */
task("task:add-purchase", "Adds a new purchase to the CustomerDB")
  .addOptionalParam("address", "Optionally specify the CustomerDB contract address")
  .addParam("productid", "Product ID")
  .addParam("price", "Price in wei")
  .addParam("quantity", "Quantity")
  .setAction(async function (taskArguments: TaskArguments, hre) {
    const { ethers, deployments, fhevm } = hre;

    const productId = parseInt(taskArguments.productid);
    const price = parseInt(taskArguments.price);
    const quantity = parseInt(taskArguments.quantity);

    if (!Number.isInteger(productId) || !Number.isInteger(price) || !Number.isInteger(quantity)) {
      throw new Error(`Arguments must be integers`);
    }

    await fhevm.initializeCLIApi();

    const CustomerDBDeployment = taskArguments.address
      ? { address: taskArguments.address }
      : await deployments.get("CustomerDB");
    console.log(`CustomerDB: ${CustomerDBDeployment.address}`);

    const signers = await ethers.getSigners();

    const customerDBContract = await ethers.getContractAt("CustomerDB", CustomerDBDeployment.address);

    // Encrypt the values
    const encryptedInput = await fhevm
      .createEncryptedInput(CustomerDBDeployment.address, signers[0].address)
      .add32(productId)
      .add64(price)
      .add32(quantity)
      .encrypt();

    const tx = await customerDBContract
      .connect(signers[0])
      .addPurchase(
        encryptedInput.handles[0], // productId
        encryptedInput.handles[1], // price
        encryptedInput.handles[2], // quantity
        encryptedInput.inputProof
      );
    console.log(`Wait for tx:${tx.hash}...`);

    const receipt = await tx.wait();
    console.log(`tx:${tx.hash} status=${receipt?.status}`);

    console.log(`Purchase added successfully! ProductID: ${productId}, Price: ${price}, Quantity: ${quantity}`);
  });

/**
 * Example:
 *   - npx hardhat --network localhost task:get-purchase-count
 *   - npx hardhat --network sepolia task:get-purchase-count
 */
task("task:get-purchase-count", "Gets the number of purchases for the caller")
  .addOptionalParam("address", "Optionally specify the CustomerDB contract address")
  .setAction(async function (taskArguments: TaskArguments, hre) {
    const { ethers, deployments } = hre;

    const CustomerDBDeployment = taskArguments.address
      ? { address: taskArguments.address }
      : await deployments.get("CustomerDB");
    console.log(`CustomerDB: ${CustomerDBDeployment.address}`);

    const signers = await ethers.getSigners();

    const customerDBContract = await ethers.getContractAt("CustomerDB", CustomerDBDeployment.address);

    const purchaseCount = await customerDBContract.getPurchaseCount(signers[0].address);
    console.log(`Purchase count for ${signers[0].address}: ${purchaseCount}`);
  });

/**
 * Example:
 *   - npx hardhat --network localhost task:decrypt-purchase --index 0
 *   - npx hardhat --network sepolia task:decrypt-purchase --index 0
 */
task("task:decrypt-purchase", "Decrypts and displays a purchase by index")
  .addOptionalParam("address", "Optionally specify the CustomerDB contract address")
  .addParam("index", "Purchase index")
  .setAction(async function (taskArguments: TaskArguments, hre) {
    const { ethers, deployments, fhevm } = hre;

    const index = parseInt(taskArguments.index);
    if (!Number.isInteger(index)) {
      throw new Error(`Argument --index is not an integer`);
    }

    await fhevm.initializeCLIApi();

    const CustomerDBDeployment = taskArguments.address
      ? { address: taskArguments.address }
      : await deployments.get("CustomerDB");
    console.log(`CustomerDB: ${CustomerDBDeployment.address}`);

    const signers = await ethers.getSigners();

    const customerDBContract = await ethers.getContractAt("CustomerDB", CustomerDBDeployment.address);

    try {
      const [encryptedProductId, encryptedPrice, encryptedQuantity, timestamp] =
        await customerDBContract.getMyPurchase(index);

      if (encryptedProductId === ethers.ZeroHash) {
        console.log("No purchase data found");
        return;
      }

      const clearProductId = await fhevm.userDecryptEuint(
        FhevmType.euint32,
        encryptedProductId,
        CustomerDBDeployment.address,
        signers[0],
      );

      const clearPrice = await fhevm.userDecryptEuint(
        FhevmType.euint64,
        encryptedPrice,
        CustomerDBDeployment.address,
        signers[0],
      );

      const clearQuantity = await fhevm.userDecryptEuint(
        FhevmType.euint32,
        encryptedQuantity,
        CustomerDBDeployment.address,
        signers[0],
      );

      console.log("Purchase Details:");
      console.log(`  Product ID: ${clearProductId}`);
      console.log(`  Price: ${clearPrice}`);
      console.log(`  Quantity: ${clearQuantity}`);
      console.log(`  Timestamp: ${new Date(Number(timestamp) * 1000).toLocaleString()}`);
    } catch (error) {
      console.error("Error decrypting purchase:", error);
    }
  });

/**
 * Example:
 *   - npx hardhat --network localhost task:list-purchases
 *   - npx hardhat --network sepolia task:list-purchases
 */
task("task:list-purchases", "Lists all purchases for the caller (shows encrypted data)")
  .addOptionalParam("address", "Optionally specify the CustomerDB contract address")
  .setAction(async function (taskArguments: TaskArguments, hre) {
    const { ethers, deployments } = hre;

    const CustomerDBDeployment = taskArguments.address
      ? { address: taskArguments.address }
      : await deployments.get("CustomerDB");
    console.log(`CustomerDB: ${CustomerDBDeployment.address}`);

    const signers = await ethers.getSigners();

    const customerDBContract = await ethers.getContractAt("CustomerDB", CustomerDBDeployment.address);

    const purchaseCount = await customerDBContract.getPurchaseCount(signers[0].address);
    console.log(`Total purchases: ${purchaseCount}`);

    for (let i = 0; i < purchaseCount; i++) {
      try {
        const [encryptedProductId, encryptedPrice, encryptedQuantity, timestamp] =
          await customerDBContract.getMyPurchase(i);

        console.log(`\nPurchase ${i}:`);
        console.log(`  Encrypted Product ID: ${encryptedProductId}`);
        console.log(`  Encrypted Price: ${encryptedPrice}`);
        console.log(`  Encrypted Quantity: ${encryptedQuantity}`);
        console.log(`  Timestamp: ${new Date(Number(timestamp) * 1000).toLocaleString()}`);
      } catch (error) {
        console.error(`Error getting purchase ${i}:`, error);
      }
    }
  });