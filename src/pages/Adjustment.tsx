import { useState } from 'react';
import { Box, Button, Typography, Slider, Switch, FormControlLabel, Paper } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';

const Adjustment = () => {
  const navigate = useNavigate();
  const [showOriginal, setShowOriginal] = useState(true);
  const [threshold, setThreshold] = useState(128);
  const [perspectiveCorrection, setPerspectiveCorrection] = useState(true);

  const handleThresholdChange = (_event: Event, newValue: number | number[]) => {
    setThreshold(newValue as number);
  };

  return (
    <Box sx={{ height: '100vh', display: 'flex', flexDirection: 'column', bgcolor: 'grey.100' }}>
      {/* Header */}
      <Box sx={{ p: 2, display: 'flex', alignItems: 'center', gap: 2 }}>
        <Button
          startIcon={<ArrowBackIcon />}
          onClick={() => navigate('/capture')}
        >
          Back
        </Button>
        <Typography variant="h6" sx={{ flex: 1 }}>
          Image Adjustment
        </Typography>
      </Box>

      {/* Image Preview Area */}
      <Box sx={{ flex: 1, display: 'flex', gap: 2, p: 2, overflow: 'hidden' }}>
        {/* Original Image */}
        {showOriginal && (
          <Paper
            elevation={3}
            sx={{
              flex: 1,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              bgcolor: 'white',
            }}
          >
            <Typography color="text.secondary">Original Image</Typography>
          </Paper>
        )}

        {/* Processed Image */}
        <Paper
          elevation={3}
          sx={{
            flex: 1,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            bgcolor: 'white',
          }}
        >
          <Typography color="text.secondary">Processed Image</Typography>
        </Paper>
      </Box>

      {/* Controls */}
      <Box sx={{ p: 2, bgcolor: 'white' }}>
        <Box sx={{ mb: 2 }}>
          <Typography gutterBottom>Threshold</Typography>
          <Slider
            value={threshold}
            onChange={handleThresholdChange}
            min={0}
            max={255}
            valueLabelDisplay="auto"
          />
        </Box>

        <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
          <FormControlLabel
            control={
              <Switch
                checked={showOriginal}
                onChange={(e) => setShowOriginal(e.target.checked)}
              />
            }
            label="Show Original"
          />
          <FormControlLabel
            control={
              <Switch
                checked={perspectiveCorrection}
                onChange={(e) => setPerspectiveCorrection(e.target.checked)}
              />
            }
            label="Perspective Correction"
          />
        </Box>

        <Button
          variant="contained"
          fullWidth
          endIcon={<ArrowForwardIcon />}
          onClick={() => navigate('/trace')}
        >
          Use This Image
        </Button>
      </Box>
    </Box>
  );
};

export default Adjustment; 