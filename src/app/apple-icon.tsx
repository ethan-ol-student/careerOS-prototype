import { renderBrandIcon } from "@/lib/pwa/brandIcon";

/** Apple touch icon — Next file convention (auto-links the meta tag). */
export const size = { width: 180, height: 180 };
export const contentType = "image/png";

export default function AppleIcon() {
  return renderBrandIcon(180);
}
