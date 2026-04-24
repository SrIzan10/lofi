import { readdirSync } from 'node:fs';
import { join } from 'node:path';
import { defineConfig } from 'drizzle-kit';

const localD1Dir = '.wrangler/state/v3/d1/miniflare-D1DatabaseObject';

const localD1File = readdirSync(localD1Dir).find(
  (file) => file.endsWith('.sqlite') && file !== 'metadata.sqlite',
);

if (!localD1File) {
  throw new Error(`No local D1 sqlite file found in ${localD1Dir}`);
}

export default defineConfig({
  schema: './src/lib/server/db/schema.ts',
  out: './drizzle',
  dialect: 'sqlite',
  dbCredentials: {
    url: join(localD1Dir, localD1File),
  },
  verbose: true,
  strict: true,
});
