import { useState, useEffect, useRef } from 'react';
import { Box, Button, Typography, Paper, TextField, CircularProgress, Tooltip, IconButton } from '@mui/material';
import { useNavigate, useLocation } from 'react-router-dom';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import DownloadIcon from '@mui/icons-material/Download';

const Export = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const [svgToExport, setSvgToExport] = useState<string | null>(null);
  const [widthMm, setWidthMm] = useState<number | undefined>(undefined);
  const [heightMm, setHeightMm] = useState<number | undefined>(undefined);
  const [fileName, setFileName] = useState<string>('trace_export');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    setIsLoading(true);
    if (location.state) {
      const {
        svgString: newSvgString,
        finalWidthMm, // Renamed from Trace/Preview page
        finalHeightMm, // Renamed from Trace/Preview page
      } = location.state as { svgString?: string; finalWidthMm?: number; finalHeightMm?: number };

      if (newSvgString) {
        setSvgToExport(newSvgString);
        setWidthMm(finalWidthMm);
        setHeightMm(finalHeightMm);
        setError(null);
      } else {
        setError("SVG data not found. Please go back to the preview page and try again.");
        console.error("SVG string not found in location state:", location.state);
      }
    } else {
      setError("No data received. Please generate an SVG from the preview page first.");
      console.error("Location state is null or undefined.");
    }
    setIsLoading(false);
  }, [location.state]);

  const handleFileNameChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setFileName(event.target.value);
  };

  const handleDownload = () => {
    if (!svgToExport || !fileName.trim()) {
      setError("SVG content is missing or filename is empty.");
      return;
    }

    const blob = new Blob([svgToExport], { type: 'image/svg+xml' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${fileName.trim()}.svg`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };
  
  const handleBackToPreview = () => {
    // Navigate back, passing the current SVG data in case user wants to re-preview
    navigate('/preview', { 
        state: { 
            svgString: svgToExport, 
            finalWidthMm: widthMm, 
            finalHeightMm: heightMm 
        } 
    });
  };


  return (
    <Box sx={{ height: '100vh', display: 'flex', flexDirection: 'column', bgcolor: 'grey.100' }}>
      {/* Header */}
      <Box sx={{ p: 2, display: 'flex', alignItems: 'center', gap: 2, bgcolor: 'white', boxShadow: 1 }}>
        <Button
          startIcon={<ArrowBackIcon />}
          onClick={handleBackToPreview}
        >
          Back to Preview
        </Button>
        <Typography variant="h6" sx={{ flex: 1 }}>
          Export SVG
        </Typography>
      </Box>

      {/* Main Content */}
      <Box sx={{ flex: 1, display: 'flex', justifyContent: 'center', alignItems: 'flex-start', p: 2 }}>
        <Paper
          elevation={3}
          sx={{
            p: 3,
            width: '100%',
            maxWidth: 600,
            display: 'flex',
            flexDirection: 'column',
            gap: 3,
          }}
        >
          {isLoading && (
            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', my: 4 }}>
              <CircularProgress />
              <Typography sx={{ mt: 2 }}>Loading export page...</Typography>
            </Box>
          )}

          {error && !isLoading && (
            <Box sx={{ textAlign: 'center', my: 4 }}>
              <Typography color="error" variant="h6">Export Error</Typography>
              <Typography color="error" sx={{ my: 2 }}>{error}</Typography>
              <Button variant="outlined" startIcon={<ArrowBackIcon />} onClick={handleBackToPreview}>
                Go Back to Preview
              </Button>
            </Box>
          )}

          {!isLoading && !error && svgToExport && (
            <>
              <Typography variant="h5" component="h2" gutterBottom>
                Download Your SVG
              </Typography>

              {(widthMm !== undefined || heightMm !== undefined) && (
                <Box sx={{border: '1px solid #e0e0e0', p:1.5, borderRadius: 1, background: 'grey.50'}}>
                    <Typography variant="subtitle1" gutterBottom>Approximate Dimensions:</Typography>
                    {widthMm !== undefined && <Typography variant="body2">Width: {widthMm.toFixed(1)} mm</Typography>}
                    {heightMm !== undefined && <Typography variant="body2">Height: {heightMm.toFixed(1)} mm</Typography>}
                    {(widthMm === undefined && heightMm === undefined) && <Typography variant="caption" color="text.secondary">Physical dimensions not available.</Typography>}
                </Box>
              )}

              <TextField
                label="Filename"
                variant="outlined"
                value={fileName}
                onChange={handleFileNameChange}
                fullWidth
                helperText="Enter the desired filename (without .svg extension)."
                InputProps={{
                  endAdornment: <Typography sx={{color: 'text.secondary'}}>.svg</Typography>,
                }}
              />
              
              <Button
                variant="contained"
                startIcon={<DownloadIcon />}
                fullWidth
                onClick={handleDownload}
                disabled={!svgToExport || !fileName.trim()}
                size="large"
                sx={{ py: 1.5 }}
              >
                Download SVG
              </Button>

              <Typography variant="subtitle2" sx={{ mt: 2, mb:1 }}>SVG Preview:</Typography>
              <Box
                sx={{
                  border: '1px solid #ccc',
                  borderRadius: 1,
                  p: 1,
                  maxHeight: 300,
                  overflow: 'auto',
                  background: `
                    linear-gradient(45deg, #eee 25%, transparent 25%), 
                    linear-gradient(-45deg, #eee 25%, transparent 25%),
                    linear-gradient(45deg, transparent 75%, #eee 75%),
                    linear-gradient(-45deg, transparent 75%, #eee 75%)`,
                  backgroundSize: '20px 20px',
                  backgroundColor: 'white'
                }}
              >
                <Box
                  dangerouslySetInnerHTML={{ __html: svgToExport }}
                  sx={{
                    '& svg': {
                      maxWidth: '100%',
                      maxHeight: '280px', // Limit height within the preview box
                      display: 'block',
                      margin: 'auto',
                    },
                  }}
                />
              </Box>
            </>
          )}
           {!isLoading && !error && !svgToExport && (
             <Typography color="text.secondary" sx={{textAlign: 'center', my: 4}}>
                No SVG data available to export. Please go back to generate an SVG.
             </Typography>
          )}
        </Paper>
      </Box>
    </Box>
  );
};

export default Export;
