import { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import { courseAPI, enrollmentAPI, certificateAPI, adminAPI } from '../services/api';
import { connectWallet, registerTeacher, storeCertificateHash } from '../services/blockchain';
import {
  Box, Drawer, AppBar, Toolbar, Typography, IconButton, List, ListItemButton,
  ListItemIcon, ListItemText, Card, CardContent, Button, Chip, Grid, Paper,
  TextField, Container, Avatar, Stack, Divider, Dialog, DialogTitle, DialogContent, DialogActions
} from '@mui/material';
import {
  Menu, School, Person, EmojiEvents, VerifiedUser, Logout, AccountBalanceWallet,
  Add, CloudUpload, TrendingUp, Info, Verified
} from '@mui/icons-material';
import Footer from '../components/Footer';

export default function AdminDashboard({ user, onLogout }) {
  const [activeTab, setActiveTab] = useState(0);
  const [courses, setCourses] = useState([]);
  const [enrollments, setEnrollments] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [walletAddress, setWalletAddress] = useState('');
  const [loading, setLoading] = useState(false);
  const [uploadedFile, setUploadedFile] = useState(null);
  const [fileHash, setFileHash] = useState('');
  const [verificationResult, setVerificationResult] = useState(null);
  const [drawerOpen, setDrawerOpen] = useState(true);
  const [showHowItWorks, setShowHowItWorks] = useState(false);
  const [network, setNetwork] = useState('');

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
    if (window.ethereum) {
      window.ethereum.request({ method: 'eth_chainId' })
        .then(chainId => {
          const networks = { '0x7a69': 'Hardhat Local', '0x89': 'Polygon', '0x13881': 'Mumbai Testnet' };
          setNetwork(networks[chainId] || 'Unknown Network');
        })
        .catch(console.error);
    }
  }, []);

  const loadData = async () => {
    try {
      const [coursesRes, enrollmentsRes] = await Promise.all([
        courseAPI.getAll(),
        enrollmentAPI.getAll()
      ]);
      setCourses(coursesRes.data);
      
      try {
        const teachersRes = await adminAPI.getTeachers();
        setTeachers(teachersRes.data);
      } catch (teacherError) {
        console.error('Could not load teachers:', teacherError);
      }
      
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
        setEnrollments(enrollmentsRes.data);
      }
    } catch (error) {
      if (error.response?.status === 401) {
        toast.error('Session expired');
        onLogout();
      }
    }
  };

  const handleConnectWallet = async () => {
    try {
      const address = await connectWallet();
      setWalletAddress(address);
      toast.success('Wallet connected');
    } catch (error) {
      toast.error('Failed to connect wallet');
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
      toast.error('Failed to create course');
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
      // Step 1: Register teacher in database
      console.log('Registering teacher in database...');
      await adminAPI.registerTeacher(teacherForm);
      console.log('Teacher registered in database');
      
      // Step 2: Connect wallet
      console.log('Connecting wallet...');
      await connectWallet();
      console.log('Wallet connected');
      
      // Step 3: Register on blockchain
      console.log('Registering on blockchain...');
      const txHash = await registerTeacher(teacherForm.walletAddress);
      console.log('Blockchain registration successful:', txHash);

      toast.success('Teacher registered on blockchain! Tx: ' + txHash.slice(0, 10) + '...');
      setTeacherForm({ email: '', password: '', name: '', walletAddress: '', subject: '' });
      await loadData();
    } catch (error) {
      console.error('Teacher registration error:', error);
      toast.error('Failed: ' + (error.response?.data?.error || error.message || 'Unknown error'));
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
      
      const res = await certificateAPI.generate(enrollment._id, currentWallet);
      const { certificateHash } = res.data;

      const txHash = await storeCertificateHash(
        enrollment.studentId._id,
        enrollment.courseId.courseId,
        certificateHash
      );

      toast.success(`Certificate issued! Tx: ${txHash.slice(0, 10)}...`);
      await loadData();
    } catch (error) {
      const errorMsg = error.response?.data?.error || error.message;
      if (errorMsg.includes('already issued')) {
        toast.warning('Certificate already issued');
      } else {
        toast.error('Failed to issue certificate');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setUploadedFile(file);
    setVerificationResult(null);
    setFileHash('');

    try {
      const arrayBuffer = await file.arrayBuffer();
      const hashBuffer = await crypto.subtle.digest('SHA-256', arrayBuffer);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      const hash = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
      
      setFileHash(hash);
      toast.info('File hash calculated');
    } catch (error) {
      toast.error('Failed to calculate hash');
    }
  };

  const handleVerifyCertificate = async () => {
    if (!fileHash) {
      toast.error('Please upload a certificate first');
      return;
    }

    setLoading(true);
    try {
      const certsRes = await certificateAPI.getAll();
      const matchingCert = certsRes.data.find(c => c.certificateHash === fileHash);

      if (matchingCert) {
        setVerificationResult({
          isValid: true,
          message: 'Certificate is AUTHENTIC',
          details: {
            student: matchingCert.studentId.name,
            course: matchingCert.courseId.title,
            issuedAt: new Date(matchingCert.issuedAt).toLocaleDateString()
          }
        });
        toast.success('✅ Certificate is authentic!');
      } else {
        setVerificationResult({
          isValid: false,
          message: 'Certificate is FAKE or NOT FOUND',
          details: null
        });
        toast.error('❌ Certificate not found!');
      }
    } catch (error) {
      toast.error('Verification failed');
    } finally {
      setLoading(false);
    }
  };

  const drawer = (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column', background: 'linear-gradient(180deg, #7c3aed 0%, #a855f7 100%)' }}>
      <Box sx={{ p: 3, textAlign: 'center' }}>
        <Avatar sx={{ width: 70, height: 70, mx: 'auto', mb: 2, bgcolor: '#a78bfa', fontSize: '2rem', fontWeight: 'bold' }}>
          A
        </Avatar>
        <Typography variant="h6" fontWeight="bold" color="white">Administrator</Typography>
        <Chip label="System Control" size="small" sx={{ mt: 1, bgcolor: 'rgba(255,255,255,0.2)', color: 'white' }} />
      </Box>
      <Divider sx={{ bgcolor: 'rgba(255,255,255,0.1)' }} />
      <List sx={{ flex: 1, px: 2, py: 2 }}>
        {[
          { label: 'Courses', icon: <School />, tab: 0 },
          { label: 'Teachers', icon: <Person />, tab: 1 },
          { label: 'Certificates', icon: <EmojiEvents />, tab: 2 },
          { label: 'Verify', icon: <VerifiedUser />, tab: 3 }
        ].map(item => (
          <ListItemButton
            key={item.label}
            selected={activeTab === item.tab}
            onClick={() => setActiveTab(item.tab)}
            sx={{
              borderRadius: 2,
              mb: 1,
              color: 'rgba(255,255,255,0.7)',
              '&.Mui-selected': { bgcolor: 'rgba(255,255,255,0.15)', color: 'white' },
              '&:hover': { bgcolor: 'rgba(255,255,255,0.1)' }
            }}
          >
            <ListItemIcon sx={{ color: 'inherit', minWidth: 40 }}>{item.icon}</ListItemIcon>
            <ListItemText primary={item.label} />
          </ListItemButton>
        ))}
      </List>
      <Divider sx={{ bgcolor: 'rgba(255,255,255,0.1)' }} />
      {walletAddress ? (
        <Box sx={{ p: 2, bgcolor: 'rgba(0,0,0,0.2)', color: 'white' }}>
          <Typography variant="caption" display="block">Connected Wallet</Typography>
          <Typography variant="body2" sx={{ fontFamily: 'monospace', fontSize: '0.75rem' }}>
            {walletAddress.slice(0, 10)}...{walletAddress.slice(-8)}
          </Typography>
        </Box>
      ) : (
        <Button onClick={handleConnectWallet} startIcon={<AccountBalanceWallet />} sx={{ m: 2, bgcolor: 'rgba(255,255,255,0.2)', color: 'white', '&:hover': { bgcolor: 'rgba(255,255,255,0.3)' } }}>
          Connect Wallet
        </Button>
      )}
      <Divider sx={{ bgcolor: 'rgba(255,255,255,0.1)' }} />
      <Box sx={{ p: 1 }}>
        <ListItemButton onClick={onLogout} sx={{ color: 'white', borderRadius: 2, bgcolor: 'rgba(239,68,68,0.2)', '&:hover': { bgcolor: 'rgba(239,68,68,0.3)' } }}>
          <ListItemIcon sx={{ color: 'inherit', minWidth: 36 }}><Logout fontSize="small" /></ListItemIcon>
          <ListItemText primary="Logout" primaryTypographyProps={{ fontSize: '0.875rem' }} />
        </ListItemButton>
      </Box>
    </Box>
  );

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', bgcolor: '#f1f5f9' }}>
      <AppBar position="fixed" elevation={0} sx={{ bgcolor: 'white', borderBottom: '1px solid #e2e8f0', zIndex: (theme) => theme.zIndex.drawer + 1 }}>
        <Toolbar>
          <IconButton onClick={() => setDrawerOpen(!drawerOpen)} edge="start" sx={{ mr: 2, color: '#7c3aed' }}>
            <Menu />
          </IconButton>
          <School sx={{ mr: 1, color: '#7c3aed', fontSize: 32 }} />
          <Box sx={{ flexGrow: 1 }}>
            <Typography variant="h6" sx={{ color: '#1e293b', fontWeight: 700, lineHeight: 1.2 }}>
              Tamper-Proof LMS
            </Typography>
            <Typography variant="caption" sx={{ color: '#64748b', fontSize: '0.7rem' }}>
              Blockchain-Secured Learning Management System
            </Typography>
          </Box>
          <Stack direction="row" spacing={1} alignItems="center">
            <Chip label="Admin" size="small" sx={{ bgcolor: '#f3e8ff', color: '#7c3aed', fontWeight: 600 }} />
            {walletAddress && (
              <Chip 
                icon={<AccountBalanceWallet />} 
                label={`${walletAddress.slice(0, 6)}...${walletAddress.slice(-4)}`} 
                size="small" 
                sx={{ bgcolor: '#fef3c7', color: '#f59e0b', fontWeight: 600, fontFamily: 'monospace' }} 
              />
            )}
            {network && (
              <Chip label={network} size="small" sx={{ bgcolor: '#e0e7ff', color: '#4f46e5', fontWeight: 600 }} />
            )}
            <Chip icon={<Verified />} label="Blockchain Secured" size="small" sx={{ bgcolor: '#dcfce7', color: '#16a34a', fontWeight: 600 }} />
            <IconButton onClick={() => setShowHowItWorks(true)} size="small" sx={{ color: '#64748b' }}>
              <Info />
            </IconButton>
          </Stack>
        </Toolbar>
      </AppBar>

      <Drawer variant="persistent" open={drawerOpen} sx={{ width: 280, flexShrink: 0, '& .MuiDrawer-paper': { width: 280, boxSizing: 'border-box', border: 'none', top: '64px', height: 'calc(100% - 64px)' } }}>
        {drawer}
      </Drawer>

      <Box component="main" sx={{ flexGrow: 1, p: 3, pb: '96px', mt: '80px' }}>
        <Container maxWidth="xl">
          <Grid container spacing={3} sx={{ mb: 4 }}>
            <Grid item xs={12} md={4}>
              <Card sx={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', color: 'white', borderRadius: 3 }}>
                <CardContent>
                  <Stack direction="row" justifyContent="space-between" alignItems="center">
                    <Box>
                      <Typography variant="body2" sx={{ opacity: 0.9 }}>Total Courses</Typography>
                      <Typography variant="h3" fontWeight="bold">{courses.length}</Typography>
                    </Box>
                    <School sx={{ fontSize: 50, opacity: 0.3 }} />
                  </Stack>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} md={4}>
              <Card sx={{ background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)', color: 'white', borderRadius: 3 }}>
                <CardContent>
                  <Stack direction="row" justifyContent="space-between" alignItems="center">
                    <Box>
                      <Typography variant="body2" sx={{ opacity: 0.9 }}>Teachers</Typography>
                      <Typography variant="h3" fontWeight="bold">{teachers.length}</Typography>
                    </Box>
                    <Person sx={{ fontSize: 50, opacity: 0.3 }} />
                  </Stack>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} md={4}>
              <Card sx={{ background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)', color: 'white', borderRadius: 3 }}>
                <CardContent>
                  <Stack direction="row" justifyContent="space-between" alignItems="center">
                    <Box>
                      <Typography variant="body2" sx={{ opacity: 0.9 }}>Enrollments</Typography>
                      <Typography variant="h3" fontWeight="bold">{enrollments.length}</Typography>
                    </Box>
                    <TrendingUp sx={{ fontSize: 50, opacity: 0.3 }} />
                  </Stack>
                </CardContent>
              </Card>
            </Grid>
          </Grid>

          {activeTab === 0 && (
            <Box>
              <Typography variant="h4" fontWeight="bold" sx={{ mb: 3, color: '#1e293b' }}>Create Course</Typography>
              <Card sx={{ borderRadius: 3 }}>
                <form onSubmit={handleCreateCourse}>
                  <CardContent>
                    <Grid container spacing={2}>
                      <Grid item xs={12} md={6}>
                        <TextField fullWidth label="Course ID" value={courseForm.courseId} onChange={(e) => setCourseForm({...courseForm, courseId: e.target.value})} required />
                      </Grid>
                      <Grid item xs={12} md={6}>
                        <TextField fullWidth label="Subject" value={courseForm.subject} onChange={(e) => setCourseForm({...courseForm, subject: e.target.value})} required />
                      </Grid>
                      <Grid item xs={12}>
                        <TextField fullWidth label="Course Title" value={courseForm.title} onChange={(e) => setCourseForm({...courseForm, title: e.target.value})} required />
                      </Grid>
                      <Grid item xs={12}>
                        <TextField fullWidth label="Description" multiline rows={3} value={courseForm.description} onChange={(e) => setCourseForm({...courseForm, description: e.target.value})} required />
                      </Grid>
                      <Grid item xs={12}>
                        <Typography variant="subtitle1" fontWeight="bold" gutterBottom>Lessons</Typography>
                        {courseForm.lessons.map((lesson, idx) => (
                          <Grid container spacing={2} key={idx} sx={{ mb: 2 }}>
                            <Grid item xs={6}>
                              <TextField fullWidth label="Lesson Title" value={lesson.title} onChange={(e) => {
                                const newLessons = [...courseForm.lessons];
                                newLessons[idx].title = e.target.value;
                                setCourseForm({...courseForm, lessons: newLessons});
                              }} />
                            </Grid>
                            <Grid item xs={6}>
                              <TextField fullWidth label="Content" value={lesson.content} onChange={(e) => {
                                const newLessons = [...courseForm.lessons];
                                newLessons[idx].content = e.target.value;
                                setCourseForm({...courseForm, lessons: newLessons});
                              }} />
                            </Grid>
                          </Grid>
                        ))}
                        <Button startIcon={<Add />} onClick={() => setCourseForm({...courseForm, lessons: [...courseForm.lessons, {title: '', content: ''}]})}>
                          Add Lesson
                        </Button>
                      </Grid>
                    </Grid>
                  </CardContent>
                  <Divider />
                  <Box sx={{ p: 2 }}>
                    <Button type="submit" variant="contained" fullWidth disabled={loading} sx={{ borderRadius: 2, textTransform: 'none', fontWeight: 600 }}>
                      {loading ? 'Creating...' : 'Create Course'}
                    </Button>
                  </Box>
                </form>
              </Card>
            </Box>
          )}

          {activeTab === 1 && (
            <Box>
              <Typography variant="h4" fontWeight="bold" sx={{ mb: 3, color: '#1e293b' }}>Register Teacher</Typography>
              <Card sx={{ mb: 3, borderRadius: 3 }}>
                <form onSubmit={handleRegisterTeacher}>
                  <CardContent>
                    <Grid container spacing={2}>
                      <Grid item xs={12} md={6}>
                        <TextField fullWidth label="Full Name" value={teacherForm.name} onChange={(e) => setTeacherForm({...teacherForm, name: e.target.value})} required />
                      </Grid>
                      <Grid item xs={12} md={6}>
                        <TextField fullWidth label="Subject" value={teacherForm.subject} onChange={(e) => setTeacherForm({...teacherForm, subject: e.target.value})} required />
                      </Grid>
                      <Grid item xs={12} md={6}>
                        <TextField fullWidth type="email" label="Email" value={teacherForm.email} onChange={(e) => setTeacherForm({...teacherForm, email: e.target.value})} required />
                      </Grid>
                      <Grid item xs={12} md={6}>
                        <TextField fullWidth type="password" label="Password" value={teacherForm.password} onChange={(e) => setTeacherForm({...teacherForm, password: e.target.value})} required />
                      </Grid>
                      <Grid item xs={12}>
                        <TextField fullWidth label="Wallet Address (0x...)" value={teacherForm.walletAddress} onChange={(e) => setTeacherForm({...teacherForm, walletAddress: e.target.value})} required />
                      </Grid>
                    </Grid>
                  </CardContent>
                  <Divider />
                  <Box sx={{ p: 2 }}>
                    <Button type="submit" variant="contained" fullWidth disabled={loading || !walletAddress} sx={{ borderRadius: 2, textTransform: 'none', fontWeight: 600 }}>
                      Register on Blockchain
                    </Button>
                  </Box>
                </form>
              </Card>

              <Typography variant="h5" fontWeight="bold" sx={{ mb: 2, color: '#1e293b' }}>Registered Teachers</Typography>
              <Grid container spacing={2}>
                {teachers.map(teacher => (
                  <Grid item xs={12} md={6} key={teacher._id}>
                    <Card sx={{ borderRadius: 3 }}>
                      <CardContent>
                        <Typography variant="h6" fontWeight="bold">{teacher.name}</Typography>
                        <Typography variant="body2" color="text.secondary">{teacher.email}</Typography>
                        <Chip label={teacher.subject} size="small" sx={{ mt: 1 }} />
                        <Typography variant="caption" display="block" sx={{ mt: 1, fontFamily: 'monospace' }}>
                          {teacher.walletAddress}
                        </Typography>
                      </CardContent>
                    </Card>
                  </Grid>
                ))}
              </Grid>
            </Box>
          )}

          {activeTab === 2 && (
            <Box>
              <Typography variant="h4" fontWeight="bold" sx={{ mb: 3, color: '#1e293b' }}>Issue Certificates</Typography>
              <Grid container spacing={3}>
                {enrollments.filter(e => (e.status === 'approved' || e.status === 'verified') && e.courseId && e.studentId).map(enrollment => (
                  <Grid item xs={12} md={6} key={enrollment._id}>
                    <Card sx={{ borderRadius: 3 }}>
                      <CardContent>
                        <Typography variant="h5" fontWeight="bold" gutterBottom>{enrollment.courseId.title}</Typography>
                        <Typography variant="body1">{enrollment.studentId.name}</Typography>
                        <Typography variant="body2" color="text.secondary">Marks: {enrollment.marks}/100</Typography>
                        {enrollment.status === 'verified' && (
                          <Chip label="Certificate Issued" color="success" sx={{ mt: 1 }} />
                        )}
                      </CardContent>
                      <Divider />
                      <Box sx={{ p: 2 }}>
                        <Button
                          fullWidth
                          variant="contained"
                          onClick={() => handleIssueCertificate(enrollment)}
                          disabled={loading || enrollment.status === 'verified'}
                          sx={{ borderRadius: 2, textTransform: 'none', fontWeight: 600 }}
                        >
                          {enrollment.status === 'verified' ? 'Issued' : 'Issue Certificate'}
                        </Button>
                      </Box>
                    </Card>
                  </Grid>
                ))}
              </Grid>
            </Box>
          )}

          {activeTab === 3 && (
            <Box>
              <Typography variant="h4" fontWeight="bold" sx={{ mb: 3, color: '#1e293b' }}>Verify Certificate</Typography>
              <Card sx={{ borderRadius: 3 }}>
                <CardContent>
                  <Paper sx={{ p: 4, textAlign: 'center', border: '2px dashed #cbd5e1', borderRadius: 2, mb: 3 }}>
                    <input
                      type="file"
                      id="certUpload"
                      accept=".pdf"
                      onChange={handleFileUpload}
                      style={{ display: 'none' }}
                    />
                    <label htmlFor="certUpload">
                      <CloudUpload sx={{ fontSize: 60, color: 'text.secondary', mb: 2 }} />
                      <Typography variant="h6" gutterBottom>Drop certificate here or click to upload</Typography>
                      <Typography variant="body2" color="text.secondary">PDF files only</Typography>
                      <Button variant="contained" component="span" sx={{ mt: 2, borderRadius: 2, textTransform: 'none', fontWeight: 600 }}>
                        Choose File
                      </Button>
                    </label>
                  </Paper>

                  {uploadedFile && (
                    <Paper sx={{ p: 2, bgcolor: '#f8fafc', mb: 2, borderRadius: 2 }}>
                      <Typography variant="subtitle2" fontWeight="bold">Uploaded File:</Typography>
                      <Typography variant="body2">{uploadedFile.name}</Typography>
                      <Typography variant="body2">Size: {(uploadedFile.size / 1024).toFixed(2)} KB</Typography>
                      {fileHash && (
                        <Typography variant="caption" display="block" sx={{ mt: 1, fontFamily: 'monospace', wordBreak: 'break-all' }}>
                          Hash: {fileHash}
                        </Typography>
                      )}
                    </Paper>
                  )}

                  <Button
                    fullWidth
                    variant="contained"
                    onClick={handleVerifyCertificate}
                    disabled={!fileHash || loading}
                    sx={{ borderRadius: 2, textTransform: 'none', fontWeight: 600 }}
                  >
                    {loading ? 'Verifying...' : 'Verify on Blockchain'}
                  </Button>

                  {verificationResult && (
                    <Paper sx={{ p: 3, mt: 3, bgcolor: verificationResult.isValid ? '#f0fdf4' : '#fef2f2', borderRadius: 2 }}>
                      <Stack direction="row" alignItems="center" spacing={2} sx={{ mb: 2 }}>
                        <Typography variant="h5" fontWeight="bold" color={verificationResult.isValid ? 'success.main' : 'error.main'}>
                          {verificationResult.isValid ? '✅' : '❌'} {verificationResult.message}
                        </Typography>
                      </Stack>
                      {verificationResult.details && (
                        <Box>
                          <Typography variant="body2"><strong>Student:</strong> {verificationResult.details.student}</Typography>
                          <Typography variant="body2"><strong>Course:</strong> {verificationResult.details.course}</Typography>
                          <Typography variant="body2"><strong>Issued:</strong> {verificationResult.details.issuedAt}</Typography>
                        </Box>
                      )}
                    </Paper>
                  )}
                </CardContent>
              </Card>
            </Box>
          )}
        </Container>
        
        <Dialog open={showHowItWorks} onClose={() => setShowHowItWorks(false)} maxWidth="md" fullWidth>
          <DialogTitle sx={{ bgcolor: '#7c3aed', color: 'white', fontWeight: 700 }}>
            <Stack direction="row" alignItems="center" spacing={1}>
              <Info />
              <Typography variant="h6" fontWeight="bold">How Admin System Works</Typography>
            </Stack>
          </DialogTitle>
          <DialogContent sx={{ mt: 2 }}>
            <Stack spacing={3}>
              <Paper sx={{ p: 2, bgcolor: '#eff6ff', borderLeft: '4px solid #3b82f6' }}>
                <Typography variant="subtitle1" fontWeight="bold" gutterBottom>🏫 Step 1: Create Courses</Typography>
                <Typography variant="body2">Create courses with lessons. Assign subjects for teacher matching.</Typography>
              </Paper>
              
              <Paper sx={{ p: 2, bgcolor: '#f0fdf4', borderLeft: '4px solid #22c55e' }}>
                <Typography variant="subtitle1" fontWeight="bold" gutterBottom>👨‍🏫 Step 2: Register Teachers</Typography>
                <Typography variant="body2">Register teachers on blockchain with MetaMask. Their wallet address is stored permanently for verification.</Typography>
              </Paper>
              
              <Paper sx={{ p: 2, bgcolor: '#fef3c7', borderLeft: '4px solid #f59e0b' }}>
                <Typography variant="subtitle1" fontWeight="bold" gutterBottom>🎓 Step 3: Issue Certificates</Typography>
                <Typography variant="body2">After teacher approval, issue certificates. Sign with MetaMask to store certificate hash on blockchain.</Typography>
              </Paper>
              
              <Paper sx={{ p: 2, bgcolor: '#f3e8ff', borderLeft: '4px solid #9333ea' }}>
                <Typography variant="subtitle1" fontWeight="bold" gutterBottom>✅ Step 4: Verify Certificates</Typography>
                <Typography variant="body2">Upload any certificate PDF to verify authenticity. System checks hash against blockchain records.</Typography>
              </Paper>
              
              <Divider />
              
              <Box>
                <Typography variant="subtitle1" fontWeight="bold" gutterBottom>🔑 Admin Powers:</Typography>
                <Stack spacing={1} sx={{ pl: 2 }}>
                  <Typography variant="body2">• <strong>Full Control:</strong> Manage entire system</Typography>
                  <Typography variant="body2">• <strong>Blockchain Authority:</strong> Register teachers and issue certificates</Typography>
                  <Typography variant="body2">• <strong>Verification:</strong> Validate any certificate</Typography>
                  <Typography variant="body2">• <strong>Accountability:</strong> All actions signed with MetaMask</Typography>
                </Stack>
              </Box>
            </Stack>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setShowHowItWorks(false)} variant="contained" sx={{ textTransform: 'none', fontWeight: 600 }}>Got It!</Button>
          </DialogActions>
        </Dialog>
        
        <Footer />
      </Box>
    </Box>
  );
}
