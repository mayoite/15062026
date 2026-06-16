import { ListObjectsV2Command, S3Client } from "@aws-sdk/client-s3";
import dotenv from "dotenv";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
dotenv.config({ path: path.join(root, ".env.local") });

const bucket = process.argv[2] || process.env.CLOUDFLARE_R2_CATALOG_BUCKET || "oando-asset-cdn";

const endpoint =
  process.env.CLOULDFLARE_S3_URL?.trim() ||
  process.env.CLOUDFLARE_S3_URL?.trim() ||
  `https://${process.env.CLOUDFLARE_ACCOUNT_ID}.r2.cloudflarestorage.com`;

const client = new S3Client({
  region: "auto",
  endpoint,
  credentials: {
    accessKeyId: process.env.CLOULD_ACCESS_KEY_ID || process.env.CLOUDFLARE_R2_ACCESS_KEY_ID,
    secretAccessKey:
      process.env.CLOULDFLARE_S3_SECRET_ACCESS_KEY ||
      process.env.CLOUDFLARE_R2_SECRET_ACCESS_KEY,
  },
});

let token;
let total = 0;
const samples = [];

do {
  const out = await client.send(
    new ListObjectsV2Command({ Bucket: bucket, ContinuationToken: token, MaxKeys: 200 }),
  );
  total += out.KeyCount ?? 0;
  for (const item of out.Contents ?? []) {
    if (item.Key && samples.length < 8) samples.push(item.Key);
  }
  token = out.IsTruncated ? out.NextContinuationToken : undefined;
} while (token);

console.log(`bucket=${bucket} objects=${total}`);
for (const key of samples) console.log(`  ${key}`);