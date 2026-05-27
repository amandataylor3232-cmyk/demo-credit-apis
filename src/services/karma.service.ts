import axios, { AxiosError } from 'axios';
import { env } from '../config/env';
import { AppError } from '../utils/errors';

export type KarmaLookupResult = {
  blacklisted: boolean;
  identity: string;
  reason?: string | null;
};

type KarmaApiResponse = {
  status?: string;
  message?: string;
  data?: {
    karma_identity?: string;
    reason?: string | null;
  };
};

const encodeIdentity = (identity: string): string =>
  encodeURIComponent(identity.trim());

export const lookupKarma = async (
  identity: string
): Promise<KarmaLookupResult> => {
  const apiKey = process.env.ADJUTOR_API_KEY ?? env.adjutor.apiKey;

  if (!apiKey) {
    return { blacklisted: false, identity };
  }

  try {
    const response = await axios.get<KarmaApiResponse>(
      `${env.adjutor.baseUrl}/verification/karma/${encodeIdentity(identity)}`,
      {
        headers: {
          Authorization: `Bearer ${apiKey}`,
        },
        timeout: 10000,
      }
    );

    const isBlacklisted =
      response.data.status === 'success' && Boolean(response.data.data);

    return {
      blacklisted: isBlacklisted,
      identity,
      reason: response.data.data?.reason,
    };
  } catch (error) {
    if (axios.isAxiosError(error)) {
      const axiosError = error as AxiosError<KarmaApiResponse>;
      const httpStatus = axiosError.response?.status;
      const apiMessage = axiosError.response?.data?.message ?? '';

      if (httpStatus === 404) {
        return { blacklisted: false, identity };
      }

      const message = apiMessage.toLowerCase();

      if (
        message.includes('not found') ||
        message.includes('no record') ||
        message.includes('not blacklisted')
      ) {
        return { blacklisted: false, identity };
      }

      if (httpStatus === 401 || httpStatus === 403) {
        throw new AppError(
          `Adjutor Karma check failed: ${apiMessage || 'Invalid API key or missing Karma permission on your Adjutor app'}`,
          503
        );
      }
    }

    throw new AppError(
      'Unable to reach Adjutor Karma service. Try again later or contact support.',
      503
    );
  }
};

export const assertNotBlacklisted = async (
  identities: string[]
): Promise<void> => {
  for (const identity of identities) {
    const result = await lookupKarma(identity);

    if (result.blacklisted) {
      const reason = result.reason ? `: ${result.reason}` : '';
      throw new Error(
        `Identity ${identity} is on the Adjutor Karma blacklist${reason}`
      );
    }
  }
};
