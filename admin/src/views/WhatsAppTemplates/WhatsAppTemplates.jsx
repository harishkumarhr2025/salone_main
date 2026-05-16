import React, { useCallback, useEffect, useState } from 'react';
import {
  Box,
  Button,
  Card,
  CardContent,
  CardActions,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  Fab,
  FormControl,
  Grid,
  IconButton,
  InputLabel,
  MenuItem,
  Select,
  Stack,
  TextField,
  Tooltip,
  Typography,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import NotificationsActiveIcon from '@mui/icons-material/NotificationsActive';
import WhatsAppIcon from '@mui/icons-material/WhatsApp';
import Toast from 'react-hot-toast';
import Config from '../../components/Config';
import WhatsAppTemplateModal from '../../components/WhatsAppTemplateModal/WhatsAppTemplateModal';

const CATEGORY_COLORS = {
  'check-in':  'success',
  'checkout':  'warning',
  'reminder':  'info',
  'promotion': 'secondary',
  'custom':    'default',
};

const WhatsAppTemplates = () => {
  const [templates, setTemplates] = useState([]);
  const [filterCategory, setFilterCategory] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editTarget, setEditTarget] = useState(null);
  const [deleting, setDeleting] = useState(null);

  // Test schedule dialog (provider 1 — scheduled)
  const [testDialog, setTestDialog] = useState({ open: false, template: null });
  const [testPhone, setTestPhone] = useState('');
  const [testSending, setTestSending] = useState(false);

  // WA2 direct test dialog (provider 2 — immediate)
  const [wa2Dialog, setWa2Dialog] = useState({ open: false, template: null });
  const [wa2Phone, setWa2Phone] = useState('');
  const [wa2Message, setWa2Message] = useState('');
  const [wa2Sending, setWa2Sending] = useState(false);

  const fetchTemplates = useCallback(async () => {
    try {
      const params = {};
      if (filterCategory) params.category = filterCategory;
      const res = await Config.get('/whatsapp/templates', { params });
      setTemplates(res.data?.data || []);
    } catch {
      Toast.error('Failed to load templates');
    }
  }, [filterCategory]);

  useEffect(() => { fetchTemplates(); }, [fetchTemplates]);

  const handleSaved = () => { fetchTemplates(); };

  const openAdd  = () => { setEditTarget(null); setModalOpen(true); };
  const openEdit = (t) => { setEditTarget(t);    setModalOpen(true); };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this template?')) return;
    try {
      setDeleting(id);
      const res = await Config.delete(`/whatsapp/templates/${id}`);
      if (res.data?.success) {
        Toast.success('Template deleted');
        setTemplates((prev) => prev.filter((t) => t._id !== id));
      }
    } catch {
      Toast.error('Failed to delete template');
    } finally {
      setDeleting(null);
    }
  };

  const copyBody = (body) => {
    navigator.clipboard.writeText(body).then(() => Toast.success('Copied!'));
  };

  const openTestDialog = (t) => {
    setTestPhone('');
    setTestDialog({ open: true, template: t });
  };

  const openWA2Dialog = (t) => {
    setWa2Phone('');
    setWa2Message(t.body || '');
    setWa2Dialog({ open: true, template: t });
  };

  const handleSendWA2 = async () => {
    if (!/^[6-9]\d{9}$/.test(wa2Phone)) {
      Toast.error('Enter a valid 10-digit mobile number');
      return;
    }
    try {
      setWa2Sending(true);
      const res = await Config.post('/whatsapp/wa2/test', {
        to: wa2Phone,
        message: wa2Message.trim() || undefined,
      });
      if (res.data?.success) {
        Toast.success('Message sent via WA2 provider!');
        setWa2Dialog({ open: false, template: null });
      } else {
        Toast.error(res.data?.message || 'WA2 send failed');
      }
    } catch (err) {
      Toast.error(err.response?.data?.message || 'WA2 send failed');
    } finally {
      setWa2Sending(false);
    }
  };

  const handleSendTest = async () => {
    if (!/^[6-9]\d{9}$/.test(testPhone)) {
      Toast.error('Enter a valid 10-digit mobile number');
      return;
    }
    try {
      setTestSending(true);
      const res = await Config.post('/whatsapp/test-schedule', {
        templateId: testDialog.template._id,
        to: testPhone,
      });
      if (res.data?.success) {
        Toast.success(res.data.message || 'Test message scheduled for 1 minute from now!');
        setTestDialog({ open: false, template: null });
      } else {
        Toast.error(res.data?.message || 'Failed to schedule test');
      }
    } catch (err) {
      Toast.error(err.response?.data?.message || 'Failed to schedule test');
    } finally {
      setTestSending(false);
    }
  };

  return (
    <Box sx={{ p: { xs: 2, md: 3 } }}>
      {/* Header */}
      <Stack direction="row" alignItems="center" justifyContent="space-between" mb={3} flexWrap="wrap" gap={1}>
        <Box>
          <Typography variant="h5" fontWeight={700}>WhatsApp Templates</Typography>
          <Typography variant="body2" color="text.secondary">
            Create and manage message templates with dynamic fields
          </Typography>
        </Box>
        <Button variant="contained" startIcon={<AddIcon />} onClick={openAdd}>
          New Template
        </Button>
      </Stack>

      {/* Filter */}
      <Stack direction="row" spacing={2} mb={3} alignItems="center">
        <FormControl size="small" sx={{ minWidth: 180 }}>
          <InputLabel>Filter by Category</InputLabel>
          <Select
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            label="Filter by Category"
          >
            <MenuItem value="">All</MenuItem>
            {['check-in', 'checkout', 'reminder', 'promotion', 'custom'].map((c) => (
              <MenuItem key={c} value={c} sx={{ textTransform: 'capitalize' }}>
                {c.charAt(0).toUpperCase() + c.slice(1)}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
        <Typography variant="body2" color="text.secondary">
          {templates.length} template{templates.length !== 1 ? 's' : ''}
        </Typography>
      </Stack>

      {/* Cards */}
      {templates.length === 0 ? (
        <Box
          sx={{
            mt: 8,
            textAlign: 'center',
            color: 'text.secondary',
          }}
        >
          <Typography variant="h6">No templates yet</Typography>
          <Typography variant="body2" mt={1}>
            Click <strong>New Template</strong> to create your first WhatsApp message template.
          </Typography>
        </Box>
      ) : (
        <Grid container spacing={2}>
          {templates.map((t) => (
            <Grid item xs={12} sm={6} md={4} key={t._id}>
              <Card variant="outlined" sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                <CardContent sx={{ flex: 1 }}>
                  {/* Title row */}
                  <Stack direction="row" alignItems="flex-start" justifyContent="space-between" mb={1}>
                    <Typography variant="subtitle1" fontWeight={600} sx={{ wordBreak: 'break-word' }}>
                      {t.name}
                    </Typography>
                    <Chip
                      label={t.category}
                      color={CATEGORY_COLORS[t.category] || 'default'}
                      size="small"
                      sx={{ ml: 1, textTransform: 'capitalize', flexShrink: 0 }}
                    />
                  </Stack>

                  {/* Status badge */}
                  <Chip
                    label={t.isActive ? 'Active' : 'Inactive'}
                    color={t.isActive ? 'success' : 'default'}
                    size="small"
                    variant="outlined"
                    sx={{ mb: 1.5 }}
                  />

                  {/* Body preview */}
                  <Typography
                    variant="body2"
                    color="text.secondary"
                    sx={{
                      whiteSpace: 'pre-wrap',
                      wordBreak: 'break-word',
                      fontSize: 12,
                      maxHeight: 100,
                      overflow: 'hidden',
                      display: '-webkit-box',
                      WebkitLineClamp: 5,
                      WebkitBoxOrient: 'vertical',
                    }}
                  >
                    {t.body}
                  </Typography>

                  {/* Variables used */}
                  {t.variables?.length > 0 && (
                    <>
                      <Divider sx={{ my: 1.5 }} />
                      <Typography variant="caption" color="text.secondary" display="block" mb={0.5}>
                        Fields used:
                      </Typography>
                      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                        {t.variables.map((v) => (
                          <Chip
                            key={v}
                            label={`{{${v}}}`}
                            size="small"
                            variant="outlined"
                            sx={{ fontFamily: 'monospace', fontSize: 10 }}
                          />
                        ))}
                      </Box>
                    </>
                  )}
                </CardContent>

                <Divider />
                <CardActions sx={{ justifyContent: 'flex-end', px: 1.5 }}>
                  <Tooltip title="Test via WA2 (instant)">
                    <IconButton size="small" color="success" onClick={() => openWA2Dialog(t)}>
                      <WhatsAppIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="Test via Provider 1 (1 min)">
                    <IconButton size="small" color="info" onClick={() => openTestDialog(t)}>
                      <NotificationsActiveIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="Copy message">
                    <IconButton size="small" onClick={() => copyBody(t.body)}>
                      <ContentCopyIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="Edit">
                    <IconButton size="small" color="primary" onClick={() => openEdit(t)}>
                      <EditIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="Delete">
                    <IconButton
                      size="small"
                      color="error"
                      disabled={deleting === t._id}
                      onClick={() => handleDelete(t._id)}
                    >
                      <DeleteIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                </CardActions>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}

      {/* FAB for mobile */}
      <Fab
        color="primary"
        aria-label="add template"
        onClick={openAdd}
        sx={{ position: 'fixed', bottom: 24, right: 24, display: { sm: 'none' } }}
      >
        <AddIcon />
      </Fab>

      <WhatsAppTemplateModal
        open={modalOpen}
        handleClose={() => setModalOpen(false)}
        onSaved={handleSaved}
        initialData={editTarget}
      />

      {/* WA2 direct send dialog */}
      <Dialog
        open={wa2Dialog.open}
        onClose={() => !wa2Sending && setWa2Dialog({ open: false, template: null })}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle sx={{ pb: 1 }}>
          <Stack direction="row" alignItems="center" spacing={1}>
            <WhatsAppIcon color="success" fontSize="small" />
            <Typography fontWeight={700}>Test via WA2 Provider</Typography>
          </Stack>
        </DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" mb={2}>
            Template: <strong>{wa2Dialog.template?.name}</strong>
          </Typography>
          <Typography variant="body2" color="text.secondary" mb={2}>
            Message is sent <strong>instantly</strong> using the secondary WhatsApp provider (WA2).
          </Typography>
          <TextField
            label="Mobile Number"
            value={wa2Phone}
            onChange={(e) => setWa2Phone(e.target.value.replace(/\D/g, '').slice(0, 10))}
            fullWidth
            size="small"
            placeholder="Enter 10-digit mobile"
            inputProps={{ maxLength: 10, inputMode: 'numeric' }}
            sx={{ mb: 2 }}
          />
          <TextField
            label="Message"
            value={wa2Message}
            onChange={(e) => setWa2Message(e.target.value)}
            fullWidth
            size="small"
            multiline
            rows={4}
            placeholder="Message to send (pre-filled from template body)"
            helperText="Placeholders like {{guest_name}} will be sent as-is for testing"
          />
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button
            variant="outlined"
            color="inherit"
            onClick={() => setWa2Dialog({ open: false, template: null })}
            disabled={wa2Sending}
          >
            Cancel
          </Button>
          <Button
            variant="contained"
            color="success"
            startIcon={<WhatsAppIcon />}
            onClick={handleSendWA2}
            disabled={wa2Sending || wa2Phone.length !== 10 || !wa2Message.trim()}
          >
            {wa2Sending ? 'Sending…' : 'Send Now'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Test schedule dialog (Provider 1) */}
      <Dialog
        open={testDialog.open}
        onClose={() => setTestDialog({ open: false, template: null })}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle sx={{ pb: 1 }}>
          <Stack direction="row" alignItems="center" spacing={1}>
              <NotificationsActiveIcon color="success" fontSize="small" />
              <Typography fontWeight={700}>Send Test Message</Typography>
            </Stack>
        </DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" mb={2}>
            Template: <strong>{testDialog.template?.name}</strong>
          </Typography>
          <Typography variant="body2" color="text.secondary" mb={2}>
            The message will be sent with <em>sample/dummy data</em> and delivered in{' '}
            <strong>~1 minute</strong>.
          </Typography>

          {/* Scheduled time preview */}
          <Box
            sx={{
              mb: 2,
              px: 1.5,
              py: 1,
              bgcolor: '#f0fdf4',
              borderRadius: 1,
              border: '1px solid #c8e6c9',
            }}
          >
            <Typography variant="caption" color="success.dark" fontWeight={600}>
              Scheduled at:{' '}
              {new Date(Date.now() + 60000).toLocaleTimeString('en-IN', {
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit',
              })}{' '}
              — {new Date(Date.now() + 60000).toLocaleDateString('en-IN', {
                day: '2-digit',
                month: 'short',
                year: 'numeric',
              })}
            </Typography>
          </Box>

          <TextField
            label="Mobile Number"
            value={testPhone}
            onChange={(e) => setTestPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
            fullWidth
            size="small"
            placeholder="Enter 10-digit mobile"
            inputProps={{ maxLength: 10, inputMode: 'numeric' }}
            helperText="WhatsApp will be sent to this number"
          />
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button
            variant="outlined"
            color="inherit"
            onClick={() => setTestDialog({ open: false, template: null })}
            disabled={testSending}
          >
            Cancel
          </Button>
          <Button
            variant="contained"
            color="success"
            startIcon={<NotificationsActiveIcon />}
            onClick={handleSendTest}
            disabled={testSending || testPhone.length !== 10}
          >
            {testSending ? 'Scheduling…' : 'Schedule Test'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default WhatsAppTemplates;
