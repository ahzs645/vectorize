import { Box, Button, Container, Typography, Grid } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import CameraAltIcon from '@mui/icons-material/CameraAlt';
import HistoryIcon from '@mui/icons-material/History';

const Welcome = () => {
  const navigate = useNavigate();

  return (
    <Container maxWidth="md">
      <Box
        sx={{
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          gap: 4,
          py: 8,
        }}
      >
        <Typography variant="h2" component="h1" gutterBottom align="center">
          Trace-to-Vector
        </Typography>
        
        <Typography variant="h5" component="h2" color="text.secondary" align="center" sx={{ mb: 4 }}>
          Transform your physical drawings into precise vector graphics using ArUco markers
        </Typography>

        <Grid container spacing={3} justifyContent="center">
          <Grid item>
            <Button
              variant="contained"
              size="large"
              startIcon={<CameraAltIcon />}
              onClick={() => navigate('/capture')}
              sx={{ px: 4, py: 1.5 }}
            >
              Get Started
            </Button>
          </Grid>
          <Grid item>
            <Button
              variant="outlined"
              size="large"
              startIcon={<HistoryIcon />}
              onClick={() => navigate('/past-exports')}
              sx={{ px: 4, py: 1.5 }}
            >
              Past Exports
            </Button>
          </Grid>
        </Grid>

        <Box sx={{ mt: 8, width: '100%' }}>
          <Typography variant="h6" gutterBottom align="center">
            Recent Captures
          </Typography>
          <Grid container spacing={2} justifyContent="center">
            {/* Placeholder for recent captures grid */}
            {[1, 2, 3, 4].map((item) => (
              <Grid item key={item}>
                <Box
                  sx={{
                    width: 150,
                    height: 150,
                    bgcolor: 'grey.200',
                    borderRadius: 2,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Typography color="text.secondary">Preview {item}</Typography>
                </Box>
              </Grid>
            ))}
          </Grid>
        </Box>
      </Box>
    </Container>
  );
};

export default Welcome; 