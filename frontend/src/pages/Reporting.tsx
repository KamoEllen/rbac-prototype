import { useState, useEffect } from 'react';
import { api } from '../lib/api';
import { useAuth } from '../context/AuthContext';
import Layout from '../components/Layout';
import { Plus, Trash2, FileText } from 'lucide-react';

interface Report {
  id: string;
  title: string;
  content: string;
  createdAt: string;
}

export default function Reporting() {
  const { user, permissions } = useAuth();
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [viewingReport, setViewingReport] = useState<Report | null>(null);
  const [formData, setFormData] = useState({ title: '', content: '' });

  const canCreate = permissions?.reporting.includes('create');
  const canDelete = permissions?.reporting.includes('delete');

  useEffect(() => {
    if (user?.teamId) fetchReports();
  }, [user]);

  async function fetchReports() {
    try {
      const { data } = await api.get(`/reporting?teamId=${user!.teamId}`);
      setReports(data);
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    try {
      await api.post('/reporting', { ...formData, teamId: user!.teamId });
      setShowModal(false);
      setFormData({ title: '', content: '' });
      fetchReports();
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to create report');
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('Delete this report?')) return;
    try {
      await api.delete(`/reporting/${id}?teamId=${user!.teamId}`);
      fetchReports();
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to delete report');
    }
  }

  if (loading) return <Layout><div className="loading">Loading...</div></Layout>;

  return (
    <Layout>
      <div className="page-header">
        <h1>Reporting</h1>
        {canCreate && (
          <button onClick={() => setShowModal(true)} className="btn btn-primary">
            <Plus size={18} />
            New Report
          </button>
        )}
      </div>

      <div className="card">
        <table className="table">
          <thead>
            <tr>
              <th>Title</th>
              <th>Preview</th>
              <th>Date</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {reports.length === 0 ? (
              <tr>
                <td colSpan={4} style={{ textAlign: 'center', padding: '2rem', color: 'var(--gray-400)' }}>
                  No reports yet
                </td>
              </tr>
            ) : (
              reports.map(report => (
                <tr key={report.id}>
                  <td style={{ fontWeight: 500 }}>{report.title}</td>
                  <td style={{ color: 'var(--gray-400)', fontSize: '0.875rem' }}>
                    {report.content.substring(0, 50)}...
                  </td>
                  <td style={{ color: 'var(--gray-400)', fontSize: '0.875rem' }}>
                    {new Date(report.createdAt).toLocaleDateString()}
                  </td>
                  <td>
                    <div className="actions">
                      <button onClick={() => setViewingReport(report)} className="btn btn-secondary">
                        <FileText size={16} />
                      </button>
                      {canDelete && (
                        <button onClick={() => handleDelete(report.id)} className="btn btn-danger">
                          <Trash2 size={16} />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Create Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <h2>New Report</h2>
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label>Title</label>
                <input
                  value={formData.title}
                  onChange={e => setFormData({ ...formData, title: e.target.value })}
                  placeholder="Q1 2025 Report"
                  required
                />
              </div>
              <div className="form-group">
                <label>Content</label>
                <textarea
                  value={formData.content}
                  onChange={e => setFormData({ ...formData, content: e.target.value })}
                  placeholder="Report content..."
                  rows={8}
                  required
                  style={{ resize: 'vertical' }}
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

      {/* View Modal */}
      {viewingReport && (
        <div className="modal-overlay" onClick={() => setViewingReport(null)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <h2>{viewingReport.title}</h2>
            <div style={{ 
              marginTop: '1rem', 
              padding: '1rem', 
              background: 'var(--gray-800)', 
              borderRadius: '6px',
              maxHeight: '400px',
              overflowY: 'auto'
            }}>
              <p style={{ whiteSpace: 'pre-wrap', lineHeight: 1.6 }}>
                {viewingReport.content}
              </p>
            </div>
            <div style={{ marginTop: '1rem', fontSize: '0.875rem', color: 'var(--gray-400)' }}>
              Created: {new Date(viewingReport.createdAt).toLocaleString()}
            </div>
            <div className="form-actions">
              <button onClick={() => setViewingReport(null)} className="btn btn-secondary">
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
}