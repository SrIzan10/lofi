import { APIError, betterAuth, type BetterAuthPlugin } from 'better-auth';
import { drizzleAdapter } from 'better-auth/adapters/drizzle';
import { createAuthEndpoint } from 'better-auth/api';
import { setSessionCookie } from 'better-auth/cookies';
import { anonymous } from 'better-auth/plugins';
import { sveltekitCookies } from 'better-auth/svelte-kit';
import type { D1Database } from '@cloudflare/workers-types';
import { env } from '$env/dynamic/private';
import { getRequestEvent } from '$app/server';
import { getDb } from '$lib/server/db';
import { passkey } from '@better-auth/passkey';
import * as z from 'zod';

const generateAccountNumber = () =>
  Array.from(crypto.getRandomValues(new Uint8Array(16)), (value) => (value % 10).toString()).join('');

const generateOpaqueIdentifier = () => `${crypto.randomUUID()}@internal.invalid`;

const accountNumber = () =>
  ({
    id: 'account-number',
    endpoints: {
      signInAccountNumber: createAuthEndpoint(
        '/sign-in/account-number',
        {
          method: 'POST',
          body: z.object({
            accountNumber: z.string().length(16),
          }),
        },
        async (ctx) => {
          const user = (await ctx.context.adapter.findOne({
            model: 'user',
            where: [
              {
                field: 'accountNumber',
                value: ctx.body.accountNumber,
              },
            ],
          })) as (Record<string, any> | null);

          if (!user) {
            throw new APIError('UNAUTHORIZED', {
              message: 'Invalid account number',
            });
          }

          const session = await ctx.context.internalAdapter.createSession(user.id);
          if (!session) {
            throw new APIError('INTERNAL_SERVER_ERROR', {
              message: 'Failed to create session',
            });
          }

          await setSessionCookie(
            ctx,
            { session, user } as Parameters<typeof setSessionCookie>[1],
          );

          return ctx.json({
            token: session.token,
            user,
          });
        },
      ),
    },
  }) satisfies BetterAuthPlugin;

const authConfig = {
  baseURL: env.ORIGIN,
  secret: env.BETTER_AUTH_SECRET,
  user: {
    additionalFields: {
      accountNumber: {
        type: 'string',
        required: true,
        input: false,
        unique: true,
        fieldName: 'account_number',
        defaultValue: generateAccountNumber,
      },
    },
  },
  logger: {
    level: 'debug',
  },
  onAPIError: {
    onError(error: unknown) {
      console.error('Better Auth API error', error);
    },
  },
  plugins: [
    anonymous({
      generateName: () => 'Chillhop listener',
      generateRandomEmail: generateOpaqueIdentifier,
    }),
    accountNumber(),
    passkey({
      rpID: new URL(env.ORIGIN).hostname,
      rpName: 'Chillhop',
    }),
    sveltekitCookies(getRequestEvent), // make sure this is the last plugin in the array
  ],
} satisfies Omit<Parameters<typeof betterAuth>[0], 'database'>;

export const createAuth = (d1: D1Database) =>
  betterAuth({
    ...authConfig,
    database: drizzleAdapter(getDb(d1), { provider: 'sqlite' }),
  });

/**
 * DO NOT USE!
 *
 * This instance is used by the `better-auth` CLI for schema generation ONLY.
 * To access `auth` at runtime, use `event.locals.auth`.
 */
export const auth = createAuth(null!);
