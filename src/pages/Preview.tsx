import { useState } from 'react';
import { Box, Button, Typography, Paper, IconButton, Tooltip } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import EditIcon from '@mui/icons-material/Edit';
import DownloadIcon from '@mui/icons-material/Download';
import ShareIcon from '@mui/icons-material/Share';

const Preview = () => {
  const navigate = useNavigate();
  const [isEditing, setIsEditing] = useState(false);

  return (
    <Box sx={{ height: '100vh', display: 'flex', flexDirection: 'column', bgcolor: 'grey.100' }}>
      {/* Header */}
      <Box sx={{ p: 2, display: 'flex', alignItems: 'center', gap: 2, bgcolor: 'white' }}>
        <Button
          startIcon={<ArrowBackIcon />}
          onClick={() => navigate('/trace')}
        >
          Back
        </Button>
        <Typography variant="h6" sx={{ flex: 1 }}>
          Vector Preview
        </Typography>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Tooltip title={isEditing ? 'Exit Edit Mode' : 'Edit Vector'}>
            <IconButton
              color={isEditing ? 'primary' : 'default'}
              onClick={() => setIsEditing(!isEditing)}
            >
              <EditIcon />
            </IconButton>
          </Tooltip>
        </Box>
      </Box>

      {/* Main Content */}
      <Box sx={{ flex: 1, display: 'flex', gap: 2, p: 2, overflow: 'hidden' }}>
        {/* Vector Preview */}
        <Paper
          elevation={3}
          sx={{
            flex: 1,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            bgcolor: 'white',
            position: 'relative',
          }}
        >
          <Typography color="text.secondary">Vector Preview</Typography>
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
          <Typography variant="h6">Export Options</Typography>

          <Button
            variant="outlined"
            startIcon={<DownloadIcon />}
            fullWidth
            onClick={() => navigate('/export')}
          >
            Export Vector
          </Button>

          <Button
            variant="outlined"
            startIcon={<ShareIcon />}
            fullWidth
          >
            Share
          </Button>

          {isEditing && (
            <Box sx={{ flex: 1 }}>
              <Typography variant="subtitle2" gutterBottom>
                Edit Tools
              </Typography>
              {/* Add vector editing tools here */}
            </Box>
          )}
        </Paper>
      </Box>
    </Box>
  );
};

export default Preview; 