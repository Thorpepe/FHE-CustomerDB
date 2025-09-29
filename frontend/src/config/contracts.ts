// CustomerDB contract on Sepolia
// Replace `CONTRACT_ADDRESS` with the deployed address.
// Copy ABI from deployments/sepolia/CustomerDB.json to keep in sync.
export const CONTRACT_ADDRESS = '';

export const CONTRACT_ABI = [
  {
    inputs: [
      { internalType: 'address', name: 'customer', type: 'address' },
      { internalType: 'externalEuint32', name: 'itemIdExt', type: 'bytes32' },
      { internalType: 'externalEuint32', name: 'priceExt', type: 'bytes32' },
      { internalType: 'externalEuint32', name: 'quantityExt', type: 'bytes32' },
      { internalType: 'bytes', name: 'inputProof', type: 'bytes' },
    ],
    name: 'addPurchase',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [{ internalType: 'address', name: 'customer', type: 'address' }],
    name: 'getPurchaseCount',
    outputs: [{ internalType: 'uint256', name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [
      { internalType: 'address', name: 'customer', type: 'address' },
      { internalType: 'uint256', name: 'index', type: 'uint256' },
    ],
    name: 'getPurchaseAt',
    outputs: [
      { internalType: 'euint32', name: 'itemId', type: 'bytes32' },
      { internalType: 'euint32', name: 'price', type: 'bytes32' },
      { internalType: 'euint32', name: 'quantity', type: 'bytes32' },
      { internalType: 'uint64', name: 'timestamp', type: 'uint64' },
    ],
    stateMutability: 'view',
    type: 'function',
  },
] as const;

