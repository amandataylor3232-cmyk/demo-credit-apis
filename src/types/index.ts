export type User = {
  id: number;
  name: string;
  email: string;
  phone: string;
  bvn: string;
  access_token: string;
  created_at: Date;
  updated_at: Date;
};

export type Wallet = {
  id: number;
  user_id: number;
  balance: string;
  created_at: Date;
  updated_at: Date;
};

export type TransactionType =
  | 'fund'
  | 'withdraw'
  | 'transfer_in'
  | 'transfer_out';

export type Transaction = {
  id: number;
  wallet_id: number;
  type: TransactionType;
  amount: string;
  reference: string | null;
  counterparty_wallet_id: number | null;
  created_at: Date;
  updated_at: Date;
};

declare global {
  namespace Express {
    interface Request {
      user?: User;
    }
  }
}

export {};
