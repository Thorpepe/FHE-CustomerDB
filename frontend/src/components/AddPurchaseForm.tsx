import { useState } from 'react'
import { useAccount } from 'wagmi'
import { ethers } from 'ethers'
import { CUSTOMERDB_ADDRESS, CUSTOMERDB_ABI } from '../contracts'
import { encryptPurchaseData } from '../fhe'

interface AddPurchaseFormProps {
  onPurchaseAdded: () => void
}

export function AddPurchaseForm({ onPurchaseAdded }: AddPurchaseFormProps) {
  const { address } = useAccount()
  const [productId, setProductId] = useState('')
  const [price, setPrice] = useState('')
  const [quantity, setQuantity] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [status, setStatus] = useState<{ type: 'success' | 'error' | 'info' | null; message: string }>({
    type: null,
    message: ''
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!address) {
      setStatus({ type: 'error', message: 'Please connect your wallet' })
      return
    }

    if (!productId || !price || !quantity) {
      setStatus({ type: 'error', message: 'Please fill in all fields' })
      return
    }

    const productIdNum = parseInt(productId)
    const priceNum = parseInt(price)
    const quantityNum = parseInt(quantity)

    if (isNaN(productIdNum) || isNaN(priceNum) || isNaN(quantityNum) ||
        productIdNum <= 0 || priceNum <= 0 || quantityNum <= 0) {
      setStatus({ type: 'error', message: 'Please enter valid positive numbers' })
      return
    }

    setIsLoading(true)
    setStatus({ type: 'info', message: 'Encrypting purchase data...' })

    try {
      // Encrypt the purchase data
      const encryptedInput = await encryptPurchaseData(
        productIdNum,
        priceNum,
        quantityNum,
        CUSTOMERDB_ADDRESS,
        address
      )

      setStatus({ type: 'info', message: 'Sending transaction...' })

      // Get provider and signer using ethers
      if (!window.ethereum) {
        throw new Error('No ethereum provider found')
      }

      const provider = new ethers.BrowserProvider(window.ethereum)
      const signer = await provider.getSigner()

      // Create contract instance with ethers for writing
      const contract = new ethers.Contract(CUSTOMERDB_ADDRESS, CUSTOMERDB_ABI, signer)

      // Send transaction
      const tx = await contract.addPurchase(
        encryptedInput.handles[0], // productId
        encryptedInput.handles[1], // price
        encryptedInput.handles[2], // quantity
        encryptedInput.inputProof
      )

      setStatus({ type: 'info', message: `Transaction sent: ${tx.hash}. Waiting for confirmation...` })

      // Wait for transaction confirmation
      const receipt = await tx.wait()

      if (receipt.status === 1) {
        setStatus({ type: 'success', message: 'Purchase added successfully!' })
        setProductId('')
        setPrice('')
        setQuantity('')
        onPurchaseAdded()
      } else {
        setStatus({ type: 'error', message: 'Transaction failed' })
      }
    } catch (error: any) {
      console.error('Error adding purchase:', error)
      setStatus({
        type: 'error',
        message: error?.message || error?.reason || 'Failed to add purchase'
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="card">
      <h2>Add New Purchase</h2>

      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="productId">Product ID:</label>
          <input
            type="number"
            id="productId"
            value={productId}
            onChange={(e) => setProductId(e.target.value)}
            placeholder="Enter product ID"
            disabled={isLoading}
            min="1"
          />
        </div>

        <div className="form-group">
          <label htmlFor="price">Price (wei):</label>
          <input
            type="number"
            id="price"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            placeholder="Enter price in wei"
            disabled={isLoading}
            min="1"
          />
        </div>

        <div className="form-group">
          <label htmlFor="quantity">Quantity:</label>
          <input
            type="number"
            id="quantity"
            value={quantity}
            onChange={(e) => setQuantity(e.target.value)}
            placeholder="Enter quantity"
            disabled={isLoading}
            min="1"
          />
        </div>

        <button type="submit" disabled={isLoading}>
          {isLoading ? 'Processing...' : 'Add Purchase'}
        </button>
      </form>

      {status.type && (
        <div className={`card ${status.type}`} style={{ marginTop: '1rem' }}>
          <p>{status.message}</p>
        </div>
      )}
    </div>
  )
}