import { useState, useEffect } from 'react'
import { useAccount, useReadContract } from 'wagmi'
import { ethers } from 'ethers'
import { CUSTOMERDB_ADDRESS, CUSTOMERDB_ABI } from '../contracts'
import { decryptPurchaseData } from '../fhe'

interface PurchaseListProps {
  purchaseCount: number
  refreshTrigger: number
}

interface Purchase {
  index: number
  productId: string
  price: string
  quantity: string
  timestamp: bigint
  decrypted?: {
    productId: number
    price: number
    quantity: number
  }
  isDecrypting?: boolean
  decryptError?: string
}

export function PurchaseList({ purchaseCount, refreshTrigger }: PurchaseListProps) {
  const { address } = useAccount()
  const [purchases, setPurchases] = useState<Purchase[]>([])
  const [isLoading, setIsLoading] = useState(false)

  // Fetch purchases when count changes or refresh is triggered
  useEffect(() => {
    if (purchaseCount > 0 && address) {
      fetchPurchases()
    }
  }, [purchaseCount, refreshTrigger, address])

  const fetchPurchases = async () => {
    if (!address) return

    setIsLoading(true)
    const newPurchases: Purchase[] = []

    try {
      // Get provider for reading
      if (!window.ethereum) {
        throw new Error('No ethereum provider found')
      }

      const provider = new ethers.BrowserProvider(window.ethereum)
      const contract = new ethers.Contract(CUSTOMERDB_ADDRESS, CUSTOMERDB_ABI, provider)

      // Fetch all purchases
      for (let i = 0; i < purchaseCount; i++) {
        try {
          const [productId, price, quantity, timestamp] = await contract.getMyPurchase(i)

          newPurchases.push({
            index: i,
            productId: productId.toString(),
            price: price.toString(),
            quantity: quantity.toString(),
            timestamp: timestamp,
          })
        } catch (error) {
          console.error(`Error fetching purchase ${i}:`, error)
        }
      }

      setPurchases(newPurchases)
    } catch (error) {
      console.error('Error fetching purchases:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleDecrypt = async (purchase: Purchase) => {
    if (!address) return

    // Update purchase to show decrypting state
    setPurchases(prev =>
      prev.map(p =>
        p.index === purchase.index
          ? { ...p, isDecrypting: true, decryptError: undefined }
          : p
      )
    )

    try {
      // Get signer for decryption
      if (!window.ethereum) {
        throw new Error('No ethereum provider found')
      }

      const provider = new ethers.BrowserProvider(window.ethereum)
      const signer = await provider.getSigner()

      // Decrypt the purchase data
      const decryptedData = await decryptPurchaseData(
        {
          productId: purchase.productId,
          price: purchase.price,
          quantity: purchase.quantity,
        },
        CUSTOMERDB_ADDRESS,
        signer
      )

      // Update purchase with decrypted data
      setPurchases(prev =>
        prev.map(p =>
          p.index === purchase.index
            ? { ...p, decrypted: decryptedData, isDecrypting: false }
            : p
        )
      )
    } catch (error: any) {
      console.error('Error decrypting purchase:', error)
      setPurchases(prev =>
        prev.map(p =>
          p.index === purchase.index
            ? {
                ...p,
                isDecrypting: false,
                decryptError: error?.message || 'Decryption failed'
              }
            : p
        )
      )
    }
  }

  const formatTimestamp = (timestamp: bigint) => {
    const date = new Date(Number(timestamp) * 1000)
    return date.toLocaleString()
  }

  const formatAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`
  }

  if (isLoading) {
    return (
      <div className="card loading">
        <h2>Purchase History</h2>
        <p>Loading purchases...</p>
      </div>
    )
  }

  return (
    <div className="purchase-list">
      <h2>Purchase History ({purchaseCount} purchases)</h2>

      {purchases.length === 0 ? (
        <div className="card">
          <p>No purchases found.</p>
        </div>
      ) : (
        purchases.map((purchase) => (
          <div key={purchase.index} className="purchase-item">
            <h3>Purchase #{purchase.index + 1}</h3>
            <p><strong>Date:</strong> {formatTimestamp(purchase.timestamp)}</p>

            <div style={{ marginTop: '1rem' }}>
              <h4>Encrypted Data:</h4>
              <p><strong>Product ID:</strong> <span className="encrypted-data">{formatAddress(purchase.productId)}</span></p>
              <p><strong>Price:</strong> <span className="encrypted-data">{formatAddress(purchase.price)}</span></p>
              <p><strong>Quantity:</strong> <span className="encrypted-data">{formatAddress(purchase.quantity)}</span></p>
            </div>

            {purchase.decrypted && (
              <div style={{ marginTop: '1rem' }}>
                <h4>Decrypted Data:</h4>
                <p><strong>Product ID:</strong> <span className="decrypted-data">{purchase.decrypted.productId}</span></p>
                <p><strong>Price:</strong> <span className="decrypted-data">{purchase.decrypted.price} wei</span></p>
                <p><strong>Quantity:</strong> <span className="decrypted-data">{purchase.decrypted.quantity}</span></p>
              </div>
            )}

            {purchase.decryptError && (
              <div className="card error" style={{ marginTop: '1rem' }}>
                <p>Decryption Error: {purchase.decryptError}</p>
              </div>
            )}

            <div className="button-group">
              <button
                onClick={() => handleDecrypt(purchase)}
                disabled={purchase.isDecrypting || !!purchase.decrypted}
                className={purchase.decrypted ? 'button-secondary' : ''}
              >
                {purchase.isDecrypting ? 'Decrypting...' : purchase.decrypted ? 'Already Decrypted' : 'Decrypt Data'}
              </button>
            </div>
          </div>
        ))
      )}
    </div>
  )
}