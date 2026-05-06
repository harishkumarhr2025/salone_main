import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Tooltip,
  CircularProgress,
  Alert,
  Box,
  Avatar,
  Grid,
  Typography,
  LinearProgress,
  Button,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import UploadFileIcon from '@mui/icons-material/UploadFile';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell, { tableCellClasses } from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Paper from '@mui/material/Paper';
import Toast from 'react-hot-toast';
import { styled } from '@mui/material/styles';
import { lighten } from '@mui/system';
import DescriptionIcon from '@mui/icons-material/Description';
import SearchBar from 'src/components/SearchBar/SearchBar';
import RemoveRedEyeIcon from '@mui/icons-material/RemoveRedEye';
import PendingActionsIcon from '@mui/icons-material/PendingActions';

import { CSVLink } from 'react-csv';
import DownloadIcon from '@mui/icons-material/Download';

import GroupIcon from '@mui/icons-material/Group';
import { useDispatch, useSelector } from 'react-redux';
import {
  addNewGuest,
  resetGuestState,
  fetchAllGuest,
  updateGuest,
  getGuestById,
  setFilters,
  setCurrentPage,
  setLimit,
  updateGuestsOptimistically,
} from '../../redux/features/GuestSlice';
import { generateReport } from '../../redux/features/ReportSlice';

import GuestEntryModal from '../../components/GuestEntryModal/GuestEntryModal';
import GuestImportDialog from '../../components/GuestImportDialog/GuestImportDialog';
import moment from 'moment';
import GuestDetailModal from 'src/components/GuestDetailsModal/GuestDetailsModal';
import FilterBar from 'src/components/FilterBar/FilterBar';
import PaginationControl from 'src/components/PaginationControl/PaginationControl';
import ReportModal from '../../components/ReportModal/ReportModal';
import Config from '../../components/Config';
import { canModifyRecords, canViewReports, canExportData } from '../../utils/permissions';

const StyledTableRow = styled(TableRow)(({ theme }) => ({
  '&:nth-of-type(odd)': {
    backgroundColor: theme.palette.action.hover,
  },
  // hide last border
  '&:last-child td, &:last-child th': {
    border: 0,
  },
}));
const StyledTableCell = styled(TableCell)(({ theme }) => ({
  [`&.${tableCellClasses.head}`]: {
    backgroundColor: theme.palette.common.black,
    color: theme.palette.common.white,
  },
  [`&.${tableCellClasses.body}`]: {
    fontSize: 14,
  },
}));

const SummaryCard = styled(Paper)(({ theme, color }) => ({
  padding: theme.spacing(3),
  borderRadius: 15,
  color: theme.palette.getContrastText(theme.palette[color].main),
  background: `linear-gradient(135deg, ${theme.palette[color].main} 0%, ${lighten(
    theme.palette[color].main,
    0.2,
  )} 100%)`,
  transition: 'transform 0.3s ease',
  '&:hover': {
    transform: 'translateY(-5px)',
  },
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
}));

const GuestEntry = () => {
  const [open, setOpen] = useState(false);
  const [isImportDialogOpen, setImportDialogOpen] = useState(false);
  const [openDetailsModal, setOpenDetailsModal] = useState(false);
  const [guestId, setGuestId] = useState('');
  const [isRefreshing] = useState(false);
  const [updateDetailsModal] = useState(false);
  const [isReportModalOpen, setReportModalOpen] = useState(false);
  const [reportData, setReportData] = useState(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isImporting, setIsImporting] = useState(false);

  const dispatch = useDispatch();
  const {
    allGuests,
    successMessage,
    errorMessage,
    isLoading,
    pagination,
    searchQuery,
    filters,
    completeGuests,
  } = useSelector((state) => state.Guest);
  const currentUser = useSelector((state) => state.Auth.user);
  const allowImport = canModifyRecords(currentUser);
  const allowReports = canViewReports(currentUser);
  const allowExport = canExportData(currentUser);

  const csvHeaders = [
    { label: 'GRC No.', key: 'GRC_No' },
    { label: 'Guest Name', key: 'Guest_name' },
    { label: 'Email', key: 'Guest_email' },
    { label: 'Contact', key: 'Contact_number' },
    { label: 'Aadhar_No', key: 'Guest_aadhar_No' },
    { label: 'Address', key: 'Guest_address' },
    { label: 'Adults', key: 'Adults' },
    { label: 'Children', key: 'Children' },
    { label: 'Purpose', key: 'Purpose_of_visit' },
    { label: 'Room No.', key: 'Room_no' },
    { label: 'Room Type', key: 'Room_type' },
    { label: 'Guest Type', key: 'Guest_type' },
    { label: 'Check-In Date', key: 'Arrival_date' },
    { label: 'Check-Out Date', key: 'Checkout_date' },
    { label: 'Total Amount (₹)', key: 'grand_total' },
    { label: 'Payment Type', key: 'Payment_type' },
    { label: 'Status', key: 'status' },
  ];

  const guests = useMemo(() => (Array.isArray(allGuests) ? allGuests : []), [allGuests]);

  // Calculate totals from complete list
  const pendingCheckouts = useMemo(
    () => completeGuests.filter((guest) => !guest.Checkout_date).length,
    [completeGuests, openDetailsModal, open],
  );

  useEffect(() => {
    // Load complete list once when component mounts
    dispatch(fetchAllGuest({ limit: 10000 }));
  }, [dispatch]);

  const handleOpen = () => {
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
  };

  const handleOpenDetailModal = useCallback((guest_id) => {
    setGuestId(guest_id);
    setOpenDetailsModal(true);
  }, []);

  const handleCloseDetailsModal = useCallback(() => {
    setOpenDetailsModal(false);
  }, []);

  useEffect(() => {
    // Reset to first page when filters change
    dispatch(setCurrentPage(1));
  }, [dispatch, filters.guestType]);

  useEffect(() => {
    const params = {
      page: pagination.page,
      limit: pagination.limit,
      search: searchQuery,
      // Use Redux filter state directly
      ...(filters.guestType &&
        filters.guestType !== 'all' && {
          guestType: filters.guestType,
        }),
    };

    dispatch(fetchAllGuest(params));
  }, [
    dispatch,
    pagination.page,
    pagination.limit,
    searchQuery,
    filters.guestType,
    openDetailsModal,
  ]);

  const isEmptyState = useMemo(() => {
    // Check if we have any guests OR if we're showing success message
    return !isLoading && guests.length === 0 && !successMessage;
  }, [isLoading, guests, successMessage]);

  const handleModalSubmit = async (guestData, actionType) => {
    try {
      let result;

      if (actionType === 'add') {
        result = await dispatch(addNewGuest(guestData)).unwrap();

        dispatch(setCurrentPage(1));

        if (result?.success) {
          Toast.success(result.message || 'Guest Created');
          handleClose();
          refreshGuestLists({
            page: 1,
            limit: pagination.limit,
            search: searchQuery,
            guestType: filters.guestType,
          }).catch((refreshError) => {
            console.error('Guest list refresh failed after create:', refreshError);
          });
          return true;
        } else {
          Toast.error(result.message || 'Failed to create guest');
          return false;
        }
      } else if (actionType === 'update') {
        result = await dispatch(updateGuest(guestData)).unwrap();

        if (result?.success) {
          Toast.success(result.message || 'Guest details updated');

          // Update guest details if it's the currently viewed guest
          if (result.data._id === guestId) {
            dispatch(getGuestById(guestId));
          }

          handleClose();
          refreshGuestLists({
            page: 1,
            limit: pagination.limit,
            search: searchQuery,
            guestType: filters.guestType,
          }).catch((refreshError) => {
            console.error('Guest list refresh failed after update:', refreshError);
          });
          return true;
        } else {
          Toast.error(result.message || 'Failed to update the guest details');
          return false;
        }
      }

      return false;
    } catch (error) {
      Toast.error(error.message || 'Operation failed');
      console.error('Error submitting guest data:', error);
      return false;
    }
  };

  useEffect(() => {
    if (successMessage || errorMessage) {
      const timer = setTimeout(() => {
        dispatch(resetGuestState());
      }, 3000);

      return () => clearTimeout(timer); // Cleanup to prevent multiple resets
    }
  }, [successMessage, errorMessage, dispatch]);

  const serialNumberStart = useMemo(() => {
    return (pagination.page - 1) * pagination.limit + 1;
  }, [pagination.page, pagination.limit]);

  const handleGenerateReport = async (filters) => {
    try {
      setIsGenerating(true);
      const response = await dispatch(generateReport(filters));
      if (response.payload?.success) {
        setReportData(response.payload.report);
      }
    } finally {
      setIsGenerating(false);
    }
  };

  const MemoizedGuestDetailModal = useMemo(() => {
    return (
      <GuestDetailModal
        open={openDetailsModal}
        handleClose={handleCloseDetailsModal}
        guestId={guestId}
        handleModalSubmit={handleModalSubmit}
        // Key helps force a rerender only when we want the modal to update
        key={`${guestId}-${updateDetailsModal ? 'updated' : 'initial'}`}
      />
    );
  }, [openDetailsModal, guestId, updateDetailsModal, handleCloseDetailsModal, handleModalSubmit]);

  const csvData = completeGuests.map((guest) => ({
    GRC_No: guest.GRC_No || 'N/A',
    Guest_name: guest.Guest_name,
    Contact_number: guest.Contact_number,
    Room_no: guest.Room_no,
    Guest_type: guest.Guest_type,
    Room_type: guest.Room_type,
    Guest_email: guest.Guest_email,
    Guest_aadhar_No: guest.Guest_aadhar_No,
    Guest_address: guest.Guest_address,
    Adults: guest.Adults,
    Children: guest.Children,
    Purpose_of_visit: guest.Purpose_of_visit,
    Arrival_date: guest.Arrival_date
      ? new Date(guest.Arrival_date).toLocaleDateString('en-IN')
      : 'N/A',
    Checkout_date: guest.Checkout_date
      ? new Date(guest.Checkout_date).toLocaleDateString('en-IN')
      : 'Not Checked Out',
    grand_total: guest.grand_total ? `₹${guest.grand_total.toLocaleString('en-IN')}` : '0',
    Payment_type: guest.Payment_type,
    status: guest.Checkout_date ? 'Checked Out' : 'Active',
  }));

  const refreshGuestLists = async ({
    page = pagination.page,
    limit = pagination.limit,
    search = searchQuery,
    guestType = filters.guestType,
  } = {}) => {
    await dispatch(
      fetchAllGuest({
        page,
        limit,
        search,
        ...(guestType && guestType !== 'all' && { guestType }),
      }),
    );

    await dispatch(fetchAllGuest({ limit: 10000 }));
  };

  const handleImportButtonClick = () => {
    if (!allowImport) {
      Toast.error('Only admin users can import guest data.');
      return;
    }

    setImportDialogOpen(true);
  };

  const handlePreviewImportRows = async (rows, { forceCreate = false } = {}) => {
    const response = await Config.post('/import-guests/preview', { rows, forceCreate });
    return response.data;
  };

  const handleImportRows = async (rows, { forceCreate = false } = {}) => {
    try {
      setIsImporting(true);

      if (!rows.length) {
        Toast.error('The selected file does not contain any guest rows.');
        return false;
      }

      const response = await Config.post('/import-guests', { rows, forceCreate });
      const { insertedCount, updatedCount, skippedCount, note, skippedRows } = response.data;

      dispatch(setCurrentPage(1));
      await refreshGuestLists({
        page: 1,
        limit: pagination.limit,
        search: searchQuery,
        guestType: filters.guestType,
      });

      Toast.success(`Import complete. Added ${insertedCount}, updated ${updatedCount}, skipped ${skippedCount}.`, {
        duration: 5000,
      });

      if (searchQuery || (filters.guestType && filters.guestType !== 'all')) {
        Toast(
          'Imported rows were refreshed, but an active search or filter may still hide some of them in the table.',
          { duration: 6000 },
        );
      }

      if (note) {
        Toast(note, { duration: 5000 });
      }

      if (Array.isArray(skippedRows) && skippedRows.length) {
        Toast.error(`Some rows were skipped. First issue: row ${skippedRows[0].rowNumber} - ${skippedRows[0].reason}`, {
          duration: 6000,
        });
      }

      return response.data;
    } catch (error) {
      Toast.error(error.response?.data?.message || 'Failed to import guest data.');
      return null;
    } finally {
      setIsImporting(false);
    }
  };

  return (
    <div>
      {open && (
        <GuestEntryModal
          open={open}
          handleClose={handleClose}
          handleModalSubmit={handleModalSubmit}
          opacityValue={0.5}
        />
      )}

      {openDetailsModal && MemoizedGuestDetailModal}
      {allowReports && (
        <ReportModal
          open={isReportModalOpen}
          onClose={() => {
            setReportData(null);
            setIsGenerating(false);
            setReportModalOpen(false);
          }}
          onGenerate={handleGenerateReport}
          reportData={reportData}
          isGenerating={isGenerating}
        />
      )}
      <GuestImportDialog
        open={isImportDialogOpen}
        onClose={() => setImportDialogOpen(false)}
        onImport={handleImportRows}
        onPreview={handlePreviewImportRows}
        isImporting={isImporting}
      />
      <Box
        sx={{
          mb: 3,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: 2,
        }}
      >
        <Grid container spacing={3}>
          <Grid item xs={12} sm={6} md={3}>
            <SummaryCard color="primary">
              <Avatar sx={{ bgcolor: 'rgba(255,255,255,0.2)', color: 'white' }}>
                <GroupIcon />
              </Avatar>
              <Box sx={{ textAlign: 'right' }}>
                <Typography variant="h4" sx={{ fontWeight: 700 }}>
                  {/* {totalGuests} */}
                  {completeGuests?.length}
                </Typography>
                <Typography variant="body2">Total Guests</Typography>
              </Box>
            </SummaryCard>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <SummaryCard color="secondary">
              <Avatar sx={{ bgcolor: 'rgba(255,255,255,0.2)', color: 'white' }}>
                <PendingActionsIcon />
              </Avatar>
              <Box sx={{ textAlign: 'right' }}>
                <Typography variant="h4" sx={{ fontWeight: 700, color: '#fff' }}>
                  {pendingCheckouts}
                </Typography>
                <Typography variant="body2" sx={{ color: '#fff' }}>
                  Active
                </Typography>
              </Box>
            </SummaryCard>
          </Grid>
        </Grid>
      </Box>
      <Box
        sx={{
          mb: 3,
          display: 'flex',
          gap: 2,
          flexWrap: 'wrap',
          // '& > *': { flex: '1 1 300px' },
        }}
      >
        <Box
          sx={{
            flex: '3 1 500px', // Increased flex basis
            minWidth: '400px',
          }}
        >
          <SearchBar />
        </Box>

        <Box
          sx={{
            flex: '1 1 250px', // Less flexible than search bar
          }}
        >
          <FilterBar
            onFilter={(value) => {
              dispatch(setFilters(value));
              dispatch(setCurrentPage(1)); // Reset to page 1 on filter change
            }}
            currentFilter={filters.guestType}
            sx={{ border: '1px solid red' }}
          />
        </Box>
        <Box
          sx={{
            mb: 3,
            display: 'flex',
            gap: 2,
            alignItems: 'center',
            flexWrap: 'wrap',

            '& > *': {
              flex: '1 1 250px',
              maxWidth: { xs: '100%', sm: '300px' },
              height: '56px',
            },
          }}
        >
          <Button
            variant="contained"
            color="primary"
            onClick={handleOpen}
            startIcon={<AddIcon />}
            sx={{
              fontWeight: 600,
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
              px: 3,
              whiteSpace: 'nowrap',
            }}
          >
            Add Guest
          </Button>
          {allowReports && (
            <Button
              variant="contained"
              color="primary"
              onClick={() => setReportModalOpen(true)}
              startIcon={<DescriptionIcon />}
              sx={{
                fontWeight: 600,
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
                px: 3,
                whiteSpace: 'nowrap',
                '&:hover': {
                  transform: 'translateY(-1px)',
                  boxShadow: 3,
                },
                transition: 'all 0.3s ease',
              }}
            >
              Generate Report
            </Button>
          )}
          {allowImport && (
            <Button
              variant="contained"
              color="secondary"
              onClick={handleImportButtonClick}
              disabled={isImporting}
              startIcon={<UploadFileIcon />}
              sx={{
                fontWeight: 600,
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
                px: 3,
                whiteSpace: 'nowrap',
              }}
            >
              {isImporting ? 'Importing...' : 'Import CSV / Excel'}
            </Button>
          )}
          {allowExport && (
            <CSVLink
              data={csvData}
              headers={csvHeaders}
              filename="guest-list.csv"
              style={{ textDecoration: 'none' }}
            >
              <Button
                variant="contained"
                color="primary"
                startIcon={<DownloadIcon />}
                sx={{
                  float: 'right',
                  p: 1.5,
                  fontWeight: 600,
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                  boxShadow: 2,
                  '&:hover': {
                    boxShadow: 4,
                    transform: 'translateY(-1px)',
                  },
                  transition: 'all 0.3s ease',
                }}
              >
                Export CSV
              </Button>
            </CSVLink>
          )}
        </Box>
      </Box>
      <Paper
        sx={{
          borderRadius: 4,
          overflow: 'hidden',
          boxShadow: 3,
          position: 'relative',
        }}
      >
        {(isLoading || isRefreshing) && (
          <LinearProgress sx={{ position: 'absolute', top: 0, left: 0, right: 0 }} />
        )}

        <TableContainer
          component={Paper}
          sx={{
            overflowX: 'auto',
            minHeight: '65vh', // Use viewport height for consistent sizing
            position: 'relative',
          }}
        >
          <Table sx={{ minWidth: 700, height: '100%' }} stickyHeader aria-label="customized table">
            <TableHead>
              <TableRow>
                <StyledTableCell>SL No.</StyledTableCell>
                <StyledTableCell>GRC No.</StyledTableCell>
                <StyledTableCell align="left">Guest Name</StyledTableCell>
                <StyledTableCell align="left">Contact</StyledTableCell>
                <StyledTableCell align="left">Arrival Date</StyledTableCell>
                <StyledTableCell align="left">Arrival Time</StyledTableCell>
                <StyledTableCell align="left">Tariff</StyledTableCell>
                <StyledTableCell align="left">Action</StyledTableCell>
              </TableRow>
            </TableHead>
            <TableBody
              sx={{
                height: '100%',
                position: 'relative',
                // display: 'block',
                overflow: 'auto',
              }}
            >
              {guests.map((guest, index) => {
                return (
                  <StyledTableRow
                    key={guest._id}
                    hover
                    sx={{ '&:last-child td': { borderBottom: 0 } }}
                  >
                    <StyledTableCell component="th" scope="row" align="center">
                      {serialNumberStart + index}
                    </StyledTableCell>
                    <StyledTableCell align="left">{guest?.GRC_No}</StyledTableCell>
                    <StyledTableCell align="left">{guest?.Guest_name}</StyledTableCell>
                    <StyledTableCell align="left">{guest?.Contact_number}</StyledTableCell>
                    <StyledTableCell align="left">
                      {moment(guest?.Arrival_date).format('Do MMMM YYYY')}
                    </StyledTableCell>
                    <StyledTableCell align="left">
                      {moment(guest?.Arrival_time).format('hh:mm A')}
                    </StyledTableCell>

                    <StyledTableCell align="left">{guest?.Room_tariff}</StyledTableCell>
                    <StyledTableCell
                      align="center"
                      style={{
                        padding: 0,
                        cursor: 'pointer',
                      }}
                    >
                      <span
                        style={{ cursor: 'pointer', margin: '5px' }}
                        onClick={() => handleOpenDetailModal(guest._id)}
                      >
                        <Tooltip title="View Details">
                          <RemoveRedEyeIcon />
                        </Tooltip>
                      </span>
                    </StyledTableCell>
                  </StyledTableRow>
                );
              })}

              {isEmptyState && (
                <StyledTableRow>
                  <StyledTableCell colSpan={10} align="center">
                    No guests found.
                  </StyledTableCell>
                </StyledTableRow>
              )}
              {isLoading && (
                <StyledTableRow>
                  <StyledTableCell colSpan={10} align="center">
                    <CircularProgress size={24} />
                  </StyledTableCell>
                </StyledTableRow>
              )}
              {errorMessage && (
                <StyledTableRow>
                  <StyledTableCell colSpan={10} align="center">
                    <Alert severity="error">{errorMessage}</Alert>
                  </StyledTableCell>
                </StyledTableRow>
              )}
              {/* Empty rows for consistent height */}
              {!isLoading &&
                guests.length > 0 &&
                guests.length < pagination.limit &&
                Array.from({ length: pagination.limit - guests.length }).map((_, index) => (
                  <StyledTableRow
                    key={`empty-${index}`}
                    sx={{
                      visibility: 'hidden',
                      pointerEvents: 'none',
                      height: 53, // Match actual row height
                    }}
                  >
                    <StyledTableCell colSpan={8} />
                  </StyledTableRow>
                ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>
      {/* Pagination Controls with proper spacing */}
      <Box
        sx={{
          bgcolor: 'background.paper',
          // py: 2,
          zIndex: 1,
        }}
      >
        <PaginationControl
          currentPage={pagination.page}
          totalPages={pagination.totalPages}
          onPageChange={(page) => dispatch(setCurrentPage(page))}
          onLimitChange={(limit) => dispatch(setLimit(limit))}
        />
      </Box>
    </div>
  );
};

export default GuestEntry;
