import { z } from "zod";

const optionalEnvString = z.preprocess(
  (value) => (typeof value === "string" && value.trim() === "" ? undefined : value),
  z.string().min(1).optional(),
);

const envSchema = z.object({
  OPENAI_API_KEY: optionalEnvString,
  OPENROUTER_API_KEY: optionalEnvString,
  GOOGLE_API_KEY: optionalEnvString,
  GOOGLE_GENERATIVE_AI_API_KEY: optionalEnvString,
  NOVA_ACT_API_KEY: optionalEnvString,
  AWS_BEARER_TOKEN_BEDROCK: optionalEnvString,
  GOOGLE_MODEL: optionalEnvString,
  AWS_NOVA_MODEL: optionalEnvString,
  AWS_BEDROCK_REGION: optionalEnvString,
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
