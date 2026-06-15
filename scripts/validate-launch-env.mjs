#!/usr/bin/env node

import { config as loadEnv } from "dotenv";

loadEnv({ path: ".env.local", override: false, quiet: true });
loadEnv({ override: false, quiet: true });

const REQUIRED_PUBLIC_ENVS = [
  "NEXT_PUBLIC_APPWRITE_ENDPOINT",
  "NEXT_PUBLIC_APPWRITE_PROJECT_ID",
  "NEXT_PUBLIC_SUPABASE_URL",
  "NEXT_PUBLIC_SUPABASE_ANON_KEY",
];

const REQUIRED_SERVER_ENVS = [
  "SUPABASE_URL",
  "SUPABASE_SERVICE_ROLE_KEY",
  "APPWRITE_PROJECT_ID",
  "APPWRITE_SECRET_KEY",
];

const FORBIDDEN_PUBLIC_SECRET_PATTERNS = [
  /^NEXT_PUBLIC_.*SECRET/i,
  /^NEXT_PUBLIC_.*SERVICE_ROLE/i,
  /^NEXT_PUBLIC_.*PRIVATE/i,
  /^NEXT_PUBLIC_.*TOKEN/i,
];

function hasValue(name) {
  return Boolean(process.env[name]?.trim());
}

function mask(value) {
  if (!value) return "";
  if (value.length <= 8) return "***";
  return `${value.slice(0, 4)}...${value.slice(-4)}`;
}

const missingPublic = REQUIRED_PUBLIC_ENVS.filter((name) => !hasValue(name));
const missingServer = REQUIRED_SERVER_ENVS.filter((name) => !hasValue(name));
const forbiddenPublic = Object.keys(process.env).filter((name) =>
  FORBIDDEN_PUBLIC_SECRET_PATTERNS.some((pattern) => pattern.test(name)),
);

const appwriteEndpoint =
  process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT || "https://cloud.appwrite.io/v1";
const appwriteProjectId = process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID || "";
const serverAppwriteProjectId = process.env.APPWRITE_PROJECT_ID || "";

const mismatches = [];
if (
  appwriteProjectId &&
  serverAppwriteProjectId &&
  appwriteProjectId !== serverAppwriteProjectId
) {
  mismatches.push({
    name: "APPWRITE_PROJECT_ID",
    publicValue: mask(appwriteProjectId),
    serverValue: mask(serverAppwriteProjectId),
  });
}

const result = {
  ok:
    missingPublic.length === 0 &&
    missingServer.length === 0 &&
    forbiddenPublic.length === 0 &&
    mismatches.length === 0,
  checkedAt: new Date().toISOString(),
  appwriteEndpoint,
  requiredPublic: REQUIRED_PUBLIC_ENVS,
  requiredServer: REQUIRED_SERVER_ENVS,
  missingPublic,
  missingServer,
  forbiddenPublic,
  mismatches,
};

process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);

if (!result.ok) {
  process.exitCode = 1;
}
