import { createInstance, SepoliaConfig } from '@zama-fhe/relayer-sdk';

let fhevmInstance: any = null;

// Initialize FHE instance
export async function initFHE() {
  if (fhevmInstance) {
    return fhevmInstance;
  }

  try {
    // Check if window.ethereum is available
    if (typeof window !== 'undefined' && window.ethereum) {
      const config = {
        ...SepoliaConfig,
        network: window.ethereum,
      };

      fhevmInstance = await createInstance(config);
      return fhevmInstance;
    } else {
      throw new Error('Ethereum provider not found');
    }
  } catch (error) {
    console.error('Failed to initialize FHE:', error);
    throw error;
  }
}

// Get FHE instance
export function getFHEInstance() {
  if (!fhevmInstance) {
    throw new Error('FHE instance not initialized. Call initFHE() first.');
  }
  return fhevmInstance;
}

// Encrypt purchase data
export async function encryptPurchaseData(
  productId: number,
  price: number,
  quantity: number,
  contractAddress: string,
  userAddress: string
) {
  const instance = getFHEInstance();

  const buffer = instance.createEncryptedInput(contractAddress, userAddress);
  buffer.add32(productId);
  buffer.add64(price);
  buffer.add32(quantity);

  return await buffer.encrypt();
}

// Decrypt purchase data
export async function decryptPurchaseData(
  handles: {
    productId: string;
    price: string;
    quantity: string;
  },
  contractAddress: string,
  signer: any
) {
  const instance = getFHEInstance();

  const keypair = instance.generateKeypair();
  const handleContractPairs = [
    { handle: handles.productId, contractAddress },
    { handle: handles.price, contractAddress },
    { handle: handles.quantity, contractAddress },
  ];

  const startTimeStamp = Math.floor(Date.now() / 1000).toString();
  const durationDays = "10";
  const contractAddresses = [contractAddress];

  const eip712 = instance.createEIP712(
    keypair.publicKey,
    contractAddresses,
    startTimeStamp,
    durationDays
  );

  const signature = await signer.signTypedData(
    eip712.domain,
    {
      UserDecryptRequestVerification: eip712.types.UserDecryptRequestVerification,
    },
    eip712.message
  );

  const result = await instance.userDecrypt(
    handleContractPairs,
    keypair.privateKey,
    keypair.publicKey,
    signature.replace("0x", ""),
    contractAddresses,
    signer.address,
    startTimeStamp,
    durationDays
  );

  return {
    productId: result[handles.productId],
    price: result[handles.price],
    quantity: result[handles.quantity],
  };
}