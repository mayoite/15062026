import { config as loadEnv } from "dotenv";
import { createSupabaseAdminClient } from "@/platform/supabase/supabaseAdmin";
import { getE2EAuthEnv, getE2EAuthSeedEnv } from "@/lib/auth/e2eAuthEnv";

loadEnv({ path: ".env.local", override: false, quiet: true });
loadEnv({ override: false, quiet: true });

type ManagedUser = {
  email: string;
  password: string;
  role: string;
  reusableEmails?: string[];
};

async function ensureSupabaseUser(
  admin: ReturnType<typeof createSupabaseAdminClient>,
  user: ManagedUser,
) {
  try {
    const role = user.role.toLowerCase();
    const list = await admin.auth.admin.listUsers({ perPage: 1000 });
    if (list.error) {
      throw new Error(`Unable to list users: ${list.error.message}`);
    }

    const existing = list.data.users.find(
      (u: any) => u.email?.toLowerCase() === user.email.toLowerCase(),
    );

    if (!existing) {
      const created = await admin.auth.admin.createUser({
        email: user.email,
        password: user.password,
        email_confirm: true,
        user_metadata: { name: user.role, role },
        app_metadata: { role },
      });

      if (created.error) {
        throw new Error(`Unable to create ${user.role} test user: ${created.error.message}`);
      }
    } else {
      const updated = await admin.auth.admin.updateUserById(existing.id, {
        password: user.password,
        email_confirm: true,
        user_metadata: { name: user.role, role },
        app_metadata: { role },
      });

      if (updated.error) {
        throw new Error(`Unable to update ${user.role} test user: ${updated.error.message}`);
      }
    }
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    throw new Error(`Unable to ensure ${user.role} test user: ${message}`);
  }
}

async function main() {
  const authEnv = getE2EAuthEnv();
  // Ensures SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY are present for seeding.
  getE2EAuthSeedEnv();

  const admin = createSupabaseAdminClient();

  const users: ManagedUser[] = [
    {
      email: authEnv.adminEmail,
      password: authEnv.adminPassword,
      role: "Admin",
    },
    {
      email: authEnv.userEmail,
      password: authEnv.userPassword,
      role: "User",
      reusableEmails: ["demo@oando.co.in"],
    },
  ];

  for (const user of users) {
    await ensureSupabaseUser(admin, user);
  }

  process.stdout.write("Supabase E2E auth users are provisioned.\n");
}

void main().catch((error) => {
  const message = error instanceof Error ? error.message : String(error);
  process.stderr.write(`${message}\n`);
  process.exitCode = 1;
});
