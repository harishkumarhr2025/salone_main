import React, { useState, useEffect, useRef } from 'react';
import {
  Box,
  Container,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Typography,
  Grid,
  useTheme,
  Card,
  CardContent,
  Button,
  CircularProgress,
} from '@mui/material';
import ErrorOutline from '@mui/icons-material/ErrorOutline';
import ImageIcon from '@mui/icons-material/Image';
import { CSVLink } from 'react-csv';
import DownloadIcon from '@mui/icons-material/Download';
import UploadFileIcon from '@mui/icons-material/UploadFile';
import { getDaysInMonth, format, isAfter, isThisYear, isThisMonth, parseISO } from 'date-fns';
import { useDispatch, useSelector } from 'react-redux';
import { generateMonthlySalonReport } from '../../redux/features/ReportSlice'; // Update import path
import { useReactToPrint } from 'react-to-print';
import MonthlyRevenueReport from 'src/components/PDF-Format/Salon/MonthlyRevenueReport';
import Unauthorized from 'src/components/Unauthorized/Unauthorized';
import Config from '../../components/Config';
import EntityImportDialog from '../../components/shared/EntityImportDialog';

const SalonReport = () => {
  const [isPrinting, setIsPrinting] = useState(false);
  const [isImportDialogOpen, setImportDialogOpen] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const dispatch = useDispatch();
  const { data: dailyData, isLoading, error } = useSelector((state) => state.Report.salonReport);

  const { isAuthenticated, user } = useSelector((state) => state.Auth);

  console.log('Report User:', user);

  const theme = useTheme();
  const currentDate = new Date();

  const contentRef = useRef(null);
  const reactToPrintFn = useReactToPrint({ contentRef });

  console.log('Daily Data:', dailyData);

  const csvHeaders = [
    { label: 'SL No.', key: 'GRC_No' },
    { label: 'Date', key: 'date' },
    { label: 'Day', key: 'day' },
    { label: 'Cash', key: 'cash' },
    { label: 'UPI', key: 'upi' },
    { label: 'Tips', key: 'tips' },
    { label: 'Total', key: 'total' },
  ];

  // State initialization with current month/year
  const [selectedMonth, setSelectedMonth] = useState(
    String(currentDate.getMonth() + 1).padStart(2, '0'),
  );
  const [selectedYear, setSelectedYear] = useState(String(currentDate.getFullYear()));

  const monthName = format(new Date(Number(selectedYear), Number(selectedMonth) - 1, 1), 'MMMM');

  let apiData;

  // Generate complete days array with API data
  const generateDaysArray = () => {
    const daysInMonth = getDaysInMonth(new Date(Number(selectedYear), Number(selectedMonth) - 1));
    const today = new Date();

    return Array.from({ length: daysInMonth }, (_, i) => {
      const dayNumber = i + 1;
      const currentDayDate = new Date(selectedYear, selectedMonth - 1, dayNumber);
      const isFutureDate = isAfter(currentDayDate, today);
      const apiDate = format(currentDayDate, 'dd-MM-yyyy');

      // Find matching data from API response
      apiData = dailyData?.dailyData?.find((d) => d.date === apiDate);
      // const apiData = [];

      return {
        date: format(currentDayDate, 'dd/MM/yyyy'),
        day: format(currentDayDate, 'EEEE'),
        cash: apiData?.totalRevenue || 0,
        upi: apiData?.totalUPI || 0,
        tips: apiData?.totalTips || 0,
        total: (apiData?.totalRevenue || 0) + (apiData?.totalUPI || 0) + (apiData?.totalTips || 0),
        isFuture: isFutureDate,
      };
    });
  };

  // Filter days based on current month
  const filteredDays = generateDaysArray().filter((day) => {
    const isCurrentMonth =
      Number(selectedMonth) === currentDate.getMonth() + 1 &&
      Number(selectedYear) === currentDate.getFullYear();

    if (isCurrentMonth) {
      const dayDate = parseISO(day.date.split('/').reverse().join('-'));
      return dayDate <= currentDate;
    }
    return true;
  });

  const csvData = filteredDays
    .filter((day) => !day.isFuture) // Exclude future dates
    .map((day, index) => ({
      GRC_No: index + 1,
      date: day.date,
      day: day.day,
      cash: day.cash,
      upi: day.upi,
      tips: day.tips,
      total: day.total,
    }));

  // Calculate totals
  const totals = {
    cash: filteredDays.reduce((acc, day) => acc + (day.isFuture ? 0 : day.cash), 0),
    upi: filteredDays.reduce((acc, day) => acc + (day.isFuture ? 0 : day.upi), 0),
    tips: filteredDays.reduce((acc, day) => acc + (day.isFuture ? 0 : day.tips), 0),
    total: filteredDays.reduce((acc, day) => acc + (day.isFuture ? 0 : day.total), 0),
  };

  useEffect(() => {
    dispatch(
      generateMonthlySalonReport({
        month: selectedMonth,
        year: selectedYear,
      }),
    );
  }, [dispatch, selectedMonth, selectedYear]);

  // Month options
  const months = Array.from({ length: 12 }, (_, i) => {
    const monthValue = String(i + 1).padStart(2, '0');
    const isFutureMonth =
      isThisYear(new Date(selectedYear, 0)) && i + 1 > currentDate.getMonth() + 1;
    return {
      value: monthValue,
      label: format(new Date(2000, i, 1), 'MMMM'),
      disabled: isFutureMonth,
    };
  });

  // Year options
  const currentYear = currentDate.getFullYear();
  const years = Array.from({ length: currentYear - 2019 }, (_, i) => {
    const yearValue = 2020 + i;
    return {
      value: String(yearValue),
      label: String(yearValue),
      disabled: yearValue > currentYear,
    };
  });

  const handleMonthChange = (event) => {
    setSelectedMonth(event.target.value.padStart(2, '0'));
  };

  const handleYearChange = (event) => {
    setSelectedYear(event.target.value);
  };

  const handlePreviewImportRows = async (rows, { forceCreate = false } = {}) => {
    const response = await Config.post('/salon-monthly-report/preview-import', {
      rows,
      forceCreate,
      month: selectedMonth,
      year: selectedYear,
    });
    return response.data;
  };

  const handleImportRows = async (rows, { forceCreate = false } = {}) => {
    try {
      setIsImporting(true);
      const response = await Config.post('/salon-monthly-report/import', {
        rows,
        forceCreate,
        month: selectedMonth,
        year: selectedYear,
      });
      await dispatch(generateMonthlySalonReport({ month: selectedMonth, year: selectedYear }));
      return response.data;
    } catch (error) {
      return null;
    } finally {
      setIsImporting(false);
    }
  };

  const handlePrint = useReactToPrint({
    // content: () => componentRef.current,
    onBeforeGetContent: () => setIsPrinting(true),
    onAfterPrint: () => setIsPrinting(false),
    documentTitle: `Monthly_Report_${monthName}_${selectedYear}`,
    pageStyle: `
    @media print {
      @page { size: A4; margin: 1cm; }
      body { -webkit-print-color-adjust: exact; }
      table { page-break-inside: auto; }
      tr { page-break-inside: avoid; }
    }
  `,
  });

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      {!isAuthenticated || user?.role !== 'admin' ? (
        <Unauthorized />
      ) : (
        <>
          {/* Main Report Box */}
          <Box
            sx={{
              backgroundColor: 'white',
              borderRadius: 4,
              boxShadow: theme.shadows[4],
              p: 4,
              background: 'linear-gradient(to bottom right, #f8f9fa 0%, #ffffff 100%)',
            }}
          >
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Typography
                variant="h4"
                gutterBottom
                sx={{
                  mb: 4,
                  color: theme.palette.primary.main,
                  fontWeight: 600,
                }}
              >
                Monthly Revenue Report
              </Typography>

              <Box
                sx={{
                  mb: 3,
                  display: 'flex',
                  gap: 2,
                  alignItems: 'center',
                  '& > *': {
                    flex: '1 1 auto',
                    height: '56px',
                  },
                }}
              >
                <Button
                  variant="contained"
                  startIcon={<ImageIcon />}
                  sx={{
                    backgroundColor: '#1976d2',
                    '&:hover': { backgroundColor: '#1565c0' },
                  }}
                  onClick={() => reactToPrintFn()}
                >
                  Print Details
                </Button>

                <CSVLink
                  data={csvData}
                  headers={csvHeaders}
                  filename={`Monthly ${monthName} report.csv`}
                  style={{ textDecoration: 'none' }}
                >
                  <Button
                    variant="contained"
                    color="primary"
                    startIcon={<DownloadIcon />}
                    sx={{
                      height: '56px',
                      backgroundColor: '#1976d2',
                      '&:hover': { backgroundColor: '#1565c0' },
                    }}
                  >
                    Export CSV
                  </Button>
                </CSVLink>

                <Button
                  variant="contained"
                  color="secondary"
                  startIcon={<UploadFileIcon />}
                  onClick={() => setImportDialogOpen(true)}
                  sx={{ height: '56px' }}
                >
                  Import CSV / Excel
                </Button>
              </Box>
            </Box>

            {/* Filters */}
            <Grid container spacing={3} sx={{ mb: 4 }}>
              <Grid item xs={12} sm={6} md={3}>
                <FormControl fullWidth>
                  <InputLabel>Month</InputLabel>
                  <Select
                    value={selectedMonth}
                    label="Month"
                    onChange={handleMonthChange}
                    variant="outlined"
                  >
                    {months.map((month) => (
                      <MenuItem key={month.value} value={month.value} disabled={month.disabled}>
                        {month.label}
                        {month.disabled && ' (Future)'}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <FormControl fullWidth>
                  <InputLabel>Year</InputLabel>
                  <Select
                    value={selectedYear}
                    label="Year"
                    onChange={handleYearChange}
                    variant="outlined"
                  >
                    {years.map((year) => (
                      <MenuItem key={year.value} value={year.value} disabled={year.disabled}>
                        {year.label}
                        {year.disabled && ' (Future)'}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
            </Grid>

            {/* Loading State */}
            {isLoading && (
              <Box sx={{ p: 3, textAlign: 'center' }}>
                <CircularProgress size={60} />
                <Typography variant="body1" sx={{ mt: 2 }}>
                  Generating Report...
                </Typography>
              </Box>
            )}

            {/* Error State */}
            {error && (
              <Box
                sx={{
                  p: 3,
                  textAlign: 'center',
                  backgroundColor: theme.palette.error.light,
                  borderRadius: 2,
                  my: 2,
                }}
              >
                <ErrorOutline sx={{ fontSize: 40, color: theme.palette.error.main }} />
                <Typography variant="h6" sx={{ mt: 2, color: theme.palette.error.dark }}>
                  {error}
                </Typography>
              </Box>
            )}

            {/* Data Table */}
            {!isLoading && !error && (
              <>
                <TableContainer
                  component={Paper}
                  sx={{
                    border: `1px solid ${theme.palette.divider}`,
                    borderRadius: 3,
                    overflow: 'hidden',
                    '& .MuiTableCell-root': {
                      py: 1.5,
                    },
                  }}
                >
                  <Table sx={{ minWidth: 750 }}>
                    <TableHead
                      sx={{
                        backgroundColor: theme.palette.primary.light,
                        '& .MuiTableCell-root': {
                          color: theme.palette.common.gray,
                          fontWeight: 600,
                          fontSize: '0.95rem',
                        },
                      }}
                    >
                      <TableRow>
                        {['SL No', 'Date', 'Day', 'Cash', 'UPI', 'Tips', 'Total'].map((header) => (
                          <TableCell key={header} align="center">
                            {header}
                          </TableCell>
                        ))}
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {filteredDays.map((day, index) => (
                        <TableRow
                          key={day.date}
                          hover
                          sx={{
                            '&:nth-of-type(even)': {
                              backgroundColor: theme.palette.action.hover,
                            },
                            '&:last-child td': { borderBottom: 0 },
                          }}
                        >
                          <TableCell align="center">{index + 1}</TableCell>
                          <TableCell align="center">{day.date}</TableCell>
                          <TableCell align="center">{day.day}</TableCell>
                          <TableCell align="center" sx={{ fontWeight: 500 }}>
                            {day.isFuture ? '-' : `₹${day.cash.toLocaleString()}`}
                          </TableCell>
                          <TableCell align="center" sx={{ fontWeight: 500 }}>
                            {day.isFuture ? '-' : `₹${day.upi.toLocaleString()}`}
                          </TableCell>
                          <TableCell align="center" sx={{ fontWeight: 500 }}>
                            {day.isFuture ? '-' : `₹${day.tips.toLocaleString()}`}
                          </TableCell>
                          <TableCell
                            align="center"
                            sx={{
                              fontWeight: 700,
                              color: theme.palette.success.dark,
                              backgroundColor: theme.palette.success.light,
                            }}
                          >
                            {day.isFuture ? '-' : `₹${day.total.toLocaleString()}`}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>

                {/* Summary Cards */}
                <Grid container spacing={3} sx={{ mt: 2 }}>
                  <Grid item xs={12} sm={6} md={3}>
                    <Card
                      sx={{
                        bgcolor: theme.palette.info.light,
                        borderRadius: 2,
                        boxShadow: theme.shadows[2],
                      }}
                    >
                      <CardContent>
                        <Typography variant="subtitle2" color="textSecondary">
                          TOTAL CASH RECEIVED
                        </Typography>
                        <Typography variant="h6" sx={{ fontWeight: 700 }}>
                          ₹{totals.cash.toLocaleString()}
                        </Typography>
                      </CardContent>
                    </Card>
                  </Grid>

                  <Grid item xs={12} sm={6} md={3}>
                    <Card
                      sx={{
                        bgcolor: theme.palette.warning.light,
                        borderRadius: 2,
                        boxShadow: theme.shadows[2],
                      }}
                    >
                      <CardContent>
                        <Typography variant="subtitle2" color="textSecondary">
                          UPI PAYMENT RECD
                        </Typography>
                        <Typography variant="h6" sx={{ fontWeight: 700 }}>
                          ₹{totals.upi.toLocaleString()}
                        </Typography>
                      </CardContent>
                    </Card>
                  </Grid>

                  <Grid item xs={12} sm={6} md={3}>
                    <Card
                      sx={{
                        bgcolor: theme.palette.error.light,
                        borderRadius: 2,
                        boxShadow: theme.shadows[2],
                      }}
                    >
                      <CardContent>
                        <Typography variant="subtitle2" color="textSecondary">
                          TIPS
                        </Typography>
                        <Typography variant="h6" sx={{ fontWeight: 700 }}>
                          ₹{totals.tips.toLocaleString()}
                        </Typography>
                      </CardContent>
                    </Card>
                  </Grid>

                  <Grid item xs={12} sm={6} md={3}>
                    <Card
                      sx={{
                        bgcolor: theme.palette.success.light,
                        borderRadius: 2,
                        boxShadow: theme.shadows[2],
                      }}
                    >
                      <CardContent>
                        <Typography variant="subtitle2" color="textSecondary">
                          TOTAL TURNOVER
                        </Typography>
                        <Typography variant="h6" sx={{ fontWeight: 700 }}>
                          ₹{totals.total.toLocaleString()}
                        </Typography>
                      </CardContent>
                    </Card>
                  </Grid>
                </Grid>
              </>
            )}
          </Box>
          <Box
            sx={{
              position: 'absolute',
              left: '-9999px',
              visibility: 'hidden',
              '@media print': {
                position: 'static',
                visibility: 'visible',
              },
            }}
          >
            <MonthlyRevenueReport
              ref={contentRef}
              filteredDays={filteredDays}
              totals={totals}
              monthName={monthName}
              selectedYear={selectedYear}
              apiData={apiData}
            />
          </Box>
        </>
      )}
      <EntityImportDialog
        open={isImportDialogOpen}
        onClose={() => setImportDialogOpen(false)}
        onPreview={handlePreviewImportRows}
        onImport={handleImportRows}
        isImporting={isImporting}
        title="Import Monthly Revenue Rows"
        infoText="Preview imported monthly revenue rows before merging them into the selected month and year report. Imported values are stored and included in the actual monthly revenue report."
        importButtonLabel="Import Monthly Revenue"
        templateFileName="monthly-revenue-import-template.xlsx"
        sheetName="Monthly Revenue"
        templateHeaders={['date', 'cash', 'upi', 'tips', 'total', 'note']}
        templateExampleRow={{ date: '09/04/2026', cash: '1200', upi: '800', tips: '150', total: '2150', note: 'Imported adjustment' }}
      />
    </Container>
  );
};

export default SalonReport;
