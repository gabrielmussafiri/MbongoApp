import { useState, useEffect } from 'react';
import {
  UserGroupIcon,
  CurrencyDollarIcon,
  ArrowUpIcon,
  ArrowDownIcon,
} from '@heroicons/react/24/outline';
import { 
  getDashboardStats, 
  getRecentTransactions, 
  getAgents, 
  getSubAccounts,
  createTransaction,
  createTransactionRequest
} from '../services/api';
import { useAuth } from '../context/AuthContext';

const Dashboard = () => {
  // Log user from localStorage for debugging
  try {
    const localUser = localStorage.getItem('user');
    console.log('USER FROM LOCALSTORAGE:', localUser);
  } catch (e) {
    console.log('Could not read user from localStorage:', e);
  }

  const { user } = useAuth();
  console.log('USER FROM useAuth:', user);
  const [stats, setStats] = useState({
    totalAgents: 0,
    totalTransactions: 0,
    pendingTransactions: 0,
    pendingBorrowRequests: 0,
    drcAgents: 0,
    saAgents: 0,
    drcPending: 0,
    saPending: 0,
    drcBalance: 0,
    saBalance: 0,
    recentActivity: [],
    transactionStatus: { completed: 0, pending: 0, borrowed: 0, failed: 0 },
  });
  const [recentTransactions, setRecentTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // New state variables for modals and forms
  const [showRecordModal, setShowRecordModal] = useState(false);
  const [showRequestModal, setShowRequestModal] = useState(false);
  const [recordForm, setRecordForm] = useState({
    origin: '',
    subAccountId: '',
    amount: '',
    currency: '',
    proofFile: null,
  });
  const [requestForm, setRequestForm] = useState({
    sender: '',
    receiver: '',
    amount: '',
    currency: '',
    sourceSubAccountId: '',
    destAgentId: '',
    description: '',
    proofFile: null,
  });
  const [formError, setFormError] = useState('');
  const [formSuccess, setFormSuccess] = useState('');
  const [subAccounts, setSubAccounts] = useState([]);
  const [agents, setAgents] = useState([]);
  const [currentAgent, setCurrentAgent] = useState(null);
  const [validationCode, setValidationCode] = useState('');

  console.log('DASHBOARD RENDERED, user:', user);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        const [statsData, transactionsData] = await Promise.all([
          getDashboardStats(),
          getRecentTransactions(),
        ]);
        setStats(statsData);
        setRecentTransactions(transactionsData);
      } catch (error) {
        setError('Failed to load dashboard data');
        console.error('Error fetching dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchDashboardData();
  }, []);

  // New useEffect for fetching dropdown data
  useEffect(() => {
    const fetchDropdownData = async () => {
      try {
        // Get all agents and sub-accounts
        const [agentsData, subAccountsData] = await Promise.all([
          getAgents(),
          getSubAccounts()
        ]);
        
        // Filter sub-accounts for the current agent
        const agentSubAccounts = subAccountsData.filter(sa => sa.agentId === user.agentId);
        
        setAgents(agentsData);
        setSubAccounts(agentSubAccounts);
        
        // Set current agent
        const currentAgent = agentsData.find(a => a.id === user.agentId);
        setCurrentAgent(currentAgent);
        
        console.log('Current Agent:', currentAgent);
        console.log('Sub Accounts:', agentSubAccounts);
      } catch (err) {
        console.error('Error fetching dropdown data:', err);
      }
    };
    fetchDropdownData();
  }, [user.agentId]);

  // Add debug log when request modal opens
  useEffect(() => {
    if (showRequestModal) {
      console.log('Logged in user:', user);
    }
  }, [showRequestModal, user]);

  // Helper: group transactions by day for the last 14 days
  const getVolumeByDay = (transactions) => {
    const days = [];
    const today = new Date();
    for (let i = 13; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(today.getDate() - i);
      days.push({
        date: d.toISOString().slice(0, 10),
        count: 0
      });
    }
    transactions.forEach(tx => {
      const txDate = new Date(tx.createdAt).toISOString().slice(0, 10);
      const day = days.find(d => d.date === txDate);
      if (day) day.count++;
    });
    return days;
  };

  const volumeData = getVolumeByDay(recentTransactions);
  const maxVolume = Math.max(...volumeData.map(d => d.count), 1);

  useEffect(() => {
    console.log('Logged in user:', user);
  }, [user]);

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

  // Defensive fallback for transactionStatus
  const transactionStatus = stats.transactionStatus || { completed: 0, pending: 0, borrowed: 0, failed: 0 };

  // Pie chart data for Transaction Status
  const pieData = [
    { label: 'Completed', value: transactionStatus.completed, color: '#22c55e' },
    { label: 'Pending', value: transactionStatus.pending, color: '#eab308' },
    { label: 'Top Up', value: transactionStatus.borrowed, color: '#6366f1' },
    { label: 'Failed', value: transactionStatus.failed, color: '#ef4444' },
  ];
  const totalPie = pieData.reduce((sum, d) => sum + d.value, 0) || 1;

  return (
    <div className="space-y-10">
      {/* Info message for agents */}
      {user.role === 'AGENT' && (
        <div className="bg-blue-50 border border-blue-200 text-blue-800 px-4 py-3 rounded flex items-center gap-2">
          <svg className="h-5 w-5 text-blue-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M12 20a8 8 0 100-16 8 8 0 000 16z" /></svg>
          <span>Welcome back, {user.name || user.email || 'Agent'}!</span>
        </div>
      )}

      {/* Header */}
      <div className="mb-2">
        <h1 className="text-3xl font-extrabold text-neutral-900 tracking-tight">Dashboard</h1>
        <p className="text-neutral-500 text-base mt-1">Overview of your remittance operations between DRC and South Africa.</p>
      </div>

      {/* Only show stat cards, transaction status, DRC/SA summary, etc. to admins */}
      {user.role === 'ADMIN' && (
        <>
          {/* Action Buttons */}
          <div className="flex gap-4 mb-4">
            <button
              className="px-4 py-2 rounded-md bg-blue-600 text-white font-semibold hover:bg-blue-700 transition-all"
              onClick={() => setShowRecordModal(true)}
            >
              + Record Transaction
            </button>
            <button
              className="px-4 py-2 rounded-md bg-green-600 text-white font-semibold hover:bg-green-700 transition-all"
              onClick={() => setShowRequestModal(true)}
            >
              + Create Transaction Request
            </button>
          </div>
          {/* Stat Cards */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
            <div className="bg-gradient-to-br from-blue-50 to-blue-100 border border-blue-200 rounded-xl shadow p-6 flex flex-col gap-1">
              <span className="text-xs text-blue-700 uppercase font-semibold">Total Transactions</span>
              <span className="text-3xl font-extrabold text-blue-900">{stats.totalTransactions}</span>
              <span className="text-xs text-blue-500">{stats.transactionStatus?.completed || 0} completed</span>
            </div>
            <div className="bg-gradient-to-br from-yellow-50 to-yellow-100 border border-yellow-200 rounded-xl shadow p-6 flex flex-col gap-1">
              <span className="text-xs text-yellow-700 uppercase font-semibold">Pending Transactions</span>
              <span className="text-3xl font-extrabold text-yellow-900">{stats.pendingTransactions}</span>
              <span className="text-xs text-yellow-500">{stats.transactionStatus?.pending || 0} pending</span>
            </div>
            <div className="bg-gradient-to-br from-green-50 to-green-100 border border-green-200 rounded-xl shadow p-6 flex flex-col gap-1">
              <span className="text-xs text-green-700 uppercase font-semibold">Total Agents</span>
              <span className="text-3xl font-extrabold text-green-900">{stats.totalAgents}</span>
              <span className="text-xs text-green-500">{stats.drcAgents ?? 0} in DRC, {stats.saAgents ?? 0} in SA</span>
            </div>
            <div className="bg-gradient-to-br from-purple-50 to-purple-100 border border-purple-200 rounded-xl shadow p-6 flex flex-col gap-1">
              <span className="text-xs text-purple-700 uppercase font-semibold">Pending Top Up Request</span>
              <span className="text-3xl font-extrabold text-purple-900">0</span>
              <span className="text-xs text-purple-500">0 Top Up</span>
            </div>
          </div>

          {/* Currency Converter */}
          <div className="bg-white border border-neutral-200 rounded-xl shadow-sm p-6">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-4 gap-2">
              <div>
                <h2 className="text-lg font-bold text-neutral-900">Currency Converter</h2>
                <p className="text-neutral-500 text-sm">Convert between USD and ZAR for accurate remittance calculations</p>
              </div>
              <div className="flex gap-2">
                <button className="px-4 py-2 rounded-md bg-neutral-100 text-neutral-700 font-medium">Overview</button>
                <button className="px-4 py-2 rounded-md bg-neutral-50 text-neutral-500 font-medium">Analytics</button>
        </div>
            </div>
            {/* Example converter UI, replace with your actual converter logic if needed */}
            <form className="flex flex-col md:flex-row gap-4 items-end">
              <div className="flex-1">
                <label className="block text-sm font-medium text-neutral-700 mb-1">Amount</label>
                <input type="number" className="input w-full" placeholder="100" />
              </div>
              <div className="flex-1">
                <label className="block text-sm font-medium text-neutral-700 mb-1">From</label>
                <select className="input w-full">
                  <option>USD - US Dollar</option>
                </select>
              </div>
              <div className="flex-1">
                <label className="block text-sm font-medium text-neutral-700 mb-1">To</label>
                <select className="input w-full">
                  <option>ZAR - South African Rand</option>
                </select>
              </div>
              <button type="button" className="px-4 py-2 rounded-md bg-blue-600 text-white font-semibold hover:bg-blue-700 transition-all">Convert</button>
            </form>
            <div className="mt-4 bg-neutral-50 rounded-lg p-6 text-center">
              <div className="text-xs text-neutral-500 mb-1">Converted Amount</div>
              <div className="text-2xl font-bold text-blue-700">R 1,850</div>
              <div className="text-xs text-neutral-400">$1 = R18.5000</div>
            </div>
            <div className="text-xs text-neutral-400 mt-2">Last updated: 5/14/2025, 7:05:17 PM</div>
          </div>

          {/* Main Content Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Recent Transactions */}
            <div className="bg-white border border-neutral-200 rounded-xl shadow-sm p-6">
              <h2 className="text-lg font-bold text-neutral-900 mb-4">Recent Transactions</h2>
              <ul className="space-y-3">
                {recentTransactions.map((tx, idx) => (
                  <li key={tx.id || idx} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className={`w-3 h-3 rounded-full inline-block ${tx.status === 'completed' ? 'bg-green-400' : tx.status === 'pending' ? 'bg-yellow-400' : tx.status === 'borrowed' ? 'bg-indigo-400' : 'bg-red-400'}`}></span>
                      <span className="text-sm text-neutral-700 font-medium">{tx.from} → {tx.to}</span>
                      <span className="text-xs text-blue-600 font-semibold ml-2">{tx.sender || '-'}</span>
                      <span className="text-xs text-neutral-400 ml-2">{new Date(tx.createdAt).toLocaleDateString()}</span>
                      <span className="text-xs text-neutral-500 ml-2">{tx.sourceAccount?.name || tx.sourceAccount?.type || '-'}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${tx.status === 'completed' ? 'bg-green-100 text-green-700' : tx.status === 'pending' ? 'bg-yellow-100 text-yellow-700' : tx.status === 'borrowed' ? 'bg-indigo-100 text-indigo-700' : 'bg-red-100 text-red-700'}`}>{tx.status}</span>
                      <span className="font-semibold text-neutral-900 text-sm">${tx.amount}</span>
        </div>
                  </li>
                ))}
              </ul>
            </div>
            {/* Transaction Status Pie Chart */}
            <div className="bg-white border border-neutral-200 rounded-xl shadow-sm p-6 flex flex-col">
              <h2 className="text-lg font-bold text-neutral-900 mb-4">Transaction Status</h2>
              <div className="flex-1 flex flex-col items-center justify-center">
                {/* SVG Pie Chart */}
                <svg width="160" height="160" viewBox="0 0 32 32" className="mb-4">
                  {(() => {
                    let acc = 0;
                    return pieData.map((slice, i) => {
                      const val = (slice.value / totalPie) * 100;
                      const x = 16 + 16 * Math.cos(2 * Math.PI * acc / 100);
                      const y = 16 + 16 * Math.sin(2 * Math.PI * acc / 100);
                      acc += val;
                      const x2 = 16 + 16 * Math.cos(2 * Math.PI * acc / 100);
                      const y2 = 16 + 16 * Math.sin(2 * Math.PI * acc / 100);
                      const largeArc = val > 50 ? 1 : 0;
                      return (
                        <path
                          key={slice.label}
                          d={`M16,16 L${x},${y} A16,16 0 ${largeArc} 1 ${x2},${y2} Z`}
                          fill={slice.color}
                          stroke="#fff"
                          strokeWidth="0.5"
                        />
                      );
                    });
                  })()}
                </svg>
                <div className="flex flex-wrap gap-4 justify-center mt-2">
                  {pieData.map((slice) => (
                    <div key={slice.label} className="flex items-center gap-2 text-xs font-semibold">
                      <span className="w-3 h-3 rounded-full inline-block" style={{ background: slice.color }}></span>
                      <span className="text-neutral-700">{slice.label}</span>
                      <span className="text-neutral-500">{slice.value}</span>
                      <span className="text-neutral-400">({((slice.value / totalPie) * 100).toFixed(0)}%)</span>
                    </div>
                  ))}
                </div>
                {/* Modern Bar Graph for Transaction Status */}
                <div className="w-full mt-8">
                  <div className="flex justify-between mb-2 px-2">
                    {pieData.map(slice => (
                      <span key={slice.label} className="text-xs font-semibold text-neutral-700">{slice.label}</span>
                    ))}
                  </div>
                  <div className="flex items-end gap-4 h-24 px-2">
                    {pieData.map(slice => (
                      <div key={slice.label} className="flex flex-col items-center w-1/5">
                        <div
                          className="rounded-t-lg"
                          style={{
                            height: `${Math.max((slice.value / (Math.max(...pieData.map(d => d.value), 1))) * 80, 8)}px`,
                            width: '24px',
                            background: slice.color,
                            boxShadow: '0 2px 8px 0 rgba(0,0,0,0.07)'
                          }}
                        ></div>
                        <span className="text-xs text-neutral-700 mt-1 font-bold">{slice.value}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Transaction Analytics: Line Chart */}
          <div className="bg-white border border-neutral-200 rounded-xl shadow-sm p-6 flex flex-col mt-8">
            <h2 className="text-lg font-bold text-neutral-900 mb-4">Transaction Volume (Last 14 Days)</h2>
            <svg width="100%" height="120" viewBox="0 0 420 120" className="w-full h-32">
              {/* Line Path */}
              <polyline
                fill="none"
                stroke="#6366f1"
                strokeWidth="3"
                points={volumeData.map((d, i) => `${30 * i + 20},${110 - (d.count / maxVolume) * 90}`).join(' ')}
              />
              {/* Dots */}
              {volumeData.map((d, i) => (
                <circle
                  key={d.date}
                  cx={30 * i + 20}
                  cy={110 - (d.count / maxVolume) * 90}
                  r="4"
                  fill="#6366f1"
                  stroke="#fff"
                  strokeWidth="2"
                />
              ))}
              {/* X Axis Labels */}
              {volumeData.map((d, i) => (
                <text
                  key={d.date}
                  x={30 * i + 20}
                  y={118}
                  fontSize="10"
                  textAnchor="middle"
                  fill="#888"
                >
                  {new Date(d.date).getDate()}
                </text>
              ))}
              {/* Y Axis Labels */}
              {[0, maxVolume].map((v, i) => (
                <text
                  key={v}
                  x={0}
                  y={110 - (v / maxVolume) * 90}
                  fontSize="10"
                  textAnchor="end"
                  fill="#888"
                >
                  {v}
                </text>
              ))}
            </svg>
            <div className="flex justify-between text-xs text-neutral-400 mt-2">
              <span>Oldest</span>
              <span>Today</span>
          </div>
        </div>

          {/* DRC & SA Summary */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="bg-white border border-neutral-200 rounded-xl shadow-sm p-6">
              <h3 className="text-lg font-bold text-neutral-900 mb-2">DRC Summary</h3>
              <div className="flex items-center gap-8">
                <div>
                  <div className="text-xs text-neutral-500 uppercase font-semibold">Total Agents</div>
                  <div className="text-xl font-bold text-neutral-900">{stats.drcAgents}</div>
                </div>
                <div>
                  <div className="text-xs text-neutral-500 uppercase font-semibold">Total Balance</div>
                  <div className="text-xl font-bold text-neutral-900">${stats.drcBalance}</div>
                </div>
                <div>
                  <div className="text-xs text-neutral-500 uppercase font-semibold">Pending Transactions</div>
                  <div className="text-xl font-bold text-neutral-900">{stats.drcPending}</div>
                </div>
              </div>
            </div>
            <div className="bg-white border border-neutral-200 rounded-xl shadow-sm p-6">
              <h3 className="text-lg font-bold text-neutral-900 mb-2">South Africa Summary</h3>
              <div className="flex items-center gap-8">
                <div>
                  <div className="text-xs text-neutral-500 uppercase font-semibold">Total Agents</div>
                  <div className="text-xl font-bold text-neutral-900">{stats.saAgents}</div>
                </div>
                <div>
                  <div className="text-xs text-neutral-500 uppercase font-semibold">Total Balance</div>
                  <div className="text-xl font-bold text-neutral-900">${stats.saBalance}</div>
                </div>
                <div>
                  <div className="text-xs text-neutral-500 uppercase font-semibold">Pending Transactions</div>
                  <div className="text-xl font-bold text-neutral-900">{stats.saPending}</div>
                </div>
              </div>
            </div>
          </div>
        </>
      )}

      {/* For agents, show only their recent transactions and forms */}
      {user.role === 'AGENT' && (
        <>
          {/* Action Buttons for agents */}
          <div className="flex gap-4 mb-4">
            <button
              className="px-4 py-2 rounded-md bg-blue-600 text-white font-semibold hover:bg-blue-700 transition-all"
              onClick={() => setShowRecordModal(true)}
            >
              + Record Transaction
            </button>
            <button
              className="px-4 py-2 rounded-md bg-green-600 text-white font-semibold hover:bg-green-700 transition-all"
              onClick={() => setShowRequestModal(true)}
            >
              + Create Transaction Request
            </button>
          </div>
          {/* Recent Transactions for agent */}
          <div className="bg-white border border-blue-100 rounded-xl shadow-sm p-6 mb-2">
            <h2 className="text-xl font-bold text-blue-900 mb-4">Your Recent Transactions</h2>
            <ul className="space-y-3">
              {recentTransactions.map((tx, idx) => (
                <li key={tx.id || idx} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className={`w-3 h-3 rounded-full inline-block ${tx.status === 'completed' ? 'bg-green-400' : tx.status === 'pending' ? 'bg-yellow-400' : tx.status === 'borrowed' ? 'bg-indigo-400' : 'bg-red-400'}`}></span>
                    <span className="text-sm text-neutral-700 font-medium">{tx.from} → {tx.to}</span>
                    <span className="text-xs text-blue-600 font-semibold ml-2">{tx.sender || '-'}</span>
                    <span className="text-xs text-neutral-400 ml-2">{new Date(tx.createdAt).toLocaleDateString()}</span>
                    <span className="text-xs text-neutral-500 ml-2">{tx.sourceAccount?.name || tx.sourceAccount?.type || '-'}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${tx.status === 'completed' ? 'bg-green-100 text-green-700' : tx.status === 'pending' ? 'bg-yellow-100 text-yellow-700' : tx.status === 'borrowed' ? 'bg-indigo-100 text-indigo-700' : 'bg-red-100 text-red-700'}`}>{tx.status}</span>
                    <span className="font-semibold text-neutral-900 text-sm">${tx.amount}</span>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </>
      )}

      {/* Record Transaction Modal */}
      {showRecordModal && (
        <div className="modal-overlay fixed inset-0 bg-black/30 flex items-center justify-center z-50">
          <div className="modal-content max-w-lg w-full bg-white rounded-xl shadow-2xl p-8">
            <h2 className="text-2xl font-bold mb-6">Record Transaction</h2>
            {!currentAgent ? (
              <div className="text-red-500">Loading agent information...</div>
            ) : subAccounts.length === 0 ? (
              <div className="text-red-500">No sub-accounts available for this agent.</div>
            ) : (
              <form
                onSubmit={async (e) => {
                  e.preventDefault();
                  setFormError('');
                  setFormSuccess('');
                  if (!recordForm.origin || !recordForm.subAccountId || !recordForm.amount || !recordForm.currency) {
                    setFormError('All fields are required.');
                    return;
                  }
                  try {
                    const transactionData = {
                      amount: parseFloat(recordForm.amount),
                      currency: recordForm.currency,
                      type: 'INPUT',
                      sourceAccountId: recordForm.subAccountId,
                      destAccountId: recordForm.subAccountId,
                      sender: recordForm.origin,
                      description: `Recorded transaction from ${recordForm.origin}`,
                      agentId: currentAgent.id,
                      status: 'PENDING'
                    };

                    console.log('Submitting record transaction:', transactionData);
                    
                    const data = await createTransaction(transactionData);
                    console.log('Transaction recorded successfully:', data);
                    
                    setFormSuccess('Transaction recorded!');
                    setShowRecordModal(false);
                    // Reset form
                    setRecordForm({
                      origin: '',
                      subAccountId: '',
                      amount: '',
                      currency: '',
                      proofFile: null,
                    });
                    // Refresh dashboard data
                    window.location.reload();
                  } catch (err) {
                    console.error('Error recording transaction:', err);
                    setFormError(err.response?.data?.message || err.message || 'Failed to record transaction');
                  }
                }}
                className="space-y-4"
              >
                <div>
                  <label className="input-label">Origin of Funds</label>
                  <input
                    type="text"
                    className="input"
                    value={recordForm.origin}
                    onChange={e => setRecordForm({ ...recordForm, origin: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <label className="input-label">Sub-Account</label>
                  <select
                    className="input"
                    value={recordForm.subAccountId}
                    onChange={e => setRecordForm({ ...recordForm, subAccountId: e.target.value })}
                    required
                  >
                    <option value="">Select Sub-Account</option>
                    {subAccounts.map(sa => (
                      <option key={sa.id} value={sa.id}>
                        {sa.name || sa.type} ({sa.currency === 'USD' ? '$' : 'R'}{Number(sa.balance).toLocaleString()})
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="input-label">Amount</label>
                  <input
                    type="number"
                    className="input"
                    value={recordForm.amount}
                    onChange={e => setRecordForm({ ...recordForm, amount: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <label className="input-label">Currency</label>
                  <select
                    className="input"
                    value={recordForm.currency}
                    onChange={e => setRecordForm({ ...recordForm, currency: e.target.value })}
                    required
                  >
                    <option value="">Select Currency</option>
                    <option value="USD">USD</option>
                    <option value="ZAR">ZAR</option>
                  </select>
                </div>
                <div className="flex gap-2 justify-end">
                  <button type="button" className="btn" onClick={() => setShowRecordModal(false)}>Cancel</button>
                  <button type="submit" className="btn btn-primary">Record</button>
                </div>
                {formError && <div className="text-red-500 text-sm">{formError}</div>}
                {formSuccess && <div className="text-green-500 text-sm">{formSuccess}</div>}
              </form>
            )}
          </div>
        </div>
      )}

      {/* Create Transaction Request Modal */}
      {showRequestModal && (
        <div className="modal-overlay fixed inset-0 bg-black/30 flex items-center justify-center z-50">
          <div className="modal-content max-w-lg w-full bg-white rounded-xl shadow-2xl p-8">
            <h2 className="text-2xl font-bold mb-6">Create Transaction Request</h2>
            <form
              onSubmit={async (e) => {
                e.preventDefault();
                setFormError('');
                setFormSuccess('');
                // For agents, do not require sourceSubAccountId
                if (!requestForm.sender || !requestForm.receiver || !requestForm.amount || !requestForm.currency || (!requestForm.sourceSubAccountId && user.role === 'ADMIN') || !requestForm.destAgentId) {
                  setFormError('All fields are required.');
                  return;
                }
                try {
                  // Do not override destAgentId for agents; use as selected
                  const payload = { ...requestForm };
                  if (user.role !== 'ADMIN') {
                    delete payload.sourceSubAccountId;
                  }
                  await createTransactionRequest(payload);
                  setFormSuccess('Transaction request created!');
                  setShowRequestModal(false);
                  // Refresh dashboard data
                  window.location.reload();
                } catch (err) {
                  setFormError(err.response?.data?.message || err.message || 'Failed to create transaction request');
                }
              }}
              className="space-y-4"
            >
              <div>
                <label className="input-label">Sender (Client)</label>
                <input
                  type="text"
                  className="input"
                  value={requestForm.sender}
                  onChange={e => setRequestForm({ ...requestForm, sender: e.target.value })}
                  required
                />
              </div>
              <div>
                <label className="input-label">Receiver (Client)</label>
                <input
                  type="text"
                  className="input"
                  value={requestForm.receiver}
                  onChange={e => setRequestForm({ ...requestForm, receiver: e.target.value })}
                  required
                />
              </div>
              <div>
                <label className="input-label">Amount</label>
                <input
                  type="number"
                  className="input"
                  value={requestForm.amount}
                  onChange={e => setRequestForm({ ...requestForm, amount: e.target.value })}
                  required
                />
      </div>
              <div>
                <label className="input-label">Currency</label>
                <select
                  className="input"
                  value={requestForm.currency}
                  onChange={e => setRequestForm({ ...requestForm, currency: e.target.value })}
                  required
                >
                  <option value="">Select Currency</option>
                  <option value="USD">USD</option>
                  <option value="ZAR">ZAR</option>
                </select>
                    </div>
              {/* Only show Source Sub-Account for admins */}
              {user.role === 'ADMIN' && (
                <div>
                  <label className="input-label">Source Sub-Account</label>
                  <select
                    className="input"
                    value={requestForm.sourceSubAccountId}
                    onChange={e => setRequestForm({ ...requestForm, sourceSubAccountId: e.target.value })}
                    required
                  >
                    <option value="">Select Sub-Account</option>
                    {subAccounts.map(sa => (
                      <option key={sa.id} value={sa.id}>
                        {sa.name || sa.type} ({sa.currency === 'USD' ? '$' : 'R'}{Number(sa.balance).toLocaleString()})
                      </option>
                    ))}
                  </select>
                </div>
              )}
              <div>
                <label className="input-label">Destination Agent</label>
                <select
                  className="input"
                  value={requestForm.destAgentId}
                  onChange={e => setRequestForm({ ...requestForm, destAgentId: e.target.value })}
                  required
                >
                  <option value="">Select Agent</option>
                  {agents
                    .filter(agent => agent.id !== user.agentId)
                    .map(agent => (
                      <option key={agent.id} value={agent.id}>{agent.name} ({agent.country})</option>
                    ))}
                </select>
              </div>
              <div>
                <label className="input-label">Description</label>
                <input
                  type="text"
                  className="input"
                  value={requestForm.description}
                  onChange={e => setRequestForm({ ...requestForm, description: e.target.value })}
                  required
                />
              </div>
              <div>
                <label className="input-label">Validation Code</label>
                <input
                  type="text"
                  className="input bg-neutral-800 text-white placeholder-neutral-400 border-neutral-700"
                  value={validationCode}
                  onChange={e => setValidationCode(e.target.value)}
                  required
                  placeholder="Enter validation code"
                />
              </div>
              <div className="flex gap-2 justify-end">
                <button type="button" className="btn" onClick={() => setShowRequestModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">Request</button>
              </div>
              {formError && <div className="text-red-500 text-sm">{formError}</div>}
              {formSuccess && <div className="text-green-500 text-sm">{formSuccess}</div>}
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard; 