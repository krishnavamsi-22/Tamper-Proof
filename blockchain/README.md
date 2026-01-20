# Blockchain Setup Instructions

## ✅ Phase 1 Complete: Smart Contract

### What We Built:
- ✅ Solidity smart contract (EducationSystem.sol)
- ✅ Deployment script
- ✅ Test suite (9 tests passing)

### Smart Contract Features:
1. **Admin Functions:**
   - Register/remove teachers
   - Store certificate hashes

2. **Teacher Functions:**
   - Store marks hashes (requires MetaMask signature)

3. **Public Functions (No wallet needed):**
   - Verify marks hashes
   - Verify certificate hashes
   - Get marks/certificate records

### How to Run:

#### 1. Start Local Blockchain (Terminal 1):
```bash
cd blockchain
npx hardhat node
```
This will:
- Start a local Ethereum network on http://localhost:8545
- Create 20 test accounts with 10,000 ETH each
- Display private keys (for importing to MetaMask)

#### 2. Deploy Contract (Terminal 2):
```bash
cd blockchain
npx hardhat run scripts/deploy.js --network localhost
```
This will:
- Deploy the EducationSystem contract
- Save contract address and ABI to `deployment.json`
- Display the admin address

#### 3. Run Tests (Optional):
```bash
cd blockchain
npx hardhat test
```

### Important Notes:
- Keep Terminal 1 running (blockchain node)
- Copy the contract address from deployment output
- Copy Account #0 private key for MetaMask (admin)
- Copy Account #1 private key for MetaMask (teacher)

### Next Steps:
- Set up MongoDB Atlas
- Build Express backend
- Create React frontend
- Integrate MetaMask

---

## Contract Address:
(Will be displayed after deployment)

## Admin Address:
(Will be displayed after deployment)
