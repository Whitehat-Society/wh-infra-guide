"""Turn a sequence of annotated screenshots into a short captioned video.

    python scripts/clip.py shots/clips/discord-webhook.yml

    out: accounts/discord-webhook        # → docs/assets/video/<out>.mp4 and .jpg poster
    width: 1280                        # frame size; screenshots are fitted inside
    height: 720
    frames:
      - src: dc-01.png                   # raw screenshot in $SHOTS_RAW
        caption: "1. Hover over the channel and click the gear"
        seconds: 3
        crop: [x, y, w, h]               # optional, same for every frame if set at top level
        marks: [...]                      # same marks as annotate.py

Each frame is drawn with annotate.py's marks, a caption bar is added, and
ffmpeg joins them with a short cross-fade. The result is a silent H.264 MP4.
"""
import pathlib
import subprocess
import sys
import tempfile

import yaml
from PIL import Image, ImageDraw

sys.path.insert(0, str(pathlib.Path(__file__).parent))
import annotate  # noqa: E402

ROOT = annotate.ROOT
OUT = ROOT / "docs" / "assets" / "video"


def frame(f, top, tmp, i):
    spec = {"src": f["src"], "marks": f.get("marks", [])}
    if f.get("crop", top.get("crop")):
        spec["crop"] = f.get("crop", top.get("crop"))
    img = annotate.draw(spec)
    W, H, bar = top.get("width", 1280), top.get("height", 720), 56
    img.thumbnail((W, H - bar), Image.LANCZOS)  # fit inside the frame, keep proportions
    canvas = Image.new("RGB", (W, H), (21, 32, 51))
    canvas.paste(img, ((W - img.width) // 2, (H - bar - img.height) // 2))
    d = ImageDraw.Draw(canvas)
    d.text((20, H - bar / 2), f["caption"], fill="white", font=annotate.font(24), anchor="lm")
    out = pathlib.Path(tmp) / f"c{i}.png"
    canvas.save(out)
    return out


def main(path):
    top = yaml.safe_load(pathlib.Path(path).read_text())
    OUT.mkdir(parents=True, exist_ok=True)
    with tempfile.TemporaryDirectory() as tmp:
        frames = [frame(f, top, tmp, i) for i, f in enumerate(top["frames"])]
        durs = [f.get("seconds", 3) for f in top["frames"]]
        fade = 0.4
        args = ["ffmpeg", "-y", "-loglevel", "error"]
        for fr, d in zip(frames, durs):
            args += ["-loop", "1", "-t", str(d), "-i", str(fr)]
        chain, last, offset = [], "[0:v]", 0.0
        for i in range(1, len(frames)):
            offset += durs[i - 1] - fade
            tag = f"[v{i}]"
            chain.append(f"{last}[{i}:v]xfade=transition=fade:duration={fade}:offset={offset:.2f}{tag}")
            last = tag
        out = OUT / f"{top['out']}.mp4"
        out.parent.mkdir(parents=True, exist_ok=True)
        if chain:
            args += ["-filter_complex", ";".join(chain), "-map", last]
        args += ["-r", "25", "-c:v", "libx264", "-pix_fmt", "yuv420p", "-crf", "28", "-movflags", "+faststart", str(out)]
        subprocess.run(args, check=True)
        Image.open(frames[0]).convert("RGB").save(out.with_suffix(".jpg"), quality=80)
        print(f"{out.relative_to(ROOT)}  {sum(durs) - fade * (len(durs) - 1):.0f}s  {out.stat().st_size // 1024} KB")


if __name__ == "__main__":
    main(sys.argv[1])
