import { Request, Response } from 'express';
import * as userService from '../services/user.service';
import { registerUserSchema } from '../validators/wallet.validator';
import { asyncHandler } from '../middleware/error.middleware';

export const register = asyncHandler(async (req: Request, res: Response) => {
  const payload = registerUserSchema.parse(req.body);
  const result = await userService.registerUser(payload);

  res.status(201).json({
    success: true,
    message: 'Account created successfully',
    data: {
      user: result.user,
      accessToken: result.accessToken,
    },
  });
});

export const getProfile = asyncHandler(async (req: Request, res: Response) => {
  const profile = await userService.getUserProfile(req.user!.id);

  res.json({
    success: true,
    data: profile,
  });
});
