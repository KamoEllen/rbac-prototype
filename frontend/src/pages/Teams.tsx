import { useState, useEffect } from 'react';
import { api } from '../lib/api';
import type { Team } from '../lib/api';
import Layout from '../components/Layout';
import { Plus, Pencil, Trash2 } from 'lucide-react';

export default function Teams() {
  const [teams, setTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingTeam, setEditingTeam] = useState<Team | null>(null);
  const [formData, setFormData] = useState({ name: '' });

  useEffect(() => {
    fetchTeams();
  }, []);

  async function fetchTeams() {
    try {
      const { data } = await api.get('/teams');
      setTeams(data);
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    try {
      if (editingTeam) {
        await api.put(`/teams/${editingTeam.id}`, formData);
      } else {
        await api.post('/teams', formData);
      }
      setShowModal(false);
      setEditingTeam(null);
      setFormData({ name: '' });
      fetchTeams();
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to save team');
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('Delete this team?')) return;
    try {
      await api.delete(`/teams/${id}`);
      fetchTeams();
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to delete team');
    }
  }

  function openEdit(team: Team) {
    setEditingTeam(team);
    setFormData({ name: team.name });
    setShowModal(true);
  }

  function openCreate() {
    setEditingTeam(null);
    setFormData({ name: '' });
    setShowModal(true);
  }

  if (loading) return <Layout><div className="loading">Loading...</div></Layout>;

  return (
    <Layout>
      <div className="page-header">
        <h1>Teams</h1>
        <button onClick={openCreate} className="btn btn-primary">
          <Plus size={18} />
          New Team
        </button>
      </div>

      <div className="card">
        <table className="table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Members</th>
              <th>Created</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {teams.map(team => (
              <tr key={team.id}>
                <td style={{ fontWeight: 500 }}>{team.name}</td>
                <td>{team.userCount || 0} users</td>
                <td style={{ color: 'var(--gray-400)', fontSize: '0.875rem' }}>
                  {new Date(team.createdAt!).toLocaleDateString()}
                </td>
                <td>
                  <div className="actions">
                    <button onClick={() => openEdit(team)} className="btn btn-secondary">
                      <Pencil size={16} />
                    </button>
                    <button onClick={() => handleDelete(team.id)} className="btn btn-danger">
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
            <h2>{editingTeam ? 'Edit Team' : 'New Team'}</h2>
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label>Team Name</label>
                <input
                  value={formData.name}
                  onChange={e => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Engineering"
                  required
                />
              </div>
              <div className="form-actions">
                <button type="submit" className="btn btn-primary">
                  {editingTeam ? 'Save' : 'Create'}
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