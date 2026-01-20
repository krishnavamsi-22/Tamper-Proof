import { useState, useEffect } from 'react';
import { adminAPI } from '../services/api';

export default function AdminAutoLogin({ onLogin }) {
  const [status, setStatus] = useState('checking');
  const [message, setMessage] = useState('Checking MetaMask...');

  useEffect(() => {
    checkWallet();

    // Listen for MetaMask account changes
    if (window.ethereum) {
      window.ethereum.on('accountsChanged', handleAccountChange);
    }

    return () => {
      if (window.ethereum) {
        window.ethereum.removeListener('accountsChanged', handleAccountChange);
      }
    };
  }, []);

  const handleAccountChange = (accounts) => {
    console.log('🔄 Account changed:', accounts);
    if (accounts.length > 0) {
      setStatus('checking');
      setMessage('Checking new wallet...');
      checkWallet();
    } else {
      setStatus('locked');
      setMessage('Please unlock MetaMask');
    }
  };

  const checkWallet = async () => {
    if (!window.ethereum) {
      console.log('❌ MetaMask not detected');
      setStatus('no-metamask');
      setMessage('MetaMask extension not detected');
      return;
    }

    try {
      console.log('🔍 Requesting accounts...');
      const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
      console.log('📋 Accounts:', accounts);

      if (accounts.length === 0) {
        console.log('🔒 No accounts - MetaMask locked');
        setStatus('locked');
        setMessage('Please unlock MetaMask');
        return;
      }

      const walletAddress = accounts[0];
      console.log('✅ Wallet detected:', walletAddress);
      console.log('🔐 Attempting login...');
      
      setMessage('Authenticating...');
      const response = await adminAPI.walletLogin(walletAddress);
      
      console.log('✅ Login successful!', response.data);
      
      localStorage.setItem('token', response.data.token);
      localStorage.setItem('user', JSON.stringify(response.data.user));
      onLogin(response.data.user);

    } catch (error) {
      console.error('❌ Login failed:', error);
      console.error('Response:', error.response?.data);
      console.error('Status:', error.response?.status);
      
      if (error.response?.status === 403 || error.response?.status === 404) {
        setStatus('unauthorized');
        setMessage('This wallet is not authorized for admin access');
      } else {
        setStatus('error');
        setMessage(error.response?.data?.error || 'Authentication failed');
      }
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-600 to-purple-700 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-2xl p-8 w-full max-w-md text-center">
        
        <div className="mb-6">
          <div className="w-16 h-16 bg-indigo-600 rounded-full mx-auto mb-4 flex items-center justify-center">
            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-gray-800">Authority Portal</h1>
          <p className="text-gray-500 text-sm mt-1">Admin & Teacher Access</p>
        </div>

        {status === 'checking' && (
          <div className="space-y-4">
            <div className="flex justify-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
            </div>
            <p className="text-gray-700 font-medium">{message}</p>
          </div>
        )}

        {status === 'no-metamask' && (
          <div className="space-y-4">
            <h2 className="text-xl font-semibold text-gray-800">MetaMask Required</h2>
            <p className="text-gray-600">{message}</p>
            <a href="https://metamask.io/download/" target="_blank" rel="noopener noreferrer"
              className="inline-block bg-orange-500 text-white px-6 py-2 rounded-lg hover:bg-orange-600">
              Install MetaMask
            </a>
          </div>
        )}

        {status === 'locked' && (
          <div className="space-y-4">
            <div className="flex justify-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
            </div>
            <h2 className="text-xl font-semibold text-gray-800">Wallet Locked</h2>
            <p className="text-gray-600">{message}</p>
            <button onClick={checkWallet} className="bg-indigo-600 text-white px-6 py-2 rounded-lg hover:bg-indigo-700">
              Retry
            </button>
          </div>
        )}

        {status === 'unauthorized' && (
          <div className="space-y-4">
            <h2 className="text-xl font-semibold text-red-600">Access Denied</h2>
            <p className="text-gray-600">{message}</p>
            <button onClick={checkWallet} className="bg-indigo-600 text-white px-6 py-2 rounded-lg hover:bg-indigo-700">
              Retry
            </button>
          </div>
        )}

        {status === 'error' && (
          <div className="space-y-4">
            <h2 className="text-xl font-semibold text-yellow-600">Authentication Error</h2>
            <p className="text-gray-600">{message}</p>
            <button onClick={checkWallet} className="bg-indigo-600 text-white px-6 py-2 rounded-lg hover:bg-indigo-700">
              Retry
            </button>
          </div>
        )}

        <div className="mt-8 pt-6 border-t border-gray-200">
          <p className="text-xs text-gray-500">🔒 Secured by blockchain</p>
        </div>
      </div>
    </div>
  );
}
