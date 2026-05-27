import request from 'supertest';
import app from '../app';
import * as karmaService from '../services/karma.service';

jest.mock('../services/karma.service', () => ({
  assertNotBlacklisted: jest.fn(),
  lookupKarma: jest.fn(),
}));

const mockedKarma = karmaService as jest.Mocked<typeof karmaService>;

describe('Wallet API', () => {
  beforeEach(() => {
    mockedKarma.assertNotBlacklisted.mockResolvedValue(undefined);
  });

  it('registers a user and performs wallet operations', async () => {
    const registerResponse = await request(app).post('/api/users/register').send({
      name: 'Demo User',
      email: 'demo@example.com',
      phone: '+2347012345678',
      bvn: '22212345678',
    });

    expect(registerResponse.status).toBe(201);
    expect(registerResponse.body.data.accessToken).toBeDefined();

    const token = registerResponse.body.data.accessToken;

    await request(app)
      .post('/api/wallets/fund')
      .set('Authorization', `Bearer ${token}`)
      .send({ amount: 5000 })
      .expect(200);

    const balanceResponse = await request(app)
      .get('/api/wallets/balance')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    expect(balanceResponse.body.data.balance).toBe(5000);
  });

  it('rejects blacklisted users during registration', async () => {
    mockedKarma.assertNotBlacklisted.mockRejectedValue(
      new Error('Identity demo@example.com is on the Adjutor Karma blacklist')
    );

    const response = await request(app).post('/api/users/register').send({
      name: 'Blocked User',
      email: 'blocked@example.com',
      phone: '+2347098765432',
      bvn: '33312345678',
    });

    expect(response.status).toBe(403);
    expect(response.body.success).toBe(false);
  });

  it('requires authentication for wallet routes', async () => {
    const response = await request(app)
      .get('/api/wallets/balance')
      .expect(401);

    expect(response.body.success).toBe(false);
  });
});
