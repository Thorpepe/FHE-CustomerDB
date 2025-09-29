import { HardhatEthersSigner } from "@nomicfoundation/hardhat-ethers/signers";
import { ethers, fhevm } from "hardhat";
import { expect } from "chai";
import { CustomerDB, CustomerDB__factory } from "../types";
import { FhevmType } from "@fhevm/hardhat-plugin";

type Signers = {
  deployer: HardhatEthersSigner;
  alice: HardhatEthersSigner;
  bob: HardhatEthersSigner;
};

async function deployFixture() {
  const factory = (await ethers.getContractFactory("CustomerDB")) as CustomerDB__factory;
  const contract = (await factory.deploy()) as CustomerDB;
  const address = await contract.getAddress();
  return { contract, address };
}

describe("CustomerDB", function () {
  let signers: Signers;
  let contract: CustomerDB;
  let contractAddress: string;

  before(async function () {
    const ethSigners: HardhatEthersSigner[] = await ethers.getSigners();
    signers = { deployer: ethSigners[0], alice: ethSigners[1], bob: ethSigners[2] };
  });

  beforeEach(async function () {
    if (!fhevm.isMock) {
      console.warn("This test suite runs only on the local FHEVM mock environment");
      this.skip();
    }
    ({ contract, contractAddress } = await deployFixture());
  });

  it("initial purchase count is zero", async function () {
    const count = await contract.getPurchaseCount(signers.alice.address);
    expect(count).to.eq(0n);
  });

  it("can add and read back an encrypted purchase", async function () {
    const clearItemId = 42;
    const clearPrice = 1999; // e.g. cents
    const clearQty = 3;

    const enc = await fhevm
      .createEncryptedInput(contractAddress, signers.alice.address)
      .add32(clearItemId)
      .add32(clearPrice)
      .add32(clearQty)
      .encrypt();

    const tx = await contract
      .connect(signers.alice)
      .addPurchase(
        signers.alice.address,
        enc.handles[0],
        enc.handles[1],
        enc.handles[2],
        enc.inputProof,
      );
    await tx.wait();

    const count = await contract.getPurchaseCount(signers.alice.address);
    expect(count).to.eq(1n);

    const [itemId, price, qty, ts] = await contract.getPurchaseAt(signers.alice.address, 0);
    expect(ts).to.not.eq(0);

    const decItemId = await fhevm.userDecryptEuint(FhevmType.euint32, itemId, contractAddress, signers.alice);
    const decPrice = await fhevm.userDecryptEuint(FhevmType.euint32, price, contractAddress, signers.alice);
    const decQty = await fhevm.userDecryptEuint(FhevmType.euint32, qty, contractAddress, signers.alice);

    expect(decItemId).to.eq(clearItemId);
    expect(decPrice).to.eq(clearPrice);
    expect(decQty).to.eq(clearQty);
  });
});

