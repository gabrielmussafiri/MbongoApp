import React, { useState, useEffect } from 'react';
import { CheckIcon, XMarkIcon } from '@heroicons/react/24/outline';
import { getTransactionRequests, processTransactionRequest, getSubAccounts, getAgents, createTransactionRequest, createTopUpRequest } from '../services/api';
import { useAuth } from '../context/AuthContext';

const PendingTransactions = () => {
  const { user } = useAuth();
  const [requests, setRequests] = useState([]);
  const [subAccounts, setSubAccounts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedSubAccount, setSelectedSubAccount] = useState('');
  const [validationCode, setValidationCode] = useState('');
  const [agents, setAgents] = useState([]);
  const [modalLoading, setModalLoading] = useState(false);
  const [isDeclineModalOpen, setIsDeclineModalOpen] = useState(false);
  const [declineLoading, setDeclineLoading] = useState(false);
  const [localAmount, setLocalAmount] = useState('');
  const [showTopUpModal, setShowTopUpModal] = useState(false);
  const [topUpAmount, setTopUpAmount] = useState('');
  const [topUpAgentId, setTopUpAgentId] = useState('');
  const [topUpNote, setTopUpNote] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        console.log('Fetching transaction requests...');
        const [requestsData, subAccountsData, agentsData] = await Promise.all([
          getTransactionRequests(),
          getSubAccounts(),
          getAgents()
        ]);
        console.log('Received requests:', requestsData);
        console.log('Received sub-accounts:', subAccountsData);
        console.log('Current user:', user);
        console.log('User agent ID:', user.agentId);
        console.log('Filtered sub-accounts for current agent:', subAccountsData.filter(account => account.agentId === user.agentId));
        setRequests(requestsData);
        setSubAccounts(subAccountsData);
        setAgents(agentsData);
      } catch (error) {
        console.error('Error fetching data:', error);
        setError('Failed to load data: ' + (error.response?.data?.error || error.message));
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [user]);

  const handleProcess = async (request) => {
    console.log('Processing request:', request);
    console.log('Available sub-accounts:', subAccounts);
    console.log('Current user:', user);
    console.log('User agent ID:', user.agentId);
    console.log('Sub-accounts for current agent:', subAccounts.filter(account => account.agentId === user.agentId));
    console.log('Filtered sub-accounts by currency:', subAccounts.filter(account => 
      account.currency === request.currency && account.agentId === user.agentId
    ));
    setSelectedRequest(request);
    setIsModalOpen(true);
    setValidationCode('');
    setSelectedSubAccount('');
    setLocalAmount('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      setError('');
      setSuccess('');

      if (!selectedSubAccount) {
        setError('Please select a sub-account');
        return;
      }
      if (!localAmount || isNaN(Number(localAmount)) || Number(localAmount) <= 0) {
        setError('Please enter a valid local amount to deduct');
        return;
      }
      const subAccount = subAccounts.find(a => a.id === selectedSubAccount);
      if (subAccount && Number(localAmount) > Number(subAccount.balance)) {
        setError('Insufficient funds in this sub-account.');
        return;
      }
      await processTransactionRequest(selectedRequest.id, {
        subAccountId: selectedSubAccount,
        validationCode: selectedRequest.validationCode,
        localAmount: Number(localAmount)
      });
      setIsModalOpen(false);
      setSuccess('Transaction processed successfully!');
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to process transaction');
    } finally {
      setLoading(false);
    }
  };

  const handleDecline = (request) => {
    setSelectedRequest(request);
    setIsDeclineModalOpen(true);
  };

  const handleDeclineConfirm = async () => {
    try {
      setDeclineLoading(true);
      setError('');
      setSuccess('');
      // Call backend to decline the request
      await processTransactionRequest(selectedRequest.id, {
        decline: true
      });
      setSuccess('Transaction request declined successfully!');
      setIsDeclineModalOpen(false);
      // Refresh requests
      const updatedRequests = await getTransactionRequests();
      setRequests(updatedRequests);
    } catch (error) {
      setError(error.response?.data?.message || 'Failed to decline transaction request');
    } finally {
      setDeclineLoading(false);
    }
  };

  // Split requests
  const myRequests = requests.filter(r => r.requestedBy === user.agentId);
  const toProcess = requests.filter(r => r.processedBy === user.agentId && r.requestedBy !== user.agentId);
  const topUpRequestsToProcess = requests.filter(r => r.type === 'TOP_UP' && r.processedBy === user.agentId);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-2">
        <h1 className="text-3xl font-extrabold text-neutral-900 tracking-tight">Pending Transactions</h1>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded">
          {error}
        </div>
      )}

      {success && (
        <div className="bg-green-50 border border-green-200 text-green-600 px-4 py-3 rounded">
          {success}
        </div>
      )}

      {/* Pending Requests to Process */}
      <div className="card overflow-x-auto">
        <h2 className="text-xl font-bold text-blue-900 mb-2">Pending Requests to Process</h2>
        <table className="min-w-full divide-y divide-neutral-200">
          <thead className="bg-neutral-50">
            <tr>
              <th className="px-4 py-2 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">Transaction ID</th>
              <th className="px-4 py-2 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">Amount</th>
              <th className="px-4 py-2 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">Sender</th>
              <th className="px-4 py-2 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">From Account</th>
              <th className="px-4 py-2 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">Description</th>
              <th className="px-4 py-2 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">Date</th>
              <th className="px-4 py-2 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-neutral-200">
            {toProcess && toProcess.length > 0 ? (
              toProcess.map((request) => (
                <tr key={request.id}>
                  <td className="px-4 py-2 text-sm font-mono text-neutral-900">{request.id}</td>
                  <td className="px-4 py-2 text-sm text-neutral-900">{request.currency} {request.amount?.toLocaleString()}</td>
                  <td className="px-4 py-2 text-sm text-neutral-700">{request.sender}</td>
                  <td className="px-4 py-2 text-sm text-neutral-700">{request.sourceAccount?.type || 'N/A'}</td>
                  <td className="px-4 py-2 text-sm text-neutral-700">{request.description || '-'}</td>
                  <td className="px-4 py-2 text-sm text-neutral-500">{new Date(request.createdAt).toLocaleDateString()}</td>
                  <td className="px-4 py-2 text-sm">
                    <button
                      onClick={() => handleProcess(request)}
                      className="btn btn-primary btn-sm flex items-center mr-2"
                    >
                      <CheckIcon className="h-4 w-4 mr-1" /> Process
                    </button>
                    <button
                      onClick={() => handleDecline(request)}
                      className="btn btn-danger btn-sm flex items-center"
                    >
                      <XMarkIcon className="h-4 w-4 mr-1" /> Decline
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="7" className="px-4 py-4 text-center text-sm text-neutral-500">
                  No pending requests to process
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* My Requests */}
      <div className="card overflow-x-auto mt-8">
        <h2 className="text-xl font-bold text-green-900 mb-2">My Requests</h2>
        <table className="min-w-full divide-y divide-neutral-200">
          <thead className="bg-neutral-50">
            <tr>
              <th className="px-4 py-2 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">Transaction ID</th>
              <th className="px-4 py-2 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">Amount</th>
              <th className="px-4 py-2 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">Sender</th>
              <th className="px-4 py-2 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">From Account</th>
              <th className="px-4 py-2 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">Description</th>
              <th className="px-4 py-2 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">Date</th>
              <th className="px-4 py-2 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">To Agent</th>
              <th className="px-4 py-2 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">Status</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-neutral-200">
            {myRequests && myRequests.length > 0 ? (
              myRequests.map((request) => {
                const toAgent = agents.find(a => a.id === request.processedBy);
                return (
                  <tr key={request.id}>
                    <td className="px-4 py-2 text-sm font-mono text-neutral-900">{request.id}</td>
                    <td className="px-4 py-2 text-sm text-neutral-900">{request.currency} {request.amount?.toLocaleString()}</td>
                    <td className="px-4 py-2 text-sm text-neutral-700">{request.sender}</td>
                    <td className="px-4 py-2 text-sm text-neutral-700">{request.sourceAccount?.type || 'N/A'}</td>
                    <td className="px-4 py-2 text-sm text-neutral-700">{request.description || '-'}</td>
                    <td className="px-4 py-2 text-sm text-neutral-500">{new Date(request.createdAt).toLocaleDateString()}</td>
                    <td className="px-4 py-2 text-sm text-neutral-700">{toAgent ? `${toAgent.name} (${toAgent.country})` : 'Unknown'}</td>
                    <td className="px-4 py-2 text-sm text-neutral-500">{request.status}</td>
                  </tr>
                );
              })
            ) : (
              <tr>
                <td colSpan="8" className="px-4 py-4 text-center text-sm text-neutral-500">
                  No requests created by you
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Top Up Requests to Process */}
      {topUpRequestsToProcess.length > 0 && (
        <div className="card overflow-x-auto mt-8">
          <h2 className="text-xl font-bold text-indigo-900 mb-2">Top Up Requests to Process</h2>
          <table className="min-w-full divide-y divide-neutral-200">
            <thead className="bg-neutral-50">
              <tr>
                <th className="px-4 py-2 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">Sender</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">Requester</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">Amount</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">Note</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">Date</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">Status</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-neutral-200">
              {topUpRequestsToProcess.map((request) => (
                <tr key={request.id}>
                  <td className="px-4 py-2 text-sm text-neutral-700">{request.sender}</td>
                  <td className="px-4 py-2 text-sm text-neutral-700">{agents.find(a => a.id === request.requestedBy)?.name || 'Unknown'}</td>
                  <td className="px-4 py-2 text-sm text-neutral-900">{request.currency} {request.amount?.toLocaleString()}</td>
                  <td className="px-4 py-2 text-sm text-neutral-700">{request.description || '-'}</td>
                  <td className="px-4 py-2 text-sm text-neutral-500">{new Date(request.createdAt).toLocaleDateString()}</td>
                  <td className="px-4 py-2 text-sm text-neutral-500">{request.status}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Process Transaction Modal */}
      {isModalOpen && selectedRequest && (
        <div className="modal-overlay fixed inset-0 bg-neutral-900/80 backdrop-blur-sm flex items-center justify-center z-50 transition-opacity duration-200 animate-fade-in">
          <div className="modal-content max-w-md w-full bg-neutral-900 text-white shadow-2xl rounded-xl p-8 animate-scale-fade-in">
            <h2 className="text-2xl font-bold text-white mb-6">Process Transaction</h2>
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="space-y-4">
                <div>
                  <label className="input-label text-neutral-200">Transaction Details</label>
                  <div className="bg-neutral-800 p-4 rounded-lg space-y-2">
                    <p><span className="font-medium">Amount:</span> {selectedRequest.currency} {selectedRequest.amount?.toLocaleString()}</p>
                    <p><span className="font-medium">Sender:</span> {selectedRequest.sender}</p>
                    <p><span className="font-medium">From Account:</span> {selectedRequest.sourceAccount?.type}</p>
                    <p><span className="font-medium">Description:</span> {selectedRequest.description || '-'}</p>
                  </div>
                </div>
                {error && (
                  <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded mt-2">
                    {error}
                    {error.includes('Insufficient funds') && (
                      <button
                        type="button"
                        className="ml-4 px-3 py-1 rounded bg-yellow-500 text-white font-semibold hover:bg-yellow-600 transition-all"
                        onClick={() => setShowTopUpModal(true)}
                      >
                        Request Top Up from Another Agent
                      </button>
                    )}
                  </div>
                )}
                <div>
                  <label className="input-label text-neutral-200">Validation Code</label>
                  <div className="flex items-center gap-2 mt-2 mb-4">
                    <span className="font-mono text-2xl font-bold text-yellow-400 bg-neutral-900 px-4 py-2 rounded-lg border border-yellow-300 shadow">
                      {selectedRequest.validationCode || 'N/A'}
                    </span>
                    <button
                      type="button"
                      className="btn btn-secondary btn-xs"
                      onClick={() => navigator.clipboard.writeText(selectedRequest.validationCode || '')}
                      disabled={!selectedRequest.validationCode}
                    >
                      Copy
                    </button>
                  </div>
                  <input
                    type="hidden"
                    name="validationCode"
                    value={selectedRequest.validationCode || ''}
                  />
                </div>
                <div>
                  <label className="input-label text-neutral-200">Select Your Sub Account</label>
                  <select
                    className="input bg-neutral-800 text-white border-neutral-700"
                    value={selectedSubAccount}
                    onChange={e => setSelectedSubAccount(e.target.value)}
                    required
                  >
                    <option value="">Select sub account</option>
                    {subAccounts
                      .filter(account => account.agentId === user.agentId)
                      .map(account => (
                        <option key={account.id} value={account.id}>
                          {account.type} - {account.currency} ({Number(account.balance).toLocaleString()})
                        </option>
                      ))}
                  </select>
                  {!subAccounts.some(account => account.agentId === user.agentId) && (
                    <p className="text-red-500 text-sm mt-1">
                      No sub-accounts available for your agent profile
                    </p>
                  )}
                </div>
                <div>
                  <label className="input-label text-neutral-200">Amount to Deduct (Local Currency)</label>
                  <input
                    type="number"
                    className="input bg-neutral-800 text-white placeholder-neutral-400 border-neutral-700"
                    value={localAmount}
                    onChange={e => setLocalAmount(e.target.value)}
                    required
                    min="0.01"
                    step="0.01"
                    placeholder="Enter amount in your local currency (e.g. ZAR)"
                  />
                </div>
              </div>
              <div className="flex justify-end">
                <button
                  type="button"
                  className="btn btn-secondary mr-2"
                  onClick={() => setIsModalOpen(false)}
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="btn btn-primary"
                  disabled={loading}
                >
                  {loading ? 'Processing...' : 'Confirm & Process'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Decline Transaction Modal */}
      {isDeclineModalOpen && selectedRequest && (
        <div className="modal-overlay fixed inset-0 bg-neutral-900/80 backdrop-blur-sm flex items-center justify-center z-50 transition-opacity duration-200 animate-fade-in">
          <div className="modal-content max-w-md w-full bg-neutral-900 text-white shadow-2xl rounded-xl p-8 animate-scale-fade-in">
            <h2 className="text-2xl font-bold text-white mb-6">Decline Transaction Request</h2>
            <p className="mb-6 text-neutral-200">Are you sure you want to decline this transaction request?</p>
            <div className="flex justify-end">
              <button
                type="button"
                className="btn btn-secondary mr-2"
                onClick={() => setIsDeclineModalOpen(false)}
                disabled={declineLoading}
              >
                Cancel
              </button>
              <button
                type="button"
                className="btn btn-danger"
                onClick={handleDeclineConfirm}
                disabled={declineLoading}
              >
                {declineLoading ? 'Declining...' : 'Confirm Decline'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Top Up Modal */}
      {showTopUpModal && (
        <div className="modal-overlay fixed inset-0 bg-neutral-900/80 backdrop-blur-sm flex items-center justify-center z-50 transition-opacity duration-200 animate-fade-in">
          <div className="modal-content max-w-md w-full bg-white text-neutral-900 shadow-2xl rounded-xl p-8 animate-scale-fade-in">
            <h2 className="text-2xl font-bold mb-6">Request Top Up</h2>
            <form
              onSubmit={async e => {
                e.preventDefault();
                try {
                  setLoading(true);
                  await createTopUpRequest({
                    amount: topUpAmount,
                    currency: selectedRequest?.currency || 'ZAR',
                    destAgentId: topUpAgentId,
                    note: topUpNote
                  });
                  setShowTopUpModal(false);
                  setTopUpAmount('');
                  setTopUpAgentId('');
                  setTopUpNote('');
                  setSuccess('Top up request sent!');
                } catch (err) {
                  setError(err.response?.data?.message || 'Failed to send top up request');
                } finally {
                  setLoading(false);
                }
              }}
              className="space-y-5"
            >
              <div>
                <label className="input-label">Select Agent</label>
                <select
                  className="input"
                  value={topUpAgentId}
                  onChange={e => setTopUpAgentId(e.target.value)}
                  required
                >
                  <option value="">Select agent</option>
                  {agents.filter(a => a.id !== user.agentId).map(agent => (
                    <option key={agent.id} value={agent.id}>{agent.name} ({agent.country})</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="input-label">Amount Needed</label>
                <input
                  type="number"
                  className="input"
                  value={topUpAmount}
                  onChange={e => setTopUpAmount(e.target.value)}
                  min="1"
                  required
                />
              </div>
              <div>
                <label className="input-label">Note (optional)</label>
                <textarea
                  className="input"
                  value={topUpNote}
                  onChange={e => setTopUpNote(e.target.value)}
                  rows={2}
                  placeholder="Reason for top up"
                />
              </div>
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setShowTopUpModal(false)}
                >
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">Send Top Up Request</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default PendingTransactions; 