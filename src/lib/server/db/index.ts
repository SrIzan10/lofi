import { drizzle, DrizzleD1Database } from 'drizzle-orm/d1';
import * as schema from './schema';

export const getDb = (d1: DrizzleD1Database) => drizzle(d1, { schema });
