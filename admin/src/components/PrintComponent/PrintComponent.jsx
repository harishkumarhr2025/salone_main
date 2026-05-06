import React, { forwardRef, useEffect } from 'react';
import { Box, Typography, Grid, Paper, Avatar, List, ListItem, ListItemText } from '@mui/material';
import dayjs from 'dayjs';
import { styled } from '@mui/material/styles';

const DetailItem = ({ label, value, multiline = false }) => (
  <Box sx={{ mb: 1, p: 0.5, backgroundColor: '#f8f9fa', borderRadius: 1 }}>
    <Typography variant="subtitle2" color="textSecondary" sx={{ fontWeight: 800 }}>
      {label}:
    </Typography>
    {multiline ? (
      <Typography variant="body1" sx={{ whiteSpace: 'pre-line', color: '#2d3436' }}>
        {value}
      </Typography>
    ) : (
      <Typography variant="body1" sx={{ color: '#2d3436' }}>
        {value || '-'}
      </Typography>
    )}
  </Box>
);

const PrintComponent = forwardRef(({ guest }, ref) => {
  const policies = [
    "Money, jewels, and other valuables are brought to the property Likeme Salon premises at the guest's sole risk. The property Likeme Salon and/or the management accept no liability and shall not be responsible for any loss or damage thereto, and guests remain solely responsible for the safekeeping of any such items.",
    'Smoking, Consumption / stocking of alcoholic drinks, Drugs, Gambling, illegal activities are strictly prohibited.',
    'Pets are not allowed in the premises.',
    'Playing loud music, shouting, quarrelling, etc. is strictly prohibited.',
    'Damaging the property, furniture, fittings, etc. is strictly prohibited.',
    'Violators will be fined rupees 1000 and will be asked to vacate the premises immediately.',
    'Guests are requested to keep the premises clean and tidy.',
    'Spitting Gutka or Pan inside Washbasin / wall / passages / staircase is strictly prohibited.',
    'Rooms are meant only for the use of Residents of that particular room.',
    'Visitors (friends/relatives/business people) are not allowed to enter any rooms.',
    'Functions or celebrations / any events are not allowed in the premises.',
    'Cloth washing inside the room / bathroom is not allowed.',
    'Self cooking inside the room / property is not allowed.',
    'Before checkout, Guest must pay all dues and hand over the charges of rooms and other material in satisfactory condition to the Management of the premises.',
    'Guest accommodation will be cancelled if incomplete or false information is furnished.',
    'Management reserves its right to cancel admission of undeserving guests without giving any reason.',
  ];

  useEffect(() => {
    if (guest?.Guest_name) {
      const originalTitle = document.title;
      document.title = `${guest?.Guest_name} Registration`;
      return () => {
        document.title = originalTitle;
      };
    }
  }, [guest?.Guest_name]);

  return (
    <div ref={ref} style={{ padding: '5px 10px' }}>
      <style>
        {`
        @media print {
           body { margin: 0; padding: 2px; -webkit-print-color-adjust: exact; }
           @page { size: A4; margin: 2mm; }
         }
       `}
      </style>

      <Paper elevation={3} sx={{ padding: 3, backgroundColor: '#f8f9fa' }}>
        {/* Header Section */}
        <Box
          sx={{
            textAlign: 'center',
            mb: 4,
            padding: 3,
            backgroundColor: '#FFFFFF',
            color: '#000000',
            borderRadius: 2,
            border: '2px solid #000000',
          }}
        >
          <Typography variant="h4" gutterBottom>
            Likeme Salon
          </Typography>
          <Typography variant="subheading1" gutterBottom sx={{ display: 'block' }}>
            No 8, Platform Road, Seshadripuram, Bengaluru - 560020, Karnataka, India
          </Typography>
          <Typography variant="subheading1">
            Phone: 9900064328 | Email: contact@likemesalon.com
          </Typography>
          <Typography variant="body1">Official Guest Registration Copy</Typography>
        </Box>

        {/* Main Content Grid */}
        <Grid container spacing={3}>
          {/* Left Column */}
          <Grid item xs={8}>
            <Grid container spacing={2}>
              {/* Personal Info */}
              <Grid item xs={6}>
                <SectionHeader title="Personal Information" />
                <DetailItem label="Full Name" value={guest?.Guest_name} />
                <DetailItem label="Contact Number" value={guest?.Contact_number} />
                <DetailItem label="Emergency Contact" value={guest?.Emergency_number} />
                <DetailItem label="Email Address" value={guest?.Guest_email} />
                <DetailItem label="Address" value={guest?.Guest_address} multiline />
                <DetailItem label="Profession" value={guest?.Profession_type} />
              </Grid>

              {/* Stay Details */}
              <Grid item xs={6}>
                <SectionHeader title="Stay Details" />
                <DetailItem
                  label="Check-in Date/Time"
                  value={dayjs(guest?.Arrival_date).format('DD MMM YYYY, hh:mm A')}
                />
                <DetailItem label="Room Number" value={guest?.Room_no} />
                <DetailItem label="Room Type" value={guest?.Room_type} />

                <DetailItem label="Guest Type" value={guest?.Guest_type} />
                <Grid container spacing={2}>
                  <Grid item xs={4}>
                    <DetailItem label="Adults" value={guest?.Adults} />
                  </Grid>
                  <Grid item xs={4}>
                    <DetailItem label="Children" value={guest?.Children} />
                  </Grid>
                </Grid>
                <Grid container spacing={2}>
                  <Grid item xs={4}>
                    <DetailItem label="Nationality" value={guest?.Guest_nationality} />
                  </Grid>
                </Grid>
              </Grid>

              {/* Occupancy & Purpose */}
              <Grid item xs={12}>
                <SectionHeader title="Other information" />
                {/* <Grid container spacing={2}> */}
                {/* <Grid item xs={4}> */}
                <div style={{ display: 'flex', gap: '20px' }}>
                  <DetailItem label="Visit Purpose" value={guest?.Purpose_of_visit} />
                  <DetailItem label="Booking Details" value={guest?.Booking_details} />
                </div>
              </Grid>
              {/* </Grid> */}
              {/* </Grid> */}
            </Grid>
          </Grid>

          {/* Right Column */}
          <Grid item xs={4}>
            {/* Profile Section */}
            <Box
              sx={{
                p: 2,
                border: '2px solid #e0e0e0',
                borderRadius: 2,
                backgroundColor: 'white',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Avatar
                src={guest?.Guest_picture}
                sx={{
                  width: 120,
                  height: 120,
                  mb: 2,
                  border: '2px solid #2d3436',
                }}
              />
              <DetailItem label="Aadhar Number" value={guest?.Guest_aadhar_No} />
            </Box>

            {/* Payment Info */}
            <Box sx={{ mt: 3, p: 2, backgroundColor: 'white', borderRadius: 2 }}>
              <SectionHeader title="Payment Details" />
              <DetailItem label="Payment Mode" value={guest?.Payment_type} />
              <DetailItem label="Room Tariff" value={`₹${guest?.Room_tariff}/day`} />
            </Box>
          </Grid>
        </Grid>

        {/* Aadhar Section */}
        <Box
          sx={{
            p: 3,
            backgroundColor: 'white',
            borderRadius: 2,
            border: '1px solid #e0e0e0',
          }}
        >
          {/* <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
            Guest ID
          </Typography> */}
          <Grid container spacing={2}>
            {guest?.Guest_ID_Proof?.map((proof, index) => (
              <Grid item xs={6} key={index}>
                <Box
                  sx={{
                    p: 1,
                    border: '1px solid #e0e0e0',
                    borderRadius: 1,
                  }}
                >
                  <img
                    src={proof?.imageUrl}
                    alt={`Aadhar ${index === 0 ? 'Front' : 'Back'}`}
                    style={{
                      width: '100%',
                      borderRadius: 4,
                    }}
                  />
                </Box>
              </Grid>
            ))}
          </Grid>
        </Box>

        {/* Footer */}
        <Box
          sx={{
            mt: 4,
            pt: 2,
            borderTop: '2px solid #e0e0e0',
            textAlign: 'center',
          }}
        >
          <Typography variant="body2" color="textSecondary">
            Generated at: {dayjs().format('DD MMM YYYY hh:mm A')}
          </Typography>
        </Box>
      </Paper>
      <Box>
        <Typography variant="h6" gutterBottom sx={{ mt: 4, fontWeight: 600, textAlign: 'center' }}>
          Terms and Conditions:
        </Typography>

        <List>
          {policies.map((policy, index) => (
            <ListItem key={index} alignItems="flex-start">
              <ListItemText primary={`${index + 1}. ${policy}`} />
            </ListItem>
          ))}
        </List>
      </Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', padding: 2 }}>
        <Typography variant="h6" gutterBottom sx={{ mt: 4, fontWeight: 600 }}>
          Guest Signature:
        </Typography>
        <Typography variant="h6" gutterBottom sx={{ mt: 4, fontWeight: 600 }}>
          Incharge Signature:
        </Typography>
      </Box>
    </div>
  );
});

// Reusable Section Header Component

// Styled Components

const SectionHeader = ({ title }) => (
  <Typography
    variant="subtitle1"
    sx={{
      mb: 2,
      paddingBottom: 1,
      borderBottom: '2px solid #2d3436',
      color: '#2d3436',
      fontWeight: 600,
    }}
  >
    {title}
  </Typography>
);

export default PrintComponent;
