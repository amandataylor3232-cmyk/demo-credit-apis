import { Request, Response } from 'express';
import * as walletService from '../services/wallet.service';
import {
  amountSchema,
  transferSchema,
} from '../validators/wallet.validator';
import { asyncHandler } from '../middleware/error.middleware';

export const fundWallet = asyncHandler(async (req: Request, res: Response) => {
  const { amount } = amountSchema.parse(req.body);
  const result = await walletService.fundWallet(req.user!.id, amount);

  res.json({
    success: true,
    message: 'Wallet funded successfully',
    data: result,
  });
});

export const transferFunds = asyncHandler(
  async (req: Request, res: Response) => {
    const payload = transferSchema.parse(req.body);
    const result = await walletService.transferFunds(
      req.user!.id,
      payload.recipientEmail,
      payload.amount
    );

    res.json({
      success: true,
      message: 'Transfer completed successfully',
      data: result,
    });
  }
);

export const withdrawFunds = asyncHandler(
  async (req: Request, res: Response) => {
    const { amount } = amountSchema.parse(req.body);
    const result = await walletService.withdrawFunds(req.user!.id, amount);

    res.json({
      success: true,
      message: 'Withdrawal completed successfully',
      data: result,
    });
  }
);

export const getBalance = asyncHandler(async (req: Request, res: Response) => {
  const result = await walletService.getWalletBalance(req.user!.id);

  res.json({
    success: true,
    data: result,
  });
});

export const getTransactions = asyncHandler(
  async (req: Request, res: Response) => {
    const transactions = await walletService.getTransactions(req.user!.id);

    res.json({
      success: true,
      data: transactions,
    });
  }
);
