import React from 'react';
import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Typography,
} from '@mui/material';

const DeleteModal = ({ open }) => {
  return (
    <Dialog>
      <DialogTitle>Confirm Delete</DialogTitle>
      <DialogContent>
        <Typography>Are you sure you want to delete room ?</Typography>
      </DialogContent>
      <DialogActions>
        <Button>Cancel</Button>
        <Button color="error">Delete</Button>
      </DialogActions>
    </Dialog>
  );
};

export default DeleteModal;
