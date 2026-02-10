import { Box, Container, Typography, Stack } from '@mui/material';
import { School, Security } from '@mui/icons-material';

export default function Footer() {
  return (
    <Box sx={{ bgcolor: '#f8fafc', color: '#64748b', py: 3, mt: 8, borderTop: '1px solid #e2e8f0' }}>
      <Container maxWidth="lg">
        <Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="space-between" alignItems="center" spacing={2}>
          <Stack direction="row" alignItems="center" spacing={1}>
            <School sx={{ fontSize: 24, color: '#3b82f6' }} />
            <Typography variant="body2" fontWeight="600" color="#1e293b">Tamper-Proof LMS</Typography>
          </Stack>
          
          <Stack direction="row" alignItems="center" spacing={1}>
            <Security sx={{ fontSize: 18, color: '#22c55e' }} />
            <Typography variant="caption" color="#64748b">
              Blockchain-Secured Education System
            </Typography>
          </Stack>
          
          <Typography variant="caption" color="#94a3b8">
            © 2024 All Rights Reserved
          </Typography>
        </Stack>
      </Container>
    </Box>
  );
}


