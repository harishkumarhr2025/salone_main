import { useEffect, useState } from 'react';
import { TextField, InputAdornment, IconButton, Box } from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import CloseIcon from '@mui/icons-material/Close';
import { useDispatch } from 'react-redux';
import { setCurrentPage, setSearchQuery } from 'src/redux/features/GuestSlice';

const SearchBar = ({ onSearch }) => {
  const [localSearch, setLocalSearch] = useState('');
  const dispatch = useDispatch();

  // Debounce search input
  useEffect(() => {
    const handler = setTimeout(() => {
      dispatch(setSearchQuery(localSearch));
      dispatch(setCurrentPage(1));
      if (onSearch) onSearch(localSearch);
    }, 500);

    return () => clearTimeout(handler);
  }, [localSearch, dispatch, onSearch]);

  const handleClear = () => {
    setLocalSearch('');
    dispatch(setSearchQuery(''));
    dispatch(setCurrentPage(1));
    if (onSearch) onSearch('');
  };

  const handleKeyPress = (event) => {
    if (event.key === 'Enter') {
      dispatch(setSearchQuery(localSearch));
      dispatch(setCurrentPage(1));
      if (onSearch) onSearch(localSearch);
    }
  };

  return (
    <Box
      sx={{
        width: '100%',
        maxWidth: 600,
        mb: 2,
        transition: 'all 0.3s ease',
        '&:hover': {
          transform: 'scale(1.02)',
        },
      }}
    >
      <TextField
        fullWidth
        variant="outlined"
        placeholder="Search guests by name, email, contact, or room..."
        value={localSearch}
        onChange={(e) => setLocalSearch(e.target.value)}
        onKeyDown={handleKeyPress}
        InputProps={{
          startAdornment: (
            <InputAdornment position="start">
              <SearchIcon color="primary" />
            </InputAdornment>
          ),
          endAdornment: localSearch && (
            <InputAdornment position="end">
              <IconButton
                onClick={handleClear}
                size="small"
                sx={{ '&:hover': { color: 'error.main' } }}
              >
                <CloseIcon fontSize="small" />
              </IconButton>
            </InputAdornment>
          ),
          sx: {
            backgroundColor: 'background.paper',
            boxShadow: 2,
            '&:hover': {
              boxShadow: 4,
            },
          },
        }}
        inputProps={{
          'aria-label': 'Search guests',
          style: {
            padding: '12px 20px',
            fontSize: '1rem',
          },
        }}
      />
    </Box>
  );
};

export default SearchBar;
