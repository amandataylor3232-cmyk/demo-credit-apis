import * as karmaService from '../services/karma.service';
import { registerUser } from '../services/user.service';
import { AppError } from '../utils/errors';

jest.mock('../services/karma.service', () => ({
  assertNotBlacklisted: jest.fn(),
  lookupKarma: jest.fn(),
}));

const mockedKarma = karmaService as jest.Mocked<typeof karmaService>;

describe('User Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockedKarma.assertNotBlacklisted.mockResolvedValue(undefined);
  });

  it('creates a user and wallet when karma checks pass', async () => {
    const result = await registerUser({
      name: 'Jane Doe',
      email: 'jane@example.com',
      phone: '+2348012345678',
      bvn: '22212345678',
    });

    expect(result.accessToken).toHaveLength(64);
    expect(result.user.email).toBe('jane@example.com');
    expect(mockedKarma.assertNotBlacklisted).toHaveBeenCalledWith([
      'jane@example.com',
      '+2348012345678',
      '22212345678',
    ]);
  });

  it('rejects onboarding when karma blacklist check fails', async () => {
    mockedKarma.assertNotBlacklisted.mockRejectedValue(
      new Error('Identity jane@example.com is on the Adjutor Karma blacklist')
    );

    await expect(
      registerUser({
        name: 'Jane Doe',
        email: 'jane@example.com',
        phone: '+2348012345678',
        bvn: '22212345678',
      })
    ).rejects.toMatchObject({
      statusCode: 403,
    });
  });

  it('prevents duplicate account creation', async () => {
    await registerUser({
      name: 'Jane Doe',
      email: 'jane@example.com',
      phone: '+2348012345678',
      bvn: '22212345678',
    });

    await expect(
      registerUser({
        name: 'Jane Clone',
        email: 'jane@example.com',
        phone: '+2348098765432',
        bvn: '33312345678',
      })
    ).rejects.toBeInstanceOf(AppError);
  });
});
