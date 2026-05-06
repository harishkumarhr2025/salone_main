import { Box, Button, FormHelperText, Paper, Typography } from '@mui/material';
import React from 'react';
import { useDropzone } from 'react-dropzone';
import {
  PersonAdd,
  CloudUpload as CloudUploadIcon,
  Delete as DeleteIcon,
} from '@mui/icons-material';

const FileUpload = ({ label, value, onChange, error }) => {
  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const { getRootProps, getInputProps } = useDropzone({
    accept: { 'image/jpeg': ['.jpeg', '.jpg'], 'image/png': ['.png'] },
    maxFiles: 1,
    onDrop: (acceptedFiles) => {
      const file = acceptedFiles[0];
      if (file) {
        file.preview = URL.createObjectURL(file);
        onChange(file);
      }
    },
    maxSize: 5 * 1024 * 1024, // 5MB
  });

  const handleRemove = (e) => {
    e.stopPropagation();
    onChange(null);
  };

  return (
    <Paper
      variant="outlined"
      sx={{
        p: 2,
        border: '2px dashed #e0e0e0',
        borderColor: value ? 'gray' : 'grey.500',
        textAlign: 'center',
        cursor: 'pointer',
        height: 220,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        borderRadius: 1,
        backgroundColor: '#fafafa',
        '&:hover': {
          borderColor: 'primary.main',
        },
      }}
      {...getRootProps()}
    >
      <input {...getInputProps()} />
      {value ? (
        <Box sx={{ display: 'flex', flexDirection: 'column' }}>
          <img
            src={value instanceof File ? URL.createObjectURL(value) : value.preview || value}
            alt={label}
            style={{
              maxHeight: 120,
              maxWidth: '100%',
              objectFit: 'contain',
            }}
          />
          <Typography variant="caption">
            {value.name ? `${value.name.slice(0, 12)}...` : 'Selected File'}
            {value.size && ` (${formatFileSize(value.size)})`}
          </Typography>
          <Button variant="outlined" color="error" size="small" onClick={handleRemove}>
            Remove
            <DeleteIcon fontSize="small" />
          </Button>
          {error && (
            <FormHelperText error sx={{ mt: 1 }}>
              {error}
            </FormHelperText>
          )}
        </Box>
      ) : (
        <>
          <CloudUploadIcon fontSize="large" color="action" sx={{ alignSelf: 'center' }} />
          <Typography variant="body2" sx={{ mt: 1 }}>
            {`Drag & drop ${label} here`}
          </Typography>
          <Typography variant="caption" color="textSecondary">
            (or click to select)
          </Typography>
          <Typography variant="caption" color="textSecondary" sx={{ mt: 1 }}>
            Supported formats: JPEG, PNG
          </Typography>
        </>
      )}
    </Paper>
  );
};

export default FileUpload;
