import { fail, redirect } from '@sveltejs/kit';
import type { Actions } from './$types';
import type { PageServerLoad } from './$types';

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
  signInEmail: async (event) => {
    const { auth } = event.locals;

    const formData = await event.request.formData();
    const email = formData.get('email')?.toString() ?? '';
    const password = formData.get('password')?.toString() ?? '';

    try {
      await auth.api.signInEmail({
        body: {
          email,
          password,
          callbackURL: '/auth/verification-success',
        },
      });
    } catch (error) {
      console.error('Demo Better Auth sign-in failed', { email, error });
      return fail(error instanceof APIError ? 400 : 500, {
        message: getErrorMessage(error, 'Signin failed'),
      });
    }

    return redirect(302, '/demo/better-auth');
  },
  signUpEmail: async (event) => {
    const { auth } = event.locals;

    const formData = await event.request.formData();
    const email = formData.get('email')?.toString() ?? '';
    const password = formData.get('password')?.toString() ?? '';
    const name = formData.get('name')?.toString() ?? '';

    try {
      await auth.api.signUpEmail({
        body: {
          email,
          password,
          name,
          callbackURL: '/auth/verification-success',
        },
      });
    } catch (error) {
      console.error('Demo Better Auth sign-up failed', { email, error });
      return fail(error instanceof APIError ? 400 : 500, {
        message: getErrorMessage(error, 'Registration failed'),
      });
    }

    return redirect(302, '/demo/better-auth');
  },
};
