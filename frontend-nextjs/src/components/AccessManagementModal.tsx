'use client';

import React, { useState, useEffect } from 'react';
import { useAuthStore } from '@/lib/store';
import { X, Plus, Edit2, Trash2, Save, XCircle } from 'lucide-react';
import { INDIAN_STATES } from '@/lib/indianStates';

const API_BASE = globalThis.window?.location.hostname === 'localhost'
  ? 'http://localhost:5000'
  : '';

interface User {
  email: string;
  name: string;
  role: string;
  dashboard_access: string[];
  allowedStates: string[];
  status: string;
}

interface AccessManagementModalProps {
  readonly isOpen: boolean;
  readonly onClose: () => void;
}

export default function AccessManagementModal({ isOpen, onClose }: AccessManagementModalProps) {
  const { username: userEmail, userRole } = useAuthStore();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [showAddUser, setShowAddUser] = useState(false);
  const [newUserEmail, setNewUserEmail] = useState('');
  const [newUserPassword, setNewUserPassword] = useState('');
  const [newUserName, setNewUserName] = useState('');
  const [newUserStates, setNewUserStates] = useState<string[]>([]);
  const [newUserDashboards, setNewUserDashboards] = useState<string[]>([]);
  const [stateSearch, setStateSearch] = useState('');
  const [showStateDropdown, setShowStateDropdown] = useState(false);
  const [editingUserId, setEditingUserId] = useState<string | null>(null);
  const [editingUserStates, setEditingUserStates] = useState<string[]>([]);
  const [editingUserDashboards, setEditingUserDashboards] = useState<string[]>([]);
  const [editStateSearch, setEditStateSearch] = useState('');
  const [editShowStateDropdown, setEditShowStateDropdown] = useState(false);

  const isAuthorized = userRole === 'superadmin';

  const fetchUsers = async () => {
    if (!isAuthorized) return;
    setLoading(true);
    try {
      const response = await fetch(`${API_BASE}/api/admin/users`, {
        headers: { 'X-User-Email': userEmail }
      });
      if (response.ok) {
        const data = await response.json();
        setUsers(Array.isArray(data) ? data : data.users || []);
      }
    } catch (error) {
      console.error('Error fetching users:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen && isAuthorized) {
      fetchUsers();
    }
  }, [isOpen, isAuthorized]);

  const handleCreateUser = async () => {
    if (!newUserEmail || !newUserPassword || newUserStates.length === 0 || newUserDashboards.length === 0) {
      alert('Please fill in all fields');
      return;
    }

    try {
      const response = await fetch(`${API_BASE}/api/admin/users`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-User-Email': userEmail
        },
        body: JSON.stringify({
          email: newUserEmail,
          password: newUserPassword,
          name: newUserName || newUserEmail,
          states: newUserStates,
          dashboard_access: newUserDashboards
        })
      });

      if (response.ok) {
        alert('User created successfully!');
        setNewUserEmail('');
        setNewUserPassword('');
        setNewUserName('');
        setNewUserStates([]);
        setNewUserDashboards([]);
        setShowAddUser(false);
        fetchUsers();
      } else {
        alert('Error creating user');
      }
    } catch (error) {
      console.error('Error creating user:', error);
      alert('Error creating user');
    }
  };

  const handleEditUser = (user: User) => {
    setEditingUserId(user.email);
    setEditingUserStates(Array.isArray(user.allowedStates) ? user.allowedStates : []);
    setEditingUserDashboards(user.dashboard_access);
  };

  const handleSaveUserAccess = async () => {
    if (!editingUserId) return;

    try {
      const response = await fetch(`${API_BASE}/api/admin/users/${editingUserId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'X-User-Email': userEmail
        },
        body: JSON.stringify({
          states: editingUserStates,
          dashboard_access: editingUserDashboards
        })
      });

      if (response.ok) {
        alert('User updated successfully!');
        setEditingUserId(null);
        fetchUsers();
      } else {
        alert('Error updating user');
      }
    } catch (error) {
      console.error('Error updating user:', error);
      alert('Error updating user');
    }
  };

  const handleDeleteUser = async (email: string) => {
    if (!confirm(`Are you sure you want to delete ${email}?`)) return;

    try {
      const response = await fetch(`${API_BASE}/api/admin/users/${email}`, {
        method: 'DELETE',
        headers: { 'X-User-Email': userEmail }
      });

      if (response.ok) {
        alert('User deleted successfully!');
        fetchUsers();
      } else {
        alert('Error deleting user');
      }
    } catch (error) {
      console.error('Error deleting user:', error);
      alert('Error deleting user');
    }
  };

  if (!isOpen) return null;

  if (!isAuthorized) {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-8 max-w-md w-full">
          <div className="flex items-center gap-3 mb-4">
            <X className="w-6 h-6 text-red-600" />
            <h2 className="text-xl font-bold">Access Denied</h2>
          </div>
          <p className="text-gray-700 mb-6">
            Only superadmin can access user management.
          </p>
          <button
            onClick={onClose}
            className="w-full px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
          >
            Close
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <h2 className="text-2xl font-bold text-gray-900">Access Management</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-lg font-semibold">All Users</h3>
            <button
              onClick={() => setShowAddUser(!showAddUser)}
              className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
            >
              <Plus className="w-4 h-4" />
              Add New User
            </button>
          </div>

          {showAddUser && (
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-6">
              <h4 className="font-semibold mb-4">Create New User</h4>
              <div className="space-y-4">
                <input
                  type="email"
                  placeholder="Email"
                  value={newUserEmail}
                  onChange={(e) => setNewUserEmail(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                />
                <input
                  type="password"
                  placeholder="Password"
                  value={newUserPassword}
                  onChange={(e) => setNewUserPassword(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                />
                <input
                  type="text"
                  placeholder="Name (optional)"
                  value={newUserName}
                  onChange={(e) => setNewUserName(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                />

                <div>
                  <p className="text-sm font-medium text-gray-700 mb-2">States</p>
                  <div className="relative">
                    <input
                      type="text"
                      placeholder="Search and select states..."
                      value={stateSearch}
                      onChange={(e) => setStateSearch(e.target.value)}
                      onClick={() => setShowStateDropdown(!showStateDropdown)}
                      onBlur={() => setTimeout(() => setShowStateDropdown(false), 200)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                    {showStateDropdown && (
                      <div className="absolute top-full left-0 right-0 bg-white border border-gray-300 rounded-lg mt-1 max-h-48 overflow-y-auto z-10 shadow-lg">
                        {INDIAN_STATES.filter(s => 
                          s.toLowerCase().includes(stateSearch.toLowerCase())
                        ).map(state => (
                          <label key={state} className="flex items-center gap-2 px-3 py-2 hover:bg-indigo-50 cursor-pointer border-b border-gray-100 last:border-b-0">
                            <input
                              type="checkbox"
                              checked={newUserStates.includes(state)}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setNewUserStates([...newUserStates, state]);
                                } else {
                                  setNewUserStates(newUserStates.filter(s => s !== state));
                                }
                              }}
                              className="w-4 h-4 rounded"
                            />
                            <span className="text-sm">{state}</span>
                          </label>
                        ))}
                      </div>
                    )}
                  </div>
                  {newUserStates.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-2">
                      {newUserStates.map(state => (
                        <span key={state} className="bg-indigo-100 text-indigo-800 text-sm font-medium px-3 py-1 rounded-full flex items-center gap-2">
                          {state}
                          <button
                            type="button"
                            onClick={() => setNewUserStates(newUserStates.filter(s => s !== state))}
                            className="hover:text-indigo-900 font-bold"
                          >
                            ×
                          </button>
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                <div>
                  <p className="text-sm font-medium text-gray-700 mb-2">Dashboards</p>
                  <div className="space-y-2">
                    {['avante', 'iospl'].map(dashboard => (
                      <label key={dashboard} className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={newUserDashboards.includes(dashboard)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setNewUserDashboards([...newUserDashboards, dashboard]);
                            } else {
                              setNewUserDashboards(newUserDashboards.filter(d => d !== dashboard));
                            }
                          }}
                          className="w-4 h-4"
                        />
                        <span className="text-sm capitalize">{dashboard}</span>
                      </label>
                    ))}
                  </div>
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={handleCreateUser}
                    className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                  >
                    Create User
                  </button>
                  <button
                    onClick={() => setShowAddUser(false)}
                    className="flex-1 px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          )}

          {loading ? (
            <p className="text-center py-8 text-gray-600">Loading users...</p>
          ) : users.length === 0 ? (
            <p className="text-center py-8 text-gray-600">No users found</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left px-4 py-3 font-semibold text-gray-900">Email</th>
                    <th className="text-left px-4 py-3 font-semibold text-gray-900">States</th>
                    <th className="text-left px-4 py-3 font-semibold text-gray-900">Dashboards</th>
                    <th className="text-left px-4 py-3 font-semibold text-gray-900">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map(user => (
                    <tr key={user.email} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="px-4 py-3">{user.email}</td>
                      <td className="px-4 py-3">
                        {editingUserId === user.email ? (
                          <div className="relative min-w-max">
                            <input
                              type="text"
                              placeholder="Search states..."
                              value={editStateSearch}
                              onChange={(e) => setEditStateSearch(e.target.value)}
                              onClick={() => setEditShowStateDropdown(!editShowStateDropdown)}
                              onBlur={() => setTimeout(() => setEditShowStateDropdown(false), 200)}
                              className="w-full px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                            />
                            {editShowStateDropdown && (
                              <div className="absolute top-full left-0 right-full bg-white border border-gray-300 rounded-lg mt-1 max-h-40 overflow-y-auto z-20 shadow-lg min-w-max">
                                {INDIAN_STATES.filter(s => 
                                  s.toLowerCase().includes(editStateSearch.toLowerCase())
                                ).map(state => (
                                  <label key={state} className="flex items-center gap-2 px-3 py-2 hover:bg-indigo-50 cursor-pointer border-b border-gray-100 last:border-b-0 whitespace-nowrap">
                                    <input
                                      type="checkbox"
                                      checked={editingUserStates.includes(state)}
                                      onChange={(e) => {
                                        if (e.target.checked) {
                                          setEditingUserStates([...editingUserStates, state]);
                                        } else {
                                          setEditingUserStates(editingUserStates.filter(s => s !== state));
                                        }
                                      }}
                                      className="w-4 h-4 rounded"
                                    />
                                    <span className="text-sm">{state}</span>
                                  </label>
                                ))}
                              </div>
                            )}
                            {editingUserStates.length > 0 && (
                              <div className="mt-2 flex flex-wrap gap-1">
                                {editingUserStates.map(state => (
                                  <span key={state} className="bg-indigo-100 text-indigo-800 text-xs font-medium px-2 py-1 rounded-full flex items-center gap-1">
                                    {state}
                                    <button
                                      type="button"
                                      onClick={() => setEditingUserStates(editingUserStates.filter(s => s !== state))}
                                      className="hover:text-indigo-900 font-bold"
                                    >
                                      ×
                                    </button>
                                  </span>
                                ))}
                              </div>
                            )}
                          </div>
                        ) : (
                          <span className="text-sm">
                            {user.allowedStates.length > 0 ? user.allowedStates.join(', ') : 'All'}
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        {editingUserId === user.email ? (
                          <div className="space-y-1">
                            {['avante', 'iospl'].map(dashboard => (
                              <label key={dashboard} className="flex items-center gap-2 text-sm cursor-pointer">
                                <input
                                  type="checkbox"
                                  checked={editingUserDashboards.includes(dashboard)}
                                  onChange={(e) => {
                                    if (e.target.checked) {
                                      setEditingUserDashboards([...editingUserDashboards, dashboard]);
                                    } else {
                                      setEditingUserDashboards(editingUserDashboards.filter(d => d !== dashboard));
                                    }
                                  }}
                                  className="w-4 h-4"
                                />
                                <span className="capitalize">{dashboard}</span>
                              </label>
                            ))}
                          </div>
                        ) : (
                          <span className="text-sm">{user.dashboard_access.join(', ')}</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        {editingUserId === user.email ? (
                          <div className="flex gap-2">
                            <button
                              onClick={handleSaveUserAccess}
                              className="p-1 text-green-600 hover:bg-green-50 rounded"
                              title="Save"
                            >
                              <Save className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => setEditingUserId(null)}
                              className="p-1 text-gray-600 hover:bg-gray-100 rounded"
                              title="Cancel"
                            >
                              <XCircle className="w-4 h-4" />
                            </button>
                          </div>
                        ) : (
                          <div className="flex gap-2">
                            <button
                              onClick={() => handleEditUser(user)}
                              className="p-1 text-indigo-600 hover:bg-indigo-50 rounded"
                              title="Edit"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDeleteUser(user.email)}
                              className="p-1 text-red-600 hover:bg-red-50 rounded"
                              title="Delete"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
