import {
  BarChart,
  Bar,
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
  Avatar,
  Stack,
  useMediaQuery,
  alpha,
  Divider,
} from '@mui/material';
import {
  People as CustomersIcon,
  AttachMoney as RevenueIcon,
  Work as StaffIcon,
  Spa as ServicesIcon,
  Person,
} from '@mui/icons-material';
import PhoneIcon from '@mui/icons-material/Phone';
import FormatListNumberedIcon from '@mui/icons-material/FormatListNumbered';
import AttachMoneyIcon from '@mui/icons-material/AttachMoney';
import { useSelector, useDispatch } from 'react-redux';
import { useEffect } from 'react';
import { get } from 'lodash';
import { fetchAllEmployee } from 'src/redux/features/EMS/EmployeeSlice';

const COLORS = ['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#3b82f6'];

const SalonReportVisualization = ({ report = {} }) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const dispatch = useDispatch();

  const { success, employee, message } = useSelector((state) => state.Employee.employees);

  console.log('Report Data:', report);
  console.log('Employee Data:', employee);

  useEffect(() => {
    dispatch(fetchAllEmployee());
  }, [dispatchEvent]);

  const getStaffName = (staffId) => {
    if (!staffId) return 'Unassigned';
    if (!employee || employee.length === 0) return 'Loading staff...';

    const staff = employee.find((emp) => emp._id === staffId);

    // Fallback to ID if name not found
    // return staff?.employeeName || `Staff (${staffId.slice(0, 6)}...)`;
    return staff?.employeeName;
  };
  const ServiceTooltip = ({ active, payload }) => {
    console.log('Tooltip Payload:', payload);
    if (active && payload?.length) {
      const service = payload[0].payload;
      return (
        <Box
          sx={{
            bgcolor: 'background.paper',
            p: 2,
            borderRadius: 2,
            boxShadow: 3,
            border: `1px solid ${alpha(theme.palette.primary.main, 0.1)}`,
            minWidth: 280,
          }}
        >
          {/* Header Section */}
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 2,
              mb: 2,
              pb: 1,
              borderBottom: `1px solid ${theme.palette.divider}`,
            }}
          >
            <Avatar
              sx={{
                bgcolor: theme.palette.primary.main,
                color: theme.palette.primary.contrastText,
                width: 32,
                height: 32,
              }}
            >
              {service.category[0]}
            </Avatar>
            <Box>
              <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                {service.category}
              </Typography>
              <Chip
                label={service.serviceName}
                size="small"
                sx={{
                  bgcolor: alpha(theme.palette.secondary.main, 0.1),
                  color: theme.palette.secondary.main,
                  fontSize: '0.65rem',
                  height: 20,
                }}
              />
              <Chip
                label={service.varient}
                size="small"
                sx={{
                  bgcolor: alpha(theme.palette.primary.main, 0.1),
                  color: theme.palette.secondary.main,
                  fontSize: '0.65rem',
                  height: 20,
                }}
              />
            </Box>
          </Box>

          {/* Details Grid */}
          <Grid container spacing={1}>
            <DetailItem
              icon={<AttachMoneyIcon fontSize="small" />}
              label="Price"
              value={`₹${service.totalRevenue / service.count}`}
            />
            <DetailItem
              icon={<FormatListNumberedIcon fontSize="small" />}
              label="Count"
              value={service.count}
            />
            <DetailItem
              icon={<AttachMoneyIcon fontSize="small" />}
              label="Revenue"
              value={`₹${service.totalRevenue?.toLocaleString()}`}
            />
            <DetailItem
              icon={<Person fontSize="small" />}
              label="Staff"
              value={
                <Chip
                  label={`Staff ${service.staff}`}
                  size="small"
                  avatar={<Avatar sx={{ width: 20, height: 20 }}>{service.staff}</Avatar>}
                  sx={{ bgcolor: alpha(theme.palette.info.main, 0.1) }}
                />
              }
            />
          </Grid>
        </Box>
      );
    }
    return null;
  };

  const CustomTick = ({ x, y, payload, index }) => {
    const item = report.serviceDistribution[index];
    return (
      <g transform={`translate(${x},${y})`}>
        <text
          x={0}
          y={0}
          dy={20} // Adjust vertical position
          textAnchor="end"
          fill="#666"
          transform="rotate(-45)"
          style={{ fontSize: 12 }}
        >
          <tspan x="0" dy="0">
            {item.category}
          </tspan>
          <tspan x="0" dy="16">
            {item.serviceName}
          </tspan>
          <tspan x="0" dy="16" style={{ fill: '#999' }}>
            ({item.varient})
          </tspan>
        </text>
      </g>
    );
  };

  const DetailItem = ({ icon, label, value }) => (
    <Grid item xs={6} sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
      <Box
        sx={{
          bgcolor: alpha(theme.palette.primary.main, 0.1),
          p: 0.5,
          borderRadius: 1,
          display: 'flex',
          alignItems: 'center',
        }}
      >
        {icon}
      </Box>
      <Box>
        <Typography variant="caption" sx={{ color: 'text.secondary', lineHeight: 1 }}>
          {label}
        </Typography>
        <Typography variant="body2" sx={{ fontWeight: 500, lineHeight: 1.2 }}>
          {value}
        </Typography>
      </Box>
    </Grid>
  );

  return (
    <Box sx={{ p: isMobile ? 1 : 3 }}>
      {/* Summary Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        {[
          {
            title: 'Total Customers',
            value: report.summary?.totalCustomers || 0,
            icon: <CustomersIcon fontSize="large" />,
            color: theme.palette.primary.main,
          },
          {
            title: 'Total Services',
            value: report.summary?.totalServices || 0,
            icon: <ServicesIcon fontSize="large" />,
            color: theme.palette.warning.main,
          },
          {
            title: 'Total Revenue',
            value: report.summary?.totalRevenue || 0,
            icon: <RevenueIcon fontSize="large" />,
            color: theme.palette.success.main,
            isCurrency: true,
          },
          {
            title: 'Staff Involved',
            value: report.staffDistribution?.length || 0,
            icon: <StaffIcon fontSize="large" />,
            color: theme.palette.error.main,
          },
        ].map((card, index) => (
          <Grid item xs={12} md={3} key={index}>
            <Card sx={{ bgcolor: alpha(card.color, 0.1), borderLeft: `4px solid ${card.color}` }}>
              <CardContent sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Box sx={{ color: card.color }}>{card.icon}</Box>
                <Box>
                  <Typography variant="h4" sx={{ fontWeight: 700 }}>
                    {card.isCurrency ? '₹' : ''}
                    {card.value?.toLocaleString()}
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

      {/* Customer Details */}
      <Box sx={{ mb: 4, p: 3, bgcolor: 'background.paper', borderRadius: 2 }}>
        <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
          Customer Details
        </Typography>
        <Box sx={{ maxHeight: 500, overflow: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: alpha(theme.palette.primary.main, 0.1) }}>
                {['Customer', 'Total Services', 'Total Revenue', 'Services Availed'].map(
                  (header, index) => (
                    <th
                      key={index}
                      style={{ padding: '12px', textAlign: 'center', fontWeight: 600 }}
                    >
                      {header}
                    </th>
                  ),
                )}
              </tr>
            </thead>
            <tbody>
              {report.customerDistribution?.map((customer, index) => {
                const servicesAvailed = report.serviceDistribution?.filter((service) =>
                  service.customers.some((c) => c.customerId === customer.customerId),
                );
                console.log('servicesAvailed:', servicesAvailed);
                return (
                  <tr key={index} style={{ borderBottom: `1px solid ${theme.palette.divider}` }}>
                    <td style={{ padding: '12px' }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                        <Avatar
                          sx={{
                            bgcolor: theme.palette.primary.main,
                            width: 32,
                            height: 32,
                            fontSize: '0.875rem',
                            fontWeight: 500,
                          }}
                        >
                          {customer.customerName?.[0] || '?'}
                        </Avatar>
                        <Box>
                          <Typography variant="body2" sx={{ fontWeight: 600 }}>
                            {customer.customerName || 'N/A'}
                          </Typography>
                          <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                            {customer.mobileNumber}
                          </Typography>
                        </Box>
                      </Box>
                    </td>

                    <td style={{ padding: '12px', textAlign: 'center' }}>
                      <Chip
                        label={customer.totalServices}
                        sx={{
                          bgcolor: alpha(theme.palette.info.main, 0.1),
                          color: theme.palette.info.dark,
                          fontWeight: 600,
                        }}
                      />
                    </td>
                    <td style={{ padding: '12px', textAlign: 'center' }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <AttachMoneyIcon fontSize="small" color="success" />
                        <Typography variant="body2" sx={{ fontWeight: 600 }}>
                          ₹{customer.totalRevenue?.toLocaleString()}
                        </Typography>
                      </Box>
                    </td>
                    <td style={{ padding: '12px', textAlign: 'center' }}>
                      <Stack direction="row" gap={1} flexWrap="wrap">
                        {servicesAvailed?.map((service, sIdx) => (
                          <Chip
                            key={sIdx}
                            label={
                              <Box
                                sx={{
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: 0.5,
                                }}
                              >
                                <span>{`${service.category} - ${service.serviceName}`}</span>
                                <Chip
                                  label={service.varient}
                                  size="small"
                                  sx={{
                                    bgcolor: alpha(theme.palette.secondary.main, 0.1),
                                    color: theme.palette.secondary.dark,
                                    height: 18,
                                    fontSize: '0.6rem',
                                  }}
                                />
                              </Box>
                            }
                            size="small"
                            sx={{
                              bgcolor: alpha(theme.palette.primary.main, 0.08),
                              border: `1px solid ${alpha(theme.palette.primary.main, 0.2)}`,
                              borderRadius: '6px',
                              pr: 0.5,
                              '& .MuiChip-label': {
                                display: 'flex',
                                alignItems: 'center',
                                gap: 0.5,
                              },
                            }}
                          />
                        ))}
                      </Stack>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </Box>
      </Box>

      {/* Tips Section */}
      <Box sx={{ mb: 4, p: 3, bgcolor: 'background.paper', borderRadius: 2 }}>
        <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
          Tips Distribution
        </Typography>
        <Grid container spacing={3}>
          {report.tipTransactions?.map((staffTip, index) => (
            <Grid item xs={12} md={6} key={index}>
              <Card
                sx={{
                  borderLeft: `4px solid ${COLORS[index % COLORS.length]}`,
                  boxShadow: theme.shadows[1],
                  '&:hover': { boxShadow: theme.shadows[3] },
                  transition: 'all 0.2s ease',
                }}
              >
                <CardContent>
                  {/* Staff Header */}
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                    <Avatar
                      sx={{
                        bgcolor: COLORS[index % COLORS.length],
                        width: 40,
                        height: 40,
                      }}
                    >
                      {getStaffName(staffTip.staff)?.[0] || '?'}
                    </Avatar>
                    <Box>
                      <Typography variant="h6" sx={{ fontWeight: 600 }}>
                        {getStaffName(staffTip.staff) || 'Unassigned'}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Total Tips: ₹{staffTip.totalTips?.toLocaleString()}
                      </Typography>
                    </Box>
                  </Box>

                  <Divider sx={{ my: 2 }} />

                  {/* Individual Tips */}
                  <Typography variant="subtitle2" sx={{ mb: 2 }}>
                    Individual Transactions:
                  </Typography>
                  <Box sx={{ maxHeight: 300, overflow: 'auto' }}>
                    {staffTip.tips?.map((tip, tipIndex) => (
                      <Box
                        key={tipIndex}
                        sx={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 2,
                          p: 1.5,
                          mb: 1,
                          borderRadius: 1,
                          bgcolor: alpha(theme.palette.success.light, 0.1),
                          '&:hover': { bgcolor: alpha(theme.palette.success.light, 0.2) },
                        }}
                      >
                        <Avatar
                          sx={{
                            width: 32,
                            height: 32,
                            fontSize: 14,
                            bgcolor: alpha(theme.palette.success.main, 0.1),
                            color: theme.palette.success.dark,
                          }}
                        >
                          {tip.customerName?.[0] || '?'}
                        </Avatar>

                        <Box sx={{ flexGrow: 1 }}>
                          <Typography variant="body2" sx={{ fontWeight: 500 }}>
                            {tip.customerName || 'N/A'}
                          </Typography>
                          <Chip
                            label={tip.serviceCategory}
                            size="small"
                            sx={{
                              height: 20,
                              fontSize: '0.65rem',
                              bgcolor: alpha(theme.palette.info.main, 0.1),
                              color: theme.palette.info.dark,
                            }}
                          />
                          <Box sx={{ display: 'flex', gap: 1, mt: 0.5, flexWrap: 'wrap' }}>
                            <Typography variant="caption" sx={{ fontWeight: 500 }}>
                              {tip.serviceName}
                            </Typography>

                            <Chip
                              label={tip.serviceVariant}
                              size="small"
                              sx={{
                                height: 20,
                                fontSize: '0.65rem',
                                bgcolor: alpha(theme.palette.warning.main, 0.1),
                                color: theme.palette.warning.dark,
                              }}
                            />
                          </Box>
                        </Box>

                        <Box sx={{ textAlign: 'right', minWidth: 90 }}>
                          <Typography variant="body2" sx={{ fontWeight: 600 }}>
                            ₹{tip.tipAmount?.toLocaleString()}
                          </Typography>
                        </Box>
                      </Box>
                    ))}
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>

        {/* Empty State */}
        {!report.tipTransactions?.length && (
          <Box
            sx={{
              p: 4,
              textAlign: 'center',
              bgcolor: alpha(theme.palette.text.primary, 0.05),
              borderRadius: 2,
            }}
          >
            <Typography variant="body1" color="text.secondary">
              No tips recorded during this period
            </Typography>
          </Box>
        )}
      </Box>

      {/* Service Distribution */}
      <Box sx={{ mb: 4, p: 3, bgcolor: 'background.paper', borderRadius: 2 }}>
        <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
          Service Distribution
        </Typography>
        <ResponsiveContainer width="100%" height={500}>
          {' '}
          {/* Increased height */}
          <BarChart
            data={report.serviceDistribution}
            margin={{ top: 20, right: 30, left: 20, bottom: 100 }}
          >
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis
              dataKey="serviceName"
              tick={<CustomTick />}
              height={140} // Adjust height for 3-line labels
              interval={0}
            />

            <YAxis yAxisId="left" />
            <YAxis yAxisId="right" orientation="right" />
            <Tooltip content={<ServiceTooltip />} />
            <Legend />
            <Bar
              yAxisId="left"
              dataKey="count"
              name="Service Count"
              fill={COLORS[2]}
              barSize={25}
              radius={[4, 4, 0, 0]}
            />
            <Bar
              yAxisId="right"
              dataKey="totalRevenue"
              name="Revenue (₹)"
              fill={COLORS[3]}
              barSize={25}
              radius={[4, 4, 0, 0]}
            />
          </BarChart>
        </ResponsiveContainer>
      </Box>

      {/* Detailed Service Breakdown */}
      <Box sx={{ p: 3, bgcolor: 'background.paper', borderRadius: 2 }}>
        <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
          Service Details
        </Typography>
        <Box sx={{ maxHeight: 500, overflow: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: alpha(theme.palette.primary.main, 0.1) }}>
                {['Category & Service', 'Varient', 'Price', 'Count', 'Revenue', 'Customers'].map(
                  (header, index) => (
                    <th key={index} style={{ padding: '12px', textAlign: 'left', fontWeight: 600 }}>
                      {header}
                    </th>
                  ),
                )}
              </tr>
            </thead>
            <tbody>
              {report.serviceDistribution?.map((service, index) => {
                console.log('serviceDistribution:', service);
                return (
                  <tr key={index} style={{ borderBottom: `1px solid ${theme.palette.divider}` }}>
                    <td style={{ padding: '12px', position: 'relative' }}>
                      <Box
                        sx={{
                          display: 'flex',
                          flexDirection: 'column',
                          gap: 0.5,
                          borderLeft: `3px solid ${theme.palette.primary.main}`,
                          pl: 1.5,
                        }}
                      >
                        <Typography
                          variant="caption"
                          sx={{
                            color: 'text.secondary',
                            fontWeight: 500,
                            lineHeight: 1.2,
                            textTransform: 'uppercase',
                            letterSpacing: 0.5,
                          }}
                        >
                          {service.category}
                        </Typography>
                        <Typography
                          variant="body2"
                          sx={{
                            fontWeight: 600,
                            color: 'text.primary',
                            lineHeight: 1.3,
                          }}
                        >
                          {service.serviceName}
                        </Typography>
                      </Box>
                    </td>
                    <td style={{ padding: '12px' }}>{service.varient}</td>
                    <td style={{ padding: '12px' }}>
                      ₹{(service.totalRevenue / service.count)?.toLocaleString()}
                    </td>
                    <td style={{ padding: '12px' }}>{service.count}</td>
                    <td style={{ padding: '12px' }}>₹{service.totalRevenue?.toLocaleString()}</td>
                    <td style={{ padding: '12px' }}>
                      <Stack direction="row" gap={1} flexWrap="wrap">
                        {service.customers?.map((customer) => (
                          <Chip
                            key={customer.customerId}
                            avatar={
                              <Avatar
                                sx={{
                                  bgcolor: theme.palette.primary.main,
                                  width: 14,
                                  height: 14,
                                  fontSize: '0.75rem',
                                  fontWeight: 600,
                                  color: 'white',
                                }}
                              >
                                {customer.name?.[0] || '?'}
                              </Avatar>
                            }
                            label={
                              <Box
                                sx={{
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: 1,
                                  pl: 0.5,
                                }}
                              >
                                <Box sx={{ padding: '5px 3px' }}>
                                  <Typography
                                    variant="caption"
                                    sx={{
                                      fontWeight: 600,
                                      lineHeight: 1.2,
                                      color: theme.palette.text.primary,
                                    }}
                                  >
                                    {customer.name}
                                  </Typography>
                                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                    <PhoneIcon
                                      sx={{
                                        fontSize: '0.7rem',
                                        color: theme.palette.text.secondary,
                                      }}
                                    />
                                    <Typography
                                      variant="caption"
                                      sx={{
                                        fontSize: '0.65rem',
                                        color: theme.palette.text.secondary,
                                        lineHeight: 1.2,
                                      }}
                                    >
                                      {customer.phone}
                                    </Typography>
                                  </Box>
                                </Box>
                              </Box>
                            }
                            size="small"
                            sx={{
                              bgcolor: alpha(theme.palette.primary.light, 0.08),
                              border: `1px solid ${alpha(theme.palette.primary.main, 0.2)}`,
                              borderRadius: '6px',
                              height: 32,
                              '&:hover': {
                                bgcolor: alpha(theme.palette.primary.light, 0.15),
                                transform: 'translateY(-1px)',
                                boxShadow: theme.shadows[1],
                              },
                              transition: 'all 0.2s ease-in-out',
                              '& .MuiChip-label': {
                                padding: '0 8px 0 4px',
                                overflow: 'visible',
                              },
                              maxWidth: 160,
                            }}
                            title={`${customer.name} - ${customer.phone}`}
                          />
                        ))}
                      </Stack>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </Box>
      </Box>

      {/* Staff-Customer Relationships */}
      <Box sx={{ mb: 4, p: 3, bgcolor: 'background.paper', borderRadius: 2 }}>
        <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
          Staff-Customer Relationships
        </Typography>
        <Grid container spacing={3}>
          {report.staffDistribution?.map((staff, index) => (
            <Grid item xs={12} md={4} key={index}>
              <Card sx={{ bgcolor: alpha(COLORS[index % COLORS.length], 0.1) }}>
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                    <Avatar sx={{ bgcolor: COLORS[index % COLORS.length] }}>
                      {getStaffName(staff.staff)?.[0] || '?'}
                    </Avatar>
                    {/* <Typography variant="h6">Staff {staff.staff}</Typography> */}
                    <Typography variant="h6">{getStaffName(staff.staff) || 'Unassigned'}</Typography>
                  </Box>
                  <Typography variant="body2" sx={{ mb: 2 }}>
                    Total Services: {staff.totalServices}
                    <br />
                    Total Revenue: ₹{staff.totalRevenue?.toLocaleString()}
                  </Typography>
                  <Divider sx={{ my: 2 }} />
                  <Typography variant="subtitle2">Customers Handled:</Typography>
                  {staff.customers?.map((customer, idx) => (
                    <Box key={idx} sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 1 }}>
                      <Avatar sx={{ width: 24, height: 24, fontSize: 14 }}>
                        {customer.customerName?.[0] || '?'}
                      </Avatar>
                      <Typography variant="body2">
                        {customer.customerName || 'N/A'} ({customer.totalServices} services)
                      </Typography>
                    </Box>
                  ))}
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      </Box>
    </Box>
  );
};

export default SalonReportVisualization;
