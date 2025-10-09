import { useState, useEffect } from 'react';
import { api } from '../lib/api';
import { useAuth } from '../context/AuthContext';
import Layout from '../components/Layout';
import { Plus, Trash2, Eye, EyeOff } from 'lucide-react';

interface Secret {
  id: string;
  name: string;
  value: string;
  createdAt: string;
}

export default function Vault() {
  const { user, permissions } = useAuth();
  const [secrets, setSecrets] = useState<Secret[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({ name: '', value: '' });
  const [visibleSecrets, setVisibleSecrets] = useState<Set<string>>(new Set());

  const canCreate = permissions?.vault.includes('create');
  const canDelete = permissions?.vault.includes('delete');

  useEffect(() => {
    if (user?.teamId) fetchSecrets();
  }, [user]);

  async function fetchSecrets() {
    try {
      const { data } = await api.get(`/vault?teamId=${user!.teamId}`);
      setSecrets(data);
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    try {
      await api.post('/vault', { ...formData, teamId: user!.teamId });
      setShowModal(false);
      setFormData({ name: '', value: '' });
      fetchSecrets();
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to create secret');
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('Delete this secret?')) return;
    try {
      await api.delete(`/vault/${id}?teamId=${user!.teamId}`);
      fetchSecrets();
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to delete secret');
    }
  }

  function toggleVisibility(id: string) {
    setVisibleSecrets(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  if (loading) return <Layout><div className="loading">Loading...</div></Layout>;

  return (
    <Layout>
      <div className="page-header">
        <h1>Vault</h1>
        {canCreate && (
          <button onClick={() => setShowModal(true)} className="btn btn-primary">
            <Plus size={18} />
            New Secret
          </button>
        )}
      </div>

      <div className="card">
        <table className="table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Value</th>
              <th>Created</th>
              {canDelete && <th>Actions</th>}
            </tr>
          </thead>
          <tbody>
            {secrets.map(secret => (
              <tr key={secret.id}>
                <td style={{ fontWeight: 500 }}>{secret.name}</td>
                <td>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <code style={{ fontSize: '0.875rem' }}>
                      {visibleSecrets.has(secret.id) ? secret.value : '••••••••••••'}
                    </code>
                    <button
                      onClick={() => toggleVisibility(secret.id)}
                      className="btn btn-secondary"
                      style={{ padding: '0.25rem 0.5rem' }}
                    >
                      {visibleSecrets.has(secret.id) ? <EyeOff size={14} /> : <Eye size={14} />}
                    </button>
                  </div>
                </td>
                <td style={{ color: 'var(--gray-400)', fontSize: '0.875rem' }}>
                  {new Date(secret.createdAt).toLocaleDateString()}
                </td>
                {canDelete && (
                  <td>
                    <button onClick={() => handleDelete(secret.id)} className="btn btn-danger">
                      <Trash2 size={16} />
                    </button>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <h2>New Secret</h2>
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label>Name</label>
                <input
                  value={formData.name}
                  onChange={e => setFormData({ ...formData, name: e.target.value })}
                  placeholder="API_KEY"
                  required
                />
              </div>
              <div className="form-group">
                <label>Value</label>
                <input
                  type="password"
                  value={formData.value}
                  onChange={e => setFormData({ ...formData, value: e.target.value })}
                  placeholder="sk_test_..."
                  required
                />
              </div>
              <div className="form-actions">
                <button type="submit" className="btn btn-primary">Create</button>
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