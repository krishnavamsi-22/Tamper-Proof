# 📋 Copy-Paste Commands

Just copy and paste these commands in order. No thinking required! 😊

---

## 🔧 FIRST TIME SETUP (Run Once)

### Terminal 1:
```bash
cd blockchain
npm install
```

### Terminal 2:
```bash
cd backend
npm install
```

### Terminal 3:
```bash
cd frontend
npm install
```

**Wait for all installations to complete, then proceed below.**

---

## 🚀 EVERY TIME YOU START THE APP

### Terminal 1 - Start Blockchain:
```bash
cd blockchain
npx hardhat node
```
**KEEP THIS RUNNING! Copy Account #0 and #1 addresses and private keys.**

---

### Terminal 2 - Deploy Contract:
```bash
cd blockchain
npx hardhat run scripts/deploy.js --network localhost
```
**Copy the contract address that appears.**

**Then update frontend:**
1. Open `frontend/src/services/blockchain.js`
2. Find line: `const CONTRACT_ADDRESS = '0x5FbDB...'`
3. Replace with your contract address
4. Save file

---

### Terminal 3 - Start Backend:
```bash
cd backend
node seed.js
npm run dev
```
**KEEP THIS RUNNING!**

---

### Terminal 4 - Start Frontend:
```bash
cd frontend
npm run dev
```
**KEEP THIS RUNNING!**

---

## 🦊 METAMASK SETUP (First Time Only)

### Add Network:
- Network Name: `Hardhat Local`
- RPC URL: `http://127.0.0.1:8545`
- Chain ID: `31337`
- Currency Symbol: `ETH`

### Import Accounts:
**Admin Private Key:**
```
0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80
```

**Teacher Private Key:**
```
0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d
```

---

## 🎯 ACCESS THE APP

Open browser: http://localhost:3000

**Demo Logins:**
- Admin: `admin@tamper-lms.com` / `admin123`
- Teacher: `teacher@tamper-lms.com` / `teacher123`
- Student: Register new account

---

## 🛑 STOP EVERYTHING

Press `Ctrl+C` in each terminal (1, 2, 3, 4)

---

## 🔄 RESTART EVERYTHING

If blockchain restarts, you MUST:
1. Redeploy contract (Terminal 2)
2. Update contract address in frontend
3. Restart backend (Terminal 3)
4. Restart frontend (Terminal 4)

---

## 🧪 QUICK TEST

1. Login as Admin → Connect MetaMask (Admin account)
2. Create a course
3. Register a teacher (use Account #1 address)
4. Logout → Register as student
5. Enroll in course → Complete lessons
6. Logout → Login as Teacher → Connect MetaMask (Teacher account)
7. Approve student → Confirm MetaMask transaction
8. Logout → Login as Student → Verify marks

---

## 📝 IMPORTANT NOTES

- **4 terminals must stay open**
- **MetaMask must be on "Hardhat Local" network**
- **Switch MetaMask accounts when switching roles**
- **Confirm all MetaMask transactions**
- **Wait for transaction confirmations**

---

## 🐛 COMMON FIXES

### "Port already in use"
```bash
# Windows
netstat -ano | findstr :5000
taskkill /PID <PID> /F

# Mac/Linux
lsof -ti:5000 | xargs kill -9
```

### "MetaMask not prompting"
- Check you're on "Hardhat Local" network
- Check correct account is selected
- Refresh page

### "Nonce too high"
- MetaMask → Settings → Advanced → Clear activity tab data

---

## ✅ SUCCESS CHECKLIST

- [ ] All 4 terminals running
- [ ] No errors in any terminal
- [ ] Frontend opens at localhost:3000
- [ ] Can login as admin
- [ ] MetaMask connects successfully
- [ ] Can create course
- [ ] Can register teacher (MetaMask confirms)
- [ ] Can register student
- [ ] Can enroll and complete lessons
- [ ] Teacher can approve (MetaMask confirms)
- [ ] Student can verify marks
- [ ] Admin can issue certificate (MetaMask confirms)
- [ ] Student can verify certificate

---

**That's it! You're done! 🎉**

For detailed explanations, see:
- COMPLETE_SETUP_GUIDE.md
- EXECUTION_CHECKLIST.md
- PROJECT_COMPLETE.md
