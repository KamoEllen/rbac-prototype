import { useState, useEffect } from 'react';
import { api } from '../lib/api';
import { useAuth } from '../context/AuthContext';
import Layout from '../components/Layout';
import { Plus, Trash2 } from 'lucide-react';

interface Transaction {
  id: string;
  amount: string;
  description: string;
  createdAt: string;
}

export default function Financials() {
  const { user, permissions } = useAuth();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({ amount: '', description: '' });

  const canCreate = permissions?.financials.includes('create');
  const canDelete = permissions?.financials.includes('delete');

  useEffect(() => {
    if (user?.teamId) fetchTransactions();
  }, [user]);

  async function fetchTransactions() {
    try {
      const { data } = await api.get(`/financials?teamId=${user!.teamId}`);
      setTransactions(data);
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    try {
      await api.post('/financials', { ...formData, teamId: user!.teamId });
      setShowModal(false);
      setFormData({ amount: '', description: '' });
      fetchTransactions();
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to create transaction');
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('Delete this transaction?')) return;
    try {
      await api.delete(`/financials/${id}?teamId=${user!.teamId}`);
      fetchTransactions();
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to delete transaction');
    }
  }

  if (loading) return <Layout><div className="loading">Loading...</div></Layout>;

  return (
    <Layout>
      <div className="page-header">
        <h1>Financials</h1>
        {canCreate && (
          <button onClick={() => setShowModal(true)} className="btn btn-primary">
            <Plus size={18} />
            New Transaction
          </button>
        )}</div>
        <div className="card">
    <table className="table">
      <thead>
        <tr>
          <th>Amount</th>
          <th>Description</th>
          <th>Date</th>
          {canDelete && <th>Actions</th>}
        </tr>
      </thead>
      <tbody>
        {transactions.map(txn => (
          <tr key={txn.id}>
            <td style={{ fontWeight: 600, fontSize: '1rem' }}>
              ${parseFloat(txn.amount).toLocaleString()}
            </td>
            <td>{txn.description}</td>
            <td style={{ color: 'var(--gray-400)', fontSize: '0.875rem' }}>
              {new Date(txn.createdAt).toLocaleDateString()}
            </td>
            {canDelete && (
              <td>
                <button onClick={() => handleDelete(txn.id)} className="btn btn-danger">
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
        <h2>New Transaction</h2>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Amount</label>
            <input
              type="number"
              step="0.01"
              value={formData.amount}
              onChange={e => setFormData({ ...formData, amount: e.target.value })}
              placeholder="1500.00"
              required
            />
          </div>
          <div className="form-group">
            <label>Description</label>
            <input
              value={formData.description}
              onChange={e => setFormData({ ...formData, description: e.target.value })}
              placeholder="Q1 Revenue"
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

