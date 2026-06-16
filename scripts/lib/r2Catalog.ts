import { S3Client } from "@aws-sdk/client-s3";

export const DEFAULT_CATALOG_BUCKET = "oando-asset-cdn";

export function resolveCatalogBucketName(): string {
  const cliArg = process.argv.find((arg) => arg.startsWith("--bucket="));
  if (cliArg) {
    return cliArg.slice("--bucket=".length).trim();
  }

  return (
    process.env.CLOUDFLARE_R2_CATALOG_BUCKET?.trim() ||
    process.env.CLOUDFLARE_R2_BUCKET?.trim() ||
    process.env.R2_CATALOG_BUCKET?.trim() ||
    DEFAULT_CATALOG_BUCKET
  );
}

export function resolveR2Endpoint(): string | null {
  const explicit =
    process.env.CLOULDFLARE_S3_URL?.trim() ||
    process.env.CLOUDFLARE_S3_URL?.trim();

  if (explicit) {
    return explicit;
  }

  const accountId = process.env.CLOUDFLARE_ACCOUNT_ID?.trim();
  if (accountId) {
    return `https://${accountId}.r2.cloudflarestorage.com`;
  }

  return null;
}

export function resolveR2Credentials(): { accessKeyId: string; secretAccessKey: string } | null {
  const accessKeyId =
    process.env.CLOUDFLARE_R2_ACCESS_KEY_ID?.trim() ||
    process.env.CLOULD_ACCESS_KEY_ID?.trim() ||
    process.env.CLOUDFLARE_ACCESS_KEY_ID?.trim();

  const secretAccessKey =
    process.env.CLOUDFLARE_R2_SECRET_ACCESS_KEY?.trim() ||
    process.env.CLOULDFLARE_S3_SECRET_ACCESS_KEY?.trim() ||
    process.env.CLOULDFLARE_S3_SECRET_ACCESS_KEY?.trim();

  if (!accessKeyId || !secretAccessKey) {
    return null;
  }

  return { accessKeyId, secretAccessKey };
}

export function createR2CatalogClient(): S3Client {
  const endpoint = resolveR2Endpoint();
  const credentials = resolveR2Credentials();

  if (!endpoint || !credentials) {
    throw new Error(
      "Missing R2 config in .env.local (S3 URL or account id, access key, secret key).",
    );
  }

  return new S3Client({
    region: "auto",
    endpoint,
    credentials,
  });
}

export function contentTypeForKey(key: string): string {
  const lower = key.toLowerCase();
  if (lower.endsWith(".jpg") || lower.endsWith(".jpeg")) return "image/jpeg";
  if (lower.endsWith(".png")) return "image/png";
  if (lower.endsWith(".webp")) return "image/webp";
  if (lower.endsWith(".gif")) return "image/gif";
  if (lower.endsWith(".avif")) return "image/avif";
  if (lower.endsWith(".svg")) return "image/svg+xml";
  if (lower.endsWith(".glb")) return "model/gltf-binary";
  if (lower.endsWith(".gltf")) return "model/gltf+json";
  if (lower.endsWith(".hdr")) return "application/octet-stream";
  if (lower.endsWith(".wasm")) return "application/wasm";
  if (lower.endsWith(".js")) return "text/javascript";
  if (lower.endsWith(".json")) return "application/json";
  if (lower.endsWith(".pdf")) return "application/pdf";
  return "application/octet-stream";
}