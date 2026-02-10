import { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import { courseAPI, enrollmentAPI, certificateAPI, assignmentAPI } from '../services/api';
import { calculateHash } from '../services/blockchain';
import {
  Box, Drawer, AppBar, Toolbar, Typography, IconButton, List, ListItemButton,
  ListItemIcon, ListItemText, Card, CardContent, Button, Chip, LinearProgress,
  Grid, Paper, TextField, Container, Accordion, AccordionSummary, AccordionDetails,
  Avatar, Stack, Divider, Badge, Dialog, DialogTitle, DialogContent, DialogActions
} from '@mui/material';
import {
  Menu, School, Assignment, EmojiEvents, Logout, CheckCircle, PlayCircle,
  Verified, Download, ExpandMore, Send, TrendingUp, AttachFile, Delete, Info,
  CheckCircleOutline, CancelOutlined
} from '@mui/icons-material';
import Footer from '../components/Footer';

export default function StudentDashboard({ user, onLogout }) {
  const [courses, setCourses] = useState([]);
  const [enrollments, setEnrollments] = useState([]);
  const [certificates, setCertificates] = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [submissions, setSubmissions] = useState([]);
  const [activeTab, setActiveTab] = useState(0);
  const [selectedEnrollment, setSelectedEnrollment] = useState(null);
  const [submissionText, setSubmissionText] = useState({});
  const [uploadedFiles, setUploadedFiles] = useState({});
  const [loading, setLoading] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(true);
  const [verificationStatus, setVerificationStatus] = useState({});
  const [showHowItWorks, setShowHowItWorks] = useState(false);

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 5000);
    return () => clearInterval(interval);
  }, []);

  const loadData = async () => {
    try {
      const [coursesRes, enrollmentsRes, certsRes, subsRes] = await Promise.all([
        courseAPI.getAll(), enrollmentAPI.getMy(), certificateAPI.getMy(), assignmentAPI.getMySubmissions()
      ]);
      setCourses(coursesRes.data);
      setEnrollments(enrollmentsRes.data);
      setCertificates(certsRes.data);
      setSubmissions(subsRes.data);
    } catch (error) {
      if (error.response?.status === 401) {
        toast.error('Session expired');
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
      if (res.data.status === 'completed') {
        toast.success('🎉 All lessons completed!');
      } else {
        toast.success('Lesson completed!');
      }
    } catch (error) {
      toast.error('Failed to complete lesson');
    }
  };

  const handleVerifyMarks = async (enrollment) => {
    setLoading(true);
    try {
      if (!window.ethereum) {
        toast.error('MetaMask not installed');
        setLoading(false);
        return;
      }
      
      const courseId = enrollment.courseId.courseId;
      const studentId = user.id;
      const key = `marks_${enrollment._id}`;
      
      const calculatedHash = await calculateHash(`${studentId}|${courseId}|${enrollment.marks}`);
      const { verifyMarksHash } = await import('../services/blockchain');
      const isValid = await verifyMarksHash(studentId, courseId, calculatedHash);
      
      setVerificationStatus(prev => ({ ...prev, [key]: { verified: isValid, timestamp: new Date() } }));
      
      if (isValid) {
        toast.success('✅ Marks verified on blockchain! Data is authentic and tamper-proof.', { autoClose: 5000 });
      } else {
        toast.error('⚠️ Verification failed! Marks may have been tampered.', { autoClose: 5000 });
      }
    } catch (error) {
      console.error('Verification error:', error);
      toast.error('Blockchain verification failed: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyCertificate = async (cert) => {
    setLoading(true);
    try {
      if (!window.ethereum) {
        toast.error('MetaMask not installed');
        setLoading(false);
        return;
      }
      
      const data = JSON.parse(cert.certificateData);
      const studentId = user.id;
      const courseId = data.courseId;
      const certHash = cert.certificateHash;
      const key = `cert_${cert._id}`;
      
      const { verifyCertificateHash } = await import('../services/blockchain');
      const isValid = await verifyCertificateHash(studentId, courseId, certHash);
      
      setVerificationStatus(prev => ({ ...prev, [key]: { verified: isValid, timestamp: new Date() } }));
      
      if (isValid) {
        toast.success('✅ Certificate verified on blockchain! This is an authentic certificate.', { autoClose: 5000 });
      } else {
        toast.error('⚠️ Verification failed! Certificate may be fake or tampered.', { autoClose: 5000 });
      }
    } catch (error) {
      console.error('Certificate verification error:', error);
      toast.error('Blockchain verification failed: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadCertificate = async (cert) => {
    try {
      const response = await fetch(`http://localhost:5000/api/certificates/download/${cert._id}`, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      if (!response.ok) throw new Error('Download failed');
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      const data = JSON.parse(cert.certificateData);
      a.download = `certificate_${data.courseId}_${Date.now()}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success('Certificate downloaded!');
    } catch (error) {
      toast.error('Download failed');
    }
  };

  const loadAssignments = async (courseId) => {
    try {
      const res = await assignmentAPI.getByCourse(courseId);
      setAssignments(res.data);
    } catch (error) {
      console.error('Load assignments error:', error);
    }
  };

  const handleFileUpload = async (assignmentId, files) => {
    if (!files || files.length === 0) return;
    
    const formData = new FormData();
    Array.from(files).forEach(file => formData.append('files', file));
    
    try {
      const response = await fetch(`http://localhost:5000/api/assignments/${assignmentId}/upload`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` },
        body: formData
      });
      
      if (!response.ok) throw new Error('Upload failed');
      const data = await response.json();
      
      setUploadedFiles(prev => ({ ...prev, [assignmentId]: data.files }));
      toast.success(`${data.files.length} file(s) uploaded!`);
    } catch (error) {
      toast.error('File upload failed');
    }
  };

  const handleSubmitAssignment = async (assignmentId) => {
    const text = submissionText[assignmentId] || '';
    const files = uploadedFiles[assignmentId] || [];
    
    if (!text.trim() && files.length === 0) {
      toast.error('Please provide text (min 50 chars) or upload files');
      return;
    }
    
    if (text.trim() && text.length < 50) {
      toast.error('Text must be at least 50 characters');
      return;
    }
    
    setLoading(true);
    try {
      await assignmentAPI.submit(assignmentId, { textSubmission: text, fileSubmissions: files });
      toast.success('✓ Assignment submitted!');
      setSubmissionText(prev => ({ ...prev, [assignmentId]: '' }));
      setUploadedFiles(prev => ({ ...prev, [assignmentId]: [] }));
      await loadData();
    } catch (error) {
      toast.error(error.response?.data?.error || 'Submission failed');
    } finally {
      setLoading(false);
    }
  };

  const isEnrolled = (courseId) => enrollments.some(e => e.courseId._id === courseId);

  const drawer = (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column', background: 'linear-gradient(180deg, #1e3a8a 0%, #1e40af 100%)' }}>
      <Box sx={{ p: 3, textAlign: 'center' }}>
        <Avatar sx={{ width: 70, height: 70, mx: 'auto', mb: 2, bgcolor: '#3b82f6', fontSize: '2rem', fontWeight: 'bold' }}>
          {user.name.charAt(0)}
        </Avatar>
        <Typography variant="h6" fontWeight="bold" color="white">{user.name}</Typography>
        <Chip label="Student" size="small" sx={{ mt: 1, bgcolor: 'rgba(255,255,255,0.2)', color: 'white' }} />
      </Box>
      <Divider sx={{ bgcolor: 'rgba(255,255,255,0.1)' }} />
      <List sx={{ flex: 1, px: 2, py: 2 }}>
        {[
          { label: 'Courses', icon: <School />, tab: 0, count: courses.length },
          { label: 'My Learning', icon: <PlayCircle />, tab: 1, count: enrollments.length },
          { label: 'Assignments', icon: <Assignment />, tab: 2, badge: submissions.filter(s => s.status === 'pending').length },
          { label: 'Certificates', icon: <EmojiEvents />, tab: 3, count: certificates.length }
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
          <IconButton onClick={() => setDrawerOpen(!drawerOpen)} edge="start" sx={{ mr: 2, color: '#1e40af' }}>
            <Menu />
          </IconButton>
          <School sx={{ mr: 1, color: '#1e40af', fontSize: 32 }} />
          <Box sx={{ flexGrow: 1 }}>
            <Typography variant="h6" sx={{ color: '#1e293b', fontWeight: 700, lineHeight: 1.2 }}>
              Tamper-Proof LMS
            </Typography>
            <Typography variant="caption" sx={{ color: '#64748b', fontSize: '0.7rem' }}>
              Blockchain-Secured Learning Management System
            </Typography>
          </Box>
          <Stack direction="row" spacing={1} alignItems="center">
            <Chip label="Student" size="small" sx={{ bgcolor: '#dbeafe', color: '#1e40af', fontWeight: 600 }} />
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
              <Card sx={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', color: 'white', borderRadius: 3 }}>
                <CardContent>
                  <Stack direction="row" justifyContent="space-between" alignItems="center">
                    <Box>
                      <Typography variant="body2" sx={{ opacity: 0.9 }}>Enrolled Courses</Typography>
                      <Typography variant="h3" fontWeight="bold">{enrollments.length}</Typography>
                    </Box>
                    <TrendingUp sx={{ fontSize: 50, opacity: 0.3 }} />
                  </Stack>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} md={4}>
              <Card sx={{ background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)', color: 'white', borderRadius: 3 }}>
                <CardContent>
                  <Stack direction="row" justifyContent="space-between" alignItems="center">
                    <Box>
                      <Typography variant="body2" sx={{ opacity: 0.9 }}>Certificates</Typography>
                      <Typography variant="h3" fontWeight="bold">{certificates.length}</Typography>
                    </Box>
                    <EmojiEvents sx={{ fontSize: 50, opacity: 0.3 }} />
                  </Stack>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} md={4}>
              <Card sx={{ background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)', color: 'white', borderRadius: 3 }}>
                <CardContent>
                  <Stack direction="row" justifyContent="space-between" alignItems="center">
                    <Box>
                      <Typography variant="body2" sx={{ opacity: 0.9 }}>Submissions</Typography>
                      <Typography variant="h3" fontWeight="bold">{submissions.length}</Typography>
                    </Box>
                    <Assignment sx={{ fontSize: 50, opacity: 0.3 }} />
                  </Stack>
                </CardContent>
              </Card>
            </Grid>
          </Grid>

          {activeTab === 0 && (
            <Box>
              <Typography variant="h4" fontWeight="bold" sx={{ mb: 3, color: '#1e293b' }}>Explore Courses</Typography>
              <Grid container spacing={3}>
                {courses.map(course => (
                  <Grid item xs={12} md={6} lg={4} key={course._id}>
                    <Card sx={{ height: '100%', borderRadius: 3, transition: 'all 0.3s', '&:hover': { transform: 'translateY(-8px)', boxShadow: '0 12px 24px rgba(0,0,0,0.15)' } }}>
                      <Box sx={{ height: 8, background: 'linear-gradient(90deg, #667eea 0%, #764ba2 100%)' }} />
                      <CardContent>
                        <Stack direction="row" spacing={1} sx={{ mb: 2 }}>
                          <Chip label={course.subject} size="small" color="primary" />
                          <Chip label={`${course.lessons.length} lessons`} size="small" variant="outlined" />
                        </Stack>
                        <Typography variant="h6" fontWeight="bold" gutterBottom>{course.title}</Typography>
                        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>{course.description}</Typography>
                        <Button
                          fullWidth
                          variant={isEnrolled(course._id) ? 'outlined' : 'contained'}
                          disabled={isEnrolled(course._id) || loading}
                          onClick={() => handleEnroll(course._id)}
                          startIcon={isEnrolled(course._id) ? <CheckCircle /> : null}
                          sx={{ borderRadius: 2, textTransform: 'none', fontWeight: 600 }}
                        >
                          {isEnrolled(course._id) ? 'Enrolled' : 'Enroll Now'}
                        </Button>
                      </CardContent>
                    </Card>
                  </Grid>
                ))}
              </Grid>
            </Box>
          )}

          {activeTab === 1 && (
            <Box>
              <Typography variant="h4" fontWeight="bold" sx={{ mb: 3, color: '#1e293b' }}>My Learning</Typography>
              {enrollments.map(enrollment => {
                const progress = (enrollment.completedLessons.length / enrollment.courseId.lessons.length) * 100;
                const allLessonsComplete = enrollment.completedLessons.length === enrollment.courseId.lessons.length;
                const courseAssignments = submissions.filter(s => s.courseId._id === enrollment.courseId._id);
                
                return (
                  <Card key={enrollment._id} sx={{ mb: 3, borderRadius: 3 }}>
                    <CardContent>
                      <Stack direction="row" justifyContent="space-between" alignItems="start" sx={{ mb: 2 }}>
                        <Box>
                          <Typography variant="h5" fontWeight="bold">{enrollment.courseId.title}</Typography>
                          <Chip label={enrollment.status} color={enrollment.status === 'approved' ? 'success' : 'default'} size="small" sx={{ mt: 1 }} />
                        </Box>
                        <Box sx={{ textAlign: 'right' }}>
                          <Typography variant="h3" fontWeight="bold" color="primary">{Math.round(progress)}%</Typography>
                          <Typography variant="caption" color="text.secondary">Complete</Typography>
                        </Box>
                      </Stack>
                      <LinearProgress variant="determinate" value={progress} sx={{ mb: 3, height: 10, borderRadius: 5 }} />
                      
                      {enrollment.courseId.lessons.map((lesson, idx) => (
                        <Accordion key={idx}>
                          <AccordionSummary expandIcon={<ExpandMore />}>
                            <Stack direction="row" alignItems="center" spacing={2}>
                              {enrollment.completedLessons.includes(idx) ? (
                                <CheckCircle color="success" />
                              ) : (
                                <PlayCircle color="action" />
                              )}
                              <Typography fontWeight={500}>{lesson.title}</Typography>
                            </Stack>
                          </AccordionSummary>
                          <AccordionDetails>
                            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>{lesson.content}</Typography>
                            {!enrollment.completedLessons.includes(idx) && (
                              <Button variant="contained" size="small" onClick={() => handleCompleteLesson(enrollment._id, idx)}>
                                Mark Complete
                              </Button>
                            )}
                          </AccordionDetails>
                        </Accordion>
                      ))}

                      {allLessonsComplete && (
                        <Paper sx={{ p: 2, mt: 2, bgcolor: '#eff6ff', borderLeft: '4px solid #3b82f6' }}>
                          <Typography variant="subtitle1" fontWeight="bold" gutterBottom>📝 Assignments Available</Typography>
                          <Button variant="contained" onClick={() => { setSelectedEnrollment(enrollment); loadAssignments(enrollment.courseId._id); setActiveTab(2); }}>
                            View Assignments
                          </Button>
                          {courseAssignments.length > 0 && (
                            <Typography variant="caption" display="block" sx={{ mt: 1 }}>Submitted: {courseAssignments.length}</Typography>
                          )}
                        </Paper>
                      )}

                      {enrollment.marks !== undefined && (enrollment.status === 'approved' || enrollment.status === 'verified') && (
                        <Paper sx={{ p: 2, mt: 2, bgcolor: '#f0fdf4', borderLeft: '4px solid #22c55e' }}>
                          <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1 }}>
                            <Typography variant="subtitle1" fontWeight="bold">✓ Course Completed — Marks: {enrollment.marks}/100</Typography>
                            {verificationStatus[`marks_${enrollment._id}`] && (
                              <Chip 
                                icon={verificationStatus[`marks_${enrollment._id}`].verified ? <CheckCircleOutline /> : <CancelOutlined />}
                                label={verificationStatus[`marks_${enrollment._id}`].verified ? 'Verified ✔️' : 'Invalid ❌'}
                                color={verificationStatus[`marks_${enrollment._id}`].verified ? 'success' : 'error'}
                                size="small"
                              />
                            )}
                          </Stack>
                          {verificationStatus[`marks_${enrollment._id}`] && (
                            <Typography variant="caption" color="text.secondary" display="block" sx={{ mb: 1 }}>
                              Last verified: {verificationStatus[`marks_${enrollment._id}`].timestamp.toLocaleString()}
                            </Typography>
                          )}
                          <Button 
                            variant="outlined" 
                            startIcon={<Verified />} 
                            onClick={() => handleVerifyMarks(enrollment)} 
                            disabled={loading}
                            size="small"
                            sx={{ textTransform: 'none', fontWeight: 600 }}
                          >
                            {loading ? 'Verifying...' : 'Verify on Blockchain'}
                          </Button>
                        </Paper>
                      )}
                    </CardContent>
                  </Card>
                );
              })}
            </Box>
          )}

          {activeTab === 2 && (
            <Box>
              {selectedEnrollment ? (
                <Box>
                  <Button onClick={() => { setSelectedEnrollment(null); setSubmissionText({}); setUploadedFiles({}); }} sx={{ mb: 2 }}>← Back</Button>
                  <Typography variant="h4" fontWeight="bold" gutterBottom>{selectedEnrollment.courseId.title}</Typography>
                  {assignments.map(assignment => {
                    const allSubmissions = submissions.filter(s => s.assignmentId._id === assignment._id);
                    const latestSubmission = allSubmissions.length > 0 ? allSubmissions[allSubmissions.length - 1] : null;
                    const highestMarks = allSubmissions.length > 0 ? Math.max(...allSubmissions.map(s => s.marksAwarded || 0)) : 0;
                    const isOverdue = new Date() > new Date(assignment.dueDate);
                    const canRetry = latestSubmission && latestSubmission.canRetryAfter && new Date() < new Date(latestSubmission.canRetryAfter);
                    const maxAttemptsReached = latestSubmission && latestSubmission.attemptNumber >= 3;
                    const passed = latestSubmission && latestSubmission.marksAwarded >= assignment.passingMarks;
                    
                    return (
                      <Card key={assignment._id} sx={{ mb: 3, borderRadius: 3, border: latestSubmission?.status === 'approved' && passed ? '2px solid #22c55e' : latestSubmission?.status === 'rejected' || (latestSubmission && latestSubmission.marksAwarded < assignment.passingMarks) ? '2px solid #ef4444' : 'none' }}>
                        <CardContent>
                          <Stack direction="row" justifyContent="space-between" sx={{ mb: 2 }}>
                            <Typography variant="h5" fontWeight="bold">{assignment.title}</Typography>
                            {latestSubmission && (
                              <Stack direction="row" spacing={1}>
                                <Chip 
                                  label={`Attempt ${latestSubmission.attemptNumber}/3`} 
                                  size="small" 
                                  color={latestSubmission.attemptNumber === 3 ? 'error' : 'default'}
                                />
                                {passed ? (
                                  <Chip label="Passed" color="success" />
                                ) : latestSubmission.status === 'approved' || latestSubmission.status === 'rejected' ? (
                                  <Chip label="Failed" color="error" />
                                ) : (
                                  <Chip label="Pending" color="warning" />
                                )}
                              </Stack>
                            )}
                          </Stack>
                          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>{assignment.description}</Typography>
                          <Stack direction="row" spacing={1} sx={{ mb: 2 }}>
                            <Chip label={`Due: ${new Date(assignment.dueDate).toLocaleDateString()}`} size="small" />
                            <Chip label={`${assignment.totalMarks} marks`} size="small" />
                            <Chip label={`Passing: ${assignment.passingMarks}`} size="small" color="info" />
                            <Chip label={assignment.difficulty} size="small" color={assignment.difficulty === 'easy' ? 'success' : assignment.difficulty === 'medium' ? 'warning' : 'error'} />
                          </Stack>
                          {isOverdue && !latestSubmission && <Chip label="Overdue" color="error" size="small" sx={{ mb: 2 }} />}
                          
                          {allSubmissions.length > 0 && (
                            <Paper sx={{ p: 2, mb: 2, bgcolor: '#f0fdf4', borderLeft: '4px solid #22c55e' }}>
                              <Typography variant="subtitle2" fontWeight="bold">Highest Score: {highestMarks}/{assignment.totalMarks}</Typography>
                            </Paper>
                          )}
                          
                          <Paper sx={{ p: 2, bgcolor: '#f8fafc', mb: 2 }}>
                            <Typography variant="subtitle2" fontWeight="bold" gutterBottom>Instructions:</Typography>
                            <Typography variant="body2">{assignment.instructions}</Typography>
                          </Paper>

                          {latestSubmission ? (
                            <Box>
                              <Paper sx={{ p: 2, mb: 2 }}>
                                <Typography variant="subtitle2" fontWeight="bold" gutterBottom>Latest Submission (Attempt {latestSubmission.attemptNumber}):</Typography>
                                {latestSubmission.textSubmission && (
                                  <Typography variant="body2" sx={{ mb: 1 }}>{latestSubmission.textSubmission}</Typography>
                                )}
                                {latestSubmission.fileSubmissions?.length > 0 && (
                                  <Box sx={{ mt: 1 }}>
                                    <Typography variant="caption" fontWeight="bold" display="block" gutterBottom>Attached Files:</Typography>
                                    {latestSubmission.fileSubmissions.map((file, idx) => (
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
                                <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 1 }}>
                                  Submitted: {new Date(latestSubmission.submittedAt).toLocaleString()}
                                </Typography>
                              </Paper>
                              {latestSubmission.marksAwarded !== undefined && (
                                <Chip label={`Score: ${latestSubmission.marksAwarded}/${assignment.totalMarks}`} color={latestSubmission.marksAwarded >= assignment.passingMarks ? 'success' : 'error'} sx={{ mb: 2 }} />
                              )}
                              {latestSubmission.feedback && (
                                <Paper sx={{ p: 2, mb: 2, bgcolor: '#fef3c7' }}>
                                  <Typography variant="subtitle2" fontWeight="bold" gutterBottom>Feedback:</Typography>
                                  <Typography variant="body2">{latestSubmission.feedback}</Typography>
                                </Paper>
                              )}
                              
                              {!passed && !maxAttemptsReached && latestSubmission.status !== 'pending' && (
                                canRetry ? (
                                  <Paper sx={{ p: 2, bgcolor: '#fef3c7', borderLeft: '4px solid #f59e0b' }}>
                                    <Typography variant="body2" color="#92400e" fontWeight="500">
                                      ⏳ You can retry after {new Date(latestSubmission.canRetryAfter).toLocaleString()}
                                    </Typography>
                                  </Paper>
                                ) : (
                                  <Box>
                                    <TextField
                                      fullWidth
                                      multiline
                                      rows={6}
                                      placeholder="Type your improved answer here..."
                                      value={submissionText[assignment._id] || ''}
                                      onChange={(e) => setSubmissionText(prev => ({ ...prev, [assignment._id]: e.target.value }))}
                                      sx={{ mb: 2 }}
                                    />
                                    <Button
                                      variant="outlined"
                                      component="label"
                                      startIcon={<AttachFile />}
                                      sx={{ mb: 2 }}
                                    >
                                      Upload Files (PDF, DOC, Images)
                                      <input
                                        type="file"
                                        hidden
                                        multiple
                                        accept=".pdf,.doc,.docx,.txt,.jpg,.jpeg,.png,.zip"
                                        onChange={(e) => handleFileUpload(assignment._id, e.target.files)}
                                      />
                                    </Button>
                                    {uploadedFiles[assignment._id]?.length > 0 && (
                                      <Paper sx={{ p: 1, mb: 2, bgcolor: '#f0fdf4' }}>
                                        {uploadedFiles[assignment._id].map((file, idx) => (
                                          <Chip
                                            key={idx}
                                            label={file.fileName}
                                            onDelete={() => setUploadedFiles(prev => ({
                                              ...prev,
                                              [assignment._id]: prev[assignment._id].filter((_, i) => i !== idx)
                                            }))}
                                            size="small"
                                            sx={{ m: 0.5 }}
                                          />
                                        ))}
                                      </Paper>
                                    )}
                                    <Stack direction="row" justifyContent="space-between" alignItems="center">
                                      <Typography variant="caption">{(submissionText[assignment._id] || '').length} characters</Typography>
                                      <Button
                                        variant="contained"
                                        startIcon={<Send />}
                                        onClick={() => handleSubmitAssignment(assignment._id)}
                                        disabled={loading}
                                      >
                                        Retry Submission
                                      </Button>
                                    </Stack>
                                  </Box>
                                )
                              )}
                              
                              {maxAttemptsReached && !passed && (
                                <Paper sx={{ p: 2, bgcolor: '#fef2f2', borderLeft: '4px solid #ef4444' }}>
                                  <Typography variant="body2" color="#991b1b" fontWeight="500">
                                    ⚠️ Maximum attempts (3) reached. No more retries available.
                                  </Typography>
                                </Paper>
                              )}
                            </Box>
                          ) : (
                            <Box>
                              <TextField
                                fullWidth
                                multiline
                                rows={6}
                                placeholder="Type your answer here..."
                                value={submissionText[assignment._id] || ''}
                                onChange={(e) => setSubmissionText(prev => ({ ...prev, [assignment._id]: e.target.value }))}
                                sx={{ mb: 2 }}
                              />
                              <Button
                                variant="outlined"
                                component="label"
                                startIcon={<AttachFile />}
                                sx={{ mb: 2 }}
                              >
                                Upload Files (PDF, DOC, Images)
                                <input
                                  type="file"
                                  hidden
                                  multiple
                                  accept=".pdf,.doc,.docx,.txt,.jpg,.jpeg,.png,.zip"
                                  onChange={(e) => handleFileUpload(assignment._id, e.target.files)}
                                />
                              </Button>
                              {uploadedFiles[assignment._id]?.length > 0 && (
                                <Paper sx={{ p: 1, mb: 2, bgcolor: '#f0fdf4' }}>
                                  {uploadedFiles[assignment._id].map((file, idx) => (
                                    <Chip
                                      key={idx}
                                      label={file.fileName}
                                      onDelete={() => setUploadedFiles(prev => ({
                                        ...prev,
                                        [assignment._id]: prev[assignment._id].filter((_, i) => i !== idx)
                                      }))}
                                      size="small"
                                      sx={{ m: 0.5 }}
                                    />
                                  ))}
                                </Paper>
                              )}
                              <Stack direction="row" justifyContent="space-between" alignItems="center">
                                <Typography variant="caption">{(submissionText[assignment._id] || '').length} characters</Typography>
                                <Button
                                  variant="contained"
                                  startIcon={<Send />}
                                  onClick={() => handleSubmitAssignment(assignment._id)}
                                  disabled={loading}
                                >
                                  Submit Assignment
                                </Button>
                              </Stack>
                            </Box>
                          )}
                        </CardContent>
                      </Card>
                    );
                  })}
                </Box>
              ) : (
                <Paper sx={{ p: 8, textAlign: 'center', borderRadius: 3 }}>
                  <Assignment sx={{ fontSize: 80, color: 'text.secondary', mb: 2 }} />
                  <Typography variant="h5" gutterBottom>Select a course to view assignments</Typography>
                  <Button variant="contained" onClick={() => setActiveTab(1)} sx={{ mt: 2 }}>Go to My Learning</Button>
                </Paper>
              )}
            </Box>
          )}

          {activeTab === 3 && (
            <Box>
              <Typography variant="h4" fontWeight="bold" sx={{ mb: 3, color: '#1e293b' }}>My Certificates</Typography>
              <Grid container spacing={3}>
                {certificates.map(cert => (
                  <Grid item xs={12} md={6} lg={4} key={cert._id}>
                    <Card sx={{ textAlign: 'center', background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', color: 'white', borderRadius: 3 }}>
                      <CardContent>
                        <EmojiEvents sx={{ fontSize: 60, mb: 2 }} />
                        <Typography variant="h5" fontWeight="bold" gutterBottom>{cert.courseId.title}</Typography>
                        <Typography variant="body2" sx={{ mb: 2 }}>Issued: {new Date(cert.issuedAt).toLocaleDateString()}</Typography>
                        
                        {verificationStatus[`cert_${cert._id}`] && (
                          <Stack direction="row" justifyContent="center" sx={{ mb: 2 }}>
                            <Chip 
                              icon={verificationStatus[`cert_${cert._id}`].verified ? <CheckCircleOutline /> : <CancelOutlined />}
                              label={verificationStatus[`cert_${cert._id}`].verified ? 'Verified ✔️' : 'Invalid ❌'}
                              color={verificationStatus[`cert_${cert._id}`].verified ? 'success' : 'error'}
                              sx={{ bgcolor: 'rgba(255,255,255,0.9)', fontWeight: 600 }}
                            />
                          </Stack>
                        )}
                        {verificationStatus[`cert_${cert._id}`] && (
                          <Typography variant="caption" display="block" sx={{ mb: 2, opacity: 0.9 }}>
                            Last verified: {verificationStatus[`cert_${cert._id}`].timestamp.toLocaleString()}
                          </Typography>
                        )}
                        
                        <Button 
                          variant="contained" 
                          fullWidth 
                          startIcon={<Verified />} 
                          onClick={() => handleVerifyCertificate(cert)} 
                          disabled={loading}
                          sx={{ mb: 1, bgcolor: 'rgba(255,255,255,0.2)', '&:hover': { bgcolor: 'rgba(255,255,255,0.3)' }, textTransform: 'none', fontWeight: 600 }}
                        >
                          {loading ? 'Verifying...' : 'Verify on Blockchain'}
                        </Button>
                        <Button 
                          variant="outlined" 
                          fullWidth 
                          startIcon={<Download />} 
                          onClick={() => handleDownloadCertificate(cert)} 
                          sx={{ color: 'white', borderColor: 'white', textTransform: 'none', fontWeight: 600 }}
                        >
                          Download Certificate
                        </Button>
                      </CardContent>
                    </Card>
                  </Grid>
                ))}
              </Grid>
              {certificates.length === 0 && (
                <Paper sx={{ p: 8, textAlign: 'center', borderRadius: 3 }}>
                  <EmojiEvents sx={{ fontSize: 80, color: 'text.secondary', mb: 2 }} />
                  <Typography variant="h5" color="text.secondary">No certificates yet</Typography>
                  <Typography variant="body2" color="text.secondary">Complete courses to earn certificates</Typography>
                </Paper>
              )}
            </Box>
          )}
        </Container>
        
        <Dialog open={showHowItWorks} onClose={() => setShowHowItWorks(false)} maxWidth="md" fullWidth>
          <DialogTitle sx={{ bgcolor: '#1e40af', color: 'white', fontWeight: 700 }}>
            <Stack direction="row" alignItems="center" spacing={1}>
              <Info />
              <Typography variant="h6" fontWeight="bold">How Blockchain Verification Works</Typography>
            </Stack>
          </DialogTitle>
          <DialogContent sx={{ mt: 2 }}>
            <Stack spacing={3}>
              <Paper sx={{ p: 2, bgcolor: '#eff6ff', borderLeft: '4px solid #3b82f6' }}>
                <Typography variant="subtitle1" fontWeight="bold" gutterBottom>📚 Step 1: Complete Course</Typography>
                <Typography variant="body2">Complete all lessons and submit assignments. Teacher evaluates your work.</Typography>
              </Paper>
              
              <Paper sx={{ p: 2, bgcolor: '#f0fdf4', borderLeft: '4px solid #22c55e' }}>
                <Typography variant="subtitle1" fontWeight="bold" gutterBottom>✅ Step 2: Teacher Approval</Typography>
                <Typography variant="body2">Teacher approves your completion and signs transaction with MetaMask. Your marks are hashed (SHA-256) and stored on blockchain.</Typography>
              </Paper>
              
              <Paper sx={{ p: 2, bgcolor: '#fef3c7', borderLeft: '4px solid #f59e0b' }}>
                <Typography variant="subtitle1" fontWeight="bold" gutterBottom>🎓 Step 3: Certificate Issuance</Typography>
                <Typography variant="body2">Admin issues certificate and signs with MetaMask. Certificate hash is stored on blockchain permanently.</Typography>
              </Paper>
              
              <Paper sx={{ p: 2, bgcolor: '#f3e8ff', borderLeft: '4px solid #9333ea' }}>
                <Typography variant="subtitle1" fontWeight="bold" gutterBottom>🔒 Step 4: Verification</Typography>
                <Typography variant="body2">Click "Verify on Blockchain" to check if your marks/certificate match blockchain records. Green ✔️ means authentic, Red ❌ means tampered.</Typography>
              </Paper>
              
              <Divider />
              
              <Box>
                <Typography variant="subtitle1" fontWeight="bold" gutterBottom>🔑 Key Benefits:</Typography>
                <Stack spacing={1} sx={{ pl: 2 }}>
                  <Typography variant="body2">• <strong>Tamper-Proof:</strong> Once stored, data cannot be altered without detection</Typography>
                  <Typography variant="body2">• <strong>Transparent:</strong> Anyone can verify authenticity</Typography>
                  <Typography variant="body2">• <strong>Permanent:</strong> Records stored forever on blockchain</Typography>
                  <Typography variant="body2">• <strong>Trustworthy:</strong> No central authority can manipulate data</Typography>
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
