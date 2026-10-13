```bash
cd ~/wh/wh-2027/utils
EVENT=$(python3 settings.py event)
export AWS_REGION=$(python3 settings.py region)
export PULUMI_CONFIG_PASSPHRASE=$(python3 secrets.py get pulumi_passphrase)
export PULUMI_BACKEND_URL="s3://$(python3 settings.py state_bucket)"
```
