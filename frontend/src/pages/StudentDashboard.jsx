import { useState, useEffect } from 'react';
import { BrowserProvider, Contract } from 'ethers';
import { toast } from 'react-toastify';
import { courseAPI, enrollmentAPI, certificateAPI } from '../services/api';
import { calculateHash, verifyMarksHash, verifyCertificateHash } from '../services/blockchain';

export default function StudentDashboard({ user, onLogout }) {
  const [courses, setCourses] = useState([]);
  const [enrollments, setEnrollments] = useState([]);
  const [certificates, setCertificates] = useState([]);
  const [activeTab, setActiveTab] = useState('courses');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadData();
    
    // Auto-refresh every 5 seconds
    const interval = setInterval(() => {
      loadData();
    }, 5000);
    
    // Cleanup on unmount
    return () => clearInterval(interval);
  }, []);

  const loadData = async () => {
    try {
      const [coursesRes, enrollmentsRes, certsRes] = await Promise.all([
        courseAPI.getAll(),
        enrollmentAPI.getMy(),
        certificateAPI.getMy()
      ]);
      setCourses(coursesRes.data);
      setEnrollments(enrollmentsRes.data);
      setCertificates(certsRes.data);
    } catch (error) {
      console.error('Load error:', error);
      if (error.response?.status === 401) {
        toast.error('Session expired. Please login again.');
        onLogout();
      }
    }
  };

  const handleEnroll = async (courseId) => {
    setLoading(true);
    try {
      await enrollmentAPI.enroll(courseId);
      await loadData();
      toast.success('Enrolled successfully!');
    } catch (error) {
      toast.error(error.response?.data?.error || 'Enrollment failed');
    } finally {
      setLoading(false);
    }
  };

  const handleCompleteLesson = async (enrollmentId, lessonIndex) => {
    try {
      const res = await enrollmentAPI.completeLesson(enrollmentId, lessonIndex);
      await loadData();
      
      const updatedEnrollment = res.data;
      if (updatedEnrollment.status === 'completed') {
        toast.success('🎉 All lessons completed! Teacher can now approve your course.');
      } else {
        toast.success('Lesson completed!');
      }
    } catch (error) {
      toast.error('Failed to complete lesson');
    }
  };

  const handleVerifyMarks = async (enrollment) => {
    try {
      if (!window.ethereum) {
        toast.error('MetaMask not installed');
        return;
      }

      const courseId = enrollment.courseId.courseId;
      console.log('Verifying marks for:', { studentId: user.id, courseId, marks: enrollment.marks });
      
      // Calculate hash from current marks
      const calculatedHash = await calculateHash(`${user.id}|${courseId}|${enrollment.marks}`);
      console.log('Calculated hash:', calculatedHash);
      console.log('Stored hash in DB:', enrollment.marksHash);
      
      // Compare with stored hash in database
      if (calculatedHash === enrollment.marksHash) {
        toast.success('Marks are authentic!');
      } else {
        toast.error('Marks have been tampered!');
      }
    } catch (error) {
      console.error('Verification error:', error);
      toast.error('Verification failed.');
    }
  };

  const handleVerifyCertificate = async (cert) => {
    try {
      if (!window.ethereum) {
        toast.error('MetaMask not installed');
        return;
      }
      
      console.log('Verifying certificate:', cert);
      const certData = JSON.parse(cert.certificateData);
      console.log('Certificate data:', certData);
      
      // Calculate hash from certificate data
      const calculatedCertHash = await calculateHash(cert.certificateData);
      console.log('Calculated cert hash:', calculatedCertHash);
      console.log('Stored cert hash:', cert.certificateHash);
      
      // Verify certificate hash
      if (calculatedCertHash !== cert.certificateHash) {
        toast.error('Certificate has been tampered!');
        return;
      }
      
      // Verify marks hash if present
      if (certData.marksHash) {
        const calculatedMarksHash = await calculateHash(`${user.id}|${certData.courseId}|${certData.marks}`);
        console.log('Calculated marks hash:', calculatedMarksHash);
        console.log('Stored marks hash:', certData.marksHash);
        
        if (calculatedMarksHash !== certData.marksHash) {
          toast.error('Certificate is authentic, but marks have been tampered!');
          return;
        }
      }
      
      toast.success('Certificate and marks are both authentic!');
    } catch (error) {
      console.error('Certificate verification error:', error);
      toast.error('Verification failed: ' + error.message);
    }
  };

  const handleDownloadCertificate = (cert) => {
    const data = JSON.parse(cert.certificateData);
    const content = `
CERTIFICATE OF COMPLETION

This certifies that
${data.studentName}

has successfully completed the course
${data.courseTitle}

Marks: ${data.marks}/100
Issued: ${new Date(data.issuedAt).toLocaleDateString()}

Certificate Hash: ${cert.certificateHash}
Marks Hash: ${data.marksHash}
Verify on blockchain at any time.
    `;
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `certificate-${data.courseId}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const isEnrolled = (courseId) => enrollments.some(e => e.courseId._id === courseId);

  return (
    <div className="min-h-screen bg-gray-100">
      <nav className="bg-white shadow-md p-4">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <h1 className="text-2xl font-bold text-blue-600">Student Dashboard</h1>
          <div className="flex items-center gap-4">
            <span className="text-gray-700">Welcome, {user.name}</span>
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
            className={`px-6 py-2 rounded ${activeTab === 'courses' ? 'bg-blue-600 text-white' : 'bg-white'}`}
          >
            All Courses
          </button>
          <button
            onClick={() => setActiveTab('my-courses')}
            className={`px-6 py-2 rounded ${activeTab === 'my-courses' ? 'bg-blue-600 text-white' : 'bg-white'}`}
          >
            My Courses
          </button>
          <button
            onClick={() => setActiveTab('certificates')}
            className={`px-6 py-2 rounded ${activeTab === 'certificates' ? 'bg-blue-600 text-white' : 'bg-white'}`}
          >
            Certificates
          </button>
        </div>

        {activeTab === 'courses' && (
          <div className="grid md:grid-cols-2 gap-4">
            {courses.map(course => (
              <div key={course._id} className="bg-white p-6 rounded-lg shadow">
                <h3 className="text-xl font-bold mb-2">{course.title}</h3>
                <p className="text-sm text-blue-600 mb-2">Subject: {course.subject}</p>
                <p className="text-gray-600 mb-4">{course.description}</p>
                <p className="text-sm text-gray-500 mb-4">{course.lessons.length} lessons</p>
                {isEnrolled(course._id) ? (
                  <span className="text-green-600 font-semibold">✓ Enrolled</span>
                ) : (
                  <button
                    onClick={() => handleEnroll(course._id)}
                    disabled={loading}
                    className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
                  >
                    Enroll Now
                  </button>
                )}
              </div>
            ))}
          </div>
        )}

        {activeTab === 'my-courses' && (
          <div className="space-y-4">
            {enrollments.map(enrollment => (
              <div key={enrollment._id} className="bg-white p-6 rounded-lg shadow">
                <h3 className="text-xl font-bold mb-2">{enrollment.courseId.title}</h3>
                <p className="text-sm text-gray-600 mb-4">Status: <span className="font-semibold">{enrollment.status}</span></p>
                
                <div className="mb-4">
                  <h4 className="font-semibold mb-2">Lessons:</h4>
                  {enrollment.courseId.lessons.map((lesson, idx) => (
                    <div key={idx} className="flex items-center justify-between p-2 border-b">
                      <span>{lesson.title}</span>
                      {enrollment.completedLessons.includes(idx) ? (
                        <span className="text-green-600">✓ Completed</span>
                      ) : (
                        <button
                          onClick={() => handleCompleteLesson(enrollment._id, idx)}
                          className="bg-green-500 text-white px-3 py-1 rounded text-sm"
                        >
                          Complete
                        </button>
                      )}
                    </div>
                  ))}
                </div>

                {enrollment.marks !== undefined && (enrollment.status === 'approved' || enrollment.status === 'verified') && (
                  <div className="bg-blue-50 p-4 rounded">
                    <p className="font-semibold">Marks: {enrollment.marks}/100</p>
                    <button
                      onClick={() => handleVerifyMarks(enrollment)}
                      className="mt-2 bg-purple-600 text-white px-4 py-2 rounded hover:bg-purple-700"
                    >
                      🔒 Verify on Blockchain
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {activeTab === 'certificates' && (
          <div className="grid md:grid-cols-2 gap-4">
            {certificates.map(cert => (
              <div key={cert._id} className="bg-white p-6 rounded-lg shadow">
                <h3 className="text-xl font-bold mb-2">{cert.courseId.title}</h3>
                <p className="text-sm text-gray-600 mb-4">
                  Issued: {new Date(cert.issuedAt).toLocaleDateString()}
                </p>
                <div className="space-y-2">
                  <button
                    onClick={() => handleVerifyCertificate(cert)}
                    className="w-full bg-purple-600 text-white px-4 py-2 rounded hover:bg-purple-700"
                  >
                    🔒 Verify on Blockchain
                  </button>
                  <button
                    onClick={() => handleDownloadCertificate(cert)}
                    className="w-full bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
                  >
                    📄 Download Certificate
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
