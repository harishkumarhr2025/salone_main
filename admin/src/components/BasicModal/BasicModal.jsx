import React, { useState } from 'react';
import Backdrop from '@mui/material/Backdrop';
import Box from '@mui/material/Box';
import Modal from '@mui/material/Modal';
import Fade from '@mui/material/Fade';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';

const BasicModal = ({ open, handleClose, handleProductDelete, opacityValue, couponId = '' }) => {
  return (
    <Modal
      aria-labelledby="transition-modal-title"
      aria-describedby="transition-modal-description"
      open={open}
      onClose={handleClose}
      keepMounted
      closeAfterTransition
      slots={{ backdrop: Backdrop }}
      slotProps={{
        backdrop: {
          style: { backgroundColor: `rgba(0, 0, 0, ${opacityValue})` },
          timeout: 400,
        },
      }}
    >
      <Fade in={open}>
        <Box
          sx={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            width: 400,
            bgcolor: 'white',
            boxShadow: 4,
            p: 4,
          }}
        >
          <Typography id="transition-modal-title" variant="h6" align="center" component="h2">
            Are you sure?
          </Typography>
          <Typography id="transition-modal-description" sx={{ mt: 2 }}></Typography>
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-around',
            }}
          >
            <Button
              onClick={handleClose}
              variant="contained"
              style={{ background: 'rgba(0, 0, 0, 0.5)' }}
            >
              Close
            </Button>
            <Button variant="contained" onClick={handleProductDelete}>
              Delete
            </Button>
          </div>
        </Box>
      </Fade>
    </Modal>
  );
};

export default BasicModal;
