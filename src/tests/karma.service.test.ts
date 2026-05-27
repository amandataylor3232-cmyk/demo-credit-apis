import axios from 'axios';
import { lookupKarma } from '../services/karma.service';

jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

describe('Karma Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    process.env.ADJUTOR_API_KEY = 'test-api-key';
  });

  afterEach(() => {
    process.env.ADJUTOR_API_KEY = '';
  });

  it('returns blacklisted when Adjutor returns a karma record', async () => {
    mockedAxios.get.mockResolvedValue({
      data: {
        status: 'success',
        data: {
          karma_identity: 'bad@example.com',
          reason: 'Fraud',
        },
      },
    });

    const result = await lookupKarma('bad@example.com');

    expect(result.blacklisted).toBe(true);
    expect(result.reason).toBe('Fraud');
    expect(mockedAxios.get).toHaveBeenCalledWith(
      expect.stringContaining('/verification/karma/bad%40example.com'),
      expect.objectContaining({
        headers: {
          Authorization: 'Bearer test-api-key',
        },
      })
    );
  });

  it('returns not blacklisted when Adjutor responds with 404', async () => {
    mockedAxios.get.mockRejectedValue({
      isAxiosError: true,
      response: {
        status: 404,
        data: { message: 'Not found' },
      },
    });

    mockedAxios.isAxiosError.mockReturnValue(true);

    const result = await lookupKarma('clean@example.com');

    expect(result.blacklisted).toBe(false);
  });

  it('skips Adjutor lookup when API key is not configured', async () => {
    process.env.ADJUTOR_API_KEY = '';

    const result = await lookupKarma('clean@example.com');

    expect(result.blacklisted).toBe(false);
    expect(mockedAxios.get).not.toHaveBeenCalled();
  });
});
