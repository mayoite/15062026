"""
Nova Act: Screenshot every page/component on oando.co.in
Captures full-page screenshots of all static routes.
"""

import os
import time
from pathlib import Path
from nova_act import NovaAct

os.environ.setdefault("NOVA_ACT_API_KEY", "d1bd6ca2-f1e9-4649-be53-45c2cbbcfe63")

BASE_URL = "https://oando.co.in"
ROOT_DIR = Path(__file__).resolve().parents[1]
OUTPUT_DIR = ROOT_DIR / "screenshots"
OUTPUT_DIR.mkdir(parents=True, exist_ok=True)

PAGES = [
    ("/", "homepage"),
    ("/about", "about"),
    ("/products", "products"),
    ("/solutions", "solutions"),
    ("/projects", "projects"),
    ("/portfolio", "portfolio"),
    ("/trusted-by", "trusted-by"),
    ("/gallery", "gallery"),
    ("/contact", "contact"),
    ("/compare", "compare"),
    ("/service", "service"),
    ("/showrooms", "showrooms"),
    ("/sustainability", "sustainability"),
    ("/refund-and-return-policy", "refund-and-return-policy"),
    ("/privacy", "privacy"),
    ("/terms", "terms"),
    ("/quote-cart", "quote-cart"),
    ("/catalog", "catalog"),
    ("/career", "career"),
    ("/news", "news"),
    ("/planning", "planning"),
    ("/brochure", "brochure"),
    ("/downloads", "downloads"),
    ("/social", "social"),
    ("/imprint", "imprint"),
]


def screenshot_all():
    print(f"📸 Starting screenshot capture of {len(PAGES)} pages...")
    print(f"📁 Output directory: {OUTPUT_DIR}\n")

    successful = 0
    failed = []

    with NovaAct(starting_page=BASE_URL, headless=True) as nova:
        for path, name in PAGES:
            url = f"{BASE_URL}{path}"
            output_file = OUTPUT_DIR / f"{name}.png"
            print(f"  → Navigating to {url}...")

            try:
                # Navigate to the page
                nova.act(f"Navigate to {url}", max_steps=10)
                # Wait a moment for animations/lazy content to load
                time.sleep(2)
                # Take full-page screenshot using Playwright page access
                nova.page.screenshot(path=str(output_file), full_page=True)
                print(f"    ✅ Saved: {output_file}")
                successful += 1
            except Exception as e:
                print(f"    ❌ Failed: {e}")
                failed.append((name, str(e)))

    print(f"\n{'='*50}")
    print(f"📊 Results: {successful}/{len(PAGES)} pages captured")
    if failed:
        print(f"❌ Failed pages:")
        for name, error in failed:
            print(f"   - {name}: {error}")
    print(f"📁 Screenshots saved to: {OUTPUT_DIR}")


if __name__ == "__main__":
    screenshot_all()
