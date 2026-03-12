import postgres from 'postgres';

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error('DATABASE_URL environment variable is not set');
}

export const sql = postgres(connectionString);

export async function testConnection() {
  try {
    const result = await sql`SELECT version()`;
    console.log('PostgreSQL connected:', result[0].version);
    return true;
  } catch (error) {
    console.error('PostgreSQL connection error:', error);
    return false;
  }
}
