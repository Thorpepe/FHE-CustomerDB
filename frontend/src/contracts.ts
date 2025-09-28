// Contract configuration for CustomerDB
export const CUSTOMERDB_ADDRESS = '0x' // This will be filled after deployment

// CustomerDB Contract ABI - will be updated with actual generated ABI after deployment
export const CUSTOMERDB_ABI = [
  {
    "type": "function",
    "name": "addPurchase",
    "inputs": [
      {
        "name": "encryptedProductId",
        "type": "uint256",
        "internalType": "externalEuint32"
      },
      {
        "name": "encryptedPrice",
        "type": "uint256",
        "internalType": "externalEuint64"
      },
      {
        "name": "encryptedQuantity",
        "type": "uint256",
        "internalType": "externalEuint32"
      },
      {
        "name": "inputProof",
        "type": "bytes",
        "internalType": "bytes"
      }
    ],
    "outputs": [],
    "stateMutability": "nonpayable"
  },
  {
    "type": "function",
    "name": "getPurchaseCount",
    "inputs": [
      {
        "name": "user",
        "type": "address",
        "internalType": "address"
      }
    ],
    "outputs": [
      {
        "name": "",
        "type": "uint256",
        "internalType": "uint256"
      }
    ],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "getMyPurchase",
    "inputs": [
      {
        "name": "index",
        "type": "uint256",
        "internalType": "uint256"
      }
    ],
    "outputs": [
      {
        "name": "productId",
        "type": "uint256",
        "internalType": "euint32"
      },
      {
        "name": "price",
        "type": "uint256",
        "internalType": "euint64"
      },
      {
        "name": "quantity",
        "type": "uint256",
        "internalType": "euint32"
      },
      {
        "name": "timestamp",
        "type": "uint256",
        "internalType": "uint256"
      }
    ],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "getUserPurchaseIds",
    "inputs": [
      {
        "name": "user",
        "type": "address",
        "internalType": "address"
      }
    ],
    "outputs": [
      {
        "name": "",
        "type": "uint256[]",
        "internalType": "uint256[]"
      }
    ],
    "stateMutability": "view"
  },
  {
    "type": "event",
    "name": "PurchaseAdded",
    "inputs": [
      {
        "name": "user",
        "type": "address",
        "indexed": true,
        "internalType": "address"
      },
      {
        "name": "purchaseId",
        "type": "uint256",
        "indexed": true,
        "internalType": "uint256"
      },
      {
        "name": "timestamp",
        "type": "uint256",
        "indexed": false,
        "internalType": "uint256"
      }
    ],
    "anonymous": false
  }
] as const;