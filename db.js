// db.js
import pkg from "pg";
const { Pool } = pkg;

const globalForDb = globalThis;

const pool =
  globalForDb.__dbPool ||
  new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false },
    max: 5,
    idleTimeoutMillis: 10000,
    connectionTimeoutMillis: 10000,
  });

globalForDb.__dbPool = pool;

export default pool;
