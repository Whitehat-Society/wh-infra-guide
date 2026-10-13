import configparser, csv, json, pathlib, requests

# make build-images writes .ctf/config, with CTFd's address and the admin token, in the event folder.
here = pathlib.Path.cwd()
found = next((d / ".ctf" / "config" for d in [here, *here.parents] if (d / ".ctf" / "config").exists()), None)
if not found:
    raise SystemExit("No .ctf/config here or above. Run this inside the event folder, after make build-images.")
config = configparser.ConfigParser()
config.read(found)
url, token = config["config"]["url"].rstrip("/"), config["config"]["access_token"]
s = requests.Session()
s.headers.update({"Authorization": f"Token {token}", "Content-Type": "application/json"})
out = pathlib.Path.home() / "wh" / "results"
out.mkdir(parents=True, exist_ok=True)

def fetch(path):
    rows, page = [], 1
    while page:
        r = s.get(f"{url}/api/v1/{path}", params={"page": page, "per_page": 100, "view": "admin"}, timeout=30)
        r.raise_for_status()
        r = r.json()
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
