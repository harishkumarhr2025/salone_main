import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  IconButton,
  useTheme,
  Fade,
  Slide,
  useMediaQuery,
} from '@mui/material';
import { Delete, Close, Info, PersonOff } from '@mui/icons-material';

const DeleteConfirmationDialog = ({ open, onClose, customer, onConfirm }) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  console.log('Employee Customer:', customer);

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      TransitionComponent={Slide}
      TransitionProps={{ direction: 'down' }}
      PaperProps={{
        sx: {
          borderRadius: 4,
          boxShadow: theme.shadows[10],
          overflow: 'visible',
          bgcolor: theme.palette.background.default,
        },
      }}
    >
      <DialogTitle
        sx={{
          background: `linear-gradient(45deg, ${theme.palette.primary.dark} 0%, ${theme.palette.primary.main} 100%)`,
          color: theme.palette.common.white,
          display: 'flex',
          alignItems: 'center',
          py: 2,
          pr: 3,
        }}
      >
        <Info sx={{ mr: 1, fontSize: 28 }} />
        <Typography variant="h6" fontWeight={700}>
          Confirm Deletion
        </Typography>
        <IconButton
          onClick={onClose}
          sx={{
            ml: 'auto',
            color: 'inherit',
            '&:hover': {
              transform: 'rotate(90deg)',
              transition: '0.3s ease-in-out',
            },
          }}
        >
          <Close />
        </IconButton>
      </DialogTitle>

      <DialogContent sx={{ pt: 6, pb: 4, px: 4 }}>
        <Fade in={open} timeout={400}>
          <Box textAlign="center">
            <Box
              sx={{
                mx: 'auto',
                mb: 3,
                width: 80,
                height: 80,
                borderRadius: '50%',
                backgroundColor: theme.palette.grey[100],
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: theme.shadows[3],
              }}
            >
              <PersonOff sx={{ fontSize: 40, color: theme.palette.primary.main }} />
            </Box>

            <Typography variant="h6" fontWeight={600}>
              Are you sure you want to delete this record?
            </Typography>
          </Box>
        </Fade>
      </DialogContent>

      <DialogActions
        sx={{
          px: 4,
          pb: 4,
          gap: 2,
          flexDirection: isMobile ? 'column' : 'row',
          justifyContent: 'center',
        }}
      >
        <Button
          variant="outlined"
          onClick={onClose}
          size="large"
          sx={{
            borderRadius: 2,
            minWidth: 140,
            fontWeight: 600,
          }}
        >
          Cancel
        </Button>
        <Button
          variant="contained"
          startIcon={<Delete />}
          onClick={onConfirm}
          size="large"
          color="primary"
          sx={{
            borderRadius: 2,
            minWidth: 160,
            fontWeight: 600,
            background: `linear-gradient(45deg, ${theme.palette.primary.main}, ${theme.palette.primary.dark})`,
            boxShadow: theme.shadows[4],
            '&:hover': {
              background: `linear-gradient(45deg, ${theme.palette.primary.dark}, ${theme.palette.primary.main})`,
            },
          }}
        >
          Confirm Delete
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default DeleteConfirmationDialog;
