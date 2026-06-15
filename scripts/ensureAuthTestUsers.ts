import { config as loadEnv } from "dotenv";
import { createClient } from "@supabase/supabase-js";
import { getE2EAuthEnv, getE2EAuthSeedEnv } from "@/lib/auth/e2eAuthEnv";
import type { Database } from "@/lib/supabase/types";

loadEnv({ path: ".env.local", override: false, quiet: true });
loadEnv({ override: false, quiet: true });

type ManagedUser = {
  email: string;
  password: string;
  label: string;
  reusableEmails?: string[];
};

import { Client, Users, ID } from "node-appwrite";

async function ensureAppwriteUser(
  usersClient: Users,
  user: ManagedUser,
) {
  try {
    const list = await usersClient.list();
    const existing = list.users.find(u => u.email.toLowerCase() === user.email.toLowerCase());

    if (!existing) {
      const newUser = await usersClient.create(
        ID.unique(),
        user.email,
        undefined, // phone
        user.password,
        user.label // name
      );

      // Map roles to labels or prefs as decided earlier
      await usersClient.updateLabels(newUser.$id, [user.label.toLowerCase()]);
    } else {
      await usersClient.updatePassword(existing.$id, user.password);
      await usersClient.updateLabels(existing.$id, [user.label.toLowerCase()]);
    }
  } catch (error: any) {
    throw new Error(`Unable to ensure ${user.label} test user: ${error.message}`);
  }
}

async function main() {
  const authEnv = getE2EAuthEnv();
  const seedEnv = getE2EAuthSeedEnv();

  const endpoint = process.env.APPWRITE_URL || process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT || "";
  const projectId = process.env.APPWRITE_PROJECT_ID || process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID || "";
  const apiKey = process.env.APPWRITE_SECRET_KEY || "";

  const client = new Client()
    .setEndpoint(endpoint)
    .setProject(projectId)
    .setKey(apiKey);

  const usersClient = new Users(client);

  const users: ManagedUser[] = [
    {
      email: authEnv.adminEmail,
      password: authEnv.adminPassword,
      label: "Admin",
    },
    {
      email: authEnv.userEmail,
      password: authEnv.userPassword,
      label: "User",
      reusableEmails: ["demo@oando.co.in"],
    },
  ];

  for (const user of users) {
    await ensureAppwriteUser(usersClient, user);
  }

  process.stdout.write("Appwrite E2E auth users are provisioned.\n");
}

void main().catch((error) => {
  const message = error instanceof Error ? error.message : String(error);
  process.stderr.write(`${message}\n`);
  process.exitCode = 1;
});
