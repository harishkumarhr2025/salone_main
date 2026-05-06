import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  MenuItem,
  Grid,
  IconButton,
  InputAdornment,
  Chip,
  Divider,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import RemoveIcon from '@mui/icons-material/Remove';
import { DEFAULT_AMENITIES } from '../../components/Constant/defaultAmenities';

const AddRoomDialog = ({ open, onClose, onSave, selectedRoomToEdit }) => {
  const [roomData, setRoomData] = useState({
    roomNumber: '',
    roomType: '',
    capacity: 2,
    floor: 0,
    amenities: DEFAULT_AMENITIES,
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (selectedRoomToEdit) {
      setRoomData({
        roomNumber: selectedRoomToEdit.roomNumber,
        roomType: selectedRoomToEdit.roomType,
        capacity: selectedRoomToEdit.capacity,
        floor: selectedRoomToEdit.floor,
        amenities: selectedRoomToEdit.amenities?.length
          ? selectedRoomToEdit.amenities
          : DEFAULT_AMENITIES,
        _id: selectedRoomToEdit._id, // Include the room ID for updates
      });
    } else {
      // Reset form when opening for new room
      setRoomData({
        roomNumber: '',
        roomType: '',
        capacity: 2,
        floor: 0,
        amenities: DEFAULT_AMENITIES,
        _id: null,
      });
    }
  }, [selectedRoomToEdit, open]);

  const validateField = (name, value) => {
    let error = '';
    switch (name) {
      case 'roomNumber':
        if (!value.trim()) error = 'Room number is required';
        break;
      case 'roomType':
        if (!value) error = 'Room type is required';
        break;
      case 'capacity':
        if (value < 1) error = 'Minimum capacity is 1';
        break;
      case 'floor':
        if (value < 0) error = 'Invalid floor number';
        break;
      default:
        break;
    }
    return error;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setRoomData((prev) => ({
      ...prev,
      [name]: name === 'capacity' || name === 'floor' || name === 'rent' ? Number(value) : value,
    }));

    // Validate on change
    const error = validateField(name, value);
    setErrors((prev) => ({ ...prev, [name]: error }));
  };

  const handleAmenityChange = (index, field, value) => {
    const newAmenities = [...roomData.amenities];
    newAmenities[index][field] = value;
    setRoomData((prev) => ({ ...prev, amenities: newAmenities }));
  };

  const handleAddAmenity = () => {
    setRoomData((prev) => ({
      ...prev,
      amenities: [...prev.amenities, { name: '', description: '' }],
    }));
  };

  const handleRemoveAmenity = (index) => {
    const newAmenities = roomData.amenities.filter((_, i) => i !== index);
    setRoomData((prev) => ({ ...prev, amenities: newAmenities }));
  };

  const validateForm = () => {
    const newErrors = {};
    const fieldsToValidate = ['roomNumber', 'roomType', 'capacity', 'floor'];

    fieldsToValidate.forEach((field) => {
      const error = validateField(field, roomData[field]);
      if (error) newErrors[field] = error;
    });

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!validateForm()) return;
    setLoading(true);
    try {
      const formattedData = {
        ...roomData,
        amenities: roomData.amenities.filter((a) => a.name.trim() !== ''),
        ...(roomData._id && { _id: roomData._id }),
      };

      onSave(formattedData);
      onClose();
    } catch (error) {
      console.error('Error saving room:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="md">
      <DialogTitle>{selectedRoomToEdit ? 'Update Room' : 'Add New Room'}</DialogTitle>
      <form onSubmit={handleSubmit}>
        <DialogContent>
          <Grid container spacing={3}>
            {/* Room Number */}
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Room Number"
                name="roomNumber"
                value={roomData.roomNumber}
                onChange={handleChange}
                error={!!errors.roomNumber}
                helperText={errors.roomNumber}
              />
            </Grid>

            {/* Room Type */}
            <Grid item xs={12} md={6}>
              <TextField
                select
                fullWidth
                label="Room Type"
                name="roomType"
                value={roomData.roomType}
                onChange={handleChange}
                error={!!errors.roomType}
                helperText={errors.roomType}
              >
                {['AC', 'Non-AC'].map((option) => (
                  <MenuItem key={option} value={option}>
                    {option.charAt(0).toUpperCase() + option.slice(1)}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>

            {/* Capacity */}
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                type="number"
                label="Capacity"
                name="capacity"
                value={roomData.capacity}
                onChange={handleChange}
                error={!!errors.capacity}
                helperText={errors.capacity}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                type="number"
                label="Floor"
                name="floor"
                value={roomData.floor}
                onChange={handleChange}
                error={!!errors.floor}
                helperText={errors.floor}
              />
            </Grid>

            <Grid item xs={12}>
              <Divider sx={{ my: 2 }}>
                <Chip label="Standard Amenities" />
              </Divider>
              {roomData.amenities.map((amenity, index) => (
                <Grid container spacing={2} key={index} sx={{ mb: 2 }}>
                  <Grid item xs={5}>
                    <TextField
                      fullWidth
                      label="Amenity Name"
                      value={amenity.name || ''}
                      onChange={(e) => handleAmenityChange(index, 'name', e.target.value)}
                    />
                  </Grid>
                  <Grid item xs={6}>
                    <TextField
                      fullWidth
                      label="Description"
                      value={amenity.description || ''}
                      onChange={(e) => handleAmenityChange(index, 'description', e.target.value)}
                    />
                  </Grid>
                  <Grid item xs={1}>
                    <IconButton
                      onClick={() => handleRemoveAmenity(index)}
                      disabled={roomData.amenities.length === 1}
                    >
                      <RemoveIcon />
                    </IconButton>
                  </Grid>
                </Grid>
              ))}
              <Button
                variant="outlined"
                startIcon={<AddIcon />}
                onClick={handleAddAmenity}
                sx={{ mt: 1 }}
              >
                Add More Amenity
              </Button>
            </Grid>
          </Grid>
        </DialogContent>

        <DialogActions sx={{ p: 3 }}>
          <Button onClick={onClose} color="secondary">
            Cancel
          </Button>
          <Button type="submit" variant="contained" color="primary">
            {selectedRoomToEdit
              ? loading
                ? 'Updating Room...'
                : 'Update Room '
              : loading
              ? 'Saving Room...'
              : 'Save Room '}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
};

export default AddRoomDialog;
