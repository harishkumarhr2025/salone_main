import React, { useEffect, useState } from 'react';
import {
  AppBar,
  Toolbar,
  Typography,
  Grid,
  Card,
  CardContent,
  Chip,
  IconButton,
  Drawer,
  Tabs,
  Tab,
  Box,
  TextField,
  Button,
  styled,
  List,
  ListItem,
  ListItemText,
  LinearProgress,
  CircularProgress,
  Paper,
  AccordionDetails,
  AccordionSummary,
  Accordion,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from '@mui/material';
import {
  Search,
  Add,
  MeetingRoom,
  People,
  History,
  Close,
  CheckCircle,
  Edit,
  Delete,
  Download,
} from '@mui/icons-material';
import HotelIcon from '@mui/icons-material/Hotel';
import HistoryToggleOffIcon from '@mui/icons-material/HistoryToggleOff';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import EventIcon from '@mui/icons-material/Event';
import ExitToAppIcon from '@mui/icons-material/ExitToApp';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import EmailIcon from '@mui/icons-material/Email';
import IdentificationIcon from '@mui/icons-material/VerifiedUser';
import ScheduleIcon from '@mui/icons-material/Schedule';

import NotesIcon from '@mui/icons-material/Notes';
import { useDispatch, useSelector } from 'react-redux';
import Toast from 'react-hot-toast';

import AddRoomDialog from '../../components/AddRoomDialog/AddRoomDialog';
import {
  AddNewRoom,
  fetchAllRoom,
  getRoomGuests,
  fetchRoomHistory,
  deleteRoom,
  editRoom,
} from '../../redux/features/RoomSlice';
import DeleteModal from 'src/components/DeleteModal/DeleteModal';
import { canModifyRecords, canExportData } from '../../utils/permissions';
import { CSVLink } from 'react-csv';

// Styled components
const DashboardContainer = styled(Box)({
  backgroundColor: '#f5f6fa',
  minHeight: '100vh',
});

const RoomCard = styled(Card)(({ theme }) => ({
  transition: '0.3s',
  '&:hover': {
    transform: 'translateY(-5px)',
    boxShadow: theme.shadows[4],
  },
  cursor: 'pointer',
}));

const StatusChip = styled(Chip)({
  fontWeight: 'bold',
  textTransform: 'uppercase',
});

const DetailDrawer = styled(Drawer)(({ theme }) => ({
  '& .MuiDrawer-paper': {
    width: 600,
    padding: theme.spacing(3),
  },
}));

const DetailItem = ({ label, value, icon }) => (
  <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1.5 }}>
    <Box sx={{ color: 'action.active', mt: '2px' }}>{icon}</Box>
    <Box>
      <Typography variant="caption" color="text.secondary">
        {label}
      </Typography>
      <Typography
        variant="body2"
        component="div"
        sx={{
          wordBreak: 'break-word',
          lineHeight: 1.4,
          color: 'text.primary',
        }}
      >
        {value}
      </Typography>
    </Box>
  </Box>
);

const Room = () => {
  const [selectedRoom, setSelectedRoom] = useState(null);
  const [tabValue, setTabValue] = useState(0);
  const [searchText, setSearchText] = useState('');
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [roomToDelete, setRoomToDelete] = useState(null);
  const [selectedRoomToEdit, setSelectedRoomToEdit] = useState(null);

  const dispatch = useDispatch();

  const { isLoading, rooms, guests, roomHistory, occupiedBed } = useSelector((state) => ({
    isLoading: state.Room,
    rooms: state.Room.rooms,
    guests: state.Room.guests.guests,
    roomHistory: state.Room.roomHistory.history,
    user: state.Auth.user,
  }));
  const currentUser = useSelector((state) => state.Auth.user);
  const allowModify = canModifyRecords(currentUser);
  const allowExport = canExportData(currentUser);

  const getAllRoom = async () => {
    await dispatch(fetchAllRoom());
  };

  useEffect(() => {
    getAllRoom();
  }, []);

  const handleSaveRoom = async (roomData) => {
    try {
      let response;

      if (roomData._id) {
        if (!allowModify) {
          Toast.error('This account can only add new records.');
          return;
        }
        console.log('Updating room:', roomData);
        // Update existing room
        response = await dispatch(editRoom(roomData));

        Toast.success(response?.payload?.message || 'Room updated successfully!');
      } else {
        // Create new room
        response = await dispatch(AddNewRoom(roomData));
        Toast.success(response?.payload?.message || 'Room added successfully!');
      }
      await getAllRoom();
    } catch (error) {
      Toast.error(error.response?.data?.message || 'Operation failed');
    }
  };

  const handleDeleteRoom = async (room) => {
    try {
      if (!allowModify) {
        Toast.error('This account can only add new records.');
        return;
      }
      console.log('Deleting room:', room);
      const deleteResponse = await dispatch(deleteRoom(room._id));

      if (deleteResponse?.meta.requestStatus === 'fulfilled') {
        Toast.success(deleteResponse?.payload.message || 'Room deleted successfully!');
      } else if (deleteResponse?.meta.requestStatus === 'rejected') {
        Toast.error(deleteResponse.payload.message || 'Failed to delete room!');
      } else {
        Toast.error(deleteResponse.payload.message || 'Failed to delete room!');
      }
      await getAllRoom();
    } catch (error) {
      console.error('Error deleting room:', error);
    }
  };
  const handleEditRoom = async (room) => {
    try {
      if (!allowModify) {
        Toast.error('This account can only add new records.');
        return;
      }
      setSelectedRoomToEdit(room);
      setShowAddDialog(true);
    } catch (error) {
      console.error('Error updating room:', error);
    }
  };

  useEffect(() => {
    const fetchRoomGuestsAndHistory = async () => {
      if (selectedRoom?._id) {
        try {
          await dispatch(getRoomGuests(selectedRoom._id));
          await dispatch(fetchRoomHistory(selectedRoom._id));
        } catch (error) {
          console.error('Error fetching room guests:', error);
        }
      }
    };
    fetchRoomGuestsAndHistory();
  }, [selectedRoom?._id]);

  const groupRoomsByFloor = (rooms) => {
    const safeRoom = Array.isArray(rooms) ? rooms : [];

    return safeRoom?.reduce((acc, room) => {
      const floor = room.floor?.toString();
      if (!acc[floor]) {
        acc[floor] = [];
      }
      acc[floor].push(room);
      return acc;
    }, {});
  };

  const floorGroups = groupRoomsByFloor(rooms?.rooms || []);

  const sortedFloors = Object.keys(floorGroups || {})
    .map(Number)
    .sort((a, b) => a - b);

  const csvHeaders = [
    { label: 'Room Number', key: 'roomNumber' },
    { label: 'Room Type', key: 'roomType' },
    { label: 'Floor', key: 'floor' },
    { label: 'Capacity', key: 'capacity' },
    { label: 'Current Occupancy', key: 'currentOccupancy' },
    { label: 'Status', key: 'status' },
    { label: 'Beds', key: 'beds' },
  ];

  const csvData = (rooms?.rooms || []).map((room) => ({
    roomNumber: room.roomNumber,
    roomType: room.roomType,
    floor: room.floor,
    capacity: room.capacity,
    currentOccupancy: room.currentOccupancy,
    status: room.status,
    beds: room.beds?.map((bed) => `${bed.bedNumber}:${bed.status}`).join(' | ') || '',
  }));

  const getOrdinalSuffix = (number) => {
    if (number === 11 || number === 12 || number === 13) {
      return `${number}th`;
    }
    const lastDigit = number % 10;
    switch (lastDigit) {
      case 1:
        return `${number}st`;
      case 2:
        return `${number}nd`;
      case 3:
        return `${number}rd`;
      default:
        return `${number}th`;
    }
  };

  {
    isLoading && (
      <Box sx={{ p: 3, textAlign: 'center' }}>
        <CircularProgress size={28} />
      </Box>
    );
  }

  {
    !isLoading && sortedFloors.length === 0 && (
      <Box sx={{ p: 3, textAlign: 'center' }}>
        <Typography variant="body1">No rooms found</Typography>
      </Box>
    );
  }

  return (
    <DashboardContainer>
      <AppBar position="static" color="inherit">
        <Toolbar>
          <MeetingRoom sx={{ mr: 2 }} />
          <Typography variant="h6" sx={{ flexGrow: 1 }}>
            PG Room Management
          </Typography>

          {allowExport && (
            <CSVLink
              data={csvData}
              headers={csvHeaders}
              filename="room-management.csv"
              style={{ textDecoration: 'none' }}
            >
              <Button variant="outlined" startIcon={<Download />} sx={{ mr: 2 }}>
                Export CSV
              </Button>
            </CSVLink>
          )}

          <Button
            variant="contained"
            startIcon={<Add />}
            sx={{ ml: 2 }}
            onClick={() => setShowAddDialog(true)}
          >
            Add Room
          </Button>
        </Toolbar>
      </AppBar>

      {rooms?.totalRoom && (
        <Grid container spacing={3} sx={{ p: 3 }}>
          <Grid item xs={12} sm={6} md={3}>
            <Card
              sx={{
                backgroundColor: '#f8f9fa',
                borderRadius: 2,
                height: '100%',
                boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
              }}
            >
              <CardContent>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  {/* Total Rooms Section */}
                  <Box
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 2,
                      pb: 2,
                      borderBottom: '1px solid #dee2e6',
                    }}
                  >
                    <MeetingRoom sx={{ fontSize: 32, color: 'text.secondary' }} />
                    <Box>
                      <Typography variant="h4" fontWeight="bold" color="text.primary">
                        {rooms?.totalRoom}
                      </Typography>
                      <Typography variant="subtitle1" color="text.secondary">
                        Total Rooms
                      </Typography>
                    </Box>
                  </Box>

                  {/* Beds Overview Section */}
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                    <Typography variant="h6" sx={{ fontWeight: 600, color: 'text.primary' }}>
                      Beds Overview
                    </Typography>

                    {/* Total Beds */}
                    <Box
                      sx={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        p: 1.5,
                        bgcolor: 'background.paper',
                        borderRadius: 1,
                        boxShadow: '0 1px 2px rgba(0, 0, 0, 0.05)',
                      }}
                    >
                      <Typography variant="body2" color="text.secondary">
                        Total Beds
                      </Typography>
                      <Typography variant="body1" fontWeight={500}>
                        {rooms?.totalBed}
                      </Typography>
                    </Box>

                    {/* Status Breakdown */}
                    <Box
                      sx={{
                        display: 'grid',
                        gridTemplateColumns: '1fr 1fr',
                        gap: 2,
                        mt: 1,
                      }}
                    >
                      {/* Occupied */}
                      <Box
                        sx={{
                          p: 1.5,
                          bgcolor: '#fff5f5',
                          borderRadius: 1,
                          borderLeft: '4px solid #dc3545',
                        }}
                      >
                        <Typography variant="caption" color="text.secondary">
                          Occupied
                        </Typography>
                        <Typography variant="h6" fontWeight={600} color="#dc3545">
                          {rooms?.occupiedBed}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          ({((rooms?.occupiedBed / rooms?.totalBed) * 100 || 0).toFixed(1)}%)
                        </Typography>
                      </Box>

                      {/* Available */}
                      <Box
                        sx={{
                          p: 1.5,
                          bgcolor: '#e6f4ea',
                          borderRadius: 1,
                          borderLeft: '4px solid #28a745',
                        }}
                      >
                        <Typography variant="caption" color="text.secondary">
                          Available
                        </Typography>
                        <Typography variant="h6" fontWeight={600} color="#28a745">
                          {rooms?.vacantBed}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          ({((rooms?.vacantBed / rooms?.totalBed) * 100 || 0).toFixed(1)}%)
                        </Typography>
                      </Box>
                    </Box>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>
          {sortedFloors.map((floor) => {
            const floorRooms = floorGroups[floor.toString()] || []; // Handle undefined case

            return (
              <Grid item xs={12} key={floor}>
                <Box
                  sx={{
                    mb: 4,
                    p: 2,
                    backgroundColor: 'white',
                    borderRadius: 2,
                    boxShadow: 1,
                  }}
                >
                  <Typography variant="h6" sx={{ mb: 2 }}>
                    Floor {floor}
                  </Typography>

                  <Grid container spacing={3}>
                    {Array.isArray(floorRooms) &&
                      floorGroups[floor]
                        .sort((a, b) => parseInt(a.roomNumber) - parseInt(b.roomNumber))
                        .map((room) => (
                          <Grid item xs={12} sm={6} md={4} key={room.roomNumber}>
                            <RoomCard onClick={() => setSelectedRoom(room)}>
                              <CardContent sx={{ position: 'relative' }}>
                                <Box
                                  sx={{
                                    position: 'absolute',
                                    right: 8,
                                    bottom: 8,
                                    gap: 1,
                                    display: 'flex',
                                  }}
                                >
                                  {allowModify && (
                                    <>
                                      <IconButton
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          handleEditRoom(room);
                                        }}
                                        sx={{
                                          color: '#205781',
                                          '&:hover': {
                                            backgroundColor: '#205781',
                                            color: '#ffffff',
                                          },
                                        }}
                                      >
                                        <Edit fontSize="small" />
                                      </IconButton>
                                      <IconButton
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          setRoomToDelete(room);
                                        }}
                                        sx={{
                                          color: '#205781',
                                          '&:hover': {
                                            backgroundColor: '#205781',
                                            color: '#ffffff',
                                          },
                                        }}
                                      >
                                        <Delete fontSize="small" />
                                      </IconButton>
                                    </>
                                  )}
                                </Box>
                                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                                  <Typography variant="h6">{room.roomNumber}</Typography>
                                  <StatusChip
                                    label={
                                      room.currentOccupancy === 0
                                        ? 'vacant'
                                        : Number(room.currentOccupancy) < Number(room.capacity)
                                        ? 'Partially Occupied'
                                        : 'Full'
                                    }
                                    sx={{
                                      backgroundColor:
                                        room.currentOccupancy === 0
                                          ? '#4CAF50' // Green for Vacant
                                          : Number(room.currentOccupancy) < Number(room.capacity)
                                          ? '#FF9800' // Orange for Partially Occupied
                                          : '#F44336', // Red for Full
                                      color: '#fff', // White text for better contrast
                                      fontWeight: 600,
                                      borderRadius: '8px',
                                      padding: '4px 12px',
                                    }}
                                  />
                                </Box>

                                <Typography variant="body2" color="textSecondary" gutterBottom>
                                  {room.roomType}
                                </Typography>

                                <LinearProgress
                                  variant="determinate"
                                  value={(room.currentOccupancy / room.capacity) * 100}
                                  sx={{ height: 10, borderRadius: 5, mb: 2 }}
                                />

                                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                    <People fontSize="small" />
                                    <Typography variant="caption">
                                      {room.currentOccupancy}/{room.capacity} occupied
                                    </Typography>
                                  </Box>
                                </Box>
                              </CardContent>
                            </RoomCard>
                          </Grid>
                        ))}
                  </Grid>
                </Box>
              </Grid>
            );
          })}
        </Grid>
      )}

      {/* Room Detail Drawer */}
      <DetailDrawer
        anchor="right"
        open={!!selectedRoom}
        onClose={() => setSelectedRoom(null)}
        PaperProps={{ sx: { width: 600 } }}
      >
        {selectedRoom && (
          <>
            <Box
              sx={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                p: 2,
              }}
            >
              <Typography variant="h5">Room No. {selectedRoom.roomNumber}</Typography>
              <IconButton onClick={() => setSelectedRoom(null)}>
                <Close />
              </IconButton>
            </Box>
            <Tabs value={tabValue} onChange={(e, val) => setTabValue(val)} sx={{ mb: 2 }}>
              <Tab label="Details" icon={<MeetingRoom />} />
              <Tab label="Tenants" icon={<People />} />
              <Tab label="History" icon={<History />} />
            </Tabs>

            <Box sx={{ p: 3 }}>
              {tabValue === 0 && (
                <Grid container spacing={2}>
                  <Grid item xs={6}>
                    <Typography variant="subtitle1" gutterBottom sx={{ fontSize: 16 }}>
                      <span style={{ fontFamily: 'Poppins', fontSize: '16px', fontWeight: '600' }}>
                        Floor:{' '}
                      </span>
                      {getOrdinalSuffix(selectedRoom.floor)}
                    </Typography>
                    <Typography variant="subtitle1" gutterBottom mt={1}>
                      <span style={{ fontFamily: 'Poppins', fontSize: '16px', fontWeight: '600' }}>
                        Room Type:{' '}
                      </span>
                      {selectedRoom.roomType}
                    </Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }} mt={1}>
                      <People fontSize="small" />
                      <Typography
                        variant="caption"
                        sx={{ fontFamily: 'Poppins', fontSize: '14px' }}
                      >
                        {selectedRoom.currentOccupancy}/{selectedRoom.capacity} occupied
                      </Typography>
                    </Box>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography
                      variant="subtitle1"
                      gutterBottom
                      sx={{ fontFamily: 'Poppins', fontSize: '14px', fontWeight: '600' }}
                    >
                      Amenities
                    </Typography>
                    <List dense>
                      {selectedRoom.amenities.map((amenity) => {
                        return (
                          <ListItem key={amenity._id}>
                            <CheckCircle color="success" sx={{ mr: 1, fontSize: 22 }} />
                            <ListItemText
                              primary={
                                <span style={{ fontFamily: 'Poppins', fontSize: '14px' }}>
                                  {`${amenity.name} (${amenity.description})`}
                                </span>
                              }
                            />
                          </ListItem>
                        );
                      })}
                    </List>
                  </Grid>
                </Grid>
              )}

              {tabValue === 1 && (
                <Paper
                  sx={{
                    p: 3,
                    borderRadius: 2,
                    boxShadow: '0 8px 32px rgba(0,0,0,0.05)',
                    background: 'linear-gradient(to bottom right, #f8f9fd, #ffffff)',
                  }}
                >
                  {/* Header Section */}
                  <Box
                    sx={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      mb: 3,
                      borderBottom: '1px solid',
                      borderColor: 'divider',
                      pb: 2,
                    }}
                  >
                    <Typography variant="h6" sx={{ fontWeight: 600 }}>
                      🏨 Room {selectedRoom?.roomNumber} Guests
                    </Typography>
                    <Chip
                      label={`${guests.length} current guest${guests.length !== 1 ? 's' : ''}`}
                      color="primary"
                      variant="outlined"
                    />
                  </Box>

                  {/* Guest List */}
                  {guests.length === 0 ? (
                    <Box
                      sx={{
                        height: 200,
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        opacity: 0.8,
                      }}
                    >
                      <Typography variant="body1" color="text.secondary" sx={{ mb: 2 }}>
                        <HotelIcon sx={{ fontSize: 40, color: 'action.disabled' }} />
                      </Typography>
                      <Typography variant="body1" color="text.secondary">
                        No active guests in this room
                      </Typography>
                    </Box>
                  ) : (
                    <Box sx={{ position: 'relative' }}>
                      {/* Table Header */}
                      <Grid
                        container
                        sx={{
                          px: 1,
                          py: 1,
                          bgcolor: 'action.hover',
                          borderRadius: 1,
                          mb: 1,
                          typography: 'body2',
                          color: 'text.secondary',
                        }}
                      >
                        <Grid item xs={4}>
                          Guest Name
                        </Grid>
                        <Grid item xs={3}>
                          Contact
                        </Grid>
                        <Grid item xs={2}>
                          Bed No.
                        </Grid>
                        <Grid item xs={3}>
                          Check-in Date
                        </Grid>
                      </Grid>

                      {/* Guest Items */}
                      <List sx={{ pt: 0 }}>
                        {guests.map((guest) => (
                          <ListItem
                            key={guest._id}
                            sx={{
                              px: 2,
                              py: 1.5,
                              mb: 1,
                              borderRadius: 1,
                              transition: 'all 0.2s',
                              '&:hover': {
                                bgcolor: 'action.hover',
                                transform: 'translateX(4px)',
                              },
                            }}
                          >
                            <Grid container alignItems="center">
                              <Grid item xs={4}>
                                <Typography fontWeight={500}>{guest.Guest_name}</Typography>
                              </Grid>

                              <Grid item xs={3}>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                  {guest.Contact_number}
                                </Box>
                              </Grid>

                              <Grid item xs={2}>
                                <Chip
                                  label={guest.bedNumber}
                                  size="small"
                                  variant="outlined"
                                  style={{
                                    backgroundColor: '#4caf50',
                                    color: '#fff',
                                  }}
                                />
                              </Grid>

                              <Grid item xs={3}>
                                {new Date(guest.checkInDate).toLocaleDateString('en-IN', {
                                  year: 'numeric',
                                  month: 'short',
                                  day: 'numeric',
                                })}
                              </Grid>
                            </Grid>
                          </ListItem>
                        ))}
                      </List>
                    </Box>
                  )}
                </Paper>
              )}

              {tabValue === 2 && (
                <Paper
                  sx={{
                    p: 3,
                    borderRadius: 2,
                    boxShadow: '0 8px 32px rgba(0,0,0,0.05)',
                    background: 'linear-gradient(to bottom right, #f8f9fd, #ffffff)',
                  }}
                >
                  {/* Header with Statistics */}
                  <Box
                    sx={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',

                      flexWrap: 'wrap',
                      gap: 2,
                    }}
                  >
                    <Box>
                      <Typography variant="h6" sx={{ fontWeight: 600, mb: 0.5 }}>
                        📜 Room {selectedRoom?.roomNumber} History
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {`${selectedRoom?.currentOccupancy} currently occupied / ${selectedRoom?.beds?.length} beds`}
                      </Typography>
                    </Box>
                    <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
                      <Chip
                        label={`${roomHistory.length} entries`}
                        color="primary"
                        variant="outlined"
                        size="small"
                      />
                    </Box>
                  </Box>

                  {/* Timeline-style History */}
                  {roomHistory.length === 0 ? (
                    <Box
                      sx={{
                        height: 200,
                        mt: 2,
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        opacity: 0.8,
                      }}
                    >
                      <HistoryToggleOffIcon
                        sx={{ fontSize: 40, color: 'action.disabled', mb: 2 }}
                      />
                      <Typography variant="body1" color="text.secondary">
                        No historical data available
                      </Typography>
                    </Box>
                  ) : (
                    <Box
                      sx={{
                        maxHeight: 500,
                        overflow: 'auto',
                        mt: 2,
                        pr: 1,
                        '&::-webkit-scrollbar': { width: 6 },
                        '&::-webkit-scrollbar-thumb': {
                          backgroundColor: 'divider',
                          borderRadius: 3,
                        },
                      }}
                    >
                      {roomHistory.map((guest, index) => (
                        <Accordion
                          key={index}
                          disableGutters
                          elevation={0}
                          sx={{
                            mb: 1,
                            '&:before': { display: 'none' },
                            border: '1px solid',
                            borderColor: 'divider',
                            borderRadius: 1,
                          }}
                        >
                          <AccordionSummary
                            expandIcon={<ExpandMoreIcon />}
                            sx={{
                              bgcolor: 'background.paper',
                              borderRadius: 1,
                              '&:hover': { bgcolor: 'action.hover' },
                            }}
                          >
                            <Box
                              sx={{
                                width: '100%',
                                display: 'grid',
                                gridTemplateColumns: 'min-content 1fr auto auto',
                                gap: 3,
                                alignItems: 'center',
                              }}
                            >
                              {/* Timeline Dot */}
                              <Box
                                sx={{
                                  minWidth: 16,
                                  width: 16,
                                  height: 16,
                                  borderRadius: '50%',
                                  bgcolor: guest.checkOut ? 'success.main' : 'primary.main',
                                }}
                              />
                              {/* Guest Info */}
                              <Box>
                                <Typography fontWeight={500}>{guest.guest.name}</Typography>
                                <Typography variant="body2" color="text.secondary">
                                  {guest?.guest.contact}
                                </Typography>
                              </Box>

                              {/* Status Chip */}
                              <Chip
                                label={guest?.checkOut ? 'Checked Out' : 'Active'}
                                size="small"
                                sx={{
                                  bgcolor: guest.checkOut ? 'success.light' : 'primary.light',
                                  color: guest.checkOut ? 'success.dark' : 'primary.dark',
                                  width: 100,
                                }}
                              />
                            </Box>
                          </AccordionSummary>
                          <AccordionDetails sx={{ bgcolor: 'background.default', pt: 2 }}>
                            <Grid container spacing={3} sx={{ px: 2 }}>
                              {/* Personal Info Column */}
                              <Grid item xs={12} md={6}>
                                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                                  <DetailItem
                                    label="Aadhar Number"
                                    value={guest?.guest.aadhar || 'N/A'}
                                    icon={<IdentificationIcon fontSize="small" />}
                                  />
                                  <DetailItem
                                    label="Email Address"
                                    value={
                                      <Typography
                                        variant="body2"
                                        sx={{
                                          wordBreak: 'break-word',
                                          fontFamily: 'monospace',
                                          color: 'text.primary',
                                        }}
                                      >
                                        {guest?.guest.email || 'Not provided'}
                                      </Typography>
                                    }
                                    icon={<EmailIcon fontSize="small" />}
                                  />
                                  <DetailItem
                                    label="Duration"
                                    value={
                                      guest.durationDays ? `${guest.durationDays} days` : 'Ongoing'
                                    }
                                    icon={<ScheduleIcon fontSize="small" />}
                                  />
                                </Box>
                              </Grid>

                              {/* Stay Details Column */}
                              <Grid item xs={12} md={6}>
                                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                                    <EventIcon fontSize="small" color="action" />
                                    <Box>
                                      <Typography variant="caption" color="text.secondary">
                                        Check-in Date
                                      </Typography>
                                      <Typography variant="body2">
                                        {new Date(guest?.checkIn).toLocaleDateString(
                                          'en-IN',
                                          // DATE_FORMAT,
                                        )}
                                      </Typography>
                                    </Box>
                                  </Box>

                                  {guest.checkOut ? (
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                                      <ExitToAppIcon fontSize="small" color="action" />
                                      <Box>
                                        <Typography variant="caption" color="text.secondary">
                                          Check-out Date
                                        </Typography>
                                        <Typography variant="body2">
                                          {new Date(guest.checkOut).toLocaleDateString(
                                            'en-IN',
                                            // DATE_FORMAT,
                                          )}
                                        </Typography>
                                      </Box>
                                    </Box>
                                  ) : (
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                                      <AccessTimeIcon fontSize="small" color="action" />
                                      <Box>
                                        <Typography variant="caption" color="text.secondary">
                                          Current Status
                                        </Typography>
                                        <Typography variant="body2" color="success.main">
                                          Active Stay
                                        </Typography>
                                      </Box>
                                    </Box>
                                  )}
                                  <DetailItem
                                    label="Special Remarks"
                                    value={guest.remarks || 'No remarks'}
                                    icon={<NotesIcon fontSize="small" />}
                                  />
                                </Box>
                              </Grid>
                            </Grid>
                          </AccordionDetails>{' '}
                        </Accordion>
                      ))}
                    </Box>
                  )}
                </Paper>
              )}
            </Box>
          </>
        )}
      </DetailDrawer>
      <AddRoomDialog
        open={showAddDialog}
        onClose={() => {
          setShowAddDialog(false);
          setSelectedRoomToEdit(null);
        }}
        onSave={handleSaveRoom}
        selectedRoomToEdit={selectedRoomToEdit}
      />

      <Dialog open={allowModify && !!roomToDelete} onClose={() => setRoomToDelete(null)}>
        <DialogTitle>Confirm Delete</DialogTitle>
        <DialogContent>
          <Typography>Are you sure you want to delete room {roomToDelete?.roomNumber}?</Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setRoomToDelete(null)}>Cancel</Button>
          <Button
            onClick={() => {
              handleDeleteRoom(roomToDelete);
              setRoomToDelete(null);
            }}
            color="error"
          >
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </DashboardContainer>
  );
};

export default Room;
