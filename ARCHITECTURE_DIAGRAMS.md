# 📊 System Architecture Diagrams

## 🏗️ High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         USER INTERFACE                          │
│                                                                 │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐        │
│  │   Student    │  │   Teacher    │  │    Admin     │        │
│  │  Dashboard   │  │  Dashboard   │  │  Dashboard   │        │
│  │              │  │              │  │              │        │
│  │ • Enroll     │  │ • Approve    │  │ • Create     │        │
│  │ • Complete   │  │ • Sign TX    │  │ • Register   │        │
│  │ • Verify     │  │ • MetaMask   │  │ • Issue      │        │
│  └──────────────┘  └──────────────┘  └──────────────┘        │
│         │                  │                  │                │
│         └──────────────────┴──────────────────┘                │
│                            │                                    │
└────────────────────────────┼────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│                      BACKEND API LAYER                          │
│                                                                 │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │                    Express.js Server                      │  │
│  │                   (http://localhost:5000)                 │  │
│  └──────────────────────────────────────────────────────────┘  │
│                             │                                   │
│  ┌──────────────┬───────────┴───────────┬──────────────┐      │
│  │              │                       │              │      │
│  ▼              ▼                       ▼              ▼      │
│  [Auth]    [Courses]              [Enrollments]   [Certs]    │
│  • Login   • Create               • Enroll        • Generate  │
│  • Register• List                 • Approve       • Issue     │
│  • JWT     • Get                  • Complete      • Verify    │
│                                                                 │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │                    MongoDB Database                       │  │
│  │  Users | Courses | Enrollments | Certificates            │  │
│  └──────────────────────────────────────────────────────────┘  │
│                             │                                   │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │                  SHA-256 Hash Generator                   │  │
│  │  Input: "studentId|courseId|marks"                       │  │
│  │  Output: "a3f5b8c9d2e1f4a7b6c5d8e9f1a2b3c4..."          │  │
│  └──────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
                             │
                             │ Returns hash to frontend
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│                    BLOCKCHAIN LAYER                             │
│                                                                 │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │              Hardhat Local Network                        │  │
│  │            (http://localhost:8545)                        │  │
│  │                 Chain ID: 31337                           │  │
│  └──────────────────────────────────────────────────────────┘  │
│                             │                                   │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │           EducationSystem Smart Contract                  │  │
│  │                                                           │  │
│  │  Storage:                                                 │  │
│  │  • marksHashes[studentId][courseId] = hash               │  │
│  │  • certificateHashes[studentId][courseId] = hash         │  │
│  │  • marksApprovedBy[studentId][courseId] = teacherWallet  │  │
│  │  • certificateIssuedBy[studentId][courseId] = adminWallet│  │
│  │  • timestamps                                             │  │
│  │                                                           │  │
│  │  Functions:                                               │  │
│  │  • registerTeacher(address) - Admin only                 │  │
│  │  • storeMarksHash(id, course, hash) - Teacher only       │  │
│  │  • storeCertificateHash(id, course, hash) - Admin only   │  │
│  │  • verifyMarksHash(id, course, hash) - Public            │  │
│  │  • verifyCertificateHash(id, course, hash) - Public      │  │
│  └──────────────────────────────────────────────────────────┘  │
│                             │                                   │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │                      MetaMask                             │  │
│  │  • Signs transactions                                     │  │
│  │  • Provides wallet identity                              │  │
│  │  • Pays gas fees (free on local network)                 │  │
│  └──────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
```

---

## 🔄 Data Flow: Marks Approval

```
┌─────────────┐
│   Student   │
│  Completes  │
│   Lessons   │
└──────┬──────┘
       │
       │ 1. Complete all lessons
       ▼
┌─────────────────────┐
│   Backend (API)     │
│  • Tracks progress  │
│  • Status: completed│
└──────┬──────────────┘
       │
       │ 2. Teacher sees pending approval
       ▼
┌─────────────────────┐
│   Teacher (UI)      │
│  • Clicks "Approve" │
│  • MetaMask prompts │
└──────┬──────────────┘
       │
       │ 3. POST /enrollments/:id/approve
       ▼
┌─────────────────────────────────────┐
│   Backend (API)                     │
│  • Calculates marks (auto)          │
│  • Generates hash:                  │
│    SHA-256("studentId|courseId|85") │
│  • Returns hash to frontend         │
└──────┬──────────────────────────────┘
       │
       │ 4. Frontend receives hash
       ▼
┌─────────────────────────────────────┐
│   Frontend (React)                  │
│  • Calls blockchain.storeMarksHash()│
│  • MetaMask prompts for signature   │
└──────┬──────────────────────────────┘
       │
       │ 5. Teacher confirms in MetaMask
       ▼
┌─────────────────────────────────────┐
│   Smart Contract                    │
│  • Verifies teacher is registered   │
│  • Stores hash permanently          │
│  • Records teacher wallet address   │
│  • Records timestamp                │
│  • Emits MarksStored event          │
└──────┬──────────────────────────────┘
       │
       │ 6. Transaction confirmed
       ▼
┌─────────────────────────────────────┐
│   Student (UI)                      │
│  • Sees marks: 85/100               │
│  • Can verify on blockchain         │
│  • Hash comparison proves integrity │
└─────────────────────────────────────┘
```

---

## 🔒 Verification Flow

```
┌─────────────────────┐
│   Student           │
│  Clicks "Verify"    │
└──────┬──────────────┘
       │
       │ 1. Fetch marks from backend
       ▼
┌─────────────────────────────────────┐
│   Backend (API)                     │
│  Returns: {                         │
│    studentId: "123",                │
│    courseId: "math101",             │
│    marks: 85                        │
│  }                                  │
└──────┬──────────────────────────────┘
       │
       │ 2. Calculate hash locally
       ▼
┌─────────────────────────────────────┐
│   Frontend (Browser)                │
│  localHash = SHA-256("123|math101|85")│
│  Result: "a3f5b8c9d2e1f4a7..."      │
└──────┬──────────────────────────────┘
       │
       │ 3. Read hash from blockchain
       ▼
┌─────────────────────────────────────┐
│   Smart Contract (Read-only)       │
│  blockchainHash = getMarksHash(     │
│    "123", "math101"                 │
│  )                                  │
│  Result: "a3f5b8c9d2e1f4a7..."      │
└──────┬──────────────────────────────┘
       │
       │ 4. Compare hashes
       ▼
┌─────────────────────────────────────┐
│   Frontend (Comparison)             │
│                                     │
│  if (localHash === blockchainHash)  │
│    ✅ "Data is authentic!"          │
│  else                               │
│    ❌ "Data has been tampered!"     │
└─────────────────────────────────────┘
```

---

## 🎭 Role-Based Access Control

```
┌──────────────────────────────────────────────────────────┐
│                        STUDENT                           │
│  Authentication: Email/Password (JWT)                    │
│  MetaMask: NOT REQUIRED                                  │
│                                                          │
│  Can:                                                    │
│  ✅ Register & Login                                     │
│  ✅ Browse courses                                       │
│  ✅ Enroll in courses                                    │
│  ✅ Complete lessons                                     │
│  ✅ View marks                                           │
│  ✅ Verify marks (read blockchain)                       │
│  ✅ Download certificates                                │
│  ✅ Verify certificates (read blockchain)                │
│                                                          │
│  Cannot:                                                 │
│  ❌ Create courses                                       │
│  ❌ Approve completions                                  │
│  ❌ Issue certificates                                   │
│  ❌ Write to blockchain                                  │
└──────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────┐
│                        TEACHER                           │
│  Authentication: Email/Password (JWT) + MetaMask         │
│  MetaMask: REQUIRED for blockchain writes               │
│                                                          │
│  Can:                                                    │
│  ✅ Login                                                │
│  ✅ View all enrollments                                 │
│  ✅ Approve course completions                           │
│  ✅ Sign blockchain transactions (marks hash)            │
│  ✅ View approved enrollments                            │
│                                                          │
│  Cannot:                                                 │
│  ❌ Create courses                                       │
│  ❌ Register other teachers                              │
│  ❌ Issue certificates                                   │
│  ❌ Modify verified data                                 │
└──────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────┐
│                         ADMIN                            │
│  Authentication: Email/Password (JWT) + MetaMask         │
│  MetaMask: REQUIRED for blockchain writes               │
│                                                          │
│  Can:                                                    │
│  ✅ Login                                                │
│  ✅ Create courses                                       │
│  ✅ Register teachers (backend + blockchain)             │
│  ✅ View all enrollments                                 │
│  ✅ Issue certificates                                   │
│  ✅ Sign blockchain transactions (cert hash)             │
│  ✅ Audit all records                                    │
│  ✅ Full system access                                   │
│                                                          │
│  Cannot:                                                 │
│  ❌ Approve marks (teacher's job)                        │
│  ❌ Modify blockchain records (immutable)                │
└──────────────────────────────────────────────────────────┘
```

---

## 🔐 Security Layers

```
┌─────────────────────────────────────────────────────────┐
│                    LAYER 1: Frontend                    │
│  • Input validation                                     │
│  • MetaMask signature required for writes               │
│  • JWT token in localStorage                            │
│  • Role-based UI rendering                              │
└─────────────────────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────┐
│                    LAYER 2: Backend                     │
│  • JWT token verification                               │
│  • Role-based middleware                                │
│  • Password hashing (bcrypt)                            │
│  • Input sanitization                                   │
│  • CORS protection                                      │
└─────────────────────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────┐
│                   LAYER 3: Database                     │
│  • Encrypted connections                                │
│  • Indexed queries                                      │
│  • No sensitive data in plain text                      │
└─────────────────────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────┐
│                  LAYER 4: Blockchain                    │
│  • Immutable storage                                    │
│  • Cryptographic signatures                             │
│  • Role-based smart contract modifiers                  │
│  • Event logging                                        │
│  • Tamper detection via hash comparison                 │
└─────────────────────────────────────────────────────────┘
```

---

## 📊 Database Schema

```
┌─────────────────────────────────────────────────────────┐
│                      Users Collection                   │
├─────────────────────────────────────────────────────────┤
│  _id: ObjectId                                          │
│  email: String (unique, indexed)                        │
│  password: String (bcrypt hashed)                       │
│  name: String                                           │
│  role: String (student | teacher | admin)               │
│  walletAddress: String (optional, for teacher/admin)    │
│  createdAt: Date                                        │
└─────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────┐
│                    Courses Collection                   │
├─────────────────────────────────────────────────────────┤
│  _id: ObjectId                                          │
│  courseId: String (unique, indexed)                     │
│  title: String                                          │
│  description: String                                    │
│  lessons: Array [{title, content}]                      │
│  createdBy: ObjectId (ref: Users)                       │
│  createdAt: Date                                        │
└─────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────┐
│                 Enrollments Collection                  │
├─────────────────────────────────────────────────────────┤
│  _id: ObjectId                                          │
│  studentId: ObjectId (ref: Users, indexed)              │
│  courseId: ObjectId (ref: Courses, indexed)             │
│  completedLessons: Array [Number]                       │
│  status: String (enrolled | completed | approved)       │
│  marks: Number                                          │
│  marksHash: String (SHA-256)                            │
│  approvedBy: String (teacher wallet address)            │
│  approvedAt: Date                                       │
│  enrolledAt: Date                                       │
└─────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────┐
│                Certificates Collection                  │
├─────────────────────────────────────────────────────────┤
│  _id: ObjectId                                          │
│  studentId: ObjectId (ref: Users, indexed)              │
│  courseId: ObjectId (ref: Courses, indexed)             │
│  certificateData: String (JSON or Base64 PDF)           │
│  certificateHash: String (SHA-256)                      │
│  issuedBy: String (admin wallet address)                │
│  issuedAt: Date                                         │
└─────────────────────────────────────────────────────────┘
```

---

## 🌐 Network Topology

```
┌──────────────────────────────────────────────────────────┐
│                    Developer Machine                     │
│                                                          │
│  ┌────────────┐  ┌────────────┐  ┌────────────┐        │
│  │ Terminal 1 │  │ Terminal 2 │  │ Terminal 3 │        │
│  │ Blockchain │  │  Backend   │  │  Frontend  │        │
│  │   :8545    │  │   :5000    │  │   :3000    │        │
│  └────────────┘  └────────────┘  └────────────┘        │
│         │               │               │               │
│         └───────────────┴───────────────┘               │
│                         │                               │
│                    localhost                            │
└─────────────────────────┼────────────────────────────────┘
                          │
                          ▼
                  ┌───────────────┐
                  │    Browser    │
                  │ localhost:3000│
                  └───────┬───────┘
                          │
                          ▼
                  ┌───────────────┐
                  │   MetaMask    │
                  │  Extension    │
                  └───────────────┘
```

---

**These diagrams show the complete system architecture!**
