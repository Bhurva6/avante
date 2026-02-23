'use client';

import React, { useState, useEffect } from 'react';
import { X, Plus, Trash2, CheckCircle, XCircle, Clock } from 'lucide-react';

interface User {
  id: string;
  email: string;
  role: 'admin' | 'user';
  allowedStates?: string[];
  states?: string[]; // For backward compatibility
  createdAt: string;
  status: 'active' | 'inactive';
}

interface AccessRequest {
  id: string;
  email: string;
  fullName?: string;
  requestedAt: string;
  requestedStates?: string[];
  states?: string[]; // For backward compatibility
  status: 'pending' | 'approved' | 'rejected';
}

interface AccessManagementModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const ALL_STATES = [
  'Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar', 'Chhattisgarh',
  'Goa', 'Gujarat', 'Haryana', 'Himachal Pradesh', 'Jharkhand',
  'Karnataka', 'Kerala', 'Madhya Pradesh', 'Maharashtra', 'Manipur',
  'Meghalaya', 'Mizoram', 'Nagaland', 'Odisha', 'Punjab',
  'Rajasthan', 'Sikkim', 'Tamil Nadu', 'Telangana', 'Tripura',
  'Uttar Pradesh', 'Uttarakhand', 'West Bengal'
];

export default function AccessManagementModal({ isOpen, onClose }: AccessManagementModalProps) {
  const [activeTab, setActiveTab] = useState<'users' | 'requests'>('users');
  const [users, setUsers] = useState<User[]>([]);
  const [accessRequests, setAccessRequests] = useState<AccessRequest[]>([]);
  const [loading, setLoading] = useState(false);

  // Form states for adding new user
  const [newUserEmail, setNewUserEmail] = useState('');
  const [newUserPassword, setNewUserPassword] = useState('');
  const [selectedStates, setSelectedStates] = useState<string[]>([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [showStateDropdown, setShowStateDropdown] = useState(false);
  const [stateSearchTerm, setStateSearchTerm] = useState('');
  const [submitLoading, setSubmitLoading] = useState(false);

  // Load users and requests
  useEffect(() => {
    if (isOpen) {
      loadUsers();
      loadAccessRequests();
    }
  }, [isOpen]);

  const loadUsers = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/admin/users');
      if (response.ok) {
        const data = await response.json();
        setUsers(data.users || []);
      } else {
        // Mock data for development
        setUsers([
          {
            id: '1',
            email: 'user1@example.com',
            role: 'user',
            states: ['Maharashtra', 'Karnataka'],
            createdAt: new Date().toISOString(),
            status: 'active'
          },
          {
            id: '2',
            email: 'user2@example.com',
            role: 'user',
            states: ['Delhi', 'Uttar Pradesh'],
            createdAt: new Date().toISOString(),
            status: 'active'
          }
        ]);
      }
    } catch (error) {
      console.error('Error loading users:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadAccessRequests = async () => {
    try {
      // First try to get sign-up requests from the auth/signup endpoint
      const signupResponse = await fetch('/api/auth/signup');
      if (signupResponse.ok) {
        const signupData = await signupResponse.json();
        const signupRequests = (signupData.accessRequests || []).map((req: any) => ({
          id: req.id,
          email: req.email,
          fullName: req.fullName,
          requestedAt: req.requestedAt,
          requestedStates: req.requestedStates,
          status: req.status
        }));
        
        // Also try to get access requests from the admin endpoint
        const adminResponse = await fetch('/api/admin/access-requests');
        const adminData = adminResponse.ok ? await adminResponse.json() : { requests: [] };
        const adminRequests = adminData.requests || [];
        
        // Combine both sources (remove duplicates by email)
        const requestMap = new Map();
        [...signupRequests, ...adminRequests].forEach(req => {
          requestMap.set(req.email, req);
        });
        const allRequests = Array.from(requestMap.values());
        
        console.log('Loaded access requests:', allRequests);
        setAccessRequests(allRequests);
      } else {
        // Fallback: just try admin endpoint
        const response = await fetch('/api/admin/access-requests');
        if (response.ok) {
          const data = await response.json();
          setAccessRequests(data.requests || []);
        } else {
          // Mock data for development
          setAccessRequests([
            {
              id: '1',
              email: 'newuser@example.com',
              requestedAt: new Date().toISOString(),
              requestedStates: ['Tamil Nadu', 'Telangana'],
              status: 'pending'
            }
          ]);
        }
      }
    } catch (error) {
      console.error('Error loading access requests:', error);
      setAccessRequests([]);
    }
  };

  const handleAddUser = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!newUserEmail || !newUserPassword || selectedStates.length === 0) {
      alert('Please fill all fields and select at least one state');
      return;
    }

    setSubmitLoading(true);
    try {
      const response = await fetch('/api/admin/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: newUserEmail,
          password: newUserPassword,
          states: selectedStates,
          role: 'user'
        })
      });

      if (response.ok) {
        alert('User created successfully!');
        setNewUserEmail('');
        setNewUserPassword('');
        setSelectedStates([]);
        setShowAddForm(false);
        loadUsers();
      } else {
        const error = await response.json();
        alert(`Error: ${error.message || 'Failed to create user'}`);
      }
    } catch (error) {
      console.error('Error adding user:', error);
      alert('Error creating user');
    } finally {
      setSubmitLoading(false);
    }
  };

  const handleDeleteUser = async (userId: string) => {
    if (!confirm('Are you sure you want to delete this user?')) return;

    try {
      const response = await fetch(`/api/admin/users/${userId}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        alert('User deleted successfully!');
        loadUsers();
      } else {
        alert('Failed to delete user');
      }
    } catch (error) {
      console.error('Error deleting user:', error);
      alert('Error deleting user');
    }
  };

  const handleApproveRequest = async (requestId: string) => {
    try {
      const response = await fetch(`/api/admin/access-requests/${requestId}/approve`, {
        method: 'POST'
      });

      if (response.ok) {
        const data = await response.json();
        
        // Send approval email
        const request = accessRequests.find(r => r.id === requestId);
        if (request) {
          try {
            await fetch('/api/admin/send-email', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                type: 'approval',
                email: request.email,
                fullName: request.fullName || 'User',
                states: (request.requestedStates || request.states) || [],
                password: 'Please use the password you provided during sign-up'
              })
            });
            alert('Request approved! Approval email sent to ' + request.email);
          } catch (emailError) {
            console.error('Failed to send email:', emailError);
            alert('Request approved! However, email notification failed.');
          }
        } else {
          alert('Request approved!');
        }
        
        loadAccessRequests();
        loadUsers();
      } else {
        alert('Failed to approve request');
      }
    } catch (error) {
      console.error('Error approving request:', error);
      alert('Error approving request');
    }
  };

  const handleRejectRequest = async (requestId: string) => {
    try {
      const response = await fetch(`/api/admin/access-requests/${requestId}/reject`, {
        method: 'POST'
      });

      if (response.ok) {
        // Send rejection email
        const request = accessRequests.find(r => r.id === requestId);
        if (request) {
          try {
            await fetch('/api/admin/send-email', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                type: 'rejection',
                email: request.email,
                reason: 'Your access request has been reviewed and not approved at this time.'
              })
            });
            alert('Request rejected! Rejection email sent to ' + request.email);
          } catch (emailError) {
            console.error('Failed to send email:', emailError);
            alert('Request rejected! However, email notification failed.');
          }
        } else {
          alert('Request rejected!');
        }
        
        loadAccessRequests();
      } else {
        alert('Failed to reject request');
      }
    } catch (error) {
      console.error('Error rejecting request:', error);
      alert('Error rejecting request');
    }
  };

  const filteredStates = ALL_STATES.filter(state =>
    state.toLowerCase().includes(stateSearchTerm.toLowerCase())
  );

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-5xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-2xl font-bold text-gray-900">Access Management</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-6 h-6 text-gray-600" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex gap-4 px-6 pt-4 border-b border-gray-200">
          <button
            onClick={() => setActiveTab('users')}
            className={`px-4 py-2 font-medium border-b-2 transition-colors ${
              activeTab === 'users'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-600 hover:text-gray-900'
            }`}
          >
            Users ({users.length})
          </button>
          <button
            onClick={() => setActiveTab('requests')}
            className={`px-4 py-2 font-medium border-b-2 transition-colors ${
              activeTab === 'requests'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-600 hover:text-gray-900'
            }`}
          >
            Access Requests ({accessRequests.length})
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {activeTab === 'users' && (
            <div className="space-y-4">
              {/* Add User Button */}
              <button
                onClick={() => setShowAddForm(!showAddForm)}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <Plus className="w-5 h-5" />
                Add New User
              </button>

              {/* Add User Form */}
              {showAddForm && (
                <form onSubmit={handleAddUser} className="bg-gray-50 p-4 rounded-lg border border-gray-200 space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                    <input
                      type="email"
                      value={newUserEmail}
                      onChange={(e) => setNewUserEmail(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="user@example.com"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
                    <input
                      type="password"
                      value={newUserPassword}
                      onChange={(e) => setNewUserPassword(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="••••••••"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Select States</label>
                    <div className="relative">
                      <input
                        type="text"
                        placeholder="Search states..."
                        value={stateSearchTerm}
                        onChange={(e) => setStateSearchTerm(e.target.value)}
                        onFocus={() => setShowStateDropdown(true)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                      {showStateDropdown && (
                        <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-48 overflow-y-auto z-10">
                          {filteredStates.map(state => (
                            <button
                              key={state}
                              type="button"
                              onClick={() => {
                                if (!selectedStates.includes(state)) {
                                  setSelectedStates([...selectedStates, state]);
                                }
                                setStateSearchTerm('');
                              }}
                              className="w-full text-left px-4 py-2 hover:bg-blue-50 transition-colors text-sm"
                            >
                              {state}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Selected States Tags */}
                    <div className="flex flex-wrap gap-2 mt-3">
                      {selectedStates.map(state => (
                        <span
                          key={state}
                          className="bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-sm flex items-center gap-2"
                        >
                          {state}
                          <button
                            type="button"
                            onClick={() => setSelectedStates(selectedStates.filter(s => s !== state))}
                            className="hover:text-blue-900"
                          >
                            ×
                          </button>
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <button
                      type="submit"
                      disabled={submitLoading}
                      className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
                    >
                      {submitLoading ? 'Creating...' : 'Create User'}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setShowAddForm(false);
                        setNewUserEmail('');
                        setNewUserPassword('');
                        setSelectedStates([]);
                      }}
                      className="flex-1 px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              )}

              {/* Users Table */}
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-200 bg-gray-50">
                      <th className="text-left px-4 py-3 font-medium text-gray-700">Email</th>
                      <th className="text-left px-4 py-3 font-medium text-gray-700">Role</th>
                      <th className="text-left px-4 py-3 font-medium text-gray-700">States</th>
                      <th className="text-left px-4 py-3 font-medium text-gray-700">Status</th>
                      <th className="text-left px-4 py-3 font-medium text-gray-700">Created</th>
                      <th className="text-center px-4 py-3 font-medium text-gray-700">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {loading ? (
                      <tr>
                        <td colSpan={6} className="text-center py-4 text-gray-500">
                          Loading...
                        </td>
                      </tr>
                    ) : users.length > 0 ? (
                      users.map(user => (
                        <tr key={user.id} className="border-b border-gray-100 hover:bg-gray-50">
                          <td className="px-4 py-3 text-gray-900 font-medium">{user.email}</td>
                          <td className="px-4 py-3 text-gray-600">
                            <span className={`px-2 py-1 rounded text-xs font-medium ${
                              user.role === 'admin'
                                ? 'bg-red-100 text-red-700'
                                : 'bg-blue-100 text-blue-700'
                            }`}>
                              {user.role.toUpperCase()}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-gray-600">
                            <div className="flex flex-wrap gap-1">
                              {((user.allowedStates || user.states) || []).slice(0, 2).map(state => (
                                <span
                                  key={state}
                                  className="bg-gray-100 text-gray-700 px-2 py-1 rounded text-xs"
                                >
                                  {state}
                                </span>
                              ))}
                              {((user.allowedStates || user.states) || []).length > 2 && (
                                <span className="bg-gray-100 text-gray-700 px-2 py-1 rounded text-xs">
                                  +{((user.allowedStates || user.states) || []).length - 2} more
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <span className={`px-2 py-1 rounded text-xs font-medium ${
                              user.status === 'active'
                                ? 'bg-green-100 text-green-700'
                                : 'bg-gray-100 text-gray-700'
                            }`}>
                              {user.status.charAt(0).toUpperCase() + user.status.slice(1)}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-gray-600 text-xs">
                            {new Date(user.createdAt).toLocaleDateString()}
                          </td>
                          <td className="px-4 py-3 text-center">
                            <button
                              onClick={() => handleDeleteUser(user.id)}
                              className="inline-flex items-center gap-1 px-2 py-1 text-red-600 hover:bg-red-50 rounded transition-colors"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={6} className="text-center py-4 text-gray-500">
                          No users found
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === 'requests' && (
            <div className="space-y-4">
              {accessRequests.length > 0 ? (
                <div className="grid gap-4">
                  {accessRequests.map(request => (
                    <div
                      key={request.id}
                      className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <h3 className="font-medium text-gray-900">{request.email}</h3>
                            <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                              request.status === 'pending'
                                ? 'bg-yellow-100 text-yellow-700'
                                : request.status === 'approved'
                                ? 'bg-green-100 text-green-700'
                                : 'bg-red-100 text-red-700'
                            }`}>
                              {request.status === 'pending' && <Clock className="w-3 h-3 inline mr-1" />}
                              {request.status === 'approved' && <CheckCircle className="w-3 h-3 inline mr-1" />}
                              {request.status === 'rejected' && <XCircle className="w-3 h-3 inline mr-1" />}
                              {request.status.charAt(0).toUpperCase() + request.status.slice(1)}
                            </span>
                          </div>
                          <p className="text-sm text-gray-600 mb-3">
                            Requested: {new Date(request.requestedAt).toLocaleDateString()}
                          </p>
                          {(request.requestedStates || request.states) && (request.requestedStates || request.states)!.length > 0 && (
                            <div className="flex flex-wrap gap-2">
                              {(request.requestedStates || request.states)!.map(state => (
                                <span
                                  key={state}
                                  className="bg-blue-100 text-blue-700 px-3 py-1 rounded text-xs"
                                >
                                  {state}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>

                        {request.status === 'pending' && (
                          <div className="flex gap-2 ml-4">
                            <button
                              onClick={() => handleApproveRequest(request.id)}
                              className="px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm font-medium flex items-center gap-2"
                            >
                              <CheckCircle className="w-4 h-4" />
                              Approve
                            </button>
                            <button
                              onClick={() => handleRejectRequest(request.id)}
                              className="px-3 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm font-medium flex items-center gap-2"
                            >
                              <XCircle className="w-4 h-4" />
                              Reject
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <Clock className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                  <p className="text-gray-500">No access requests</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
