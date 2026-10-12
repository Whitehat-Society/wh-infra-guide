# Domain name

<span class="time">Time: about 10 minutes, then up to a day of waiting</span>

Players reach the CTF through names under the club's domain: `ctf.<your-domain>` for the scoreboard and `<challenge>.challenges.<your-domain>` for web challenges. The system creates those names by itself, but only if the domain's DNS records are kept in **Route 53**, AWS's DNS service. (See [Cloud, networks and names](../concepts/cloud-and-networks.md#names-domains-and-dns) for what a domain and DNS are.)

Choose one of the two options below.

!!! tip "Reusing last year's domain"
    If the club already owns a domain in another AWS account, ask that account's owner to move it to yours with `aws route53domains transfer-domain-to-another-aws-account`. Then skip to [Check it worked](#check-it-worked).

## Option A: Buy the domain through Route 53

This is the simplest option, because Route 53 then sets up the DNS records for you. Route 53's domain commands only work in the `us-east-1` region, so every command in this option names that region.

1. Check that the name is free, and see the yearly price. Replace `example-ctf.com` with the name you want:
    ```bash
    DOMAIN=example-ctf.com
    aws route53domains check-domain-availability --region us-east-1 --domain-name "$DOMAIN"
    aws route53domains list-prices --region us-east-1 --tld "${DOMAIN##*.}" \
      --query 'Prices[0].RegistrationPrice'
    ```
    The first command prints `"Availability": "AVAILABLE"` if you can buy the name.
2. Save the owner's contact details in a file. Use the club's details. The command in step 3 hides them from public lookups:
    ```bash
    cat > /tmp/contact.json <<'EOF'
    {"FirstName":"Infra","LastName":"Team","ContactType":"PERSON",
     "AddressLine1":"1 Example Street","City":"Singapore","CountryCode":"SG","ZipCode":"000000",
     "PhoneNumber":"+65.91234567","Email":"infra@example.com"}
    EOF
    ```
    The phone number must use the form `+<country code>.<number>`.
3. Buy the domain. **This charges the card.**
    ```bash
    aws route53domains register-domain --region us-east-1 \
      --domain-name "$DOMAIN" --duration-in-years 1 --auto-renew \
      --admin-contact file:///tmp/contact.json \
      --registrant-contact file:///tmp/contact.json \
      --tech-contact file:///tmp/contact.json \
      --privacy-protect-admin-contact --privacy-protect-registrant-contact --privacy-protect-tech-contact
    ```
    The output contains an `OperationId`. Copy it.
4. Open the verification email that AWS sends to the contact address, and click its link. **If you skip this, the domain is suspended after 15 days.**
5. Check progress. Replace `<OperationId>` with the value from step 3:
    ```bash
    aws route53domains get-operation-detail --region us-east-1 --operation-id <OperationId> --query Status
    ```
    Registration usually takes 15 minutes and can take a day. When the output is `"SUCCESSFUL"`, Route 53 has also created the domain's hosted zone, the place where its DNS records live.

## Option B: Use a domain bought elsewhere

Use this if the club bought the domain from another company, such as Namecheap or Cloudflare. You keep paying that company, but you move the domain's DNS records to Route 53.

1. Create a hosted zone in Route 53. The command prints four **name servers**, the computers that will answer DNS questions for your domain:
    ```bash
    DOMAIN=example-ctf.com
    aws route53 create-hosted-zone --name "$DOMAIN" --caller-reference "$(date +%s)" \
      --query 'DelegationSet.NameServers'
    ```
2. Sign in to the other company's website, find the domain's **nameserver** settings (often under "custom nameservers"), and replace the existing entries with the four from step 1.

## Check it worked

1. Print the **hosted zone ID**. [Settings and secrets](../code/config.md) needs it:
    ```bash
    aws route53 list-hosted-zones-by-name --dns-name "$DOMAIN" \
      --query 'HostedZones[0].Id' --output text | sed 's#/hostedzone/##'
    ```
    The output is an ID that starts with `Z`.
2. Check that the rest of the internet now asks Route 53 about your domain:
    ```bash
    dig +short NS "$DOMAIN"
    ```
    The output lists four names like `ns-123.awsdns-45.com`. If it shows other names, the change hasn't spread yet. Check again in an hour. With Option B it can take up to two days.

## If it fails

| Message | Fix |
|---|---|
| `Could not connect to the endpoint URL` | The command is missing `--region us-east-1` |
| `UnsupportedTLD` | Route 53 doesn't sell that ending. Choose `.com`, `.net` or `.org`, or use Option B |
| `dig` still shows the old name servers | DNS answers are remembered for hours. Wait and try again. The deploy needs this working before it can get certificates |

**Next:** [Discord and GitHub](discord-github.md).
