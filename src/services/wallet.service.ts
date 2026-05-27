import { db } from '../db';
import { AppError } from '../utils/errors';
import type { TransactionType } from '../types';

const toMoney = (value: number): number =>
  Number(value.toFixed(2));

const recordTransaction = async (
  trx: typeof db,
  walletId: number,
  type: TransactionType,
  amount: number,
  counterpartyWalletId?: number
) => {
  await trx('transactions').insert({
    wallet_id: walletId,
    type,
    amount: toMoney(amount),
    counterparty_wallet_id: counterpartyWalletId ?? null,
  });
};

const getWalletForUser = async (userId: number, trx: typeof db = db) => {
  const wallet = await trx('wallets').where({ user_id: userId }).first();

  if (!wallet) {
    throw new AppError('Wallet not found', 404);
  }

  return wallet;
};

export const fundWallet = async (userId: number, amount: number) => {
  const normalizedAmount = toMoney(amount);

  return db.transaction(async (trx) => {
    const wallet = await getWalletForUser(userId, trx);
    const newBalance = toMoney(Number(wallet.balance) + normalizedAmount);

    await trx('wallets')
      .where({ id: wallet.id })
      .update({ balance: newBalance, updated_at: trx.fn.now() });

    await recordTransaction(trx, wallet.id, 'fund', normalizedAmount);

    return {
      success: true,
      balance: newBalance,
    };
  });
};

export const transferFunds = async (
  senderUserId: number,
  recipientEmail: string,
  amount: number
) => {
  const normalizedAmount = toMoney(amount);

  return db.transaction(async (trx) => {
    const senderWallet = await getWalletForUser(senderUserId, trx);
    const recipient = await trx('users')
      .where({ email: recipientEmail })
      .first();

    if (!recipient) {
      throw new AppError('Recipient not found', 404);
    }

    if (recipient.id === senderUserId) {
      throw new AppError('Cannot transfer funds to yourself', 400);
    }

    const recipientWallet = await getWalletForUser(recipient.id, trx);
    const senderBalance = Number(senderWallet.balance);

    if (senderBalance < normalizedAmount) {
      throw new AppError('Insufficient balance', 400);
    }

    const updatedSenderBalance = toMoney(senderBalance - normalizedAmount);
    const updatedRecipientBalance = toMoney(
      Number(recipientWallet.balance) + normalizedAmount
    );

    await trx('wallets')
      .where({ id: senderWallet.id })
      .update({
        balance: updatedSenderBalance,
        updated_at: trx.fn.now(),
      });

    await trx('wallets')
      .where({ id: recipientWallet.id })
      .update({
        balance: updatedRecipientBalance,
        updated_at: trx.fn.now(),
      });

    await recordTransaction(
      trx,
      senderWallet.id,
      'transfer_out',
      normalizedAmount,
      recipientWallet.id
    );

    await recordTransaction(
      trx,
      recipientWallet.id,
      'transfer_in',
      normalizedAmount,
      senderWallet.id
    );

    return {
      success: true,
      balance: updatedSenderBalance,
    };
  });
};

export const withdrawFunds = async (userId: number, amount: number) => {
  const normalizedAmount = toMoney(amount);

  return db.transaction(async (trx) => {
    const wallet = await getWalletForUser(userId, trx);
    const currentBalance = Number(wallet.balance);

    if (currentBalance < normalizedAmount) {
      throw new AppError('Insufficient balance', 400);
    }

    const newBalance = toMoney(currentBalance - normalizedAmount);

    await trx('wallets')
      .where({ id: wallet.id })
      .update({ balance: newBalance, updated_at: trx.fn.now() });

    await recordTransaction(trx, wallet.id, 'withdraw', normalizedAmount);

    return {
      success: true,
      balance: newBalance,
    };
  });
};

export const getWalletBalance = async (userId: number) => {
  const wallet = await getWalletForUser(userId);

  return {
    balance: Number(wallet.balance),
  };
};

export const getTransactions = async (userId: number) => {
  const wallet = await getWalletForUser(userId);

  const transactions = await db('transactions')
    .where({ wallet_id: wallet.id })
    .orderBy('created_at', 'desc');

  return transactions.map((transaction) => ({
    id: transaction.id,
    type: transaction.type,
    amount: Number(transaction.amount),
    counterpartyWalletId: transaction.counterparty_wallet_id,
    createdAt: transaction.created_at,
  }));
};
