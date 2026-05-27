import { registerUser } from '../services/user.service';
import * as walletService from '../services/wallet.service';
import { AppError } from '../utils/errors';

jest.mock('../services/karma.service', () => ({
  assertNotBlacklisted: jest.fn().mockResolvedValue(undefined),
  lookupKarma: jest.fn(),
}));

let userCounter = 0;

const createUser = async (email: string) => {
  userCounter += 1;
  const suffix = String(userCounter).padStart(8, '0');

  return registerUser({
    name: `User ${email.split('@')[0]}`,
    email,
    phone: `+23480${suffix}`,
    bvn: `222${String(userCounter).padStart(8, '0')}`,
  });
};

describe('Wallet Service', () => {
  it('funds a wallet and updates balance', async () => {
    const { user } = await createUser('alice@example.com');

    const result = await walletService.fundWallet(user.id, 5000);

    expect(result.balance).toBe(5000);

    const balance = await walletService.getWalletBalance(user.id);
    expect(balance.balance).toBe(5000);
  });

  it('transfers funds between users', async () => {
    const sender = await createUser('sender@example.com');
    const recipient = await createUser('recipient@example.com');

    await walletService.fundWallet(sender.user.id, 10000);

    const result = await walletService.transferFunds(
      sender.user.id,
      recipient.user.email,
      2500
    );

    expect(result.balance).toBe(7500);

    const recipientBalance = await walletService.getWalletBalance(
      recipient.user.id
    );
    expect(recipientBalance.balance).toBe(2500);
  });

  it('rejects transfer when balance is insufficient', async () => {
    const sender = await createUser('poor@example.com');
    const recipient = await createUser('rich@example.com');

    await expect(
      walletService.transferFunds(sender.user.id, recipient.user.email, 100)
    ).rejects.toBeInstanceOf(AppError);
  });

  it('withdraws funds from a wallet', async () => {
    const { user } = await createUser('withdraw@example.com');

    await walletService.fundWallet(user.id, 3000);

    const result = await walletService.withdrawFunds(user.id, 1200);

    expect(result.balance).toBe(1800);
  });

  it('records transactions for wallet activity', async () => {
    const { user } = await createUser('history@example.com');

    await walletService.fundWallet(user.id, 1000);
    await walletService.withdrawFunds(user.id, 200);

    const transactions = await walletService.getTransactions(user.id);

    expect(transactions).toHaveLength(2);
    expect(transactions.map((item) => item.type).sort()).toEqual([
      'fund',
      'withdraw',
    ]);
  });
});
