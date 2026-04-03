import { createAuthClient } from 'better-auth/svelte';
import { passkeyClient } from '@better-auth/passkey/client';

export const authClient = createAuthClient({
  plugins: [passkeyClient()],
});

