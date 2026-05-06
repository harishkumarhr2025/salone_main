import React, { useState, useCallback, useEffect } from 'react';
import {
  Modal,
  Box,
  Grid,
  Typography,
  TextField,
  MenuItem,
  Button,
  Avatar,
  useTheme,
  styled,
  Tabs,
  Tab,
  FormHelperText,
  Chip,
  Divider,
  Paper,
  RadioGroup,
  FormLabel,
  Radio,
  FormControlLabel,
  FormControl,
  DialogActions,
} from '@mui/material';
import { Person, PersonAdd, Work, LocalHospital, Description } from '@mui/icons-material';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import * as Yup from 'yup';
import AccountBalanceIcon from '@mui/icons-material/AccountBalance';
import AnalyticsIcon from '@mui/icons-material/Analytics';
import FileUpload from '../FileUpload/FileUpload';
import axios from 'axios';
import Config from '../Config';
import dayjs from 'dayjs';
import { TimePicker } from '@mui/x-date-pickers/TimePicker';
import AddIcon from '@mui/icons-material/Add';
import ExperienceEntry from './ExperienceEntry';
import InsuranceSection from './InsuranceSection';
import { useDispatch, useSelector } from 'react-redux';
import { AddEmployee, updateEmployee } from 'src/redux/features/EMS/EmployeeSlice';
import toast from 'react-hot-toast';
import { to } from 'react-spring';
import { fetchLocationByPincode } from 'src/utils/fetchLocationByPincode';

const ModalContent = styled(Box)(({ theme }) => ({
  position: 'absolute',
  top: '50%',
  left: '50%',
  transform: 'translate(-50%, -50%)',
  backgroundColor: 'white',
  borderRadius: '16px',
  boxShadow: theme.shadows[5],
  padding: theme.spacing(4),
  width: '800px',
  maxWidth: '95vw',
  maxHeight: '90vh',
  overflowY: 'auto',
}));

// Reusable file upload component

const EmployeesForm = ({ open, onClose, employeeDetail }) => {
  const theme = useTheme();
  const [tabValue, setTabValue] = useState(0);
  const [formData, setFormData] = useState({
    employeeName: '',
    phone: '',
    fatherName: '', // Added field for father/husband name
    dob: null,
    joiningDate: null, // Added field for joining date
    gender: '',
    maritalStatus: '',
    anniversaryDate: null,
    fromTime: '',
    toTime: '',
    bloodGroup: '',
    height: '',
    weight: '',
    smsAlert: '',
    empResides: '',
    lunchTime: '',
    teaTime: '',
    empCommissionType: 'Percentage',
    empCommission: '',
    address: {
      street: '',
      zip: '',
      city: '',
      state: '',
      country: '',
    },
    bankDetails: {
      holderName: '', // Added field for account holder name
      accountNumber: '',
      ifsc: '',
      bankName: '',
      branch: '',
      salary: '', // Added field for salary
      TA: '',
      HRA: '',
    },
    otherInfo: {
      emergencyContact: '',
      workplace: '',
      workTime: '',
      qualification: '',
      remark: '',
    },
    documents: {
      aadharFront: null,
      aadharBack: null,
      profilePicture: null,
    },
    experiences: [
      {
        jobTitle: '',
        company: '',
        duration: '',
        description: '',
        current: false,
      },
    ],
    insurances: {
      health: {
        covered: 'No',
        amount: '',
        expiryDate: null,
        pfNumber: '',
      },
      life: {
        covered: 'No',
        amount: '',
        expiryDate: null,
        pfNumber: '',
      },
      esi: {
        covered: 'No',
        amount: '',
        expiryDate: null,
        pfNumber: '',
      },
    },
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  const dispatch = useDispatch();

  const { selectedEmployee: employee, isLoading } = useSelector((state) => state.Employee);

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  useEffect(() => {
    if (employeeDetail) {
      setFormData((prev) => ({
        ...prev,
        ...employeeDetail.employee,
        dob: employeeDetail.employee.dob ? dayjs(employeeDetail.dob) : null,
        joiningDate: employeeDetail.employee.joiningDate ? dayjs(employeeDetail.joiningDate) : null,
        anniversaryDate: employeeDetail.employee.anniversaryDate
          ? dayjs(employeeDetail.employee.anniversaryDate)
          : null,
      }));
    }
  }, [employeeDetail]);

  // Validation schema
  const validationSchema = Yup.object().shape({
    phone: Yup.string().required('Phone is required'),
    firstName: Yup.string().required('Name is required'),
    gender: Yup.string().required('Gender is required'),
    // Add more validations as needed
  });

  // File validation schema
  const fileSchema = Yup.object().shape({
    aadharFront: Yup.mixed()
      .test('fileRequired', 'Front ID is required', (value) => !!value)
      .test(
        'fileSize',
        'File too large (max 5MB)',
        (value) => !value || (value instanceof File && value.size <= 5 * 1024 * 1024),
      )
      .test(
        'fileType',
        'Unsupported format (JPEG/PNG only)',
        (value) =>
          !value || (value instanceof File && ['image/jpeg', 'image/png'].includes(value.type)),
      ),
    aadharBack: Yup.mixed()
      .test('fileRequired', 'Back ID is required', (value) => !!value)
      .test(
        'fileSize',
        'File too large (max 5MB)',
        (value) => !value || (value instanceof File && value.size <= 5 * 1024 * 1024),
      )
      .test(
        'fileType',
        'Unsupported format (JPEG/PNG only)',
        (value) =>
          !value || (value instanceof File && ['image/jpeg', 'image/png'].includes(value.type)),
      ),
    profilePicture: Yup.mixed()
      .test('fileRequired', 'Profile picture is required', (value) => !!value)
      .test(
        'fileSize',
        'File too large (max 5MB)',
        (value) => !value || (value instanceof File && value.size <= 5 * 1024 * 1024),
      )
      .test(
        'fileType',
        'Unsupported format (JPEG/PNG only)',
        (value) =>
          !value || (value instanceof File && ['image/jpeg', 'image/png'].includes(value.type)),
      ),
  });

  // Validate form
  const validateForm = async () => {
    try {
      await validationSchema.validate(formData, { abortEarly: false });

      if (tabValue === 3) {
        await fileSchema.validate(formData.documents, { abortEarly: false });
      }

      setErrors({});
      return true;
    } catch (yupError) {
      const newErrors = {};
      if (yupError.inner) {
        yupError.inner.forEach((error) => {
          newErrors[error.path] = error.message;
        });
      }
      setErrors(newErrors);
      return false;
    }
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      console.log('Update Data:', formData);

      const documentEntries = Object.entries(formData.documents);
      const filesToUpload = documentEntries.filter(([_, value]) => value instanceof File);

      // Step 1: Get only files
      const fileOnlyArray = filesToUpload.map(([_, file]) => file);

      // Step 2: Get signatures only for new files
      const signatures = await getSignatureForUpload('uphaarr', fileOnlyArray.length);

      // Step 3: Upload files
      const uploadedDocs = await uploadAadharImage(signatures, fileOnlyArray);

      // Step 4: Reconstruct final documents object
      const documentUrls = documentEntries.reduce((acc, [key, value]) => {
        const uploadedIndex = filesToUpload.findIndex(([field]) => field === key);
        acc[key] = uploadedIndex !== -1 ? uploadedDocs[uploadedIndex]?.secure_url : value;
        return acc;
      }, {});

      // Create final submission data
      const submissionData = {
        ...formData,
        documents: documentUrls,
        dob: formData.dob ? dayjs(formData.dob).toISOString() : null,
        joiningDate: formData.joiningDate ? dayjs(formData.joiningDate).toISOString() : null,
      };

      const updateResponse = await dispatch(updateEmployee(submissionData));
      console.log('Update Response:', updateResponse);

      if (updateResponse.meta.requestStatus === 'fulfilled') {
        onClose();
        toast.success(updateResponse.payload.message || 'Employee Details updated successfully.');
      } else if (updateResponse.meta.requestStatus === 'rejected') {
        toast.error(updateResponse.payload.message || 'Failed to update employee details.');
      } else {
        toast.error('Failed to update employee details. Try after some time.');
      }
    } catch (error) {
      console.error('Submission failed:', error);
      setErrors({
        submit: error.response?.data?.message || 'Failed to save employee. Please try again.',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      // Prepare files for upload
      const filesToUpload = [
        formData.documents.aadharFront,
        formData.documents.aadharBack,
        formData.documents.profilePicture,
      ].filter((file) => file instanceof File);

      // Get cloudinary signatures

      const signatures = await getSignatureForUpload('uphaarr', filesToUpload.length);

      // Upload documents to Cloudinary
      const uploadedDocs = await uploadAadharImage(signatures, filesToUpload);

      // Map uploaded documents to their respective fields
      const documentUrls = {
        aadharFront: uploadedDocs[0]?.secure_url || '',
        aadharBack: uploadedDocs[1]?.secure_url || '',
        profilePicture: uploadedDocs[2]?.secure_url || '',
      };

      // Create final submission data
      const submissionData = {
        ...formData,
        documents: documentUrls,
        dob: formData.dob ? dayjs(formData.dob).toISOString() : null,
        joiningDate: formData.joiningDate ? dayjs(formData.joiningDate).toISOString() : null,
      };

      const empDetails = JSON.parse(JSON.stringify(submissionData));

      await dispatch(AddEmployee(empDetails));
      setIsSubmitting(true);

      onClose();
      // setFormData(initialFormState); // You need to define initialFormState
    } catch (error) {
      console.error('Submission failed:', error);
      setErrors({
        submit: error.response?.data?.message || 'Failed to save employee. Please try again.',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle field changes
  const handleChange = useCallback((path, value) => {
    setFormData((prev) => {
      const newData = { ...prev };
      const keys = path.split('.');

      if (keys.length === 1) {
        // Handle top-level field
        newData[keys[0]] = value;
      } else {
        // Handle nested field
        let current = newData;
        for (let i = 0; i < keys.length - 1; i++) {
          current = current[keys[i]] = { ...current[keys[i]] };
        }
        current[keys[keys.length - 1]] = value;

        // ✅ Pincode logic

        if (path === 'address.zip' && value.length === 6) {
          setLoading(true);
          fetchLocationByPincode({ pincode: value, setFormData, setLoading, setErrors });
        }
      }

      return newData;
    });
  }, []);

  // Handle document updates
  const handleDocumentChange = useCallback(
    (documentType, file) => {
      handleChange(`documents.${documentType}`, file);
    },
    [handleChange],
  );

  const uploadAadharImage = async (signatures, filesToUpload) => {
    try {
      console.log('signatures, filesToUpload:', signatures, filesToUpload);
      if (!filesToUpload?.length || !signatures?.length) return [];

      const cloudinaryName = process.env.REACT_APP_CLOUDINARY_NAME;
      const cloudinaryApiKey = process.env.REACT_APP_CLOUDINARY_API_KEY;
      const resourceType = 'image';
      const folder = 'uphaarr';

      const uploadPromise = filesToUpload.map(async (image, index) => {
        try {
          const formData = new FormData();
          formData.append('file', image);
          formData.append('timestamp', signatures[index].timestamp);
          formData.append('signature', signatures[index].signature);
          formData.append('api_key', cloudinaryApiKey);
          formData.append('folder', folder);

          const apiEndPoint = `https://api.cloudinary.com/v1_1/${cloudinaryName}/${resourceType}/upload`;

          const response = await axios.post(apiEndPoint, formData, {
            timeout: 30000,
            headers: {
              'Content-Type': 'multipart/form-data',
            },
          });
          console.log('response:', response);
          return response.data;
        } catch (error) {
          console.error(`Upload failed for image ${index + 1}:`, error);
          return { error: true, message: error.message };
        }
      });

      const uploadResult = await Promise.all(uploadPromise);
      const successfulUploads = uploadResult.filter((result) => !result.error);
      const failedUploads = uploadResult.filter((result) => result.error);

      console.log('uploadResult:', uploadResult);

      if (failedUploads.length > 0) {
        throw new Error(`${failedUploads.length} upload(s) failed`);
      }
      return successfulUploads;
    } catch (error) {
      console.error('Upload process failed:', error);
      throw error;
    }
  };

  const getSignatureForUpload = async (folder, imageCount) => {
    try {
      if (!imageCount || imageCount < 1) return [];

      const signatureResponse = await Config.post('/getSignature', { folder, imageCount });
      console.log('signatureResponse:', signatureResponse);

      return signatureResponse.data?.signatures || [];
    } catch (error) {
      console.error('Signature Error:', error);
      throw new Error('Could not obtain upload signatures');
    }
  };

  return (
    <Modal open={open} onClose={onClose}>
      <ModalContent>
        <Box sx={{ textAlign: 'center', mb: 3 }}>
          <Avatar
            sx={{
              bgcolor: theme.palette.primary.main,
              width: 56,
              height: 56,
              margin: '0 auto 16px',
            }}
          >
            <PersonAdd fontSize="large" />
          </Avatar>
          <Typography variant="h5" sx={{ fontWeight: 700 }}>
            Employee Registration
          </Typography>
        </Box>

        <Tabs
          value={tabValue}
          onChange={handleTabChange}
          sx={{
            mb: 3,
            position: 'sticky',
            top: -33,
            zIndex: 10,
            bgcolor: 'background.paper',
            borderBottom: '1px solid #e0e0e0',
          }}
        >
          <Tab label="Personal" icon={<Person />} />
          <Tab label="Bank details" icon={<AccountBalanceIcon />} />
          <Tab label="Work experience" icon={<Work />} />
          <Tab label="Insurance" icon={<LocalHospital />} />
          <Tab label="Other Info" icon={<AnalyticsIcon />} />
          <Tab label="Documents" icon={<Description />} />
        </Tabs>

        <form>
          {tabValue === 0 && (
            <Grid container spacing={2}>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Employee Contact"
                  value={formData.phone}
                  onChange={(e) => handleChange('phone', e.target.value)}
                  error={!!errors.phone}
                  helperText={errors.phone}
                />
              </Grid>

              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Employee Name"
                  value={formData.employeeName}
                  onChange={(e) => handleChange('employeeName', e.target.value)}
                  error={!!errors.employeeName}
                  helperText={errors.employeeName}
                />
              </Grid>

              <Grid item xs={12} md={6}>
                <TextField
                  select
                  fullWidth
                  label="Gender"
                  value={formData.gender}
                  onChange={(e) => handleChange('gender', e.target.value)}
                  error={!!errors.gender}
                  helperText={errors.gender}
                >
                  <MenuItem value="male">Male</MenuItem>
                  <MenuItem value="female">Female</MenuItem>
                  <MenuItem value="other">Other</MenuItem>
                </TextField>
              </Grid>

              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Father or husband name"
                  value={formData.fatherName}
                  onChange={(e) => handleChange('fatherName', e.target.value)}
                />
              </Grid>

              <Grid item xs={12} md={6}>
                <LocalizationProvider dateAdapter={AdapterDayjs}>
                  <DatePicker
                    label="Date Of Birth"
                    value={formData.dob ? formData.dob : null}
                    onChange={(newValue) =>
                      setFormData((prev) => ({ ...prev, dob: newValue ? newValue : '' }))
                    }
                    inputFormat="DD/MM/YYYY"
                    renderInput={(params) => (
                      <TextField
                        {...params}
                        sx={{
                          width: '100%',
                        }}
                      />
                    )}
                  />
                </LocalizationProvider>
              </Grid>

              <Grid item xs={12} md={6}>
                <LocalizationProvider dateAdapter={AdapterDayjs}>
                  <DatePicker
                    label="Date Of Joining"
                    value={formData.joiningDate ? formData.joiningDate : null}
                    onChange={(newValue) =>
                      setFormData((prev) => ({ ...prev, joiningDate: newValue ? newValue : '' }))
                    }
                    inputFormat="DD/MM/YYYY"
                    renderInput={(params) => (
                      <TextField
                        {...params}
                        sx={{
                          width: '100%',
                        }}
                      />
                    )}
                  />
                </LocalizationProvider>
              </Grid>

              <Grid item xs={12} md={6}>
                <LocalizationProvider dateAdapter={AdapterDayjs}>
                  <TimePicker
                    label="Duty start time"
                    value={formData.fromTime ? dayjs(formData.fromTime, 'HH:mm') : null}
                    onChange={(newValue) =>
                      setFormData({ ...formData, fromTime: newValue ? newValue : '' })
                    }
                    renderInput={(params) => (
                      <TextField
                        {...params}
                        sx={{
                          width: '100%',
                        }}
                      />
                    )}
                  />
                </LocalizationProvider>
              </Grid>
              <Grid item xs={12} md={6}>
                <LocalizationProvider dateAdapter={AdapterDayjs}>
                  <TimePicker
                    label="Duty end time"
                    value={formData.toTime ? dayjs(formData.toTime, 'HH:mm') : null}
                    onChange={(newValue) =>
                      setFormData({ ...formData, toTime: newValue ? newValue : '' })
                    }
                    renderInput={(params) => (
                      <TextField
                        {...params}
                        sx={{
                          width: '100%',
                        }}
                      />
                    )}
                  />
                </LocalizationProvider>
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  select
                  fullWidth
                  label="Marital Status"
                  value={formData.maritalStatus}
                  onChange={(e) => handleChange('maritalStatus', e.target.value)}
                  error={!!errors['maritalStatus']}
                  helperText={errors['maritalStatus']}
                >
                  <MenuItem value="Un Married">Un Married</MenuItem>
                  <MenuItem value="Married">Married</MenuItem>
                </TextField>
              </Grid>
              {formData.maritalStatus === 'Married' && (
                <Grid item xs={12} md={6}>
                  <LocalizationProvider dateAdapter={AdapterDayjs}>
                    <DatePicker
                      label="Anniversary Date"
                      views={['month', 'day']}
                      value={formData.anniversaryDate}
                      inputFormat="DD/MM/YYYY"
                      onChange={(newValue) =>
                        setFormData({ ...formData, anniversaryDate: newValue ? newValue : '' })
                      }
                      renderInput={(params) => <TextField {...params} fullWidth />}
                    />
                  </LocalizationProvider>
                </Grid>
              )}
              <Divider sx={{ my: 3, width: '100%' }}>
                <Chip label="Address" />
              </Divider>

              {Object.keys(formData.address).map((field) => {
                const showAlways = ['street', 'zip'];
                const autoFetchedFieldsReady =
                  formData.address.zip.length === 6 &&
                  formData.address.city &&
                  formData.address.state;

                if (showAlways.includes(field) || autoFetchedFieldsReady) {
                  const isAutoField = ['city', 'state', 'country'].includes(field);
                  const errorKey = `address.${field}`;
                  const errorText = errors[errorKey];

                  return (
                    <Grid item xs={12} md={6} key={field}>
                      <TextField
                        fullWidth
                        label={field.charAt(0).toUpperCase() + field.slice(1)}
                        value={formData.address[field]}
                        onChange={(e) => handleChange(`address.${field}`, e.target.value)}
                        inputProps={
                          field === 'zip'
                            ? {
                                maxLength: 6,
                                inputMode: 'numeric',
                                pattern: '[0-9]*',
                              }
                            : undefined
                        }
                        error={!!errorText}
                        helperText={loading && isAutoField ? 'Loading...' : errorText || ''}
                        disabled={loading && isAutoField}
                      />
                    </Grid>
                  );
                }
                return null;
              })}
            </Grid>
          )}

          {tabValue === 1 && (
            <Grid container spacing={2}>
              <Divider sx={{ my: 1, width: '100%' }}>
                <Chip label="Bank Details" />
              </Divider>

              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Account Holder Name"
                  value={formData.bankDetails.holderName}
                  onChange={(e) => handleChange('bankDetails.holderName', e.target.value)}
                  error={!!errors['bankDetails.holderName']}
                  helperText={errors['bankDetails.holderName']}
                />
              </Grid>

              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Bank Account No."
                  value={formData.bankDetails.accountNumber}
                  onChange={(e) => handleChange('bankDetails.accountNumber', e.target.value)}
                  error={!!errors['bankDetails.accountNumber']}
                  helperText={errors['bankDetails.accountNumber']}
                />
              </Grid>

              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="IFSC No."
                  value={formData.bankDetails.ifsc}
                  onChange={(e) => handleChange('bankDetails.ifsc', e.target.value)}
                  error={!!errors['bankDetails.ifsc']}
                  helperText={errors['bankDetails.ifsc']}
                />
              </Grid>

              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Bank Name"
                  value={formData.bankDetails.bankName}
                  onChange={(e) => handleChange('bankDetails.bankName', e.target.value)}
                  error={!!errors['bankDetails.bankName']}
                  helperText={errors['bankDetails.bankName']}
                />
              </Grid>

              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Branch Name"
                  value={formData.bankDetails.branch}
                  onChange={(e) => handleChange('bankDetails.branch', e.target.value)}
                  error={!!errors['bankDetails.branch']}
                  helperText={errors['bankDetails.branch']}
                />
              </Grid>

              <Divider sx={{ my: 3, width: '100%' }}>
                <Chip label="Salary Details" />
              </Divider>

              <Grid item xs={12} md={6}>
                <TextField
                  select
                  fullWidth
                  label="Employee resides"
                  value={formData.empResides}
                  onChange={(e) => handleChange('empResides', e.target.value)}
                  error={!!errors['empResides']}
                  helperText={errors['empResides']}
                >
                  <MenuItem value="In House">In House</MenuItem>
                  <MenuItem value="Out House">Out House</MenuItem>
                </TextField>
              </Grid>

              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Basic Salary"
                  value={formData.bankDetails.salary}
                  onChange={(e) => handleChange('bankDetails.salary', e.target.value)}
                  error={!!errors['bankDetails.salary']}
                  helperText={errors['bankDetails.salary']}
                />
              </Grid>

              {formData.empResides === 'Out House' && (
                <>
                  <Grid item xs={12} md={6}>
                    <TextField
                      fullWidth
                      label="Home rent allowance"
                      value={formData.bankDetails.HRA}
                      onChange={(e) => handleChange('bankDetails.HRA', e.target.value)}
                      error={!!errors['bankDetails.HRA']}
                      helperText={errors['bankDetails.HRA']}
                    />
                  </Grid>

                  <Grid item xs={12} md={6}>
                    <TextField
                      fullWidth
                      label="Travel allowance"
                      value={formData.bankDetails.TA}
                      onChange={(e) => handleChange('bankDetails.TA', e.target.value)}
                      error={!!errors['bankDetails.TA']}
                      helperText={errors['bankDetails.TA']}
                    />
                  </Grid>
                </>
              )}
              <Grid item xs={12} md={6}>
                <TextField
                  select
                  fullWidth
                  label="Commission type"
                  value={formData.empCommissionType}
                  onChange={(e) => handleChange('empCommissionType', e.target.value)}
                  error={!!errors['empCommissionType']}
                  helperText={errors['empCommissionType']}
                >
                  <MenuItem value="Percentage">Percentage</MenuItem>
                  <MenuItem value="Fix">Fix</MenuItem>
                </TextField>
              </Grid>

              {formData.empCommissionType === 'Percentage' ? (
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Percentage"
                    value={formData.empCommission}
                    onChange={(e) => handleChange('empCommission', e.target.value)}
                    error={!!errors['empCommission']}
                    helperText={errors['empCommission']}
                  />
                </Grid>
              ) : (
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Fix Amount"
                    value={formData.empCommission}
                    onChange={(e) => handleChange('empCommission', e.target.value)}
                    error={!!errors['empCommission']}
                    helperText={errors['empCommission']}
                  />
                </Grid>
              )}
            </Grid>
          )}

          {tabValue === 2 && (
            <Grid container spacing={2}>
              <Divider sx={{ my: 2, width: '100%' }}>
                <Chip label="Work Experience" />
              </Divider>

              {formData.experiences.map((exp, index) => (
                <ExperienceEntry
                  key={index}
                  index={index}
                  experience={exp}
                  errors={errors.experiences || []}
                  onChange={(index, field, value) => {
                    const newExperiences = [...formData.experiences];
                    newExperiences[index] = { ...newExperiences[index], [field]: value };
                    handleChange('experiences', newExperiences);
                  }}
                  onRemove={(index) => {
                    const newExperiences = formData.experiences.filter((_, i) => i !== index);
                    handleChange('experiences', newExperiences);
                  }}
                />
              ))}

              <Button
                variant="outlined"
                onClick={() =>
                  handleChange('experiences', [
                    ...formData.experiences,
                    {
                      jobTitle: '',
                      company: '',
                      startYear: '',
                      endYear: '',
                      description: '',
                      current: false,
                    },
                  ])
                }
                startIcon={<AddIcon />}
                sx={{ mt: 2 }}
              >
                Add Experience
              </Button>
            </Grid>
          )}

          {tabValue === 3 && (
            <Grid container spacing={2}>
              <Grid container spacing={2}>
                <InsuranceSection
                  type="insurances.health"
                  label="Health"
                  values={formData.insurances.health}
                  errors={errors.insurances?.health}
                  onChange={handleChange}
                />

                <InsuranceSection
                  type="insurances.life"
                  label="Life"
                  values={formData.insurances.life}
                  errors={errors.insurances?.life}
                  onChange={handleChange}
                />

                <InsuranceSection
                  type="insurances.esi"
                  label="ESI"
                  values={formData.insurances.esi}
                  errors={errors.insurances?.esi}
                  onChange={handleChange}
                />
              </Grid>
            </Grid>
          )}

          {tabValue === 4 && (
            <Grid container spacing={2}>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Emergency Contact"
                  value={formData.otherInfo.emergencyContact}
                  onChange={(e) => handleChange('otherInfo.emergencyContact', e.target.value)}
                  error={!!errors['otherInfo.emergencyContact']}
                  helperText={errors['otherInfo.emergencyContact']}
                />
              </Grid>

              <Grid item xs={12} md={6}>
                <TextField
                  select
                  fullWidth
                  label="Department"
                  value={formData.otherInfo.workplace}
                  onChange={(e) => handleChange('otherInfo.workplace', e.target.value)}
                  error={!!errors['otherInfo.workplace']}
                  helperText={errors['otherInfo.workplace']}
                >
                  <MenuItem value="Salon">Salon</MenuItem>
                  <MenuItem value="PG">PG</MenuItem>
                  <MenuItem value="Home">Home</MenuItem>
                </TextField>
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Qualification"
                  value={formData.otherInfo.qualification}
                  onChange={(e) => handleChange('otherInfo.qualification', e.target.value)}
                  error={!!errors['otherInfo.qualification']}
                  helperText={errors['otherInfo.qualification']}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  select
                  fullWidth
                  label="Blood group"
                  value={formData.bloodGroup}
                  onChange={(e) => handleChange('bloodGroup', e.target.value)}
                  error={!!errors['bloodGroup']}
                  helperText={errors['bloodGroup']}
                >
                  <MenuItem value="A+">A+</MenuItem>
                  <MenuItem value="A-">A-</MenuItem>
                  <MenuItem value="B+">B+</MenuItem>
                  <MenuItem value="B-">B-</MenuItem>
                  <MenuItem value="AB+">AB+</MenuItem>
                  <MenuItem value="AB-">AB-</MenuItem>
                  <MenuItem value="O+">O+</MenuItem>
                  <MenuItem value="O-Home">O-</MenuItem>
                </TextField>
              </Grid>

              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Height in cm"
                  value={formData.height}
                  onChange={(e) => handleChange('height', e.target.value)}
                  error={!!errors['height']}
                  helperText={errors['height']}
                />
              </Grid>

              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Weight in KG"
                  value={formData.weight}
                  onChange={(e) => handleChange('weight', e.target.value)}
                  error={!!errors['weight']}
                  helperText={errors['weight']}
                />
              </Grid>

              <Grid item xs={12} md={6}>
                <LocalizationProvider dateAdapter={AdapterDayjs}>
                  <TimePicker
                    label="Lunch Time"
                    value={formData.lunchTime ? dayjs(formData.lunchTime, 'HH:mm') : null}
                    onChange={(newValue) =>
                      setFormData({ ...formData, lunchTime: newValue ? newValue : '' })
                    }
                    renderInput={(params) => (
                      <TextField
                        {...params}
                        sx={{
                          width: '100%',
                        }}
                      />
                    )}
                  />
                </LocalizationProvider>
              </Grid>
              <Grid item xs={12} md={6}>
                <LocalizationProvider dateAdapter={AdapterDayjs}>
                  <TimePicker
                    label="Tea Time"
                    value={formData.teaTime ? dayjs(formData.teaTime, 'HH:mm') : null}
                    onChange={(newValue) =>
                      setFormData({ ...formData, teaTime: newValue ? newValue : '' })
                    }
                    renderInput={(params) => (
                      <TextField
                        {...params}
                        sx={{
                          width: '100%',
                        }}
                      />
                    )}
                  />
                </LocalizationProvider>
              </Grid>

              <Grid item xs={12} md={12}>
                <FormControl component="fieldset">
                  <FormLabel component="legend">SMS Alerts?</FormLabel>
                  <RadioGroup
                    row
                    value={formData.smsAlert}
                    onChange={(e) => handleChange('smsAlert', e.target.value)}
                    // onChange={(e) => setSmsAlert(e.target.value === 'yes')}
                  >
                    <FormControlLabel value="Yes" control={<Radio />} label="Yes" />
                    <FormControlLabel value="No" control={<Radio />} label="No" />
                  </RadioGroup>
                </FormControl>
              </Grid>

              <Grid item xs={12} md={12}>
                <TextField
                  fullWidth
                  label="Remark"
                  multiline
                  rows={5}
                  value={formData.otherInfo.remark}
                  onChange={(e) => handleChange('otherInfo.remark', e.target.value)}
                  error={!!errors['otherInfo.remark']}
                  helperText={errors['otherInfo.remark']}
                />
              </Grid>
            </Grid>
          )}

          {tabValue === 5 && (
            <Box
              sx={{
                mt: 3,
                border: '1px solid #e0e0e0',
                borderRadius: 1,
                backgroundColor: '#fafafa',
                p: 3,
              }}
            >
              <Typography variant="h6" gutterBottom>
                ID Card Upload (Required)
              </Typography>

              <Grid container spacing={2} sx={{ marginTop: '8px' }}>
                <Grid item xs={12} md={4}>
                  <FileUpload
                    label="ID Front"
                    value={formData.documents.aadharFront}
                    onChange={(file) => handleDocumentChange('aadharFront', file)}
                    error={errors['documents.aadharFront']}
                  />
                </Grid>

                <Grid item xs={12} md={4}>
                  <FileUpload
                    label="ID Back"
                    value={formData.documents.aadharBack}
                    onChange={(file) => handleDocumentChange('aadharBack', file)}
                    error={errors['documents.aadharBack']}
                  />
                </Grid>

                <Grid item xs={12} md={4}>
                  <FileUpload
                    label="Profile Picture"
                    value={formData.documents.profilePicture}
                    onChange={(file) => handleDocumentChange('profilePicture', file)}
                    error={errors['documents.profilePicture']}
                  />
                </Grid>
              </Grid>
            </Box>
          )}

          <DialogActions xs={12} md={3} sx={{ px: 3, py: 2, justifyContent: 'space-between' }}>
            <Button onClick={onClose} variant="outlined">
              Close
            </Button>
            <Box sx={{ display: 'flex', justifyContent: 'center', flexGrow: 1 }}>
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
                onClick={() => setTabValue((prev) => Math.min(prev + 1, 5))}
                disabled={tabValue === 5}
              >
                Next
              </Button>
            </Box>

            <Box>
              <Button
                variant="contained"
                type="submit"
                disabled={tabValue !== 5 || isSubmitting}
                onClick={(e) => {
                  employeeDetail ? handleUpdate(e) : handleSubmit(e);
                }}
              >
                {employeeDetail
                  ? isSubmitting
                    ? 'Updating...'
                    : 'Update Employee'
                  : isSubmitting
                  ? 'Saving.....'
                  : 'Save Employee'}
              </Button>
            </Box>
          </DialogActions>
        </form>
      </ModalContent>
    </Modal>
  );
};

export default EmployeesForm;
