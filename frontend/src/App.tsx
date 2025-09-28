import { useEffect, useState } from 'react'
import { WagmiProvider } from 'wagmi'
import { RainbowKitProvider, ConnectButton } from '@rainbow-me/rainbowkit'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import '@rainbow-me/rainbowkit/styles.css'

import { config } from './wagmi'
import { CustomerDBInterface } from './components/CustomerDBInterface'
import { initFHE } from './fhe'

const queryClient = new QueryClient()

function App() {
  const [isFHEReady, setIsFHEReady] = useState(false)
  const [fheError, setFheError] = useState<string | null>(null)

  useEffect(() => {
    async function setupFHE() {
      try {
        await initFHE()
        setIsFHEReady(true)
      } catch (error) {
        console.error('FHE initialization failed:', error)
        setFheError(error instanceof Error ? error.message : 'Failed to initialize FHE')
      }
    }

    setupFHE()
  }, [])

  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <RainbowKitProvider>
          <div className="container">
            <header style={{ textAlign: 'center', marginBottom: '2rem' }}>
              <h1>FHE Customer Database</h1>
              <p>Secure encrypted shopping data storage</p>
              <ConnectButton />
            </header>

            {fheError && (
              <div className="card error">
                <h3>FHE Initialization Error</h3>
                <p>{fheError}</p>
                <p>Please make sure you have MetaMask or another Web3 wallet installed.</p>
              </div>
            )}

            {!isFHEReady && !fheError && (
              <div className="card loading">
                <p>Initializing FHE system...</p>
              </div>
            )}

            {isFHEReady && <CustomerDBInterface />}
          </div>
        </RainbowKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  )
}

export default App