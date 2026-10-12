# Budget alert

<span class="time">⏱ 3 min</span>

A forgotten cluster costs ~US$11 a day. A budget emails you before that turns into a surprise.

1. Set your email and the monthly limit in US dollars:
    ```bash
    EMAIL="you@example.com"
    LIMIT=50
    ACCOUNT=$(aws sts get-caller-identity --query Account --output text)
    ```
2. Create a budget that emails you at 50% of actual spend, and again when AWS forecasts you'll pass 100%:
    ```bash
    aws budgets create-budget --account-id "$ACCOUNT" \
      --budget "{\"BudgetName\":\"wh-monthly\",\"BudgetLimit\":{\"Amount\":\"$LIMIT\",\"Unit\":\"USD\"},\"TimeUnit\":\"MONTHLY\",\"BudgetType\":\"COST\"}" \
      --notifications-with-subscribers "[
        {\"Notification\":{\"NotificationType\":\"ACTUAL\",\"ComparisonOperator\":\"GREATER_THAN\",\"Threshold\":50,\"ThresholdType\":\"PERCENTAGE\"},
         \"Subscribers\":[{\"SubscriptionType\":\"EMAIL\",\"Address\":\"$EMAIL\"}]},
        {\"Notification\":{\"NotificationType\":\"FORECASTED\",\"ComparisonOperator\":\"GREATER_THAN\",\"Threshold\":100,\"ThresholdType\":\"PERCENTAGE\"},
         \"Subscribers\":[{\"SubscriptionType\":\"EMAIL\",\"Address\":\"$EMAIL\"}]}]"
    ```

## Check it worked

```bash
aws budgets describe-budgets --account-id "$ACCOUNT" --query 'Budgets[].[BudgetName,BudgetLimit.Amount]' --output text
```

Expected: `wh-monthly	50.0`

## If it fails

| Symptom | Fix |
|---|---|
| `AccessDeniedException` | You're signed in as a user without admin rights. Run `aws sts get-caller-identity` and check the Arn says `AdministratorAccess` |
| `DuplicateRecordException` | The budget already exists. Nothing to do |

!!! info "Budgets are a warning, not a cap"
    AWS keeps billing after the limit. The real protection is [tearing down](../teardown.md) when the event ends.

**Next:** [Domain name](domain.md).
