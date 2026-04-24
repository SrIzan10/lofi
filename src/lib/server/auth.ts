import { APIError, betterAuth, type BetterAuthPlugin } from 'better-auth';
import { drizzleAdapter } from 'better-auth/adapters/drizzle';
import { createAuthEndpoint } from 'better-auth/api';
import { setSessionCookie } from 'better-auth/cookies';
import { anonymous } from 'better-auth/plugins';
import { sveltekitCookies } from 'better-auth/svelte-kit';
import type { D1Database } from '@cloudflare/workers-types';
import { env } from '$env/dynamic/private';
import { dev } from '$app/environment';
import { getRequestEvent } from '$app/server';
import { getDb } from '$lib/server/db';
import { passkey } from '@better-auth/passkey';
import * as z from 'zod';

const generateAccountNumber = () =>
  Array.from(crypto.getRandomValues(new Uint8Array(16)), (value) => (value % 10).toString()).join('');

const generateOpaqueIdentifier = () => `${crypto.randomUUID()}@internal.invalid`;

const getAnonymousDisplayName = (name?: string | null) => {
  const trimmedName = name?.trim();
  return trimmedName ? trimmedName : 'Chillhop listener';
};

type TurnstileVerifyResult = {
  success: boolean;
  hostname?: string;
  ['error-codes']?: string[];
};

const getClientIpAddress = () => {
  const headers = getRequestEvent().request.headers;
  return headers.get('CF-Connecting-IP') ?? headers.get('X-Forwarded-For') ?? undefined;
};

const verifyTurnstileToken = async (token: string) => {
  const secretKey = dev ? '1x0000000000000000000000000000000AA' : env.TURNSTILE_SECRET_KEY;

  if (!secretKey) {
    throw new APIError('INTERNAL_SERVER_ERROR', {
      message: 'Turnstile secret key is not configured',
    });
  }

  const verificationBody = new FormData();
  verificationBody.set('secret', secretKey);
  verificationBody.set('response', token);

  const remoteIp = getClientIpAddress();
  if (remoteIp) {
    verificationBody.set('remoteip', remoteIp);
  }

  verificationBody.set('idempotency_key', crypto.randomUUID());

  const response = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
    method: 'POST',
    body: verificationBody,
  });

  if (!response.ok) {
    throw new APIError('BAD_REQUEST', {
      message: 'Turnstile verification failed. Please try again.',
    });
  }

  const result = (await response.json()) as TurnstileVerifyResult;

  if (!result.success) {
    throw new APIError('BAD_REQUEST', {
      message:
        result['error-codes']?.includes('timeout-or-duplicate')
          ? 'Turnstile check expired. Please try again.'
          : 'Turnstile verification failed. Please try again.',
    });
  }
};

const createAnonymousSession = async (ctx: any, name?: string | null) => {
  const user = await ctx.context.internalAdapter.createUser({
    email: generateOpaqueIdentifier(),
    emailVerified: false,
    isAnonymous: true,
    name: getAnonymousDisplayName(name),
    createdAt: new Date(),
    updatedAt: new Date(),
  });

  if (!user) {
    throw new APIError('INTERNAL_SERVER_ERROR', {
      message: 'Failed to create user',
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

  return {
    token: session.token,
    user,
  };
};

const accountNumber = () =>
  ({
    id: 'account-number',
    endpoints: {
      createAccount: createAuthEndpoint(
        '/create-account',
        {
          method: 'POST',
          body: z.object({
            name: z.string().trim().max(100).optional(),
            turnstileToken: z.string().min(1),
          }),
        },
        async (ctx) => {
          await verifyTurnstileToken(ctx.body.turnstileToken);
          return ctx.json(await createAnonymousSession(ctx, ctx.body.name));
        },
      ),
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

const getAuthBaseURL = (requestOrigin?: string) => {
  if (dev) return requestOrigin ?? env.ORIGIN ?? 'http://localhost:5173';

  return env.ORIGIN || requestOrigin || 'http://localhost';
};

const createAuthConfig = (baseURL: string) =>
  ({
    baseURL,
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
        statisticsOptOut: {
          type: 'boolean',
          required: true,
          input: false,
          defaultValue: false,
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
        generateName: () => getAnonymousDisplayName(),
        generateRandomEmail: generateOpaqueIdentifier,
      }),
      accountNumber(),
      passkey({
        rpID: new URL(baseURL).hostname,
        rpName: 'Chillhop',
      }),
      sveltekitCookies(getRequestEvent), // make sure this is the last plugin in the array
    ],
  }) satisfies Omit<Parameters<typeof betterAuth>[0], 'database'>;

export const createAuth = (d1: D1Database, requestOrigin?: string) =>
  betterAuth({
    ...createAuthConfig(getAuthBaseURL(requestOrigin)),
    database: drizzleAdapter(getDb(d1), { provider: 'sqlite' }),
  });

/**
 * DO NOT USE!
 *
 * This instance is used by the `better-auth` CLI for schema generation ONLY.
 * To access `auth` at runtime, use `event.locals.auth`.
 */
export const auth = createAuth(null!, 'http://localhost');
