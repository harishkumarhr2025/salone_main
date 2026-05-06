import React, { useEffect, useMemo, useState } from 'react';
import {
  Container,
  Paper,
  Typography,
  TextField,
  MenuItem,
  Grid,
  Button,
  FormControl,
  InputLabel,
  Select,
  Box,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
} from '@mui/material';
import DownloadIcon from '@mui/icons-material/Download';
import UploadFileIcon from '@mui/icons-material/UploadFile';
import { CSVLink } from 'react-csv';
import Toast from 'react-hot-toast';
import { useSelector } from 'react-redux';
import Config from '../../components/Config';
import EntityImportDialog from '../../components/shared/EntityImportDialog';
import { canModifyRecords, canExportData } from '../../utils/permissions';

const initialFormState = {
  productName: '',
  hsnCode: '',
  vendorName: '',
  vendorCode: '',
  manufacturingDate: '',
  expiryDate: '',
  uom: '',
  price: '',
  gstType: '',
  minQuantity: '',
  maxQuantity: '',
  batchNumber: '',
  billNumber: '',
  billDate: '',
  remarks: '',
};

const ProductManagement = () => {
  const [formData, setFormData] = useState(initialFormState);
  const [products, setProducts] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isImportDialogOpen, setImportDialogOpen] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const currentUser = useSelector((state) => state.Auth.user);
  const allowImport = canModifyRecords(currentUser);
  const allowExport = canExportData(currentUser);

  const uomOptions = ['PCS', 'KG', 'LTR', 'BOX', 'MTR'];
  const gstOptions = ['5%', '12%', '18%', 'CGST', 'SGST', 'IGST'];

  const fetchProducts = async () => {
    try {
      const response = await Config.get('/products');
      setProducts(response.data?.data || []);
    } catch (error) {
      setProducts([]);
      Toast.error('Failed to fetch products.');
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  const handleChange = (event) => {
    setFormData((previousState) => ({
      ...previousState,
      [event.target.name]: event.target.value,
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    try {
      setIsSubmitting(true);
      const response = await Config.post('/products', formData);
      if (response.data?.success) {
        Toast.success(response.data.message || 'Product created successfully.');
        setFormData(initialFormState);
        await fetchProducts();
      }
    } catch (error) {
      Toast.error(error.response?.data?.message || 'Failed to create product.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePreviewImportRows = async (rows, { forceCreate = false } = {}) => {
    const response = await Config.post('/products/import-preview', { rows, forceCreate });
    return response.data;
  };

  const handleImportRows = async (rows, { forceCreate = false } = {}) => {
    try {
      setIsImporting(true);
      const response = await Config.post('/products/import', { rows, forceCreate });
      await fetchProducts();
      return response.data;
    } catch (error) {
      Toast.error(error.response?.data?.message || 'Failed to import products.');
      return null;
    } finally {
      setIsImporting(false);
    }
  };

  const csvHeaders = [
    { label: 'Product Name', key: 'productName' },
    { label: 'HSN Code', key: 'hsnCode' },
    { label: 'Vendor Name', key: 'vendorName' },
    { label: 'Vendor Code', key: 'vendorCode' },
    { label: 'Manufacturing Date', key: 'manufacturingDate' },
    { label: 'Expiry Date', key: 'expiryDate' },
    { label: 'UOM', key: 'uom' },
    { label: 'Price', key: 'price' },
    { label: 'GST Type', key: 'gstType' },
    { label: 'Min Quantity', key: 'minQuantity' },
    { label: 'Max Quantity', key: 'maxQuantity' },
    { label: 'Batch Number', key: 'batchNumber' },
    { label: 'Bill Number', key: 'billNumber' },
    { label: 'Bill Date', key: 'billDate' },
    { label: 'Remarks', key: 'remarks' },
  ];

  const csvData = useMemo(
    () =>
      products.map((product) => ({
        ...product,
        manufacturingDate: product.manufacturingDate
          ? new Date(product.manufacturingDate).toLocaleDateString('en-IN')
          : '',
        expiryDate: product.expiryDate ? new Date(product.expiryDate).toLocaleDateString('en-IN') : '',
        billDate: product.billDate ? new Date(product.billDate).toLocaleDateString('en-IN') : '',
      })),
    [products],
  );

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          mb: 3,
          gap: 2,
          flexWrap: 'wrap',
        }}
      >
        <Typography variant="h4">Product Management</Typography>
        <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
          {allowExport && (
            <CSVLink
              data={csvData}
              headers={csvHeaders}
              filename="products.csv"
              style={{ textDecoration: 'none' }}
            >
              <Button variant="outlined" startIcon={<DownloadIcon />}>
                Export CSV
              </Button>
            </CSVLink>
          )}
          {allowImport && (
            <Button variant="outlined" startIcon={<UploadFileIcon />} onClick={() => setImportDialogOpen(true)}>
              Import CSV / Excel
            </Button>
          )}
        </Box>
      </Box>

      <Paper elevation={3} sx={{ p: 4, mb: 4 }}>
        <Typography variant="h5" gutterBottom>
          Product Entry Form
        </Typography>

        <form onSubmit={handleSubmit}>
          <Grid container spacing={3}>
            <Grid item xs={12} sm={6}>
              <TextField fullWidth label="Product Name" name="productName" value={formData.productName} onChange={handleChange} required />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField fullWidth label="HSN Code" name="hsnCode" value={formData.hsnCode} onChange={handleChange} required />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField fullWidth label="Vendor Name" name="vendorName" value={formData.vendorName} onChange={handleChange} required />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField fullWidth label="Vendor Code" name="vendorCode" value={formData.vendorCode} onChange={handleChange} required />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField fullWidth label="Date of Manufacturing" type="date" name="manufacturingDate" InputLabelProps={{ shrink: true }} value={formData.manufacturingDate} onChange={handleChange} required />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField fullWidth label="Date of Expiry" type="date" name="expiryDate" InputLabelProps={{ shrink: true }} value={formData.expiryDate} onChange={handleChange} required />
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth required>
                <InputLabel>Unit of Measurement</InputLabel>
                <Select name="uom" value={formData.uom} label="Unit of Measurement" onChange={handleChange}>
                  {uomOptions.map((option) => (
                    <MenuItem key={option} value={option}>
                      {option}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField fullWidth label="Price" name="price" type="number" value={formData.price} onChange={handleChange} required />
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth required>
                <InputLabel>GST Type</InputLabel>
                <Select name="gstType" value={formData.gstType} label="GST Type" onChange={handleChange}>
                  {gstOptions.map((option) => (
                    <MenuItem key={option} value={option}>
                      {option}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={3}>
              <TextField fullWidth label="Min Quantity" name="minQuantity" type="number" value={formData.minQuantity} onChange={handleChange} required />
            </Grid>
            <Grid item xs={12} sm={3}>
              <TextField fullWidth label="Max Quantity" name="maxQuantity" type="number" value={formData.maxQuantity} onChange={handleChange} required />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField fullWidth label="Batch Number" name="batchNumber" value={formData.batchNumber} onChange={handleChange} required />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField fullWidth label="Bill Number" name="billNumber" value={formData.billNumber} onChange={handleChange} required />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField fullWidth label="Bill Date" type="date" name="billDate" InputLabelProps={{ shrink: true }} value={formData.billDate} onChange={handleChange} required />
            </Grid>
            <Grid item xs={12}>
              <TextField fullWidth label="Remarks" name="remarks" multiline rows={4} value={formData.remarks} onChange={handleChange} />
            </Grid>
            <Grid item xs={12}>
              <Button type="submit" variant="contained" size="large" disabled={isSubmitting}>
                {isSubmitting ? 'Saving...' : 'Submit'}
              </Button>
            </Grid>
          </Grid>
        </form>
      </Paper>

      <Paper elevation={2} sx={{ p: 3 }}>
        <Typography variant="h6" sx={{ mb: 2 }}>
          Saved Products
        </Typography>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Product</TableCell>
                <TableCell>Vendor</TableCell>
                <TableCell>HSN</TableCell>
                <TableCell>Batch</TableCell>
                <TableCell>Price</TableCell>
                <TableCell>UOM</TableCell>
                <TableCell>Bill Date</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {products.map((product) => (
                <TableRow key={product._id}>
                  <TableCell>{product.productName}</TableCell>
                  <TableCell>{product.vendorName}</TableCell>
                  <TableCell>{product.hsnCode}</TableCell>
                  <TableCell>{product.batchNumber}</TableCell>
                  <TableCell>{product.price}</TableCell>
                  <TableCell>{product.uom}</TableCell>
                  <TableCell>
                    {product.billDate ? new Date(product.billDate).toLocaleDateString('en-IN') : ''}
                  </TableCell>
                </TableRow>
              ))}
              {products.length === 0 && (
                <TableRow>
                  <TableCell colSpan={7} align="center">
                    No products found.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>

      <EntityImportDialog
        open={isImportDialogOpen}
        onClose={() => setImportDialogOpen(false)}
        onPreview={handlePreviewImportRows}
        onImport={handleImportRows}
        isImporting={isImporting}
        title="Import Products"
        infoText="Preview which product rows will be inserted, updated, or skipped before importing them into product management."
        importButtonLabel="Import Products"
        templateFileName="products-import-template.xlsx"
        sheetName="Products"
        templateHeaders={[
          'productName',
          'hsnCode',
          'vendorName',
          'vendorCode',
          'manufacturingDate',
          'expiryDate',
          'uom',
          'price',
          'gstType',
          'minQuantity',
          'maxQuantity',
          'batchNumber',
          'billNumber',
          'billDate',
          'remarks',
        ]}
        templateExampleRow={{
          productName: 'Shampoo',
          hsnCode: '3305',
          vendorName: 'ABC Supplies',
          vendorCode: 'VEN01',
          manufacturingDate: '2026-04-01',
          expiryDate: '2027-04-01',
          uom: 'PCS',
          price: '250',
          gstType: '18%',
          minQuantity: '5',
          maxQuantity: '50',
          batchNumber: 'B001',
          billNumber: 'INV-1001',
          billDate: '2026-04-09',
          remarks: 'Imported stock',
        }}
      />
    </Container>
  );
};

export default ProductManagement;
