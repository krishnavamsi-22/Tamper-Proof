# Teacher Registration Troubleshooting

## Issue: "Register on Blockchain" button not working

### Step-by-Step Fix:

#### 1. Check Blockchain is Running
```bash
# Terminal 1 - Must be running
cd blockchain
npx hardhat node
```
**Look for:** Account addresses printed (Account #0, Account #1, etc.)

#### 2. Deploy Smart Contract
```bash
# Terminal 2
cd blockchain
npx hardhat run scripts/deploy.js --network localhost
```
**Copy the contract address** that appears!

#### 3. Update Frontend Contract Address
1. Open `frontend/src/services/blockchain.js`
2. Find line: `const CONTRACT_ADDRESS = '0x5FbDB...'`
3. Replace with YOUR contract address from step 2
4. Save file

#### 4. Connect MetaMask Wallet
1. Click "Connect Wallet" button in Admin Dashboard sidebar
2. MetaMask should popup
3. Select Account #0 (Admin account)
4. Click "Connect"

#### 5. Check MetaMask Network
MetaMask must be on **Hardhat Local** network:
- Network Name: `Hardhat Local`
- RPC URL: `http://127.0.0.1:8545`
- Chain ID: `31337`

If not added, add it manually in MetaMask settings.

#### 6. Import Admin Account to MetaMask
**Admin Private Key:**
```
0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80
```

1. MetaMask → Import Account
2. Paste private key above
3. This is Account #0 from Hardhat

#### 7. Now Register Teacher
1. Fill in all teacher details:
   - Full Name
   - Subject
   - Email
   - Password
   - Wallet Address (use Account #1 from Hardhat)

**Account #1 Address:**
```
0x70997970C51812dc3A010C7d01b50e0d17dc79C8
```

2. Click "Register on Blockchain"
3. MetaMask will popup asking to confirm transaction
4. Click "Confirm"
5. Wait for success message

---

## Common Errors & Solutions

### Error: "Connect MetaMask first"
**Solution:** Click "Connect Wallet" button in sidebar first

### Error: "User rejected the connection request"
**Solution:** Click "Connect" in MetaMask popup

### Error: "Wrong network"
**Solution:** Switch MetaMask to "Hardhat Local" network

### Error: "Contract not deployed"
**Solution:** Run deploy script (Step 2 above)

### Error: "Nonce too high"
**Solution:** 
1. MetaMask → Settings → Advanced
2. Click "Clear activity tab data"
3. Try again

### Error: "Email already registered"
**Solution:** Use a different email address

### Error: "Wallet address already registered"
**Solution:** Use a different wallet address (Account #2, #3, etc.)

---

## Success Indicators

✅ Console shows: "Registering teacher in database..."
✅ Console shows: "Teacher registered in database"
✅ Console shows: "Connecting wallet..."
✅ Console shows: "Wallet connected"
✅ Console shows: "Registering on blockchain..."
✅ Console shows: "Blockchain registration successful: 0x..."
✅ Toast message: "Teacher registered on blockchain! Tx: 0x..."
✅ Form clears
✅ Teacher appears in "Registered Teachers" list below

---

## Debug Steps

1. **Open Browser Console** (F12)
2. Look for console.log messages
3. Check for any red error messages
4. Copy error message and check solutions above

---

## Quick Test

Use these test values:
- Name: `John Teacher`
- Subject: `Mathematics`
- Email: `john@teacher.com`
- Password: `teacher123`
- Wallet: `0x70997970C51812dc3A010C7d01b50e0d17dc79C8` (Account #1)

---

**If still not working, check browser console for specific error message!**
