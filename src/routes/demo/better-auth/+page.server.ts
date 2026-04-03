import { redirect } from '@sveltejs/kit';
import type { Actions } from './$types';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = (event) => {
  if (!event.locals.user) {
    return redirect(302, '/demo/better-auth/login');
  }
  return { user: event.locals.user };
};

export const actions: Actions = {
  signOut: async (event) => {
    const { auth } = event.locals;

    await auth.api.signOut({
      headers: event.request.headers,
    });
    return redirect(302, '/demo/better-auth/login');
  },
};
