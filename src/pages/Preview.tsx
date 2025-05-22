import { useState, useEffect } from 'react';
import { Box, Button, Typography, Paper, IconButton, Tooltip, CircularProgress } from '@mui/material';
import { useNavigate, useLocation } from 'react-router-dom';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import EditIcon from '@mui/icons-material/Edit';
import DownloadIcon from '@mui/icons-material/Download';
import ShareIcon from '@mui/icons-material/Share'; 

const Preview = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const [svgString, setSvgString] = useState<string | null>(null);
  const [finalWidthMm, setFinalWidthMm] = useState<number | undefined>(undefined);
  const [finalHeightMm, setFinalHeightMm] = useState<number | undefined>(undefined);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true); 

  const [isEditing, setIsEditing] = useState(false); 

  useEffect(() => {
    setIsLoading(true);
    if (location.state) {
      const { 
        svgString: newSvgString, 
        finalWidthMm: newFinalWidthMm, 
        finalHeightMm: newFinalHeightMm 
      } = location.state as { svgString?: string; finalWidthMm?: number; finalHeightMm?: number };

      if (newSvgString) {
        setSvgString(newSvgString);
        setFinalWidthMm(newFinalWidthMm);
        setFinalHeightMm(newFinalHeightMm);
        setError(null);
      } else {
        setError("SVG data not found. Please go back to the trace page and try again.");
        console.error("SVG string not found in location state:", location.state);
      }
    } else {
      setError("No data received. Please generate an SVG from the trace page first.");
      console.error("Location state is null or undefined.");
    }
    setIsLoading(false);
  }, [location.state]);

  const handleExport = () => {
    if (svgString) {
      navigate('/export', { 
        state: { 
          svgString, 
          finalWidthMm,  
          finalHeightMm 
        } 
      });
    } else {
      setError("Cannot export: SVG data is missing.");
    }
  };

  return (
    <Box sx={{ height: '100vh', display: 'flex', flexDirection: 'column', bgcolor: 'grey.100' }}>
      {/* Header */}
      <Box sx={{ p: 2, display: 'flex', alignItems: 'center', gap: 2, bgcolor: 'white', boxShadow: 1 }}>
        <Button
          startIcon={<ArrowBackIcon />}
          onClick={() => navigate('/trace')} 
        >
          Back to Trace
        </Button>
        <Typography variant="h6" sx={{ flex: 1 }}>
          Vector Preview
        </Typography>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Tooltip title={isEditing ? 'Exit Edit Mode (Not Implemented)' : 'Edit Vector (Not Implemented)'}>
            <span> 
            <IconButton
              color={isEditing ? 'primary' : 'default'}
              onClick={() => setIsEditing(!isEditing)}
              disabled 
            >
              <EditIcon />
            </IconButton>
            </span>
          </Tooltip>
        </Box>
      </Box>

      {/* Main Content */}
      <Box sx={{ flex: 1, display: 'flex', gap: 2, p: 2, overflow: 'hidden' }}>
        {/* Vector Preview Area */}
        <Paper
          elevation={3}
          sx={{
            flex: 1,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            bgcolor: 'white', 
            position: 'relative',
            overflow: 'auto', 
            minHeight: 300,
          }}
        >
          {isLoading && (
            <Box sx={{ textAlign: 'center' }}>
              <CircularProgress />
              <Typography sx={{ mt: 1 }}>Loading Preview...</Typography>
            </Box>
          )}
          {error && !isLoading && (
            <Box sx={{ textAlign: 'center', p: 3 }}>
              <Typography color="error" variant="h6">Preview Error</Typography>
              <Typography color="error" sx={{ my: 2 }}>{error}</Typography>
              <Button variant="outlined" startIcon={<ArrowBackIcon />} onClick={() => navigate('/trace')}>
                Go Back to Trace
              </Button>
            </Box>
          )}
          {!isLoading && !error && svgString && (
            <Box
              dangerouslySetInnerHTML={{ __html: svgString }}
              sx={{
                width: 'calc(100% - 32px)', 
                height: 'calc(100% - 32px)', 
                p: 2, 
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                '& svg': {
                  maxWidth: '100%',
                  maxHeight: '100%',
                  width: 'auto', 
                  height: 'auto',
                  objectFit: 'contain',
                  border: '1px dashed #ccc', 
                  background: `
                    linear-gradient(45deg, #eee 25%, transparent 25%), 
                    linear-gradient(-45deg, #eee 25%, transparent 25%),
                    linear-gradient(45deg, transparent 75%, #eee 75%),
                    linear-gradient(-45deg, transparent 75%, #eee 75%)`,
                  backgroundSize: '20px 20px',
                  backgroundColor: 'white' 
                },
              }}
            />
          )}
          {!isLoading && !error && !svgString && (
             <Typography color="text.secondary">No SVG data to display. Please go back and trace an image.</Typography>
          )}
        </Paper>

        {/* Controls Panel */}
        <Paper
          elevation={3}
          sx={{
            width: 300,
            p: 2,
            display: 'flex',
            flexDirection: 'column',
            gap: 2,
          }}
        >
          <Typography variant="h6">Actions</Typography>

          {(finalWidthMm !== undefined || finalHeightMm !== undefined) && ( // Check if either is defined
            <Box sx={{border: '1px solid #e0e0e0', p:1, borderRadius: 1, background: 'grey.50'}}>
                <Typography variant="subtitle2" gutterBottom>Approx. Dimensions (mm):</Typography>
                 {finalWidthMm !== undefined && <Typography variant="body2">Width: {finalWidthMm.toFixed(1)} mm</Typography>}
                 {finalHeightMm !== undefined && <Typography variant="body2">Height: {finalHeightMm.toFixed(1)} mm</Typography>}
                 {(finalWidthMm === undefined && finalHeightMm === undefined) && <Typography variant="caption" color="text.secondary">Dimensions not provided in mm.</Typography>}
            </Box>
          )}

          <Button
            variant="contained"
            startIcon={<DownloadIcon />}
            fullWidth
            onClick={handleExport}
            disabled={!svgString || !!error || isLoading}
          >
            Export Vector
          </Button>

          <Button
            variant="outlined"
            startIcon={<ShareIcon />}
            fullWidth
            disabled 
          >
            Share (Not Implemented)
          </Button>

          {isEditing && (
            <Box sx={{ flex: 1, mt: 2, borderTop: '1px solid #eee', pt:2 }}>
              <Typography variant="subtitle2" gutterBottom>
                Edit Tools
              </Typography>
              <Typography color="text.secondary" variant="caption">Vector editing tools will appear here (Not Implemented).</Typography>
            </Box>
          )}
        </Paper>
      </Box>
    </Box>
  );
};

export default Preview;
