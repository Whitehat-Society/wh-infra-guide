"""Render diagrams/*.yml to inline SVG snippets, and lint their geometry.

Same drawing rules as the WH-2026 architecture explorer: rounded boxes with a
coloured glyph, grouping frames, orthogonal arrows, labels on a background.
The lint is a port of wh-2026/docs/.check-diagrams.js: text overflow,
overlapping boxes, arrows through boxes, crossings, labels on lines.

    python scripts/diagrams.py          # render + lint, exit 1 on any problem
    python scripts/diagrams.py --check  # lint only
"""
import html
import pathlib
import sys

import yaml

ROOT = pathlib.Path(__file__).resolve().parent.parent
SRC, OUT = ROOT / "diagrams", ROOT / "snippets" / "diagrams"
CAT = {"net": "#8C4FFF", "compute": "#ED7100", "store": "#7AA116", "db": "#C925D1", "sec": "#DD344C",
       "mgmt": "#E7157B", "k8s": "#326CE5", "app": "#0b7a94", "ext": "#64748b", "tool": "#5268a6",
       "you": "#1d7a46"}
GS = {"aws": "#232F3E", "region": "#00A4A6", "vpc": "#8C4FFF", "az": "#147EBA", "public": "#7AA116",
      "private": "#00A4A6", "cluster": "#326CE5", "ns": "#326CE5", "computer": "#64748b",
      "lane": "#64748b", "plain": "#64748b"}
TITLE_PX, SUB_PX, LABEL_PX = 14, 11.5, 12
TW = lambda s, px, f=0.6: len(s) * px * f  # rough text width, as in the JS lint
esc = lambda s: html.escape(str(s), quote=True)


def node_h(n):
    return n.get("h") or (64 if n.get("sub") else 50)


def side_pt(n, side, off=0.5):
    x, y, w, h = n["x"], n["y"], n["w"], node_h(n)
    return {"l": [x, y + h * off], "r": [x + w, y + h * off], "t": [x + w * off, y], "b": [x + w * off, y + h]}[side]


def route(e, a, b):
    """Orthogonal path between two boxes: straight when they share a band, else a Z."""
    ah, bh = node_h(a), node_h(b)
    if e.get("pts"):
        return [list(p) for p in e["pts"]]
    lo, hi = max(a["y"], b["y"]), min(a["y"] + ah, b["y"] + bh)
    if hi - lo >= 16 and (b["x"] >= a["x"] + a["w"] or a["x"] >= b["x"] + b["w"]):
        y = round((lo + hi) / 2) if "y" not in e else e["y"]
        return [[a["x"] + a["w"], y], [b["x"], y]] if b["x"] > a["x"] else [[a["x"], y], [b["x"] + b["w"], y]]
    lo, hi = max(a["x"], b["x"]), min(a["x"] + a["w"], b["x"] + b["w"])
    if hi - lo >= 16 and (b["y"] >= a["y"] + ah or a["y"] >= b["y"] + bh):
        x = round((lo + hi) / 2) if "x" not in e else e["x"]
        return [[x, a["y"] + ah], [x, b["y"]]] if b["y"] > a["y"] else [[x, a["y"]], [x, b["y"] + bh]]
    if e.get("bend") == "v":  # leave from top/bottom, arrive at a side
        p = side_pt(a, "b" if b["y"] > a["y"] else "t")
        q = side_pt(b, "l" if b["x"] > a["x"] else "r")
        return [p, [p[0], q[1]], q]
    p = side_pt(a, "r" if b["x"] > a["x"] else "l")
    q = side_pt(b, "l" if b["x"] > a["x"] else "r")
    mx = e.get("x", round((p[0] + q[0]) / 2))
    return [p, [mx, p[1]], [mx, q[1]], q]


def label_pos(e, pts):
    if "lx" in e:
        return e["lx"], e["ly"]
    seg = max(zip(pts, pts[1:]), key=lambda s: abs(s[0][0] - s[1][0]) + abs(s[0][1] - s[1][1]))
    return (seg[0][0] + seg[1][0]) / 2, (seg[0][1] + seg[1][1]) / 2


def label_w(e):
    return TW(e.get("label", ""), LABEL_PX, 0.62) + 12 + (20 if "n" in e else 0)


def prepare(d):
    nodes = {n["id"]: n for n in d["nodes"]}
    for i, e in enumerate(d.get("edges", [])):
        e.setdefault("id", f"e{i}")
        e["_pts"] = route(e, nodes[e["from"]], nodes[e["to"]])
        if e.get("label") or "n" in e:
            e["_l"] = label_pos(e, e["_pts"])
    return nodes


# ---------------------------------------------------------------- lint
def inter(a, b, m=0):
    return a["x"] < b["x"] + b["w"] + m and b["x"] < a["x"] + a["w"] + m and a["y"] < b["y"] + b["h"] + m and b["y"] < a["y"] + a["h"] + m


def box(n):
    return {"x": n["x"], "y": n["y"], "w": n["w"], "h": node_h(n)}


def seg_box(p, q):
    return {"x": min(p[0], q[0]), "y": min(p[1], q[1]), "w": abs(p[0] - q[0]), "h": abs(p[1] - q[1])}


def seg_hits(p, q, r, pad=0):
    b = seg_box(p, q)
    return b["x"] < r["x"] + r["w"] - pad and b["x"] + b["w"] > r["x"] + pad and b["y"] < r["y"] + r["h"] - pad and b["y"] + b["h"] > r["y"] + pad


def on_border(pt, r, e=0.5):
    x, y = pt
    in_x, in_y = r["x"] - e <= x <= r["x"] + r["w"] + e, r["y"] - e <= y <= r["y"] + r["h"] + e
    return (in_x and (abs(y - r["y"]) < e or abs(y - r["y"] - r["h"]) < e)) or (in_y and (abs(x - r["x"]) < e or abs(x - r["x"] - r["w"]) < e))


def lint(name, d, nodes):
    bad = []
    W, H = d["w"], d["h"]
    nl = list(nodes.values())
    for n in nl:
        avail = n["w"] - 52
        if TW(n["title"], TITLE_PX) > avail:
            bad.append(f"{n['id']} title overflows ({TW(n['title'], TITLE_PX):.0f} > {avail})")
        if n.get("sub") and TW(n["sub"], SUB_PX) > avail:
            bad.append(f"{n['id']} sub overflows ({TW(n['sub'], SUB_PX):.0f} > {avail})")
        if n["x"] < 0 or n["y"] < 0 or n["x"] + n["w"] > W or n["y"] + node_h(n) > H:
            bad.append(f"{n['id']} outside viewBox")
    for i, a in enumerate(nl):
        for b in nl[i + 1:]:
            if inter(box(a), box(b), 8):
                bad.append(f"nodes overlap/too close: {a['id']} {b['id']}")
    labels = []
    for g in d.get("groups", []):
        lw = TW(g["label"], 12, 0.62) + 4
        lb = {"x": g["x"] + 10, "y": g["y"] + g["h"] - 22 if g.get("labelPos") == "bottom" else g["y"] + 5, "w": lw, "h": 18}
        if lw > g["w"] - 16:
            bad.append(f"group label too wide: {g['label']}")
        if g["x"] < 0 or g["y"] < 0 or g["x"] + g["w"] > W or g["y"] + g["h"] > H:
            bad.append(f"group {g['label']} outside viewBox")
        labels.append({**lb, "owner": "group:" + g["label"]})
        for n in nl:
            if inter(lb, box(n), 2):
                bad.append(f'group label "{g["label"]}" hits node {n["id"]}')
            # a node must sit fully inside or fully outside each frame
            nb = box(n)
            if inter(nb, g) and not (nb["x"] >= g["x"] + 6 and nb["y"] >= g["y"] + 6 and nb["x"] + nb["w"] <= g["x"] + g["w"] - 6 and nb["y"] + nb["h"] <= g["y"] + g["h"] - 6):
                bad.append(f'node {n["id"]} straddles or touches frame "{g["label"]}"')
    segs = []
    for e in d.get("edges", []):
        a, b, P = nodes[e["from"]], nodes[e["to"]], e["_pts"]
        if not on_border(P[0], box(a)):
            bad.append(f"{e['id']} start not on {e['from']} border")
        if not on_border(P[-1], box(b)):
            bad.append(f"{e['id']} end not on {e['to']} border")
        for i, (p, q) in enumerate(zip(P, P[1:])):
            if p[0] != q[0] and p[1] != q[1]:
                bad.append(f"{e['id']} segment {i} not orthogonal")
            if p == q:
                bad.append(f"{e['id']} zero-length segment {i}")
            if i == len(P) - 2 and abs(p[0] - q[0]) + abs(p[1] - q[1]) < 14:
                bad.append(f"{e['id']} last segment too short for arrowhead")
            for n in nl:
                if seg_hits(p, q, box(n), 1):
                    bad.append(f"{e['id']} seg {i} passes through node {n['id']}")
            segs.append((e["id"], p, q))
        if "_l" in e:
            w = label_w(e)
            labels.append({"x": e["_l"][0] - w / 2, "y": e["_l"][1] - 10, "w": w, "h": 20, "owner": e["id"]})
    for i, (se, sp, sq) in enumerate(segs):
        for te, tp, tq in segs[i + 1:]:
            if se == te:
                continue
            sv, tv = sp[0] == sq[0], tp[0] == tq[0]
            sb, tb = seg_box(sp, sq), seg_box(tp, tq)
            if sv != tv:
                V, Hh = (sb, tb) if sv else (tb, sb)
                x, y = V["x"], Hh["y"]
                if Hh["x"] < x < Hh["x"] + Hh["w"] and V["y"] < y < V["y"] + V["h"]:
                    bad.append(f"crossing: {se} x {te} at {x},{y}")
            elif sv and abs(sb["x"] - tb["x"]) < 6 and sb["y"] < tb["y"] + tb["h"] and tb["y"] < sb["y"] + sb["h"]:
                bad.append(f"collinear/too close: {se} / {te}")
            elif not sv and abs(sb["y"] - tb["y"]) < 6 and sb["x"] < tb["x"] + tb["w"] and tb["x"] < sb["x"] + sb["w"]:
                bad.append(f"collinear/too close: {se} / {te}")
    for L in labels:
        for n in nl:
            if inter(L, box(n), 2):
                bad.append(f"label {L['owner']} hits node {n['id']}")
        for se, p, q in segs:
            if se != L["owner"] and seg_hits(p, q, L, -2):
                bad.append(f"label {L['owner']} sits on edge {se}")
        if L["x"] < 0 or L["x"] + L["w"] > W:
            bad.append(f"label {L['owner']} outside viewBox")
        if not L["owner"].startswith("group:"):
            for g in d.get("groups", []):
                for x in (g["x"], g["x"] + g["w"]):
                    if L["x"] < x < L["x"] + L["w"] and L["y"] < g["y"] + g["h"] and L["y"] + L["h"] > g["y"]:
                        bad.append(f"label {L['owner']} straddles border of \"{g['label']}\"")
                for y in (g["y"], g["y"] + g["h"]):
                    if L["y"] < y < L["y"] + L["h"] and L["x"] < g["x"] + g["w"] and L["x"] + L["w"] > g["x"]:
                        bad.append(f"label {L['owner']} straddles border of \"{g['label']}\"")
    for i, a in enumerate(labels):
        for b in labels[i + 1:]:
            if inter(a, b, 2):
                bad.append(f"labels overlap: {a['owner']} / {b['owner']}")
    return [f"[{name}] {m}" for m in bad]


# ---------------------------------------------------------------- render
def render(name, d, nodes):
    W, H, p = d["w"], d["h"], f"d-{name}-"
    o = [f'<svg class="whd" viewBox="0 0 {W} {H}" style="--w:{W}px" role="img" aria-label="{esc(d["title"])}">',
         f'<title>{esc(d["title"])}</title><defs>']
    for k, c in (("m", "var(--muted)"), ("a", "var(--accent)")):
        o.append(f'<marker id="{p}{k}" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" '
                 f'orient="auto-start-reverse"><path d="M0,0L10,5L0,10z" fill="{c}"/></marker>')
    o.append("</defs>")
    for g in d.get("groups", []):
        c = GS[g.get("style", "plain")]
        ink = "var(--ink)" if c == "#232F3E" else c
        ly = g["y"] + g["h"] - 9 if g.get("labelPos") == "bottom" else g["y"] + 19
        if g.get("style") == "lane":
            o.append(f'<line x1="{g["x"]}" x2="{g["x"] + g["w"]}" y1="{g["y"]}" y2="{g["y"]}" stroke="{c}"/>')
        else:
            dash = ' stroke-dasharray="5 4"' if g.get("style") in ("az", "ns", "computer") else ""
            o.append(f'<rect class="grp" x="{g["x"]}" y="{g["y"]}" width="{g["w"]}" height="{g["h"]}" rx="8" '
                     f'stroke="{ink}"{dash}/>')
        o.append(f'<text class="glbl" x="{g["x"] + 10}" y="{ly}" fill="{ink}">{esc(g["label"])}</text>')
    for e in d.get("edges", []):
        cls = "edge" + (" dash" if e.get("style") == "dash" else "") + (" hot" if e.get("hot") else "")
        mk = f"{p}a" if e.get("hot") else f"{p}m"
        both = f' marker-start="url(#{mk})"' if e.get("both") else ""
        o.append(f'<path class="{cls}" d="M{" L".join(f"{x},{y}" for x, y in e["_pts"])}" marker-end="url(#{mk})"{both}/>')
    for e in d.get("edges", []):
        if "_l" not in e:
            continue
        x, y = e["_l"]
        w = label_w(e)
        o.append(f'<g class="elbl"><rect x="{x - w / 2}" y="{y - 10}" width="{w}" height="20" rx="4"/>')
        tx = x
        if "n" in e:
            cx = x - w / 2 + 12
            o.append(f'<circle class="num" cx="{cx}" cy="{y}" r="8"/><text class="numt" x="{cx}" y="{y + 4}" text-anchor="middle">{e["n"]}</text>')
            tx = x + 10
        if e.get("label"):
            o.append(f'<text x="{tx}" y="{y + 4}" text-anchor="middle">{esc(e["label"])}</text>')
        o.append("</g>")
    for n in nodes.values():
        h, c = node_h(n), CAT[n.get("cat", "app")]
        cls = "node" + (" hot" if n.get("hot") else "")
        o.append(f'<g class="{cls}" transform="translate({n["x"]} {n["y"]})"><rect class="body" width="{n["w"]}" height="{h}" rx="8"/>'
                 f'<rect x="10" y="{h / 2 - 13}" width="26" height="26" rx="6" fill="{c}"/>'
                 f'<text class="gly" x="23" y="{h / 2 + 3.5}" text-anchor="middle">{esc(n.get("glyph", "")[:3])}</text>')
        if n.get("sub"):
            o.append(f'<text class="ttl" x="44" y="{h / 2 - 3}">{esc(n["title"])}</text><text class="sub" x="44" y="{h / 2 + 14}">{esc(n["sub"])}</text>')
        else:
            o.append(f'<text class="ttl" x="44" y="{h / 2 + 5}">{esc(n["title"])}</text>')
        o.append("</g>")
    o.append("</svg>")
    return "".join(o)


def main():
    check_only = "--check" in sys.argv
    problems = []
    OUT.mkdir(parents=True, exist_ok=True)
    for f in sorted(SRC.glob("*.yml")):
        d = yaml.safe_load(f.read_text())
        nodes = prepare(d)
        problems += lint(f.stem, d, nodes)
        if not check_only:
            (OUT / f"{f.stem}.svg").write_text(render(f.stem, d, nodes) + "\n")
    print("\n".join(problems) or f"clean ({len(list(SRC.glob('*.yml')))} diagrams)")
    sys.exit(1 if problems else 0)


if __name__ == "__main__":
    main()
