import { describe, expect, it } from "vitest";
import { buildSeoConfig } from "../client/src/lib/seoConfig";

describe("buildSeoConfig", () => {
  it("sets canonical article URL for /library aliases", () => {
    const config = buildSeoConfig("/library/how-to-apply-for-general-relief");
    expect(config.canonical).toBe("https://www.virgilst.com/articles/how-to-apply-for-general-relief");
    expect(config.robots).toBe("index,follow");
  });

  it("sets noindex for private routes", () => {
    const config = buildSeoConfig("/admin");
    expect(config.robots).toBe("noindex,follow");
  });

  it("builds city metadata for provider city route", () => {
    const config = buildSeoConfig("/medical-providers/los-angeles");
    expect(config.title).toContain("Medi-Cal Providers in Los Angeles");
    expect(config.canonical).toBe("https://www.virgilst.com/medical-providers/los-angeles");
  });
});

