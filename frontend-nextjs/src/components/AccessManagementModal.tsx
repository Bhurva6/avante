'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useAuthStore } from '@/lib/store';
import { X, Plus, Edit2, Trash2, Save, XCircle, CheckCircle, Clock, Users, UserCheck } from 'lucide-react';
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

interface PendingRequest {
  id: string;
  email: string;
  fullName: string;
  requestedStates: string[];
  status: string;
  requestedAt: string;
}

interface AccessManagementModalProps {
  readonly isOpen: boolean;
  readonly onClose: () => void;
}

type Tab = 'active' | 'pending';

// Inline toast-style notification
function Notice({ type, message }: { type: 'success' | 'error'; message: string }) {
  return (
    <div className={`flex items-center gap-2 px-4 py-3 rounded-lg text-sm font-medium mb-4 ${
      type === 'success'
        ? 'bg-green-50 border border-green-200 text-green-800'
        : 'bg-red-50 border border-red-200 text-red-800'
    }`}>
      {type === 'success' ? <CheckCircle className="w-4 h-4 shrink-0" /> : <XCircle className="w-4 h-4 shrink-0" />}
      {message}
    </div>
  );
}

// Multi-select state picker
function StatePicker({
  selected,
  onChange,
}: {
  selected: string[];
  onChange: (states: string[]) => void;
}) {
  const [search, setSearch] = useState('');
  const [open, setOpen] = useState(false);
  const filtered = INDIAN_STATES.filter(s => s.toLowerCase().includes(search.toLowerCase()));

  return (
    <div>
      <div className="relative">
        <input
          type="text"
          placeholder="Search and select states…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          onFocus={() => setOpen(true)}
          onBlur={() => setTimeout(() => setOpen(false), 200)}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
        />
        {open && (
          <div className="absolute top-full left-0 right-0 bg-white border border-gray-300 rounded-lg mt-1 max-h-44 overflow-y-auto z-30 shadow-lg">
            {filtered.length === 0 && (
              <p className="px-3 py-2 text-sm text-gray-500">No states found</p>
            )}
            {filtered.map(state => (
              <label key={state} className="flex items-center gap-2 px-3 py-2 hover:bg-indigo-50 cursor-pointer border-b border-gray-100 last:border-b-0">
                <input
                  type="checkbox"
                  checked={selected.includes(state)}
                  onChange={(e) => {
                    if (e.target.checked) onChange([...selected, state]);
                    else onChange(selected.filter(s => s !== state));
                  }}
                  className="w-4 h-4 rounded accent-indigo-600"
                />
                <span className="text-sm">{state}</span>
              </label>
            ))}
          </div>
        )}
      </div>
      {selected.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-1.5">
          {selected.map(state => (
            <span key={state} className="bg-indigo-100 text-indigo-800 text-xs font-medium px-2.5 py-1 rounded-full flex items-center gap-1">
              {state}
              <button type="button" onClick={() => onChange(selected.filter(s => s !== state))} className="hover:text-indigo-900 leading-none">×</button>
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

// Dashboard checkboxes
function DashboardPicker({
  selected,
  onChange,
}: {
  selected: string[];
  onChange: (dashboards: string[]) => void;
}) {
  return (
    <div className="flex gap-6">
      {['avante', 'iospl'].map(d => (
        <label key={d} className="flex items-center gap-2 cursor-pointer text-sm font-medium text-gray-700 capitalize">
          <input
            type="checkbox"
            checked={selected.includes(d)}
            onChange={(e) => {
              if (e.target.checked) onChange([...selected, d]);
              else onChange(selected.filter(x => x !== d));
            }}
            className="w-4 h-4 accent-indigo-600"
          />
          {d.toUpperCase()}
        </label>
      ))}
    </div>
  );
}

export default function AccessManagementModal({ isOpen, onClose }: AccessManagementModalProps) {
  const { username: userEmail, userRole } = useAuthStore();
  const isAuthorized = userRole === 'superadmin';

  const [tab, setTab] = useState<Tab>('active');
  const [users, setUsers] = useState<User[]>([]);
  const [pending, setPending] = useState<PendingRequest[]>([]);
  const [loading, setLoading] = useState(false);
  const [notice, setNotice] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Add-user form
  const [showAddUser, setShowAddUser] = useState(false);
  const [newEmail, setNewEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newName, setNewName] = useState('');
  const [newStates, setNewStates] = useState<string[]>([]);
  const [newDashboards, setNewDashboards] = useState<string[]>([]);

  // Inline edit state
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editStates, setEditStates] = useState<string[]>([]);
  const [editDashboards, setEditDashboards] = useState<string[]>([]);

  // Approve-with-edit state
  const [approvingId, setApprovingId] = useState<string | null>(null);
  const [approveStates, setApproveStates] = useState<string[]>([]);
  const [approveDashboards, setApproveDashboards] = useState<string[]>([]);

  const showNotice = (type: 'success' | 'error', message: string) => {
    setNotice({ type, message });
    setTimeout(() => setNotice(null), 4000);
  };

  const fetchUsers = useCallback(async () => {
    if (!isAuthorized) return;
    setLoading(true);
    try {
      const [usersRes, pendingRes] = await Promise.all([
        fetch(`${API_BASE}/api/admin/users`, { headers: { 'X-User-Email': userEmail } }),
        fetch(`${API_BASE}/api/admin/access-requests`, { headers: { 'X-User-Email': userEmail } }),
      ]);
      if (usersRes.ok) {
        const data = await usersRes.json();
        setUsers(Array.isArray(data) ? data : data.users || []);
      }
      if (pendingRes.ok) {
        const data = await pendingRes.json();
        setPending(Array.isArray(data) ? data : data.requests || []);
      }
    } catch (error) {
      console.error('Error fetching users:', error);
    } finally {
      setLoading(false);
    }
  }, [isAuthorized, userEmail]);

  useEffect(() => {
    if (isOpen && isAuthorized) fetchUsers();
  }, [isOpen, isAuthorized, fetchUsers]);

  const handleCreateUser = async () => {
    if (!newEmail || !newPassword || newDashboards.length === 0) {
      showNotice('error', 'Email, password, and at least one dashboard are required.');
      return;
    }
    try {
      const res = await fetch(`${API_BASE}/api/admin/users`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-User-Email': userEmail },
        body: JSON.stringify({ email: newEmail, password: newPassword, name: newName || newEmail, states: newStates, dashboard_access: newDashboards }),
      });
      if (res.ok) {
        showNotice('success', `User ${newEmail} created successfully.`);
        setNewEmail(''); setNewPassword(''); setNewName(''); setNewStates([]); setNewDashboards([]);
        setShowAddUser(false);
        fetchUsers();
      } else {
        const err = await res.json();
        showNotice('error', err.message || 'Failed to create user.');
      }
    } catch {
      showNotice('error', 'Network error. Please try again.');
    }
  };

  const handleSaveEdit = async () => {
    if (!editingId) return;
    try {
      const res = await fetch(`${API_BASE}/api/admin/users/${editingId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'X-User-Email': userEmail },
        body: JSON.stringify({ states: editStates, dashboard_access: editDashboards }),
      });
      if (res.ok) {
        showNotice('success', 'Access updated successfully.');
        setEditingId(null);
        fetchUsers();
      } else {
        showNotice('error', 'Failed to update user.');
      }
    } catch {
      showNotice('error', 'Network error. Please try again.');
    }
  };

  const handleRevokeAccess = async (email: string) => {
    if (!confirm(`Revoke access for ${email}? This will remove their account.`)) return;
    try {
      const res = await fetch(`${API_BASE}/api/admin/users/${email}`, {
        method: 'DELETE',
        headers: { 'X-User-Email': userEmail },
      });
      if (res.ok) {
        showNotice('success', `Access revoked for ${email}.`);
        fetchUsers();
      } else {
        showNotice('error', 'Failed to revoke access.');
      }
    } catch {
      showNotice('error', 'Network error. Please try again.');
    }
  };

  const handleApprove = async (requestId: string) => {
    try {
      const res = await fetch(`${API_BASE}/api/admin/access-requests/${requestId}/approve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-User-Email': userEmail },
        body: JSON.stringify({ states: approveStates, dashboard_access: approveDashboards }),
      });
      if (res.ok) {
        showNotice('success', `Access approved for ${requestId}.`);
        setApprovingId(null);
        fetchUsers();
      } else {
        showNotice('error', 'Failed to approve request.');
      }
    } catch {
      showNotice('error', 'Network error. Please try again.');
    }
  };

  const handleReject = async (requestId: string) => {
    if (!confirm(`Reject access request from ${requestId}?`)) return;
    try {
      const res = await fetch(`${API_BASE}/api/admin/access-requests/${requestId}/reject`, {
        method: 'POST',
        headers: { 'X-User-Email': userEmail },
      });
      if (res.ok) {
        showNotice('success', `Request from ${requestId} rejected.`);
        fetchUsers();
      } else {
        showNotice('error', 'Failed to reject request.');
      }
    } catch {
      showNotice('error', 'Network error. Please try again.');
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
          <p className="text-gray-700 mb-6">Only superadmin can manage user access.</p>
          <button onClick={onClose} className="w-full px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700">Close</button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-5xl max-h-[90vh] flex flex-col">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 shrink-0">
          <div>
            <h2 className="text-xl font-bold text-gray-900">Access Management</h2>
            <p className="text-sm text-gray-500 mt-0.5">Manage who can access which dashboards and states</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg">
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 px-6 pt-4 shrink-0">
          <button
            onClick={() => setTab('active')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              tab === 'active'
                ? 'bg-indigo-600 text-white'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            <UserCheck className="w-4 h-4" />
            Active Users
            <span className={`text-xs px-1.5 py-0.5 rounded-full ${tab === 'active' ? 'bg-indigo-500 text-white' : 'bg-gray-200 text-gray-600'}`}>
              {users.length}
            </span>
          </button>
          <button
            onClick={() => setTab('pending')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              tab === 'pending'
                ? 'bg-indigo-600 text-white'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            <Clock className="w-4 h-4" />
            Pending Requests
            {pending.length > 0 && (
              <span className={`text-xs px-1.5 py-0.5 rounded-full ${tab === 'pending' ? 'bg-indigo-500 text-white' : 'bg-amber-100 text-amber-700'}`}>
                {pending.length}
              </span>
            )}
          </button>
        </div>

        {/* Scrollable body */}
        <div className="flex-1 overflow-y-auto px-6 py-4">

          {notice && <Notice type={notice.type} message={notice.message} />}

          {loading ? (
            <div className="flex items-center justify-center py-16 text-gray-500">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mr-3"></div>
              Loading…
            </div>
          ) : tab === 'active' ? (

            /* ── ACTIVE USERS TAB ── */
            <>
              <div className="flex items-center justify-between mb-4">
                <p className="text-sm text-gray-600">{users.length} user{users.length !== 1 ? 's' : ''} with active access</p>
                <button
                  onClick={() => { setShowAddUser(!showAddUser); setEditingId(null); }}
                  className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 text-sm font-medium"
                >
                  <Plus className="w-4 h-4" />
                  Add User
                </button>
              </div>

              {/* Add user form */}
              {showAddUser && (
                <div className="bg-gray-50 border border-gray-200 rounded-xl p-5 mb-5">
                  <h4 className="font-semibold text-gray-900 mb-4">Create New User</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                    <input
                      type="email"
                      placeholder="Email address *"
                      value={newEmail}
                      onChange={(e) => setNewEmail(e.target.value)}
                      className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                    <input
                      type="password"
                      placeholder="Password *"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                    <input
                      type="text"
                      placeholder="Full name (optional)"
                      value={newName}
                      onChange={(e) => setNewName(e.target.value)}
                      className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 sm:col-span-2"
                    />
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-4">
                    <div>
                      <p className="text-sm font-medium text-gray-700 mb-2">State Access <span className="text-gray-400 font-normal">(leave empty for all)</span></p>
                      <StatePicker selected={newStates} onChange={setNewStates} />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-700 mb-2">Dashboard Access *</p>
                      <DashboardPicker selected={newDashboards} onChange={setNewDashboards} />
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={handleCreateUser} className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm font-medium">
                      Create User
                    </button>
                    <button onClick={() => setShowAddUser(false)} className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 text-sm font-medium">
                      Cancel
                    </button>
                  </div>
                </div>
              )}

              {users.length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                  <Users className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                  <p className="font-medium">No active users yet</p>
                  <p className="text-sm mt-1">Add a user or approve a pending request.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {users.map(user => (
                    <div key={user.email} className="border border-gray-200 rounded-xl overflow-hidden">
                      {/* User row */}
                      <div className="flex items-start justify-between px-5 py-4 bg-white gap-4">
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-semibold text-gray-900 text-sm">{user.name || user.email}</span>
                            {user.name && <span className="text-xs text-gray-500">{user.email}</span>}
                          </div>
                          <div className="flex flex-wrap items-center gap-2 mt-2">
                            {/* Dashboard badges */}
                            {(user.dashboard_access || []).map(d => (
                              <span key={d} className="bg-violet-100 text-violet-800 text-xs font-semibold px-2 py-0.5 rounded-full uppercase">
                                {d}
                              </span>
                            ))}
                            {/* State badges (collapsed if many) */}
                            {user.allowedStates.length === 0 ? (
                              <span className="bg-green-100 text-green-800 text-xs font-semibold px-2 py-0.5 rounded-full">All States</span>
                            ) : (
                              <>
                                {user.allowedStates.slice(0, 4).map(s => (
                                  <span key={s} className="bg-indigo-100 text-indigo-800 text-xs font-medium px-2 py-0.5 rounded-full">{s}</span>
                                ))}
                                {user.allowedStates.length > 4 && (
                                  <span className="text-xs text-gray-500">+{user.allowedStates.length - 4} more</span>
                                )}
                              </>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-1 shrink-0">
                          {editingId === user.email ? (
                            <>
                              <button onClick={handleSaveEdit} className="flex items-center gap-1.5 px-3 py-1.5 bg-green-600 text-white rounded-lg hover:bg-green-700 text-xs font-medium">
                                <Save className="w-3.5 h-3.5" /> Save
                              </button>
                              <button onClick={() => setEditingId(null)} className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 text-xs font-medium">
                                <XCircle className="w-3.5 h-3.5" /> Cancel
                              </button>
                            </>
                          ) : (
                            <>
                              <button
                                onClick={() => {
                                  setEditingId(user.email);
                                  setEditStates(Array.isArray(user.allowedStates) ? user.allowedStates : []);
                                  setEditDashboards(Array.isArray(user.dashboard_access) ? user.dashboard_access : []);
                                  setShowAddUser(false);
                                }}
                                className="flex items-center gap-1.5 px-3 py-1.5 border border-indigo-200 text-indigo-700 rounded-lg hover:bg-indigo-50 text-xs font-medium"
                              >
                                <Edit2 className="w-3.5 h-3.5" /> Edit Access
                              </button>
                              <button
                                onClick={() => handleRevokeAccess(user.email)}
                                className="flex items-center gap-1.5 px-3 py-1.5 border border-red-200 text-red-600 rounded-lg hover:bg-red-50 text-xs font-medium"
                              >
                                <Trash2 className="w-3.5 h-3.5" /> Revoke
                              </button>
                            </>
                          )}
                        </div>
                      </div>

                      {/* Inline edit panel */}
                      {editingId === user.email && (
                        <div className="border-t border-gray-200 bg-gray-50 px-5 py-4">
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                            <div>
                              <p className="text-sm font-medium text-gray-700 mb-2">State Access <span className="text-gray-400 font-normal">(empty = all states)</span></p>
                              <StatePicker selected={editStates} onChange={setEditStates} />
                            </div>
                            <div>
                              <p className="text-sm font-medium text-gray-700 mb-2">Dashboard Access</p>
                              <DashboardPicker selected={editDashboards} onChange={setEditDashboards} />
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </>

          ) : (

            /* ── PENDING REQUESTS TAB ── */
            <>
              <p className="text-sm text-gray-600 mb-4">{pending.length} pending access request{pending.length !== 1 ? 's' : ''}</p>

              {pending.length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                  <Clock className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                  <p className="font-medium">No pending requests</p>
                  <p className="text-sm mt-1">All access requests have been reviewed.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {pending.map(req => (
                    <div key={req.id} className="border border-amber-200 rounded-xl overflow-hidden bg-amber-50/40">
                      <div className="flex items-start justify-between px-5 py-4 gap-4">
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-semibold text-gray-900 text-sm">{req.fullName || req.email}</span>
                            {req.fullName && <span className="text-xs text-gray-500">{req.email}</span>}
                            <span className="bg-amber-100 text-amber-800 text-xs font-semibold px-2 py-0.5 rounded-full">Pending</span>
                          </div>
                          <div className="mt-2">
                            <p className="text-xs text-gray-500 mb-1">Requested states:</p>
                            <div className="flex flex-wrap gap-1.5">
                              {req.requestedStates.length === 0 ? (
                                <span className="text-xs text-gray-500 italic">None specified</span>
                              ) : req.requestedStates.map(s => (
                                <span key={s} className="bg-indigo-100 text-indigo-800 text-xs font-medium px-2 py-0.5 rounded-full">{s}</span>
                              ))}
                            </div>
                          </div>
                          {req.requestedAt && (
                            <p className="text-xs text-gray-400 mt-2">Requested: {new Date(req.requestedAt).toLocaleDateString()}</p>
                          )}
                        </div>
                        {approvingId !== req.id && (
                          <div className="flex items-center gap-1 shrink-0">
                            <button
                              onClick={() => {
                                setApprovingId(req.id);
                                setApproveStates(req.requestedStates);
                                setApproveDashboards(['avante', 'iospl']);
                              }}
                              className="flex items-center gap-1.5 px-3 py-1.5 bg-green-600 text-white rounded-lg hover:bg-green-700 text-xs font-medium"
                            >
                              <CheckCircle className="w-3.5 h-3.5" /> Approve
                            </button>
                            <button
                              onClick={() => handleReject(req.id)}
                              className="flex items-center gap-1.5 px-3 py-1.5 border border-red-200 text-red-600 rounded-lg hover:bg-red-50 text-xs font-medium"
                            >
                              <XCircle className="w-3.5 h-3.5" /> Reject
                            </button>
                          </div>
                        )}
                      </div>

                      {/* Approve with access config */}
                      {approvingId === req.id && (
                        <div className="border-t border-amber-200 bg-white px-5 py-4">
                          <p className="text-sm font-semibold text-gray-800 mb-3">Configure access before approving</p>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-4">
                            <div>
                              <p className="text-sm font-medium text-gray-700 mb-2">State Access</p>
                              <StatePicker selected={approveStates} onChange={setApproveStates} />
                            </div>
                            <div>
                              <p className="text-sm font-medium text-gray-700 mb-2">Dashboard Access</p>
                              <DashboardPicker selected={approveDashboards} onChange={setApproveDashboards} />
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <button
                              onClick={() => handleApprove(req.id)}
                              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm font-medium"
                            >
                              Confirm Approval
                            </button>
                            <button
                              onClick={() => setApprovingId(null)}
                              className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 text-sm font-medium"
                            >
                              Cancel
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
