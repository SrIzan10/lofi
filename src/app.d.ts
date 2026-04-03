import type { auth } from '$lib/server/auth';
import { createAuth } from '$lib/server/auth';

type Session = typeof auth.$Infer.Session.session;
type User = typeof auth.$Infer.Session.user;

// See https://svelte.dev/docs/kit/types#app.d.ts
// for information about these interfaces
declare global {
  namespace App {
    // interface Error {}
    // interface PageData {}
    // interface PageState {}
    interface Platform {
      caches: CacheStorage & { default: Cache };
      env: Env;
      ctx: ExecutionContext;
      caches: CacheStorage;
      cf?: IncomingRequestCfProperties;
    }

    interface Locals {
      user?: User;
      session?: Session;
      auth: ReturnType<typeof createAuth>;
    }
  }
}

export {};
