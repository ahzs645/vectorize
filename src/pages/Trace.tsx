import { useState } from 'react';
import { Box, Button, Typography, Paper, IconButton, Tooltip } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import AutoFixHighIcon from '@mui/icons-material/AutoFixHigh';
import UndoIcon from '@mui/icons-material/Undo';
import RedoIcon from '@mui/icons-material/Redo';
import PreviewIcon from '@mui/icons-material/Preview';

const Trace = () => {
  const navigate = useNavigate();
  const [canUndo, setCanUndo] = useState(false);
  const [canRedo, setCanRedo] = useState(false);

  return (
    <Box sx={{ height: '100vh', display: 'flex', flexDirection: 'column', bgcolor: 'grey.100' }}>
      {/* Header */}
      <Box sx={{ p: 2, display: 'flex', alignItems: 'center', gap: 2, bgcolor: 'white' }}>
        <Button
          startIcon={<ArrowBackIcon />}
          onClick={() => navigate('/adjust')}
        >
          Back
        </Button>
        <Typography variant="h6" sx={{ flex: 1 }}>
          Trace Conversion
        </Typography>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Tooltip title="Undo">
            <span>
              <IconButton disabled={!canUndo}>
                <UndoIcon />
              </IconButton>
            </span>
          </Tooltip>
          <Tooltip title="Redo">
            <span>
              <IconButton disabled={!canRedo}>
                <RedoIcon />
              </IconButton>
            </span>
          </Tooltip>
        </Box>
      </Box>

      {/* Main Content */}
      <Box sx={{ flex: 1, display: 'flex', gap: 2, p: 2, overflow: 'hidden' }}>
        {/* Image with Overlay */}
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
          <Typography color="text.secondary">Image with Tracing Overlay</Typography>
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
          <Typography variant="h6">Controls</Typography>
          
          <Button
            variant="outlined"
            startIcon={<AutoFixHighIcon />}
            fullWidth
          >
            Auto-Detect Lines
          </Button>

          <Box sx={{ flex: 1 }}>
            <Typography variant="subtitle2" gutterBottom>
              Line Detection Settings
            </Typography>
            {/* Add line detection controls here */}
          </Box>

          <Button
            variant="contained"
            startIcon={<PreviewIcon />}
            fullWidth
            onClick={() => navigate('/preview')}
          >
            Preview Vector
          </Button>
        </Paper>
      </Box>
    </Box>
  );
};

export default Trace; 