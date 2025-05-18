import { useState, useEffect } from 'react';
import { PlusIcon, PencilIcon, TrashIcon } from '@heroicons/react/24/outline';
import { getAgents, createAgent, updateAgent, deleteAgent } from '../services/api';
import { useAuth } from '../context/AuthContext';

const Agents = () => {
  const { user } = useAuth();
  if (user?.role !== 'ADMIN') {
    return <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded">Access denied</div>;
  }

  const [agents, setAgents] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editAgent, setEditAgent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    name: '',
    country: '',
    contact: '',
    email: '',
    password: ''
  });
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('All');
  const [activeTab, setActiveTab] = useState('details');
  const [initialBalance, setInitialBalance] = useState(0);

  useEffect(() => {
    const fetchAgents = async () => {
      try {
        setLoading(true);
        const data = await getAgents();
        setAgents(data);
      } catch (error) {
        setError('Failed to load agents');
        console.error('Error fetching agents:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchAgents();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const newAgent = await createAgent(formData);
      setAgents([...agents, newAgent.agent]);
      setIsModalOpen(false);
      setFormData({
        name: '',
        country: '',
        contact: '',
        email: '',
        password: ''
      });
    } catch (error) {
      setError('Failed to create agent');
      console.error('Error creating agent:', error);
    }
  };

  const handleEdit = (agent) => {
    setEditAgent(agent);
    setFormData({
      name: agent.name,
      country: agent.country,
      contact: agent.contact,
      email: agent.email,
      password: ''
    });
    setIsEditModalOpen(true);
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    try {
      const updated = await updateAgent(editAgent.id, formData);
      setAgents(agents.map(a => (a.id === editAgent.id ? updated : a)));
      setIsEditModalOpen(false);
      setEditAgent(null);
      setFormData({ name: '', country: '', contact: '', email: '', password: '' });
    } catch (error) {
      setError('Failed to update agent');
      console.error('Error updating agent:', error);
    }
  };

  const handleDelete = async (agent) => {
    if (!window.confirm(`Are you sure you want to delete agent ${agent.name}?`)) return;
    try {
      await deleteAgent(agent.id);
      setAgents(agents.filter(a => a.id !== agent.id));
    } catch (error) {
      setError('Failed to delete agent');
      console.error('Error deleting agent:', error);
    }
  };

  // Filtering and searching
  const filteredAgents = agents.filter(agent => {
    const matchesSearch =
      agent.name.toLowerCase().includes(search.toLowerCase()) ||
      agent.email.toLowerCase().includes(search.toLowerCase()) ||
      agent.contact.toLowerCase().includes(search.toLowerCase());
    const matchesFilter =
      filter === 'All' || agent.country === filter;
    return matchesSearch && matchesFilter;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded">
        {error}
      </div>
    );
  }

  return (
    <div className="space-y-10">
      {/* Header */}
      <div className="mb-2">
        <h1 className="text-3xl font-extrabold text-neutral-900 tracking-tight">Agents</h1>
        <p className="text-neutral-500 text-base mt-1">Manage agents in DRC and South Africa.</p>
      </div>

      {/* Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-4">
        <button
          onClick={() => setIsModalOpen(true)}
          className="px-5 py-2 rounded-md bg-blue-600 text-white font-semibold shadow hover:bg-blue-700 transition-all flex items-center gap-2"
        >
          <PlusIcon className="h-5 w-5" /> Add Agent
        </button>
      </div>

      {/* All Agents Card */}
      <div className="bg-white border border-neutral-200 rounded-xl shadow-sm p-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2 mb-4">
          <div>
            <h2 className="text-xl font-bold text-neutral-900">All Agents</h2>
            <p className="text-neutral-500 text-sm">View and manage all agents in the system.</p>
          </div>
          <div className="flex gap-2 mt-2 md:mt-0">
            <input
              type="text"
              placeholder="Search agents..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="input w-56"
            />
            <select
              className="input w-40"
              value={filter}
              onChange={e => setFilter(e.target.value)}
            >
              <option value="All">All Countries</option>
              <option value="DRC">DRC</option>
              <option value="RSA">South Africa</option>
            </select>
            <button className="px-4 py-2 rounded-md bg-neutral-100 text-neutral-700 font-semibold border border-neutral-200 hover:bg-neutral-200 transition-all flex items-center gap-2">
              <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" /></svg>
              Export CSV
            </button>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-neutral-200">
            <thead className="bg-neutral-50">
              <tr>
                <th className="px-4 py-2 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">Name</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">Email</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">Country</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">Balance</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">Transactions</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-neutral-200">
              {filteredAgents.map((agent) => {
                const totalBalance = agent.subAccounts?.reduce((sum, account) => sum + account.balance, 0) || 0;
                const currency = agent.country === 'DRC' ? 'USD' : 'ZAR';
                return (
                  <tr key={agent.id}>
                    <td className="px-4 py-2 text-sm font-semibold text-neutral-900">{agent.name}</td>
                    <td className="px-4 py-2 text-sm text-neutral-900">{agent.email}</td>
                    <td className="px-4 py-2 text-sm">
                      <span className={`px-3 py-0.5 rounded-full text-xs font-semibold ${agent.country === 'DRC' ? 'bg-blue-100 text-blue-700' : 'bg-green-100 text-green-700'}`}>{agent.country === 'DRC' ? 'DRC' : 'South Africa'}</span>
                    </td>
                    <td className="px-4 py-2 text-sm text-neutral-900">{currency}{totalBalance.toLocaleString()}</td>
                    <td className="px-4 py-2 text-sm text-neutral-900">{agent.transactionsCount || 0}</td>
                    <td className="px-4 py-2 text-sm flex gap-2">
                      <button className="p-2 rounded-md bg-neutral-100 hover:bg-neutral-200 transition-all" title="Edit" onClick={() => handleEdit(agent)}>
                        <PencilIcon className="h-4 w-4 text-neutral-500" />
                      </button>
                      <button className="p-2 rounded-md bg-red-100 hover:bg-red-200 transition-all" title="Delete" onClick={() => handleDelete(agent)}>
                        <TrashIcon className="h-4 w-4 text-red-500" />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Agent Modal */}
      {isModalOpen && (
        <div className="modal-overlay fixed inset-0 bg-black/30 flex items-center justify-center z-50 transition-opacity duration-200 animate-fade-in">
          <div className="modal-content max-w-lg w-full bg-white rounded-xl shadow-2xl p-8 animate-scale-fade-in">
            <h2 className="text-xl font-bold text-neutral-900 mb-1">Add New Agent</h2>
            <p className="text-neutral-500 mb-6">Create a new agent account with specific permissions.</p>
            <div className="flex border-b border-neutral-200 mb-6">
              <button
                className={`flex-1 py-2 text-sm font-semibold ${activeTab === 'details' ? 'border-b-2 border-blue-600 text-blue-700 bg-neutral-50' : 'text-neutral-500'}`}
                onClick={() => setActiveTab('details')}
              >
                Agent Details
              </button>
              <button
                className={`flex-1 py-2 text-sm font-semibold ${activeTab === 'permissions' ? 'border-b-2 border-blue-600 text-blue-700 bg-neutral-50' : 'text-neutral-500'}`}
                onClick={() => setActiveTab('permissions')}
              >
                Permissions
              </button>
            </div>
            {activeTab === 'details' && (
              <form onSubmit={handleSubmit} className="space-y-5">
                <div>
                  <label className="input-label">Name</label>
                  <input
                    type="text"
                    className="input"
                    value={formData.name}
                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <label className="input-label">Email</label>
                  <input
                    type="email"
                    className="input"
                    value={formData.email}
                    onChange={e => setFormData({ ...formData, email: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <label className="input-label">Country</label>
                  <select
                    className="input"
                    value={formData.country}
                    onChange={e => setFormData({ ...formData, country: e.target.value })}
                    required
                  >
                    <option value="">Select Country</option>
                    <option value="DRC">DRC</option>
                    <option value="RSA">South Africa</option>
                  </select>
                </div>
                <div className="flex gap-4">
                  <div className="flex-1">
                    <label className="input-label">Initial Balance</label>
                    <input
                      type="number"
                      className="input"
                      value={initialBalance}
                      onChange={e => setInitialBalance(e.target.value)}
                      min="0"
                    />
                  </div>
                  <div className="flex-1">
                    <label className="input-label">Currency</label>
                    <input
                      type="text"
                      className="input bg-neutral-100 cursor-not-allowed"
                      value={formData.country === 'DRC' ? 'USD' : formData.country === 'RSA' ? 'ZAR' : ''}
                      disabled
                    />
                    <span className="text-xs text-neutral-400">Currency is set automatically based on country</span>
                  </div>
                </div>
                <div>
                  <label className="input-label">Default Password</label>
                  <input
                    type="text"
                    className="input bg-neutral-100 cursor-not-allowed"
                    value="password"
                    disabled
                  />
                  <span className="text-xs text-neutral-400">Default password is set to "password". Agent should change it after first login.</span>
                </div>
                <div className="flex justify-end gap-2">
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={() => setIsModalOpen(false)}
                  >
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-primary">
                    Add Agent
                  </button>
                </div>
              </form>
            )}
            {activeTab === 'permissions' && (
              <div className="py-8 text-center text-neutral-400 text-sm">Permissions tab coming soon.</div>
            )}
          </div>
        </div>
      )}

      {/* Edit Agent Modal */}
      {isEditModalOpen && (
        <div className="modal-overlay fixed inset-0 bg-black/30 flex items-center justify-center z-50 transition-opacity duration-200 animate-fade-in">
          <div className="modal-content max-w-lg w-full bg-white rounded-xl shadow-2xl p-8 animate-scale-fade-in">
            <h2 className="text-2xl font-bold text-neutral-900 mb-6">Edit Agent</h2>
            <form onSubmit={handleEditSubmit} className="space-y-5">
              <div>
                <label className="input-label">Name</label>
                <input
                  type="text"
                  className="input"
                  value={formData.name}
                  onChange={e => setFormData({ ...formData, name: e.target.value })}
                  required
                />
              </div>
              <div>
                <label className="input-label">Country</label>
                <select
                  className="input"
                  value={formData.country}
                  onChange={e => setFormData({ ...formData, country: e.target.value })}
                  required
                >
                  <option value="">Select Country</option>
                  <option value="DRC">DRC</option>
                  <option value="RSA">South Africa</option>
                </select>
              </div>
              <div>
                <label className="input-label">Contact</label>
                <input
                  type="text"
                  className="input"
                  value={formData.contact}
                  onChange={e => setFormData({ ...formData, contact: e.target.value })}
                  required
                />
              </div>
              <div>
                <label className="input-label">Email</label>
                <input
                  type="email"
                  className="input"
                  value={formData.email}
                  onChange={e => setFormData({ ...formData, email: e.target.value })}
                  required
                />
              </div>
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setIsEditModalOpen(false)}
                >
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Agents; 