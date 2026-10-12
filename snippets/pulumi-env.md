```bash
cd ~/wh/wh-2026/utils
EVENT=$(jq -r .event_name eks/terraform.tfvars.json)
export PULUMI_CONFIG_PASSPHRASE=$(python3 secrets.py get pulumi_passphrase)
export PULUMI_BACKEND_URL="s3://$EVENT-pulumi-state"
```
