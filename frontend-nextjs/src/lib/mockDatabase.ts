/**
 * Mock Database Storage
 * Shared storage for access requests and users across all API endpoints
 * In production, replace this with a real database (PostgreSQL, MongoDB, etc.)
 */

import supabase from './supabaseClient';

export interface AccessRequest {
  id: string;
  fullName: string;
  email: string;
  password: string;
  requestedStates: string[];
  status: 'pending' | 'approved' | 'rejected';
  requestedAt: string;
}

export interface User {
  id: string;
  email: string;
  username: string;
  password: string;
  fullName: string;
  role: 'admin' | 'user';
  allowedStates: string[];
  createdAt: string;
  status: 'active' | 'inactive';
}

// In-memory fallback
const inMemoryAccessRequests: AccessRequest[] = [];
const inMemoryUsers: User[] = [
  {
    id: 'admin-1',
    email: 'admin@example.com',
    username: 'u2vp8kb',
    password: 'asdftuy#$%78@!',
    fullName: 'Super Admin',
    role: 'admin',
    allowedStates: [],
    createdAt: new Date().toISOString(),
    status: 'active',
  },
];

export async function getAccessRequests(): Promise<AccessRequest[]> {
  if (!supabase) return inMemoryAccessRequests;

  const { data, error } = await supabase
    .from('access_requests')
    .select('*')
    .order('requested_at', { ascending: false });

  if (error) {
    console.error('Supabase getAccessRequests error:', error);
    return inMemoryAccessRequests;
  }

  return (data || []).map((r: any) => ({
    id: r.id,
    fullName: r.full_name,
    email: r.email,
    password: r.password,
    requestedStates: r.requested_states || [],
    status: r.status,
    requestedAt: r.requested_at
  }));
}

export async function createAccessRequest(payload: {
  fullName: string;
  email: string;
  password: string;
  requestedStates: string[];
}) {
  if (!supabase) {
    const newReq: AccessRequest = {
      id: `req-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      fullName: payload.fullName,
      email: payload.email.toLowerCase(),
      password: payload.password,
      requestedStates: payload.requestedStates,
      status: 'pending',
      requestedAt: new Date().toISOString(),
    };
    inMemoryAccessRequests.push(newReq);
    return newReq;
  }

  try {
    const { data, error } = await supabase
      .from('access_requests')
      .insert([{ full_name: payload.fullName, email: payload.email.toLowerCase(), password: payload.password, requested_states: payload.requestedStates }])
      .select('*')
      .single();

    if (error) {
      console.error('Supabase createAccessRequest error:', error.message || error);
      if ((error as any).details) console.error('Details:', (error as any).details);
      throw new Error((error as any).message || 'Supabase insert error');
    }

    return {
      id: data.id,
      fullName: data.full_name,
      email: data.email,
      password: data.password,
      requestedStates: data.requested_states || [],
      status: data.status,
      requestedAt: data.requested_at,
    } as AccessRequest;
  } catch (err: any) {
    console.error('createAccessRequest exception:', err && (err.message || err));
    throw err;
  }
}

export async function approveAccessRequest(requestId: string) {
  if (!supabase) {
    const idx = inMemoryAccessRequests.findIndex(r => r.id === requestId);
    if (idx === -1) throw new Error('Not found');
    inMemoryAccessRequests[idx].status = 'approved';

    const req = inMemoryAccessRequests[idx];
    const newUser: User = {
      id: `user-${Date.now()}`,
      email: req.email,
      username: req.email.split('@')[0],
      password: req.password,
      fullName: req.fullName,
      role: 'user',
      allowedStates: req.requestedStates,
      createdAt: new Date().toISOString(),
      status: 'active',
    };
    inMemoryUsers.push(newUser);
    return { request: inMemoryAccessRequests[idx], user: newUser };
  }

  const { data: reqData, error: getErr } = await supabase
    .from('access_requests')
    .select('*')
    .eq('id', requestId)
    .single();

  if (getErr) throw getErr;

  const { data: userData, error: insertErr } = await supabase
    .from('users')
    .insert([{ email: reqData.email, username: reqData.email.split('@')[0], password: reqData.password, full_name: reqData.full_name, allowed_states: reqData.requested_states }])
    .select('*')
    .single();

  if (insertErr) throw insertErr;

  const { error: updateErr } = await supabase
    .from('access_requests')
    .update({ status: 'approved' })
    .eq('id', requestId);

  if (updateErr) throw updateErr;

  return {
    request: {
      id: reqData.id,
      fullName: reqData.full_name,
      email: reqData.email,
      password: reqData.password,
      requestedStates: reqData.requested_states || [],
      status: 'approved',
      requestedAt: reqData.requested_at,
    },
    user: {
      id: userData.id,
      email: userData.email,
      username: userData.username,
      password: userData.password,
      fullName: userData.full_name,
      role: userData.role || 'user',
      allowedStates: userData.allowed_states || [],
      createdAt: userData.created_at,
      status: userData.status || 'active',
    }
  };
}

export async function getUsers(): Promise<User[]> {
  if (!supabase) return inMemoryUsers;

  const { data, error } = await supabase.from('users').select('*').order('created_at', { ascending: false });
  if (error) {
    console.error('Supabase getUsers error:', error);
    return inMemoryUsers;
  }

  return (data || []).map((u: any) => ({
    id: u.id,
    email: u.email,
    username: u.username,
    password: u.password,
    fullName: u.full_name,
    role: u.role,
    allowedStates: u.allowed_states || [],
    createdAt: u.created_at,
    status: u.status || 'active',
  }));
}

export async function createUser(payload: { email: string; password: string; states: string[]; role?: string; fullName?: string }) {
  if (!supabase) {
    const newUser: User = {
      id: `user-${Date.now()}`,
      email: payload.email,
      username: payload.email.split('@')[0],
      password: payload.password,
      fullName: payload.fullName || payload.email.split('@')[0],
      role: (payload.role as 'admin' | 'user') || 'user',
      allowedStates: payload.states || [],
      createdAt: new Date().toISOString(),
      status: 'active',
    };
    inMemoryUsers.push(newUser);
    return newUser;
  }

  const { data, error } = await supabase
    .from('users')
    .insert([{ email: payload.email, username: payload.email.split('@')[0], password: payload.password, full_name: payload.fullName || payload.email.split('@')[0], role: payload.role || 'user', allowed_states: payload.states || [] }])
    .select('*')
    .single();

  if (error) throw error;

  return {
    id: data.id,
    email: data.email,
    username: data.username,
    password: data.password,
    fullName: data.full_name,
    role: data.role,
    allowedStates: data.allowed_states || [],
    createdAt: data.created_at,
    status: data.status || 'active',
  } as User;
}

export async function deleteUser(userId: string) {
  if (!supabase) {
    const idx = inMemoryUsers.findIndex(u => u.id === userId);
    if (idx === -1) throw new Error('Not found');
    inMemoryUsers.splice(idx, 1);
    return;
  }

  const { error } = await supabase.from('users').delete().eq('id', userId);
  if (error) throw error;
}

export default {
  getAccessRequests,
  createAccessRequest,
  approveAccessRequest,
  getUsers,
  createUser,
  deleteUser,
};
