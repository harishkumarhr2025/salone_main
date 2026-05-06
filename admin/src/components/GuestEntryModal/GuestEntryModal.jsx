import React, { useCallback, useEffect, useMemo, useState } from 'react';
import Backdrop from '@mui/material/Backdrop';
import {
  TextField,
  Box,
  Button,
  FormHelperText,
  Typography,
  Stack,
  Alert,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  CircularProgress,
  InputAdornment,
  Grid,
  Paper,
  ToggleButton,
  ToggleButtonGroup,
  FormLabel,
  Chip,
  Autocomplete,
} from '@mui/material';
import {
  BreakfastDining as BreakfastIcon,
  LunchDining as LunchIcon,
  DinnerDining as DinnerIcon,
} from '@mui/icons-material';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import Modal from '@mui/material/Modal';
import Fade from '@mui/material/Fade';
import * as Yup from 'yup';
import { styled } from '@mui/material/styles';
import { useDropzone } from 'react-dropzone';
import Toast from 'react-hot-toast';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { TimePicker } from '@mui/x-date-pickers/TimePicker';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import dayjs from 'dayjs';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import DeleteIcon from '@mui/icons-material/Delete';
import Config from '../Config';
import axios from 'axios';
import { useDebounce } from 'use-debounce';
import { useDispatch, useSelector } from 'react-redux';
import { checkExistingGuest } from 'src/redux/features/GuestSlice';
import { fetchAvailableBed } from 'src/redux/features/RoomSlice';

const MEAL_PLAN_RATES = {
  breakfast: 2000,
  lunch: 2000,
  dinner: 2000,
};

const ALLOWED_FILE_TYPES = ['image/jpeg', 'image/png'];

const isCloudinaryConfigError = (message = '') =>
  typeof message === 'string' &&
  message.toLowerCase().includes('cloudinary is not configured on server');

const GuestEntryModal = ({ open, handleClose, handleModalSubmit, opacityValue, guest }) => {
  const [guestDetails, setGuestDetails] = useState({
    Guest_name: '',
    Guest_email: '',
    Guest_type: '',
    Guest_aadhar_No: '',
    Contact_number: '',
    Guest_address: '',
    Emergency_number: '',
    Arrival_date: '',
    Arrival_time: '',
    Checkout_date: '',
    Checkout_time: '',
    Room_no: '',
    selectedRoom: '',
    Room_type: '',
    Room_tariff: '',
    Adults: '',
    Children: '',
    Booking_details: '',
    Purpose_of_visit: '',
    Payment_type: '',
    Agent_commission: '',
    Profession_type: '',
    Guest_nationality: '',
    Passport_number: '',
    Foreign_guest_native_country: '',
    Guest_visa_no: '',
    Passport_place_of_issue: '',
    advance_deposit: '',
    registration_fee: '',
    meal_plan: [],
    roomId: '',
    bedId: '',
    bedNumber: '',
  });
  const [aadharFiles, setAadharFiles] = useState({
    aadharFront: null,
    aadharBack: null,
    Guest_picture: null,
  });
  const [error, setError] = useState('');
  const [errorText, setErrorText] = useState('');
  const [initialLoad, setInitialLoad] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [touched, setTouched] = useState({});
  const [availableRooms, setAvailableRooms] = useState([]);
  const [isCheckingGuest, setIsCheckingGuest] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [loadingBeds, setLoadingBeds] = useState(false);

  const [debouncedPhone] = useDebounce(guestDetails.Contact_number, 500);

  const beds = useSelector((state) => state.Room.beds);

  const dispatch = useDispatch();

  const handleFoodChange = (event, newSelection) => {
    setGuestDetails((prev) => ({ ...prev, meal_plan: Array.isArray(newSelection) ? newSelection : [] }));
  };

  const toAmount = (value) => {
    const amount = Number(value);
    return Number.isFinite(amount) && amount > 0 ? amount : 0;
  };

  const paymentSummary = useMemo(() => {
    const roomTariff = toAmount(guestDetails.Room_tariff);
    const registrationFee = toAmount(guestDetails.registration_fee);
    const advanceDeposit = toAmount(guestDetails.advance_deposit);
    const selectedMeals = Array.isArray(guestDetails.meal_plan) ? guestDetails.meal_plan : [];
    const mealCharge = selectedMeals.reduce(
      (sum, meal) => sum + (MEAL_PLAN_RATES[meal] || 0),
      0,
    );

    return {
      roomTariff,
      registrationFee,
      advanceDeposit,
      mealCharge,
      totalAmount: roomTariff + registrationFee + advanceDeposit + mealCharge,
    };
  }, [
    guestDetails.Room_tariff,
    guestDetails.registration_fee,
    guestDetails.advance_deposit,
    guestDetails.meal_plan,
  ]);

  const fileValidation = (isRequired = true) =>
    Yup.mixed()
      .test('fileRequired', 'File is required', function (value) {
        const { isUpdate } = this.options.context || {};
        return isUpdate ? true : !!value; // Skip validation if updating
      })
      .test(
        'fileNotEmpty',
        'Selected file is empty. Please choose a valid image.',
        (value) => !value || (value instanceof File && value.size > 0),
      )
      .test(
        'fileSize',
        'File too large (max 5MB)',
        (value) => !value || (value instanceof File && value.size <= 5 * 1024 * 1024),
      )
      .test(
        'fileType',
        'Unsupported format (JPEG/PNG only)',
        (value) => !value || (value instanceof File && ALLOWED_FILE_TYPES.includes(value.type)),
      );

  const phoneValidation = Yup.string()
    .matches(/^[6-9]\d{9}$/, 'Phone number should have 10 digits')
    .required('Phone number is required');

  const guestSchema = Yup.object().shape({
    Guest_name: Yup.string()
      .required('Guest name is required')
      .matches(
        /^[A-Za-z\s.'-]+$/, // Allows letters, spaces, and common name characters
        'Numbers and special characters are not allowed',
      )
      .min(3, 'Minimum 3 characters'),
    Guest_email: Yup.string().required('Email is required').email('Invalid email format'),
    Guest_aadhar_No: Yup.string()
      .required('Aadhar Number is required')
      .matches(/^[0-9]\d{11}$/, 'Aadhar must be exactly 12 digits'), // Ensures exactly 12 digits

    Contact_number: phoneValidation,
    Emergency_number: phoneValidation,
    Room_no: Yup.string().required('Room No is required'),
    bedId: Yup.string().required('Bed selection is required'),
    Guest_type: Yup.string().required('Guest type is required'),
    Guest_address: Yup.string().required('Guest Address is required'),
    Room_type: Yup.string().required('Room type is required'),
    Room_tariff: Yup.number()
      .required('Room tariff is required')
      .typeError('Room tariff must be a number'),
    Adults: Yup.number()
      .typeError('Number of adults must be a number')
      .required('Number of adults required')
      .integer('Must be a whole number')
      .min(1, 'At least 1 adult'),
    Children: Yup.number()
      .typeError('Number of Children must be a number')
      .integer('Must be a whole number')
      .min(0, 'cannot be negative'),
    Profession_type: Yup.string().required('Profession type is required'),
    Payment_type: Yup.string().required('Payment type is required'),
    Foreign_guest_native_country: Yup.string().when('Guest_nationality', {
      is: 'Other',
      then: Yup.string().required('Native country is required'),
    }),
    Passport_number: Yup.string().when('Guest_nationality', {
      is: 'Other',
      then: Yup.string().required('Passport number is required'),
    }),
    Guest_nationality: Yup.string().required('Nationality is required'),
  });

  const aadharSchema = Yup.object().shape({
    aadharFront: fileValidation(),
    aadharBack: fileValidation(),
    Guest_picture: fileValidation(),
  });

  // Unified validation handler
  const validateField = async (name, value) => {
    try {
      if (name in aadharFiles) {
        await aadharSchema.validateAt(name, { [name]: value });
      } else {
        await guestSchema.validateAt(name, { [name]: value });
      }
      setErrorText((prev) => ({ ...prev, [name]: '' }));
    } catch (error) {
      setErrorText((prev) => ({ ...prev, [name]: error.message }));
    }
  };

  const handleBlur = async (e) => {
    const { name, value } = e.target;
    setTouched((prev) => ({ ...prev, [name]: true }));
    validateField(name, guestDetails[name]);

    if (name === 'Contact_number' && value.length === 10 && !errorText.Contact_number) {
      try {
        setIsCheckingGuest(true);
        const response = await dispatch(checkExistingGuest(guestDetails.Contact_number));

        if (response?.payload.exists) {
          setGuestDetails((prev) => ({
            ...prev, // Keep existing values
            ...response.payload.guestDetails, // Auto-fill other fields
            Contact_number: value, // Preserve original input
            Arrival_date: dayjs(),
            Arrival_time: dayjs(),
            registration_fee: null,
            meal_plan: [],
            advance_deposit: null,
          }));
        }
      } catch (error) {
        console.error('Guest check failed:', error);
        setErrorText((prev) => ({
          ...prev,
          Contact_number: 'Error checking guest records',
        }));
      } finally {
        setIsCheckingGuest(false);
      }
    }
  };

  // Update handleDrop to generate previews
  const handleDrop = useCallback(
    (field) => (acceptedFiles) => {
      const file = acceptedFiles[0];
      if (file) {
        if (!(file instanceof File) || !ALLOWED_FILE_TYPES.includes(file.type) || file.size <= 0) {
          setError('Please upload a valid JPEG or PNG image file.');
          setAadharFiles((prev) => ({
            ...prev,
            [field]: null,
          }));
          return;
        }

        file.preview = URL.createObjectURL(file);
        setAadharFiles((prev) => ({
          ...prev,
          [field]: file,
        }));
        validateField(field, file);
      }
    },
    [],
  );

  // Use dropzone separately for front and back
  const { getRootProps: getFrontRootProps, getInputProps: getFrontInputProps } = useDropzone({
    accept: { 'image/jpeg': ['.jpeg', '.jpg'], 'image/png': ['.png'] },
    maxFiles: 1,
    onDrop: handleDrop('aadharFront'),
    maxSize: 5 * 1024 * 1024, // 5MB
    onDropRejected: (rejectedFiles) => {
      const firstError = rejectedFiles[0].errors[0];
      setError(firstError.message);
    },
  });

  const { getRootProps: getBackRootProps, getInputProps: getBackInputProps } = useDropzone({
    accept: { 'image/jpeg': ['.jpeg', '.jpg'], 'image/png': ['.png'] },
    maxFiles: 1,
    onDrop: handleDrop('aadharBack'),
    maxSize: 5 * 1024 * 1024, // 5MB
    onDropRejected: (rejectedFiles) => {
      const firstError = rejectedFiles[0].errors[0];
      setError(firstError.message);
    },
  });

  const { getRootProps: getGuestImageRootProps, getInputProps: getGuestImageInputProps } =
    useDropzone({
      accept: { 'image/jpeg': ['.jpeg', '.jpg'], 'image/png': ['.png'] },
      maxFiles: 1,
      onDrop: handleDrop('Guest_picture'),
      maxSize: 5 * 1024 * 1024, // 5MB
      onDropRejected: (rejectedFiles) => {
        const firstError = rejectedFiles[0].errors[0];
        setError(firstError.message);
      },
    });

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await guestSchema.validate(guestDetails, {
        abortEarly: false,
        context: { isUpdate: !!guest },
      });
      if (!guest?._id) {
        await aadharSchema.validate(aadharFiles, {
          abortEarly: false,
          context: { isUpdate: false },
        });
      }
      setErrorText({});
      setError('');

      let cloudinaryFrontUrl = guest?.aadharFront;
      let cloudinaryBackUrl = guest?.aadharBack;
      let cloudinaryGuestPicture = guest?.Guest_picture;

      const filesToUpload = [
        aadharFiles.aadharFront,
        aadharFiles.aadharBack,
        aadharFiles.Guest_picture,
      ].filter((file) => file instanceof File);

      const hasInvalidFile = filesToUpload.some(
        (file) => file.size <= 0 || !ALLOWED_FILE_TYPES.includes(file.type),
      );
      if (hasInvalidFile) {
        throw new Error('Please upload valid JPEG or PNG images for all required documents.');
      }

      if (filesToUpload.length > 0) {
        let uploadResults = [];

        try {
          const uploadConfig = await getSignatureForUpload('uphaarr', filesToUpload.length);
          const signatures = uploadConfig?.signatures || [];

          if (signatures.length !== filesToUpload.length) {
            throw new Error('Mismatch between files and signatures');
          }

          uploadResults = await uploadAadharImage(signatures, filesToUpload, uploadConfig);
        } catch (uploadError) {
          const message = uploadError?.message || uploadError?.response?.data?.message || '';
          if (!isCloudinaryConfigError(message)) {
            throw uploadError;
          }

          Toast('Cloudinary not configured. Using local upload fallback.');
          uploadResults = await uploadAadharImageLocally(filesToUpload);
        }

        uploadResults.forEach((result, index) => {
          const fileField = Object.keys(aadharFiles).find(
            (key) => aadharFiles[key] === filesToUpload[index],
          );
          if (fileField === 'aadharFront') cloudinaryFrontUrl = result.secure_url;
          if (fileField === 'aadharBack') cloudinaryBackUrl = result.secure_url;
          if (fileField === 'Guest_picture') cloudinaryGuestPicture = result.secure_url;
        });
      }

      const formData = {
        ...guestDetails,
        grand_total: paymentSummary.totalAmount,
        ...(!guest?._id && {
          aadharFront: cloudinaryFrontUrl,
          aadharBack: cloudinaryBackUrl,
          Guest_picture: cloudinaryGuestPicture,
        }),
      };

      const isSaved = guest?._id
        ? await handleModalSubmit({ ...formData, _id: guest._id }, 'update')
        : await handleModalSubmit(formData, 'add');

      if (isSaved) {
        handleClose();
      }
    } catch (error) {
      if (error.name === 'ValidationError') {
        // Handle Yup validation errors
        const validationErrors = error.inner.reduce(
          (acc, err) => ({
            ...acc,
            [err.path]: err.message,
          }),
          {},
        );
        setErrorText(validationErrors);
        Toast.error(error.inner?.[0]?.message || 'Please fill all required fields correctly.');
      } else {
        // Handle other errors (network, server, etc.)
        setError(error.message || 'An unexpected error occurred');
        Toast.error(error.message || 'Failed to save guest. Please try again.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const uploadAadharImageLocally = async (filesToUpload) => {
    if (!filesToUpload?.length) return [];

    const uploadPromise = filesToUpload.map(async (image, index) => {
      try {
        const formData = new FormData();
        formData.append('file', image);

        const response = await Config.post('/local-upload', formData, {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
          timeout: 30000,
        });

        if (!response?.data?.success || !response?.data?.secure_url) {
          throw new Error(response?.data?.message || 'Local upload failed');
        }

        return { secure_url: response.data.secure_url };
      } catch (error) {
        console.error(`Local upload failed for image ${index + 1}:`, error);
        return {
          error: true,
          message: error?.response?.data?.message || error.message,
        };
      }
    });

    const uploadResult = await Promise.all(uploadPromise);
    const successfulUploads = uploadResult.filter((result) => !result.error);
    const failedUploads = uploadResult.filter((result) => result.error);

    if (failedUploads.length > 0) {
      throw new Error(failedUploads[0]?.message || `${failedUploads.length} local upload(s) failed`);
    }

    return successfulUploads;
  };

  const uploadAadharImage = async (signatures, filesToUpload, uploadConfig = {}) => {
    try {
      if (!filesToUpload?.length || !signatures?.length) return [];

      const cloudinaryName =
        uploadConfig?.cloudName || process.env.REACT_APP_CLOUDINARY_NAME;
      const cloudinaryApiKey = uploadConfig?.apiKey || process.env.REACT_APP_CLOUDINARY_API_KEY;
      const resourceType = 'image';
      const folder = 'uphaarr';

      if (!cloudinaryName || !cloudinaryApiKey) {
        throw new Error('Cloudinary upload configuration is missing. Please contact admin.');
      }

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

          return response.data;
        } catch (error) {
          console.error(`Upload failed for image ${index + 1}:`, error);
          return {
            error: true,
            message: error?.response?.data?.error?.message || error.message,
          };
        }
      });

      const uploadResult = await Promise.all(uploadPromise);
      const successfulUploads = uploadResult.filter((result) => !result.error);
      const failedUploads = uploadResult.filter((result) => result.error);

      if (failedUploads.length > 0) {
        throw new Error(
          failedUploads[0]?.message || `${failedUploads.length} upload(s) failed`,
        );
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

      if (!signatureResponse?.data?.success) {
        throw new Error(signatureResponse?.data?.message || 'Could not obtain upload signatures');
      }

      return {
        signatures: signatureResponse.data?.signatures || [],
        cloudName: signatureResponse.data?.cloudName,
        apiKey: signatureResponse.data?.apiKey,
      };
    } catch (error) {
      console.error('Signature Error:', error);
      throw new Error(error?.response?.data?.message || error.message || 'Could not obtain upload signatures');
    }
  };

  useEffect(() => {
    if (guest?._id) {
      setGuestDetails((prevDetails) => ({
        ...prevDetails,
        ...guest,
        meal_plan: guest.meal_plan || [],
        Arrival_date: dayjs(guest.Arrival_date),
        Arrival_time: dayjs(guest.Arrival_time),
      }));
      setAadharFiles({
        aadharFront: guest.Guest_ID_Proof?.[0]?.imageUrl || guest.aadharFront || null,
        aadharBack: guest.Guest_ID_Proof?.[1]?.imageUrl || guest.aadharBack || null,
        Guest_picture: guest.Guest_picture || null,
      });
    } else if (open && !guest) {
      setGuestDetails({
        Guest_email: '',
        Guest_name: '',
        Guest_type: '',
        Guest_aadhar_No: '',
        Contact_number: '',
        Guest_address: '',
        Emergency_number: '',
        Checkout_date: '',
        Checkout_time: '',
        Room_no: '',
        Room_type: '',
        Room_tariff: '',
        Adults: '',
        Children: '',
        Booking_details: '',
        Purpose_of_visit: '',
        Payment_type: '',
        Agent_commission: '',
        Profession_type: '',
        Arrival_date: dayjs(),
        Arrival_time: dayjs(),
        Guest_nationality: '',
        roomId: '',
        bedId: '',
        bedNumber: '',
        meal_plan: [],
        registration_fee: '',
        advance_deposit: '',
      });
      setAadharFiles({
        aadharFront: null,
        aadharBack: null,
        Guest_picture: null,
      });
    }
  }, [open, guest]);

  useEffect(() => {
    if (open) {
      const timer = setTimeout(() => setInitialLoad(false), 200);
      return () => clearTimeout(timer);
    } else {
      setInitialLoad(true);
    }
  }, [open]);

  const handleChange = async (e) => {
    const { name, value } = e.target;
    setGuestDetails((prevDetails) => ({
      ...prevDetails,
      [name]: value,
    }));

    if (touched[name]) {
      await validateField(name, value);
    }
  };

  useEffect(() => {
    if (error) {
      const timeOut = setTimeout(() => {
        setError('');
      }, 4000);
      return () => clearTimeout(timeOut);
    }
  }, [error]);

  const validateAadharField = async (side, value) => {
    try {
      await aadharSchema.validateAt(side, { [side]: value }); // Use aadharSchema directly
      setErrorText((prev) => ({ ...prev, [side]: '' }));
    } catch (error) {
      setErrorText((prev) => ({ ...prev, [side]: error.message }));
    }
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  useEffect(() => {
    return () => {
      if (aadharFiles.aadharFront) URL.revokeObjectURL(aadharFiles.aadharFront.preview);
      if (aadharFiles.aadharBack) URL.revokeObjectURL(aadharFiles.aadharBack.preview);
      if (aadharFiles.Guest_picture) URL.revokeObjectURL(aadharFiles.Guest_picture.preview);
    };
  }, [aadharFiles]);

  const handleRoom = async () => {
    try {
      const roomResponse = await Config.get('/availableRoom');
      const filteredRooms = roomResponse.data?.data || [];

      setAvailableRooms(filteredRooms);

      if (filteredRooms.length > 0) {
        setGuestDetails((prevData) => ({
          ...prevData,
          Room_no: filteredRooms[0].roomNumber,
          roomId: filteredRooms[0]._id,
        }));
      }
    } catch (error) {
      Toast.error('Failed to fetch room');
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      await handleRoom();
    };

    fetchData();
  }, []);

  useEffect(() => {
    if (guestDetails.roomId) {
      const fetchBeds = async () => {
        setLoadingBeds(true);
        const response = await dispatch(fetchAvailableBed(guestDetails.roomId));
        const availableBeds = response?.payload?.bed || [];

        setGuestDetails((prev) => {
          if (prev.bedId || !availableBeds.length) {
            return prev;
          }

          return {
            ...prev,
            bedId: availableBeds[0]._id,
            bedNumber: availableBeds[0].bedNumber,
          };
        });
        setLoadingBeds(false);
      };
      fetchBeds();
    }
  }, [guestDetails.roomId]);

  return (
    <Modal
      aria-labelledby="transition-modal-title"
      aria-describedby="transition-modal-description"
      open={open}
      onClose={handleClose}
      keepMounted
      closeAfterTransition
      slots={{ backdrop: Backdrop }}
      slotProps={{
        backdrop: {
          style: { backgroundColor: `rgba(0, 0, 0, ${opacityValue})` },
          timeout: 400,
        },
      }}
    >
      <Fade in={open}>
        <Box
          sx={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            width: 700,
            bgcolor: 'white',
            boxShadow: 4,
            p: 4,
            maxHeight: '90vh',
            overflowY: 'auto',
            borderRadius: 4,
          }}
        >
          {initialLoad ? (
            <Box
              sx={{
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                p: 4,
                minHeight: '90vh',
              }}
            >
              <CircularProgress size={36} />
            </Box>
          ) : (
            <>
              <Typography id="transition-modal-title" variant="h6" align="center" component="h2">
                {guest ? 'Update Guest Details' : 'Enter Guest Details'}
              </Typography>
              <Stack sx={{ width: '100%', marginTop: '10px' }} spacing={2}>
                {error && (
                  <Alert
                    severity="error"
                    variant="outlined"
                    color="error"
                    sx={{ backgroundColor: '#FDEDED', mb: 2 }}
                  >
                    <Typography>{error}</Typography>
                  </Alert>
                )}
              </Stack>
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-around',
                  flexDirection: 'column',
                }}
              >
                <Box sx={{ display: 'flex', gap: 2, marginTop: '20px' }}>
                  <TextField
                    name="Contact_number"
                    id="outlined-basic"
                    label="Guest Mobile Number"
                    variant="outlined"
                    value={guestDetails.Contact_number}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    helperText={errorText.Contact_number}
                    error={!!errorText.Contact_number}
                    inputProps={{
                      maxLength: 10,
                    }}
                    sx={{
                      width: '50%',
                    }}
                  />
                  <TextField
                    name="Guest_name"
                    id="outlined-basic"
                    label="Guest Name"
                    variant="outlined"
                    value={guestDetails.Guest_name}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    helperText={errorText.Guest_name}
                    error={!!errorText.Guest_name}
                    sx={{
                      width: '50%',
                    }}
                  />
                </Box>

                <Box sx={{ display: 'flex', gap: 2, marginTop: '20px' }}>
                  <TextField
                    name="Guest_aadhar_No"
                    id="outlined-basic"
                    label="Guest Aadhar No."
                    variant="outlined"
                    value={guestDetails.Guest_aadhar_No}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    helperText={errorText.Guest_aadhar_No}
                    error={!!errorText.Guest_aadhar_No}
                    inputProps={{
                      maxLength: 12, // Ensures max 12 characters
                      inputMode: 'numeric', // Optimizes for mobile keyboards
                      pattern: '[2-9][0-9]{11}', // Enforces correct pattern
                      title: 'Aadhar must be exactly 12 digits and start with 2-9',
                    }}
                    onInput={(e) => {
                      e.target.value = e.target.value.replace(/[^0-9]/g, '').slice(0, 12);
                    }}
                    sx={{
                      width: '50%',
                    }}
                  />
                  <TextField
                    name="Guest_email"
                    id="outlined-basic"
                    label="Guest Email"
                    variant="outlined"
                    value={guestDetails.Guest_email}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    helperText={errorText.Guest_email}
                    error={!!errorText.Guest_email}
                    sx={{
                      width: '50%',
                    }}
                  />
                </Box>

                <Box sx={{ display: 'flex', gap: 2, marginTop: '20px' }}>
                  <TextField
                    name="Emergency_number"
                    id="outlined-basic"
                    label="Emergency Number"
                    variant="outlined"
                    value={guestDetails.Emergency_number}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    helperText={errorText.Emergency_number}
                    error={!!errorText.Emergency_number}
                    inputProps={{
                      maxLength: 10,
                    }}
                    sx={{
                      width: '50%',
                    }}
                  />
                  <FormControl sx={{ minWidth: 120, width: '50%' }} error={!!errorText.Guest_type}>
                    <InputLabel required id="demo-select-small-label">
                      Guest Type
                    </InputLabel>
                    <Select
                      name="Guest_type"
                      labelId="demo-select-small-label"
                      id="demo-select-small"
                      value={guestDetails.Guest_type}
                      label="Guest Type"
                      onChange={handleChange}
                      onBlur={handleBlur}
                      helperText={errorText.Guest_type}
                    >
                      <MenuItem value={'Daily'}>Daily</MenuItem>
                      <MenuItem value={'Monthly'}>Monthly</MenuItem>
                    </Select>
                    {errorText.Guest_type && (
                      <FormHelperText error>{errorText.Guest_type}</FormHelperText>
                    )}
                  </FormControl>
                </Box>
                {guestDetails.Guest_type === 'Monthly' ? (
                  <Box
                    sx={{
                      p: 2,
                      mt: 2,
                      border: '1px solid #e0e0e0',
                      borderRadius: 1,
                      backgroundColor: '#fafafa',
                    }}
                  >
                    <Typography variant="subtitle2" gutterBottom sx={{ mb: 2, fontWeight: 'bold' }}>
                      Only for monthly guest
                    </Typography>

                    <Box sx={{ display: 'flex', gap: 2, marginTop: '20px', alignItems: 'center' }}>
                      <TextField
                        name="advance_deposit"
                        id="outlined-basic"
                        label="Advance money"
                        variant="outlined"
                        value={guestDetails.advance_deposit}
                        onChange={handleChange}
                        sx={{
                          width: '50%',
                        }}
                      />

                      <TextField
                        name="registration_fee"
                        id="outlined-basic"
                        label="Registration Fees"
                        variant="outlined"
                        value={guestDetails.registration_fee}
                        onChange={handleChange}
                        sx={{
                          width: '50%',
                        }}
                      />
                    </Box>
                    <FormLabel component="legend">
                      <Typography variant="subtitle1" gutterBottom>
                        Meal Plan Selection
                      </Typography>
                    </FormLabel>

                    <ToggleButtonGroup
                      value={guestDetails.meal_plan}
                      onChange={handleFoodChange}
                      aria-label="meal selection"
                      fullWidth
                      color="primary"
                    >
                      {['breakfast', 'lunch', 'dinner'].map((meal) => (
                        <ToggleButton
                          key={meal}
                          value={meal}
                          sx={{
                            position: 'relative',
                            p: 2,
                            border: 1,
                            borderColor: 'divider',
                            '&.Mui-selected': {
                              backgroundColor: '#e8f5e9',
                              '&:hover': { backgroundColor: '#c8e6c9' },
                            },
                          }}
                        >
                          {/* Checkmark indicator */}
                          {(guestDetails.meal_plan || []).includes(meal) && (
                            <CheckCircleIcon
                              color="success"
                              sx={{
                                position: 'absolute',
                                top: 4,
                                right: 4,
                                fontSize: '1rem',
                                zIndex: 1,
                              }}
                            />
                          )}

                          {/* Meal content */}
                          <Box
                            sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}
                          >
                            {meal === 'breakfast' && <BreakfastIcon fontSize="medium" />}
                            {meal === 'lunch' && <LunchIcon fontSize="medium" />}
                            {meal === 'dinner' && <DinnerIcon fontSize="medium" />}
                            <Typography
                              variant="caption"
                              sx={{ mt: 1, textTransform: 'capitalize' }}
                            >
                              {meal}
                            </Typography>
                          </Box>
                        </ToggleButton>
                      ))}
                    </ToggleButtonGroup>

                    <Box
                      sx={{
                        mt: 2,
                        p: 2,
                        borderRadius: 1,
                        border: '1px solid #e0e0e0',
                        backgroundColor: '#fffde7',
                      }}
                    >
                      <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1 }}>
                        Total Amount
                      </Typography>
                      <Typography variant="body2">Room Tariff: ₹{paymentSummary.roomTariff}</Typography>
                      <Typography variant="body2">
                        Registration Fee: ₹{paymentSummary.registrationFee}
                      </Typography>
                      <Typography variant="body2">Meal Charges: ₹{paymentSummary.mealCharge}</Typography>
                      <Typography variant="body2">
                        Advance Deposit: ₹{paymentSummary.advanceDeposit}
                      </Typography>
                      <Typography variant="subtitle1" sx={{ mt: 1, fontWeight: 700 }}>
                        Total: ₹{paymentSummary.totalAmount}
                      </Typography>
                    </Box>
                  </Box>
                ) : null}

                <Box sx={{ display: 'flex', gap: 2, marginTop: '20px' }}>
                  <LocalizationProvider dateAdapter={AdapterDayjs}>
                    <DatePicker
                      label="Arrival Date"
                      value={guestDetails.Arrival_date ? guestDetails.Arrival_date : null}
                      onChange={(newValue) =>
                        setGuestDetails({ ...guestDetails, Arrival_date: newValue ? newValue : '' })
                      }
                      inputFormat="DD/MM/YYYY"
                      renderInput={(params) => (
                        <TextField
                          {...params}
                          sx={{
                            width: '50%',
                          }}
                        />
                      )}
                    />

                    <TimePicker
                      label="Arrival Time"
                      value={
                        guestDetails.Arrival_time ? dayjs(guestDetails.Arrival_time, 'HH:mm') : null
                      }
                      onChange={(newValue) =>
                        setGuestDetails({ ...guestDetails, Arrival_time: newValue ? newValue : '' })
                      }
                      renderInput={(params) => (
                        <TextField
                          {...params}
                          sx={{
                            width: '50%',
                          }}
                        />
                      )}
                    />
                  </LocalizationProvider>
                </Box>

                <Box sx={{ display: 'flex', gap: 2, marginTop: '20px', alignItems: 'center' }}>
                  <Autocomplete
                    options={[...availableRooms].sort((a, b) =>
                      a.roomNumber.localeCompare(b.roomNumber, undefined, { numeric: true }),
                    )}
                    getOptionLabel={(option) => `${option.roomNumber}`}
                    value={
                      guestDetails.Room_no
                        ? availableRooms.find((room) => room.roomNumber === guestDetails.Room_no)
                        : null
                    }
                    onChange={(event, newValue) => {
                      if (newValue) {
                        setGuestDetails((prev) => ({
                          ...prev,
                          Room_no: newValue?.roomNumber || '',
                          roomId: newValue._id,
                          bedId: '',
                          bedNumber: '',
                        }));
                      } else {
                        setGuestDetails((prev) => ({
                          ...prev,
                          Room_no: '',
                          roomId: '',
                          bedId: '',
                          bedNumber: '',
                        }));
                      }
                    }}
                    filterOptions={(options, state) => {
                      return options.filter(
                        (option) =>
                          option.roomNumber
                            .toLowerCase()
                            .includes(state.inputValue.toLowerCase()) || null,
                      );
                    }}
                    renderInput={(params) => (
                      <TextField
                        {...params}
                        label="Select Room"
                        placeholder="Select Room"
                        error={!!errorText.Room_no}
                        helperText={errorText.Room_no}
                        InputProps={{
                          ...params.InputProps,
                          style: {
                            borderRadius: '8px',
                            backgroundColor: '#f8f9fa',
                            transition: 'all 0.3s ease',
                          },
                        }}
                        InputLabelProps={{
                          shrink: true,
                          style: {
                            color: '#6c757d',
                            fontWeight: 500,
                            transform: 'translate(14px, -9px) scale(0.75)',
                          },
                        }}
                      />
                    )}
                    renderOption={(props, option) => (
                      <li
                        {...props}
                        style={{
                          ...props.style,
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          padding: '12px 16px',
                          borderBottom: '1px solid #e9ecef',
                          transition: 'all 0.2s ease',
                          padding: '10px 16px',
                          fontSize: '0.9rem',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '8px',
                          '&:hover': {
                            backgroundColor: '#f8f9fa !important',
                          },
                        }}
                      >
                        <span
                          style={{
                            fontSize: '1rem',
                            fontWeight: 500,
                            color: '#212529',
                          }}
                        >
                          {option.roomNumber}
                        </span>
                      </li>
                    )}
                    sx={{
                      width: '50%',
                      '& .MuiAutocomplete-inputRoot': {
                        padding: '8px 12px',
                      },
                      '& .MuiAutocomplete-popupIndicator': {
                        color: '#6c757d',
                      },
                      '& .MuiAutocomplete-clearIndicator': {
                        color: '#6c757d',
                      },
                    }}
                    disableClearable
                    noOptionsText={'No room found'}
                    ListboxProps={{
                      style: {
                        maxHeight: '300px',
                        borderRadius: '8px',
                        boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
                      },
                    }}
                    componentsProps={{
                      paper: {
                        style: {
                          borderRadius: '8px',
                          marginTop: '8px',
                          border: '1px solid #e9ecef',
                        },
                      },
                    }}
                  />

                  <Autocomplete
                    options={beds?.filter((bed) => bed.status === 'available') || []}
                    getOptionLabel={(option) => `${option.bedNumber}`}
                    value={beds?.find((bed) => bed._id === guestDetails.bedId) || null}
                    onChange={(event, newValue) => {
                      setGuestDetails((prev) => ({
                        ...prev,
                        bedId: newValue?._id || '',
                        bedNumber: newValue?.bedNumber || '',
                      }));
                    }}
                    loading={loadingBeds}
                    filterOptions={(options, state) => {
                      if (!guestDetails.roomId) return [];
                      return options.filter((bed) =>
                        bed.bedNumber.toLowerCase().includes(state.inputValue.toLowerCase()),
                      );
                    }}
                    renderInput={(params) => (
                      <TextField
                        {...params}
                        label="Select Bed"
                        placeholder={guestDetails.roomId ? 'Choose bed' : 'Select a room first'}
                        error={!!errorText.bedId}
                        helperText={errorText.bedId}
                        disabled={!guestDetails.roomId}
                        InputProps={{
                          ...params.InputProps,
                          endAdornment: (
                            <>
                              {loadingBeds ? <CircularProgress color="inherit" size={20} /> : null}
                              {params.InputProps.endAdornment}
                            </>
                          ),
                          style: {
                            borderRadius: '8px',
                            backgroundColor: '#f8f9fa',
                            transition: 'all 0.3s ease',
                          },
                        }}
                        InputLabelProps={{
                          style: {
                            color: '#6c757d',
                            fontWeight: 500,
                          },
                        }}
                      />
                    )}
                    renderOption={(props, option) => (
                      <li
                        {...props}
                        style={{
                          ...props.style,
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          padding: '12px 16px',
                          borderBottom: '1px solid #e9ecef',
                          transition: 'all 0.2s ease',
                        }}
                      >
                        <span
                          style={{
                            fontSize: '1rem',
                            fontWeight: 500,
                            color: '#212529',
                          }}
                        >
                          {option.bedNumber}
                        </span>
                        <Chip
                          label={option.status}
                          size="small"
                          sx={{
                            ml: 1,
                            backgroundColor: option.status === 'available' ? '#e8f5e9' : '#ffebee',
                            color: option.status === 'available' ? '#2e7d32' : '#c62828',
                          }}
                        />
                      </li>
                    )}
                    sx={{
                      width: '50%',
                      '& .MuiAutocomplete-inputRoot': {
                        padding: '8px 12px',
                      },
                      '& .Mui-disabled': {
                        backgroundColor: '#eceff1',
                        cursor: 'not-allowed',
                      },
                    }}
                    disableClearable
                    noOptionsText={
                      guestDetails.roomId ? 'No available beds' : 'Select a room first'
                    }
                    ListboxProps={{
                      style: {
                        maxHeight: '300px',
                        borderRadius: '8px',
                        boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
                      },
                    }}
                    componentsProps={{
                      paper: {
                        style: {
                          borderRadius: '8px',
                          marginTop: '8px',
                          border: '1px solid #e9ecef',
                        },
                      },
                    }}
                    disabled={!guestDetails.roomId}
                  />

                  <FormControl sx={{ minWidth: 120, width: '50%' }} error={!!errorText.Room_type}>
                    <InputLabel id="demo-select-small-label">Room Type</InputLabel>
                    <Select
                      name="Room_type"
                      labelId="demo-select-small-label"
                      id="demo-select-small"
                      value={guestDetails.Room_type}
                      label="Room Type"
                      onChange={handleChange}
                      onBlur={handleBlur}
                    >
                      <MenuItem value={'AC'}>AC</MenuItem>
                      <MenuItem value={'Non-AC'}>Non AC</MenuItem>
                    </Select>
                    {errorText.Room_type && (
                      <FormHelperText error>{errorText.Room_type}</FormHelperText>
                    )}
                  </FormControl>
                </Box>

                <Box sx={{ display: 'flex', gap: 2, marginTop: '20px' }}>
                  <TextField
                    name="Room_tariff"
                    id="outlined-basic"
                    label="Room Tariff"
                    variant="outlined"
                    value={guestDetails.Room_tariff}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    helperText={errorText.Room_tariff}
                    error={!!errorText.Room_tariff}
                    InputProps={{
                      startAdornment: <InputAdornment position="start">₹</InputAdornment>,
                    }}
                    sx={{
                      width: '50%',
                    }}
                  />
                  <TextField
                    name="Purpose_of_visit"
                    id="outlined-basic"
                    label="Purpose of visit"
                    variant="outlined"
                    value={guestDetails.Purpose_of_visit}
                    onChange={handleChange}
                    sx={{
                      width: '50%',
                    }}
                  />
                </Box>

                <Box sx={{ display: 'flex', gap: 2, marginTop: '20px' }}>
                  <TextField
                    name="Adults"
                    id="outlined-basic"
                    label="Number of Adults"
                    variant="outlined"
                    value={guestDetails.Adults}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    helperText={errorText.Adults}
                    error={!!errorText.Adults}
                    inputProps={{
                      min: 1,
                      step: 1,
                      pattern: '[0-9]*',
                    }}
                    sx={{
                      width: '50%',
                    }}
                  />
                  <TextField
                    name="Children"
                    id="outlined-basic"
                    label="Number of Children"
                    variant="outlined"
                    value={guestDetails.Children}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    helperText={errorText.Children}
                    error={!!errorText.Children}
                    sx={{
                      width: '50%',
                    }}
                  />
                </Box>

                <Box sx={{ display: 'flex', gap: 2, marginTop: '20px', alignItems: 'center' }}>
                  <FormControl
                    sx={{ minWidth: 120, width: '50%' }}
                    error={!!errorText.Profession_type}
                  >
                    <InputLabel id="demo-select-small-label">Profession Type</InputLabel>
                    <Select
                      name="Profession_type"
                      labelId="demo-select-small-label"
                      id="demo-select-small"
                      value={guestDetails.Profession_type}
                      label="Profession Type"
                      onChange={handleChange}
                      onBlur={handleBlur}
                    >
                      <MenuItem value={'Student'}>Student</MenuItem>
                      <MenuItem value={'Working'}>Working</MenuItem>
                    </Select>
                    {errorText.Profession_type && (
                      <FormHelperText error>{errorText.Profession_type}</FormHelperText>
                    )}
                  </FormControl>
                  <FormControl
                    sx={{ minWidth: 120, width: '50%' }}
                    error={!!errorText.Payment_type}
                  >
                    <InputLabel id="demo-select-small-label">Payment Type</InputLabel>
                    <Select
                      name="Payment_type"
                      labelId="demo-select-small-label"
                      id="demo-select-small"
                      value={guestDetails.Payment_type}
                      label="Payment Type"
                      onChange={handleChange}
                      onBlur={handleBlur}
                    >
                      <MenuItem value={'Cash'}>Cash</MenuItem>
                      <MenuItem value={'UPI'}>UPI</MenuItem>
                      <MenuItem value={'Card'}>Card</MenuItem>
                      <MenuItem value={'Cheque'}>Cheque</MenuItem>
                    </Select>
                    {errorText.Payment_type && (
                      <FormHelperText error>{errorText.Payment_type}</FormHelperText>
                    )}
                  </FormControl>
                </Box>
                <Box sx={{ marginTop: '20px' }}>
                  <TextField
                    name="Guest_address"
                    id="outlined-basic"
                    label="Address"
                    variant="outlined"
                    value={guestDetails.Guest_address}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    helperText={errorText.Guest_address}
                    error={!!errorText.Guest_address}
                    fullWidth
                    multiline
                    rows={3}
                  />
                </Box>
                <Box sx={{ display: 'flex', gap: 2, marginTop: '20px', alignItems: 'center' }}>
                  <TextField
                    name="Booking_details"
                    id="outlined-basic"
                    label="Booking Details"
                    variant="outlined"
                    value={guestDetails.Booking_details}
                    onChange={handleChange}
                    sx={{
                      width: '50%',
                    }}
                  />

                  <TextField
                    name="Agent_commission"
                    id="outlined-basic"
                    label="Agent Commission"
                    variant="outlined"
                    value={guestDetails.Agent_commission}
                    onChange={handleChange}
                    sx={{
                      width: '50%',
                    }}
                  />
                </Box>

                <Box
                  sx={{
                    display: 'flex',
                    gap: 2,
                    marginTop: '20px',
                    alignItems: 'center',
                  }}
                >
                  <FormControl
                    sx={{ minWidth: 120 }}
                    fullWidth
                    error={!!errorText.Guest_nationality}
                  >
                    <InputLabel id="demo-select-small-label">Nationality</InputLabel>
                    <Select
                      name="Guest_nationality"
                      labelId="demo-select-small-label"
                      id="demo-select-small"
                      value={guestDetails.Guest_nationality}
                      label="Nationality"
                      onChange={handleChange}
                      onBlur={handleBlur}
                    >
                      <MenuItem value={'Indian'}>Indian</MenuItem>
                      {/* <MenuItem value={'Other'}>Other</MenuItem> */}
                    </Select>
                    {errorText.Guest_nationality && (
                      <FormHelperText error>{errorText.Guest_nationality}</FormHelperText>
                    )}
                  </FormControl>
                </Box>
                {/* {guestDetails.Guest_nationality === 'Other' ? (
                  <Box
                    sx={{
                      p: 2,
                      mt: 1,
                      border: '1px solid #e0e0e0',
                      borderRadius: 1,
                      backgroundColor: '#fafafa',
                    }}
                  >
                    <Typography variant="subtitle2" gutterBottom sx={{ mb: 2, fontWeight: 'bold' }}>
                      Foreign Guest Details
                    </Typography>

                    <Box sx={{ display: 'flex', gap: 2, marginTop: '20px', alignItems: 'center' }}>
                      <TextField
                        name="Passport_number"
                        id="outlined-basic"
                        label="Passport Number"
                        variant="outlined"
                        value={guestDetails.Passport_number}
                        onChange={handleChange}
                        sx={{
                          width: '50%',
                        }}
                      />

                      <TextField
                        name="Guest_visa_no"
                        id="outlined-basic"
                        label="Visa No"
                        variant="outlined"
                        value={guestDetails.Guest_visa_no}
                        onChange={handleChange}
                        sx={{
                          width: '50%',
                        }}
                      />
                    </Box>

                    <Box sx={{ display: 'flex', gap: 2, marginTop: '20px', alignItems: 'center' }}>
                      <TextField
                        name="Foreign_guest_native_country"
                        id="outlined-basic"
                        label="Native Country"
                        variant="outlined"
                        value={guestDetails.Foreign_guest_native_country}
                        onChange={handleChange}
                        sx={{
                          width: '50%',
                        }}
                      />

                      <TextField
                        name="Passport_place_of_issue"
                        id="outlined-basic"
                        label="Passport place of issue"
                        variant="outlined"
                        value={guestDetails.Passport_place_of_issue}
                        onChange={handleChange}
                        sx={{
                          width: '50%',
                        }}
                      />
                    </Box>
                  </Box>
                ) : null} */}

                {/* Keep this outer conditional to show either upload fields or existing images */}
                {guest?._id ? (
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
                      ID Documents
                    </Typography>
                    <Grid
                      item
                      sx={{ display: 'flex', gap: 2, marginTop: '20px', alignItems: 'center' }}
                    >
                      {['aadharFront', 'aadharBack', 'Guest_picture'].map((side) => (
                        <Grid item xs={6} key={side} sx={{ width: '50%', position: 'relative' }}>
                          <Box
                            sx={{
                              position: 'relative',
                              height: 220,
                              border: '2px dashed #e0e0e0',
                              borderRadius: 1,
                              overflow: 'hidden',
                              '&:hover .update-overlay': {
                                opacity: 1,
                              },
                            }}
                          >
                            {/* Existing Image */}
                            <img
                              // src={guest[side]}
                              src={
                                side === 'Guest_picture'
                                  ? guest.Guest_picture
                                  : guest.Guest_ID_Proof[side === 'aadharFront' ? 0 : 1]?.imageUrl
                              }
                              alt={side
                                .replace('aadhar', 'Aadhar ')
                                .replace('Guest_picture', 'Guest Photo')}
                              style={{
                                width: '100%',
                                height: '100%',
                                objectFit: 'contain',
                              }}
                            />

                            {/* Hover Overlay */}
                            <Box
                              className="update-overlay"
                              sx={{
                                position: 'absolute',
                                top: 0,
                                left: 0,
                                right: 0,
                                bottom: 0,
                                backgroundColor: 'rgba(0, 0, 0, 0.7)',
                                color: 'white',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                opacity: 0,
                                transition: 'opacity 0.3s ease',
                                pointerEvents: 'none',
                                textAlign: 'center',
                                padding: 2,
                              }}
                            >
                              <Typography variant="body2">
                                ID documents cannot be updated
                              </Typography>
                            </Box>
                          </Box>
                        </Grid>
                      ))}
                    </Grid>
                  </Box>
                ) : (
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
                    <Grid
                      item
                      sx={{ display: 'flex', gap: 2, marginTop: '20px', alignItems: 'center' }}
                    >
                      {[
                        {
                          side: 'aadharFront',
                          getRootProps: getFrontRootProps,
                          getInputProps: getFrontInputProps,
                        },
                        {
                          side: 'aadharBack',
                          getRootProps: getBackRootProps,
                          getInputProps: getBackInputProps,
                        },
                        {
                          side: 'Guest_picture',
                          getRootProps: getGuestImageRootProps,
                          getInputProps: getGuestImageInputProps,
                        },
                      ].map(({ side, getRootProps, getInputProps }) => (
                        <Grid item xs={6} key={side} sx={{ width: '50%' }}>
                          <Paper
                            variant="outlined"
                            sx={{
                              p: 2,
                              border: '2px dashed #e0e0e0',
                              borderColor: aadharFiles[side] ? 'gray' : 'grey.500',
                              textAlign: 'center',
                              cursor: 'pointer',
                              height: 220,
                              display: 'flex',
                              flexDirection: 'column',
                              justifyContent: 'center',
                              borderRadius: 1,
                              backgroundColor: '#fafafa',
                              '&:hover': {
                                borderColor: 'primary.main',
                              },
                            }}
                            {...getRootProps()}
                          >
                            <input {...getInputProps()} />
                            {aadharFiles[side] ? (
                              <Box sx={{ display: 'flex', flexDirection: 'column' }}>
                                <img
                                  src={
                                    aadharFiles[side] instanceof File
                                      ? URL.createObjectURL(aadharFiles[side])
                                      : aadharFiles[side]?.preview || aadharFiles[side]
                                  }
                                  alt={`Aadhar ${side}`}
                                  style={{
                                    maxHeight: 120,
                                    maxWidth: '100%',
                                    objectFit: 'contain',
                                  }}
                                />
                                <Typography variant="caption">
                                  {aadharFiles[side]?.name
                                    ? `${aadharFiles[side].name.slice(0, 12)}...`
                                    : 'Selected File'}
                                  {aadharFiles[side]?.size &&
                                    ` (${formatFileSize(aadharFiles[side].size)})`}
                                </Typography>
                                <Button
                                  variant="outlined"
                                  color="error"
                                  size="small"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setAadharFiles((prev) => ({ ...prev, [side]: null }));
                                    validateAadharField(side, null);
                                  }}
                                >
                                  Remove
                                  <DeleteIcon fontSize="small" />
                                </Button>
                                {errorText[`aadhar${side}`] && (
                                  <FormHelperText error sx={{ mt: 1 }}>
                                    {errorText[`aadhar${side}`]}
                                  </FormHelperText>
                                )}
                              </Box>
                            ) : (
                              <>
                                <CloudUploadIcon
                                  fontSize="large"
                                  color="action"
                                  sx={{ alignSelf: 'center' }}
                                />
                                <Typography variant="body2" sx={{ mt: 1 }}>
                                  {side === 'Guest_picture'
                                    ? 'Drag & drop Guest Image here'
                                    : `Drag & drop ${side.replace('aadhar', 'Aadhar ')}`}
                                </Typography>
                                <Typography variant="caption" color="textSecondary">
                                  (or click to select)
                                </Typography>
                                <Typography variant="caption" color="textSecondary" sx={{ mt: 1 }}>
                                  Supported formats: JPEG, PNG
                                </Typography>
                              </>
                            )}
                          </Paper>
                        </Grid>
                      ))}
                    </Grid>
                  </Box>
                )}

                <Box sx={{ marginTop: '20px' }}>
                  <Button
                    variant="outlined"
                    sx={{ width: '20%', padding: '8px' }}
                    onClick={handleClose}
                  >
                    Close
                  </Button>
                  <Button
                    variant="contained"
                    onClick={handleFormSubmit}
                    disabled={isSubmitting}
                    sx={{ width: '78%', padding: '8px', marginLeft: '10px' }}
                  >
                    {isSubmitting ? (
                      <CircularProgress size={24} />
                    ) : guest ? (
                      'Update Guest'
                    ) : (
                      'Add Guest'
                    )}
                  </Button>
                </Box>
              </div>
            </>
          )}
        </Box>
      </Fade>
    </Modal>
  );
};

export default GuestEntryModal;
