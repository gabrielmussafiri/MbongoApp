import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add a request interceptor to add the auth token to requests
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Add a response interceptor to handle errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Auth endpoints
export const login = async (credentials) => {
  try {
    const response = await api.post('/auth/login', credentials);
    return response.data;
  } catch (error) {
    if (error.response) {
      throw error;
    } else {
      throw new Error('Network error. Please check if the server is running.');
    }
  }
};

// Agent endpoints
export const getAgents = async () => {
  const response = await api.get('/agents');
  return response.data;
};

export const createAgent = async (agentData) => {
  const response = await api.post('/agents', agentData);
  return response.data;
};

export const updateAgent = async (id, agentData) => {
  const response = await api.put(`/agents/${id}`, agentData);
  return response.data;
};

export const deleteAgent = async (id) => {
  const response = await api.delete(`/agents/${id}`);
  return response.data;
};

// Sub-Account endpoints
export const getSubAccounts = async () => {
  const response = await api.get('/sub-accounts');
  return response.data;
};

export const createSubAccount = async (subAccountData) => {
  const response = await api.post('/sub-accounts', subAccountData);
  return response.data;
};

export const updateSubAccount = async (id, subAccountData) => {
  const response = await api.put(`/sub-accounts/${id}`, subAccountData);
  return response.data;
};

export const deleteSubAccount = async (id) => {
  const response = await api.delete(`/sub-accounts/${id}`);
  return response.data;
};

// Transaction endpoints
export const getTransactions = async () => {
  const response = await api.get('/transactions');
  return response.data;
};

export const createTransaction = async (transactionData) => {
  const response = await api.post('/transactions', transactionData);
  return response.data;
};

export const updateTransactionStatus = async (id, status) => {
  const response = await api.put(`/transactions/${id}/status`, { status });
  return response.data;
};

export const getDashboardStats = async () => {
  try {
    console.log('Fetching dashboard stats...');
    const token = localStorage.getItem('token');
    console.log('Token for dashboard stats:', token ? 'Exists' : 'Missing');
    const response = await api.get('/dashboard/stats');
    console.log('Dashboard stats response:', response.data);
    return response.data;
  } catch (error) {
    console.error('Error fetching dashboard stats:', {
      message: error.message,
      response: error.response?.data,
      status: error.response?.status
    });
    throw error;
  }
};

export const getRecentTransactions = async () => {
  try {
    console.log('Fetching recent transactions...');
    const token = localStorage.getItem('token');
    console.log('Token for recent transactions:', token ? 'Exists' : 'Missing');
    const response = await api.get('/dashboard/recent-transactions');
    console.log('Recent transactions response:', response.data);
    return response.data;
  } catch (error) {
    console.error('Error fetching recent transactions:', {
      message: error.message,
      response: error.response?.data,
      status: error.response?.status
    });
    throw error;
  }
};

// Transaction requests
export const createTransactionRequest = async (data) => {
  console.log('Creating transaction request:', data);
  const response = await api.post('/transactions/request', data);
  console.log('Transaction request created:', response.data);
  return response.data;
};

export const getTransactionRequests = async () => {
  try {
    console.log('Fetching transaction requests...');
    const token = localStorage.getItem('token');
    console.log('Token for requests:', token ? 'Exists' : 'Missing');
    
    const response = await api.get('/transactions/requests');
    console.log('Received transaction requests:', response.data);
    
    if (!Array.isArray(response.data)) {
      console.error('Expected array of requests but got:', response.data);
      return [];
    }
    
    return response.data;
  } catch (error) {
    console.error('Error fetching transaction requests:', {
      message: error.message,
      response: error.response?.data,
      status: error.response?.status
    });
    throw error;
  }
};

export const processTransactionRequest = async (id, data) => {
  console.log('Processing transaction request:', { id, data });
  const response = await api.post(`/transactions/process/${id}`, data);
  console.log('Transaction request processed:', response.data);
  return response.data;
};

export const processTransaction = async (transactionId, subAccountId) => {
  try {
    const response = await axios.post(
      `${API_URL}/transactions/process/${transactionId}`,
      { subAccountId },
      {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
      }
    );
    return response.data;
  } catch (error) {
    throw error.response?.data || { error: 'Failed to process transaction' };
  }
};

export const createTopUpRequest = async ({ amount, currency, destAgentId, note }) => {
  try {
    const token = localStorage.getItem('token');
    const response = await api.post('/transactions/top-up', { amount, currency, destAgentId, note }, {
      headers: { Authorization: `Bearer ${token}` }
    });
    return response.data;
  } catch (error) {
    throw error;
  }
};

export default api; 
