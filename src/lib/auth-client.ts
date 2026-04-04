import type { BetterAuthClientPlugin } from 'better-auth/client';
import { anonymousClient, inferAdditionalFields } from 'better-auth/client/plugins';
import { createAuthClient } from 'better-auth/svelte';
import { passkeyClient } from '@better-auth/passkey/client';
import type { auth } from '$lib/server/auth';

const accountNumberClient = {
  id: 'account-number',
  getActions: ($fetch) => ({
    createAccount: async (name?: string, turnstileToken?: string) =>
      $fetch('/create-account', {
        method: 'POST',
        body: {
          name,
          turnstileToken,
        },
      }),
    signInAccountNumber: async (accountNumber: string) =>
      $fetch('/sign-in/account-number', {
        method: 'POST',
        body: {
          accountNumber,
        },
      }),
  }),
} satisfies BetterAuthClientPlugin;

export const authClient = createAuthClient({
  plugins: [inferAdditionalFields<typeof auth>(), anonymousClient(), passkeyClient(), accountNumberClient],
});
