# DRC-SA Money Transfer Application

A full-stack web application for managing money transfers between the Democratic Republic of Congo (DRC) and South Africa (RSA).

## Features

- Track money inflows and outflows
- Manage agent accounts and sub-accounts
- Process internal transfers between agents
- Real-time balance tracking
- Transaction history and reporting

## Tech Stack

### Backend
- Node.js
- Express.js
- Prisma ORM
- PostgreSQL
- JWT Authentication

### Frontend (Coming Soon)
- React/Next.js
- Tailwind CSS
- Axios

## Getting Started

### Prerequisites
- Node.js (v14 or higher)
- PostgreSQL
- npm or yarn

### Installation

1. Clone the repository
```bash
git clone [repository-url]
cd drc-sa-money-transfer
```

2. Install dependencies
```bash
npm install
```

3. Create a `.env` file in the root directory with the following variables:
```
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/drc_sa_money?schema=public"
PORT=3000
JWT_SECRET="your-secret-key-here"
```

4. Initialize the database
```bash
npx prisma migrate dev
```

5. Start the development server
```bash
npm run dev
```

## API Endpoints

### Agents
- `GET /api/agents` - Get all agents
- `GET /api/agents/:id` - Get a specific agent
- `POST /api/agents` - Create a new agent
- `PUT /api/agents/:id` - Update an agent
- `DELETE /api/agents/:id` - Delete an agent

### Sub-Accounts
- `GET /api/sub-accounts` - Get all sub-accounts
- `GET /api/sub-accounts/:id` - Get a specific sub-account
- `POST /api/sub-accounts` - Create a new sub-account
- `PUT /api/sub-accounts/:id` - Update a sub-account
- `DELETE /api/sub-accounts/:id` - Delete a sub-account

### Transactions
- `GET /api/transactions` - Get all transactions
- `GET /api/transactions/:id` - Get a specific transaction
- `POST /api/transactions` - Create a new transaction
- `PUT /api/transactions/:id/status` - Update transaction status

## License

This project is licensed under the MIT License. # MbongoApp
