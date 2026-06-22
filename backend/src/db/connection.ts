import pg from 'pg';

const { Pool } = pg;

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432', 10),
  database: process.env.DB_NAME || 'umbrella',
  user: process.env.DB_USER || 'umbrella_user',
  password: process.env.DB_PASSWORD || 'umbrella_pass',
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 5000,
});

pool.on('error', (err: Error) => {
  console.error('Erreur inattendue du pool de connexions PostgreSQL :', err);
  process.exit(-1);
});

/**
 * Execute a SQL query with optional parameters.
 */
export async function query(text: string, params?: unknown[]): Promise<pg.QueryResult> {
  const start = Date.now();
  const result = await pool.query(text, params);
  const duration = Date.now() - start;
  if (duration > 200) {
    console.log(`Requête lente (${duration}ms) : ${text}`);
  }
  return result;
}

/**
 * Get a raw client from the pool for transaction usage.
 * Remember to call `client.release()` when done.
 */
export async function getClient(): Promise<pg.PoolClient> {
  return pool.connect();
}

export default pool;
