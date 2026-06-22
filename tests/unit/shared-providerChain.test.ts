import {
  getBedrockMantleBaseUrl,
  resolveProviderChain,
} from "@/lib/ai/providerChain";

describe("ai provider chain", () => {
  const originalEnv = { ...process.env };

  beforeEach(() => {
    process.env = { ...originalEnv };
    delete process.env.GOOGLE_API_KEY;
    delete process.env.GOOGLE_GENERATIVE_AI_API_KEY;
    delete process.env.NOVA_ACT_API_KEY;
    delete process.env.AWS_BEARER_TOKEN_BEDROCK;
    delete process.env.OPENROUTER_API_KEY;
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  test("resolves providers in google then nova then openrouter order", () => {
    process.env.GOOGLE_API_KEY = "google-key";
    process.env.NOVA_ACT_API_KEY = "nova-key";
    process.env.OPENROUTER_API_KEY = "openrouter-key";

    expect(resolveProviderChain().map((entry) => entry.provider)).toEqual([
      "google",
      "aws-nova",
      "openrouter",
    ]);
  });

  test("accepts the documented Gemini key alias", () => {
    process.env.GOOGLE_GENERATIVE_AI_API_KEY = "google-generative-key";

    expect(resolveProviderChain().map((entry) => entry.provider)).toEqual([
      "google",
    ]);
    expect(resolveProviderChain()[0]?.apiKey).toBe("google-generative-key");
  });

  test("builds the expected bedrock mantle base url", () => {
    expect(getBedrockMantleBaseUrl("us-west-2")).toBe(
      "https://bedrock-mantle.us-west-2.api.aws/v1",
    );
  });
});
