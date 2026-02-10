# Assignment Retry & Marks Calculation Implementation

## ✅ Features Implemented

### 1. **Submission Model Updates**
- Added `attemptNumber` field (1-3)
- Added `canRetryAfter` field (8-hour cooldown timestamp)
- Modified unique index to allow multiple attempts per assignment

### 2. **Assignment Submission Logic**
- Check existing submissions before allowing new submission
- Track attempt number (max 3 attempts)
- Enforce 8-hour cooldown between attempts
- Block submissions after 3 attempts
- Allow resubmission only if:
  - Previous submission evaluated
  - Failed (marks < passing marks)
  - Cooldown period expired
  - Attempts < 3

### 3. **Marks Calculation**
- If course has NO assignments → marks = 100
- If course has assignments:
  - Get all submissions for each assignment
  - Find HIGHEST marks from all attempts for each assignment
  - Calculate average: `sum(highest_marks) / total_assignments`
  - Round to nearest integer

### 4. **Approval Button Logic**
- Button DISABLED if:
  - Any assignment not submitted
  - Any assignment not evaluated
  - Any assignment failed AND attempts < 3
- Button ENABLED if:
  - No assignments in course, OR
  - All assignments have evaluated submissions AND
  - Each assignment either passed OR used all 3 attempts

### 5. **Teacher Dashboard**
- Shows `canApprove` flag for each enrollment
- Displays warning message when approval blocked
- Message: "⏳ Waiting for all assignments to be evaluated or student to complete retry attempts"
- Approve button disabled when `canApprove = false`

### 6. **Student Dashboard**
- Shows attempt number (e.g., "Attempt 2/3")
- Shows highest marks achieved across all attempts
- Shows latest submission details
- If failed and attempts < 3:
  - Shows cooldown timer
  - Allows retry after cooldown expires
  - Shows retry submission form
- If attempts = 3:
  - Shows "Maximum attempts reached" message
  - Disables submission permanently
- Color coding:
  - Green border = Passed
  - Red border = Failed

---

## 📊 Example Workflow

### Course: "Mathematics" with 3 Assignments

**Student Journey:**

#### Assignment 1:
1. Attempt 1: 35 marks (FAIL) ❌
2. Wait 8 hours ⏳
3. Attempt 2: 60 marks (PASS) ✅
4. **Best: 60 marks**

#### Assignment 2:
1. Attempt 1: 85 marks (PASS) ✅
2. **Best: 85 marks**

#### Assignment 3:
1. Attempt 1: 30 marks (FAIL) ❌
2. Wait 8 hours ⏳
3. Attempt 2: 38 marks (FAIL) ❌
4. Wait 8 hours ⏳
5. Attempt 3: 42 marks (PASS) ✅
6. **Best: 42 marks**

**Final Marks = (60 + 85 + 42) / 3 = 62.33 ≈ 62**

**Approval Button:**
- Disabled during attempts 1-2 of Assignment 1 (student has retries)
- Disabled during attempts 1-2 of Assignment 3 (student has retries)
- **ENABLED** after all assignments evaluated and passed/max attempts used

---

## 🗂️ Files Modified

### Backend:
1. `backend/models/Submission.js`
   - Added attemptNumber field
   - Added canRetryAfter field
   - Modified unique index

2. `backend/routes/assignments.js`
   - Updated submit endpoint with retry logic
   - Added attempt tracking
   - Added 8-hour cooldown
   - Updated get submissions to sort by attempt

3. `backend/routes/enrollments.js`
   - Updated approve endpoint to calculate marks from assignments
   - Added canApprove flag logic in get all enrollments
   - Check assignment completion status

### Frontend:
4. `frontend/src/pages/TeacherDashboard.jsx`
   - Added canApprove check
   - Added warning message
   - Disabled approve button conditionally

5. `frontend/src/pages/StudentDashboard.jsx`
   - Show all attempts for each assignment
   - Show highest marks
   - Show attempt number
   - Show cooldown timer
   - Show retry form
   - Show max attempts message
   - Color coding for pass/fail

---

## 🧪 Testing Checklist

### Test Scenario 1: First Submission
- [ ] Student submits assignment (Attempt 1)
- [ ] Teacher evaluates
- [ ] If passed → Approve button enabled
- [ ] If failed → Approve button disabled

### Test Scenario 2: Retry After Failure
- [ ] Student fails assignment (Attempt 1)
- [ ] Student sees cooldown message
- [ ] After 8 hours, retry form appears
- [ ] Student submits again (Attempt 2)
- [ ] Teacher evaluates
- [ ] If passed → Approve button enabled
- [ ] If failed → Approve button still disabled

### Test Scenario 3: Max Attempts
- [ ] Student fails 3 times
- [ ] "Maximum attempts reached" message shown
- [ ] Retry form disabled
- [ ] Approve button ENABLED (no more chances)

### Test Scenario 4: Marks Calculation
- [ ] Course with 3 assignments
- [ ] Student gets: 60, 85, 42 (highest from each)
- [ ] Teacher approves
- [ ] Final marks = 62 (average)
- [ ] Marks stored on blockchain

### Test Scenario 5: No Assignments
- [ ] Course with no assignments
- [ ] Student completes lessons
- [ ] Approve button enabled immediately
- [ ] Final marks = 100

---

## 🔑 Key Points

✅ **Only highest marks from each assignment used**
✅ **8-hour cooldown between attempts**
✅ **Maximum 3 attempts per assignment**
✅ **Approve button logic prevents premature approval**
✅ **Average marks calculated from all assignments**
✅ **No assignments = 100 marks (default)**

---

## 🚀 Ready to Test!

All features implemented and ready for testing.
