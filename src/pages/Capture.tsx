import { useState, useRef, useCallback, useEffect } from 'react';
import { Box, Button, Typography, IconButton, Paper } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import Webcam from 'react-webcam';
import PhotoLibraryIcon from '@mui/icons-material/PhotoLibrary';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import FlashOnIcon from '@mui/icons-material/FlashOn';
import { useOpenCV } from '../hooks/useOpenCV'; // Adjust path as needed

const Capture = () => {
  const { cv, isLoading, error } = useOpenCV();
  const navigate = useNavigate();
  const webcamRef = useRef<Webcam>(null);
  const [isCapturing, setIsCapturing] = useState(false);
  const [markersDetected, setMarkersDetected] = useState(false); // This will be updated by continuous detection later if implemented
  const [capturedData, setCapturedData] = useState<{ imageSrc: string; markers: { corners: any[]; ids: any[] } } | null>(null);


  useEffect(() => {
    if (!isLoading && cv) {
      console.log('OpenCV loaded in Capture.tsx', cv);
      // Pre-load detector parts if needed, or just confirm cv is available
    } else if (error) {
      console.error('Error loading OpenCV in Capture.tsx', error);
    }
  }, [cv, isLoading, error]);

  const handleCapture = useCallback(async () => {
    if (!webcamRef.current || !cv) {
      console.error('Webcam or OpenCV not available.');
      if (!cv) console.error('cv object is null. OpenCV might not have loaded correctly.');
      return;
    }

    setIsCapturing(true);
    const imageSrc = webcamRef.current.getScreenshot();
    if (!imageSrc) {
      console.error('Failed to capture image.');
      setIsCapturing(false);
      return;
    }

    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        console.error('Failed to get canvas context.');
        setIsCapturing(false);
        return;
      }
      ctx.drawImage(img, 0, 0, img.width, img.height);

      let srcMat = cv.imread(canvas);
      let dictionary = cv.aruco.getPredefinedDictionary(cv.aruco.DICT_6X6_250);
      let parameters = new cv.aruco.DetectorParameters();
      let markerCorners = new cv.MatVector();
      let markerIds = new cv.Mat();

      try {
        cv.aruco.detectMarkers(srcMat, dictionary, markerCorners, markerIds, parameters);

        const detectedMarkers = { corners: [] as any[], ids: [] as any[] };
        if (markerIds.rows > 0) {
          setMarkersDetected(true);
          // Serialize marker data
          for (let i = 0; i < markerIds.rows; i++) {
            detectedMarkers.ids.push(markerIds.data32S[i]); // Assuming IDs are int32
            const cornerSet = [];
            const currentCorner = markerCorners.get(i); // cv.Mat
            for (let j = 0; j < currentCorner.rows; j++) { // Should be 1 row
                for (let k = 0; k < currentCorner.cols; k++) { // Should be 4 corners (x,y)
                    cornerSet.push({ x: currentCorner.data32F[j*currentCorner.cols*2 + k*2], y: currentCorner.data32F[j*currentCorner.cols*2 + k*2+1] });
                }
            }
            detectedMarkers.corners.push(cornerSet);
          }
          console.log('Markers detected:', detectedMarkers);
          navigate('/adjust', { state: { imageSrc, markers: detectedMarkers } });
        } else {
          setMarkersDetected(false);
          console.log('No markers detected.');
          // Navigate even if no markers are detected, Adjustment page can handle this
          navigate('/adjust', { state: { imageSrc, markers: null } });
        }
      } catch (e) {
        console.error('Error during marker detection:', e);
        setMarkersDetected(false);
        navigate('/adjust', { state: { imageSrc, markers: null } }); // Navigate with null markers on error
      } finally {
        srcMat.delete();
        markerCorners.delete();
        markerIds.delete();
        // Note: `parameters` does not have a delete method if it's a plain JS object
        setIsCapturing(false);
      }
    };
    img.onerror = () => {
      console.error('Failed to load image for OpenCV processing.');
      setIsCapturing(false);
    };
    img.src = imageSrc;

  }, [cv, navigate, webcamRef]);


  // UI update for marker detection status (can be improved)
  useEffect(() => {
    // This effect is just for real-time feedback if we were continuously scanning.
    // For now, it will mostly reflect the status after a capture attempt.
  }, [markersDetected]);

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
            disabled={isLoading || isCapturing} // Disable if OpenCV is loading or currently capturing
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