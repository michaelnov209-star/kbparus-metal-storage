import { readFileSync, statSync } from "node:fs";
import { describe, expect, it } from "vitest";

const component = readFileSync("components/SocialPlaceholderButtons.tsx", "utf8");
const page = readFileSync("app/(site)/page.tsx", "utf8");
const css = readFileSync("styles/line-page.css", "utf8");

const iconPaths = [
  "public/assets/icons/max-official.svg",
  "public/assets/icons/whatsapp-official.svg",
  "public/assets/icons/vk-official.svg"
];

describe("homepage social placeholders", () => {
  it("uses local lightweight brand icons for MAX, WhatsApp and VK", () => {
    expect(component).toContain("/assets/icons/max-official.svg");
    expect(component).toContain("/assets/icons/whatsapp-official.svg");
    expect(component).toContain("/assets/icons/vk-official.svg");

    for (const iconPath of iconPaths) {
      expect(statSync(iconPath).size).toBeLessThan(3_000);
    }
  });

  it("uses buttons instead of fake navigation for unconnected channels", () => {
    expect(component).toContain('type="button"');
    expect(component).not.toContain("<a");
    expect(component).not.toContain("href=");
    expect(component).toContain("интеграция в разработке");
    expect(component).toContain('role="status"');
    expect(component).toContain('aria-live="polite"');
  });

  it("renders the placeholders in the homepage social section", () => {
    expect(page).toContain('import { SocialPlaceholderButtons }');
    expect(page).toContain("<SocialPlaceholderButtons />");
    expect(page).toContain('className="social-channel-grid"');
  });

  it("keeps touch targets, focus state and responsive layout", () => {
    expect(css).toMatch(
      /\.contact-card \.social-channel\s*\{[\s\S]*?min-height:66px/
    );
    expect(css).toContain(".contact-card .social-channel:focus-visible");
    expect(css).toMatch(
      /@media\(max-width:1180px\)[\s\S]*?\.social-channel-grid\s*\{[\s\S]*?grid-template-columns:repeat\(4/
    );
    expect(css).toContain("@media(prefers-reduced-motion:reduce)");
  });
});
