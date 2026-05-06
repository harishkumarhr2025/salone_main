import React, { useRef, forwardRef } from 'react';
import {
  Box,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Grid,
  Card,
  CardContent,
} from '@mui/material';

const MonthlyRevenueReport = forwardRef(
  ({ filteredDays, totals, monthName, selectedYear }, ref) => {
    return (
      <Box
        ref={ref}
        sx={{
          //   p: 2,
          '@media print': {
            paddingLeft: '3cm',
            paddingRight: '3cm',
            paddingTop: '1.5cm',
            fontSize: '14pt',
            '& .compact-table': {
              fontSize: '14pt',
            },
          },
        }}
      >
        {/* Header */}
        <Box sx={{ textAlign: 'center', mb: 2 }}>
          <Typography
            variant="h5"
            sx={{
              fontWeight: 'bold',
              color: '#000',
              mb: 1,
              '@media print': { fontSize: '14pt' },
            }}
          >
            Monthly Salon Revenue Report
          </Typography>
          <Typography variant="subtitle1" sx={{ color: '#666' }}>
            {monthName} {selectedYear}
          </Typography>
        </Box>

        {/* Table */}
        <TableContainer>
          <Table
            sx={{
              minWidth: 650,
              border: '1px solid #ddd',
              '& .MuiTableCell-root': {
                border: '1px solid #ddd',
                padding: '13px',
                '@media print': {
                  padding: '10px',
                  fontSize: '13pt',
                },
              },
            }}
          >
            <TableHead sx={{ backgroundColor: '#f5f5f5' }}>
              <TableRow>
                {['SL No', 'Date', 'Day', 'Cash(₹)', 'UPI(₹)', 'Tips(₹)', 'Total(₹)'].map(
                  (header) => (
                    <TableCell
                      key={header}
                      align="center"
                      sx={{
                        fontWeight: 'bold',
                        color: '#000',
                        backgroundColor: '#f5f5f5 !important',
                      }}
                    >
                      {header}
                    </TableCell>
                  ),
                )}
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredDays.map((day, index) => (
                <TableRow key={day.date}>
                  <TableCell align="center">{index + 1}</TableCell>
                  <TableCell align="center">{day.date}</TableCell>
                  <TableCell align="center">{day.day}</TableCell>
                  <TableCell align="center">{day.cash.toLocaleString()}</TableCell>
                  <TableCell align="center">{day.upi.toLocaleString()}</TableCell>
                  <TableCell align="center">{day.tips.toLocaleString()}</TableCell>
                  <TableCell align="center" sx={{ fontWeight: 'bold' }}>
                    {day.total.toLocaleString()}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>

        {/* Summary Cards - Adjusted for single page */}
        <Grid
          container
          spacing={1}
          sx={{
            mt: 2,
            '@media print': {
              marginTop: '8px',
            },
          }}
        >
          {[
            { label: 'Total Cash', value: totals.cash },
            { label: 'Total UPI', value: totals.upi },
            { label: 'Total Tips', value: totals.tips },
            { label: 'Grand Total', value: totals.total },
          ].map((item, index) => (
            <Grid item xs={3} key={item.label}>
              <Card
                variant="outlined"
                sx={{
                  border: '1px solid #ddd',
                  boxShadow: 'none',
                  borderRadius: '4px',
                  backgroundColor: 'transparent',
                }}
              >
                <CardContent sx={{ padding: '8px !important' }}>
                  <Typography
                    variant="subtitle2"
                    sx={{
                      color: '#666',
                      fontSize: '1rem',
                      '@media print': { fontSize: '12pt' },
                    }}
                  >
                    {item.label}
                  </Typography>
                  <Typography
                    variant="h6"
                    sx={{
                      fontWeight: 'bold',
                      color: '#000',
                      fontSize: '1rem',
                      '@media print': { fontSize: '12pt' },
                    }}
                  >
                    ₹{item.value.toLocaleString()}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
        <Typography
          variant="body2"
          sx={{
            textAlign: 'right',
            color: '#666',
            fontSize: '0.9rem',
            mt: 2,
            '@media print': { fontSize: '12pt' },
          }}
        >
          Printed at: {new Date().toLocaleString()}
        </Typography>
      </Box>
    );
  },
);

export default MonthlyRevenueReport;
