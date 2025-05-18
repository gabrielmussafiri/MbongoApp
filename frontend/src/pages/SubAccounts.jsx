import { useState, useEffect } from 'react';
import { PlusIcon, PencilIcon, TrashIcon } from '@heroicons/react/24/outline';
import { getSubAccounts, createSubAccount, updateSubAccount, deleteSubAccount, getAgents } from '../services/api';
import { useAuth } from '../context/AuthContext';

const SubAccounts = () => {
  const { user } = useAuth();
  const [subAccounts, setSubAccounts] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editSubAccount, setEditSubAccount] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    agentId: '',
    type: '',
    currency: '',
    balance: '',
  });
  const [agents, setAgents] = useState([]);

  useEffect(() => {
    const fetchSubAccounts = async () => {
      try {
        setLoading(true);
        const data = await getSubAccounts();
        setSubAccounts(data);
      } catch (error) {
        setError('Failed to load sub-accounts');
        console.error('Error fetching sub-accounts:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchSubAccounts();
  }, []);

  // Fetch agents when modal opens
  useEffect(() => {
    if (isModalOpen || isEditModalOpen) {
      getAgents().then(setAgents).catch(console.error);
    }
  }, [isModalOpen, isEditModalOpen]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      // Get the selected agent
      const selectedAgent = agents.find(a => String(a.id) === String(formData.agentId));
      if (!selectedAgent) {
        setError('Agent not found');
        return;
      }

      // Check if the user is an agent and trying to create a sub-account for another agent
      if (user?.role === 'AGENT' && String(user.agentId) !== String(formData.agentId)) {
        setError('You can only create sub-accounts for yourself');
        return;
      }

      // Set currency based on agent's country
      const currency = selectedAgent.country === 'DRC' ? 'USD' : 'ZAR';
      
      const payload = {
        ...formData,
        balance: parseFloat(formData.balance),
        currency // Automatically set currency based on agent's country
      };
      
      const newSubAccount = await createSubAccount(payload);
      
      // Fetch the updated sub-accounts list to ensure we have the latest data
      const updatedSubAccounts = await getSubAccounts();
      setSubAccounts(updatedSubAccounts);
      
      setIsModalOpen(false);
      setFormData({
        agentId: '',
        type: '',
        currency: '',
        balance: '',
      });
    } catch (error) {
      setError('Failed to create sub-account');
      console.error('Error creating sub-account:', error);
    }
  };

  const handleEdit = (account) => {
    setEditSubAccount(account);
    setFormData({
      agentId: account.agentId,
      type: account.type,
      currency: account.currency,
      balance: account.balance,
    });
    setIsEditModalOpen(true);
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        ...formData,
        balance: parseFloat(formData.balance),
      };
      const updated = await updateSubAccount(editSubAccount.id, payload);
      setSubAccounts(subAccounts.map(a => (a.id === editSubAccount.id ? updated : a)));
      setIsEditModalOpen(false);
      setEditSubAccount(null);
      setFormData({ agentId: '', type: '', currency: '', balance: '' });
    } catch (error) {
      setError('Failed to update sub-account');
      console.error('Error updating sub-account:', error);
    }
  };

  const handleDelete = async (account) => {
    if (!window.confirm(`Are you sure you want to delete sub-account ${account.type}?`)) return;
    try {
      await deleteSubAccount(account.id);
      setSubAccounts(subAccounts.filter(a => a.id !== account.id));
    } catch (error) {
      setError('Failed to delete sub-account');
      console.error('Error deleting sub-account:', error);
    }
  };

  const getAccountTypes = (agentId) => {
    if (agentId && agents.length) {
      const agent = agents.find(a => String(a.id) === String(agentId));
      if (agent?.country === 'DRC') {
        return ['MPSA', 'Airtel Money', 'Orange Money', 'Bank Account'];
      } else if (agent?.country === 'RSA') {
        return ['FNB', 'Standard Bank', 'Nedbank', 'ABSA'];
      }
    }
    return [];
  };

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
    <div className="space-y-6">
      {/* Only show admin UI to admins */}
      {user.role === 'ADMIN' && (
        <>
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-3xl font-extrabold text-neutral-900 tracking-tight">Sub-Accounts</h1>
            <button
              onClick={() => setIsModalOpen(true)}
              className="btn btn-primary flex items-center text-lg px-6 py-3 shadow-md"
            >
              <PlusIcon className="h-5 w-5 mr-2" />
              Add Sub-Account
            </button>
          </div>
          {/* Sub-Accounts List for admin */}
          <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {subAccounts.map((account) => {
              const agent = agents.find(a => String(a.id) === String(account.agentId));
              const currency = agent?.country === 'DRC' ? 'USD' : agent?.country === 'RSA' ? 'ZAR' : '';
              return (
                <div key={account.id} className="card hover:shadow-lg transition-shadow duration-200">
                  <div className="flex items-center justify-between mb-2">
                    <div>
                      <h3 className="text-xl font-bold text-neutral-900">{account.type}</h3>
                      <p className="text-sm text-neutral-500">Agent: {account.agent?.name || 'Unknown Agent'}</p>
                    </div>
                    <span className={`badge ${agent?.country === 'DRC' ? 'badge-primary' : 'badge-success'} text-base`}>
                      {agent?.country || 'Unknown'}
                    </span>
                  </div>
                  <div className="mb-4">
                    <div className="flex justify-between items-center">
                      <span className="text-xs font-medium text-neutral-500 uppercase tracking-wide">Balance</span>
                      <span className="text-lg font-semibold text-neutral-900">
                        {Number(account.balance).toLocaleString()} {currency}
                      </span>
                    </div>
                  </div>
                  {/* Admin actions: Edit and Delete */}
                  <div className="mt-4 flex space-x-2">
                    <button
                      className="btn btn-secondary btn-sm flex items-center"
                      onClick={() => handleEdit(account)}
                    >
                      <PencilIcon className="h-4 w-4 mr-1" /> Edit
                    </button>
                    <button
                      className="btn btn-danger btn-sm flex items-center"
                      onClick={() => handleDelete(account)}
                    >
                      <TrashIcon className="h-4 w-4 mr-1" /> Delete
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
          {/* Add Sub-Account Modal */}
          {isModalOpen && (
            <div className="modal-overlay fixed inset-0 bg-black/30 flex items-center justify-center z-50 transition-opacity duration-200 animate-fade-in">
              <div className="modal-content max-w-lg w-full bg-white rounded-xl shadow-2xl p-8 animate-scale-fade-in">
                <h2 className="text-xl font-bold text-neutral-900 mb-1">Add New Sub-Account</h2>
                <p className="text-neutral-500 mb-6">Create a new sub-account for an agent. Currency is set automatically based on the agent's country.</p>
                <form onSubmit={handleSubmit} className="space-y-5">
                  <div>
                    <label className="input-label">Agent</label>
                    <select
                      className="input"
                      value={formData.agentId}
                      onChange={e => setFormData({ ...formData, agentId: e.target.value, type: '' })}
                      required
                    >
                      <option value="">Select Agent</option>
                      {agents.map(agent => (
                        <option key={agent.id} value={agent.id}>{agent.name} ({agent.country})</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="input-label">Type</label>
                    <select
                      className="input"
                      value={formData.type}
                      onChange={e => setFormData({ ...formData, type: e.target.value })}
                      required
                      disabled={!formData.agentId}
                    >
                      <option value="">Select Type</option>
                      {getAccountTypes(formData.agentId).map(type => (
                        <option key={type} value={type}>{type}</option>
                        ))}
                    </select>
                  </div>
                  <div className="flex gap-4">
                    <div className="flex-1">
                      <label className="input-label">Initial Balance</label>
                    <input
                      type="number"
                      className="input"
                      value={formData.balance}
                        onChange={e => setFormData({ ...formData, balance: e.target.value })}
                        min="0"
                      required
                    />
                    </div>
                    <div className="flex-1">
                      <label className="input-label">Currency</label>
                      <input
                        type="text"
                        className="input bg-neutral-100 cursor-not-allowed"
                        value={(() => {
                          const agent = agents.find(a => String(a.id) === String(formData.agentId));
                          return agent ? (agent.country === 'DRC' ? 'USD' : agent.country === 'RSA' ? 'ZAR' : '') : '';
                        })()}
                        disabled
                      />
                      <span className="text-xs text-neutral-400">Currency is set automatically based on agent's country</span>
                    </div>
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
                      Add Sub-Account
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
          {/* Edit Sub-Account Modal */}
          {isEditModalOpen && (
            <div className="modal-overlay fixed inset-0 bg-black/30 flex items-center justify-center z-50 transition-opacity duration-200 animate-fade-in">
              <div className="modal-content max-w-lg w-full bg-white rounded-xl shadow-2xl p-8 animate-scale-fade-in">
                <h2 className="text-xl font-bold text-neutral-900 mb-1">Edit Sub-Account</h2>
                <form onSubmit={handleEditSubmit} className="space-y-5">
                  <div>
                    <label className="input-label">Type</label>
                    <select
                      className="input"
                      value={formData.type}
                      onChange={e => setFormData({ ...formData, type: e.target.value })}
                      required
                    >
                      <option value="">Select Type</option>
                      {getAccountTypes(formData.agentId).map(type => (
                        <option key={type} value={type}>{type}</option>
                        ))}
                    </select>
                  </div>
                  <div>
                    <label className="input-label">Balance</label>
                    <input
                      type="number"
                      className="input"
                      value={formData.balance}
                      onChange={e => setFormData({ ...formData, balance: e.target.value })}
                      required
                      min="0"
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
        </>
      )}
      {/* For agents, show only their sub-accounts */}
      {user.role === 'AGENT' && (
        <>
          <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {subAccounts.map((account) => {
              const currency = account.agent?.country === 'DRC' ? 'USD' : account.agent?.country === 'RSA' ? 'ZAR' : '';
              return (
                <div key={account.id} className="card hover:shadow-lg transition-shadow duration-200">
                  <div className="flex items-center justify-between mb-2">
                    <div>
                      <h3 className="text-xl font-bold text-neutral-900">{account.type}</h3>
                      <p className="text-sm text-neutral-500">Agent: {account.agent?.name || 'Unknown Agent'}</p>
                    </div>
                    <span className={`badge ${account.agent?.country === 'DRC' ? 'badge-primary' : 'badge-success'} text-base`}>
                      {account.agent?.country || 'Unknown'}
                    </span>
                  </div>
                  <div className="mb-4">
                    <div className="flex justify-between items-center">
                      <span className="text-xs font-medium text-neutral-500 uppercase tracking-wide">Balance</span>
                      <span className="text-lg font-semibold text-neutral-900">
                        {Number(account.balance).toLocaleString()} {currency}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
};

export default SubAccounts; 