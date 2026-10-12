#!/usr/bin/env bash
# Fails if the public site source contains values that must stay private:
# 12-digit AWS account IDs, CTFd tokens, real load-balancer hostnames, webhook URLs.
set -u
hits=$(grep -rnIE \
  -e '\b[0-9]{12}\b' \
  -e 'ctfd_[0-9a-f]{20,}' \
  -e '[a-z0-9-]+-[0-9a-f]{10,}\.elb\.' \
  -e 'discord(app)?\.com/api/webhooks/[0-9]' \
  -e 'd-[0-9a-f]{10}\.awsapps\.com' \
  docs snippets mkdocs.yml)
if [ -n "$hits" ]; then echo "Private values found:"; echo "$hits"; exit 1; fi
echo "scan: clean"
