import { useState } from 'react';
import { Box, Button, Typography, Paper, Grid, IconButton, Menu, MenuItem } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import ShareIcon from '@mui/icons-material/Share';

interface ExportItem {
  id: string;
  name: string;
  date: string;
  format: string;
  thumbnail: string;
}

const PastExports = () => {
  const navigate = useNavigate();
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [selectedItem, setSelectedItem] = useState<ExportItem | null>(null);

  // Mock data - replace with actual data from your backend
  const exports: ExportItem[] = [
    {
      id: '1',
      name: 'Drawing 1',
      date: '2024-03-20',
      format: 'SVG',
      thumbnail: '',
    },
    {
      id: '2',
      name: 'Drawing 2',
      date: '2024-03-19',
      format: 'PDF',
      thumbnail: '',
    },
    // Add more mock items as needed
  ];

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>, item: ExportItem) => {
    setAnchorEl(event.currentTarget);
    setSelectedItem(item);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setSelectedItem(null);
  };

  const handleDelete = () => {
    // TODO: Implement delete functionality
    handleMenuClose();
  };

  const handleEdit = () => {
    // TODO: Implement edit functionality
    handleMenuClose();
  };

  const handleShare = () => {
    // TODO: Implement share functionality
    handleMenuClose();
  };

  return (
    <Box sx={{ height: '100vh', display: 'flex', flexDirection: 'column', bgcolor: 'grey.100' }}>
      {/* Header */}
      <Box sx={{ p: 2, display: 'flex', alignItems: 'center', gap: 2, bgcolor: 'white' }}>
        <Button
          startIcon={<ArrowBackIcon />}
          onClick={() => navigate('/')}
        >
          Back
        </Button>
        <Typography variant="h6" sx={{ flex: 1 }}>
          Past Exports
        </Typography>
      </Box>

      {/* Main Content */}
      <Box sx={{ flex: 1, p: 2, overflow: 'auto' }}>
        <Grid container spacing={2}>
          {exports.map((item) => (
            <Grid item xs={12} sm={6} md={4} lg={3} key={item.id}>
              <Paper
                elevation={3}
                sx={{
                  p: 2,
                  display: 'flex',
                  flexDirection: 'column',
                  height: '100%',
                }}
              >
                {/* Thumbnail */}
                <Box
                  sx={{
                    aspectRatio: '1',
                    bgcolor: 'grey.200',
                    mb: 2,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Typography color="text.secondary">Thumbnail</Typography>
                </Box>

                {/* Info */}
                <Box sx={{ flex: 1 }}>
                  <Typography variant="subtitle1" noWrap>
                    {item.name}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {item.date} • {item.format}
                  </Typography>
                </Box>

                {/* Actions */}
                <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 1 }}>
                  <IconButton
                    size="small"
                    onClick={(e) => handleMenuOpen(e, item)}
                  >
                    <MoreVertIcon />
                  </IconButton>
                </Box>
              </Paper>
            </Grid>
          ))}
        </Grid>
      </Box>

      {/* Context Menu */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
      >
        <MenuItem onClick={handleEdit}>
          <EditIcon fontSize="small" sx={{ mr: 1 }} />
          Rename
        </MenuItem>
        <MenuItem onClick={handleShare}>
          <ShareIcon fontSize="small" sx={{ mr: 1 }} />
          Share
        </MenuItem>
        <MenuItem onClick={handleDelete} sx={{ color: 'error.main' }}>
          <DeleteIcon fontSize="small" sx={{ mr: 1 }} />
          Delete
        </MenuItem>
      </Menu>
    </Box>
  );
};

export default PastExports; 