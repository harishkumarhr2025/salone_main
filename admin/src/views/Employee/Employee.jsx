import React, { useEffect, useState } from 'react';
import {
  Box,
  Grid,
  Typography,
  Card,
  CardContent,
  Avatar,
  Chip,
  useTheme,
  styled,
  Button,
  // PeopleOutline,
} from '@mui/material';
import { People, CheckCircle, Add, Email, Phone, Work, PeopleOutline } from '@mui/icons-material';
import DownloadIcon from '@mui/icons-material/Download';
// import PersonAddIcon from '@mui/icons-material/PersonAdd';
import { useDispatch, useSelector } from 'react-redux';
import EmployeesForm from 'src/components/EMS/EmployeeForm';
import { fetchAllEmployee } from '../../redux/features/EMS/EmployeeSlice';
import EmployeeDetails from '../../components/EMS/EmployeeDetails';
import { CSVLink } from 'react-csv';
import { canExportData } from '../../utils/permissions';

const StyledCard = styled(Card)(({ theme }) => ({
  borderRadius: '12px',
  transition: 'transform 0.3s, box-shadow 0.3s',
  '&:hover': {
    transform: 'translateY(-5px)',
    boxShadow: theme.shadows[6],
  },
}));

const RoleChip = styled(Chip)(({ role }) => ({
  fontWeight: 500,
  backgroundColor: role === 'admin' ? '#f3e5f5' : role === 'manager' ? '#e3f2fd' : '#e8f5e9',
  color: role === 'admin' ? '#6a1b9a' : role === 'manager' ? '#1565c0' : '#2e7d32',
}));

const Employee = () => {
  const theme = useTheme();

  const [open, setOpen] = useState(false);
  const [openDetail, setOpenDetail] = useState(false);
  const [employeeId, setEmployeeId] = useState(null);

  const dispatch = useDispatch();

  const { success, employee, message } = useSelector((state) => state.Employee.employees);
  const currentUser = useSelector((state) => state.Auth.user);
  const allowExport = canExportData(currentUser);

  console.log('employee:', employee);

  const getAllEmployee = async () => {
    const result = await dispatch(fetchAllEmployee());
    console.log('getAllEmployee:', result);
  };

  useEffect(() => {
    getAllEmployee();
  }, [dispatch, open, openDetail]);

  const totalEmployees = employee?.length;
  const activeEmployees = employee?.filter((emp) => emp.currentStatus === 'Active').length;

  const handleSubmit = async (empData) => {
    console.log('Employee Data:', empData);
  };

  const csvHeaders = [
    { label: 'Employee ID', key: 'employeeId' },
    { label: 'Employee Name', key: 'employeeName' },
    { label: 'Phone', key: 'phone' },
    { label: 'Workplace', key: 'workplace' },
    { label: 'Current Status', key: 'currentStatus' },
    { label: 'Joining Date', key: 'joiningDate' },
  ];

  const csvData = (employee || []).map((emp) => ({
    employeeId: emp.employeeId,
    employeeName: emp.employeeName,
    phone: emp.phone,
    workplace: emp?.otherInfo?.workplace || '',
    currentStatus: emp.currentStatus,
    joiningDate: emp.joiningDate ? new Date(emp.joiningDate).toLocaleDateString('en-IN') : '',
  }));

  const viewEmpDetails = (emp) => {
    setOpenDetail(true);
    setEmployeeId(emp._id);
  };

  return (
    <Box sx={{ p: 4, backgroundColor: '#f8f9fa', minHeight: '100vh' }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography
          variant="h4"
          gutterBottom
          sx={{
            mb: 4,
            fontWeight: 700,
            color: theme.palette.primary.dark,
            letterSpacing: '-0.5px',
          }}
        >
          Employee Management
        </Typography>
        <Button
          variant="contained"
          startIcon={<Add />}
          sx={{ ml: 2 }}
          onClick={() => {
            setOpen(true);
          }}
        >
          Add Employee
        </Button>
        {allowExport && (
          <CSVLink
            data={csvData}
            headers={csvHeaders}
            filename="employees.csv"
            style={{ textDecoration: 'none' }}
          >
            <Button variant="outlined" startIcon={<DownloadIcon />} sx={{ ml: 2 }}>
              Export CSV
            </Button>
          </CSVLink>
        )}
      </Box>

      {/* Summary Cards */}
      <Grid container spacing={3} sx={{ mb: 6 }}>
        {[
          { title: 'Total Employees', value: totalEmployees, icon: <People />, color: '#4a148c' },
          {
            title: 'Active Employees',
            value: activeEmployees,
            icon: <CheckCircle />,
            color: '#2e7d32',
          },
        ].map((metric, index) => (
          <Grid item xs={12} sm={6} md={3} key={index}>
            <StyledCard>
              <CardContent sx={{ p: 3 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <Avatar
                    sx={{
                      bgcolor: metric.color + '15',
                      color: metric.color,
                      width: 48,
                      height: 48,
                    }}
                  >
                    {React.cloneElement(metric.icon, { sx: { fontSize: 28 } })}
                  </Avatar>
                  <Box>
                    <Typography
                      variant="subtitle2"
                      sx={{
                        color: theme.palette.text.secondary,
                        mb: 0.5,
                      }}
                    >
                      {metric.title}
                    </Typography>
                    <Typography
                      variant="h4"
                      sx={{
                        fontWeight: 700,
                        color: theme.palette.text.primary,
                      }}
                    >
                      {metric.value}
                    </Typography>
                  </Box>
                </Box>
              </CardContent>
            </StyledCard>
          </Grid>
        ))}
      </Grid>

      {success && employee ? (
        <>
          <Grid container spacing={3}>
            {employee.map((emp) => {
              return (
                <Grid
                  item
                  xs={12}
                  md={4}
                  sm={6}
                  key={emp._id}
                  onClick={() => viewEmpDetails(emp)}
                  sx={{ cursor: 'pointer' }}
                >
                  <StyledCard>
                    <CardContent sx={{ p: 3 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                        <Avatar
                          sx={{
                            width: 56,
                            height: 56,
                            bgcolor: theme.palette.primary.main,
                            fontSize: 24,
                            mr: 2,
                          }}
                        >
                          {emp.employeeName.charAt(0)}
                        </Avatar>
                        <Box>
                          <Typography variant="h6" sx={{ fontWeight: 700 }}>
                            {emp.employeeName}
                          </Typography>
                        </Box>
                      </Box>
                      <Box
                        sx={{
                          display: 'grid',
                          gap: 2,
                          borderTop: `1px solid ${theme.palette.divider}`,
                          pt: 2,
                        }}
                      >
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                          <Phone fontSize="small" sx={{ color: theme.palette.text.secondary }} />
                          <Typography variant="body2">{emp.phone}</Typography>
                        </Box>

                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                          <Work fontSize="small" sx={{ color: theme.palette.text.secondary }} />
                          <Typography variant="body2">{emp?.otherInfo.workplace}</Typography>
                        </Box>
                      </Box>

                      <Box
                        sx={{
                          position: 'absolute',
                          top: 16,
                          right: -8,
                          bgcolor: emp.currentStatus ? '#4caf50' : '#f44336',
                          color: 'white',
                          px: 2,
                          py: 0.5,
                          borderRadius: '4px',
                          boxShadow: theme.shadows[2],
                          fontSize: '0.75rem',
                          fontWeight: 700,
                          textTransform: 'uppercase',
                        }}
                      >
                        {emp.currentStatus ? 'Active' : 'Inactive'}
                      </Box>
                    </CardContent>
                  </StyledCard>
                </Grid>
              );
            })}
          </Grid>
        </>
      ) : (
        <Card
          sx={{
            width: '100%',
            textAlign: 'center',
            p: 4,
            boxShadow: (theme) => theme.shadows[3],
          }}
        >
          <Box
            sx={{
              height: 'calc(100vh - 200px)',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              textAlign: 'center',
              p: 4,
              backgroundColor: (theme) => theme.palette.background.paper,
              borderRadius: 2,
              border: (theme) => `1px dashed ${theme.palette.divider}`,
              mx: 2,
            }}
          >
            <PeopleOutline
              sx={{
                fontSize: 64,
                color: 'text.secondary',
                mb: 2,
                opacity: 0.8,
              }}
            />
            <Typography
              variant="h6"
              gutterBottom
              sx={{
                color: 'text.secondary',
                fontWeight: 500,
              }}
            >
              No Employees Found
            </Typography>
            <Typography
              variant="body1"
              sx={{
                color: 'text.secondary',
                maxWidth: 400,
                mb: 3,
              }}
            >
              Start building your team by adding the first employee record
            </Typography>
          </Box>
        </Card>
      )}
      <EmployeesForm open={open} onClose={() => setOpen(false)} onSubmit={handleSubmit} />
      {openDetail && employeeId && (
        <EmployeeDetails
          open={openDetail}
          employeeId={employeeId}
          onClose={() => setOpenDetail(false)}
        />
      )}
    </Box>
  );
};

export default Employee;
