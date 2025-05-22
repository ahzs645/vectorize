import { useState } from 'react';
import { Box, Button, Typography, Paper, Radio, RadioGroup, FormControlLabel, FormControl, FormLabel } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import DownloadIcon from '@mui/icons-material/Download';
import ShareIcon from '@mui/icons-material/Share';
import LinkIcon from '@mui/icons-material/Link';

const Export = () => {
  const navigate = useNavigate();
  const [format, setFormat] = useState('svg');

  const handleFormatChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setFormat(event.target.value);
  };

  return (
    <Box sx={{ height: '100vh', display: 'flex', flexDirection: 'column', bgcolor: 'grey.100' }}>
      {/* Header */}
      <Box sx={{ p: 2, display: 'flex', alignItems: 'center', gap: 2, bgcolor: 'white' }}>
        <Button
          startIcon={<ArrowBackIcon />}
          onClick={() => navigate('/preview')}
        >
          Back
        </Button>
        <Typography variant="h6" sx={{ flex: 1 }}>
          Export Vector
        </Typography>
      </Box>

      {/* Main Content */}
      <Box sx={{ flex: 1, display: 'flex', gap: 2, p: 2, overflow: 'hidden' }}>
        {/* Export Options */}
        <Paper
          elevation={3}
          sx={{
            flex: 1,
            p: 3,
            display: 'flex',
            flexDirection: 'column',
            gap: 3,
          }}
        >
          <FormControl component="fieldset">
            <FormLabel component="legend">Export Format</FormLabel>
            <RadioGroup
              value={format}
              onChange={handleFormatChange}
            >
              <FormControlLabel value="svg" control={<Radio />} label="SVG" />
              <FormControlLabel value="pdf" control={<Radio />} label="PDF" />
              <FormControlLabel value="png" control={<Radio />} label="PNG" />
            </RadioGroup>
          </FormControl>

          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <Button
              variant="contained"
              startIcon={<DownloadIcon />}
              fullWidth
            >
              Download {format.toUpperCase()}
            </Button>

            <Button
              variant="outlined"
              startIcon={<ShareIcon />}
              fullWidth
            >
              Share via Email
            </Button>

            <Button
              variant="outlined"
              startIcon={<LinkIcon />}
              fullWidth
            >
              Copy Share Link
            </Button>
          </Box>
        </Paper>

        {/* Preview */}
        <Paper
          elevation={3}
          sx={{
            width: 400,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            bgcolor: 'white',
          }}
        >
          <Typography color="text.secondary">Preview</Typography>
        </Paper>
      </Box>
    </Box>
  );
};

export default Export; 