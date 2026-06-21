import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import {
  enforceAdminRateLimit,
  requireAdminSession,
} from "@/app/api/admin/_lib/server";

function isThemeName(value: unknown): value is string {
  return typeof value === "string" && /^[a-z0-9][a-z0-9-_]{1,63}$/i.test(value.trim());
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return !!value && typeof value === "object" && !Array.isArray(value);
}

export async function POST(req: NextRequest) {
  const rateError = await enforceAdminRateLimit(req, "themes:publish", 10);
  if (rateError) return rateError;
  const authError = await requireAdminSession();
  if (authError) return authError;

  try {
    const body = await req.json().catch(() => ({}));
    const themeName = (body as { themeName?: unknown }).themeName;
    const tokens = (body as { tokens?: unknown }).tokens;

    if (!isThemeName(themeName) || !isPlainObject(tokens)) {
      return NextResponse.json({ success: false, error: "Missing themeName or tokens" }, { status: 400 });
    }

    const fileKey = `themes/${themeName.trim()}.json`;
    const payload = JSON.stringify(tokens, null, 2);

    const uploadPromises: Promise<unknown>[] = [];

    // --- 1. DigitalOcean Spaces Upload ---
    const doEndpointUrl = process.env.ORIGIN_ENDPOINT; 
    if (doEndpointUrl) {
      const urlObj = new URL(doEndpointUrl);
      const hostnameParts = urlObj.hostname.split('.');
      const doBucket = hostnameParts[0]; 
      const doRegionalEndpoint = `https://${hostnameParts.slice(1).join('.')}`;

      const doClient = new S3Client({
          endpoint: doRegionalEndpoint,
          region: "sgp1", 
          credentials: {
              accessKeyId:
                process.env.DO_OANDO_ACCESS_KEY_ID ||
                process.env["DO.OANDO_ACCESS_KEY_ID"] ||
                "",
              secretAccessKey:
                process.env.DO_OANDO_SECRET_KEY ||
                process.env["DO.OANDO_SECRET_KEY"] ||
                "",
          }
      });

      const doParams = {
        Bucket: doBucket,
        Key: fileKey,
        Body: payload,
        ACL: "public-read" as const,
        ContentType: "application/json",
        CacheControl: "public, max-age=60" 
      };

      uploadPromises.push(
        doClient.send(new PutObjectCommand(doParams))
          .then(() => console.log("DO Upload Success"))
          .catch(err => console.error("DO Upload Failed:", err))
      );
    }

    // --- 2. Cloudflare R2 Upload ---
    const r2EndpointUrl = process.env.CLOULDFLARE_S3_URL?.trim();
    if (r2EndpointUrl) {
      const r2Client = new S3Client({
          endpoint: r2EndpointUrl,
          region: "auto", 
          credentials: {
              accessKeyId: process.env.CLOULD_ACCESS_KEY_ID || "",
              secretAccessKey: process.env.CLOULDFLARE_S3_SECRET_ACCESS_KEY || "",
          }
      });

      const r2Params = {
        Bucket: process.env.CLOULDFLARE_R2_BUCKET || process.env.CLOUDFLARE_R2_CATALOG_BUCKET || "oando-asset-cdn",
        Key: fileKey,
        Body: payload,
        ContentType: "application/json",
        CacheControl: "public, max-age=60" 
      };

      uploadPromises.push(
        r2Client.send(new PutObjectCommand(r2Params))
          .then(() => console.log("R2 Upload Success"))
          .catch(err => console.error("R2 Upload Failed:", err))
      );
    }

    // Wait for both CDNs to process the upload
    await Promise.all(uploadPromises);

    const cdnUrl = `${process.env.CDN_ENDPOINT || process.env.CLOULDFLARE_S3_URL}/${fileKey}`;

    return NextResponse.json({ 
      success: true, 
      message: "Theme successfully published to both DO Spaces and Cloudflare R2.", 
      url: cdnUrl
    });
  } catch (err: unknown) {
    console.error("CDN Upload Error:", err);
    const message = err instanceof Error ? err.message : "CDN upload failed";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }

}
