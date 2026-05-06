import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Grid,
  TextField,
  MenuItem,
  Button,
  FormControl,
  InputLabel,
  Select,
  Box,
  CircularProgress,
  Typography,
} from '@mui/material';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import DescriptionIcon from '@mui/icons-material/Description';
import ReportVisualization from '../ReportVisualization/ReportVisualization';

const ReportModal = ({ open, onClose, onGenerate, reportData, isGenerating }) => {
  const [filters, setFilters] = useState({
    fromDate: null,
    toDate: null,
    guestType: 'All',
    roomType: 'All',
  });

  const [errors, setErrors] = useState({
    fromDate: false,
    toDate: false,
  });

  // Reset filters when modal closes
  useEffect(() => {
    if (!open) {
      setFilters({
        fromDate: null,
        toDate: null,
        guestType: 'All',
        roomType: 'All',
      });
    }
  }, [open]);

  const filterOptions = {
    guestTypes: ['All', 'Monthly', 'Daily'],
    roomTypes: ['All', 'AC', 'Non-AC'],
  };

  const validateFields = () => {
    const newErrors = {
      fromDate: !filters.fromDate,
      toDate: !filters.toDate,
    };
    setErrors(newErrors);
    return !Object.values(newErrors).some(Boolean);
  };

  const handleGenerate = () => {
    if (!validateFields()) return;

    const formattedFilters = {
      ...filters,
      fromDate: filters.fromDate.toISOString(),
      toDate: filters.toDate.toISOString(),
    };
    onGenerate(formattedFilters);
  };

  const getModalContent = () => {
    if (reportData) {
      return <ReportVisualization report={reportData} />;
    }

    if (isGenerating) {
      return (
        <Box sx={{ p: 3, textAlign: 'center' }}>
          <CircularProgress />
          <Typography>Generating Report...</Typography>
        </Box>
      );
    }

    return (
      <Grid container spacing={3} sx={{ pt: 2 }}>
        <Grid item xs={12} md={6}>
          <LocalizationProvider dateAdapter={AdapterDayjs}>
            <DatePicker
              label="From Date *"
              inputFormat="DD/MM/YYYY"
              value={filters.fromDate}
              onChange={(newValue) => setFilters((prev) => ({ ...prev, fromDate: newValue }))}
              renderInput={(params) => (
                <TextField
                  {...params}
                  fullWidth
                  error={errors.fromDate}
                  helperText={errors.fromDate && 'Required field'}
                />
              )}
            />
          </LocalizationProvider>
        </Grid>

        <Grid item xs={12} md={6}>
          <LocalizationProvider dateAdapter={AdapterDayjs}>
            <DatePicker
              label="To Date *"
              value={filters.toDate}
              inputFormat="DD/MM/YYYY"
              onChange={(newValue) => setFilters((prev) => ({ ...prev, toDate: newValue }))}
              minDate={filters.fromDate}
              renderInput={(params) => (
                <TextField
                  {...params}
                  fullWidth
                  error={errors.toDate}
                  helperText={errors.toDate && 'Required field'}
                />
              )}
            />
          </LocalizationProvider>
        </Grid>

        <Grid item xs={12} md={6}>
          <FormControl fullWidth>
            <InputLabel>Guest Type</InputLabel>
            <Select
              value={filters.guestType}
              label="Guest Type"
              onChange={(e) => setFilters((prev) => ({ ...prev, guestType: e.target.value }))}
            >
              {filterOptions.guestTypes.map((type) => (
                <MenuItem key={type} value={type}>
                  {type}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Grid>

        <Grid item xs={12} md={6}>
          <FormControl fullWidth>
            <InputLabel>Room Type</InputLabel>
            <Select
              value={filters.roomType}
              label="Room Type"
              onChange={(e) => setFilters((prev) => ({ ...prev, roomType: e.target.value }))}
            >
              {filterOptions.roomTypes.map((type) => (
                <MenuItem key={type} value={type}>
                  {type}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Grid>
      </Grid>
    );
  };

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth={reportData ? 'lg' : 'sm'}>
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <DescriptionIcon fontSize="large" />
        {reportData ? 'Report Preview' : 'Generate Report'}
      </DialogTitle>

      <DialogContent dividers>
        <Box sx={{ position: 'relative' }}>{getModalContent()}</Box>
      </DialogContent>

      <DialogActions>
        {reportData ? (
          <>
            <Button onClick={onClose} variant="contained">
              Close
            </Button>
          </>
        ) : (
          <>
            <Button onClick={onClose}>Cancel</Button>
            <Button
              variant="contained"
              onClick={handleGenerate}
              disabled={isGenerating || !filters.fromDate || !filters.toDate}
            >
              {isGenerating ? 'Generating...' : 'Generate'}
            </Button>
          </>
        )}
      </DialogActions>
    </Dialog>
  );
};

export default ReportModal;
