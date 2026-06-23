import { z } from "zod";

const optionalEnvString = z.preprocess(
  (value) => (typeof value === "string" && value.trim() === "" ? undefined : value),
  z.string().min(1).optional(),
);

const envSchema = z.object({
  OPENAI_API_KEY: optionalEnvString,
  OPENROUTER_API_KEY_PRIMARY: optionalEnvString,
  OPENROUTER_API_KEY_BACKUP: optionalEnvString,
  OPENROUTER_MODEL: optionalEnvString,
});

type ServerEnv = z.infer<typeof envSchema>;

function readEnv(): ServerEnv {
  const parsedEnv = envSchema.safeParse(process.env);

  if (!parsedEnv.success) {
    console.error("Invalid server environment variables:", parsedEnv.error.format());
    throw new Error("Invalid server environment variables");
  }

  return parsedEnv.data;
}

export const env = new Proxy({} as ServerEnv, {
  get(_target, property: string) {
    return readEnv()[property as keyof ServerEnv];
  },
});
