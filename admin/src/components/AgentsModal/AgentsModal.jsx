import React, { useEffect, useState } from 'react';
import Backdrop from '@mui/material/Backdrop';
import {
  TextField,
  Box,
  Button,
  Typography,
  Stack,
  Alert,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from '@mui/material';
import Modal from '@mui/material/Modal';
import Fade from '@mui/material/Fade';
import dayjs from 'dayjs';
import Toast from 'react-hot-toast';
import Config from '../../components/Config';

const AgentModal = ({ open, handleClose, handleModalSubmit, initialData, opacityValue }) => {
  const [agentDetails, setAgentDetails] = useState({
    agent_name: '',
    agent_mobile_no: '',
    agent_vehicle_no: '',
    agent_aadhar_no: '',
    commission_type: '',
    commission_amount: '',
    commission_percentage: '',
    agent_registration_date: dayjs(),
    agent_remarks: '',
  });
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setAgentDetails((prevDetails) => ({
      ...prevDetails,
      [name]: value,
    }));
  };

  const handleSubmit = async () => {
    if (!agentDetails.agent_name?.trim()) {
      setError('Agent name is required');
      return;
    }

    if (!agentDetails.agent_mobile_no?.trim()) {
      setError('Mobile number is required');
      return;
    }

    const payload = {
      Agent_name: agentDetails.agent_name,
      Agent_contact_number: agentDetails.agent_mobile_no,
      Agent_vehicle_no: agentDetails.agent_vehicle_no,
      Agent_aadhar_No: agentDetails.agent_aadhar_no,
      Agent_commission_type: agentDetails.commission_type,
      Agent_commission_amount:
        agentDetails.commission_type === 'fix'
          ? agentDetails.commission_amount
          : agentDetails.commission_percentage,
      Agent_registration_date: agentDetails.agent_registration_date
        ? dayjs(agentDetails.agent_registration_date).toISOString()
        : undefined,
      Agent_remark: agentDetails.agent_remarks,
    };

    try {
      setIsSubmitting(true);
      setError('');
      const response = await Config.post('/create-new-agent', payload);

      if (!response.data?.success) {
        setError(response.data?.message || 'Failed to add agent');
        return;
      }

      Toast.success(response.data?.message || 'Agent added successfully');
      handleModalSubmit?.(response.data?.agent);
      handleClose();

      setAgentDetails({
        agent_name: '',
        agent_mobile_no: '',
        agent_vehicle_no: '',
        agent_aadhar_no: '',
        commission_type: '',
        commission_amount: '',
        commission_percentage: '',
        agent_registration_date: dayjs(),
        agent_remarks: '',
      });
    } catch (submitError) {
      setError(submitError.response?.data?.message || 'Failed to add agent');
    } finally {
      setIsSubmitting(false);
    }
  };
  useEffect(() => {
    if (error) {
      const timeOut = setTimeout(() => {
        setError('');
      }, 4000);
      return () => clearInterval(timeOut);
    }
  }, [error]);

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
            maxHeight: '90vh', // Ensures the modal does not exceed 90% of the viewport height
            overflowY: 'auto',
          }}
        >
          <Typography id="transition-modal-title" variant="h6" align="center" component="h2">
            {/* {initialData ? "Update FAQ'S Here" : "Add new FAQ'S Here"} */}
            Enter Agent Details
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
                name="agent_name"
                id="outlined-basic"
                label="Agent Name"
                variant="outlined"
                value={agentDetails.agent_name}
                onChange={handleChange}
                sx={{
                  width: '50%',
                }}
              />
              <TextField
                name="agent_mobile_no"
                id="outlined-basic"
                label="Mobile Number"
                variant="outlined"
                value={agentDetails.agent_mobile_no}
                onChange={handleChange}
                sx={{
                  width: '50%',
                }}
              />
            </Box>

            <Box sx={{ display: 'flex', gap: 2, marginTop: '20px' }}>
              <TextField
                name="agent_vehicle_no"
                id="outlined-basic"
                label="Vehicle Number"
                variant="outlined"
                value={agentDetails.agent_vehicle_no}
                onChange={handleChange}
                sx={{
                  width: '50%',
                }}
              />
              <TextField
                name="agent_aadhar_no"
                id="outlined-basic"
                label="Agent Aadhar No"
                variant="outlined"
                value={agentDetails.agent_aadhar_no}
                onChange={handleChange}
                sx={{
                  width: '50%',
                }}
              />
            </Box>

            <Box sx={{ display: 'flex', gap: 2, marginTop: '20px' }}>
              <FormControl sx={{ minWidth: 120, width: '50%' }}>
                <InputLabel id="demo-select-small-label">Commission Type</InputLabel>
                <Select
                  name="commission_type"
                  labelId="demo-select-small-label"
                  id="demo-select-small"
                  value={agentDetails.commission_type}
                  label="Commission Type"
                  onChange={handleChange}
                >
                  <MenuItem value={'percentage'}>Percentage</MenuItem>
                  <MenuItem value={'fix'}>Fix</MenuItem>
                </Select>
              </FormControl>
              {agentDetails.commission_type === 'fix' ? (
                <TextField
                  name="commission_amount"
                  id="outlined-basic"
                  label="Commission Amount"
                  variant="outlined"
                  value={agentDetails.commission_amount}
                  onChange={handleChange}
                  sx={{
                    width: '50%',
                  }}
                />
              ) : (
                <TextField
                  name="commission_percentage"
                  id="outlined-basic"
                  label="Commission Percentage"
                  variant="outlined"
                  value={agentDetails.commission_percentage}
                  onChange={handleChange}
                  sx={{
                    width: '50%',
                  }}
                />
              )}
            </Box>

            <Box sx={{ marginTop: '20px' }}>
              <TextField
                name="agent_remarks"
                id="outlined-basic"
                label="Remark"
                variant="outlined"
                value={agentDetails.agent_remarks}
                onChange={handleChange}
                fullWidth
                multiline
                rows={3}
              />
            </Box>
            {/* <Box sx={{ display: 'flex', gap: 2, marginTop: '20px' }}>
              <LocalizationProvider dateAdapter={AdapterDayjs}>
                <DatePicker
                  label="Registration Date"
                  value={
                    agentDetails.agent_registration_date
                      ? agentDetails.agent_registration_date
                      : null
                  }
                  onChange={(newValue) =>
                    setAgentDetails({
                      ...agentDetails,
                      agent_registration_date: newValue ? newValue : '',
                    })
                  }
                  inputFormat="DD/MM/YYYY"
                  minDate={dayjs()}
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
           */}

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
                onClick={handleSubmit}
                // onClick={initialData ? handleUpdate : handleSubmit}
                disabled={isSubmitting}
                sx={{ width: '78%', padding: '8px', marginLeft: '10px' }}
              >
                {/* {initialData ? 'Update FAQ' : 'Add FAQ'} */}
                {isSubmitting ? 'Adding Agent...' : 'Add Agent'}
              </Button>
            </Box>
          </div>
        </Box>
      </Fade>
    </Modal>
  );
};

export default AgentModal;
