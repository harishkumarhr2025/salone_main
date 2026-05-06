import React, { useState } from 'react';
import {
  Grid,
  Card,
  CardMedia,
  CardContent,
  Typography,
  Box,
  IconButton,
  Dialog,
  DialogContent,
  DialogActions,
  Button,
  useMediaQuery,
  useTheme,
} from '@mui/material';
import ZoomOutMapIcon from '@mui/icons-material/ZoomOutMap';
import CloseIcon from '@mui/icons-material/Close';

const EMSAadharDisplay = ({ documents }) => {
  const theme = useTheme();
  const fullScreen = useMediaQuery(theme.breakpoints.down('sm'));
  const [open, setOpen] = useState(false);
  const [selectedImage, setSelectedImage] = useState('');

  const handleOpen = (imageUrl) => {
    setSelectedImage(imageUrl);
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
    setSelectedImage('');
  };

  return (
    <Box sx={{ mt: 4 }}>
      <Grid container spacing={3}>
        {['aadharFront', 'aadharBack', 'profilePicture'].map((key) => (
          <Grid item xs={12} sm={6} md={4} key={key}>
            <Card sx={{ position: 'relative', height: '100%' }}>
              <CardMedia
                component="img"
                height="200"
                image={documents[key]}
                alt={key}
                sx={{
                  objectFit: 'contain',
                  backgroundColor: '#f5f5f5',
                  cursor: 'pointer',
                }}
                onClick={() => handleOpen(documents[key])}
              />
              <CardContent sx={{ position: 'relative' }}>
                <Typography variant="subtitle1" sx={{ textTransform: 'capitalize' }}>
                  {key.replace(/([A-Z])/g, ' $1')}
                </Typography>
                <IconButton
                  sx={{
                    position: 'absolute',
                    top: 8,
                    right: 8,
                    backgroundColor: 'rgba(255, 255, 255, 0.8)',
                  }}
                  onClick={() => handleOpen(documents[key])}
                >
                  <ZoomOutMapIcon fontSize="small" />
                </IconButton>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>
      {/* Fullscreen Dialog */}
      <Dialog fullScreen={fullScreen} open={open} onClose={handleClose} maxWidth="md">
        <DialogContent sx={{ textAlign: 'center', p: 2 }}>
          <img
            src={selectedImage}
            alt="Document Preview"
            style={{
              maxWidth: '100%',
              maxHeight: '80vh',
              objectFit: 'contain',
            }}
          />
        </DialogContent>
        <DialogActions>
          <Button startIcon={<CloseIcon />} onClick={handleClose} color="primary" sx={{ m: 1 }}>
            Close
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default EMSAadharDisplay;
