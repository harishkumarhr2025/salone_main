import React, { useEffect, useState, useRef } from 'react';
import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  Grid,
  InputLabel,
  MenuItem,
  Select,
  TextField,
  CircularProgress,
} from '@mui/material';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import SalonReportVisualization from './SalonReportVisualization';
import { useDispatch, useSelector } from 'react-redux';
import { generateSalonReport, resetSalonReport } from '../../redux/features/ReportSlice';
import Unauthorized from '../Unauthorized/Unauthorized';
import { useReactToPrint } from 'react-to-print';
import PrintIcon from '@mui/icons-material/Print';

const SalonReport = ({ open, setReportModalOpen }) => {
  const [fromDate, setFromDate] = useState(null);
  const [toDate, setToDate] = useState(null);
  const [selectedStaff, setSelectedStaff] = useState('all');
  const [reportData, setReportData] = useState(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const printRef = useRef(null);

  const dispatch = useDispatch();
  const { isLoading, data, error, filters } = useSelector((state) => state.Report.salonReport);
  const { success, employee, message } = useSelector((state) => state.Employee.employees);
  const { isAuthenticated, user } = useSelector((state) => state.Auth);

  // React-to-print hook
  const handlePrint = useReactToPrint({
    contentRef: printRef,
    documentTitle: `Salon Report - ${fromDate?.format?.('DD/MM/YYYY') || 'Report'} to ${toDate?.format?.('DD/MM/YYYY') || 'Report'}`,
  });

  console.log('salonReport:', data);
  console.log('employee:', employee);

  // Dummy staff options - replace with your actual data
  const staffOptions = [
    { id: 'all', name: 'All Staff' },
    { id: '1', name: 'John Doe' },
    { id: '2', name: 'Jane Smith' },
    { id: '3', name: 'Mike Johnson' },
  ];

  useEffect(() => {
    if (open && filters) {
      setFromDate(filters.fromDate ? new Date(filters.fromDate) : null);
      setToDate(filters.toDate ? new Date(filters.toDate) : null);
      setSelectedStaff(filters.staffId || 'all');
    }
  }, [open, filters]);

  const handleGenerateReport = async () => {
    if (!fromDate || !toDate) return;

    const dispatchResponse = await dispatch(
      generateSalonReport({
        fromDate: fromDate.toISOString(),
        toDate: toDate.toISOString(),
        // staffId: selectedStaff,
        staffId: 'all',
      }),
    );
  };

  const handleClose = () => {
    setReportModalOpen(false);
    dispatch(resetSalonReport());
    setReportData(null);
    setFromDate(null);
    setToDate(null);
    setSelectedStaff('all');
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="lg" fullWidth={!!data} scroll="paper">
      {!isAuthenticated || user?.role !== 'admin' ? (
        <Dialog open={open} onClose={handleClose} scroll="paper">
          <Unauthorized />
        </Dialog>
      ) : (
        <>
          <DialogTitle sx={{ borderBottom: '1px solid rgba(0,0,0,0.12)' }}>
            {data ? 'Salon Performance Report' : 'Generate Report'}
          </DialogTitle>

          <DialogContent dividers>
            {!data ? (
              // Report parameters form
              <Box sx={{ mt: 2 }}>
                <LocalizationProvider dateAdapter={AdapterDayjs}>
                  <Grid container spacing={3}>
                    <Grid item xs={12} md={6}>
                      <DatePicker
                        label="From Date"
                        value={fromDate}
                        inputFormat="DD/MM/YYYY"
                        onChange={(newValue) => setFromDate(newValue)}
                        renderInput={(params) => (
                          <TextField
                            {...params}
                            fullWidth
                            error={!fromDate && isGenerating}
                            helperText={!fromDate && isGenerating ? 'Required field' : ''}
                          />
                        )}
                      />
                    </Grid>
                    <Grid item xs={12} md={6}>
                      <DatePicker
                        label="To Date"
                        value={toDate}
                        inputFormat="DD/MM/YYYY"
                        onChange={(newValue) => setToDate(newValue)}
                        renderInput={(params) => (
                          <TextField
                            {...params}
                            fullWidth
                            error={!toDate && isGenerating}
                            helperText={!toDate && isGenerating ? 'Required field' : ''}
                          />
                        )}
                        minDate={fromDate}
                      />
                    </Grid>
                    {/* <Grid item xs={12}>
                  <FormControl fullWidth>
                    <InputLabel id="staff-select-label">Served By</InputLabel>
                    <Select
                      labelId="staff-select-label"
                      value={selectedStaff}
                      label="Served By"
                      onChange={(e) => setSelectedStaff(e.target.value)}
                    >
                       
                      {employee?.map((staff) => {
                        if (staff.otherInfo.workplace === 'Salon') {
                          console.log('staff:', staff);
                          return (
                            <MenuItem key={staff._id} value={staff._id}>
                              {staff.employeeName}
                            </MenuItem>
                          );
                        }
                        return null; // important: agar Salon nahi hai to kuch return bhi karna padega
                      })}
                    </Select>
                  </FormControl>
                </Grid> */}
                  </Grid>
                </LocalizationProvider>
              </Box>
            ) : (
              // Report visualization
              <Box
                ref={printRef}
                sx={{
                  p: 2,
                  '@media print': {
                    p: 0,
                    m: 0,
                    width: '100%',
                    backgroundColor: '#fff',
                    '& .MuiCard-root': {
                      pageBreakInside: 'avoid',
                      boxShadow: 'none',
                      border: '1px solid #ddd',
                    },
                    '& .MuiGrid-root': {
                      pageBreakInside: 'avoid',
                    },
                    '& .MuiBox-root': {
                      pageBreakInside: 'avoid',
                    },
                  },
                }}
              >
                <SalonReportVisualization report={data} />
              </Box>
            )}
          </DialogContent>

          <DialogActions sx={{ borderTop: '1px solid rgba(0,0,0,0.12)', p: 2 }}>
            {!data ? (
              <>
                <Button onClick={handleClose} color="inherit">
                  Cancel
                </Button>
                <Button
                  onClick={handleGenerateReport}
                  variant="contained"
                  color="primary"
                  disabled={isGenerating || !fromDate || !toDate}
                  startIcon={isGenerating && <CircularProgress size={20} />}
                >
                  {isGenerating ? 'Generating...' : 'Generate Report'}
                </Button>
              </>
            ) : (
              <>
                <Button onClick={handleClose} color="inherit">
                  Close
                </Button>
                <Button
                  onClick={handlePrint}
                  variant="contained"
                  color="primary"
                  startIcon={<PrintIcon />}
                >
                  Print / PDF
                </Button>
              </>
            )}
          </DialogActions>
        </>
      )}
    </Dialog>
  );
};

export default SalonReport;
