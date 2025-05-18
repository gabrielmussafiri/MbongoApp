import React, { useState, useEffect } from 'react';
import { PlusIcon, PencilIcon } from '@heroicons/react/24/outline';
import { getTransactions, createTransactionRequest, getSubAccounts, getAgents } from '../services/api';
import { useAuth } from '../context/AuthContext';

const Transactions = () => {
  const { user } = useAuth();
  const [transactions, setTransactions] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [agents, setAgents] = useState([]);
  const [subAccounts, setSubAccounts] = useState([]);
  const [formData, setFormData] = useState({
    amount: '',
    currency: '',
    type: 'INPUT',
    sourceAccountId: '',
    destAccountId: '',
    sender: '',
    receiver: '',
    description: '',
    proofFile: null,
    agentId: ''
  });
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');
  const [success, setSuccess] = useState('');
  const [recentTransactions, setRecentTransactions] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [transactionsData, agentsData, subAccountsData] = await Promise.all([
          getTransactions(),
          getAgents(),
          getSubAccounts()
        ]);
        setTransactions(transactionsData);
        setAgents(agentsData);
        setSubAccounts(subAccountsData);
        // Sort and set recent transactions (top 5 by createdAt desc)
        const sorted = [...transactionsData].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        setRecentTransactions(sorted.slice(0, 5));
      } catch (error) {
        setError('Failed to load data');
        console.error('Error fetching data:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setFormData(prev => ({ ...prev, proofFile: file }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    // Frontend validation for required fields
    if (!formData.amount || !formData.currency || !formData.sourceAccountId || !formData.agentId || !formData.sender || !formData.description) {
      setError('Please fill in all required fields: Amount, Currency, Sub Account, Agent, Sender, and Description.');
      return;
    }
    try {
      const payload = {
        amount: formData.amount,
        currency: formData.currency,
        sourceAccountId: formData.sourceAccountId,
        destAgentId: formData.agentId, // The selected agent is the destination
        sender: formData.sender,
        receiver: formData.receiver,
        description: formData.description
      };
      console.log('Submitting transaction request payload:', payload);
      await createTransactionRequest(payload);
      setIsModalOpen(false);
      setFormData({
        amount: '',
        currency: '',
        type: 'INPUT',
        sourceAccountId: '',
        destAccountId: '',
        sender: '',
        receiver: '',
        description: '',
        proofFile: null,
        agentId: ''
      });
      setSuccess('Transaction request created successfully! It will appear in Pending Transactions for approval.');
    } catch (error) {
      setError('Failed to create transaction request: ' + (error.response?.data?.message || error.message));
      console.error('Error creating transaction request:', error);
    }
  };

  // Filtering and searching
  let filteredTransactions = transactions.filter(tx => {
    const matchesSearch =
      (tx.id && tx.id.toLowerCase().includes(search.toLowerCase())) ||
      (tx.sender && tx.sender.toLowerCase().includes(search.toLowerCase())) ||
      (tx.description && tx.description.toLowerCase().includes(search.toLowerCase()));
    const matchesType =
      typeFilter === 'All' || tx.type === typeFilter;
    const matchesStatus =
      statusFilter === 'All' || tx.status === statusFilter;
    return matchesSearch && matchesType && matchesStatus;
  });
  // Sort by createdAt descending (most recent first)
  filteredTransactions = filteredTransactions.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

  // Get available currencies based on user role and agent type
  const getAvailableCurrencies = () => {
    if (user.role === 'ADMIN') return ['USD', 'ZAR'];
    const agent = agents.find(a => a.id === user.agentId);
    if (!agent) return [];
    return agent.country === 'DRC' ? ['USD'] : ['ZAR'];
  };

  // Get available sub-accounts based on currency
  const getAvailableSubAccounts = (currency) => {
    return subAccounts.filter(account => account.currency === currency);
  };

  // Get available agents based on user role
  const getAvailableAgents = () => {
    if (user.role === 'ADMIN') {
      return agents;
    }
    // For agents, they can only select themselves
    return agents.filter(agent => agent.id === user.agentId);
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
      {/* Only show filters and table to admins */}
      {user.role === 'ADMIN' && (
        <>
          {/* Recent Transactions Card */}
          <div className="bg-white border border-blue-100 rounded-xl shadow-sm p-6 mb-2">
            <h2 className="text-xl font-bold text-blue-900 mb-4">Recent Transactions</h2>
            <ul className="divide-y divide-neutral-100">
              {recentTransactions.length === 0 && (
                <li className="py-2 text-neutral-400">No recent transactions.</li>
              )}
              {recentTransactions.map((tx) => (
                <li key={tx.id} className="flex items-center justify-between py-2">
                  <div className="flex items-center gap-2">
                    <span className={`w-3 h-3 rounded-full inline-block ${tx.status === 'COMPLETED' ? 'bg-green-400' : tx.status === 'PENDING' ? 'bg-yellow-400' : tx.status === 'DECLINED' ? 'bg-red-400' : 'bg-gray-300'}`}></span>
                    <span className="text-sm text-blue-600 font-semibold">{tx.sender}</span>
                    <span className="text-sm text-neutral-500 font-semibold">→ {tx.sourceAccount?.name || tx.sourceAccount?.type || '-'}</span>
                    <span className="text-xs text-neutral-400 ml-2">{new Date(tx.createdAt).toLocaleDateString()}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${tx.status === 'COMPLETED' ? 'bg-green-100 text-green-700' : tx.status === 'PENDING' ? 'bg-yellow-100 text-yellow-700' : tx.status === 'DECLINED' ? 'bg-red-100 text-red-700' : 'bg-gray-100 text-gray-700'}`}>{tx.status}</span>
                    <span className="font-semibold text-neutral-900 text-sm">${tx.amount}</span>
                  </div>
                </li>
              ))}
            </ul>
          </div>
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
            <h1 className="text-3xl font-extrabold text-neutral-900 tracking-tight">Transactions</h1>
            <div className="flex gap-2">
              <input
                type="text"
                className="input"
                placeholder="Search by ID, sender, or description"
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
              <select
                className="input"
                value={typeFilter}
                onChange={e => setTypeFilter(e.target.value)}
              >
                <option value="All">All Types</option>
                <option value="INPUT">Input</option>
                <option value="REQUEST">Request</option>
                <option value="OUTPUT">Output</option>
              </select>
              <select
                className="input"
                value={statusFilter}
                onChange={e => setStatusFilter(e.target.value)}
              >
                <option value="All">All Statuses</option>
                <option value="COMPLETED">Completed</option>
                <option value="PENDING">Pending</option>
                <option value="DECLINED">Declined</option>
                <option value="FAILED">Failed</option>
              </select>
            </div>
      </div>

          {/* All Transactions Card */}
          <div className="bg-white border border-neutral-200 rounded-xl shadow-sm p-6">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2 mb-4">
              <div>
                <h2 className="text-xl font-bold text-neutral-900">All Transactions</h2>
                <p className="text-neutral-500 text-sm">View and manage all transactions in the system.</p>
              </div>
              <div className="flex gap-2 mt-2 md:mt-0">
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
                    <th className="px-4 py-2 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">Sender</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">Receiver</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">Sub Account</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">Agent</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">Amount</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">Status</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">Created</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-neutral-200">
                  {filteredTransactions.map((tx) => (
                    <tr key={tx.id}>
                      <td className="px-4 py-2 text-sm text-neutral-900">
                        {tx.sender} <span className="block text-xs text-neutral-400">{tx.senderCountry}</span>
                      </td>
                      <td className="px-4 py-2 text-sm text-neutral-900">
                        {/* Dynamic Receiver: Agent name for INPUT, client for REQUEST */}
                        {tx.type === 'INPUT'
                          ? (tx.sourceAccount?.agent?.name || '-')
                          : (tx.receiver || '-')}
                        <span className="block text-xs text-neutral-400">{tx.receiverCountry}</span>
                      </td>
                      <td className="px-4 py-2 text-sm text-neutral-900">
                        {tx.sourceAccount?.name || tx.sourceAccount?.type || '-'}
                      </td>
                      <td className="px-4 py-2 text-sm text-neutral-900">
                        {tx.sourceAccount?.agent?.name || '-'}
                      </td>
                      <td className="px-4 py-2 text-sm text-neutral-900">${tx.amount}</td>
                      <td className="px-4 py-2 text-sm">
                        <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${tx.status === 'completed' ? 'bg-green-100 text-green-700' : tx.status === 'pending' ? 'bg-yellow-100 text-yellow-700' : tx.status === 'borrowed' ? 'bg-purple-100 text-purple-700' : 'bg-red-100 text-red-700'}`}>{tx.status}</span>
                      </td>
                      <td className="px-4 py-2 text-sm text-neutral-500">{new Date(tx.createdAt).toLocaleDateString()}</td>
                      <td className="px-4 py-2 text-sm flex gap-2">
                        <button className="p-2 rounded-md bg-neutral-100 hover:bg-neutral-200 transition-all" title="Edit">
                          <PencilIcon className="h-4 w-4 text-neutral-500" />
                        </button>
                        <button className="px-3 py-1 rounded-md bg-neutral-100 text-neutral-700 font-semibold border border-neutral-200 hover:bg-neutral-200 transition-all text-xs">Receipt</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
      {/* For agents, show only their recent transactions and table */}
      {user.role === 'AGENT' && (
        <>
          {/* Recent Transactions for agent */}
          <div className="bg-white border border-blue-100 rounded-xl shadow-sm p-6 mb-2">
            <h2 className="text-xl font-bold text-blue-900 mb-4">Your Recent Transactions</h2>
            <ul className="divide-y divide-neutral-100">
              {recentTransactions.length === 0 && (
                <li className="py-2 text-neutral-400">No recent transactions.</li>
              )}
              {recentTransactions.map((tx) => (
                <li key={tx.id} className="flex items-center justify-between py-2">
                  <div className="flex items-center gap-2">
                    <span className={`w-3 h-3 rounded-full inline-block ${tx.status === 'COMPLETED' ? 'bg-green-400' : tx.status === 'PENDING' ? 'bg-yellow-400' : tx.status === 'DECLINED' ? 'bg-red-400' : 'bg-gray-300'}`}></span>
                    <span className="text-sm text-blue-600 font-semibold">{tx.sender}</span>
                    <span className="text-sm text-neutral-500 font-semibold">→ {tx.sourceAccount?.name || tx.sourceAccount?.type || '-'}</span>
                    <span className="text-xs text-neutral-400 ml-2">{new Date(tx.createdAt).toLocaleDateString()}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${tx.status === 'COMPLETED' ? 'bg-green-100 text-green-700' : tx.status === 'PENDING' ? 'bg-yellow-100 text-yellow-700' : tx.status === 'DECLINED' ? 'bg-red-100 text-red-700' : 'bg-gray-100 text-gray-700'}`}>{tx.status}</span>
                    <span className="font-semibold text-neutral-900 text-sm">${tx.amount}</span>
                  </div>
                </li>
              ))}
            </ul>
          </div>
          {/* Agent's transactions table (reuse the table, but only for their data) */}
          {/* ...existing table code, but only for agent's data... */}
        </>
      )}
      {/* New Transaction Modal */}
      {isModalOpen && (
        <div className="modal-overlay fixed inset-0 bg-black/30 flex items-center justify-center z-50 transition-opacity duration-200 animate-fade-in">
          <div className="modal-content max-w-lg w-full bg-white rounded-xl shadow-2xl p-8 animate-scale-fade-in">
            <h2 className="text-2xl font-bold text-neutral-900 mb-6">New Transaction</h2>
            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="input-label">Agent</label>
                <select
                  className="input"
                  value={formData.agentId}
                  onChange={e => {
                    const selectedAgent = agents.find(a => a.id === e.target.value);
                    setFormData({ 
                      ...formData, 
                      agentId: e.target.value,
                      currency: selectedAgent?.country === 'DRC' ? 'USD' : 'ZAR',
                      sourceAccountId: '' // Reset source account when agent changes
                    });
                  }}
                  required
                >
                  <option value="">Select an agent</option>
                  {getAvailableAgents().map(agent => (
                    <option key={agent.id} value={agent.id}>
                      {agent.name} ({agent.country})
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="input-label">Sender</label>
                <input
                  type="text"
                  className="input"
                  value={formData.sender}
                  onChange={e => setFormData({ ...formData, sender: e.target.value })}
                  required
                  placeholder="Enter sender's name"
                />
              </div>
              <div>
                <label className="input-label">Receiver</label>
                <input
                  type="text"
                  className="input"
                  value={formData.receiver}
                  onChange={e => setFormData({ ...formData, receiver: e.target.value })}
                  required
                  placeholder="Enter receiver's name"
                />
              </div>
              <div>
                <label className="input-label">Amount</label>
                <input
                  type="number"
                  className="input"
                  value={formData.amount}
                  onChange={e => setFormData({ ...formData, amount: e.target.value })}
                  required
                  min="0"
                  step="0.01"
                />
              </div>
              <div>
                <label className="input-label">Currency</label>
                <select
                  className="input"
                  value={formData.currency}
                  onChange={e => {
                    setFormData({ 
                      ...formData, 
                      currency: e.target.value,
                      sourceAccountId: '' // Reset source account when currency changes
                    });
                  }}
                  required
                  disabled={formData.agentId !== ''} // Disable if agent is selected
                >
                  <option value="">Select currency</option>
                  {getAvailableCurrencies().map(currency => (
                    <option key={currency} value={currency}>{currency}</option>
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
                >
                  <option value="INPUT">Input</option>
                  <option value="OUTPUT">Output</option>
                </select>
              </div>
              <div>
                <label className="input-label">Sub Account</label>
                <select
                  className="input"
                  value={formData.sourceAccountId}
                  onChange={e => setFormData({ ...formData, sourceAccountId: e.target.value })}
                  required
                >
                  <option value="">Select sub account</option>
                  {getAvailableSubAccounts(formData.currency).map(account => (
                    <option key={account.id} value={account.id}>
                      {account.type} - {account.currency} ({account.balance})
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="input-label">Description</label>
                <textarea
                  className="input"
                  value={formData.description}
                  onChange={e => setFormData({ ...formData, description: e.target.value })}
                  rows={3}
                  placeholder="Enter transaction description"
                />
              </div>
              <div>
                <label className="input-label">Proof Document/Image</label>
                <input
                  type="file"
                  className="input"
                  onChange={handleFileChange}
                  accept=".pdf,.jpg,.jpeg,.png"
                />
                <p className="text-sm text-neutral-500 mt-1">Accepted formats: PDF, JPG, PNG</p>
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
            Create Transaction
          </button>
      </div>
            </form>
          </div>
          </div>
        )}
    </div>
  );
};

export default Transactions; 