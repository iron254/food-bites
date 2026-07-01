import mysql from "mysql2/promise";

/**
 * Database connection pool configuration for scalability
 * Reuses connections across requests to reduce overhead
 */

let pool: mysql.Pool | null = null;

export async function getPooledConnection() {
  if (!pool) {
    pool = mysql.createPool({
      host: process.env.DB_HOST || "localhost",
      user: process.env.DB_USER || "root",
      password: process.env.DB_PASSWORD || "",
      database: process.env.DB_NAME || "food_bites",
      waitForConnections: true,
      connectionLimit: 20, // Maximum connections in pool
      queueLimit: 0, // Unlimited queue
      enableKeepAlive: true,
      keepAliveInitialDelay: 0,
      // Connection timeout
      connectTimeout: 10000,
    });
  }
  return pool;
}

export async function executeQuery<T>(
  query: string,
  values?: any[]
): Promise<T[]> {
  const pool = await getPooledConnection();
  const connection = await pool.getConnection();

  try {
    const [rows] = await connection.execute(query, values || []);
    return rows as T[];
  } finally {
    connection.release();
  }
}

export async function closePool() {
  if (pool) {
    await pool.end();
    pool = null;
  }
}

/**
 * Performance monitoring for database connections
 */
export function getPoolStats() {
  if (!pool) return null;

  return {
    connectionLimit: 20,
    // Pool stats are internal, use for monitoring only
    timestamp: new Date().toISOString(),
  };
}
