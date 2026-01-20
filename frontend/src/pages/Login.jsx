import { useState } from 'react';
import { authAPI } from '../services/api';

export default function Login({ onLogin }) {
  const [isRegister, setIsRegister] = useState(false);
  const [formData, setFormData] = useState({ email: '', password: '', name: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = isRegister 
        ? await authAPI.register(formData)
        : await authAPI.login({ email: formData.email, password: formData.password });
      
      localStorage.setItem('token', response.data.token);
      localStorage.setItem('user', JSON.stringify(response.data.user));
      onLogin(response.data.user);
    } catch (err) {
      setError(err.response?.data?.error || 'Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl p-8 w-full max-w-md">
        <h1 className="text-3xl font-bold text-center mb-2">Tamper-Proof LMS</h1>
        <p className="text-gray-600 text-center mb-6">Blockchain-Secured Education</p>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          {isRegister && (
            <input
              type="text"
              placeholder="Full Name"
              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
              value={formData.name}
              onChange={(e) => setFormData({...formData, name: e.target.value})}
              required
            />
          )}
          
          <input
            type="email"
            placeholder="Email"
            className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
            value={formData.email}
            onChange={(e) => setFormData({...formData, email: e.target.value})}
            required
          />
          
          <input
            type="password"
            placeholder="Password"
            className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
            value={formData.password}
            onChange={(e) => setFormData({...formData, password: e.target.value})}
            required
          />

          {error && <p className="text-red-500 text-sm">{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 disabled:bg-gray-400"
          >
            {loading ? 'Loading...' : (isRegister ? 'Register as Student' : 'Student Login')}
          </button>
        </form>

        <p className="text-center mt-4 text-sm">
          {isRegister ? 'Already have an account?' : "Don't have an account?"}
          <button
            onClick={() => setIsRegister(!isRegister)}
            className="text-blue-600 ml-1 hover:underline"
          >
            {isRegister ? 'Login' : 'Register'}
          </button>
        </p>

        <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded text-sm">
          <p className="font-semibold mb-2 text-blue-800">🔐 Authority Access:</p>
          <p className="text-blue-700">Admin & Teachers: Use MetaMask at <a href="/admin" className="underline font-medium">/admin</a></p>
          <p className="text-gray-600 text-xs mt-2">Students only: Email/Password login</p>
        </div>
      </div>
    </div>
  );
}
