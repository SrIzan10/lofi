import { fail, redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';

import { APIError } from 'better-auth';

const getErrorMessage = (error: unknown, fallback: string) => {
  if (error instanceof APIError) return error.message || fallback;
  if (error instanceof Error) return error.message || fallback;
  if (typeof error === 'object' && error && 'message' in error && typeof error.message === 'string') {
    return error.message || fallback;
  }
  return fallback;
};

export const load: PageServerLoad = (event) => {
  if (event.locals.user) {
    return redirect(302, '/demo/better-auth');
  }
  return {};
};

export const actions: Actions = {
  signInAccountNumber: async (event) => {
    const { auth } = event.locals;

    const formData = await event.request.formData();
    const accountNumber = formData.get('accountNumber')?.toString().replace(/\D/g, '') ?? '';

    try {
      await auth.api.signInAccountNumber({
        body: {
          accountNumber,
        },
      });
    } catch (error) {
      console.error('Demo Better Auth account number sign-in failed', { accountNumber, error });
      return fail(error instanceof APIError ? 400 : 500, {
        message: getErrorMessage(error, 'Account number sign-in failed'),
      });
    }

    return redirect(302, '/demo/better-auth');
  },
  createAccount: async (event) => {
    const { auth } = event.locals;

    try {
      await auth.api.signInAnonymous();
    } catch (error) {
      console.error('Demo Better Auth account creation failed', { error });
      return fail(error instanceof APIError ? 400 : 500, {
        message: getErrorMessage(error, 'Account creation failed'),
      });
    }

    return redirect(302, '/demo/better-auth');
  },
};
