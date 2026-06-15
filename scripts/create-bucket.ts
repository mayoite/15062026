import { S3Client, CreateBucketCommand } from "@aws-sdk/client-s3";
import * as dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

async function createBucket() {
// eslint-disable-next-line no-console
  console.log("Attempting to create bucket 'oando-themes' in Cloudflare R2...");
  
  const r2Client = new S3Client({
    region: "auto",
// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    endpoint: process.env.CLOULDFLARE_S3_URL!,
    credentials: {
// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      accessKeyId: process.env.CLOULD_ACCESS_KEY_ID!,
// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      secretAccessKey: process.env.CLOULDFLARE_S3_SECRET_ACCESS_KEY!
    }
  });

  try {
    await r2Client.send(new CreateBucketCommand({ Bucket: "oando-themes" }));
// eslint-disable-next-line no-console
    console.log("✅ SUCCESS! Bucket 'oando-themes' was created in Cloudflare R2.");
  } catch (err: unknown) {
    console.error("❌ FAILED to create bucket. Your keys might only have 'Object' permissions, not 'Bucket/Admin' permissions.");
    console.error("Error Details:", err.message);
  }
}

createBucket();
