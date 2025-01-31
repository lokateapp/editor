import type { Config } from 'drizzle-kit';
import 'dotenv/config';

const connectionUrl = process.env.POSTGRES_URL;
if (!connectionUrl) {
	throw new Error('POSTGRES_URL environment variable is not defined.');
}

export default {
	schema: './src/lib/schema.ts',
	out: './drizzle',
	driver: 'pg',
	dbCredentials: {
		host: process.env.POSTGRES_HOST || 'localhost',
		database: connectionUrl
	}
} satisfies Config;
