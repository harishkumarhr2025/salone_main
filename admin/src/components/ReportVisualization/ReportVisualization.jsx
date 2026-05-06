import { useEffect, useRef } from 'react';
import {
  BarChart,
  PieChart,
  Bar,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import {
  Box,
  Grid,
  Typography,
  Card,
  CardContent,
  useTheme,
  Chip,
  Button,
  Divider,
} from '@mui/material';
import MonetizationOnIcon from '@mui/icons-material/MonetizationOn';
import ReceiptIcon from '@mui/icons-material/Receipt';
import HotelIcon from '@mui/icons-material/Hotel';
import { useReactToPrint } from 'react-to-print';

import { alpha } from '@mui/material/styles';
import {
  Person as PersonIcon,
  NightShelter as RoomIcon,
  CalendarMonth as CalendarIcon,
} from '@mui/icons-material';
import PrintableGuestTable from '../PDF-Format/PrintableGuestTable/PrintableGuestTable';

// Enhanced color palette
const COLORS = [
  '#6366f1', // indigo
  '#10b981', // emerald
  '#f59e0b', // amber
  '#ef4444', // red
  '#8b5cf6', // purple
  '#3b82f6', // blue
];

const ReportVisualization = ({ report }) => {
  const theme = useTheme();
  const contentRef = useRef(null);
  const reactToPrintFn = useReactToPrint({ contentRef });
  // Reset scroll when new report comes in
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [report]);

  const safeReport = report || {
    total: 0,
    dailyData: [],
  };

  const { total, dailyData } = safeReport;

  console.log('report', report);

  // Process data for visualizations
  const processChartData = () => {
    if (!dailyData || !Array.isArray(dailyData)) return [];
    return dailyData.map((day) => ({
      date: day.date,
      count: day.count,
      guests: day.guests || [],
    }));
  };

  // Calculate distributions with safety checks
  const calculateDistribution = (key) => {
    const counts = {};
    dailyData?.forEach((day) => {
      day.guests?.forEach((guest) => {
        const value = guest[key];
        if (value) counts[value] = (counts[value] || 0) + 1;
      });
    });
    return Object.entries(counts).map(([name, value]) => ({ name, value }));
  };

  const getGuestDocuments = (guest = {}) => {
    const documents = [];
    const seenUrls = new Set();

    const addDocument = (label, url) => {
      if (!url || typeof url !== 'string') return;
      const cleanUrl = url.trim();
      if (!cleanUrl || seenUrls.has(cleanUrl)) return;
      seenUrls.add(cleanUrl);
      documents.push({ label, url: cleanUrl });
    };

    addDocument('ID Front', guest?.Guest_ID_Proof?.[0]?.imageUrl || guest?.aadharFront);
    addDocument('ID Back', guest?.Guest_ID_Proof?.[1]?.imageUrl || guest?.aadharBack);
    addDocument('Guest Photo', guest?.Guest_picture);

    if (Array.isArray(guest?.Guest_ID_Proof)) {
      guest.Guest_ID_Proof.forEach((proof, index) => {
        if (index < 2) return;
        addDocument(`Proof ${index + 1}`, proof?.imageUrl);
      });
    }

    return documents;
  };

  // Custom tooltip style
  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload) {
      return (
        <div
          style={{
            background: theme.palette.background.paper,
            padding: theme.spacing(1),
            border: `1px solid ${theme.palette.divider}`,
            borderRadius: theme.shape.borderRadius,
          }}
        >
          <Typography variant="body2">{label}</Typography>
          {payload.map((entry, index) => (
            <Typography key={index} variant="body2" style={{ color: entry.color }}>
              {`${entry.name}: ${entry.value}`}
            </Typography>
          ))}
        </div>
      );
    }
    return null;
  };

  if (!report) {
    return (
      <Box
        sx={{
          p: 3,
          textAlign: 'center',
          height: '50vh',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          color: theme.palette.text.secondary,
        }}
      >
        <Typography variant="h6">No report data available</Typography>
        <Typography variant="body2" sx={{ mt: 1 }}>
          Generate a report to view insights
        </Typography>
      </Box>
    );
  }

  if (total === 0) {
    return (
      <Box
        sx={{
          p: 3,
          textAlign: 'center',
          color: theme.palette.text.secondary,
        }}
      >
        <Typography variant="h6">No records found for selected criteria</Typography>
        <Typography variant="body2" sx={{ mt: 1 }}>
          Try adjusting your filters
        </Typography>
      </Box>
    );
  }

  const avgGuestsPerDay = total > 0 ? (total / dailyData.length).toFixed(1) : 0;

  return (
    <Box sx={{ p: 3 }}>
      {/* Summary Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        {[
          {
            title: 'Total Guests',
            value: total,
            icon: <PersonIcon fontSize="large" />,
            color: theme.palette.primary.main,
          },
          {
            title: 'Avg. Daily Guests',
            value: avgGuestsPerDay,
            icon: <RoomIcon fontSize="large" />,
            color: theme.palette.secondary.main,
          },
          {
            title: 'Days Booked',
            value: dailyData.length,
            icon: <CalendarIcon fontSize="large" />,
            color: theme.palette.success.main,
          },
        ].map((card, index) => (
          <Grid item xs={12} md={4} key={index}>
            <Card
              sx={{
                background: alpha(card.color, 0.1),
                borderLeft: `4px solid ${card.color}`,
                height: '100%',
              }}
            >
              <CardContent sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Box sx={{ color: card.color }}>{card.icon}</Box>
                <Box>
                  <Typography variant="h4" sx={{ fontWeight: 700 }}>
                    {card.value}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {card.title}
                  </Typography>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>
      <Box
        sx={{
          mt: 4,
          p: 3,
          borderRadius: 2,
          bgcolor: 'background.paper',
          boxShadow: theme.shadows[1],
        }}
      >
        <Box
          gutterBottom
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            paddingBottom: 3,
          }}
        >
          <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
            Guest Details
          </Typography>
          <Button variant="contained" color="primary" onClick={() => reactToPrintFn()}>
            Print
          </Button>
        </Box>
        <Box sx={{ maxHeight: 500, overflow: 'auto' }}>
          <div>
            <table
              style={{
                width: '100%',
                borderCollapse: 'collapse',
                fontFamily: 'Poppins',
              }}
            >
              <thead>
                <tr
                  style={{
                    backgroundColor: '#000000',
                    position: 'sticky',
                    top: 0,
                  }}
                >
                  {[
                    'Name',
                    'Contact',
                    'Room No.',
                    'Room Type',
                    'Check-In',
                    'Check-Out',
                    'Payment Type',
                    'Total Amount',
                    'Uploaded Files',
                  ].map((header, index) => (
                    <th
                      key={index}
                      style={{
                        padding: theme.spacing(2),
                        textAlign: 'left',
                        fontWeight: 600,
                        color: '#fff',
                      }}
                    >
                      {header}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {dailyData.flatMap((day) =>
                  day.guests.map((guest, index) => (
                    <tr
                      key={`${day.date}-${index}`}
                      textAlign={'center'}
                      style={{
                        borderBottom: `1px solid ${theme.palette.divider}`,
                        '&:hover': { background: theme.palette.action.hover },
                      }}
                    >
                      <td style={{ padding: theme.spacing(2) }}>{guest.Guest_name}</td>
                      <td style={{ padding: theme.spacing(2) }}>{guest.Contact_number}</td>
                      <td style={{ padding: theme.spacing(2), textAlign: 'center' }}>
                        {guest.Room_no}
                      </td>
                      <td style={{ padding: theme.spacing(2), textAlign: 'center' }}>
                        <Chip
                          label={guest.Room_type}
                          size="small"
                          sx={{
                            bgcolor: alpha(guest.Room_type === 'AC' ? COLORS[0] : COLORS[1], 0.1),
                            color: guest.Room_type === 'AC' ? COLORS[0] : COLORS[1],
                            border: `1px solid ${guest.Room_type === 'AC' ? COLORS[0] : COLORS[1]}`,
                          }}
                        />
                      </td>
                      <td style={{ padding: theme.spacing(2) }}>
                        {new Date(guest.Arrival_date).toLocaleDateString('en-IN')}
                      </td>
                      <td style={{ padding: theme.spacing(2) }}>
                        {guest.Checkout_date
                          ? new Date(guest.Checkout_date).toLocaleDateString('en-IN')
                          : 'Not checked out'}
                      </td>
                      <td style={{ padding: theme.spacing(2), textAlign: 'center' }}>
                        <Chip
                          label={guest.Payment_type}
                          color={guest.Payment_type === 'Cash' ? 'primary' : 'secondary'}
                          size="small"
                        />
                      </td>
                      <td
                        style={{ padding: theme.spacing(2), fontWeight: 500, textAlign: 'center' }}
                      >
                        {guest.grand_total ? `₹${guest.grand_total?.toLocaleString('en-IN')}` : '-'}
                      </td>
                      <td style={{ padding: theme.spacing(2), minWidth: 220 }}>
                        {getGuestDocuments(guest).length ? (
                          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                            {getGuestDocuments(guest).map((doc, docIndex) => (
                              <a
                                key={`${day.date}-${index}-${docIndex}`}
                                href={doc.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                style={{ textDecoration: 'none' }}
                              >
                                <img
                                  src={doc.url}
                                  alt={doc.label}
                                  title={doc.label}
                                  style={{
                                    width: 42,
                                    height: 42,
                                    objectFit: 'cover',
                                    borderRadius: 6,
                                    border: `1px solid ${theme.palette.divider}`,
                                  }}
                                />
                              </a>
                            ))}
                          </Box>
                        ) : (
                          '-'
                        )}
                      </td>
                    </tr>
                  )),
                )}
              </tbody>
            </table>
          </div>
        </Box>
      </Box>
      {/* Daily Arrivals Chart */}
      <Box
        sx={{
          mb: 4,
          p: 3,
          borderRadius: 2,
          bgcolor: 'background.paper',
          boxShadow: theme.shadows[1],
          marginTop: 10,
        }}
      >
        <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
          Daily Guest Arrivals
        </Typography>
        <ResponsiveContainer width="100%" height={400}>
          <BarChart data={processChartData()}>
            <CartesianGrid strokeDasharray="3 3" stroke={theme.palette.divider} />
            <XAxis dataKey="date" tick={{ fill: theme.palette.text.secondary }} />
            <YAxis
              tick={{ fill: theme.palette.text.secondary }}
              label={{
                value: 'Number of Guests',
                angle: -90,
                position: 'insideLeft',
                fill: theme.palette.text.primary,
              }}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend wrapperStyle={{ paddingTop: 20 }} />
            <Bar
              dataKey="count"
              name="Guest Arrivals"
              fill={theme.palette.primary.main}
              radius={[4, 4, 0, 0]}
            />
          </BarChart>
        </ResponsiveContainer>
      </Box>
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12}>
          <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
            Revenue Breakdown
          </Typography>
          <Box
            sx={{
              p: 3,
              borderRadius: 2,
              bgcolor: 'background.paper',
              boxShadow: theme.shadows[1],
              height: 400,

              display: 'flex',
              flexDirection: 'row',
            }}
          >
            <Grid item xs={12} md={4}>
              <Card
                sx={{
                  height: '100%',
                  bgcolor: 'background.paper',
                  boxShadow: theme.shadows[2],
                  transition: 'all 0.3s ease',
                  '&:hover': {
                    transform: 'translateY(-4px)',
                    boxShadow: theme.shadows[4],
                  },
                }}
              >
                <CardContent>
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                    {/* Total Revenue */}
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                      <Box
                        sx={{
                          p: 1.5,
                          bgcolor: alpha(theme.palette.success.main, 0.1),
                          borderRadius: '50%',
                          lineHeight: 0,
                        }}
                      >
                        <MonetizationOnIcon
                          sx={{
                            fontSize: 32,
                            color: theme.palette.success.main,
                          }}
                        />
                      </Box>
                      <Box>
                        <Typography variant="h5" sx={{ fontWeight: 600, lineHeight: 1.2 }}>
                          ₹{report.totalRevenue?.toLocaleString()}
                        </Typography>
                        <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                          Total Revenue
                        </Typography>
                      </Box>
                    </Box>

                    <Divider sx={{ my: 1 }} />

                    {/* Total GST */}
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                      <Box
                        sx={{
                          p: 1.5,
                          bgcolor: alpha(theme.palette.warning.main, 0.1),
                          borderRadius: '50%',
                          lineHeight: 0,
                        }}
                      >
                        <ReceiptIcon
                          sx={{
                            fontSize: 32,
                            color: theme.palette.warning.main,
                          }}
                        />
                      </Box>
                      <Box>
                        <Typography variant="h5" sx={{ fontWeight: 600, lineHeight: 1.2 }}>
                          ₹{report.totalGST?.toLocaleString()}
                        </Typography>
                        <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                          Total GST
                        </Typography>
                      </Box>
                    </Box>

                    <Divider sx={{ my: 1 }} />

                    {/* Total Room Rent */}
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                      <Box
                        sx={{
                          p: 1.5,
                          bgcolor: alpha(theme.palette.info.main, 0.1),
                          borderRadius: '50%',
                          lineHeight: 0,
                        }}
                      >
                        <HotelIcon
                          sx={{
                            fontSize: 32,
                            color: theme.palette.info.main,
                          }}
                        />
                      </Box>
                      <Box>
                        <Typography variant="h5" sx={{ fontWeight: 600, lineHeight: 1.2 }}>
                          ₹{report.totalRoomRent?.toLocaleString()}
                        </Typography>
                        <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                          Total Room Rent
                        </Typography>
                      </Box>
                    </Box>
                  </Box>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} md={8}>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={[
                      { name: 'Room Rent', value: report.totalRoomRent },
                      { name: 'GST', value: report.totalGST },
                      {
                        name: 'Total Revenue',
                        value: report.totalRevenue,
                      },
                    ]}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {['#3b82f6', '#f59e0b', ' #10b981'].map((color, index) => (
                      <Cell key={index} fill={color} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(value) => `₹${value.toLocaleString()}`}
                    contentStyle={{
                      background: theme.palette.background.paper,
                      border: `1px solid ${theme.palette.divider}`,
                      borderRadius: theme.shape.borderRadius,
                    }}
                  />

                  <Legend
                    wrapperStyle={{ paddingTop: 20 }}
                    formatter={(value) => (
                      <Typography variant="body2">
                        {value} (
                        {(
                          ((value === 'Total Revenue'
                            ? report.totalRevenue
                            : report[value === 'Room Rent' ? 'totalRoomRent' : 'totalGST']) /
                            report.totalRevenue) *
                          100
                        ).toFixed(1)}
                        %)
                      </Typography>
                    )}
                  />
                </PieChart>
              </ResponsiveContainer>
            </Grid>
          </Box>
        </Grid>
      </Grid>

      {/* Distribution Section */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        {[
          {
            title: 'Room Type Distribution',
            data: calculateDistribution('Room_type'),
            colors: [COLORS[0], COLORS[1]],
          },
          {
            title: 'Guest Type Distribution',
            data: calculateDistribution('Guest_type'),
            colors: [COLORS[2], COLORS[3]],
          },
        ].map((chart, index) => (
          <Grid item xs={12} md={6} key={index}>
            <Box
              sx={{
                p: 3,
                height: '100%',
                borderRadius: 2,
                bgcolor: 'background.paper',
                boxShadow: theme.shadows[1],
              }}
            >
              <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
                {chart.title}
              </Typography>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={chart.data}
                    cx="50%"
                    cy="50%"
                    innerRadius="60%"
                    outerRadius="80%"
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {chart.data.map((entry, index) => (
                      <Cell key={index} fill={chart.colors[index % chart.colors.length]} />
                    ))}
                  </Pie>
                  <Tooltip content={<CustomTooltip />} />
                  <Legend
                    wrapperStyle={{ paddingTop: 20 }}
                    formatter={(value) => <Typography variant="body2">{value}</Typography>}
                  />
                </PieChart>
              </ResponsiveContainer>
            </Box>
          </Grid>
        ))}
      </Grid>
      {/* Data Table */}
      <Box
        sx={{
          p: 3,
          borderRadius: 2,
          bgcolor: 'background.paper',
          boxShadow: theme.shadows[1],
        }}
      >
        <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
          Daily Breakdown
        </Typography>
        <Box
          sx={{
            maxHeight: 400,
            overflow: 'auto',
            border: `1px solid ${theme.palette.divider}`,
            borderRadius: 1,
          }}
        >
          <table
            style={{
              width: '100%',
              borderCollapse: 'collapse',
              fontFamily: 'Poppins',
            }}
          >
            <thead>
              <tr
                style={{
                  background: alpha(theme.palette.primary.main, 0.1),
                  position: 'sticky',
                  top: 0,
                }}
              >
                {['Date', 'Guests', 'Room Types', 'Guest Types'].map((header, index) => (
                  <th
                    key={index}
                    style={{
                      padding: theme.spacing(2),
                      textAlign: 'left',
                      fontWeight: 600,
                      color: theme.palette.text.primary,
                    }}
                  >
                    {header}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {dailyData.map((day, index) => (
                <tr
                  key={index}
                  style={{
                    borderBottom: `1px solid ${theme.palette.divider}`,
                    '&:hover': { background: theme.palette.action.hover },
                  }}
                >
                  <td
                    style={{
                      padding: theme.spacing(2),
                      color: theme.palette.text.primary,
                    }}
                  >
                    {day.date}
                  </td>
                  <td
                    style={{
                      padding: theme.spacing(2),
                      fontWeight: 500,
                    }}
                  >
                    {day.count}
                  </td>
                  <td style={{ padding: theme.spacing(2) }}>
                    <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                      {[
                        { type: 'AC', color: COLORS[0] },
                        { type: 'Non-AC', color: COLORS[1] },
                      ].map((room, i) => (
                        <Chip
                          key={i}
                          label={`${room.type}: ${
                            day.guests.filter((g) => g.Room_type === room.type).length
                          }`}
                          size="small"
                          sx={{
                            bgcolor: alpha(room.color, 0.1),
                            color: room.color,
                            border: `1px solid ${room.color}`,
                          }}
                        />
                      ))}
                    </Box>
                  </td>
                  <td style={{ padding: theme.spacing(2) }}>
                    <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                      {[
                        { type: 'Daily', color: COLORS[2] }, // Amber
                        { type: 'Monthly', color: COLORS[3] }, // Red
                      ].map((guestType, i) => (
                        <Chip
                          key={i}
                          label={`${guestType.type}: ${
                            day.guests.filter((g) => g.Guest_type === guestType.type).length
                          }`}
                          size="small"
                          sx={{
                            bgcolor: alpha(guestType.color, 0.1),
                            color: guestType.color,
                            border: `1px solid ${guestType.color}`,
                          }}
                        />
                      ))}
                    </Box>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Box>
      </Box>
      <div style={{ display: 'none' }}>
        <PrintableGuestTable
          ref={contentRef}
          dailyData={dailyData}
          totalRevenue={report.totalRevenue}
          totalGST={report.totalGST}
          totalRoomRent={report.totalRoomRent}
        />
      </div>
    </Box>
  );
};

export default ReportVisualization;
