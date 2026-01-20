import { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import { courseAPI, enrollmentAPI, certificateAPI, adminAPI } from '../services/api';
import { connectWallet, registerTeacher, storeCertificateHash } from '../services/blockchain';

export default function AdminDashboard({ user, onLogout }) {
  const [activeTab, setActiveTab] = useState('courses');
  const [courses, setCourses] = useState([]);
  const [enrollments, setEnrollments] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [walletAddress, setWalletAddress] = useState('');
  const [loading, setLoading] = useState(false);

  const [courseForm, setCourseForm] = useState({
    courseId: '', title: '', description: '', subject: '',
    lessons: [{ title: '', content: '' }]
  });

  const [teacherForm, setTeacherForm] = useState({
    email: '', password: '', name: '', walletAddress: '', subject: ''
  });

  useEffect(() => {
    loadData();
    if (user.walletAddress) setWalletAddress(user.walletAddress);
  }, []);

  const loadData = async () => {
    try {
      const [coursesRes, enrollmentsRes] = await Promise.all([
        courseAPI.getAll(),
        enrollmentAPI.getAll()
      ]);
      setCourses(coursesRes.data);
      
      // Load teachers separately with error handling
      try {
        const teachersRes = await adminAPI.getTeachers();
        setTeachers(teachersRes.data);
      } catch (teacherError) {
        console.error('Could not load teachers:', teacherError);
        if (teacherError.response?.status === 401) {
          console.log('Unauthorized - token may be expired');
        }
      }
      
      // Try to load certificates, but don't fail if it errors
      try {
        const certsRes = await certificateAPI.getAll();
        const issuedCertificates = new Set(
          certsRes.data.map(c => `${c.studentId._id}-${c.courseId._id}`)
        );
        
        const enrollmentsWithCertStatus = enrollmentsRes.data.map(e => ({
          ...e,
          hasCertificate: issuedCertificates.has(`${e.studentId._id}-${e.courseId._id}`)
        }));
        setEnrollments(enrollmentsWithCertStatus);
      } catch (certError) {
        console.log('Could not load certificates, using enrollments without cert status');
        setEnrollments(enrollmentsRes.data);
      }
    } catch (error) {
      console.error('Load error:', error);
      if (error.response?.status === 401) {
        toast.error('Session expired. Please login again.');
        onLogout();
      }
    }
  };

  const handleConnectWallet = async () => {
    try {
      const address = await connectWallet();
      setWalletAddress(address);
      toast.success('Wallet connected: ' + address.slice(0, 6) + '...' + address.slice(-4));
    } catch (error) {
      toast.error('Failed to connect wallet: ' + error.message);
    }
  };

  const handleCreateCourse = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await courseAPI.create(courseForm);
      toast.success('Course created!');
      setCourseForm({ courseId: '', title: '', description: '', subject: '', lessons: [{ title: '', content: '' }] });
      await loadData();
    } catch (error) {
      toast.error('Failed to create course: ' + error.response?.data?.error);
    } finally {
      setLoading(false);
    }
  };

  const handleRegisterTeacher = async (e) => {
    e.preventDefault();
    if (!walletAddress) {
      toast.error('Connect MetaMask first');
      return;
    }

    setLoading(true);
    try {
      await adminAPI.registerTeacher(teacherForm);
      await connectWallet();
      await registerTeacher(teacherForm.walletAddress);

      toast.success('Teacher registered successfully!');
      setTeacherForm({ email: '', password: '', name: '', walletAddress: '', subject: '' });
      await loadData();
    } catch (error) {
      const errorMsg = error.response?.data?.error || error.message;
      toast.error('Failed to register teacher: ' + errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const handleIssueCertificate = async (enrollment) => {
    setLoading(true);
    try {
      let currentWallet = walletAddress;
      if (!currentWallet) {
        currentWallet = await connectWallet();
        setWalletAddress(currentWallet);
      } else {
        await connectWallet();
      }
      
      console.log('Issuing certificate for enrollment:', enrollment._id);
      const res = await certificateAPI.generate(enrollment._id, currentWallet);
      console.log('Certificate response:', res.data);
      const { certificateHash } = res.data;
      console.log('Certificate hash to store:', certificateHash);
      console.log('Student ID:', enrollment.studentId._id);
      console.log('Course ID:', enrollment.courseId.courseId);

      const txHash = await storeCertificateHash(
        enrollment.studentId._id,
        enrollment.courseId.courseId,
        certificateHash
      );
      console.log('Blockchain tx hash:', txHash);

      toast.success(`Certificate issued and stored on blockchain! Tx: ${txHash.slice(0, 10)}...`);
      await loadData();
    } catch (error) {
      console.error('Certificate issuance error:', error);
      const errorMsg = error.response?.data?.error || error.message;
      
      if (errorMsg.includes('already issued')) {
        toast.warning('Certificate already issued for this student/course.');
      } else {
        toast.error('Failed to issue certificate: ' + errorMsg);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100">
      <nav className="bg-white shadow-md p-4">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <h1 className="text-2xl font-bold text-purple-600">Admin Dashboard</h1>
          <div className="flex items-center gap-4">
            <span className="text-gray-700">{user.name}</span>
            {walletAddress ? (
              <span className="text-xs bg-purple-100 px-3 py-1 rounded">
                🔗 {walletAddress.slice(0, 6)}...{walletAddress.slice(-4)}
              </span>
            ) : (
              <button
                onClick={handleConnectWallet}
                className="bg-orange-500 text-white px-4 py-2 rounded hover:bg-orange-600"
              >
                Connect MetaMask
              </button>
            )}
            <button onClick={onLogout} className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600">
              Logout
            </button>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto p-6">
        <div className="flex gap-4 mb-6">
          <button
            onClick={() => setActiveTab('courses')}
            className={`px-6 py-2 rounded ${activeTab === 'courses' ? 'bg-purple-600 text-white' : 'bg-white'}`}
          >
            Create Course
          </button>
          <button
            onClick={() => setActiveTab('teachers')}
            className={`px-6 py-2 rounded ${activeTab === 'teachers' ? 'bg-purple-600 text-white' : 'bg-white'}`}
          >
            Register Teacher
          </button>
          <button
            onClick={() => setActiveTab('certificates')}
            className={`px-6 py-2 rounded ${activeTab === 'certificates' ? 'bg-purple-600 text-white' : 'bg-white'}`}
          >
            Issue Certificates
          </button>
        </div>

        {activeTab === 'courses' && (
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-xl font-bold mb-4">Create New Course</h2>
            <form onSubmit={handleCreateCourse} className="space-y-4">
              <input
                type="text"
                placeholder="Course ID (e.g., math101)"
                className="w-full px-4 py-2 border rounded"
                value={courseForm.courseId}
                onChange={(e) => setCourseForm({...courseForm, courseId: e.target.value})}
                required
              />
              <input
                type="text"
                placeholder="Course Title"
                className="w-full px-4 py-2 border rounded"
                value={courseForm.title}
                onChange={(e) => setCourseForm({...courseForm, title: e.target.value})}
                required
              />
              <input
                type="text"
                placeholder="Subject (e.g., Mathematics, Physics)"
                className="w-full px-4 py-2 border rounded"
                value={courseForm.subject}
                onChange={(e) => setCourseForm({...courseForm, subject: e.target.value})}
                required
              />
              <textarea
                placeholder="Description"
                className="w-full px-4 py-2 border rounded"
                value={courseForm.description}
                onChange={(e) => setCourseForm({...courseForm, description: e.target.value})}
                required
              />
              
              <div>
                <h3 className="font-semibold mb-2">Lessons:</h3>
                {courseForm.lessons.map((lesson, idx) => (
                  <div key={idx} className="flex gap-2 mb-2">
                    <input
                      type="text"
                      placeholder="Lesson Title"
                      className="flex-1 px-4 py-2 border rounded"
                      value={lesson.title}
                      onChange={(e) => {
                        const newLessons = [...courseForm.lessons];
                        newLessons[idx].title = e.target.value;
                        setCourseForm({...courseForm, lessons: newLessons});
                      }}
                    />
                    <input
                      type="text"
                      placeholder="Content"
                      className="flex-1 px-4 py-2 border rounded"
                      value={lesson.content}
                      onChange={(e) => {
                        const newLessons = [...courseForm.lessons];
                        newLessons[idx].content = e.target.value;
                        setCourseForm({...courseForm, lessons: newLessons});
                      }}
                    />
                  </div>
                ))}
                <button
                  type="button"
                  onClick={() => setCourseForm({...courseForm, lessons: [...courseForm.lessons, {title: '', content: ''}]})}
                  className="text-blue-600 text-sm"
                >
                  + Add Lesson
                </button>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-purple-600 text-white py-2 rounded hover:bg-purple-700"
              >
                Create Course
              </button>
            </form>
          </div>
        )}

        {activeTab === 'teachers' && (
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-xl font-bold mb-4">Register Teacher</h2>
            <form onSubmit={handleRegisterTeacher} className="space-y-4">
              <input
                type="text"
                placeholder="Full Name"
                className="w-full px-4 py-2 border rounded"
                value={teacherForm.name}
                onChange={(e) => setTeacherForm({...teacherForm, name: e.target.value})}
                required
              />
              <input
                type="email"
                placeholder="Email"
                className="w-full px-4 py-2 border rounded"
                value={teacherForm.email}
                onChange={(e) => setTeacherForm({...teacherForm, email: e.target.value})}
                required
              />
              <input
                type="password"
                placeholder="Password"
                className="w-full px-4 py-2 border rounded"
                value={teacherForm.password}
                onChange={(e) => setTeacherForm({...teacherForm, password: e.target.value})}
                required
              />
              <input
                type="text"
                placeholder="Subject (e.g., Mathematics, Physics)"
                className="w-full px-4 py-2 border rounded"
                value={teacherForm.subject}
                onChange={(e) => setTeacherForm({...teacherForm, subject: e.target.value})}
                required
              />
              <input
                type="text"
                placeholder="Wallet Address (0x...)"
                className="w-full px-4 py-2 border rounded"
                value={teacherForm.walletAddress}
                onChange={(e) => setTeacherForm({...teacherForm, walletAddress: e.target.value})}
                required
              />
              <button
                type="submit"
                disabled={loading || !walletAddress}
                className="w-full bg-purple-600 text-white py-2 rounded hover:bg-purple-700 disabled:bg-gray-400"
              >
                Register Teacher (Blockchain)
              </button>
            </form>

            <div className="mt-8">
              <h3 className="font-bold mb-4">Registered Teachers:</h3>
              {teachers.map(teacher => (
                <div key={teacher._id} className="p-4 border-b">
                  <p className="font-semibold">{teacher.name}</p>
                  <p className="text-sm text-gray-600">{teacher.email}</p>
                  <p className="text-sm text-blue-600">Subject: {teacher.subject}</p>
                  <p className="text-xs text-gray-500">{teacher.walletAddress}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'certificates' && (
          <div className="space-y-4">
            <h2 className="text-xl font-bold">Issue Certificates</h2>
            {enrollments.filter(e => (e.status === 'approved' || e.status === 'verified') && e.courseId && e.studentId).map(enrollment => (
              <div key={enrollment._id} className="bg-white p-6 rounded-lg shadow">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="text-xl font-bold">{enrollment.courseId.title}</h3>
                    <p className="text-gray-600">Student: {enrollment.studentId.name}</p>
                    <p className="text-gray-600">Marks: {enrollment.marks}/100</p>
                    {enrollment.status === 'verified' && (
                      <p className="text-green-600 font-semibold mt-2">✓ Certificate Issued</p>
                    )}
                  </div>
                  <button
                    onClick={() => handleIssueCertificate(enrollment)}
                    disabled={loading || enrollment.status === 'verified'}
                    className="bg-purple-600 text-white px-6 py-2 rounded hover:bg-purple-700 disabled:bg-gray-400"
                  >
                    {enrollment.status === 'verified' ? '✓ Verified' : 'Issue Certificate'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
