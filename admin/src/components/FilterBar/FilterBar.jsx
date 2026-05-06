import { useEffect, useState } from 'react';
import {
  Box,
  Chip,
  Button,
  MenuItem,
  Typography,
  OutlinedInput,
  Select,
  FormControl,
} from '@mui/material';
import { Close, ExpandMore } from '@mui/icons-material';
import { styled } from '@mui/material/styles';
import { useSelector } from 'react-redux';

const StyledSelect = styled(Select)(({ theme }) => ({
  minWidth: 200,
  borderRadius: '12px',
  backgroundColor: theme.palette.background.paper,
  transition: 'all 0.3s ease',
  '& .MuiOutlinedInput-input': {
    padding: '12px 16px',
    fontWeight: 500,
  },
  '& .MuiOutlinedInput-notchedOutline': {
    border: `2px solid ${theme.palette.divider}`,
    borderRadius: '12px',
  },
  '&:hover .MuiOutlinedInput-notchedOutline': {
    borderColor: theme.palette.primary.main,
  },
  '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
    borderColor: theme.palette.primary.main,
    boxShadow: `0 0 0 3px ${theme.palette.primary.light}`,
  },
}));

const CustomMenuItem = styled(MenuItem)(({ theme }) => ({
  borderRadius: '8px',
  margin: '4px 8px',
  padding: '10px 16px',
  transition: 'all 0.2s ease',
  '&.Mui-selected': {
    backgroundColor: `${theme.palette.primary.light}30 !important`,
    color: theme.palette.primary.dark,
    fontWeight: 600,
  },
  '&:hover': {
    backgroundColor: `${theme.palette.primary.light}15`,
  },
}));

const FilterBar = ({ onFilter, currentFilter }) => {
  const [guestType, setGuestType] = useState('all');

  useEffect(() => {
    setGuestType(currentFilter || 'all');
  }, [currentFilter]);

  const handleChange = (event) => {
    const value = event.target.value;
    setGuestType(value);
    onFilter(value);
  };

  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
      <FormControl>
        <StyledSelect
          value={guestType}
          onChange={handleChange}
          IconComponent={ExpandMore}
          displayEmpty
          input={
            <OutlinedInput
              startAdornment={
                <Typography component="span" sx={{ mr: 1, color: 'text.secondary' }}>
                  Filter:
                </Typography>
              }
            />
          }
          MenuProps={{
            PaperProps: {
              sx: {
                borderRadius: '12px',
                marginTop: 1,
                boxShadow: '0 8px 24px rgba(0,0,0,0.1)',
                '& .MuiMenu-list': {
                  padding: '8px',
                },
              },
            },
          }}
        >
          <CustomMenuItem value="all">
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
              <Box
                sx={{
                  width: 24,
                  height: 24,
                  borderRadius: '6px',
                  bgcolor: 'primary.light',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'primary.dark',
                }}
              >
                A
              </Box>
              All Guests
            </Box>
          </CustomMenuItem>
          <CustomMenuItem value="Monthly">
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
              <Box
                sx={{
                  width: 24,
                  height: 24,
                  borderRadius: '6px',
                  bgcolor: 'primary.light',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'primary.dark',
                }}
              >
                M
              </Box>
              Monthly
            </Box>
          </CustomMenuItem>
          <CustomMenuItem value="Daily">
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
              <Box
                sx={{
                  width: 24,
                  height: 24,
                  borderRadius: '6px',
                  bgcolor: 'secondary.light',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'secondary.dark',
                }}
              >
                D
              </Box>
              Daily
            </Box>
          </CustomMenuItem>
        </StyledSelect>
      </FormControl>
    </Box>
  );
};

export default FilterBar;
