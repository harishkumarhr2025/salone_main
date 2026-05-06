import React, { useCallback, useEffect, useState } from 'react';
import {
  Box,
  Button,
  Dialog,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
  Paper,
  Tabs,
  Tab,
  Chip,
  useTheme,
  Pagination,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import InsertDriveFileOutlinedIcon from '@mui/icons-material/InsertDriveFileOutlined';
import DescriptionIcon from '@mui/icons-material/Description';
import DownloadIcon from '@mui/icons-material/Download';
import UploadFileIcon from '@mui/icons-material/UploadFile';
import { CSVLink } from 'react-csv';

import ServiceCustomerForm from '../../components/ServiceCustomerForm/ServiceCustomerForm';
import { useDispatch, useSelector } from 'react-redux';
import {
  createNewCustomer,
  getAllCustomers,
  updateFilters,
  setPage,
} from '../../redux/features/Salon/SalonCustomerSlice';
import Toast from 'react-hot-toast';
import SalonCustomerDetails from 'src/components/SalonCustomerDetails/SalonCustomerDetails';
import DeleteConfirmationDialog from 'src/components/DeleteConfirmationDialog/DeleteConfirmationDialog';
import SearchBar from '../../components/SearchBar/SearchBar';
import SalonReport from 'src/components/SalonReport/SalonReport';
import Config from '../../components/Config';
import EntityImportDialog from 'src/components/shared/EntityImportDialog';
import { canModifyRecords, canViewReports, canExportData } from '../../utils/permissions';

const Salon = () => {
  const theme = useTheme();
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [editCustomer, setEditCustomer] = useState(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [customerToDelete, setCustomerToDelete] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [isReportModalOpen, setReportModalOpen] = useState(false);
  const [isImportDialogOpen, setImportDialogOpen] = useState(false);
  const [isImporting, setIsImporting] = useState(false);

  const dispatch = useDispatch();
  const {
    data: { customers, pagination, counts },
    filters,
    isLoading,
  } = useSelector((state) => state.Salon);
  const currentUser = useSelector((state) => state.Auth.user);
  const allowImport = canModifyRecords(currentUser);
  const allowReports = canViewReports(currentUser);
  const allowExport = canExportData(currentUser);

  const handleSearch = useCallback(
    (searchValue) => {
      dispatch(updateFilters({ search: searchValue }));
    },
    [dispatch],
  );

  const handleTabChange = (event, newValue) => {
    dispatch(updateFilters({ status: newValue }));
  };

  const handlePageChange = (event, page) => {
    dispatch(setPage(page));
    dispatch(getAllCustomers());
  };

  const handleAddCustomer = async (newCustomer) => {
    setSubmitting(true);
    try {
      const result = await dispatch(createNewCustomer(newCustomer));
      console.log('createNewCustomer result', result);
      if (result?.meta.requestStatus === 'fulfilled') {
        setShowAddDialog(false);
        dispatch(getAllCustomers());
        Toast.success('Customer added successfully');
      } else if (result?.meta.requestStatus === 'rejected') {
        Toast.error(result?.payload?.message || 'Failed to add customer');
      } else {
        Toast.error('Failed to add customer. Please try again.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  useEffect(() => {
    dispatch(updateFilters({ status: 'active', search: '' }));
    dispatch(getAllCustomers());
  }, [dispatch]);

  useEffect(() => {
    dispatch(getAllCustomers());
  }, [dispatch, selectedCustomer, filters]);

  const handleViewDetails = (customerId) => {
    setSelectedCustomer(customerId);
  };

  const handleEditCustomer = (customer) => {
    const fullCustomer = customers.find((c) => c._id === customer._id);
    setEditCustomer(fullCustomer);
    setShowAddDialog(true);
  };

  const handleDetailsClose = () => {
    setSelectedCustomer(null);
  };

  const handleDeleteClick = (customer) => {
    setCustomerToDelete(customer);
    setDeleteDialogOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (customerToDelete) {
      setDeleteDialogOpen(false);
      Toast.success('Customer deleted successfully');
    }
  };

  const csvHeaders = [
    { label: 'Customer Name', key: 'customerName' },
    { label: 'Mobile Number', key: 'mobileNumber' },
    { label: 'Status', key: 'status' },
    { label: 'Visits', key: 'visitCount' },
    { label: 'Created At', key: 'createdAt' },
    { label: 'Updated At', key: 'updatedAt' },
  ];

  const csvData = customers.map((customer) => ({
    customerName: customer.customerName,
    mobileNumber: customer.mobileNumber || customer.mobileNo || '',
    status: customer.isActive ? 'Active' : 'Completed',
    visitCount: customer.visits?.length || 0,
    createdAt: customer.createdAt ? new Date(customer.createdAt).toLocaleString('en-IN') : '',
    updatedAt: customer.updatedAt ? new Date(customer.updatedAt).toLocaleString('en-IN') : '',
  }));

  const handlePreviewImportRows = async (rows, { forceCreate = false } = {}) => {
    const response = await Config.post('/customers/import-preview', { rows, forceCreate });
    return response.data;
  };

  const handleImportRows = async (rows, { forceCreate = false } = {}) => {
    try {
      setIsImporting(true);
      const response = await Config.post('/customers/import', { rows, forceCreate });
      await dispatch(getAllCustomers());
      Toast.success(
        `Import complete. Added ${response.data.insertedCount}, updated ${response.data.updatedCount}, skipped ${response.data.skippedCount}.`,
      );
      return response.data;
    } catch (error) {
      Toast.error(error.response?.data?.message || 'Failed to import salon customers.');
      return null;
    } finally {
      setIsImporting(false);
    }
  };

  const renderTableBody = () => {
    if (!customers.length) {
      return (
        <TableBody>
          <TableRow>
            <TableCell colSpan={4} sx={{ borderBottom: 'none' }}>
              <Box
                sx={{
                  p: 4,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  textAlign: 'center',
                }}
              >
                <InsertDriveFileOutlinedIcon
                  sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }}
                />
                <Typography variant="h6" gutterBottom>
                  {filters.status === 'active' ? 'No active customers found' : 'No customers found'}
                </Typography>
                <Button
                  variant="contained"
                  startIcon={<AddIcon />}
                  onClick={() => setShowAddDialog(true)}
                  sx={{ mt: 2 }}
                >
                  Add Customer
                </Button>
              </Box>
            </TableCell>
          </TableRow>
        </TableBody>
      );
    }

    return (
      <TableBody>
        {customers.map((customer) => (
          <TableRow
            hover
            key={customer._id}
            sx={{
              '&:nth-of-type(even)': { backgroundColor: theme.palette.action.hover },
              '&:last-child td': { borderBottom: 0 },
            }}
          >
            <TableCell>
              <Box
                component="span"
                sx={{
                  display: 'inline-block',
                  px: 1,
                  py: 0.25,
                  borderRadius: 1,
                  backgroundColor: customer.isActive ? '#ffeb3b' : 'transparent',
                  color: customer.isActive ? '#1f1f1f' : 'inherit',
                  fontWeight: customer.isActive ? 700 : 500,
                }}
              >
                {customer.customerName}
              </Box>
            </TableCell>
            <TableCell>{customer.mobileNumber || customer.mobileNo}</TableCell>
            <TableCell>
              <Chip
                label={customer.isActive ? 'Active' : 'Completed'}
                color={customer.isActive ? 'success' : 'default'}
                variant="outlined"
                sx={{ borderRadius: 1, fontWeight: 500 }}
              />
            </TableCell>
            <TableCell>
              <Button
                variant="outlined"
                color={customer.isActive ? 'error' : 'primary'}
                onClick={() => handleViewDetails(customer._id)}
                sx={{ borderRadius: 2 }}
              >
                View Details
              </Button>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    );
  };

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
        <Typography variant="h4">Salon Customers</Typography>
        <Box>
          {allowReports && (
            <Button
              variant="contained"
              startIcon={<DescriptionIcon />}
              onClick={() => setReportModalOpen(true)}
              sx={{ mr: 2, borderRadius: 2 }}
            >
              Generate Report
            </Button>
          )}
          {allowExport && (
            <CSVLink
              data={csvData}
              headers={csvHeaders}
              filename="salon-customers.csv"
              style={{ textDecoration: 'none' }}
            >
              <Button variant="outlined" startIcon={<DownloadIcon />} sx={{ mr: 2, borderRadius: 2 }}>
                Export CSV
              </Button>
            </CSVLink>
          )}
          {allowImport && (
            <Button
              variant="outlined"
              startIcon={<UploadFileIcon />}
              onClick={() => setImportDialogOpen(true)}
              sx={{ mr: 2, borderRadius: 2 }}
            >
              Import CSV / Excel
            </Button>
          )}
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => setShowAddDialog(true)}
            sx={{ borderRadius: 2 }}
          >
            Add New Customer
          </Button>
        </Box>
      </Box>

      <SearchBar value={filters.search} onSearch={handleSearch} sx={{ mb: 3 }} />

      <Tabs
        value={filters.status}
        onChange={handleTabChange}
        sx={{
          mb: 3,
          mt: 3,
          '& .MuiTabs-indicator': { display: 'none' },
          '& .MuiTab-root': {
            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
            borderRadius: '12px',
            mx: 0.5,
            py: 1,
            px: 2.5,
            border: '2px solid',
            borderColor: 'divider',
            backgroundColor: 'background.paper',
            '&:hover': {
              boxShadow: 3,
              backgroundColor: 'action.hover',
            },
            '&.Mui-selected': {
              backgroundColor: 'primary.main',
              color: 'primary.contrastText',
              borderColor: 'primary.dark',
              boxShadow: `0 4px 12px ${theme.palette.primary.main}40`,
              '& .MuiChip-root': {
                backgroundColor: 'primary.dark',
                color: 'primary.contrastText',
              },
            },
          },
        }}
      >
        <Tab
          label={
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
              <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                Active
              </Typography>
              <Chip
                label={counts.totalActiveCustomer || 0}
                size="small"
                sx={{
                  fontWeight: 700,
                  fontSize: '0.75rem',
                  height: 24,
                  minWidth: 24,
                }}
              />
            </Box>
          }
          value="active"
        />
        <Tab
          label={
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
              <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                All
              </Typography>
              <Chip
                label={counts.totalAllCustomers || 0} // Changed from pagination.totalDocuments
                size="small"
                sx={{
                  fontWeight: 700,
                  fontSize: '0.75rem',
                  height: 24,
                  minWidth: 24,
                }}
              />
            </Box>
          }
          value="all"
        />
      </Tabs>

      <TableContainer
        component={Paper}
        sx={{
          borderRadius: 2,
          border: `1px solid ${theme.palette.divider}`,
          overflow: 'hidden',
          boxShadow: theme.shadows[1],
        }}
      >
        <Table sx={{ minWidth: 650 }}>
          <TableHead sx={{ bgcolor: theme.palette.background.default }}>
            <TableRow>
              {['Customer Name', 'Mobile', 'Status', 'Actions'].map((header) => (
                <TableCell key={header} sx={{ fontWeight: 700, color: 'text.primary', py: 2 }}>
                  {header}
                </TableCell>
              ))}
            </TableRow>
          </TableHead>
          {renderTableBody()}
        </Table>
      </TableContainer>

      {(filters.status === 'all' && pagination.totalPages > 1) ||
      (filters.status === 'active' && counts.totalActiveCustomer > pagination.limit) ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 3 }}>
          <Pagination
            count={pagination.totalPages}
            page={pagination.currentPage}
            onChange={handlePageChange}
            color="primary"
            showFirstButton
            showLastButton
            sx={{ '& .MuiPaginationItem-root': { borderRadius: 1.5 } }}
          />
        </Box>
      ) : null}

      <Dialog
        open={showAddDialog}
        onClose={() => {
          setShowAddDialog(false);
          setEditCustomer(null);
        }}
        maxWidth="md"
      >
        <ServiceCustomerForm
          initialData={editCustomer}
          onSubmit={handleAddCustomer}
          submitting={submitting}
          onCancel={() => {
            setShowAddDialog(false);
            setEditCustomer(null);
          }}
        />
      </Dialog>

      {selectedCustomer && (
        <SalonCustomerDetails
          customerId={selectedCustomer}
          onClose={handleDetailsClose}
          onEdit={handleEditCustomer}
          onDelete={handleDeleteClick}
        />
      )}

      <DeleteConfirmationDialog
        open={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
        customer={selectedCustomer}
        onConfirm={handleConfirmDelete}
      />

      {allowReports && <SalonReport open={isReportModalOpen} setReportModalOpen={setReportModalOpen} />}
      <EntityImportDialog
        open={isImportDialogOpen}
        onClose={() => setImportDialogOpen(false)}
        onPreview={handlePreviewImportRows}
        onImport={handleImportRows}
        isImporting={isImporting}
        title="Import Salon Customers"
        infoText="Preview which salon customer rows will be inserted, updated, or skipped before import."
        importButtonLabel="Import Salon Customers"
        templateFileName="salon-customers-import-template.xlsx"
        sheetName="Salon Customers"
        templateHeaders={['customerName', 'mobileNumber', 'status']}
        templateExampleRow={{ customerName: 'Ananya Das', mobileNumber: '9876543210', status: 'active' }}
      />
    </Box>
  );
};

export default Salon;
