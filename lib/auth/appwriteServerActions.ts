"use server";

import { cookies } from "next/headers";
import { Client, Account, ID } from "node-appwrite";
import { getAppwriteRuntimeConfig } from '@/platform/appwrite/client';
import { getCustomerSafeAuthError } from "@/lib/auth/customerSafeAuthError";

function createAdminClient() {
  const config = getAppwriteRuntimeConfig();
  if (!config.isConfigured) throw new Error("Appwrite not configured");

  const apiKey = process.env.APPWRITE_SECRET_KEY;
  if (!apiKey) {
    console.warn("APPWRITE_SECRET_KEY is missing. Session creation will return an empty secret.");
  }

  const client = new Client()
    .setEndpoint(config.endpoint)
    .setProject(config.projectId);

  if (apiKey) {
    client.setKey(apiKey);
  }

  return client;
}

export async function loginWithAppwrite(email: string, password: string) {
  try {
    const config = getAppwriteRuntimeConfig();
    const client = createAdminClient();
    const account = new Account(client);

    const session = await account.createEmailPasswordSession(email, password);

    // Set the cookie on the Next.js domain
    const cookieStore = await cookies();
    cookieStore.set(`a_session_${config.projectId}`, session.secret, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      expires: new Date(session.expire),
      path: "/",
    });

    return { success: true };
  } catch (error: unknown) {
    return { success: false, error: getCustomerSafeAuthError(error) };
  }
}

export async function signupWithAppwrite(email: string, password: string) {
  try {
    const client = createAdminClient();
    const account = new Account(client);

    await account.create(ID.unique(), email, password);
    // Optionally automatically log them in after signup:
    // return loginWithAppwrite(email, password);
    
    return { success: true };
  } catch (error: unknown) {
    return { success: false, error: getCustomerSafeAuthError(error) };
  }
}

export async function logoutFromAppwrite() {
  try {
    const config = getAppwriteRuntimeConfig();
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get(`a_session_${config.projectId}`);

    if (sessionCookie?.value) {
      const client = createAdminClient().setSession(sessionCookie.value);
      const account = new Account(client);
      await account.deleteSession("current");
    }

    cookieStore.delete(`a_session_${config.projectId}`);
    return { success: true };
  } catch (_error) {
    return { success: false };
  }
}
