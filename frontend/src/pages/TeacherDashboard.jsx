import { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import { enrollmentAPI } from '../services/api';
import { connectWallet, storeMarksHash, getConnectedAddress } from '../services/blockchain';

export default function TeacherDashboard({ user, onLogout }) {
  const [enrollments, setEnrollments] = useState([]);
  const [walletAddress, setWalletAddress] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadEnrollments();
    // Auto-connect wallet on load
    if (user.walletAddress && window.ethereum) {
      window.ethereum.request({ method: 'eth_accounts' })
        .then(accounts => {
          if (accounts.length > 0) {
            setWalletAddress(accounts[0]);
          }
        })
        .catch(console.error);
    }
  }, []);

  const loadEnrollments = async () => {
    try {
      const res = await enrollmentAPI.getAll();
      setEnrollments(res.data);
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
      
      if (user.walletAddress && address.toLowerCase() !== user.walletAddress.toLowerCase()) {
        toast.error(`Wrong MetaMask Account! Please switch to: ${user.walletAddress}`);
        return;
      }
      
      setWalletAddress(address);
      toast.success('Wallet connected: ' + address.slice(0, 6) + '...' + address.slice(-4));
    } catch (error) {
      toast.error('Failed to connect wallet: ' + error.message);
    }
  };

  const handleApprove = async (enrollment) => {
    setLoading(true);
    try {
      const address = await connectWallet();
      setWalletAddress(address);
      
      if (address.toLowerCase() !== user.walletAddress?.toLowerCase()) {
        toast.error(`Wrong MetaMask account! Please switch to: ${user.walletAddress}`);
        setLoading(false);
        return;
      }

      console.log('Approving enrollment:', enrollment._id);
      const res = await enrollmentAPI.approve(enrollment._id, address);
      console.log('Approval response:', res.data);
      const { marksHash } = res.data;
      console.log('Marks hash to store:', marksHash);
      console.log('Student ID:', enrollment.studentId._id);
      console.log('Course ID:', enrollment.courseId.courseId);

      const txHash = await storeMarksHash(
        enrollment.studentId._id,
        enrollment.courseId.courseId,
        marksHash
      );
      console.log('Blockchain tx hash:', txHash);
      
      toast.success(`Marks approved and stored on blockchain! Tx: ${txHash.slice(0, 10)}...`);
      await loadEnrollments();
    } catch (error) {
      console.error('Approval error:', error);
      let errorMsg = error.response?.data?.error || error.message;
      if (error.message?.includes('Only registered teachers')) {
        errorMsg = 'Your wallet is not registered as a teacher on blockchain.';
      }
      toast.error('Approval failed: ' + errorMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100">
      <nav className="bg-white shadow-md p-4">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <h1 className="text-2xl font-bold text-green-600">Teacher Dashboard</h1>
          <div className="flex items-center gap-4">
            <span className="text-gray-700">{user.name}</span>
            {walletAddress ? (
              <span className="text-xs bg-green-100 px-3 py-1 rounded">
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
        <div className="mb-6">
          <h2 className="text-2xl font-bold">Your Subject: <span className="text-green-600">{user.subject}</span></h2>
          <p className="text-gray-600">You can only approve courses in your subject</p>
        </div>

        <h2 className="text-2xl font-bold mb-6">Pending Approvals</h2>
        <div className="space-y-4">
          {enrollments.filter(e => e.status === 'completed' && e.courseId && e.studentId).map(enrollment => (
            <div key={enrollment._id} className="bg-white p-6 rounded-lg shadow">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="text-xl font-bold">{enrollment.courseId.title}</h3>
                  <p className="text-sm text-blue-600">Subject: {enrollment.courseId.subject}</p>
                  <p className="text-gray-600">Student: {enrollment.studentId.name}</p>
                  <p className="text-gray-600">Email: {enrollment.studentId.email}</p>
                  <p className="text-sm text-gray-500 mt-2">
                    Completed: {enrollment.completedLessons.length}/{enrollment.courseId.lessons.length} lessons
                  </p>
                </div>
                <button
                  onClick={() => handleApprove(enrollment)}
                  disabled={loading}
                  className="bg-green-600 text-white px-6 py-2 rounded hover:bg-green-700 disabled:bg-gray-400"
                >
                  {loading ? 'Processing...' : 'Approve & Store on Blockchain'}
                </button>
              </div>
            </div>
          ))}

          {enrollments.filter(e => e.status === 'completed').length === 0 && (
            <p className="text-gray-500 text-center py-8">No pending approvals</p>
          )}
        </div>

        <h2 className="text-2xl font-bold mt-12 mb-6">Approved Enrollments</h2>
        <div className="space-y-4">
          {enrollments.filter(e => (e.status === 'approved' || e.status === 'verified') && e.courseId && e.studentId).map(enrollment => (
            <div key={enrollment._id} className="bg-green-50 p-6 rounded-lg shadow">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="text-xl font-bold">{enrollment.courseId.title}</h3>
                  <p className="text-sm text-blue-600">Subject: {enrollment.courseId.subject}</p>
                  <p className="text-gray-600">Student: {enrollment.studentId.name}</p>
                  <p className="text-gray-600">Email: {enrollment.studentId.email}</p>
                  <p className="text-green-600 font-semibold mt-2">✓ Approved - Marks: {enrollment.marks}/100</p>
                  {enrollment.status === 'verified' && (
                    <p className="text-purple-600 font-semibold">✓ Certificate Issued</p>
                  )}
                </div>
                <span className="text-green-600 font-semibold">✓ Approved</span>
              </div>
            </div>
          ))}

          {enrollments.filter(e => e.status === 'approved' || e.status === 'verified').length === 0 && (
            <p className="text-gray-500 text-center py-8">No approved enrollments</p>
          )}
        </div>
      </div>
    </div>
  );
}
