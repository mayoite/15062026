import postgres from 'postgres';
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

async function test() {
  console.log("Connecting to DigitalOcean...");
  try {
    const sql = postgres(process.env.DATABASE_URL, { ssl: 'require', connect_timeout: 10 });
    const result = await sql`SELECT version()`;
    console.log("Success! Connected to:", result[0].version);
    process.exit(0);
  } catch (err) {
    console.error("Connection failed:", err.message);
    process.exit(1);
  }
}

test();
