import type { NodePgDatabase } from "drizzle-orm/node-postgres";
import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import { env } from "@reactive-resume/env/server";
import { relations } from "./relations";

declare global {
	var __pool: Pool | undefined;
	var __drizzle: NodePgDatabase<typeof relations> | undefined;
}

export function getPool() {
	if (!globalThis.__pool) {
		globalThis.__pool = new Pool({ connectionString: env.DATABASE_URL });
	}
	return globalThis.__pool;
}

function makeDrizzleClient() {
	return drizzle({ client: getPool(), relations });
}

export function createDatabase() {
	if (!globalThis.__drizzle) {
		globalThis.__drizzle = makeDrizzleClient();
	}
	return globalThis.__drizzle;
}

export const db = createDatabase();
