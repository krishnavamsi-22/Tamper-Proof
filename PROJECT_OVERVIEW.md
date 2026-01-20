# Tamper-Proof Digital Education System - Project Overview

## 📚 What We're Building

A blockchain-based education system where:
- Students can enroll in courses and earn certificates
- Teachers approve course completions using MetaMask
- All marks and certificates are tamper-proof (verified via blockchain)
- Students can access data offline
- Anyone can verify certificate authenticity

---

## 🏗️ System Architecture (Simple Explanation)

### Three-Layer Design:

```
┌─────────────────────────────────────────┐
│  LAYER 1: Frontend (React)              │
│  - Student dashboard (no wallet)        │
│  - Teacher dashboard (MetaMask)         │
│  - Admin dashboard (MetaMask)           │
└─────────────────────────────────────────┘
              ↕️
┌─────────────────────────────────────────┐
│  LAYER 2: Backend (Express + MongoDB)   │
│  - User authentication (JWT)            │
│  - Course & enrollment management       │
│  - Marks & certificate storage          │
│  - SHA-256 hash generation              │
└─────────────────────────────────────────┘
              ↕️
┌─────────────────────────────────────────┐
│  LAYER 3: Blockchain (Hardhat)          │
│  - Stores ONLY hashes (not data)        │
│  - Immutable proof of authenticity      │
│  - Tamper detection                     │
└─────────────────────────────────────────┘
```

---

## 🔐 Security Model

### Why Blockchain?

**Problem:** Traditional databases can be hacked or modified by admins.

**Solution:** Use blockchain as a "truth anchor"

**How it works:**
1. Backend stores marks in MongoDB (e.g., "Student John: 85/100")
2. Backend calculates SHA-256 hash (e.g., "a3f5b8c9...")
3. Frontend sends hash to blockchain via MetaMask
4. Blockchain stores hash forever (immutable)
5. Later, anyone can verify:
   - Download marks from backend
   - Calculate hash
   - Compare with blockchain hash
   - ✅ Match = Authentic | ❌ Mismatch = Tampered

### What is a Hash?

Think of it as a "digital fingerprint":
- Always 64 characters long (SHA-256)
- Changes completely if even 1 character changes
- Cannot reverse-engineer original data from hash
- Fast to calculate

**Example:**
```
Original: "Student: John, Course: Math, Marks: 85"
Hash:     "a3f5b8c9d2e1f4a7b6c5d8e9f1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0"

Modified: "Student: John, Course: Math, Marks: 95"
Hash:     "7f2e9a1b4c8d3e6f9a2b5c8d1e4f7a0b3c6d9e2f5a8b1c4d7e0f3a6b9c2e5f8"
```

---

## 👥 User Roles

### 1. Student
- **Authentication:** Email/password (JWT)
- **No MetaMask required**
- **Can:**
  - Register and login
  - Enroll in courses
  - Complete lessons
  - View marks
  - Download certificates
  - Verify own data
  - Access data offline

### 2. Teacher
- **Authentication:** MetaMask wallet
- **Wallet = Identity**
- **Can:**
  - Approve course completions
  - Trigger marks generation
  - Sign blockchain transactions
- **Cannot:**
  - Modify verified data
  - Deny actions later (non-repudiation)

### 3. Admin
- **Authentication:** MetaMask wallet (deployer)
- **Wallet = Identity**
- **Can:**
  - Register teachers
  - Create courses
  - Issue certificates
  - Audit all records
  - Demonstrate tamper detection

---

## 🔄 Complete User Flow

### Student Journey:

```
1. Student registers → MongoDB stores account
2. Student logs in → Backend issues JWT token
3. Student enrolls in "Math 101" → MongoDB stores enrollment
4. Student completes lessons → MongoDB tracks progress
5. Teacher approves completion → MetaMask signature required
6. Backend auto-generates marks (e.g., 85/100) → MongoDB stores marks
7. Backend calculates hash → SHA-256("student123|math101|85")
8. Frontend sends hash to blockchain → MetaMask prompts teacher
9. Blockchain stores hash → Immutable record created
10. Backend generates certificate PDF → MongoDB stores certificate
11. Backend calculates certificate hash → SHA-256(PDF bytes)
12. Frontend sends cert hash to blockchain → MetaMask prompts admin
13. Blockchain stores cert hash → Immutable record created
14. Student downloads certificate → Can verify anytime
```

### Verification Flow:

```
1. Student clicks "Verify Marks"
2. Frontend fetches marks from backend
3. Frontend calculates hash locally (SHA-256)
4. Frontend reads hash from blockchain (no gas cost)
5. Frontend compares hashes:
   ✅ Match → "Data is authentic and untampered"
   ❌ Mismatch → "WARNING: Data has been modified!"
```

---

## 🛠️ Technology Stack

### Frontend:
- **React.js** (Vite)
- **Tailwind CSS** (styling)
- **ethers.js v6** (blockchain interaction)
- **MetaMask** (wallet for teachers/admin)

### Backend:
- **Node.js v18**
- **Express.js** (REST API)
- **MongoDB Atlas** (off-chain database)
- **JWT** (authentication)
- **crypto** (SHA-256 hashing)

### Blockchain:
- **Hardhat v2.19.5** (development framework)
- **Solidity ^0.8.20** (smart contract language)
- **ethers.js v6** (library)
- **Local network** (chainId 31337)

---

## 📁 Project Structure

```
tamper-lms/
│
├── blockchain/                    ✅ COMPLETED
│   ├── contracts/
│   │   └── EducationSystem.sol   # Smart contract (9 tests passing)
│   ├── scripts/
│   │   └── deploy.js             # Deployment script
│   ├── test/
│   │   └── EducationSystem.test.js
│   ├── hardhat.config.js
│   └── package.json
│
├── backend/                       🔄 NEXT PHASE
│   ├── models/
│   │   ├── User.js
│   │   ├── Course.js
│   │   ├── Enrollment.js
│   │   └── Certificate.js
│   ├── routes/
│   │   ├── auth.js
│   │   ├── courses.js
│   │   ├── enrollments.js
│   │   └── certificates.js
│   ├── middleware/
│   │   └── auth.js
│   ├── utils/
│   │   └── hash.js
│   ├── server.js
│   └── package.json
│
└── frontend/                      ⏳ UPCOMING
    ├── src/
    │   ├── components/
    │   │   ├── StudentDashboard.jsx
    │   │   ├── TeacherDashboard.jsx
    │   │   └── AdminDashboard.jsx
    │   ├── services/
    │   │   ├── api.js
    │   │   ├── blockchain.js
    │   │   └── offline.js
    │   ├── App.jsx
    │   └── main.jsx
    └── package.json
```

---

## ✅ Phase 1 Complete: Blockchain

### What We Built:

1. **Smart Contract (EducationSystem.sol):**
   - Admin can register teachers
   - Teachers can store marks hashes
   - Admin can store certificate hashes
   - Anyone can verify hashes
   - All actions are logged with timestamps
   - Role-based access control (RBAC)

2. **Key Functions:**
   ```solidity
   registerTeacher(address)           // Admin only
   storeMarksHash(id, course, hash)   // Teacher only
   storeCertificateHash(id, course, hash) // Admin only
   verifyMarksHash(id, course, hash)  // Public
   verifyCertificateHash(id, course, hash) // Public
   getMarksRecord(id, course)         // Public (audit trail)
   ```

3. **Security Features:**
   - Hashes are 64 characters (SHA-256)
   - Cannot store duplicate hashes
   - Cannot store certificate without marks
   - All actions tracked (who, when, what)
   - Immutable once stored

4. **Test Coverage:**
   - ✅ Admin deployment
   - ✅ Teacher registration
   - ✅ Access control (only authorized users)
   - ✅ Marks storage
   - ✅ Certificate storage
   - ✅ Hash verification (correct & incorrect)

---

## 🚀 Next Steps

### Phase 2: Backend (Express + MongoDB)
1. Set up MongoDB Atlas
2. Create data models
3. Implement JWT authentication
4. Build REST APIs
5. Implement SHA-256 hashing
6. Test with Postman

### Phase 3: Frontend (React)
1. Create React app with Vite
2. Set up Tailwind CSS
3. Integrate MetaMask
4. Build dashboards
5. Connect to backend APIs
6. Connect to blockchain

### Phase 4: Integration & Testing
1. End-to-end testing
2. Offline functionality
3. Certificate generation (PDF)
4. Verification system
5. Error handling
6. UI polish

### Phase 5: Demo Preparation
1. Create demo data
2. Prepare demo script
3. Test tamper detection
4. Document common issues
5. Create user guide

---

## 🎯 Key Principles (IMPORTANT)

1. **Backend NEVER writes to blockchain**
   - Only frontend (via MetaMask) writes
   - Backend only generates hashes

2. **Blockchain stores ONLY hashes**
   - No personal data
   - No marks directly
   - No certificates directly

3. **MetaMask = Authority Identity**
   - Switching wallet = switching identity
   - Every action is signed
   - Non-repudiation

4. **Students don't need wallets**
   - Traditional login (email/password)
   - Can verify without MetaMask
   - Can access data offline

5. **Offline-first design**
   - Sync data to local storage
   - Encrypt sensitive data
   - Verification requires internet

---

## 📊 Current Status

| Phase | Status | Progress |
|-------|--------|----------|
| Blockchain Setup | ✅ Complete | 100% |
| Backend Setup | 🔄 Next | 0% |
| Frontend Setup | ⏳ Pending | 0% |
| Integration | ⏳ Pending | 0% |
| Testing | ⏳ Pending | 0% |
| Demo | ⏳ Pending | 0% |

---

## 🐛 Common Issues & Solutions

### Issue: MetaMask not prompting
**Cause:** Frontend not using BrowserProvider
**Solution:** Use `new ethers.BrowserProvider(window.ethereum)`

### Issue: Hash mismatch
**Cause:** Different data format when calculating hash
**Solution:** Use consistent format (e.g., "studentId|courseId|marks")

### Issue: Transaction fails
**Cause:** Wrong wallet connected (not teacher/admin)
**Solution:** Switch MetaMask account

### Issue: Contract not found
**Cause:** Blockchain node restarted (new addresses)
**Solution:** Redeploy contract and update frontend

---

## 📝 Notes for Beginners

### What is MetaMask?
A browser extension that acts as a cryptocurrency wallet. It allows you to:
- Store Ethereum accounts
- Sign transactions
- Interact with blockchain apps

### What is Gas?
The fee paid to execute blockchain transactions. On our local network, it's free (test ETH).

### What is a Private Key?
A secret code that controls your wallet. NEVER share it in production. We use it here only for testing.

### What is an ABI?
Application Binary Interface - a JSON file that tells your frontend how to interact with the smart contract.

### What is a Signer?
An account that can sign transactions (requires private key). In our case, MetaMask provides the signer.

---

## 🎓 Learning Resources

- **Solidity:** https://docs.soliditylang.org/
- **Hardhat:** https://hardhat.org/docs
- **ethers.js:** https://docs.ethers.org/v6/
- **MetaMask:** https://docs.metamask.io/
- **React:** https://react.dev/
- **Express:** https://expressjs.com/

---

**Ready to proceed to Phase 2: Backend Setup?**
