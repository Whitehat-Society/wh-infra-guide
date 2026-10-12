# Domain name

<span class="time">⏱ 10 min to order · up to 1 day before it works</span>

Players reach the CTF at `ctf.<your-domain>` and `<challenge>.challenges.<your-domain>`. The cluster creates those DNS records on its own, but the domain must live in **Route 53**, AWS's DNS service.

!!! tip "Reusing last year's domain?"
    If the club already owns the domain in another AWS account, ask the current owner to transfer it with `aws route53domains transfer-domain-to-another-aws-account`, or to delegate it to you. Skip to [Check it worked](#check-it-worked) once it's in your account.

## Option A · Buy it in Route 53 (simplest)

Route 53 domain commands only work in region `us-east-1`, whatever region the rest of the stack uses.

1. Check that the name is free and see the price:
    ```bash
    DOMAIN=example-ctf.com
    aws route53domains check-domain-availability --region us-east-1 --domain-name "$DOMAIN"
    aws route53domains list-prices --region us-east-1 --tld "${DOMAIN##*.}" \
      --query 'Prices[0].RegistrationPrice'
    ```
    Expected: `"Availability": "AVAILABLE"`.
2. Save a contact file. Use the club's details. `PrivacyProtect` hides them from public WHOIS lookups:
    ```bash
    cat > /tmp/contact.json <<'EOF'
    {"FirstName":"Infra","LastName":"Team","ContactType":"PERSON",
     "AddressLine1":"1 Example Street","City":"Singapore","CountryCode":"SG","ZipCode":"000000",
     "PhoneNumber":"+65.91234567","Email":"infra@example.com"}
    EOF
    ```
3. Register it. **This charges the card**:
    ```bash
    aws route53domains register-domain --region us-east-1 \
      --domain-name "$DOMAIN" --duration-in-years 1 --auto-renew \
      --admin-contact file:///tmp/contact.json \
      --registrant-contact file:///tmp/contact.json \
      --tech-contact file:///tmp/contact.json \
      --privacy-protect-admin-contact --privacy-protect-registrant-contact --privacy-protect-tech-contact
    ```
    It prints an `OperationId`.
4. Click the link in the verification email AWS sends to the contact address. **If you skip this, the domain is suspended after 15 days**
5. Wait for the registration to finish (usually 15 min, can take up to a day):
    ```bash
    aws route53domains get-operation-detail --region us-east-1 --operation-id <OperationId> --query Status
    ```
    Expected: `"SUCCESSFUL"`. Route 53 creates the hosted zone for you.

## Option B · Domain bought elsewhere (Namecheap, Cloudflare, …)

1. Create a hosted zone and print its four name servers:
    ```bash
    DOMAIN=example-ctf.com
    aws route53 create-hosted-zone --name "$DOMAIN" --caller-reference "$(date +%s)" \
      --query 'DelegationSet.NameServers'
    ```
2. In the other registrar's dashboard, replace the domain's name servers with those four. Each registrar's screen is different, so search its help pages for "custom nameservers"

## Check it worked

1. Get the **hosted zone ID**. You need it in [Config files & secrets](../code/config.md):
    ```bash
    aws route53 list-hosted-zones-by-name --dns-name "$DOMAIN" \
      --query 'HostedZones[0].Id' --output text | sed 's#/hostedzone/##'
    ```
    Expected: an ID that starts with `Z`.
2. Check that the internet sees Route 53 as the domain's DNS:
    ```bash
    dig +short NS "$DOMAIN"
    ```
    Expected: four names like `ns-123.awsdns-45.com`. If they don't show yet, wait an hour and retry (up to 48 h for Option B).

## If it fails

| Symptom | Fix |
|---|---|
| `Could not connect to the endpoint URL` | You forgot `--region us-east-1` |
| `UnsupportedTLD` | Route 53 doesn't sell that ending. Pick `.com`, `.net`, `.org` or use Option B |
| `dig` shows the old name servers | DNS caches are slow. Check again later; the deploy needs this working for TLS certificates |

**Next:** [Discord & GitHub](discord-github.md).
