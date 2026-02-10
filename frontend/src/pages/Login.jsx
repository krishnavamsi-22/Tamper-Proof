import { useState } from 'react';
import { authAPI } from '../services/api';
import {
  Box, Card, CardContent, TextField, Button, Typography, Alert, Link,
  Container, Paper, Divider, Avatar
} from '@mui/material';
import { School, Login as LoginIcon, PersonAdd } from '@mui/icons-material';

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
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        p: 2
      }}
    >
      <Container maxWidth="sm">
        <Box sx={{ textAlign: 'center', mb: 4 }}>
          <Avatar sx={{ width: 80, height: 80, bgcolor: 'white', color: '#667eea', mx: 'auto', mb: 2 }}>
            <School sx={{ fontSize: 50 }} />
          </Avatar>
          <Typography variant="h3" fontWeight="bold" color="white" gutterBottom>
            Tamper-Proof LMS
          </Typography>
          <Typography variant="h6" color="rgba(255,255,255,0.9)">
            🔒 Blockchain-Secured Education
          </Typography>
        </Box>

        <Card elevation={8} sx={{ borderRadius: 3 }}>
          <CardContent sx={{ p: 4 }}>
            <Typography variant="h5" fontWeight="bold" gutterBottom textAlign="center">
              {isRegister ? 'Create Student Account' : 'Student Login'}
            </Typography>
            <Typography variant="body2" color="text.secondary" textAlign="center" sx={{ mb: 3 }}>
              {isRegister ? 'Register to start learning' : 'Welcome back! Please login to continue'}
            </Typography>

            <form onSubmit={handleSubmit}>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                {isRegister && (
                  <TextField
                    fullWidth
                    label="Full Name"
                    variant="outlined"
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    required
                  />
                )}
                
                <TextField
                  fullWidth
                  label="Email Address"
                  type="email"
                  variant="outlined"
                  value={formData.email}
                  onChange={(e) => setFormData({...formData, email: e.target.value})}
                  required
                />
                
                <TextField
                  fullWidth
                  label="Password"
                  type="password"
                  variant="outlined"
                  value={formData.password}
                  onChange={(e) => setFormData({...formData, password: e.target.value})}
                  required
                />

                {error && (
                  <Alert severity="error">{error}</Alert>
                )}

                <Button
                  type="submit"
                  variant="contained"
                  size="large"
                  fullWidth
                  disabled={loading}
                  startIcon={isRegister ? <PersonAdd /> : <LoginIcon />}
                  sx={{
                    py: 1.5,
                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                    '&:hover': {
                      background: 'linear-gradient(135deg, #764ba2 0%, #667eea 100%)',
                    }
                  }}
                >
                  {loading ? 'Loading...' : (isRegister ? 'Register' : 'Login')}
                </Button>
              </Box>
            </form>

            <Box sx={{ textAlign: 'center', mt: 3 }}>
              <Typography variant="body2" color="text.secondary">
                {isRegister ? 'Already have an account?' : "Don't have an account?"}
                {' '}
                <Link
                  component="button"
                  variant="body2"
                  onClick={() => setIsRegister(!isRegister)}
                  sx={{ fontWeight: 'bold', cursor: 'pointer' }}
                >
                  {isRegister ? 'Login' : 'Register'}
                </Link>
              </Typography>
            </Box>
          </CardContent>
        </Card>

        <Paper elevation={4} sx={{ mt: 3, p: 3, borderRadius: 2, bgcolor: 'rgba(255,255,255,0.95)' }}>
          <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
            🔑 Authority Access
          </Typography>
          <Typography variant="body2" color="text.secondary" gutterBottom>
            Admin & Teachers: Use MetaMask authentication
          </Typography>
          <Link href="/admin" underline="hover" sx={{ fontWeight: 'bold', display: 'block', mt: 1 }}>
            → Go to Admin Portal
          </Link>
          <Divider sx={{ my: 2 }} />
          <Typography variant="caption" color="text.secondary">
            ℹ️ Students use email/password login above
          </Typography>
        </Paper>
      </Container>
    </Box>
  );
}
