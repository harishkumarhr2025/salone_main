import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  Grid,
  Chip,
  Avatar,
  Divider,
  Link,
  Tabs,
  Tab,
  Button,
  CardContent,
  DialogContent,
  DialogTitle,
  Container,
  DialogActions,
  Dialog,
  useMediaQuery,
} from '@mui/material';
import {
  Person,
  Work,
  Assignment,
  LocalHospital,
  Home,
  AccountBalance,
  Event,
  Schedule,
  Favorite,
  Height,
  FitnessCenter,
  Phone,
  Cake,
  Transgender,
  ContactEmergency,
  Description,
  AttachMoney,
  ContactPageSharp,
  Elderly as ElderlyIcon,
} from '@mui/icons-material';

import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';
import AccountBalanceIcon from '@mui/icons-material/AccountBalance';
import { useTheme } from '@emotion/react';
import { useDispatch, useSelector } from 'react-redux';
import {
  deleteEmployee,
  fetchAllEmployee,
  fetchEmployeeByID,
} from '../../redux/features/EMS/EmployeeSlice';
import EMSAadharDisplay from './EMSAadharDisplay';
import EmployeesForm from './EmployeeForm';
import DeleteConfirmationDialog from '../DeleteConfirmationDialog/DeleteConfirmationDialog';
import toast from 'react-hot-toast';
import Unauthorized from '../Unauthorized/Unauthorized';

const EmployeeDetails = ({ employeeId, open, onClose }) => {
  const theme = useTheme();
  const fullScreen = useMediaQuery(theme.breakpoints.down('md'));
  const [tabValue, setTabValue] = useState(0);
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);

  const dispatch = useDispatch();

  const { selectedEmployee: employee, isLoading } = useSelector((state) => state.Employee);
  const { isAuthenticated, user } = useSelector((state) => state.Auth);

  console.log('employee:', employee);

  const getEmpById = async () => {
    await dispatch(fetchEmployeeByID(employeeId));
  };

  useEffect(() => {
    const fetchEmployee = async () => {
      const AllEmp = await dispatch(fetchEmployeeByID(employeeId));
      console.log('AllEmp:', AllEmp);
    };

    fetchEmployee();
  }, [editOpen, dispatch]);

  useEffect(() => {
    getEmpById();
  }, [dispatch, employeeId]);

  const handleEdit = (employee) => () => {
    setEditOpen(true);
  };

  const handleDelete = () => {
    setDeleteOpen(true);
  };

  const employeeDeleteHandler = async () => {
    try {
      const deleteResponse = await dispatch(deleteEmployee(employee));
      if (deleteResponse.meta.requestStatus === 'fulfilled') {
        toast.success(deleteResponse.payload.message || 'Employee deleted successfully');
        onClose();
      } else if (deleteResponse.meta.requestStatus === 'rejected') {
        toast.error(deleteResponse.payload.message || 'Employee deletion failed');
      } else {
        toast.error('Employee deletion failed please try after some time');
      }
    } catch (error) {
      toast.error('Error in deleting the employee');
      console.log('Error in deleting the employee');
    }
  };

  const SectionHeader = ({ icon: Icon, title }) => (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
      <Icon sx={{ color: 'primary.main' }} />
      <Typography variant="h6" sx={{ fontWeight: 600 }}>
        {title}
      </Typography>
    </Box>
  );

  const InfoItem = ({ label, value, icon: Icon }) => (
    <Grid item xs={12} sm={6} md={4}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1 }}>
        <Icon sx={{ color: 'text.secondary' }} />
        <Box>
          <Typography variant="body2" color="text.secondary">
            {label}
          </Typography>
          <Typography variant="body1">{value || '-'}</Typography>
        </Box>
      </Box>
    </Grid>
  );

  const NoEmployeeFound = () => {
    if (!isLoading && !employee?.employee && !employee?.success) {
      return (
        <Dialog open={open} onClose={onClose} fullScreen={fullScreen} maxWidth="sm" fullWidth>
          <Box
            display="flex"
            flexDirection="column"
            alignItems="center"
            justifyContent="center"
            height="60vh"
            textAlign="center"
            gap={2}
            sx={{ p: 3 }}
          >
            <ErrorOutlineIcon color="error" sx={{ fontSize: 60 }} />
            <Typography variant="h5" fontWeight={600}>
              Employee not found
            </Typography>
            <Typography variant="body1" color="text.secondary">
              The employee ID you are trying to fetch does not exist or may have been removed.
            </Typography>
            <DialogActions sx={{ px: 3, py: 2 }}>
              <Button onClick={onClose} variant="outlined">
                Close
              </Button>
            </DialogActions>
          </Box>
        </Dialog>
      );
    }
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      fullScreen={fullScreen}
      maxWidth="lg"
      fullWidth
      scroll="paper"
      sx={{
        '& .MuiDialog-paper': {
          borderRadius: fullScreen ? 0 : 3,
          overflow: 'hidden',
        },
      }}
    >
      {!isAuthenticated || user?.role !== 'admin' ? (
        <Dialog
          open={open}
          onClose={onClose}
          scroll="paper"
          sx={{
            '& .MuiDialog-paper': {
              borderRadius: fullScreen ? 0 : 3,
              overflow: 'hidden',
            },
          }}
        >
          <Unauthorized />
        </Dialog>
      ) : (
        <>
          {NoEmployeeFound()}
          <DialogTitle
            sx={{
              bgcolor: 'primary.main',
              color: 'white',
              py: 2,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Avatar
                sx={{
                  width: 56,
                  height: 56,
                  bgcolor: theme.palette.primary.main,
                  fontSize: 24,
                  border: '2px solid #fff',
                  borderRadius: '50%',
                  mr: 2,
                }}
              >
                {employee?.employee?.employeeName.charAt(0)}
              </Avatar>

              <Box>
                <Typography variant="h6" fontWeight={600}>
                  {employee?.employee?.employeeName}
                </Typography>

                <Typography variant="body2" sx={{ color: '#fff', mt: 0.3 }}>
                  Employee ID: {employee?.employee?.employeeId}
                </Typography>
              </Box>
            </Box>
            <Chip
              label={employee?.employee?.currentStatus}
              color="success"
              sx={{ color: '#fff' }}
            />
          </DialogTitle>

          <DialogContent dividers sx={{ p: 0 }}>
            <Container maxWidth="lg" sx={{ py: 3 }}>
              <Tabs
                value={tabValue}
                onChange={(e, newValue) => setTabValue(newValue)}
                variant="scrollable"
                scrollButtons="auto"
                sx={{
                  mb: 3,
                  position: 'sticky',
                  top: 0,
                  zIndex: 10,
                  bgcolor: 'background.paper',
                  borderBottom: '1px solid #e0e0e0',
                }}
              >
                <Tab label="Personal Info" icon={<Person />} />
                <Tab label="Salary" icon={<AccountBalanceIcon />} />
                <Tab label="Work Details" icon={<Work />} />
                <Tab label="Insurance" icon={<LocalHospital />} />
                <Tab label="Documents" icon={<Description />} />
              </Tabs>

              <CardContent>
                {tabValue === 0 && (
                  <Grid container spacing={3}>
                    <Grid item xs={12}>
                      <SectionHeader icon={Person} title="Personal Details" />
                      <Grid container spacing={2}>
                        <InfoItem label="Phone" value={employee?.employee.phone} icon={Phone} />
                        <InfoItem
                          label="Gender"
                          value={employee?.employee.gender}
                          icon={Transgender}
                        />
                        <InfoItem
                          label="Date of Birth"
                          value={new Date(employee?.employee.dob).toLocaleDateString()}
                          icon={Cake}
                        />
                        <InfoItem
                          label="Father/Husband Name"
                          value={employee?.employee.fatherName}
                          icon={ElderlyIcon}
                        />
                        <InfoItem
                          label="Blood Group"
                          value={employee?.employee.bloodGroup}
                          icon={Favorite}
                        />
                        <InfoItem
                          label="Height"
                          value={`${employee?.employee.height} cm`}
                          icon={Height}
                        />
                        <InfoItem
                          label="Weight"
                          value={`${employee?.employee.weight} kg`}
                          icon={FitnessCenter}
                        />
                      </Grid>
                    </Grid>
                    <Grid item xs={12}>
                      <SectionHeader icon={Home} title="Address" />
                      <Grid container spacing={2}>
                        <InfoItem
                          label="Street"
                          value={employee?.employee.address.street}
                          icon={Home}
                        />
                        <InfoItem
                          label="City"
                          value={employee?.employee.address.city}
                          icon={Home}
                        />
                        <InfoItem
                          label="State"
                          value={employee?.employee.address.state}
                          icon={Home}
                        />
                        <InfoItem
                          label="ZIP Code"
                          value={employee?.employee.address.zip}
                          icon={Home}
                        />
                        <InfoItem
                          label="Country"
                          value={employee?.employee.address.country}
                          icon={Home}
                        />
                      </Grid>
                    </Grid>
                  </Grid>
                )}

                {tabValue === 1 && (
                  <Grid container spacing={3}>
                    <Grid item xs={12}>
                      <SectionHeader icon={AttachMoney} title="Salary Structure" />
                      <Grid container spacing={2}>
                        <InfoItem
                          label="Resides In"
                          value={employee?.employee.empResides}
                          icon={Event}
                        />
                        {employee?.employee.empResides === 'Out House' ? (
                          <>
                            <InfoItem
                              label="Salary"
                              value={employee?.employee.bankDetails.salary}
                              icon={Schedule}
                            />
                            <InfoItem
                              label="Travelling Allowance (TA)"
                              value={employee?.employee.bankDetails.TA}
                              icon={Work}
                            />
                            <InfoItem
                              label="House Rent Allowance (HRA)"
                              value={employee?.employee.bankDetails.HRA}
                              icon={Assignment}
                            />
                            <InfoItem
                              label="Gross Salary"
                              value={`${
                                Number(employee?.employee.bankDetails.HRA || 0) +
                                Number(employee?.employee.bankDetails.TA || 0) +
                                Number(employee?.employee.bankDetails.salary || 0)
                              }`}
                              icon={Assignment}
                            />
                          </>
                        ) : (
                          <InfoItem
                            label="Gross Salary"
                            value={employee?.employee.bankDetails.salary || 0}
                            icon={Assignment}
                          />
                        )}
                      </Grid>
                      <Divider sx={{ my: 2 }} />
                      <Grid item xs={12}>
                        <SectionHeader icon={Work} title="Commission Details" />
                        <Grid container spacing={2}>
                          <InfoItem
                            label="Commission Type"
                            value={employee?.employee.empCommissionType}
                            icon={Schedule}
                          />

                          <InfoItem
                            label={
                              employee?.employee.empCommissionType === 'Percentage'
                                ? 'Percentage'
                                : 'Fix Amount'
                            }
                            value={employee?.employee.empCommission}
                            icon={Work}
                          />
                        </Grid>
                      </Grid>

                      <Divider sx={{ my: 2 }} />
                      <Grid item xs={12}>
                        <SectionHeader icon={Work} title="Bank Details" />
                        <Grid container spacing={2}>
                          <InfoItem
                            label="Account Holder Name"
                            value={employee?.employee.bankDetails.holderName}
                            icon={Schedule}
                          />
                          <InfoItem
                            label={'Account Number'}
                            value={employee?.employee.bankDetails.accountNumber}
                            icon={Work}
                          />
                          <InfoItem
                            label={'IFSC Code'}
                            value={employee?.employee.bankDetails.ifsc}
                            icon={Work}
                          />
                          <InfoItem
                            label="Bank Name"
                            value={employee?.employee.bankDetails.bankName}
                            icon={Schedule}
                          />
                          <InfoItem
                            label="Branch"
                            value={employee?.employee.bankDetails.branch}
                            icon={Schedule}
                          />
                        </Grid>
                      </Grid>
                    </Grid>
                  </Grid>
                )}

                {tabValue === 2 && (
                  <Grid container spacing={3}>
                    <Grid item xs={12}>
                      <SectionHeader icon={Work} title="Work Information" />
                      <Grid container spacing={2}>
                        <InfoItem
                          label="Joining Date"
                          value={new Date(employee?.employee.joiningDate).toLocaleDateString()}
                          icon={Event}
                        />
                        <InfoItem
                          label="Work Hours"
                          value={`${new Date(
                            employee?.employee.fromTime,
                          ).toLocaleTimeString()} - ${new Date(
                            employee?.employee.toTime,
                          ).toLocaleTimeString()}`}
                          icon={Schedule}
                        />
                        <InfoItem
                          label="Department"
                          value={employee?.employee.otherInfo.workplace}
                          icon={Work}
                        />
                        <InfoItem
                          label="Qualification"
                          value={employee?.employee.otherInfo.qualification}
                          icon={Assignment}
                        />
                      </Grid>
                      <Grid item xs={12} mt={3} md={6}>
                        <SectionHeader icon={Work} title="Work Experience" />

                        {employee?.employee.experiences.map((exp, index) => (
                          <Paper key={index} sx={{ p: 2, mb: 2, borderRadius: 2 }}>
                            <Typography variant="subtitle1">{exp.jobTitle}</Typography>
                            <Typography color="text.secondary">{exp.company}</Typography>
                            <Typography variant="body2" sx={{ mt: 1 }}>
                              {exp.description}
                            </Typography>
                            <Chip label={exp.duration} sx={{ mt: 1 }} />
                          </Paper>
                        ))}
                      </Grid>
                    </Grid>
                  </Grid>
                )}

                {tabValue === 3 && (
                  <Grid container spacing={3}>
                    {['health', 'life', 'esi'].map((type) => {
                      const insurance = employee?.employee.insurances[type];
                      const isCovered = insurance?.covered === 'Yes';
                      const capitalizedType = type.charAt(0).toUpperCase() + type.slice(1);

                      return (
                        <Grid item xs={12} md={6} key={type}>
                          <Paper
                            elevation={3}
                            sx={{
                              p: 3,
                              borderRadius: 3,
                              backgroundColor: isCovered ? 'background.paper' : '#f9f9f9',
                              border: `1px solid ${isCovered ? '#ccc' : '#eee'}`,
                            }}
                          >
                            <Typography
                              variant="h6"
                              gutterBottom
                              sx={{
                                color: isCovered ? 'primary.main' : 'text.secondary',
                                display: 'flex',
                                alignItems: 'center',
                                gap: 1,
                              }}
                            >
                              <LocalHospital />
                              {capitalizedType} Insurance
                            </Typography>

                            {isCovered ? (
                              <>
                                <InfoItem
                                  label="Coverage Amount"
                                  value={`₹${insurance.amount}`}
                                  icon={AccountBalance}
                                />
                                <InfoItem
                                  label="Expiry Date"
                                  value={new Date(insurance.expiryDate).toLocaleDateString()}
                                  icon={Event}
                                />
                                <InfoItem
                                  label="PF Number"
                                  value={insurance.pfNumber}
                                  icon={ContactEmergency}
                                />
                              </>
                            ) : (
                              <Box
                                sx={{
                                  mt: 2,
                                  p: 2,
                                  backgroundColor: '#fce4ec',
                                  borderRadius: 2,
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: 1,
                                  color: 'text.secondary',
                                }}
                              >
                                <LocalHospital color="error" />
                                <Typography variant="body2">
                                  No {capitalizedType} insurance coverage
                                </Typography>
                              </Box>
                            )}
                          </Paper>
                        </Grid>
                      );
                    })}
                  </Grid>
                )}

                {tabValue === 4 && (
                  <Grid container spacing={3}>
                    <EMSAadharDisplay documents={employee?.employee?.documents} />
                  </Grid>
                )}
              </CardContent>
            </Container>
          </DialogContent>
          <DialogActions sx={{ px: 3, py: 2, justifyContent: 'space-between' }}>
            <Button onClick={onClose} variant="outlined">
              Close
            </Button>

            <Button variant="contained" onClick={handleDelete}>
              Delete Employee
            </Button>

            <Button onClick={handleEdit(employee)} variant="contained">
              Edit Details
            </Button>

            <Box>
              <Button
                variant="outlined"
                onClick={() => setTabValue((prev) => Math.max(prev - 1, 0))}
                disabled={tabValue === 0}
                sx={{ mr: 2 }}
              >
                Previous
              </Button>
              <Button
                variant="contained"
                onClick={() => setTabValue((prev) => Math.min(prev + 1, 4))}
                disabled={tabValue === 4}
              >
                Next
              </Button>
            </Box>
          </DialogActions>
          <EmployeesForm
            open={editOpen}
            employeeDetail={employee}
            onClose={() => setEditOpen(false)}
          />
          {deleteOpen && employee && (
            <DeleteConfirmationDialog
              open={deleteOpen}
              onClose={() => setDeleteOpen(false)}
              customer={employee}
              onConfirm={employeeDeleteHandler}
            />
          )}
        </>
      )}
    </Dialog>
  );
};

export default EmployeeDetails;
