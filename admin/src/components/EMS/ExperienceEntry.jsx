import { Box, FormControlLabel, Grid, IconButton, Switch, TextField } from '@mui/material';
import React, { useState } from 'react';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';

const ExperienceEntry = ({ index, experience, onChange, onRemove, errors }) => {
  return (
    <Box
      sx={{
        p: 4,
        mb: 2,
        border: '1px solid #e0e0e0',
        borderRadius: 1,
        position: 'relative',
      }}
    >
      <Grid container spacing={2}>
        <Grid item xs={12} md={6}>
          <TextField
            fullWidth
            label="Job Title"
            value={experience.jobTitle}
            onChange={(e) => onChange(index, 'jobTitle', e.target.value)}
            error={!!errors?.[index]?.jobTitle}
            helperText={errors?.[index]?.jobTitle}
          />
        </Grid>
        <Grid item xs={12} md={6}>
          <TextField
            fullWidth
            label="Company"
            value={experience.company}
            onChange={(e) => onChange(index, 'company', e.target.value)}
            error={!!errors?.[index]?.company}
            helperText={errors?.[index]?.company}
          />
        </Grid>
        <Grid item xs={12} md={6}>
          <TextField
            fullWidth
            label="Duration"
            value={experience.duration}
            onChange={(e) => onChange(index, 'duration', e.target.value)}
            error={!!errors?.[index]?.duration}
            helperText={errors?.[index]?.duration}
          />
        </Grid>

        <Grid item xs={12}>
          <TextField
            fullWidth
            label="Description"
            multiline
            rows={3}
            value={experience.description}
            onChange={(e) => onChange(index, 'description', e.target.value)}
            error={!!errors?.[index]?.description}
            helperText={errors?.[index]?.description}
          />
        </Grid>
      </Grid>
      {index > 0 && (
        <IconButton
          sx={{ position: 'absolute', top: 0, right: 0, border: '1px solid grey' }}
          onClick={() => onRemove(index)}
          aria-label="Remove experience"
        >
          <DeleteIcon />
        </IconButton>
      )}
    </Box>
  );
};

export default ExperienceEntry;
