import React, { useEffect, useMemo, useState } from 'react';
import {
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import Toast from 'react-hot-toast';
import Config from '../../components/Config';

const ROLE_OPTIONS = ['admin', 'semi_admin', 'user'];

const normalizeRole = (role) =>
  String(role || '')
    .trim()
    .toLowerCase()
    .replace(/[\s_-]+/g, '');

const toDisplayRole = (role) => {
  const normalized = normalizeRole(role);
  if (normalized === 'semiadmin') {
    return 'semi_admin';
  }
  if (normalized === 'admin') return 'admin';
  return 'user';
};

const Roles = () => {
  const [users, setUsers] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [editUser, setEditUser] = useState(null);
  const [selectedRole, setSelectedRole] = useState('user');
  const [isUpdating, setIsUpdating] = useState(false);

  const loadUsers = async () => {
    try {
      setIsLoading(true);
      const response = await Config.get('/auth/users');
      setUsers(Array.isArray(response.data?.users) ? response.data.users : []);
    } catch (error) {
      Toast.error(error.response?.data?.message || 'Failed to load users');
      setUsers([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, []);

  const sortedUsers = useMemo(() => {
    return [...users].sort((a, b) => {
      const left = String(a?.name || a?.email || '').toLowerCase();
      const right = String(b?.name || b?.email || '').toLowerCase();
      return left.localeCompare(right);
    });
  }, [users]);

  const openEditDialog = (user) => {
    setEditUser(user);
    setSelectedRole(toDisplayRole(user?.role));
  };

  const closeEditDialog = () => {
    setEditUser(null);
    setSelectedRole('user');
  };

  const handleUpdateRole = async () => {
    if (!editUser?._id) return;

    try {
      setIsUpdating(true);
      const response = await Config.patch(`/auth/users/${editUser._id}/role`, {
        role: selectedRole,
      });

      if (!response.data?.success) {
        Toast.error(response.data?.message || 'Failed to update role');
        return;
      }

      Toast.success(response.data?.message || 'Role updated successfully');
      closeEditDialog();
      await loadUsers();
    } catch (error) {
      Toast.error(error.response?.data?.message || 'Failed to update role');
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" sx={{ mb: 2 }}>
        Roles
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        Manage role access for all members.
      </Typography>

      <Card>
        <CardContent>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Name</TableCell>
                  <TableCell>Email</TableCell>
                  <TableCell>Current Role</TableCell>
                  <TableCell align="right">Action</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {sortedUsers.map((user) => (
                  <TableRow key={user._id} hover>
                    <TableCell>{user.name || '-'}</TableCell>
                    <TableCell>{user.email || '-'}</TableCell>
                    <TableCell>
                      <Chip label={toDisplayRole(user.role)} size="small" color="primary" variant="outlined" />
                    </TableCell>
                    <TableCell align="right">
                      <Button
                        variant="outlined"
                        size="small"
                        startIcon={<EditIcon />}
                        onClick={() => openEditDialog(user)}
                      >
                        Edit
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}

                {!isLoading && sortedUsers.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={4} align="center">
                      No users found
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>

          {isLoading && (
            <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
              Loading members...
            </Typography>
          )}
        </CardContent>
      </Card>

      <Dialog open={Boolean(editUser)} onClose={closeEditDialog} maxWidth="xs" fullWidth>
        <DialogTitle>Update Role</DialogTitle>
        <DialogContent>
          <Typography variant="body2" sx={{ mb: 2 }}>
            {editUser?.name || editUser?.email}
          </Typography>
          <FormControl fullWidth>
            <InputLabel id="member-role-label">Role</InputLabel>
            <Select
              labelId="member-role-label"
              label="Role"
              value={selectedRole}
              onChange={(event) => setSelectedRole(event.target.value)}
            >
              {ROLE_OPTIONS.map((role) => (
                <MenuItem key={role} value={role}>
                  {role}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </DialogContent>
        <DialogActions>
          <Button onClick={closeEditDialog} disabled={isUpdating}>
            Cancel
          </Button>
          <Button onClick={handleUpdateRole} variant="contained" disabled={isUpdating}>
            {isUpdating ? 'Updating...' : 'Save'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Roles;
