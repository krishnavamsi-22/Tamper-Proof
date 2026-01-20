// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title EducationSystem
 * @dev Tamper-proof storage for academic records using cryptographic hashes
 * 
 * BEGINNER EXPLANATION:
 * This contract is like a digital notary that stamps documents.
 * It doesn't store the actual marks or certificates (too expensive).
 * It only stores "fingerprints" (hashes) that prove data hasn't been changed.
 * 
 * Think of it like this:
 * - You write an essay and calculate its fingerprint
 * - You store the fingerprint here (immutable)
 * - Later, anyone can check if the essay was modified by comparing fingerprints
 */
contract EducationSystem {
    
    // ============================================
    // STATE VARIABLES (Permanent Storage)
    // ============================================
    
    /**
     * @dev Owner of the contract (Admin who deployed it)
     * Only this address can register teachers
     */
    address public admin;
    
    /**
     * @dev Mapping to track registered teachers
     * mapping(walletAddress => isTeacher)
     * Example: teachers[0x123...] = true means that wallet is a teacher
     */
    mapping(address => bool) public teachers;
    
    /**
     * @dev Nested mapping to store marks hashes
     * Structure: studentId => courseId => hash
     * Example: marksHashes["student123"]["math101"] = "a3f5b8c9..."
     * 
     * WHY NESTED? Because one student can have marks in multiple courses
     */
    mapping(string => mapping(string => string)) private marksHashes;
    
    /**
     * @dev Nested mapping to store certificate hashes
     * Structure: studentId => courseId => hash
     * Example: certificateHashes["student123"]["math101"] = "7f2e9a1b..."
     */
    mapping(string => mapping(string => string)) private certificateHashes;
    
    /**
     * @dev Mapping to track who stored each marks hash (accountability)
     * Structure: studentId => courseId => teacherWalletAddress
     * This proves WHO approved the marks
     */
    mapping(string => mapping(string => address)) public marksApprovedBy;
    
    /**
     * @dev Mapping to track who stored each certificate hash
     * Structure: studentId => courseId => adminWalletAddress
     */
    mapping(string => mapping(string => address)) public certificateIssuedBy;
    
    /**
     * @dev Mapping to track timestamps of marks storage
     * Structure: studentId => courseId => timestamp
     * This proves WHEN the marks were approved
     */
    mapping(string => mapping(string => uint256)) public marksTimestamp;
    
    /**
     * @dev Mapping to track timestamps of certificate storage
     * Structure: studentId => courseId => timestamp
     */
    mapping(string => mapping(string => uint256)) public certificateTimestamp;
    
    
    // ============================================
    // EVENTS (Blockchain Logs)
    // ============================================
    
    /**
     * @dev Emitted when a teacher is registered
     * Frontend can listen to this event to show notifications
     */
    event TeacherRegistered(address indexed teacherAddress, uint256 timestamp);
    
    /**
     * @dev Emitted when marks hash is stored
     * @param studentId The student's unique ID
     * @param courseId The course's unique ID
     * @param hash The SHA-256 hash of the marks
     * @param approvedBy The teacher's wallet address who approved
     */
    event MarksStored(
        string indexed studentId,
        string indexed courseId,
        string hash,
        address indexed approvedBy,
        uint256 timestamp
    );
    
    /**
     * @dev Emitted when certificate hash is stored
     */
    event CertificateStored(
        string indexed studentId,
        string indexed courseId,
        string hash,
        address indexed issuedBy,
        uint256 timestamp
    );
    
    
    // ============================================
    // MODIFIERS (Access Control)
    // ============================================
    
    /**
     * @dev Restricts function access to only the admin
     * If non-admin tries to call, transaction will revert (fail)
     */
    modifier onlyAdmin() {
        require(msg.sender == admin, "Only admin can perform this action");
        _;
    }
    
    /**
     * @dev Restricts function access to only registered teachers
     * msg.sender = the wallet address that called the function
     */
    modifier onlyTeacher() {
        require(teachers[msg.sender], "Only registered teachers can perform this action");
        _;
    }
    
    
    // ============================================
    // CONSTRUCTOR (Runs Once at Deployment)
    // ============================================
    
    /**
     * @dev Sets the contract deployer as the admin
     * msg.sender = the wallet address that deployed the contract
     */
    constructor() {
        admin = msg.sender;
    }
    
    
    // ============================================
    // ADMIN FUNCTIONS
    // ============================================
    
    /**
     * @dev Register a new teacher (only admin can do this)
     * @param teacherAddress The MetaMask wallet address of the teacher
     * 
     * FLOW:
     * 1. Admin calls this function via MetaMask
     * 2. MetaMask prompts admin to sign transaction
     * 3. Transaction is mined on blockchain
     * 4. Teacher's wallet is now authorized
     */
    function registerTeacher(address teacherAddress) external onlyAdmin {
        require(teacherAddress != address(0), "Invalid teacher address");
        require(!teachers[teacherAddress], "Teacher already registered");
        
        teachers[teacherAddress] = true;
        emit TeacherRegistered(teacherAddress, block.timestamp);
    }
    
    /**
     * @dev Remove a teacher (only admin can do this)
     * Useful if a teacher leaves the institution
     */
    function removeTeacher(address teacherAddress) external onlyAdmin {
        require(teachers[teacherAddress], "Teacher not registered");
        
        teachers[teacherAddress] = false;
    }
    
    
    // ============================================
    // TEACHER FUNCTIONS
    // ============================================
    
    /**
     * @dev Store marks hash on blockchain (only teachers can do this)
     * @param studentId The student's unique ID (e.g., "student123")
     * @param courseId The course's unique ID (e.g., "math101")
     * @param hash The SHA-256 hash of the marks (64 characters)
     * 
     * FLOW:
     * 1. Backend generates marks and calculates hash
     * 2. Frontend receives hash from backend
     * 3. Teacher clicks "Approve" button
     * 4. MetaMask prompts teacher to sign transaction
     * 5. This function stores hash permanently
     * 
     * WHY TEACHER SIGNS?
     * - Accountability: Blockchain records which teacher approved
     * - Non-repudiation: Teacher cannot deny approving later
     * - Security: Only authorized teachers can store hashes
     */
    function storeMarksHash(
        string memory studentId,
        string memory courseId,
        string memory hash
    ) external onlyTeacher {
        require(bytes(studentId).length > 0, "Student ID cannot be empty");
        require(bytes(courseId).length > 0, "Course ID cannot be empty");
        require(bytes(hash).length == 64, "Invalid hash length (must be 64 characters)");
        require(bytes(marksHashes[studentId][courseId]).length == 0, "Marks hash already exists");
        
        marksHashes[studentId][courseId] = hash;
        marksApprovedBy[studentId][courseId] = msg.sender;
        marksTimestamp[studentId][courseId] = block.timestamp;
        
        emit MarksStored(studentId, courseId, hash, msg.sender, block.timestamp);
    }
    
    
    // ============================================
    // ADMIN FUNCTIONS (Certificate Issuance)
    // ============================================
    
    /**
     * @dev Store certificate hash on blockchain (only admin can do this)
     * @param studentId The student's unique ID
     * @param courseId The course's unique ID
     * @param hash The SHA-256 hash of the certificate PDF
     * 
     * FLOW:
     * 1. Backend generates certificate PDF
     * 2. Backend calculates hash of PDF
     * 3. Frontend receives hash
     * 4. Admin clicks "Issue Certificate" button
     * 5. MetaMask prompts admin to sign transaction
     * 6. This function stores certificate hash permanently
     */
    function storeCertificateHash(
        string memory studentId,
        string memory courseId,
        string memory hash
    ) external onlyAdmin {
        require(bytes(studentId).length > 0, "Student ID cannot be empty");
        require(bytes(courseId).length > 0, "Course ID cannot be empty");
        require(bytes(hash).length == 64, "Invalid hash length (must be 64 characters)");
        require(bytes(marksHashes[studentId][courseId]).length > 0, "Marks must be stored first");
        require(bytes(certificateHashes[studentId][courseId]).length == 0, "Certificate hash already exists");
        
        certificateHashes[studentId][courseId] = hash;
        certificateIssuedBy[studentId][courseId] = msg.sender;
        certificateTimestamp[studentId][courseId] = block.timestamp;
        
        emit CertificateStored(studentId, courseId, hash, msg.sender, block.timestamp);
    }
    
    
    // ============================================
    // PUBLIC READ FUNCTIONS (Anyone Can Call)
    // ============================================
    
    /**
     * @dev Get stored marks hash (read-only, no gas cost)
     * @param studentId The student's unique ID
     * @param courseId The course's unique ID
     * @return The stored hash (empty string if not found)
     * 
     * USAGE:
     * - Student verifies their marks
     * - External auditor verifies marks
     * - No MetaMask signature needed (read-only)
     */
    function getMarksHash(
        string memory studentId,
        string memory courseId
    ) external view returns (string memory) {
        return marksHashes[studentId][courseId];
    }
    
    /**
     * @dev Get stored certificate hash (read-only, no gas cost)
     */
    function getCertificateHash(
        string memory studentId,
        string memory courseId
    ) external view returns (string memory) {
        return certificateHashes[studentId][courseId];
    }
    
    /**
     * @dev Verify if marks hash matches stored hash
     * @param studentId The student's unique ID
     * @param courseId The course's unique ID
     * @param hash The hash to verify
     * @return true if hash matches, false otherwise
     * 
     * USAGE:
     * 1. Download marks from backend
     * 2. Calculate hash locally
     * 3. Call this function to verify
     * 4. If returns true → Data is authentic
     * 5. If returns false → Data was tampered with
     */
    function verifyMarksHash(
        string memory studentId,
        string memory courseId,
        string memory hash
    ) external view returns (bool) {
        string memory storedHash = marksHashes[studentId][courseId];
        
        // Check if hash exists
        if (bytes(storedHash).length == 0) {
            return false;
        }
        
        // Compare hashes (Solidity doesn't have == for strings)
        return keccak256(abi.encodePacked(storedHash)) == keccak256(abi.encodePacked(hash));
    }
    
    /**
     * @dev Verify if certificate hash matches stored hash
     */
    function verifyCertificateHash(
        string memory studentId,
        string memory courseId,
        string memory hash
    ) external view returns (bool) {
        string memory storedHash = certificateHashes[studentId][courseId];
        
        if (bytes(storedHash).length == 0) {
            return false;
        }
        
        return keccak256(abi.encodePacked(storedHash)) == keccak256(abi.encodePacked(hash));
    }
    
    /**
     * @dev Get complete marks record (for auditing)
     * @return hash The stored marks hash
     * @return approvedBy The teacher who approved
     * @return timestamp When it was approved
     */
    function getMarksRecord(
        string memory studentId,
        string memory courseId
    ) external view returns (
        string memory hash,
        address approvedBy,
        uint256 timestamp
    ) {
        return (
            marksHashes[studentId][courseId],
            marksApprovedBy[studentId][courseId],
            marksTimestamp[studentId][courseId]
        );
    }
    
    /**
     * @dev Get complete certificate record (for auditing)
     */
    function getCertificateRecord(
        string memory studentId,
        string memory courseId
    ) external view returns (
        string memory hash,
        address issuedBy,
        uint256 timestamp
    ) {
        return (
            certificateHashes[studentId][courseId],
            certificateIssuedBy[studentId][courseId],
            certificateTimestamp[studentId][courseId]
        );
    }
    
    /**
     * @dev Check if an address is a registered teacher
     */
    function isTeacher(address account) external view returns (bool) {
        return teachers[account];
    }
}
