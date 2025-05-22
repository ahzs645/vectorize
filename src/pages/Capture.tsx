import { useState, useRef, useCallback } from 'react';
import { Box, Button, Typography, IconButton, Paper } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import Webcam from 'react-webcam';
import PhotoLibraryIcon from '@mui/icons-material/PhotoLibrary';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import FlashOnIcon from '@mui/icons-material/FlashOn';

const Capture = () => {
  const navigate = useNavigate();
  const webcamRef = useRef<Webcam>(null);
  const [isCapturing, setIsCapturing] = useState(false);
  const [markersDetected, setMarkersDetected] = useState(false);

  const handleCapture = useCallback(() => {
    if (webcamRef.current) {
      const imageSrc = webcamRef.current.getScreenshot();
      // TODO: Process image and detect ArUco markers
      setIsCapturing(true);
      setTimeout(() => {
        setIsCapturing(false);
        // TODO: Navigate to adjustment page with captured image
        navigate('/adjust');
      }, 1000);
    }
  }, [navigate]);

  return (
    <Box sx={{ height: '100vh', position: 'relative', bgcolor: 'black' }}>
      {/* Camera Feed */}
      <Webcam
        ref={webcamRef}
        audio={false}
        screenshotFormat="image/jpeg"
        videoConstraints={{
          facingMode: 'environment',
        }}
        style={{
          width: '100%',
          height: '100%',
          objectFit: 'cover',
        }}
      />

      {/* Overlay Elements */}
      <Box
        sx={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          p: 2,
        }}
      >
        {/* Top Bar */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <IconButton
            onClick={() => navigate('/')}
            sx={{ color: 'white', bgcolor: 'rgba(0,0,0,0.5)' }}
          >
            <ArrowBackIcon />
          </IconButton>
          <IconButton
            onClick={() => navigate('/past-exports')}
            sx={{ color: 'white', bgcolor: 'rgba(0,0,0,0.5)' }}
          >
            <PhotoLibraryIcon />
          </IconButton>
        </Box>

        {/* Center Status */}
        <Box sx={{ textAlign: 'center' }}>
          <Typography
            variant="h6"
            sx={{
              color: 'white',
              bgcolor: 'rgba(0,0,0,0.5)',
              py: 1,
              px: 2,
              borderRadius: 2,
              display: 'inline-block',
            }}
          >
            {markersDetected ? 'Markers Detected' : 'Scanning for markers...'}
          </Typography>
        </Box>

        {/* Bottom Controls */}
        <Box sx={{ display: 'flex', justifyContent: 'center', mb: 4 }}>
          <Button
            variant="contained"
            size="large"
            onClick={handleCapture}
            disabled={!markersDetected || isCapturing}
            startIcon={<FlashOnIcon />}
            sx={{
              bgcolor: 'white',
              color: 'black',
              '&:hover': {
                bgcolor: 'grey.200',
              },
            }}
          >
            {isCapturing ? 'Capturing...' : 'Capture'}
          </Button>
        </Box>
      </Box>
    </Box>
  );
};

export default Capture; 