import { ListBucketsCommand, S3Client } from "@aws-sdk/client-s3";
import dotenv from "dotenv";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
dotenv.config({ path: path.join(root, ".env.local") });

function endpoint() {
  return (
    process.env.CLOULDFLARE_S3_URL?.trim() ||
    process.env.CLOUDFLARE_S3_URL?.trim() ||
    (process.env.CLOUDFLARE_ACCOUNT_ID
      ? `https://${process.env.CLOUDFLARE_ACCOUNT_ID.trim()}.r2.cloudflarestorage.com`
      : null)
  );
}

function credentials() {
  const accessKeyId =
    process.env.CLOUDFLARE_R2_ACCESS_KEY_ID?.trim() ||
    process.env.CLOULD_ACCESS_KEY_ID?.trim();
  const secretAccessKey =
    process.env.CLOUDFLARE_R2_SECRET_ACCESS_KEY?.trim() ||
    process.env.CLOULDFLARE_S3_SECRET_ACCESS_KEY?.trim() ||
    process.env.CLOULDFLARE_S3_SECRET_ACCESS_KEY?.trim();
  if (!accessKeyId || !secretAccessKey) return null;
  return { accessKeyId, secretAccessKey };
}

const ep = endpoint();
const creds = credentials();
if (!ep || !creds) {
  console.error("Missing R2 credentials in .env.local");
  process.exit(1);
}

const client = new S3Client({ region: "auto", endpoint: ep, credentials: creds });
const out = await client.send(new ListBucketsCommand({}));
const names = (out.Buckets ?? []).map((b) => b.Name).filter(Boolean).sort();
console.log(`Account endpoint: ${ep}`);
console.log(`Buckets (${names.length}):`);
for (const name of names) {
  console.log(`  - ${name}`);
}