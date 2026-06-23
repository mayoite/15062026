import {
  getBedrockMantleBaseUrl,
  resolveProviderChain,
} from "@/lib/ai/providerChain";

describe("ai provider chain", () => {
  const originalEnv = { ...process.env };

  beforeEach(() => {
    process.env = { ...originalEnv };
    delete process.env.OPENROUTER_API_KEY_PRIMARY;
    delete process.env.OPENROUTER_API_KEY_BACKUP;
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  test("resolves primary then backup openrouter order", () => {
    process.env.OPENROUTER_API_KEY_PRIMARY = "primary-key";
    process.env.OPENROUTER_API_KEY_BACKUP = "backup-key";

    expect(resolveProviderChain().map((entry) => entry.provider)).toEqual([
      "openrouter",
      "openrouter",
    ]);
    expect(resolveProviderChain()[0]?.apiKey).toBe("primary-key");
    expect(resolveProviderChain()[1]?.apiKey).toBe("backup-key");
  });

  test("builds the expected bedrock mantle base url", () => {
    expect(getBedrockMantleBaseUrl("us-west-2")).toBe(
      "https://bedrock-mantle.us-west-2.api.aws/v1",
    );
  });
});
