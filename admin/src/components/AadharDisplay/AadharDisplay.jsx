import React from 'react';
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

const AadharDisplay = ({ guestData }) => {
  const theme = useTheme();
  const fullScreen = useMediaQuery(theme.breakpoints.down('sm'));
  const [open, setOpen] = React.useState(false);
  const [selectedImage, setSelectedImage] = React.useState('');

  // Extract image URLs from Guest_ID_Proof array
  const aadharFront =
    guestData?.Guest_ID_Proof?.[0]?.imageUrl || guestData?.aadharFront || '';
  const aadharBack =
    guestData?.Guest_ID_Proof?.[1]?.imageUrl || guestData?.aadharBack || '';
  const Guest_picture = guestData?.Guest_picture || '';

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
        {[aadharFront, aadharBack, Guest_picture].map((imageUrl, index) => (
          <Grid item xs={12} sm={6} key={index}>
            <Card sx={{ position: 'relative', height: '100%' }}>
              <CardMedia
                component="img"
                height="200"
                image={imageUrl}
                alt={index === 0 ? 'Front Side' : index === 1 ? 'Back Side' : 'Guest Picture'}
                sx={{
                  objectFit: 'contain',
                  backgroundColor: '#f5f5f5',
                  cursor: 'pointer',
                }}
                onClick={() => handleOpen(imageUrl)}
              />
              <CardContent sx={{ position: 'relative' }}>
                <Typography variant="subtitle1">
                  {index === 0 ? 'Front Side' : index === 1 ? 'Back Side' : 'Guest Picture'}
                </Typography>
                <IconButton
                  sx={{
                    position: 'absolute',
                    top: 8,
                    right: 8,
                    backgroundColor: 'rgba(255, 255, 255, 0.8)',
                  }}
                  onClick={() => handleOpen(imageUrl)}
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
            alt="Aadhar Preview"
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

export default AadharDisplay;
