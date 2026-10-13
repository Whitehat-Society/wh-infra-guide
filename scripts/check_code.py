#!/usr/bin/env python3
"""Check that the guide and wh-base agree.  python3 scripts/check_code.py [path/to/wh-base]

Docs -> code: every make target, file path, settings name, secret, setting, namespace and
quoted message the guide mentions exists in wh-base.
Code -> docs: every make target, file, setting and secret in wh-base appears in the guide.
"""
import configparser
import json
import re
import subprocess
import sys
from pathlib import Path

GUIDE = Path(__file__).resolve().parent.parent
BASE = Path(sys.argv[1] if len(sys.argv) > 1 else GUIDE.parent / 'wh-base').resolve()
UTILS = BASE / 'utils'

# Pages that describe other repositories on purpose.
OTHER_REPOS = {'reference/chall-manager.md'}
# Files the tools write, which a fresh clone doesn't have.
GENERATED = re.compile(r'(\.tfstate|\.ctf/config)$')
# Files a reader never needs to open.
UNDOCUMENTED_FILES = re.compile(r'(go\.(mod|sum)|\.terraform\.lock\.hcl|README\.md|\.dockerignore|__init__\.py|requirements\.txt|'
                                r'Pulumi\.yaml|tests/.*|public/chal|dist/.*|src/.*|source/.*|solution/.*|\.gitignore)$')

errors = []


def fail(page, message):
    errors.append(f'{page}: {message}')


def pages():
    paths = sorted((GUIDE / 'docs').rglob('*.md')) + sorted((GUIDE / 'snippets').glob('*.md'))
    for path in paths:
        rel = str(path.relative_to(GUIDE / 'docs' if 'docs' in path.parts else GUIDE))
        if rel not in OTHER_REPOS:
            yield rel, path.read_text()


def code_text():
    files = subprocess.run(['git', 'ls-files'], cwd=BASE, capture_output=True, text=True, check=True).stdout.split()
    return files, '\n'.join((BASE / f).read_text(errors='ignore') for f in files if (BASE / f).is_file())


def make_targets():
    phony = re.search(r'^\.PHONY:(.*?)(?:\n\n|\n[A-Z])', (UTILS / 'Makefile').read_text(), re.S | re.M).group(1)
    return set(phony.replace('\\', ' ').split())


def settings_names():
    return set(re.findall(r"^    '([a-z_]+)': lambda", (UTILS / 'settings.py').read_text(), re.M))


def secret_keys():
    text = (UTILS / 'secrets.py').read_text()
    return set(re.findall(r"'([a-z_]+)'", re.search(r'ASKED = \[(.*?)\]', text).group(1))) | \
        set(re.findall(r"^    '([a-z_]+)': lambda", text, re.M))


def main():
    files, source = code_text()
    targets, names, secrets = make_targets(), settings_names(), secret_keys()
    tfvars = set(json.loads((UTILS / 'eks/terraform.tfvars.json').read_text()))
    config = configparser.ConfigParser()
    config.read(UTILS / 'config.ini')
    ini_keys = {k for s in config.sections() for k in config[s]}
    alarms = set(re.findall(r'^    ([a-z-]+) += \{ about', (UTILS / 'eks/observability.tf').read_text(), re.M))
    namespaces = set(re.findall(r'(?:namespace\s*=\s*|Namespace: |namespace\(ctx, |-n |name: pulumi.String\()"?([a-z][a-z-]+)"?', source))
    namespaces |= {'kube-system', 'default'}

    everything = ''
    for page, text in pages():
        everything += text
        for target in re.findall(r'\bmake ([a-z][a-z0-9-]+)', text):
            if target not in targets and target not in {'sure', 'the', 'and', 'in', 'commands', 'targets', 'jq'}:
                fail(page, f'make {target}: no such target in utils/Makefile')
        for path in re.findall(r'`((?:utils|web|pwn|misc|crypto|forensics|osint|\.github)/[^`<>*\s]+?)`', text):
            if not (BASE / path.rstrip('/')).exists() and not GENERATED.search(path):
                fail(page, f'{path}: not in wh-base')
        for name in re.findall(r'settings\.py ([a-z_]+)', text):
            if name not in names | {'all'}:
                fail(page, f'settings.py {name}: no such name')
        for key in re.findall(r'secrets\.py get ([a-z_]+)', text):
            if key not in secrets:
                fail(page, f'secrets.py get {key}: no such secret')
        for alarm in re.findall(r'<event>-([a-z][a-z-]+)', text):
            if alarm.endswith(('-pod-down', '-low', '-high')) and alarm not in alarms:
                fail(page, f'alarm <event>-{alarm}: not in observability.tf')
        for ns in re.findall(r'-n ([a-z][a-z-]+)\b', text):
            if ns not in namespaces:
                fail(page, f'namespace {ns}: nothing creates it')
        for message in re.findall(r'`(\[(?:dns|ctfd|challenges)\][^`]*|Done: [^`]*|validate_challenges: [^`]*|=== Results[^`]*|'
                                  r'Healthcheck CronJob[^`]*|Created the empty secret[^`]*|Restored [^`]*|Still empty[^`]*|'
                                  r'FAILED, and left out[^`]*|fill in [^`]*)`', text):
            fixed = [part for part in re.split(r'<[^>]+>\S*|…|\d+|\bN\b', message) if len(part.strip()) > 3]
            if not all(part.strip() in source for part in fixed):
                fail(page, f'message "{message}": wh-base never prints it')

    setup = (GUIDE / 'docs/setup/pc.md').read_text()
    installed = set(re.search(r'pip install ([^\n]+)', setup).group(1).split())
    for package in (UTILS / 'builder/requirements.txt').read_text().split():
        if package not in installed:
            fail('setup/pc.md', f'pip install misses {package} from utils/builder/requirements.txt')
    terraform = re.search(r'required_version = ">= ([\d.]+)"', (UTILS / 'eks/main.tf').read_text()).group(1)
    if f'`v{terraform}` or newer' not in setup:
        fail('setup/pc.md', f'Terraform must be at least v{terraform}')
    go = re.search(r'^go (\d+\.\d+)', (UTILS / 'ctfd/go.mod').read_text(), re.M).group(1)
    if f'`go{go}` or newer' not in setup:
        fail('setup/pc.md', f'Go must be at least go{go}')

    for target in targets - {'help'}:
        if f'make {target}' not in everything:
            fail('(code)', f'make {target} is not in the guide')
    for f in files:
        if not UNDOCUMENTED_FILES.search(f) and f.startswith('utils/') and f not in everything:
            fail('(code)', f'{f} is not in the guide')
    for key in tfvars | ini_keys | secrets:
        if f'`{key}`' not in everything:
            fail('(code)', f'setting {key} is not in the guide')
    for name in names:
        if f'settings.py {name}' not in everything and f'`{name}`' not in everything:
            fail('(code)', f'settings.py name {name} is not in the guide')

    for e in errors:
        print(e)
    print(f'check_code: {"OK" if not errors else f"{len(errors)} problem(s)"} against {BASE}')
    sys.exit(1 if errors else 0)


if __name__ == '__main__':
    main()
