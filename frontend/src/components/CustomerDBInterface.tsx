import { useState, useEffect } from 'react'
import { useAccount, useReadContract } from 'wagmi'
import { ethers } from 'ethers'
import { CUSTOMERDB_ADDRESS, CUSTOMERDB_ABI } from '../contracts'
import { AddPurchaseForm } from './AddPurchaseForm'
import { PurchaseList } from './PurchaseList'

export function CustomerDBInterface() {
  const { address, isConnected } = useAccount()
  const [purchaseCount, setPurchaseCount] = useState<number>(0)
  const [refreshTrigger, setRefreshTrigger] = useState(0)

  // Read purchase count using viem
  const { data: purchaseCountData, refetch: refetchPurchaseCount } = useReadContract({
    address: CUSTOMERDB_ADDRESS as `0x${string}`,
    abi: CUSTOMERDB_ABI,
    functionName: 'getPurchaseCount',
    args: [address as `0x${string}`],
    query: {
      enabled: !!address && !!CUSTOMERDB_ADDRESS && CUSTOMERDB_ADDRESS !== '0x',
    },
  })

  useEffect(() => {
    if (purchaseCountData !== undefined) {
      setPurchaseCount(Number(purchaseCountData))
    }
  }, [purchaseCountData])

  useEffect(() => {
    if (refreshTrigger > 0) {
      refetchPurchaseCount()
    }
  }, [refreshTrigger, refetchPurchaseCount])

  const handlePurchaseAdded = () => {
    setRefreshTrigger(prev => prev + 1)
  }

  if (!isConnected) {
    return (
      <div className="card">
        <h2>Please Connect Your Wallet</h2>
        <p>You need to connect your wallet to interact with the FHE Customer Database.</p>
      </div>
    )
  }

  if (!CUSTOMERDB_ADDRESS || CUSTOMERDB_ADDRESS === '0x') {
    return (
      <div className="card error">
        <h2>Contract Not Deployed</h2>
        <p>The CustomerDB contract has not been deployed yet. Please deploy the contract first.</p>
        <p>Run: <code>npx hardhat deploy --network sepolia --tags CustomerDB</code></p>
      </div>
    )
  }

  return (
    <div>
      <div className="card">
        <h2>Customer Database Dashboard</h2>
        <p><strong>Connected Address:</strong> {address}</p>
        <p><strong>Total Purchases:</strong> {purchaseCount}</p>
        <p><strong>Contract Address:</strong> {CUSTOMERDB_ADDRESS}</p>
      </div>

      <AddPurchaseForm onPurchaseAdded={handlePurchaseAdded} />

      {purchaseCount > 0 && (
        <PurchaseList
          purchaseCount={purchaseCount}
          refreshTrigger={refreshTrigger}
        />
      )}
    </div>
  )
}