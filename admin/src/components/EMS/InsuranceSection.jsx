import {
  Box,
  FormControl,
  FormControlLabel,
  FormLabel,
  Grid,
  Radio,
  RadioGroup,
  TextField,
  Typography,
} from '@mui/material';
import React from 'react';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';

const InsuranceSection = ({ type, label, values, onChange, errors }) => {
  return (
    <Grid item xs={12}>
      <Box
        sx={{
          p: 2,
          mb: 2,
          border: '1px solid #e0e0e0',
          borderRadius: 1,
        }}
      >
        <Typography variant="subtitle1" gutterBottom>
          {label} Insurance
        </Typography>

        <Grid container spacing={2}>
          <Grid item xs={12} md={6}>
            <FormControl component="fieldset">
              <RadioGroup
                row
                value={values.covered}
                onChange={(e) => onChange(`${type}.covered`, e.target.value)}
              >
                <FormControlLabel value="Yes" control={<Radio />} label="Yes" />
                <FormControlLabel value="No" control={<Radio />} label="No" />
              </RadioGroup>
            </FormControl>
          </Grid>

          {values.covered === 'Yes' && (
            <>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Insurance Amount"
                  type="number"
                  value={values.amount}
                  onChange={(e) => onChange(`${type}.amount`, e.target.value)}
                  error={!!errors?.amount}
                  helperText={errors?.amount}
                />
              </Grid>

              <Grid item xs={12} md={6}>
                <LocalizationProvider dateAdapter={AdapterDayjs}>
                  <DatePicker
                    label="Expiry Date"
                    value={values.expiryDate}
                    onChange={(date) => onChange(`${type}.expiryDate`, date)}
                    inputFormat="DD/MM/YYYY"
                    renderInput={(params) => (
                      <TextField
                        {...params}
                        fullWidth
                        error={!!errors?.expiryDate}
                        helperText={errors?.expiryDate}
                      />
                    )}
                  />
                </LocalizationProvider>
              </Grid>

              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="PF Number"
                  value={values.pfNumber}
                  onChange={(e) => onChange(`${type}.pfNumber`, e.target.value)}
                  error={!!errors?.pfNumber}
                  helperText={errors?.pfNumber}
                />
              </Grid>
            </>
          )}
        </Grid>
      </Box>
    </Grid>
  );
};

export default InsuranceSection;
