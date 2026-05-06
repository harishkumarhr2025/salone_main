import React, { useEffect, useMemo, useState } from 'react';
import { Fab, Box, Button, Typography, Card, CardContent, Grid } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import DownloadIcon from '@mui/icons-material/Download';
import UploadFileIcon from '@mui/icons-material/UploadFile';
import { CSVLink } from 'react-csv';
import AgentModal from 'src/components/AgentsModal/AgentsModal';
import Config from '../../components/Config';
import EntityImportDialog from '../../components/shared/EntityImportDialog';
import { useSelector } from 'react-redux';
import { canModifyRecords, canExportData } from '../../utils/permissions';

const Agents = () => {
  const [open, setOpen] = useState(false);
  const [agents, setAgents] = useState([]);
  const [isImportDialogOpen, setImportDialogOpen] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const currentUser = useSelector((state) => state.Auth.user);
  const allowImport = canModifyRecords(currentUser);
  const allowExport = canExportData(currentUser);

  const fetchAgents = async () => {
    try {
      const response = await Config.get('/get-all-agent');
      setAgents(response.data?.data || []);
    } catch (error) {
      console.error('Failed to fetch agents:', error);
      setAgents([]);
    }
  };

  useEffect(() => {
    fetchAgents();
  }, []);

  const handleOpen = () => {
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
  };

  const handleModalSubmit = () => {
    fetchAgents();
  };

  const csvHeaders = [
    { label: 'Agent ID', key: 'agent_ID' },
    { label: 'Agent Name', key: 'Agent_name' },
    { label: 'Contact Number', key: 'Agent_contact_number' },
    { label: 'Aadhar Number', key: 'Agent_aadhar_No' },
    { label: 'Vehicle Number', key: 'Agent_vehicle_no' },
    { label: 'Commission Type', key: 'Agent_commission_type' },
    { label: 'Commission Amount', key: 'Agent_commission_amount' },
    { label: 'Status', key: 'status' },
  ];

  const csvData = useMemo(
    () =>
      agents.map((agent) => ({
        agent_ID: agent.agent_ID,
        Agent_name: agent.Agent_name,
        Agent_contact_number: agent.Agent_contact_number,
        Agent_aadhar_No: agent.Agent_aadhar_No,
        Agent_vehicle_no: agent.Agent_vehicle_no,
        Agent_commission_type: agent.Agent_commission_type,
        Agent_commission_amount: agent.Agent_commission_amount,
        status: agent.status,
      })),
    [agents],
  );

  const handlePreviewImportRows = async (rows, { forceCreate = false } = {}) => {
    const response = await Config.post('/agents/import-preview', { rows, forceCreate });
    return response.data;
  };

  const handleImportRows = async (rows, { forceCreate = false } = {}) => {
    try {
      setIsImporting(true);
      const response = await Config.post('/agents/import', { rows, forceCreate });
      await fetchAgents();
      return response.data;
    } catch (error) {
      return null;
    } finally {
      setIsImporting(false);
    }
  };

  return (
    <div>
      <AgentModal
        open={open}
        handleClose={handleClose}
        handleModalSubmit={handleModalSubmit}
        // initialData={selectedFAQ}
        opacityValue={0.5}
      />
      <Box sx={{ p: 4 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Typography variant="h4">Agents</Typography>
          {allowExport && (
            <CSVLink
              data={csvData}
              headers={csvHeaders}
              filename="agents.csv"
              style={{ textDecoration: 'none' }}
            >
              <Button variant="outlined" startIcon={<DownloadIcon />}>
                Export CSV
              </Button>
            </CSVLink>
          )}
          {allowImport && (
            <Button variant="outlined" startIcon={<UploadFileIcon />} sx={{ ml: 2 }} onClick={() => setImportDialogOpen(true)}>
              Import CSV / Excel
            </Button>
          )}
        </Box>
        {agents.length ? (
          <Grid container spacing={2}>
            {agents.map((agent) => (
              <Grid item xs={12} md={4} key={agent._id}>
                <Card>
                  <CardContent>
                    <Typography variant="h6">{agent.Agent_name || 'Unnamed Agent'}</Typography>
                    <Typography variant="body2">ID: {agent.agent_ID || '-'}</Typography>
                    <Typography variant="body2">Phone: {agent.Agent_contact_number || '-'}</Typography>
                    <Typography variant="body2">Status: {agent.status || '-'}</Typography>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        ) : (
          <h1 style={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
            No Agents onboarded
          </h1>
        )}
      </Box>
      <Fab
        color="primary"
        aria-label="add"
        onClick={handleOpen}
        sx={{ position: 'fixed', bottom: '70px', right: '70px' }}
      >
        <AddIcon />
      </Fab>
      <EntityImportDialog
        open={isImportDialogOpen}
        onClose={() => setImportDialogOpen(false)}
        onPreview={handlePreviewImportRows}
        onImport={handleImportRows}
        isImporting={isImporting}
        title="Import Agents"
        infoText="Preview which agent rows will be inserted, updated, or skipped before importing them into agent management."
        importButtonLabel="Import Agents"
        templateFileName="agents-import-template.xlsx"
        sheetName="Agents"
        templateHeaders={['agent_ID', 'Agent_name', 'Agent_contact_number', 'Agent_aadhar_No', 'Agent_vehicle_no', 'Agent_commission_type', 'Agent_commission_amount', 'status']}
        templateExampleRow={{ agent_ID: '', Agent_name: 'Ravi Agent', Agent_contact_number: '9876543210', Agent_aadhar_No: '123412341234', Agent_vehicle_no: 'OD02AB1234', Agent_commission_type: 'Percentage', Agent_commission_amount: '10', status: 'Active' }}
      />
    </div>
  );
};

export default Agents;
