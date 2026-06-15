import { Account, Client, Databases, Storage } from "appwrite";

const DEFAULT_APPWRITE_ENDPOINT = "https://cloud.appwrite.io/v1";

export type AppwriteRuntimeConfig = {
  endpoint: string;
  projectId: string;
  isConfigured: boolean;
};

export function getAppwriteRuntimeConfig(): AppwriteRuntimeConfig {
  const endpoint =
    process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT || DEFAULT_APPWRITE_ENDPOINT;
  const projectId = process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID || "";

  return {
    endpoint,
    projectId,
    isConfigured: projectId.length > 0,
  };
}

export function isAppwriteConfigured(): boolean {
  return getAppwriteRuntimeConfig().isConfigured;
}

const config = getAppwriteRuntimeConfig();

export const appwriteClient = new Client().setEndpoint(config.endpoint);

if (config.isConfigured) {
  appwriteClient.setProject(config.projectId);
}

export const account = new Account(appwriteClient);
export const databases = new Databases(appwriteClient);
export const storage = new Storage(appwriteClient);
