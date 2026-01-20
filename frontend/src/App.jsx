import { useState, useEffect } from 'react';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import Login from './pages/Login';
import AdminAutoLogin from './pages/AdminAutoLogin';
import StudentDashboard from './pages/StudentDashboard';
import TeacherDashboard from './pages/TeacherDashboard';
import AdminDashboard from './pages/AdminDashboard';
import { adminAPI } from './services/api';
import './index.css';

function App() {
  const [user, setUser] = useState(null);
  const [isAdminRoute, setIsAdminRoute] = useState(false);

  useEffect(() => {
    const path = window.location.pathname;
    setIsAdminRoute(path === '/admin' || path.startsWith('/admin/'));

    const savedUser = localStorage.getItem('user');
    if (savedUser) {
      setUser(JSON.parse(savedUser));
    }

    // Listen for MetaMask account changes globally
    if (window.ethereum) {
      window.ethereum.on('accountsChanged', handleAccountChange);
    }

    return () => {
      if (window.ethereum) {
        window.ethereum.removeListener('accountsChanged', handleAccountChange);
      }
    };
  }, []);

  const handleAccountChange = async (accounts) => {
    console.log('🔄 Wallet changed:', accounts);
    
    // If user is admin/teacher and wallet changed, re-authenticate
    if (user && (user.role === 'admin' || user.role === 'teacher')) {
      if (accounts.length > 0) {
        try {
          const response = await adminAPI.walletLogin(accounts[0]);
          const newUser = response.data.user;
          
          localStorage.setItem('token', response.data.token);
          localStorage.setItem('user', JSON.stringify(newUser));
          
          // Force re-render by creating new object
          setUser({ ...newUser });
          
          console.log('✅ Switched to:', newUser.role, newUser.email);
        } catch (error) {
          console.log('❌ Wallet not authorized, logging out');
          handleLogout();
        }
      } else {
        handleLogout();
      }
    }
  };

  const handleLogin = (userData) => {
    setUser(userData);
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
  };

  if (!user) {
    if (isAdminRoute) {
      return <AdminAutoLogin onLogin={handleLogin} />;
    }
    return <Login onLogin={handleLogin} />;
  }

  if (user.role === 'student') {
    return (
      <>
        <StudentDashboard user={user} onLogout={handleLogout} />
        <ToastContainer position="top-right" autoClose={3000} />
      </>
    );
  }

  if (user.role === 'teacher') {
    return (
      <>
        <TeacherDashboard user={user} onLogout={handleLogout} />
        <ToastContainer position="top-right" autoClose={3000} />
      </>
    );
  }

  if (user.role === 'admin') {
    return (
      <>
        <AdminDashboard user={user} onLogout={handleLogout} />
        <ToastContainer position="top-right" autoClose={3000} />
      </>
    );
  }

  return <div>Unknown role</div>;
}

export default App;
