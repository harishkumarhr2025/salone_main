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

const actionConfig = {
  insert: { color: 'success', label: 'Insert' },
  update: { color: 'warning', label: 'Update' },
  skip: { color: 'error', label: 'Skip' },
};

const formatFileSize = (bytes) => {
  if (!bytes) return '0 KB';
  const sizeInKb = bytes / 1024;
  if (sizeInKb < 1024) {
    return `${sizeInKb.toFixed(1)} KB`;
  }
  return `${(sizeInKb / 1024).toFixed(2)} MB`;
};

const EntityImportDialog = ({
  open,
  onClose,
  onPreview,
  onImport,
  isImporting,
  title,
  templateHeaders,
  templateExampleRow,
  infoText,
  importButtonLabel,
  templateFileName,
  sheetName = 'Import',
}) => {
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewSummary, setPreviewSummary] = useState(null);
  const [previewResult, setPreviewResult] = useState(null);
  const [errorMessage, setErrorMessage] = useState('');
  const [forceCreate, setForceCreate] = useState(false);
  const [isPreviewLoading, setIsPreviewLoading] = useState(false);
  const [importResult, setImportResult] = useState(null);

  const resetState = useCallback(() => {
    setSelectedFile(null);
    setPreviewSummary(null);
    setPreviewResult(null);
    setErrorMessage('');
    setForceCreate(false);
    setIsPreviewLoading(false);
    setImportResult(null);
  }, []);

  const handleClose = useCallback(() => {
    if (isImporting) return;
    resetState();
    onClose();
  }, [isImporting, onClose, resetState]);

  const parseFilePreview = useCallback(
    async (file) => {
      const buffer = await file.arrayBuffer();
      const workbook = XLSX.read(buffer, { type: 'array', cellDates: true });
      const preferredSheetName = workbook.SheetNames.find(
        (currentSheetName) => currentSheetName.trim().toLowerCase() === sheetName.trim().toLowerCase(),
      );
      const worksheet = workbook.Sheets[preferredSheetName || workbook.SheetNames[0]];
      const rows = XLSX.utils.sheet_to_json(worksheet, { defval: '', raw: false });
      if (!rows.length) {
        throw new Error('The selected file does not contain any importable rows.');
      }
      const headers = Object.keys(rows[0] || {});
      return {
        rows,
        headers,
        matchedHeaders: templateHeaders.filter((header) => headers.includes(header)),
        missingHeaders: templateHeaders.filter((header) => !headers.includes(header)),
        sheetName: preferredSheetName || workbook.SheetNames[0],
      };
    },
    [sheetName, templateHeaders],
  );

  const requestPreview = useCallback(
    async (rows, nextForceCreate) => {
      if (!rows?.length) {
        setPreviewResult(null);
        return;
      }
      try {
        setIsPreviewLoading(true);
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

  const handleFileSelection = useCallback(
    async (file) => {
      if (!file) return;
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

  const handleDownloadTemplate = useCallback(() => {
    const worksheet = XLSX.utils.json_to_sheet([templateExampleRow], {
      header: templateHeaders,
    });
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);
    XLSX.writeFile(workbook, templateFileName);
  }, [sheetName, templateExampleRow, templateFileName, templateHeaders]);

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

  const handleResultClose = useCallback(() => {
    setImportResult(null);
    resetState();
    onClose();
  }, [onClose, resetState]);

  const helperText = useMemo(() => {
    if (!previewSummary) {
      return 'Drag and drop a CSV/XLS/XLSX file here, or choose it from your computer.';
    }
    return `${previewSummary.rows.length} row(s) found in sheet "${previewSummary.sheetName}".`;
  }, [previewSummary]);

  return (
    <>
      <Dialog open={open} onClose={handleClose} fullWidth maxWidth="md">
        <DialogTitle>{title}</DialogTitle>
        <DialogContent>
          <Stack spacing={2.5} sx={{ pt: 1 }}>
            <Alert severity="info">{infoText}</Alert>

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
              }}
            >
              <input {...getInputProps()} />
              <CloudUploadIcon color={isDragActive ? 'primary' : 'action'} sx={{ fontSize: 44 }} />
              <Typography variant="h6" sx={{ mt: 1.5, mb: 1 }}>
                {isDragActive ? 'Drop the import sheet here' : 'Drag and drop CSV or Excel here'}
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
                    <Button color="error" startIcon={<DeleteOutlineIcon />} onClick={resetState} disabled={isImporting}>
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
                    label="Always create new rows instead of updating matches"
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
                      <List dense sx={{ maxHeight: 240, overflowY: 'auto', border: 1, borderColor: 'divider', borderRadius: 2 }}>
                        {previewResult.rowResults?.map((row) => (
                          <ListItem
                            key={`${row.rowNumber}-${row.action}-${row.label}`}
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
                              primary={`Row ${row.rowNumber}${row.label ? ` - ${row.label}` : ''}`}
                              secondary={row.reason}
                              secondaryTypographyProps={{ sx: { pr: 8 } }}
                            />
                          </ListItem>
                        ))}
                      </List>
                    </Stack>
                  ) : null}
                </Stack>
              </Paper>
            )}
          </Stack>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2.5 }}>
          <Button onClick={handleClose} disabled={isImporting}>Cancel</Button>
          <Button variant="contained" onClick={handleImportClick} disabled={isImporting || !selectedFile}>
            {isImporting ? 'Importing...' : importButtonLabel}
          </Button>
        </DialogActions>
      </Dialog>

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
              <List dense sx={{ maxHeight: 280, overflowY: 'auto', border: 1, borderColor: 'divider', borderRadius: 2 }}>
                {importResult.rowResults?.map((row) => (
                  <ListItem
                    key={`result-${row.rowNumber}-${row.action}-${row.label}`}
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
                      primary={`Row ${row.rowNumber}${row.label ? ` - ${row.label}` : ''}`}
                      secondary={row.reason}
                      secondaryTypographyProps={{ sx: { pr: 8 } }}
                    />
                  </ListItem>
                ))}
              </List>
            </Stack>
          )}
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2.5 }}>
          <Button variant="contained" onClick={handleResultClose}>Close</Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default EntityImportDialog;