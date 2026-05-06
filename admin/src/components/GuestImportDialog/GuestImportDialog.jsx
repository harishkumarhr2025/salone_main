import React, { useCallback, useMemo, useState } from 'react';
import {
  Alert,
  Box,
  Button,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControlLabel,
  List,
  ListItem,
  ListItemText,
  Paper,
  Stack,
  Switch,
  Typography,
} from '@mui/material';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import DownloadIcon from '@mui/icons-material/Download';
import InsertDriveFileIcon from '@mui/icons-material/InsertDriveFile';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import { useDropzone } from 'react-dropzone';
import * as XLSX from 'xlsx';

const TEMPLATE_HEADERS = [
  'GRC_No',
  'Guest_name',
  'Guest_picture',
  'Guest_email',
  'Guest_type',
  'Contact_number',
  'Guest_aadhar_No',
  'Guest_address',
  'Emergency_number',
  'Adults',
  'Children',
  'Purpose_of_visit',
  'Booking_details',
  'Room_no',
  'Room_type',
  'Room_tariff',
  'Arrival_date',
  'Arrival_time',
  'Checkout_date',
  'Checkout_time',
  'Payment_type',
  'Agent_commission',
  'Profession_type',
  'registration_fee',
  'advance_deposit',
  'meal_plan',
  'Guest_nationality',
  'grand_total',
  'remark',
  'bedNumber',
  'status',
];

const TEMPLATE_EXAMPLE_ROW = {
  GRC_No: '',
  Guest_name: 'Ravi Kumar',
  Guest_picture: '',
  Guest_email: 'ravi@example.com',
  Guest_type: 'Daily',
  Contact_number: '9876543210',
  Guest_aadhar_No: '123412341234',
  Guest_address: 'Bhubaneswar, Odisha',
  Emergency_number: '9876501234',
  Adults: '2',
  Children: '1',
  Purpose_of_visit: 'Business',
  Booking_details: 'Walk-in',
  Room_no: '101',
  Room_type: 'Deluxe',
  Room_tariff: '2500',
  Arrival_date: '2026-04-09',
  Arrival_time: '10:30 AM',
  Checkout_date: '',
  Checkout_time: '',
  Payment_type: 'Cash',
  Agent_commission: '0',
  Profession_type: 'Business',
  registration_fee: '0',
  advance_deposit: '500',
  meal_plan: 'breakfast,lunch',
  Guest_nationality: 'Indian',
  grand_total: '3000',
  remark: '',
  bedNumber: 'A1',
  status: 'active',
};

const formatFileSize = (bytes) => {
  if (!bytes) {
    return '0 KB';
  }

  const sizeInKb = bytes / 1024;
  if (sizeInKb < 1024) {
    return `${sizeInKb.toFixed(1)} KB`;
  }

  return `${(sizeInKb / 1024).toFixed(2)} MB`;
};

const actionConfig = {
  insert: { color: 'success', label: 'Insert' },
  update: { color: 'warning', label: 'Update' },
  skip: { color: 'error', label: 'Skip' },
};

const GuestImportDialog = ({ open, onClose, onImport, onPreview, isImporting }) => {
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewSummary, setPreviewSummary] = useState(null);
  const [previewResult, setPreviewResult] = useState(null);
  const [errorMessage, setErrorMessage] = useState('');
  const [forceCreate, setForceCreate] = useState(false);
  const [isPreviewLoading, setIsPreviewLoading] = useState(false);
  const [importResult, setImportResult] = useState(null);

  const requestPreview = useCallback(
    async (rows, nextForceCreate) => {
      if (!rows?.length) {
        setPreviewResult(null);
        return;
      }

      try {
        setIsPreviewLoading(true);
        setErrorMessage('');
        const result = await onPreview(rows, { forceCreate: nextForceCreate });
        setPreviewResult(result);
      } catch (error) {
        setPreviewResult(null);
        setErrorMessage(error.message || 'Unable to preview import actions.');
      } finally {
        setIsPreviewLoading(false);
      }
    },
    [onPreview],
  );

  const resetState = useCallback(() => {
    setSelectedFile(null);
    setPreviewSummary(null);
    setPreviewResult(null);
    setErrorMessage('');
    setImportResult(null);
    setForceCreate(false);
  }, []);

  const handleClose = useCallback(() => {
    if (isImporting) {
      return;
    }

    resetState();
    onClose();
  }, [isImporting, onClose, resetState]);

  const parseFilePreview = useCallback(async (file) => {
    const buffer = await file.arrayBuffer();
    const workbook = XLSX.read(buffer, { type: 'array', cellDates: true });
    const preferredSheetName = workbook.SheetNames.find(
      (sheetName) => sheetName.trim().toLowerCase() === 'guest entry',
    );
    const worksheet = workbook.Sheets[preferredSheetName || workbook.SheetNames[0]];
    const rows = XLSX.utils.sheet_to_json(worksheet, {
      defval: '',
      raw: false,
    });

    if (!rows.length) {
      throw new Error('The selected file does not contain any guest rows.');
    }

    const headers = Object.keys(rows[0] || {});
    const matchedHeaders = TEMPLATE_HEADERS.filter((header) => headers.includes(header));
    const missingHeaders = TEMPLATE_HEADERS.filter((header) => !headers.includes(header));

    return {
      rows,
      headers,
      matchedHeaders,
      missingHeaders,
      sheetName: preferredSheetName || workbook.SheetNames[0],
    };
  }, []);

  const handleFileSelection = useCallback(
    async (file) => {
      if (!file) {
        return;
      }

      try {
        setErrorMessage('');
        const preview = await parseFilePreview(file);
        setSelectedFile(file);
        setPreviewSummary(preview);
        await requestPreview(preview.rows, forceCreate);
      } catch (error) {
        setSelectedFile(null);
        setPreviewSummary(null);
        setPreviewResult(null);
        setErrorMessage(error.message || 'Unable to read the selected file.');
      }
    },
    [forceCreate, parseFilePreview, requestPreview],
  );

  const onDrop = useCallback(
    async (acceptedFiles, rejectedFiles) => {
      if (rejectedFiles?.length) {
        setErrorMessage(rejectedFiles[0]?.errors?.[0]?.message || 'Invalid file selected.');
        return;
      }

      await handleFileSelection(acceptedFiles[0]);
    },
    [handleFileSelection],
  );

  const { getRootProps, getInputProps, isDragActive, open: openFileDialog } = useDropzone({
    onDrop,
    noClick: true,
    multiple: false,
    accept: {
      'text/csv': ['.csv'],
      'application/vnd.ms-excel': ['.xls'],
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
    },
  });

  const helperText = useMemo(() => {
    if (!previewSummary) {
      return 'Drag and drop a guest sheet here, or choose a CSV/XLS/XLSX file from your computer.';
    }

    return `${previewSummary.rows.length} row(s) found in sheet "${previewSummary.sheetName}".`;
  }, [previewSummary]);

  const handleImportClick = useCallback(async () => {
    if (!selectedFile || !previewSummary?.rows?.length) {
      setErrorMessage('Choose a valid CSV or Excel file before importing.');
      return;
    }

    const result = await onImport(previewSummary.rows, { forceCreate });
    if (result?.success) {
      setImportResult(result);
    }
  }, [forceCreate, onImport, previewSummary, selectedFile]);

  const handleForceCreateChange = useCallback(
    async (event) => {
      const nextValue = event.target.checked;
      setForceCreate(nextValue);

      if (previewSummary?.rows?.length) {
        await requestPreview(previewSummary.rows, nextValue);
      }
    },
    [previewSummary, requestPreview],
  );

  const handleResultClose = useCallback(() => {
    setImportResult(null);
    resetState();
    onClose();
  }, [onClose, resetState]);

  const handleDownloadTemplate = useCallback(() => {
    const worksheet = XLSX.utils.json_to_sheet([TEMPLATE_EXAMPLE_ROW], {
      header: TEMPLATE_HEADERS,
    });
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Guest Entry');
    XLSX.writeFile(workbook, 'guest-entry-import-template.xlsx');
  }, []);

  return (
    <Dialog open={open} onClose={handleClose} fullWidth maxWidth="md">
      <DialogTitle>Import Guest Entry Sheet</DialogTitle>
      <DialogContent>
        <Stack spacing={2.5} sx={{ pt: 1 }}>
          <Alert severity="info">
            Use the same column names as the guest entry fields. You can preview which rows will be inserted,
            updated, or skipped before importing.
          </Alert>

          <Paper
            variant="outlined"
            {...getRootProps()}
            sx={{
              borderStyle: 'dashed',
              borderWidth: 2,
              borderColor: isDragActive ? 'primary.main' : 'divider',
              bgcolor: isDragActive ? 'action.hover' : 'background.default',
              borderRadius: 3,
              p: 4,
              textAlign: 'center',
              transition: 'all 0.2s ease',
            }}
          >
            <input {...getInputProps()} />
            <CloudUploadIcon color={isDragActive ? 'primary' : 'action'} sx={{ fontSize: 44 }} />
            <Typography variant="h6" sx={{ mt: 1.5, mb: 1 }}>
              {isDragActive ? 'Drop the guest sheet here' : 'Drag and drop CSV or Excel here'}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {helperText}
            </Typography>
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5} sx={{ mt: 2.5, justifyContent: 'center' }}>
              <Button variant="contained" onClick={openFileDialog} disabled={isImporting}>
                Choose File
              </Button>
              <Button variant="outlined" startIcon={<DownloadIcon />} onClick={handleDownloadTemplate}>
                Download Template
              </Button>
            </Stack>
          </Paper>

          {errorMessage && <Alert severity="error">{errorMessage}</Alert>}

          {selectedFile && previewSummary && (
            <Paper variant="outlined" sx={{ p: 2.5, borderRadius: 3 }}>
              <Stack spacing={2}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', gap: 2, alignItems: 'center', flexWrap: 'wrap' }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                    <InsertDriveFileIcon color="action" />
                    <Box>
                      <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                        {selectedFile.name}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {formatFileSize(selectedFile.size)}
                      </Typography>
                    </Box>
                  </Box>
                  <Button
                    color="error"
                    startIcon={<DeleteOutlineIcon />}
                    onClick={resetState}
                    disabled={isImporting}
                  >
                    Remove
                  </Button>
                </Box>

                <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                  <Chip label={`Rows: ${previewSummary.rows.length}`} color="primary" variant="outlined" />
                  <Chip label={`Matched headers: ${previewSummary.matchedHeaders.length}`} color="success" variant="outlined" />
                  <Chip label={`Missing headers: ${previewSummary.missingHeaders.length}`} color={previewSummary.missingHeaders.length ? 'warning' : 'default'} variant="outlined" />
                </Stack>

                <FormControlLabel
                  control={<Switch checked={forceCreate} onChange={handleForceCreateChange} />}
                  label="Always create new Guest Entry rows instead of updating matches"
                />

                {isPreviewLoading ? (
                  <Alert severity="info">Checking which rows will be inserted, updated, or skipped...</Alert>
                ) : previewResult ? (
                  <Stack spacing={2}>
                    <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                      <Chip label={`Will insert: ${previewResult.insertedCount}`} color="success" />
                      <Chip label={`Will update: ${previewResult.updatedCount}`} color="warning" />
                      <Chip label={`Will skip: ${previewResult.skippedCount}`} color="error" />
                    </Stack>

                    {previewResult.note && <Alert severity="info">{previewResult.note}</Alert>}

                    <Box>
                      <Typography variant="subtitle2" sx={{ mb: 1 }}>
                        Import preview by row
                      </Typography>
                      <List dense sx={{ maxHeight: 240, overflowY: 'auto', border: 1, borderColor: 'divider', borderRadius: 2 }}>
                        {previewResult.rowResults.map((row) => (
                          <ListItem
                            key={`${row.rowNumber}-${row.action}-${row.guestName}`}
                            disableGutters
                            sx={{ px: 1.5, alignItems: 'flex-start', gap: 1.5 }}
                            secondaryAction={
                              <Chip
                                size="small"
                                color={actionConfig[row.action]?.color || 'default'}
                                label={actionConfig[row.action]?.label || row.action}
                              />
                            }
                          >
                            <ListItemText
                              primary={`Row ${row.rowNumber}${row.guestName ? ` - ${row.guestName}` : ''}`}
                              secondary={row.reason}
                              secondaryTypographyProps={{ sx: { pr: 8 } }}
                            />
                          </ListItem>
                        ))}
                      </List>
                    </Box>
                  </Stack>
                ) : null}

                <Box>
                  <Typography variant="subtitle2" sx={{ mb: 1 }}>
                    Required-style guest columns
                  </Typography>
                  <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                    {TEMPLATE_HEADERS.map((header) => (
                      <Chip
                        key={header}
                        size="small"
                        label={header}
                        color={previewSummary.headers.includes(header) ? 'success' : 'default'}
                        variant={previewSummary.headers.includes(header) ? 'filled' : 'outlined'}
                      />
                    ))}
                  </Stack>
                </Box>

                {previewSummary.missingHeaders.length > 0 && (
                  <Alert severity="warning">
                    Some columns are missing. Import can still work if your file uses equivalent names such as
                    contact, guest name, room no, or check-in date.
                  </Alert>
                )}

                <Box>
                  <Typography variant="subtitle2" sx={{ mb: 1 }}>
                    First detected columns
                  </Typography>
                  <List dense sx={{ maxHeight: 180, overflowY: 'auto', border: 1, borderColor: 'divider', borderRadius: 2 }}>
                    {previewSummary.headers.map((header) => (
                      <ListItem key={header} disableGutters sx={{ px: 1.5 }}>
                        <ListItemText primary={header} />
                      </ListItem>
                    ))}
                  </List>
                </Box>
              </Stack>
            </Paper>
          )}
        </Stack>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2.5 }}>
        <Button onClick={handleClose} disabled={isImporting}>
          Cancel
        </Button>
        <Button variant="contained" onClick={handleImportClick} disabled={isImporting || !selectedFile}>
          {isImporting ? 'Importing...' : 'Import Guest Data'}
        </Button>
      </DialogActions>

      <Dialog open={Boolean(importResult)} onClose={handleResultClose} fullWidth maxWidth="sm">
        <DialogTitle>Import Result</DialogTitle>
        <DialogContent>
          {importResult && (
            <Stack spacing={2} sx={{ pt: 1 }}>
              <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                <Chip label={`Inserted: ${importResult.insertedCount}`} color="success" />
                <Chip label={`Updated: ${importResult.updatedCount}`} color="warning" />
                <Chip label={`Skipped: ${importResult.skippedCount}`} color="error" />
              </Stack>

              {importResult.note && <Alert severity="info">{importResult.note}</Alert>}

              {Array.isArray(importResult.rowResults) && importResult.rowResults.length > 0 && (
                <Box>
                  <Typography variant="subtitle2" sx={{ mb: 1 }}>
                    Import result by row
                  </Typography>
                  <List dense sx={{ maxHeight: 280, overflowY: 'auto', border: 1, borderColor: 'divider', borderRadius: 2 }}>
                    {importResult.rowResults.map((row) => (
                      <ListItem
                        key={`result-${row.rowNumber}-${row.action}-${row.guestName}`}
                        disableGutters
                        sx={{ px: 1.5, alignItems: 'flex-start', gap: 1.5 }}
                        secondaryAction={
                          <Chip
                            size="small"
                            color={actionConfig[row.action]?.color || 'default'}
                            label={actionConfig[row.action]?.label || row.action}
                          />
                        }
                      >
                        <ListItemText
                          primary={`Row ${row.rowNumber}${row.guestName ? ` - ${row.guestName}` : ''}`}
                          secondary={row.reason}
                          secondaryTypographyProps={{ sx: { pr: 8 } }}
                        />
                      </ListItem>
                    ))}
                  </List>
                </Box>
              )}
            </Stack>
          )}
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2.5 }}>
          <Button variant="contained" onClick={handleResultClose}>
            Close
          </Button>
        </DialogActions>
      </Dialog>
    </Dialog>
  );
};

export default GuestImportDialog;