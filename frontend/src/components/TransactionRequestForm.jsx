import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { createTransactionRequest } from '../services/api';
import { getAgents } from '../services/api';
import { getSubAccounts } from '../services/api';

const TransactionRequestForm = ({ onSubmit }) => {
  const { register, handleSubmit, formState: { errors } } = useForm();
  const [agents, setAgents] = useState([]);
  const [subAccounts, setSubAccounts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [agentsData, subAccountsData] = await Promise.all([
          getAgents(),
          getSubAccounts()
        ]);
        setAgents(agentsData);
        setSubAccounts(subAccountsData);
      } catch (error) {
        setError('Failed to load data');
      }
    };
    fetchData();
  }, []);

  const onSubmitForm = async (data) => {
    try {
      setLoading(true);
      setError('');
      setSuccess('');
      const response = await createTransactionRequest({
        ...data,
        from: 'Admin' // Since you're logged in as admin
      });
      setSuccess(`Transaction request created successfully! Validation code: ${response.validationCode}`);
      if (onSubmit) {
      onSubmit(response);
      }
    } catch (error) {
      console.error('Error creating transaction request:', error);
      setError(error.response?.data?.message || error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmitForm)} className="space-y-6">
      {error && (
        <div className="alert alert-error">
          {error}
        </div>
      )}

      {success && (
        <div className="alert alert-success">
          {success}
      </div>
      )}

      <div>
        <label className="input-label">Amount</label>
        <input
          type="number"
          step="0.01"
          {...register('amount', { required: true, min: 0 })}
          className="input"
        />
        {errors.amount && <span className="text-error-500 text-xs">This field is required</span>}
      </div>

      <div>
        <label className="input-label">Currency</label>
        <select
          {...register('currency', { required: true })}
          className="input"
        >
          <option value="">Select currency</option>
          <option value="USD">USD</option>
          <option value="ZAR">ZAR</option>
        </select>
        {errors.currency && <span className="text-error-500 text-xs">This field is required</span>}
      </div>

      <div>
        <label className="input-label">Source Account</label>
        <select
          {...register('sourceAccountId', { required: true })}
          className="input"
        >
          <option value="">Select an account</option>
          {subAccounts.map((account) => (
            <option key={account.id} value={account.id}>
              {account.type} - {account.balance} {account.currency}
            </option>
          ))}
        </select>
        {errors.sourceAccountId && <span className="text-error-500 text-xs">This field is required</span>}
      </div>

      <div>
        <label className="input-label">Destination Agent</label>
        <select
          {...register('destAgentId', { required: true })}
          className="input"
        >
          <option value="">Select an agent</option>
          {agents.map((agent) => (
            <option key={agent.id} value={agent.id}>
              {agent.name} ({agent.country})
            </option>
          ))}
        </select>
        {errors.destAgentId && <span className="text-error-500 text-xs">This field is required</span>}
      </div>

      <div>
        <label className="input-label">Description</label>
        <textarea
          {...register('description')}
          className="input"
          rows={3}
        />
      </div>

      <button
        type="submit"
        disabled={loading}
        className="btn btn-primary w-full flex justify-center items-center"
      >
        {loading ? 'Creating Request...' : 'Create Request'}
      </button>
    </form>
  );
};

export default TransactionRequestForm; 