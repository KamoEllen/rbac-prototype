import { useState, useEffect } from 'react';
import { api } from '../lib/api';
import type {  Group, Team } from '../lib/api';
import Layout from '../components/Layout';
import { Plus, Pencil, Trash2 } from 'lucide-react';

export default function Groups() {
  const [groups, setGroups] = useState<Group[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingGroup, setEditingGroup] = useState<Group | null>(null);
  const [formData, setFormData] = useState({ name: '', description: '', teamId: '' });

  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    try {
      const [groupsRes, teamsRes] = await Promise.all([
        api.get('/groups'),
        api.get('/teams')
      ]);
      setGroups(groupsRes.data);
      setTeams(teamsRes.data);
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    try {
      if (editingGroup) {
        await api.put(`/groups/${editingGroup.id}`, formData);
      } else {
        await api.post('/groups', formData);
      }
      setShowModal(false);
      setEditingGroup(null);
      setFormData({ name: '', description: '', teamId: '' });
      fetchData();
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to save group');
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('Delete this group?')) return;
    try {
      await api.delete(`/groups/${id}`);
      fetchData();
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to delete group');
    }
  }

  function openEdit(group: Group) {
    setEditingGroup(group);
    setFormData({ name: group.name, description: group.description || '', teamId: group.teamId });
    setShowModal(true);
  }

  function openCreate() {
    setEditingGroup(null);
    setFormData({ name: '', description: '', teamId: teams[0]?.id || '' });
    setShowModal(true);
  }

  if (loading) return <Layout><div className="loading">Loading...</div></Layout>;

  return (
    <Layout>
      <div className="page-header">
        <h1>Groups</h1>
        <button onClick={openCreate} className="btn btn-primary">
          <Plus size={18} />
          New Group
        </button>
      </div>

      <div className="card">
        <table className="table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Description</th>
              <th>Team</th>
              <th>Roles</th>
              <th>Members</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {groups.map(group => (
              <tr key={group.id}>
                <td style={{ fontWeight: 500 }}>{group.name}</td>
                <td style={{ color: 'var(--gray-400)', fontSize: '0.875rem' }}>
                  {group.description || '—'}
                </td>
                <td style={{ fontSize: '0.875rem' }}>
                  {teams.find(t => t.id === group.teamId)?.name || 'Unknown'}
                </td>
                <td>{group.roleCount || 0}</td>
                <td>{group.memberCount || 0}</td>
                <td>
                  <div className="actions">
                    <button onClick={() => openEdit(group)} className="btn btn-secondary">
                      <Pencil size={16} />
                    </button>
                    <button onClick={() => handleDelete(group.id)} className="btn btn-danger">
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
            <h2>{editingGroup ? 'Edit Group' : 'New Group'}</h2>
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label>Name</label>
                <input
                  value={formData.name}
                  onChange={e => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Admins"
                  required
                />
              </div>
              <div className="form-group">
                <label>Description</label>
                <input
                  value={formData.description}
                  onChange={e => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Full access group"
                />
              </div>
              <div className="form-group">
                <label>Team</label>
                <select
                  value={formData.teamId}
                  onChange={e => setFormData({ ...formData, teamId: e.target.value })}
                  required
                  disabled={!!editingGroup}
                >
                  {teams.map(team => (
                    <option key={team.id} value={team.id}>{team.name}</option>
                  ))}
                </select>
              </div>
              <div className="form-actions">
                <button type="submit" className="btn btn-primary">
                  {editingGroup ? 'Save' : 'Create'}
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