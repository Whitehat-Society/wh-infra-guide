"""Annotate screenshots: boxes, arrows, numbered badges, blurred areas.

    python scripts/annotate.py shots/aws-budget.yml [raw.png]

A spec (YAML) names its raw screenshot, an optional crop, and a list of marks,
in the raw image's pixel coordinates:

    src: raw/aws-budget.png        # relative to $SHOTS_RAW (default: shots/raw)
    out: accounts/budget.webp      # relative to docs/assets/shots/
    crop: [x, y, w, h]             # optional
    width: 1400                    # optional: scale the result down to this width
    marks:
      - {blur: [x, y, w, h]}                  # hide account IDs, emails
      - {box: [x, y, w, h], n: 1}             # outline, with numbered badge
      - {arrow: [[x1, y1], [x2, y2]]}         # arrow pointing at x2,y2
      - {text: "Click here", at: [x, y]}      # short caption on a pill

Raw screenshots stay out of git (they may contain private values); only the
annotated output is committed.
"""
import os
import pathlib
import sys

import yaml
from PIL import Image, ImageDraw, ImageFilter, ImageFont

ROOT = pathlib.Path(__file__).resolve().parent.parent
RAW = pathlib.Path(os.environ.get("SHOTS_RAW", ROOT / "shots" / "raw"))
OUT = ROOT / "docs" / "assets" / "shots"
ACCENT = (230, 70, 40)
FONT = next((p for p in ("/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf",
                         "/usr/share/fonts/dejavu-sans-fonts/DejaVuSans-Bold.ttf") if os.path.exists(p)), None)


def font(px):
    return ImageFont.truetype(FONT, px) if FONT else ImageFont.load_default()


def badge(d, x, y, n, s):
    r = 15 * s
    d.ellipse([x - r, y - r, x + r, y + r], fill=ACCENT, outline="white", width=max(2, int(2 * s)))
    f = font(int(17 * s))
    d.text((x, y), str(n), fill="white", font=f, anchor="mm")


def arrow(d, p, q, s):
    import math
    w = int(5 * s)
    d.line([tuple(p), tuple(q)], fill=ACCENT, width=w)
    a = math.atan2(q[1] - p[1], q[0] - p[0])
    L, spread = 22 * s, 0.45
    pts = [tuple(q), (q[0] - L * math.cos(a - spread), q[1] - L * math.sin(a - spread)),
           (q[0] - L * math.cos(a + spread), q[1] - L * math.sin(a + spread))]
    d.polygon(pts, fill=ACCENT)


def draw(spec, raw=None):
    """Return the annotated (and cropped) image for one spec."""
    img = Image.open(raw or RAW / spec["src"]).convert("RGB")
    s = img.width / 1600  # stroke scale relative to a 1600 px screenshot
    for m in spec.get("marks", []):
        if "blur" in m:
            x, y, w, h = m["blur"]
            region = img.crop((x, y, x + w, y + h)).filter(ImageFilter.GaussianBlur(12 * s))
            img.paste(region, (x, y))
    d = ImageDraw.Draw(img)
    for m in spec.get("marks", []):
        if "box" in m:
            x, y, w, h = m["box"]
            pad = 4 * s
            d.rounded_rectangle([x - pad, y - pad, x + w + pad, y + h + pad], radius=8 * s, outline=ACCENT, width=int(4 * s))
            if "n" in m:
                badge(d, x - pad, y - pad, m["n"], s)
        elif "arrow" in m:
            arrow(d, *m["arrow"], s)
        elif "text" in m:
            f = font(int(20 * s))
            x, y = m["at"]
            b = d.textbbox((x, y), m["text"], font=f)
            d.rounded_rectangle([b[0] - 10 * s, b[1] - 6 * s, b[2] + 10 * s, b[3] + 6 * s], radius=10 * s, fill=ACCENT)
            d.text((x, y), m["text"], fill="white", font=f)
    if "crop" in spec:
        x, y, w, h = spec["crop"]
        img = img.crop((x, y, x + w, y + h))
    return img


def render(spec_path, raw=None):
    spec = yaml.safe_load(pathlib.Path(spec_path).read_text())
    img = draw(spec, raw)
    if "width" in spec and img.width > spec["width"]:
        img = img.resize((spec["width"], round(img.height * spec["width"] / img.width)), Image.LANCZOS)
    out = OUT / spec["out"]
    out.parent.mkdir(parents=True, exist_ok=True)
    img.save(out, quality=82, method=6)
    print(f"{out.relative_to(ROOT)}  {img.width}x{img.height}  {out.stat().st_size // 1024} KB")


if __name__ == "__main__":
    render(sys.argv[1], sys.argv[2] if len(sys.argv) > 2 else None)
