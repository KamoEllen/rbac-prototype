import { useState, useEffect } from 'react';
import { api } from '../lib/api';
import type {  User } from '../lib/api';
import Layout from '../components/Layout';
import { Pencil, Trash2 } from 'lucide-react';

export default function Users() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [formData, setFormData] = useState({ name: '', email: '' });

  useEffect(() => {
    fetchUsers();
  }, []);

  async function fetchUsers() {
    try {
      const { data } = await api.get('/users');
      setUsers(data);
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    try {
      if (editingUser) {
        await api.put(`/users/${editingUser.id}`, formData);
      }
      setShowModal(false);
      setEditingUser(null);
      setFormData({ name: '', email: '' });
      fetchUsers();
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to save user');
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('Delete this user?')) return;
    try {
      await api.delete(`/users/${id}`);
      fetchUsers();
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to delete user');
    }
  }

  function openEdit(user: User) {
    setEditingUser(user);
    setFormData({ name: user.name, email: user.email });
    setShowModal(true);
  }

  if (loading) return <Layout><div className="loading">Loading...</div></Layout>;

  return (
    <Layout>
      <div className="page-header">
        <h1>Users</h1>
      </div>

      <div className="card">
        <table className="table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Email</th>
              <th>Status</th>
              <th>Team</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.map(user => (
              <tr key={user.id}>
                <td>{user.name}</td>
                <td>{user.email}</td>
                <td>
                  <span className={`badge ${user.verified ? 'badge-success' : 'badge-warning'}`}>
                    {user.verified ? 'Verified' : 'Pending'}
                  </span>
                </td>
                <td style={{ color: 'var(--gray-400)', fontSize: '0.875rem' }}>
                  {user.teamId.substring(0, 8)}...
                </td>
                <td>
                  <div className="actions">
                    <button onClick={() => openEdit(user)} className="btn btn-secondary">
                      <Pencil size={16} />
                    </button>
                    <button onClick={() => handleDelete(user.id)} className="btn btn-danger">
                      <Trash2 size={16} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <h2>Edit User</h2>
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label>Name</label>
                <input
                  value={formData.name}
                  onChange={e => setFormData({ ...formData, name: e.target.value })}
                  required
                />
              </div>
              <div className="form-group">
                <label>Email</label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={e => setFormData({ ...formData, email: e.target.value })}
                  required
                />
              </div>
              <div className="form-actions">
                <button type="submit" className="btn btn-primary">Save</button>
                <button type="button" onClick={() => setShowModal(false)} className="btn btn-secondary">
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </Layout>
  );
}