import { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import { enrollmentAPI, assignmentAPI, courseAPI } from '../services/api';
import { connectWallet, storeMarksHash } from '../services/blockchain';
import {
  Box, Drawer, AppBar, Toolbar, Typography, IconButton, List, ListItemButton,
  ListItemIcon, ListItemText, Card, CardContent, Button, Chip, Grid, Paper,
  TextField, Container, Dialog, DialogTitle, DialogContent, DialogActions,
  Select, MenuItem, FormControl, InputLabel, Avatar, Stack, Divider, Badge
} from '@mui/material';
import {
  Menu, CheckCircle, Assignment, RateReview, Logout, AccountBalanceWallet,
  Person, Email, School, TrendingUp, AttachFile, Info, Verified
} from '@mui/icons-material';
import Footer from '../components/Footer';

export default function TeacherDashboard({ user, onLogout }) {
  const [enrollments, setEnrollments] = useState([]);
  const [courses, setCourses] = useState([]);
  const [pendingSubmissions, setPendingSubmissions] = useState([]);
  const [walletAddress, setWalletAddress] = useState('');
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState(0);
  const [showAssignmentForm, setShowAssignmentForm] = useState(false);
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [drawerOpen, setDrawerOpen] = useState(true);
  const [showHowItWorks, setShowHowItWorks] = useState(false);
  const [network, setNetwork] = useState('');
  const [assignmentForm, setAssignmentForm] = useState({
    title: '', description: '', instructions: '', dueDate: '',
    difficulty: 'medium', totalMarks: 100, submissionFormat: 'both',
    allowLateSubmission: true, latePenaltyPercent: 10, rubric: '', passingMarks: 40
  });

  useEffect(() => {
    loadEnrollments();
    loadCourses();
    loadPendingSubmissions();
    if (user.walletAddress && window.ethereum) {
      window.ethereum.request({ method: 'eth_accounts' })
        .then(accounts => { if (accounts.length > 0) setWalletAddress(accounts[0]); })
        .catch(console.error);
      window.ethereum.request({ method: 'eth_chainId' })
        .then(chainId => {
          const networks = { '0x7a69': 'Hardhat Local', '0x89': 'Polygon', '0x13881': 'Mumbai Testnet' };
          setNetwork(networks[chainId] || 'Unknown Network');
        })
        .catch(console.error);
    }
  }, []);

  const loadEnrollments = async () => {
    try {
      const res = await enrollmentAPI.getAll();
      setEnrollments(res.data);
    } catch (error) {
      if (error.response?.status === 401) {
        toast.error('Session expired');
        onLogout();
      }
    }
  };

  const loadCourses = async () => {
    try {
      const res = await courseAPI.getAll();
      setCourses(res.data);
    } catch (error) {
      console.error(error);
    }
  };

  const loadPendingSubmissions = async () => {
    try {
      const res = await assignmentAPI.getPending();
      setPendingSubmissions(res.data);
    } catch (error) {
      console.error(error);
    }
  };

  const handleConnectWallet = async () => {
    try {
      const address = await connectWallet();
      if (user.walletAddress && address.toLowerCase() !== user.walletAddress.toLowerCase()) {
        toast.error(`Wrong account! Switch to: ${user.walletAddress}`);
        return;
      }
      setWalletAddress(address);
      toast.success('Wallet connected');
    } catch (error) {
      toast.error('Failed to connect wallet');
    }
  };

  const handleApprove = async (enrollment) => {
    setLoading(true);
    try {
      const address = await connectWallet();
      setWalletAddress(address);
      if (address.toLowerCase() !== user.walletAddress?.toLowerCase()) {
        toast.error(`Wrong account! Switch to: ${user.walletAddress}`);
        setLoading(false);
        return;
      }
      const res = await enrollmentAPI.approve(enrollment._id, address);
      const { marksHash } = res.data;
      const txHash = await storeMarksHash(enrollment.studentId._id, enrollment.courseId.courseId, marksHash);
      toast.success(`Approved! Tx: ${txHash.slice(0, 10)}...`);
      await loadEnrollments();
    } catch (error) {
      toast.error('Approval failed: ' + (error.response?.data?.error || error.message));
    } finally {
      setLoading(false);
    }
  };

  const handleCreateAssignment = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await assignmentAPI.create({ ...assignmentForm, courseId: selectedCourse });
      toast.success('Assignment created!');
      setShowAssignmentForm(false);
      setAssignmentForm({ title: '', description: '', instructions: '', dueDate: '', difficulty: 'medium', totalMarks: 100, submissionFormat: 'both', allowLateSubmission: true, latePenaltyPercent: 10, rubric: '', passingMarks: 40 });
      await loadCourses();
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed');
    } finally {
      setLoading(false);
    }
  };

  const handleEvaluate = async (submissionId, status, marks, feedback) => {
    setLoading(true);
    try {
      await assignmentAPI.evaluate(submissionId, { status, marksAwarded: marks, feedback });
      toast.success('Evaluated!');
      await loadPendingSubmissions();
    } catch (error) {
      toast.error('Failed');
    } finally {
      setLoading(false);
    }
  };

  const drawer = (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column', background: 'linear-gradient(180deg, #059669 0%, #10b981 100%)' }}>
      <Box sx={{ p: 3, textAlign: 'center' }}>
        <Avatar sx={{ width: 70, height: 70, mx: 'auto', mb: 2, bgcolor: '#34d399', fontSize: '2rem', fontWeight: 'bold' }}>
          {user.name.charAt(0)}
        </Avatar>
        <Typography variant="h6" fontWeight="bold" color="white">{user.name}</Typography>
        <Chip label={user.subject} size="small" sx={{ mt: 1, bgcolor: 'rgba(255,255,255,0.2)', color: 'white' }} />
      </Box>
      <Divider sx={{ bgcolor: 'rgba(255,255,255,0.1)' }} />
      <List sx={{ flex: 1, px: 2, py: 2 }}>
        {[
          { label: 'Approvals', icon: <CheckCircle />, tab: 0, badge: enrollments.filter(e => e.status === 'completed').length },
          { label: 'Assignments', icon: <Assignment />, tab: 1, count: courses.length },
          { label: 'Submissions', icon: <RateReview />, tab: 2, badge: pendingSubmissions.length }
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
            {item.badge > 0 ? (
              <Badge badgeContent={item.badge} color="error" />
            ) : item.count !== undefined ? (
              <Chip label={item.count} size="small" sx={{ bgcolor: 'rgba(255,255,255,0.2)', color: 'white' }} />
            ) : null}
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
          <IconButton onClick={() => setDrawerOpen(!drawerOpen)} edge="start" sx={{ mr: 2, color: '#059669' }}>
            <Menu />
          </IconButton>
          <School sx={{ mr: 1, color: '#059669', fontSize: 32 }} />
          <Box sx={{ flexGrow: 1 }}>
            <Typography variant="h6" sx={{ color: '#1e293b', fontWeight: 700, lineHeight: 1.2 }}>
              Tamper-Proof LMS
            </Typography>
            <Typography variant="caption" sx={{ color: '#64748b', fontSize: '0.7rem' }}>
              Blockchain-Secured Learning Management System
            </Typography>
          </Box>
          <Stack direction="row" spacing={1} alignItems="center">
            <Chip label="Teacher" size="small" sx={{ bgcolor: '#d1fae5', color: '#059669', fontWeight: 600 }} />
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

      <Box component="main" sx={{ flexGrow: 1, p: 3, mt: '80px' }}>
        <Container maxWidth="xl">
          <Grid container spacing={3} sx={{ mb: 4 }}>
            <Grid item xs={12} md={4}>
              <Card sx={{ background: 'linear-gradient(135deg, #f59e0b 0%, #f97316 100%)', color: 'white', borderRadius: 3 }}>
                <CardContent>
                  <Stack direction="row" justifyContent="space-between" alignItems="center">
                    <Box>
                      <Typography variant="body2" sx={{ opacity: 0.9 }}>Pending Approvals</Typography>
                      <Typography variant="h3" fontWeight="bold">{enrollments.filter(e => e.status === 'completed').length}</Typography>
                    </Box>
                    <TrendingUp sx={{ fontSize: 50, opacity: 0.3 }} />
                  </Stack>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} md={4}>
              <Card sx={{ background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)', color: 'white', borderRadius: 3 }}>
                <CardContent>
                  <Stack direction="row" justifyContent="space-between" alignItems="center">
                    <Box>
                      <Typography variant="body2" sx={{ opacity: 0.9 }}>Pending Submissions</Typography>
                      <Typography variant="h3" fontWeight="bold">{pendingSubmissions.length}</Typography>
                    </Box>
                    <RateReview sx={{ fontSize: 50, opacity: 0.3 }} />
                  </Stack>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} md={4}>
              <Card sx={{ background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)', color: 'white', borderRadius: 3 }}>
                <CardContent>
                  <Stack direction="row" justifyContent="space-between" alignItems="center">
                    <Box>
                      <Typography variant="body2" sx={{ opacity: 0.9 }}>Approved</Typography>
                      <Typography variant="h3" fontWeight="bold">{enrollments.filter(e => e.status === 'approved' || e.status === 'verified').length}</Typography>
                    </Box>
                    <CheckCircle sx={{ fontSize: 50, opacity: 0.3 }} />
                  </Stack>
                </CardContent>
              </Card>
            </Grid>
          </Grid>

          {activeTab === 0 && (
            <Box>
              <Typography variant="h4" fontWeight="bold" sx={{ mb: 3, color: '#1e293b' }}>Course Approvals</Typography>
              <Grid container spacing={3}>
                {enrollments.filter(e => e.status === 'completed' && e.courseId && e.studentId).map(enrollment => (
                  <Grid item xs={12} md={6} key={enrollment._id}>
                    <Card sx={{ borderRadius: 3, transition: 'all 0.3s', '&:hover': { boxShadow: '0 12px 24px rgba(0,0,0,0.15)' } }}>
                      <CardContent>
                        <Typography variant="h5" fontWeight="bold" gutterBottom>{enrollment.courseId.title}</Typography>
                        <Stack spacing={1} sx={{ mb: 2 }}>
                          <Stack direction="row" alignItems="center" spacing={1}>
                            <Person sx={{ color: 'text.secondary', fontSize: 20 }} />
                            <Typography variant="body1">{enrollment.studentId.name}</Typography>
                          </Stack>
                          <Stack direction="row" alignItems="center" spacing={1}>
                            <Email sx={{ color: 'text.secondary', fontSize: 20 }} />
                            <Typography variant="body2" color="text.secondary">{enrollment.studentId.email}</Typography>
                          </Stack>
                          <Stack direction="row" alignItems="center" spacing={1}>
                            <School sx={{ color: 'text.secondary', fontSize: 20 }} />
                            <Typography variant="body2" color="text.secondary">
                              {enrollment.completedLessons.length}/{enrollment.courseId.lessons.length} lessons completed
                            </Typography>
                          </Stack>
                        </Stack>
                        
                        {!enrollment.canApprove && (
                          <Paper sx={{ p: 2, mb: 2, bgcolor: '#fef3c7', borderLeft: '4px solid #f59e0b' }}>
                            <Typography variant="body2" color="#92400e" fontWeight="500">
                              ⏳ Waiting for all assignments to be evaluated or student to complete retry attempts
                            </Typography>
                          </Paper>
                        )}
                        
                        <Button
                          fullWidth
                          variant="contained"
                          startIcon={<CheckCircle />}
                          onClick={() => handleApprove(enrollment)}
                          disabled={loading || !enrollment.canApprove}
                          sx={{ borderRadius: 2, textTransform: 'none', fontWeight: 600 }}
                        >
                          {loading ? 'Processing...' : 'Approve & Store on Blockchain'}
                        </Button>
                      </CardContent>
                    </Card>
                  </Grid>
                ))}
              </Grid>
              {enrollments.filter(e => e.status === 'completed').length === 0 && (
                <Paper sx={{ p: 8, textAlign: 'center', borderRadius: 3 }}>
                  <CheckCircle sx={{ fontSize: 80, color: 'text.secondary', mb: 2 }} />
                  <Typography variant="h5" color="text.secondary">No pending approvals</Typography>
                </Paper>
              )}
            </Box>
          )}

          {activeTab === 1 && (
            <Box>
              <Typography variant="h4" fontWeight="bold" sx={{ mb: 3, color: '#1e293b' }}>Create Assignment</Typography>
              <Card sx={{ mb: 3, borderRadius: 3 }}>
                <CardContent>
                  <FormControl fullWidth>
                    <InputLabel>Select Course</InputLabel>
                    <Select value={selectedCourse || ''} onChange={(e) => setSelectedCourse(e.target.value)} label="Select Course">
                      <MenuItem value="">-- Select Course --</MenuItem>
                      {courses.map(c => (
                        <MenuItem key={c._id} value={c._id}>{c.title} ({c.state})</MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                  {selectedCourse && !showAssignmentForm && (
                    <Button variant="contained" fullWidth sx={{ mt: 2, borderRadius: 2, textTransform: 'none', fontWeight: 600 }} onClick={() => setShowAssignmentForm(true)}>
                      Create Assignment
                    </Button>
                  )}
                </CardContent>
              </Card>

              <Dialog open={showAssignmentForm} onClose={() => setShowAssignmentForm(false)} maxWidth="md" fullWidth>
                <DialogTitle>Create New Assignment</DialogTitle>
                <form onSubmit={handleCreateAssignment}>
                  <DialogContent>
                    <TextField fullWidth label="Title" value={assignmentForm.title} onChange={(e) => setAssignmentForm({...assignmentForm, title: e.target.value})} sx={{ mb: 2 }} required />
                    <TextField fullWidth label="Description" multiline rows={2} value={assignmentForm.description} onChange={(e) => setAssignmentForm({...assignmentForm, description: e.target.value})} sx={{ mb: 2 }} required />
                    <TextField fullWidth label="Instructions" multiline rows={3} value={assignmentForm.instructions} onChange={(e) => setAssignmentForm({...assignmentForm, instructions: e.target.value})} sx={{ mb: 2 }} required />
                    <TextField fullWidth type="datetime-local" label="Due Date" InputLabelProps={{ shrink: true }} value={assignmentForm.dueDate} onChange={(e) => setAssignmentForm({...assignmentForm, dueDate: e.target.value})} sx={{ mb: 2 }} required />
                    <Grid container spacing={2}>
                      <Grid item xs={6}>
                        <TextField fullWidth type="number" label="Total Marks" value={assignmentForm.totalMarks} onChange={(e) => setAssignmentForm({...assignmentForm, totalMarks: e.target.value})} required />
                      </Grid>
                      <Grid item xs={6}>
                        <TextField fullWidth type="number" label="Passing Marks" value={assignmentForm.passingMarks} onChange={(e) => setAssignmentForm({...assignmentForm, passingMarks: e.target.value})} required />
                      </Grid>
                    </Grid>
                  </DialogContent>
                  <DialogActions>
                    <Button onClick={() => setShowAssignmentForm(false)}>Cancel</Button>
                    <Button type="submit" variant="contained" disabled={loading}>
                      {loading ? 'Creating...' : 'Create'}
                    </Button>
                  </DialogActions>
                </form>
              </Dialog>
            </Box>
          )}

          {activeTab === 2 && (
            <Box>
              <Typography variant="h4" fontWeight="bold" sx={{ mb: 3, color: '#1e293b' }}>Pending Submissions ({pendingSubmissions.length})</Typography>
              {pendingSubmissions.map(sub => (
                <Card key={sub._id} sx={{ mb: 3, borderRadius: 3 }}>
                  <CardContent>
                    <Stack direction="row" justifyContent="space-between" sx={{ mb: 2 }}>
                      <Typography variant="h5" fontWeight="bold">{sub.assignmentId.title}</Typography>
                      {sub.isLate && <Chip label="Late Submission" color="error" />}
                    </Stack>
                    <Typography variant="body1" gutterBottom>{sub.studentId.name} • {sub.studentId.email}</Typography>
                    <Paper sx={{ p: 2, bgcolor: '#f8fafc', my: 2 }}>
                      <Typography variant="subtitle2" fontWeight="bold" gutterBottom>Submission:</Typography>
                      {sub.textSubmission && (
                        <Typography variant="body2" sx={{ mb: 1 }}>{sub.textSubmission}</Typography>
                      )}
                      {sub.fileSubmissions?.length > 0 && (
                        <Box sx={{ mt: 1 }}>
                          <Typography variant="caption" fontWeight="bold" display="block" gutterBottom>Attached Files:</Typography>
                          {sub.fileSubmissions.map((file, idx) => (
                            <Chip
                              key={idx}
                              icon={<AttachFile />}
                              label={file.fileName}
                              component="a"
                              href={`http://localhost:5000${file.fileUrl}`}
                              target="_blank"
                              clickable
                              size="small"
                              sx={{ m: 0.5 }}
                            />
                          ))}
                        </Box>
                      )}
                    </Paper>
                    <Grid container spacing={2} sx={{ mb: 2 }}>
                      <Grid item xs={12} md={4}>
                        <TextField fullWidth type="number" label="Marks" id={`marks-${sub._id}`} inputProps={{ max: sub.assignmentId.totalMarks }} />
                      </Grid>
                      <Grid item xs={12} md={8}>
                        <TextField fullWidth label="Feedback" id={`feedback-${sub._id}`} />
                      </Grid>
                    </Grid>
                    <Stack direction="row" spacing={2}>
                      <Button
                        variant="contained"
                        color="success"
                        fullWidth
                        onClick={() => {
                          const marks = document.getElementById(`marks-${sub._id}`).value;
                          const feedback = document.getElementById(`feedback-${sub._id}`).value;
                          if (!marks || !feedback) { toast.error('Provide marks and feedback'); return; }
                          handleEvaluate(sub._id, 'approved', marks, feedback);
                        }}
                        disabled={loading}
                        sx={{ borderRadius: 2, textTransform: 'none', fontWeight: 600 }}
                      >
                        Approve
                      </Button>
                      <Button
                        variant="contained"
                        color="error"
                        fullWidth
                        onClick={() => {
                          const feedback = document.getElementById(`feedback-${sub._id}`).value;
                          if (!feedback) { toast.error('Provide feedback'); return; }
                          if (confirm('Reject this submission?')) handleEvaluate(sub._id, 'rejected', 0, feedback);
                        }}
                        disabled={loading}
                        sx={{ borderRadius: 2, textTransform: 'none', fontWeight: 600 }}
                      >
                        Reject
                      </Button>
                    </Stack>
                  </CardContent>
                </Card>
              ))}
              {pendingSubmissions.length === 0 && (
                <Paper sx={{ p: 8, textAlign: 'center', borderRadius: 3 }}>
                  <RateReview sx={{ fontSize: 80, color: 'text.secondary', mb: 2 }} />
                  <Typography variant="h5" color="text.secondary">No pending submissions</Typography>
                </Paper>
              )}
            </Box>
          )}
        </Container>
        
        <Dialog open={showHowItWorks} onClose={() => setShowHowItWorks(false)} maxWidth="md" fullWidth>
          <DialogTitle sx={{ bgcolor: '#059669', color: 'white', fontWeight: 700 }}>
            <Stack direction="row" alignItems="center" spacing={1}>
              <Info />
              <Typography variant="h6" fontWeight="bold">How Teacher Approval Works</Typography>
            </Stack>
          </DialogTitle>
          <DialogContent sx={{ mt: 2 }}>
            <Stack spacing={3}>
              <Paper sx={{ p: 2, bgcolor: '#eff6ff', borderLeft: '4px solid #3b82f6' }}>
                <Typography variant="subtitle1" fontWeight="bold" gutterBottom>📝 Step 1: Student Completes Course</Typography>
                <Typography variant="body2">Student completes all lessons and submits assignments. You evaluate their work.</Typography>
              </Paper>
              
              <Paper sx={{ p: 2, bgcolor: '#fef3c7', borderLeft: '4px solid #f59e0b' }}>
                <Typography variant="subtitle1" fontWeight="bold" gutterBottom>✅ Step 2: Evaluate Assignments</Typography>
                <Typography variant="body2">Review submissions, award marks, and provide feedback. Student can retry failed assignments (max 3 attempts).</Typography>
              </Paper>
              
              <Paper sx={{ p: 2, bgcolor: '#f0fdf4', borderLeft: '4px solid #22c55e' }}>
                <Typography variant="subtitle1" fontWeight="bold" gutterBottom>🔒 Step 3: Approve with MetaMask</Typography>
                <Typography variant="body2">Click "Approve & Store on Blockchain". Sign transaction with MetaMask. Marks are hashed (SHA-256) and stored permanently on blockchain.</Typography>
              </Paper>
              
              <Paper sx={{ p: 2, bgcolor: '#f3e8ff', borderLeft: '4px solid #9333ea' }}>
                <Typography variant="subtitle1" fontWeight="bold" gutterBottom>🎓 Step 4: Admin Issues Certificate</Typography>
                <Typography variant="body2">After your approval, admin can issue certificate. Student can verify both marks and certificate on blockchain.</Typography>
              </Paper>
              
              <Divider />
              
              <Box>
                <Typography variant="subtitle1" fontWeight="bold" gutterBottom>🔑 Your Responsibilities:</Typography>
                <Stack spacing={1} sx={{ pl: 2 }}>
                  <Typography variant="body2">• <strong>Fair Evaluation:</strong> Award marks based on rubric</Typography>
                  <Typography variant="body2">• <strong>Timely Feedback:</strong> Help students improve</Typography>
                  <Typography variant="body2">• <strong>Blockchain Signing:</strong> Your MetaMask signature proves authenticity</Typography>
                  <Typography variant="body2">• <strong>Accountability:</strong> All actions are recorded on blockchain</Typography>
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
