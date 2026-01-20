# Backend API Documentation

## ✅ Phase 2 Complete: Express Backend

### Setup Instructions:

#### 1. Install MongoDB (Choose ONE option):

**Option A: MongoDB Atlas (Recommended - Cloud)**
1. Go to https://www.mongodb.com/cloud/atlas
2. Sign up for free account
3. Create a cluster (free tier)
4. Get connection string
5. Update `.env` file with your connection string

**Option B: Local MongoDB**
```bash
# Already using local? Update .env:
MONGODB_URI=mongodb://localhost:27017/tamper-lms
```

#### 2. Start Backend:

```bash
cd backend
npm run dev
```

#### 3. Seed Database (Optional):

```bash
node seed.js
```

This creates:
- Admin user (admin@tamper-lms.com / admin123)
- Teacher user (teacher@tamper-lms.com / teacher123)
- Sample courses (Math 101, Science 101)

---

## API Endpoints:

### Authentication (`/api/auth`)

**POST /api/auth/register**
- Register new student
- Body: `{ email, password, name }`
- Returns: `{ user, token }`

**POST /api/auth/login**
- Login user
- Body: `{ email, password }`
- Returns: `{ user, token }`

**GET /api/auth/me**
- Get current user
- Headers: `Authorization: Bearer <token>`
- Returns: `{ user }`

---

### Courses (`/api/courses`)

**POST /api/courses** (Admin only)
- Create course
- Headers: `Authorization: Bearer <token>`
- Body: `{ courseId, title, description, lessons }`

**GET /api/courses**
- Get all courses
- No auth required

**GET /api/courses/:id**
- Get single course
- No auth required

---

### Enrollments (`/api/enrollments`)

**POST /api/enrollments** (Student only)
- Enroll in course
- Headers: `Authorization: Bearer <token>`
- Body: `{ courseId }`

**GET /api/enrollments/my** (Student only)
- Get my enrollments
- Headers: `Authorization: Bearer <token>`

**POST /api/enrollments/:id/complete-lesson** (Student only)
- Mark lesson as complete
- Headers: `Authorization: Bearer <token>`
- Body: `{ lessonIndex }`

**POST /api/enrollments/:id/approve** (Teacher only)
- Approve completion & generate marks
- Headers: `Authorization: Bearer <token>`
- Body: `{ walletAddress }`
- Returns: `{ enrollment, marksHash }`

**GET /api/enrollments/all** (Teacher/Admin)
- Get all enrollments
- Headers: `Authorization: Bearer <token>`

---

### Certificates (`/api/certificates`)

**POST /api/certificates** (Admin only)
- Generate certificate
- Headers: `Authorization: Bearer <token>`
- Body: `{ enrollmentId, walletAddress }`
- Returns: `{ certificate, certificateHash }`

**GET /api/certificates/my** (Student only)
- Get my certificates
- Headers: `Authorization: Bearer <token>`

**GET /api/certificates/:id**
- Get certificate by ID
- No auth required (for verification)

---

### Admin (`/api/admin`)

**POST /api/admin/register-teacher** (Admin only)
- Register teacher
- Headers: `Authorization: Bearer <token>`
- Body: `{ email, password, name, walletAddress }`

**GET /api/admin/teachers** (Admin only)
- Get all teachers
- Headers: `Authorization: Bearer <token>`

---

## Testing with Postman/Thunder Client:

### 1. Register Student:
```
POST http://localhost:5000/api/auth/register
Body: {
  "email": "student@test.com",
  "password": "student123",
  "name": "Test Student"
}
```

### 2. Login:
```
POST http://localhost:5000/api/auth/login
Body: {
  "email": "student@test.com",
  "password": "student123"
}
```
Copy the `token` from response.

### 3. Get Courses:
```
GET http://localhost:5000/api/courses
```

### 4. Enroll in Course:
```
POST http://localhost:5000/api/enrollments
Headers: Authorization: Bearer <your-token>
Body: {
  "courseId": "<course-id-from-step-3>"
}
```

---

## Key Features:

✅ JWT authentication
✅ Role-based access control (Student, Teacher, Admin)
✅ Course management
✅ Enrollment tracking
✅ Automatic marks generation
✅ SHA-256 hash generation
✅ Certificate generation
✅ Secure password hashing (bcrypt)

---

## Next Steps:

- Build React frontend
- Integrate MetaMask
- Connect to blockchain
- Implement verification UI
- Add offline support

---

## Environment Variables:

```env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/tamper-lms
JWT_SECRET=your-secret-key
CONTRACT_ADDRESS=0x5FbDB2315678afecb367f032d93F642f64180aa3
BLOCKCHAIN_RPC=http://127.0.0.1:8545
```
