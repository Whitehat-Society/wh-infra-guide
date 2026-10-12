import csv, json, os, pathlib, subprocess, requests

url = open(os.path.expanduser("~/wh/wh-2026/.ctf/config")).read().split("url = ")[1].split()[0]
token = subprocess.check_output(["python3", "secrets.py", "get", "ctfd_admin_token"], text=True).strip()
s = requests.Session()
s.headers.update({"Authorization": f"Token {token}", "Content-Type": "application/json"})
out = pathlib.Path.home() / "wh" / "results"
out.mkdir(parents=True, exist_ok=True)

def fetch(path):
    rows, page = [], 1
    while page:
        r = s.get(f"{url}/api/v1/{path}", params={"page": page, "per_page": 100, "view": "admin"}).json()
        data = r["data"]
        rows += data if isinstance(data, list) else [data]
        page = r.get("meta", {}).get("pagination", {}).get("next")
    return rows

def save(name, rows):
    keys = sorted({k for row in rows for k in row})
    with open(out / f"{name}.csv", "w", newline="") as f:
        w = csv.DictWriter(f, fieldnames=keys)
        w.writeheader()
        for row in rows:
            w.writerow({k: json.dumps(v) if isinstance(v, (dict, list)) else v for k, v in row.items()})
    print(f"{name}.csv: {len(rows)} rows")

save("scoreboard", fetch("scoreboard"))
save("teams", fetch("teams"))
save("users", fetch("users"))
save("challenges", fetch("challenges"))
save("submissions", fetch("submissions"))
save("solves_per_challenge", fetch("statistics/challenges/solves"))
print(f"Saved in {out}")
