import {
  DeleteBucketCommand,
  DeleteObjectsCommand,
  ListObjectsV2Command,
} from "@aws-sdk/client-s3";
import dotenv from "dotenv";

import { createR2CatalogClient } from "./lib/r2Catalog";

dotenv.config({ path: ".env.local" });

async function emptyBucket(
  client: ReturnType<typeof createR2CatalogClient>,
  bucket: string,
): Promise<number> {
  let removed = 0;
  let token: string | undefined;

  do {
    const listed = await client.send(
      new ListObjectsV2Command({
        Bucket: bucket,
        ContinuationToken: token,
        MaxKeys: 1000,
      }),
    );

    const keys = (listed.Contents ?? [])
      .map((item) => item.Key)
      .filter((key): key is string => Boolean(key));

    if (keys.length > 0) {
      await client.send(
        new DeleteObjectsCommand({
          Bucket: bucket,
          Delete: {
            Objects: keys.map((Key) => ({ Key })),
            Quiet: true,
          },
        }),
      );
      removed += keys.length;
      console.log(`removed ${removed} objects from ${bucket}...`);
    }

    token = listed.IsTruncated ? listed.NextContinuationToken : undefined;
  } while (token);

  return removed;
}

async function deleteBucket(bucket: string) {
  const client = createR2CatalogClient();
  const removed = await emptyBucket(client, bucket);
  await client.send(new DeleteBucketCommand({ Bucket: bucket }));
  console.log(`deleted bucket "${bucket}" (objects removed: ${removed})`);
}

const buckets = process.argv.slice(2).filter((arg) => !arg.startsWith("-"));

if (buckets.length === 0) {
  console.error("Usage: npx tsx scripts/deleteR2Bucket.ts <bucket> [bucket...]");
  process.exit(1);
}

async function main() {
  for (const bucket of buckets) {
    if (bucket === "oando-asset-cdn") {
      console.error('Refusing to delete protected bucket "oando-asset-cdn".');
      process.exit(1);
    }
    await deleteBucket(bucket);
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});