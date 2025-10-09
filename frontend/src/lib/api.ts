import axios from 'axios';

export const api = axios.create({
  baseURL: '/api',
  withCredentials: true,
});

export function setSessionToken(token: string) {
  api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
}

export function clearSessionToken() {
  delete api.defaults.headers.common['Authorization'];
}

// ✅ EXPORT ALL INTERFACES
export interface User {
  id: string;
  email: string;
  name: string;
  verified: boolean;
  tenantId: string;
  teamId: string;
  createdAt?: string;
}

export interface Team {
  id: string;
  name: string;
  tenantId?: string;
  userCount?: number;
  createdAt?: string;
}

export interface Group {
  id: string;
  name: string;
  description?: string;
  teamId: string;
  createdAt?: string;
  roleCount?: number;
  memberCount?: number;
}

export interface Role {
  id: string;
  name: string;
  description?: string;
  permissions: {
    vault: string[];
    financials: string[];
    reporting: string[];
  };
  createdAt?: string;
  groupCount?: number;
}