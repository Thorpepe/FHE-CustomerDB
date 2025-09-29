# 🔐 FHE-CustomerDB

### Privacy-First Customer Purchase Database on Blockchain

A revolutionary customer purchase tracking system built with **Zama's Fully Homomorphic Encryption (FHE)** technology, ensuring complete privacy and confidentiality while maintaining blockchain transparency and composability.

[![License](https://img.shields.io/badge/License-BSD--3--Clause--Clear-blue.svg)](LICENSE)
[![Ethereum](https://img.shields.io/badge/Ethereum-Compatible-627EEA?logo=ethereum)](https://ethereum.org)
[![Zama](https://img.shields.io/badge/Powered%20by-Zama%20FHE-764BA2)](https://zama.ai)
[![Hardhat](https://img.shields.io/badge/Built%20with-Hardhat-FFDB1C)](https://hardhat.org)
[![React](https://img.shields.io/badge/Frontend-React%2018-61DAFB?logo=react)](https://reactjs.org)

![FHE-CustomerDB Demo](frontend/public/demo-screenshot.png)

## 🌟 Key Features

### 🔒 **Complete Privacy Protection**
- **End-to-End Encryption**: All customer purchase data (item IDs, prices, quantities) are encrypted using FHE
- **Zero Knowledge**: No one can see sensitive purchase information, not even blockchain validators
- **Quantum-Resistant**: Built on quantum-safe cryptographic foundations

### 🚀 **Blockchain Benefits Without Compromise**
- **Full Composability**: Smart contracts remain interoperable with existing DeFi protocols
- **On-Chain Transparency**: Maintain audit trails while protecting sensitive data
- **Ethereum Compatible**: Works seamlessly with Ethereum, Polygon, Arbitrum, and other EVM chains

### 💻 **Developer-Friendly**
- **Solidity Native**: Write confidential smart contracts using familiar Solidity syntax
- **Modern Stack**: React 18, TypeScript, Hardhat, Vite for optimal developer experience
- **Easy Integration**: Drop-in solution for existing e-commerce and retail applications

## 🎯 Problem Solved

Traditional blockchain applications face a fundamental privacy paradox:

❌ **Current State:**
- All transaction data is publicly visible on blockchain
- Customer purchase histories can be tracked and analyzed
- Sensitive business data (pricing, inventory) exposed to competitors
- Compliance issues with privacy regulations (GDPR, CCPA)

✅ **Our Solution:**
- **Private by Design**: Customer data encrypted at the protocol level
- **Regulatory Compliant**: Meet privacy standards without sacrificing blockchain benefits
- **Business Intelligence**: Analyze trends without exposing individual customer data
- **Competitive Advantage**: Protect sensitive pricing and sales strategies

## 🏗️ Technical Architecture

### Smart Contract Layer
```
┌─────────────────────────────────────┐
│          CustomerDB.sol             │
├─────────────────────────────────────┤
│  • Encrypted item IDs (euint32)    │
│  • Encrypted prices (euint32)      │
│  • Encrypted quantities (euint32)  │
│  • Public timestamps (uint64)      │
└─────────────────────────────────────┘
```

### FHE Integration
```
┌─────────────────────────────────────┐
│         Zama FHEVM Stack            │
├─────────────────────────────────────┤
│  • Client-side encryption          │
│  • On-chain FHE operations         │
│  • Access control management       │
│  • Reencryption for authorized     │
└─────────────────────────────────────┘
```

### Frontend Application
```
┌─────────────────────────────────────┐
│      React 18 + TypeScript          │
├─────────────────────────────────────┤
│  • RainbowKit wallet connection     │
│  • Zama Relayer SDK integration    │
│  • Modern glass-morphism UI        │
│  • Responsive design               │
└─────────────────────────────────────┘
```

## 🛠️ Technology Stack

### Backend
- **Solidity ^0.8.24**: Smart contract development
- **Zama FHEVM**: Fully homomorphic encryption runtime
- **Hardhat**: Development framework and testing
- **OpenZeppelin**: Security-audited contract libraries

### Frontend
- **React 18**: Modern UI framework with concurrent features
- **TypeScript**: Type-safe development
- **Vite**: Lightning-fast build tool
- **RainbowKit**: Best-in-class wallet connection
- **Wagmi**: React hooks for Ethereum

### Encryption & Privacy
- **Zama FHE**: Quantum-resistant fully homomorphic encryption
- **FHEVM**: EVM-compatible FHE operations
- **Relayer SDK**: Client-side encryption and key management

## 🚀 Quick Start

### Prerequisites
- Node.js ≥ 20.0.0
- npm ≥ 7.0.0
- Git
- MetaMask or compatible Web3 wallet

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/your-org/FHE-CustomerDB.git
   cd FHE-CustomerDB
   ```

2. **Install dependencies**
   ```bash
   # Install smart contract dependencies
   npm install

   # Install frontend dependencies
   cd frontend
   npm install
   cd ..
   ```

3. **Set up environment variables**
   ```bash
   # Configure Hardhat variables
   npx hardhat vars set MNEMONIC
   npx hardhat vars set INFURA_API_KEY
   npx hardhat vars set ETHERSCAN_API_KEY  # Optional

   # Copy environment template
   cp .env.example .env
   ```

4. **Compile smart contracts**
   ```bash
   npm run compile
   ```

5. **Run tests**
   ```bash
   npm run test
   ```

### Local Development

1. **Start local blockchain**
   ```bash
   npx hardhat node
   ```

2. **Deploy contracts**
   ```bash
   npx hardhat deploy --network localhost
   ```

3. **Start frontend development server**
   ```bash
   cd frontend
   npm run dev
   ```

4. **Access the application**
   - Frontend: http://localhost:5174
   - Local node: http://localhost:8545

### Sepolia Testnet Deployment

1. **Deploy to Sepolia**
   ```bash
   npx hardhat deploy --network sepolia
   ```

2. **Verify contract (optional)**
   ```bash
   npx hardhat verify --network sepolia <CONTRACT_ADDRESS>
   ```

3. **Update frontend config**
   ```typescript
   // frontend/src/config/contracts.ts
   export const CONTRACT_ADDRESS = 'YOUR_DEPLOYED_ADDRESS';
   ```

## 📖 Usage Guide

### Adding Customer Purchases

1. **Connect your wallet** using the RainbowKit interface
2. **Navigate to "New Purchase"** tab
3. **Fill in the purchase details**:
   - Customer Address (Ethereum wallet)
   - Item ID (numerical identifier)
   - Price (in your chosen currency unit)
   - Quantity (number of items)
4. **Submit transaction** - All data will be encrypted before blockchain submission

### Viewing Purchase History

1. **Navigate to "My Purchases"** tab
2. **Purchase data is automatically decrypted** for authorized viewers
3. **Export functionality** available for business intelligence

### Smart Contract Integration

```solidity
// Import the CustomerDB contract
import "./CustomerDB.sol";

contract YourContract {
    CustomerDB public customerDB;

    constructor(address _customerDB) {
        customerDB = CustomerDB(_customerDB);
    }

    function addEncryptedPurchase(
        address customer,
        externalEuint32 itemIdExt,
        externalEuint32 priceExt,
        externalEuint32 quantityExt,
        bytes calldata inputProof
    ) external {
        customerDB.addPurchase(
            customer,
            itemIdExt,
            priceExt,
            quantityExt,
            inputProof
        );
    }
}
```

## 🎨 User Interface

The application features a modern, responsive design with:

- **Glass-morphism aesthetic**: Semi-transparent cards with backdrop blur
- **Gradient backgrounds**: Beautiful purple-blue gradient themes
- **Smooth animations**: Hover effects and transitions
- **Mobile responsive**: Optimized for all device sizes
- **Accessibility**: WCAG 2.1 AA compliant

### Design Principles
- **Privacy-first UX**: Clear indicators when data is encrypted
- **Progressive disclosure**: Advanced features available when needed
- **Error handling**: User-friendly error messages and recovery flows

## 🔧 Configuration

### Environment Variables

```bash
# .env
REACT_APP_NETWORK=sepolia
REACT_APP_CONTRACT_ADDRESS=0x...
REACT_APP_INFURA_PROJECT_ID=your_infura_id
```

### Hardhat Configuration

```typescript
// hardhat.config.ts
const config: HardhatUserConfig = {
  solidity: "0.8.24",
  networks: {
    sepolia: {
      url: `https://sepolia.infura.io/v3/${vars.get("INFURA_API_KEY")}`,
      accounts: {
        mnemonic: vars.get("MNEMONIC"),
      },
    },
  },
};
```

## 🧪 Testing

### Smart Contract Tests
```bash
# Run all tests
npm run test

# Run with coverage
npm run coverage

# Test on Sepolia
npm run test:sepolia
```

### Frontend Tests
```bash
cd frontend
npm run test
```

### Test Structure
```
test/
├── CustomerDB.ts           # Core functionality tests
├── FHECounter.ts          # Example FHE tests
├── integration/           # End-to-end tests
└── utils/                # Test utilities
```

## 🚗 Roadmap

### Phase 1: Core Privacy Infrastructure ✅
- [x] Basic encrypted purchase storage
- [x] Zama FHE integration
- [x] Modern React frontend
- [x] Sepolia testnet deployment

### Phase 2: Advanced Features (Q2 2025)
- [ ] **Batch Operations**: Submit multiple purchases in single transaction
- [ ] **Search & Filtering**: Encrypted search capabilities
- [ ] **Analytics Dashboard**: Privacy-preserving business intelligence
- [ ] **Mobile App**: Native iOS/Android applications

### Phase 3: Enterprise Features (Q3 2025)
- [ ] **Multi-tenant Support**: Isolated customer databases
- [ ] **Role-based Access**: Fine-grained permission system
- [ ] **Audit Logs**: Comprehensive activity tracking
- [ ] **API Gateway**: RESTful API for system integration

### Phase 4: Ecosystem Expansion (Q4 2025)
- [ ] **Multi-chain Support**: Polygon, Arbitrum, Optimism
- [ ] **DeFi Integration**: Lending/borrowing against encrypted assets
- [ ] **Marketplace Features**: Anonymous peer-to-peer trading
- [ ] **Governance Token**: Decentralized protocol governance

## 🤝 Contributing

We welcome contributions from the community! Please read our contributing guidelines before submitting PRs.

### Development Process

1. **Fork the repository**
2. **Create a feature branch**
   ```bash
   git checkout -b feature/your-feature-name
   ```
3. **Make your changes**
   - Follow our code style guidelines
   - Add tests for new functionality
   - Update documentation as needed
4. **Test thoroughly**
   ```bash
   npm run test
   npm run lint
   ```
5. **Submit a Pull Request**

### Code Style

- **Solidity**: Follow OpenZeppelin style guide
- **TypeScript**: Use Prettier and ESLint configurations
- **Git**: Conventional commits format

### Reporting Issues

- Use GitHub Issues for bug reports
- Include reproduction steps and environment details
- Check existing issues before creating new ones

## 📄 License

This project is licensed under the **BSD-3-Clause-Clear License**. See [LICENSE](LICENSE) for details.

This license allows for:
- ✅ Commercial use
- ✅ Modification
- ✅ Distribution
- ✅ Private use

With requirements for:
- 📝 License and copyright notice
- 📝 State changes

## 🆘 Support & Community

### Getting Help
- **Documentation**: [Zama FHEVM Docs](https://docs.zama.ai/fhevm)
- **GitHub Issues**: [Report bugs or request features](https://github.com/your-org/FHE-CustomerDB/issues)
- **Discord**: [Join the Zama community](https://discord.gg/zama)

### Professional Support
For enterprise deployments and custom development:
- 📧 Email: support@your-org.com
- 💬 Enterprise Discord: Available to licensed users
- 🔧 Custom training and consultation services

## 🌍 Use Cases

### E-commerce Platforms
- **Customer Behavior Analytics**: Understand trends without exposing individual purchases
- **Inventory Management**: Track stock levels with encrypted sales data
- **Loyalty Programs**: Reward customers while maintaining purchase privacy

### Financial Services
- **Transaction Monitoring**: Detect patterns while preserving customer privacy
- **Credit Scoring**: Assess creditworthiness using encrypted purchase history
- **Regulatory Compliance**: Meet KYC/AML requirements with privacy protection

### Healthcare & Pharma
- **Patient Purchase Tracking**: Monitor medication compliance privately
- **Research & Development**: Analyze treatment effectiveness with encrypted data
- **Insurance Claims**: Process claims while protecting patient information

### Supply Chain Management
- **Vendor Analytics**: Track supplier performance with confidential pricing
- **Quality Control**: Monitor product issues without exposing customer data
- **Logistics Optimization**: Improve delivery routes using encrypted purchase patterns

## 🔮 Future Vision

FHE-CustomerDB represents the future of privacy-preserving business applications on blockchain. Our vision includes:

### **Universal Privacy Layer**
Becoming the standard for encrypted data storage across all blockchain applications, enabling a new era of privacy-first decentralized systems.

### **Regulatory Compliance by Design**
Built-in compliance with global privacy regulations (GDPR, CCPA, LGPD) without compromising blockchain's core benefits.

### **Ecosystem Interoperability**
Seamless integration with existing DeFi protocols, enabling private trading, lending, and complex financial instruments.

### **Mass Adoption Bridge**
Solving blockchain's transparency problem to enable mainstream business adoption while maintaining decentralization benefits.

---

**Built with ❤️ by the FHE-CustomerDB team**

*Powered by Zama's revolutionary Fully Homomorphic Encryption technology*

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/your-org/FHE-CustomerDB)
[![Deploy to Netlify](https://www.netlify.com/img/deploy/button.svg)](https://app.netlify.com/start/deploy?repository=https://github.com/your-org/FHE-CustomerDB)

---

> *"Privacy is not about hiding something. Privacy is about protecting what makes you human."* - **Zama Team**