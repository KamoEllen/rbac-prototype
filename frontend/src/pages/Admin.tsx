import { useState, useEffect } from 'react';
import { api } from '../lib/api';
import type {  User } from '../lib/api';
import Layout from '../components/Layout';
import { CheckCircle } from 'lucide-react';

export default function Admin() {
  const [unverifiedUsers, setUnverifiedUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchUnverifiedUsers();
  }, []);

  async function fetchUnverifiedUsers() {
    try {
      const { data } = await api.get('/admin/users/unverified');
      setUnverifiedUsers(data);
    } finally {
      setLoading(false);
    }
  }

  async function handleVerify(id: string) {
    try {
      await api.post(`/admin/users/${id}/verify`);
      fetchUnverifiedUsers();
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to verify user');
    }
  }

  if (loading) return <Layout><div className="loading">Loading...</div></Layout>;

  return (
    <Layout>
      <div className="page-header">
        <h1>Admin</h1>
      </div>

      <div className="card">
        <h2 style={{ fontSize: '1.125rem', marginBottom: '1rem' }}>Pending Verifications</h2>
        
        {unverifiedUsers.length === 0 ? (
          <p style={{ color: 'var(--gray-400)' }}>No pending users</p>
        ) : (
          <table className="table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Registered</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {unverifiedUsers.map(user => (
                <tr key={user.id}>
                  <td style={{ fontWeight: 500 }}>{user.name}</td>
                  <td>{user.email}</td>
                  <td style={{ color: 'var(--gray-400)', fontSize: '0.875rem' }}>
                    {new Date(user.createdAt!).toLocaleDateString()}
                  </td>
                  <td>
                    <button onClick={() => handleVerify(user.id)} className="btn btn-primary">
                      <CheckCircle size={16} />
                      Verify
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </Layout>
  );
}