import path from 'path';
import dotenv from 'dotenv';
import axios from 'axios';

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const identities = process.argv.slice(2).length
  ? process.argv.slice(2)
  : ['test-user@example.com', '+2348012345678', '22212345678'];

const run = async (): Promise<void> => {
  const apiKey = process.env.ADJUTOR_API_KEY;
  const baseUrl =
    process.env.ADJUTOR_BASE_URL ?? 'https://adjutor.lendsqr.com/v2';

  if (!apiKey) {
    console.log('ADJUTOR_API_KEY is not set — Karma checks are skipped.');
    return;
  }

  for (const identity of identities) {
    try {
      const response = await axios.get(
        `${baseUrl}/verification/karma/${encodeURIComponent(identity)}`,
        {
          headers: { Authorization: `Bearer ${apiKey}` },
          timeout: 15000,
          validateStatus: () => true,
        }
      );

      console.log('\n---', identity);
      console.log('HTTP status:', response.status);
      console.log('API status:', response.data?.status);
      console.log('API message:', response.data?.message);
      console.log('Has data object:', Boolean(response.data?.data));

      if (response.data?.data) {
        console.log('Karma identity:', response.data.data.karma_identity);
        console.log('Reason:', response.data.data.reason);
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      console.log('\n---', identity);
      console.log('Request failed:', message);
    }
  }
};

run();
