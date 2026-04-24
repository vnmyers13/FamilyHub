// PURPOSE: Admin panel for managing family members
// ROLE: Frontend Pages
// MODIFIED: 2026-04-28 — Phase 1.2 setup

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { axiosInstance } from '../../api/client';
import { useAuthStore } from '../../stores/authStore';

interface User {
  id: string;
  display_name: string;
  email?: string;
  role: string;
  avatar_url?: string;
  created_at: string;
}

export default function ManageUsers() {
  const queryClient = useQueryClient();
  const { user: currentUser } = useAuthStore();
  const [showForm, setShowForm] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [formData, setFormData] = useState({
    display_name: '',
    email: '',
    role: 'member',
    pin: '',
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [roleFilter, setRoleFilter] = useState('');

  // Check if user is admin
  if (currentUser?.role !== 'admin') {
    return (
      <div style={{ padding: '20px' }}>
        <h1>Access Denied</h1>
        <p>Only administrators can manage users.</p>
      </div>
    );
  }

  // Fetch users
  const { data: users = [], isLoading } = useQuery({
    queryKey: ['users', roleFilter],
    queryFn: async () => {
      const params = roleFilter ? `?role=${roleFilter}` : '';
      const response = await axiosInstance.get(`/users${params}`);
      return response.data.users;
    },
  });

  // Create/update user mutation
  const { mutate: saveUser, isPending: isSaving } = useMutation({
    mutationFn: async (data: any) => {
      if (editingUser) {
        return await axiosInstance.patch(`/users/${editingUser.id}`, data);
      } else {
        return await axiosInstance.post('/users', data);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      setShowForm(false);
      setEditingUser(null);
      setFormData({ display_name: '', email: '', role: 'member', pin: '' });
      setSuccess(editingUser ? 'User updated successfully' : 'User created successfully');
      setTimeout(() => setSuccess(''), 3000);
    },
    onError: (err: any) => {
      setError(err.response?.data?.detail || 'Failed to save user');
    },
  });

  // Delete user mutation
  const { mutate: deleteUser, isPending: isDeleting } = useMutation({
    mutationFn: async (userId: string) => {
      return await axiosInstance.delete(`/users/${userId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      setDeleteConfirm(null);
      setSuccess('User deleted successfully');
      setTimeout(() => setSuccess(''), 3000);
    },
    onError: (err: any) => {
      setError(err.response?.data?.detail || 'Failed to delete user');
    },
  });

  const handleAddUser = () => {
    setEditingUser(null);
    setFormData({ display_name: '', email: '', role: 'member', pin: '' });
    setShowForm(true);
    setError('');
  };

  const handleEditUser = (user: User) => {
    setEditingUser(user);
    setFormData({
      display_name: user.display_name,
      email: user.email || '',
      role: user.role,
      pin: '',
    });
    setShowForm(true);
    setError('');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!formData.display_name.trim()) {
      setError('Display name is required');
      return;
    }

    const submitData: any = {
      display_name: formData.display_name,
    };

    if (formData.email) submitData.email = formData.email;
    if (!editingUser) {
      submitData.role = formData.role;
      if (formData.pin) submitData.pin = formData.pin;
    }

    saveUser(submitData);
  };

  const handleCancel = () => {
    setShowForm(false);
    setEditingUser(null);
    setError('');
  };

  return (
    <div style={{ padding: '20px', maxWidth: '900px', margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h1>Manage Family Members</h1>
        {!showForm && (
          <button
            onClick={handleAddUser}
            style={{
              padding: '10px 20px',
              backgroundColor: '#4f46e5',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
            }}
          >
            + Add Member
          </button>
        )}
      </div>

      {/* Messages */}
      {success && <p style={{ color: 'green', marginBottom: '15px' }}>{success}</p>}
      {error && <p style={{ color: 'red', marginBottom: '15px' }}>{error}</p>}

      {/* Add/Edit Form */}
      {showForm && (
        <form
          onSubmit={handleSubmit}
          style={{
            backgroundColor: '#f9f9f9',
            padding: '20px',
            borderRadius: '8px',
            marginBottom: '30px',
          }}
        >
          <h2>{editingUser ? 'Edit Member' : 'Add New Member'}</h2>

          <div style={{ marginBottom: '15px' }}>
            <label htmlFor="display_name" style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
              Display Name *
            </label>
            <input
              id="display_name"
              type="text"
              value={formData.display_name}
              onChange={(e) => setFormData({ ...formData, display_name: e.target.value })}
              style={{
                width: '100%',
                padding: '10px',
                border: '1px solid #ddd',
                borderRadius: '6px',
                boxSizing: 'border-box',
              }}
            />
          </div>

          <div style={{ marginBottom: '15px' }}>
            <label htmlFor="email" style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
              Email (Optional)
            </label>
            <input
              id="email"
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              style={{
                width: '100%',
                padding: '10px',
                border: '1px solid #ddd',
                borderRadius: '6px',
                boxSizing: 'border-box',
              }}
            />
          </div>

          {!editingUser && (
            <>
              <div style={{ marginBottom: '15px' }}>
                <label htmlFor="role" style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
                  Role *
                </label>
                <select
                  id="role"
                  value={formData.role}
                  onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '10px',
                    border: '1px solid #ddd',
                    borderRadius: '6px',
                    boxSizing: 'border-box',
                  }}
                >
                  <option value="admin">Admin</option>
                  <option value="member">Member</option>
                  <option value="viewer">Viewer</option>
                </select>
              </div>

              <div style={{ marginBottom: '20px' }}>
                <label htmlFor="pin" style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
                  PIN (4-6 digits, Optional)
                </label>
                <input
                  id="pin"
                  type="text"
                  value={formData.pin}
                  onChange={(e) => setFormData({ ...formData, pin: e.target.value })}
                  placeholder="e.g., 1234"
                  style={{
                    width: '100%',
                    padding: '10px',
                    border: '1px solid #ddd',
                    borderRadius: '6px',
                    boxSizing: 'border-box',
                  }}
                />
              </div>
            </>
          )}

          <div style={{ display: 'flex', gap: '10px' }}>
            <button
              type="submit"
              disabled={isSaving}
              style={{
                flex: 1,
                padding: '10px',
                backgroundColor: '#4f46e5',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                cursor: isSaving ? 'not-allowed' : 'pointer',
                opacity: isSaving ? 0.5 : 1,
              }}
            >
              {isSaving ? 'Saving...' : 'Save'}
            </button>
            <button
              type="button"
              onClick={handleCancel}
              style={{
                flex: 1,
                padding: '10px',
                backgroundColor: '#f0f0f0',
                border: '1px solid #ddd',
                borderRadius: '6px',
                cursor: 'pointer',
              }}
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      {/* Role Filter */}
      {!showForm && (
        <div style={{ marginBottom: '20px' }}>
          <label htmlFor="role-filter" style={{ marginRight: '10px' }}>
            Filter by role:
          </label>
          <select
            id="role-filter"
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            style={{ padding: '8px', borderRadius: '4px', border: '1px solid #ddd' }}
          >
            <option value="">All</option>
            <option value="admin">Admin</option>
            <option value="member">Member</option>
            <option value="viewer">Viewer</option>
          </select>
        </div>
      )}

      {/* User List */}
      {!showForm && (
        <>
          {isLoading ? (
            <p>Loading...</p>
          ) : users.length === 0 ? (
            <p style={{ color: '#999' }}>No members found</p>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ borderBottom: '2px solid #ddd' }}>
                    <th style={{ padding: '12px', textAlign: 'left' }}>Name</th>
                    <th style={{ padding: '12px', textAlign: 'left' }}>Email</th>
                    <th style={{ padding: '12px', textAlign: 'left' }}>Role</th>
                    <th style={{ padding: '12px', textAlign: 'left' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((user: User) => (
                    <tr key={user.id} style={{ borderBottom: '1px solid #eee' }}>
                      <td style={{ padding: '12px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          {user.avatar_url ? (
                            <img
                              src={user.avatar_url}
                              alt={user.display_name}
                              style={{ width: '40px', height: '40px', borderRadius: '50%' }}
                            />
                          ) : (
                            <div
                              style={{
                                width: '40px',
                                height: '40px',
                                borderRadius: '50%',
                                backgroundColor: '#4f46e5',
                                color: 'white',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontWeight: 'bold',
                              }}
                            >
                              {user.display_name.charAt(0)}
                            </div>
                          )}
                          <span>{user.display_name}</span>
                        </div>
                      </td>
                      <td style={{ padding: '12px' }}>{user.email || '-'}</td>
                      <td style={{ padding: '12px' }}>
                        <span
                          style={{
                            display: 'inline-block',
                            padding: '4px 8px',
                            backgroundColor: user.role === 'admin' ? '#e8f5e9' : '#f5f5f5',
                            borderRadius: '4px',
                            fontSize: '0.9em',
                          }}
                        >
                          {user.role}
                        </span>
                      </td>
                      <td style={{ padding: '12px' }}>
                        <button
                          onClick={() => handleEditUser(user)}
                          style={{
                            padding: '6px 12px',
                            backgroundColor: '#f0f0f0',
                            border: '1px solid #ddd',
                            borderRadius: '4px',
                            cursor: 'pointer',
                            marginRight: '8px',
                          }}
                        >
                          Edit
                        </button>
                        {user.id !== currentUser?.id && (
                          <button
                            onClick={() => setDeleteConfirm(user.id)}
                            style={{
                              padding: '6px 12px',
                              backgroundColor: '#ffebee',
                              color: '#c62828',
                              border: '1px solid #ef5350',
                              borderRadius: '4px',
                              cursor: 'pointer',
                            }}
                          >
                            Delete
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Delete Confirmation */}
          {deleteConfirm && (
            <div
              style={{
                position: 'fixed',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                backgroundColor: 'rgba(0,0,0,0.5)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <div
                style={{
                  backgroundColor: 'white',
                  padding: '20px',
                  borderRadius: '8px',
                  maxWidth: '400px',
                }}
              >
                <h2 style={{ marginTop: 0 }}>Delete Member?</h2>
                <p>Are you sure you want to delete this member? This cannot be undone.</p>
                <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                  <button
                    onClick={() => setDeleteConfirm(null)}
                    style={{
                      padding: '10px 20px',
                      backgroundColor: '#f0f0f0',
                      border: '1px solid #ddd',
                      borderRadius: '6px',
                      cursor: 'pointer',
                    }}
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => deleteUser(deleteConfirm)}
                    disabled={isDeleting}
                    style={{
                      padding: '10px 20px',
                      backgroundColor: '#c62828',
                      color: 'white',
                      border: 'none',
                      borderRadius: '6px',
                      cursor: isDeleting ? 'not-allowed' : 'pointer',
                      opacity: isDeleting ? 0.5 : 1,
                    }}
                  >
                    {isDeleting ? 'Deleting...' : 'Delete'}
                  </button>
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
