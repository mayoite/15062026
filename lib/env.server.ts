import { z } from "zod";

const envSchema = z.object({
  OPENAI_API_KEY: z.string().min(1).optional(),
  OPENROUTER_API_KEY: z.string().min(1).optional(),
  GOOGLE_API_KEY: z.string().min(1).optional(),
  NOVA_ACT_API_KEY: z.string().min(1).optional(),
  AWS_BEARER_TOKEN_BEDROCK: z.string().min(1).optional(),
  GOOGLE_MODEL: z.string().min(1).optional(),
  AWS_NOVA_MODEL: z.string().min(1).optional(),
  AWS_BEDROCK_REGION: z.string().min(1).optional(),
  OPENROUTER_MODEL: z.string().min(1).optional(),
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
