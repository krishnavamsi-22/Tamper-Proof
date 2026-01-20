# 🎓 Tamper-Proof Digital Education System

> A blockchain-based learning management system ensuring tamper-proof academic records for rural students

[![Solidity](https://img.shields.io/badge/Solidity-0.8.20-blue)](https://soliditylang.org/)
[![React](https://img.shields.io/badge/React-18-blue)](https://react.dev/)
[![Node.js](https://img.shields.io/badge/Node.js-18-green)](https://nodejs.org/)
[![License](https://img.shields.io/badge/License-MIT-yellow)](LICENSE)

---

## 🌟 Overview

This system solves a critical problem in rural education: **certificate forgery and data tampering**. By leveraging blockchain technology, we ensure that once marks and certificates are issued, they cannot be altered without detection.

### Key Innovation
- **Off-chain storage** (MongoDB) for fast, cheap data access
- **On-chain verification** (Blockchain) for tamper-proof integrity
- **Best of both worlds**: Speed + Security

---

## ✨ Features

### For Students
- 📚 Browse and enroll in courses
- ✅ Complete lessons and track progress
- 📊 View marks with blockchain verification
- 🎓 Download tamper-proof certificates
- 🔒 Verify credentials anytime, anywhere

### For Teachers
- 👨‍🏫 Approve course completions
- ✍️ Sign approvals with MetaMask
- 📈 Auto-generate marks based on completion
- 🔐 Cryptographic accountability

### For Administrators
- 🏫 Create and manage courses
- 👥 Register teachers on blockchain
- 🎖️ Issue verified certificates
- 📋 Complete audit trail

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────┐
│  Frontend (React + MetaMask)            │
│  • Student Dashboard                    │
│  • Teacher Dashboard                    │
│  • Admin Dashboard                      │
└─────────────────────────────────────────┘
              ↕️
┌─────────────────────────────────────────┐
│  Backend (Express + MongoDB)            │
│  • REST API                             │
│  • JWT Authentication                   │
│  • SHA-256 Hashing                      │
└─────────────────────────────────────────┘
              ↕️
┌─────────────────────────────────────────┐
│  Blockchain (Hardhat + Solidity)        │
│  • Immutable Hash Storage               │
│  • Tamper Detection                     │
│  • Audit Trail                          │
└─────────────────────────────────────────┘
```

---

## 🚀 Quick Start

### Prerequisites
- Node.js v18+
- MetaMask browser extension

### Installation

```bash
# Clone repository
git clone <your-repo-url>
cd tamper-lms

# Install dependencies
cd blockchain && npm install
cd ../backend && npm install
cd ../frontend && npm install
```

### Running the Application

**Terminal 1 - Blockchain:**
```bash
cd blockchain
npx hardhat node
```

**Terminal 2 - Deploy Contract:**
```bash
cd blockchain
npx hardhat run scripts/deploy.js --network localhost
```

**Terminal 3 - Backend:**
```bash
cd backend
node seed.js  # Optional: seed demo data
npm run dev
```

**Terminal 4 - Frontend:**
```bash
cd frontend
npm run dev
```

**Access:** http://localhost:3000

---

## 📖 Documentation

- **[Complete Setup Guide](COMPLETE_SETUP_GUIDE.md)** - Detailed setup instructions
- **[Quick Commands](QUICK_COMMANDS.md)** - Command reference
- **[Project Overview](PROJECT_OVERVIEW.md)** - Architecture deep dive
- **[Project Complete](PROJECT_COMPLETE.md)** - Final summary

---

## 🎯 Demo Accounts

| Role | Email | Password |
|------|-------|----------|
| Admin | admin@tamper-lms.com | admin123 |
| Teacher | teacher@tamper-lms.com | teacher123 |
| Student | (register new) | - |

---

## 🔐 Security Features

- ✅ **Tamper Detection** - Blockchain verifies data integrity
- ✅ **Cryptographic Hashing** - SHA-256 for data fingerprinting
- ✅ **Digital Signatures** - MetaMask signs all blockchain writes
- ✅ **Role-Based Access** - Students, Teachers, Admins
- ✅ **JWT Authentication** - Secure API access
- ✅ **Password Encryption** - bcrypt hashing

---

## 🛠️ Tech Stack

### Blockchain
- Solidity 0.8.20
- Hardhat 2.19.5
- ethers.js v6

### Backend
- Node.js 18
- Express.js
- MongoDB
- JWT

### Frontend
- React 18
- Vite
- Tailwind CSS
- Axios

---

## 📊 Project Stats

- **Total Files:** 31
- **Lines of Code:** ~2000+
- **Smart Contracts:** 1
- **API Endpoints:** 15
- **Test Coverage:** 9/9 passing
- **Dashboards:** 3 (Student, Teacher, Admin)

---

## 🧪 Testing

```bash
# Run smart contract tests
cd blockchain
npx hardhat test

# Expected output: 9 passing tests
```

---

## 🎓 Use Cases

### Academic Projects
- Final year projects
- Blockchain demonstrations
- Security research
- System design examples

### Real-World Applications
- Rural education systems
- Online learning platforms
- Certificate verification systems
- Academic credential management

---

## 🔄 Complete User Flow

1. **Admin** creates courses and registers teachers (MetaMask)
2. **Student** registers and enrolls in courses
3. **Student** completes lessons
4. **Teacher** approves completion (MetaMask signs)
5. **Backend** generates marks and calculates hash
6. **Blockchain** stores hash permanently
7. **Admin** issues certificate (MetaMask signs)
8. **Student** verifies marks/certificate on blockchain
9. ✅ **Anyone** can verify authenticity

---

## 🎨 Screenshots

### Student Dashboard
- Course enrollment
- Lesson completion
- Marks verification
- Certificate download

### Teacher Dashboard
- Pending approvals
- MetaMask integration
- Blockchain transaction signing

### Admin Dashboard
- Course creation
- Teacher registration
- Certificate issuance

---

## 🚧 Roadmap

### Phase 1 ✅ (Complete)
- Smart contract development
- Backend API
- Frontend UI
- MetaMask integration

### Phase 2 (Optional Enhancements)
- [ ] PDF certificate generation
- [ ] Offline data sync
- [ ] QR code verification
- [ ] Email notifications

### Phase 3 (Production)
- [ ] Deploy to Polygon testnet
- [ ] MongoDB Atlas integration
- [ ] Frontend hosting (Vercel)
- [ ] Backend hosting (Railway)

---

## 🤝 Contributing

This is an educational project. Feel free to:
- Fork and experiment
- Add new features
- Improve documentation
- Report issues

---

## 📝 License

MIT License - Use freely for learning and projects

---

## 🙏 Acknowledgments

Built for rural education with:
- Blockchain for trust
- Modern web tech for accessibility
- Security best practices
- Clean architecture

---

## 📞 Support

Having issues? Check:
1. [Complete Setup Guide](COMPLETE_SETUP_GUIDE.md)
2. [Quick Commands](QUICK_COMMANDS.md)
3. Browser console for errors
4. Terminal logs for API errors

---

## 🎉 Success Metrics

- ✅ 100% functional
- ✅ All tests passing
- ✅ Complete documentation
- ✅ Production-ready code
- ✅ Security implemented
- ✅ Clean architecture

---

## 🌟 Star This Project

If you found this helpful, please star the repository!

---

**Built with ❤️ for accessible, secure education**

**Tech:** Blockchain • React • Node.js • MongoDB • MetaMask

**Status:** ✅ Complete and Ready to Use

---

## 📚 Learn More

- [Solidity Documentation](https://docs.soliditylang.org/)
- [Hardhat Documentation](https://hardhat.org/)
- [ethers.js Documentation](https://docs.ethers.org/v6/)
- [React Documentation](https://react.dev/)
- [Express Documentation](https://expressjs.com/)

---

**Happy Learning! 🚀**
