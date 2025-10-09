import { useState, useEffect } from 'react';
import { api } from '../lib/api';
import type {  Role } from '../lib/api';
import Layout from '../components/Layout';
import { Plus, Pencil, Trash2 } from 'lucide-react';

export default function Roles() {
  const [roles, setRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingRole, setEditingRole] = useState<Role | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    permissions: {
      vault: [] as string[],
      financials: [] as string[],
      reporting: [] as string[]
    }
  });

  useEffect(() => {
    fetchRoles();
  }, []);

  async function fetchRoles() {
    try {
      const { data } = await api.get('/roles');
      setRoles(data);
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    try {
      if (editingRole) {
        await api.put(`/roles/${editingRole.id}`, formData);
      } else {
        await api.post('/roles', formData);
      }
      setShowModal(false);
      setEditingRole(null);
      resetForm();
      fetchRoles();
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to save role');
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('Delete this role?')) return;
    try {
      await api.delete(`/roles/${id}`);
      fetchRoles();
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to delete role');
    }
  }

  function openEdit(role: Role) {
    setEditingRole(role);
    setFormData({
      name: role.name,
      description: role.description || '',
      permissions: role.permissions
    });
    setShowModal(true);
  }

  function openCreate() {
    setEditingRole(null);
    resetForm();
    setShowModal(true);
  }

  function resetForm() {
    setFormData({
      name: '',
      description: '',
      permissions: { vault: [], financials: [], reporting: [] }
    });
  }

  function togglePermission(module: 'vault' | 'financials' | 'reporting', action: string) {
    setFormData(prev => ({
      ...prev,
      permissions: {
        ...prev.permissions,
        [module]: prev.permissions[module].includes(action)
          ? prev.permissions[module].filter(a => a !== action)
          : [...prev.permissions[module], action]
      }
    }));
  }

  const actions = ['create', 'read', 'update', 'delete'];

  if (loading) return <Layout><div className="loading">Loading...</div></Layout>;

  return (
    <Layout>
      <div className="page-header">
        <h1>Roles</h1>
        <button onClick={openCreate} className="btn btn-primary">
          <Plus size={18} />
          New Role
        </button>
      </div>

      <div className="card">
        <table className="table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Description</th>
              <th>Permissions</th>
              <th>Groups</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {roles.map(role => (
              <tr key={role.id}>
                <td style={{ fontWeight: 500 }}>{role.name}</td>
                <td style={{ color: 'var(--gray-400)', fontSize: '0.875rem' }}>
                  {role.description || '—'}
                </td>
                <td style={{ fontSize: '0.75rem' }}>
                  {Object.entries(role.permissions).map(([module, perms]) => 
                    perms.length > 0 && (
                      <div key={module} style={{ marginBottom: '0.25rem' }}>
                        <span style={{ color: 'var(--gray-500)' }}>{module}:</span>{' '}
                        {perms.join(', ')}
                      </div>
                    )
                  )}
                </td>
                <td>{role.groupCount || 0}</td>
                <td>
                  <div className="actions">
                    <button onClick={() => openEdit(role)} className="btn btn-secondary">
                      <Pencil size={16} />
                    </button>
                    <button onClick={() => handleDelete(role.id)} className="btn btn-danger">
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
            <h2>{editingRole ? 'Edit Role' : 'New Role'}</h2>
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label>Name</label>
                <input
                  value={formData.name}
                  onChange={e => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Admin"
                  required
                />
              </div>
              <div className="form-group">
                <label>Description</label>
                <input
                  value={formData.description}
                  onChange={e => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Full access to all modules"
                />
              </div>
              
              {(['vault', 'financials', 'reporting'] as const).map(module => (
                <div key={module} className="form-group">
                  <label style={{ textTransform: 'capitalize' }}>{module}</label>
                  <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                    {actions.map(action => (
                      <label key={action} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                        <input
                          type="checkbox"
                          checked={formData.permissions[module].includes(action)}
                          onChange={() => togglePermission(module, action)}
                        />
                        <span style={{ fontSize: '0.875rem' }}>{action}</span>
                      </label>
                    ))}
                  </div>
                </div>
              ))}

              <div className="form-actions">
                <button type="submit" className="btn btn-primary">
                  {editingRole ? 'Save' : 'Create'}
                </button>
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