import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { getTransactionRequests, processTransactionRequest, getSubAccounts } from '../services/api';

const TransactionRequests = () => {
  const [requests, setRequests] = useState([]);
  const [subAccounts, setSubAccounts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const { register, handleSubmit, formState: { errors } } = useForm();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [requestsData, subAccountsData] = await Promise.all([
          getTransactionRequests(),
          getSubAccounts()
        ]);
        setRequests(requestsData);
        setSubAccounts(subAccountsData);
      } catch (error) {
        setError('Failed to load data');
      }
    };
    fetchData();
  }, []);

  const onProcessRequest = async (requestId, data) => {
    try {
      setLoading(true);
      setError('');
      setSuccess('');
      await processTransactionRequest(requestId, data);
      setSuccess('Transaction processed successfully!');
      // Refresh requests
      const updatedRequests = await getTransactionRequests();
      setRequests(updatedRequests);
    } catch (error) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString();
  };

  const isExpired = (expiresAt) => {
    return new Date(expiresAt) < new Date();
  };

  return (
    <div className="space-y-6">
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

      <h2 className="text-xl font-bold text-neutral-900">Transaction Requests</h2>

      {requests.length === 0 ? (
        <p className="text-neutral-500">No pending requests</p>
      ) : (
        <div className="space-y-4">
          {requests.map((request) => (
            <div key={request.id} className="card">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs font-medium text-neutral-500 uppercase tracking-wide">From</p>
                  <p className="mt-1 text-base text-neutral-900">{request.from}</p>
                </div>
                <div>
                  <p className="text-xs font-medium text-neutral-500 uppercase tracking-wide">Amount</p>
                  <p className="mt-1 text-base text-neutral-900">{request.amount} {request.currency}</p>
                </div>
                <div>
                  <p className="text-xs font-medium text-neutral-500 uppercase tracking-wide">Source Account</p>
                  <p className="mt-1 text-base text-neutral-900">{request.sourceAccount.name}</p>
                </div>
                <div>
                  <p className="text-xs font-medium text-neutral-500 uppercase tracking-wide">Expires At</p>
                  <p className={`mt-1 text-base ${isExpired(request.expiresAt) ? 'text-error-500' : 'text-neutral-900'}`}>{formatDate(request.expiresAt)}</p>
                </div>
                {request.description && (
                  <div className="col-span-2">
                    <p className="text-xs font-medium text-neutral-500 uppercase tracking-wide">Description</p>
                    <p className="mt-1 text-base text-neutral-900">{request.description}</p>
                  </div>
                )}
              </div>

              <form
                onSubmit={handleSubmit((data) => onProcessRequest(request.id, data))}
                className="mt-4 space-y-4"
              >
                <div>
                  <label className="input-label">Validation Code</label>
                  <input
                    type="text"
                    {...register('validationCode', { required: true })}
                    className="input"
                    placeholder="Enter the validation code"
                  />
                  {errors.validationCode && <span className="text-error-500 text-xs">This field is required</span>}
                </div>

                <div>
                  <label className="input-label">Your Account to Deduct From</label>
                  <select
                    {...register('destAccountId', { required: true })}
                    className="input"
                  >
                    <option value="">Select an account</option>
                    {subAccounts.map((account) => (
                      <option key={account.id} value={account.id}>
                        {account.name} - {account.balance} {account.currency}
                      </option>
                    ))}
                  </select>
                  {errors.destAccountId && <span className="text-error-500 text-xs">This field is required</span>}
                </div>

                <button
                  type="submit"
                  disabled={loading || isExpired(request.expiresAt)}
                  className={`btn w-full flex justify-center items-center ${
                    isExpired(request.expiresAt)
                      ? 'btn-secondary cursor-not-allowed opacity-60'
                      : 'btn-primary'
                  }`}
                >
                  {loading ? 'Processing...' : isExpired(request.expiresAt) ? 'Expired' : 'Process Request'}
                </button>
              </form>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default TransactionRequests; 