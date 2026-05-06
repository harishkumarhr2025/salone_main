import React, { useEffect, useState } from 'react';
import {
  Box,
  Card,
  Chip,
  Divider,
  Grid,
  Typography,
  Modal,
  CircularProgress,
  Alert,
  IconButton,
  List,
  ListItem,
  ListItemText,
  ListItemButton,
  Fab,
  useMediaQuery,
  Menu,
  MenuItem,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
} from '@mui/material';
import { Add, Close, MoreVert, Edit, Delete } from '@mui/icons-material';
import DownloadIcon from '@mui/icons-material/Download';
import UploadFileIcon from '@mui/icons-material/UploadFile';
import { useTheme } from '@mui/material/styles';
import { useDispatch, useSelector } from 'react-redux';
import {
  createNewService,
  deleteServices,
  getAllServices,
  updateServices,
  // deleteService,
} from '../../redux/features/Salon/SalonServicesSlice';
import ServiceForm from '../../components/ServiceForm/ServiceFrom';

import Toast from 'react-hot-toast';
import { canModifyRecords, canExportData } from '../../utils/permissions';
import { CSVLink } from 'react-csv';
import Config from '../../components/Config';
import EntityImportDialog from '../../components/shared/EntityImportDialog';

const ServiceDisplay = ({ selectedCategory, handleServiceMenu, allowModify }) => {
  return (
    <Grid container spacing={3}>
      {selectedCategory.services.map((service) => (
        <Grid item xs={12} sm={6} md={4} key={service._id}>
          <Card
            sx={{
              height: '100%',
              display: 'flex',
              flexDirection: 'column',
              borderRadius: 3,
              boxShadow: 3,
              p: 2,
              position: 'relative',
              '&:hover': { boxShadow: 6 },
            }}
          >
            {allowModify && (
              <IconButton
                size="small"
                sx={{ position: 'absolute', top: 8, right: 8 }}
                onClick={(e) => handleServiceMenu(e, service)}
              >
                <MoreVert fontSize="small" />
              </IconButton>
            )}

            <Typography fontWeight={400} mb={1}>
              {service.name}
            </Typography>
            <Divider />
            <Box mt={2}>
              {selectedCategory.types.map((type) => (
                <Box
                  key={type}
                  sx={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    mb: 1,
                  }}
                >
                  <Chip label={type} color="primary" variant="outlined" />
                  <Typography variant="body2">₹{service.prices[type]}</Typography>
                </Box>
              ))}
            </Box>
          </Card>
        </Grid>
      ))}
    </Grid>
  );
};

const SalonServices = () => {
  const dispatch = useDispatch();
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [categoryMenuAnchor, setCategoryMenuAnchor] = useState(null);
  const [serviceMenuAnchor, setServiceMenuAnchor] = useState(null);
  const [selectedItem, setSelectedItem] = useState(null);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [isImportDialogOpen, setImportDialogOpen] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const currentUser = useSelector((state) => state.Auth.user);
  const allowModify = canModifyRecords(currentUser);
  const allowExport = canExportData(currentUser);

  const { isLoading, isError, services, isCreating } = useSelector((state) => state.SalonServices);

  useEffect(() => {
    dispatch(getAllServices());
  }, [dispatch]);

  useEffect(() => {
    if (services.length > 0 && !selectedCategory) {
      setSelectedCategory(services[0]);
    }
  }, [services]);

  const handleAddNew = () => {
    setEditingCategory(null); // Clear previous edit data
    setIsEditing(false);
    setShowForm(true);
  };

  const handleCategoryMenuOpen = (event, category) => {
    event.stopPropagation();
    setCategoryMenuAnchor(event.currentTarget);
    setSelectedItem(category);
  };

  const handleServiceMenuOpen = (event, service) => {
    event.stopPropagation();
    setServiceMenuAnchor(event.currentTarget);
    setSelectedItem(service);
  };

  const handleMenuClose = () => {
    setCategoryMenuAnchor(null);
    setServiceMenuAnchor(null);
    setSelectedItem(null);
  };

  const handleEditCategory = async (category) => {
    if (!allowModify) {
      Toast.error('This account can only add new records.');
      return;
    }
    setEditingCategory(category);
    setIsEditing(true);
    setShowForm(true);
  };
  const handleUpdateServices = async (updatedCategories) => {
    if (!allowModify) {
      Toast.error('This account can only add new records.');
      return;
    }
    console.log('Updated Categories:', updatedCategories);
    try {
      const updatedCategory = updatedCategories[0];
      await dispatch(updateServices(updatedCategory));
      dispatch(getAllServices());
      setShowForm(false);
      setIsEditing(false);
    } catch (error) {
      console.error('Update failed:', error);
    }
  };

  const handleDelete = async () => {
    try {
      if (!allowModify) {
        Toast.error('This account can only add new records.');
        return;
      }
      if (selectedItem?.category) {
        const deleteResponse = await dispatch(deleteServices(selectedItem));
        if (deleteResponse?.meta.requestStatus === 'fulfilled') {
          Toast.success(deleteResponse?.payload.message || 'Category deleted..');
        } else if (deleteResponse?.meta.requestStatus === 'rejected') {
          Toast.error(deleteResponse?.payload.message || 'Failed to deleted category..');
        } else {
          Toast.error('Failed to deleted category. Please try again later.');
        }
        if (selectedCategory?._id === selectedItem._id) {
          setSelectedCategory(null);
        }
      }
      dispatch(getAllServices());
    } catch (error) {
      console.error('Delete failed:', error);
    } finally {
      handleMenuClose();
      setDeleteConfirmOpen(false);
    }
  };

  const handleAddServices = async (newCategories) => {
    try {
      const createNewServiceResponse = await dispatch(createNewService(newCategories));
      if (createNewServiceResponse?.meta.requestStatus === 'fulfilled') {
        Toast.success(createNewServiceResponse?.payload.message || 'Category created...');
      } else if (createNewServiceResponse?.meta.requestStatus === 'rejected') {
        Toast.error(createNewServiceResponse?.payload.message || 'Failed to create service..');
      } else {
        Toast.error('Failed to create service. Please try again later.');
      }
      await dispatch(getAllServices());
      setShowForm(false);
    } catch (error) {
      console.error('Failed to create services:', error);
    }
  };

  const handleCloseForm = () => {
    setShowForm(false);
    // Reset all form-related states
    setEditingCategory(null);
    setIsEditing(false);
  };

  const csvHeaders = [
    { label: 'Category', key: 'category' },
    { label: 'Type', key: 'type' },
    { label: 'Service Name', key: 'serviceName' },
    { label: 'Price', key: 'price' },
  ];

  const csvData = services.flatMap((category) =>
    category.services.flatMap((service) =>
      category.types.map((type) => ({
        category: category.category,
        type,
        serviceName: service.name,
        price: service.prices?.[type] ?? '',
      })),
    ),
  );

  const handlePreviewImportRows = async (rows, { forceCreate = false } = {}) => {
    const response = await Config.post('/services/import-preview', { rows, forceCreate });
    return response.data;
  };

  const handleImportRows = async (rows, { forceCreate = false } = {}) => {
    try {
      setIsImporting(true);
      const response = await Config.post('/services/import', { rows, forceCreate });
      await dispatch(getAllServices());
      Toast.success(
        `Import complete. Added ${response.data.insertedCount}, updated ${response.data.updatedCount}, skipped ${response.data.skippedCount}.`,
      );
      return response.data;
    } catch (error) {
      Toast.error(error.response?.data?.message || 'Failed to import salon services.');
      return null;
    } finally {
      setIsImporting(false);
    }
  };

  if (isLoading && services.length === 0) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', mt: 5 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (isError) {
    return (
      <Box sx={{ mt: 3 }}>
        <Alert severity="error">{isError || 'Failed to load services'}</Alert>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3, maxWidth: 1400, mx: 'auto' }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
        <Typography variant="h4" fontWeight={700}>
          Our Services
        </Typography>
        {allowExport && (
          <CSVLink
            data={csvData}
            headers={csvHeaders}
            filename="salon-services.csv"
            style={{ textDecoration: 'none' }}
          >
            <Button variant="outlined" startIcon={<DownloadIcon />}>
              Export CSV
            </Button>
          </CSVLink>
        )}
        {allowModify && (
          <Button variant="outlined" startIcon={<UploadFileIcon />} onClick={() => setImportDialogOpen(true)}>
            Import CSV / Excel
          </Button>
        )}
      </Box>

      <Grid container spacing={3}>
        {/* Sidebar Categories */}
        <Grid item xs={12} md={3}>
          <Card sx={{ p: 2, borderRadius: 3 }}>
            <Typography variant="h6" fontWeight={600} mb={2}>
              Categories
            </Typography>
            <List disablePadding>
              {services.map((cat) => (
                <ListItem
                  key={cat._id}
                  disablePadding
                  secondaryAction={
                    allowModify ? (
                    <IconButton
                      edge="end"
                      size="small"
                      onClick={(e) => handleCategoryMenuOpen(e, cat)}
                    >
                      <MoreVert fontSize="small" />
                    </IconButton>
                    ) : null
                  }
                >
                  <ListItemButton
                    selected={selectedCategory?._id === cat._id}
                    onClick={() => setSelectedCategory(cat)}
                    sx={{ borderRadius: 2 }}
                  >
                    <ListItemText
                      primary={cat.category}
                      secondary={`${cat.services.length} services`}
                      primaryTypographyProps={{ fontWeight: 500 }}
                    />
                  </ListItemButton>
                </ListItem>
              ))}
            </List>
          </Card>
        </Grid>

        {/* Services Display */}
        <Grid item xs={12} md={9}>
          {selectedCategory ? (
            <ServiceDisplay
              selectedCategory={selectedCategory}
              handleServiceMenu={handleServiceMenuOpen}
              allowModify={allowModify}
            />
          ) : (
            <Typography>No category selected</Typography>
          )}
        </Grid>
      </Grid>

      {/* Category Context Menu */}
      <Menu
        anchorEl={categoryMenuAnchor}
        open={allowModify && Boolean(categoryMenuAnchor)}
        onClose={handleMenuClose}
      >
        <MenuItem onClick={() => handleEditCategory(selectedItem)}>
          <Edit fontSize="small" sx={{ mr: 1.5 }} />
          Edit Category
        </MenuItem>
        <MenuItem onClick={() => setDeleteConfirmOpen(true)}>
          <Delete fontSize="small" color="error" sx={{ mr: 1.5 }} />
          Delete Category
        </MenuItem>
      </Menu>

      {/* Service Context Menu */}

      {/* Delete Confirmation Dialog */}
      <Dialog open={allowModify && deleteConfirmOpen} onClose={() => setDeleteConfirmOpen(false)}>
        <DialogTitle>Confirm Delete</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete this {selectedItem?.category ? 'category' : 'service'}?
            This action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteConfirmOpen(false)}>Cancel</Button>
          <Button onClick={handleDelete} color="error" variant="contained">
            Delete
          </Button>
        </DialogActions>
      </Dialog>

      {/* FAB for Add New Service */}
      <Fab
        color="primary"
        aria-label="add"
        onClick={() => {
          setShowForm(true);
          handleAddNew();
        }}
        sx={{
          position: 'fixed',
          bottom: 24,
          right: 24,
          zIndex: 1000,
        }}
      >
        <Add />
      </Fab>

      {/* Modal */}
      <Modal
        open={showForm}
        onClose={() => {
          setShowForm(false);
          handleCloseForm();
        }}
      >
        <Box
          sx={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            width: isMobile ? '90%' : 900,
            bgcolor: 'background.paper',
            borderRadius: 3,
            boxShadow: 24,
            p: 4,
            maxHeight: '90vh',
            overflowY: 'auto',
          }}
        >
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
            <Typography variant="h5" fontWeight={600}>
              {isEditing ? 'Update Service' : 'Add New Service'}
            </Typography>
            <IconButton onClick={() => setShowForm(false)} disabled={isCreating}>
              <Close />
            </IconButton>
          </Box>
          <ServiceForm
            onSubmit={isEditing ? handleUpdateServices : handleAddServices}
            initialData={isEditing ? [editingCategory] : null}
          />
        </Box>
      </Modal>
      <EntityImportDialog
        open={isImportDialogOpen}
        onClose={() => setImportDialogOpen(false)}
        onPreview={handlePreviewImportRows}
        onImport={handleImportRows}
        isImporting={isImporting}
        title="Import Salon Services"
        infoText="Preview which salon service rows will update existing prices and which rows will create new service entries."
        importButtonLabel="Import Salon Services"
        templateFileName="salon-services-import-template.xlsx"
        sheetName="Salon Services"
        templateHeaders={['category', 'type', 'serviceName', 'price']}
        templateExampleRow={{ category: 'HAIR', type: 'REGULAR', serviceName: 'HAIRCUT', price: '450' }}
      />
    </Box>
  );
};

export default SalonServices;
