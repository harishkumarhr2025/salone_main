import { useEffect, useState } from 'react';
import { Box, Button, Typography } from '@mui/material';
import { useDispatch, useSelector } from 'react-redux';
import { setCurrentPage } from 'src/redux/features/GuestSlice';

const PaginationControl = ({ currentPage, totalPages, onPageChange }) => {
  const dispatch = useDispatch();
  const { allGuests, successMessage, errorMessage, isLoading, pagination } = useSelector(
    (state) => state.Guest,
  );

  const handlePageChange = (newPage) => {
    dispatch(setCurrentPage(newPage));
  };

  return (
    <Box sx={{ display: 'flex', justifyContent: 'center', mt: 3, gap: 1 }}>
      <Button
        variant="outlined"
        disabled={pagination.page === 1 || isLoading}
        onClick={() => handlePageChange(pagination.page - 1)}
      >
        Previous
      </Button>

      <Typography sx={{ mx: 2, alignSelf: 'center' }}>
        Page {pagination.page} of {pagination.totalPages}
      </Typography>

      <Button
        variant="outlined"
        disabled={pagination.page >= pagination.totalPages || isLoading}
        onClick={() => handlePageChange(pagination.page + 1)}
      >
        Next
      </Button>
    </Box>
  );
};

export default PaginationControl;
