# Budget alert

A **budget** in AWS is a spending limit that emails you as spending approaches it. It does not stop spending; it only warns you. This page creates a monthly budget that emails you twice: when actual spending passes half the limit, and when AWS predicts you'll pass the whole limit by the end of the month.

1. Set your email and the monthly limit, in US dollars. Replace the example email with yours:
    ```bash
    EMAIL="you@example.com"
    LIMIT=50
    ACCOUNT=$(aws sts get-caller-identity --query Account --output text)
    ```
2. Create the budget:
    ```bash
    aws budgets create-budget --account-id "$ACCOUNT" \
      --budget "{\"BudgetName\":\"wh-monthly\",\"BudgetLimit\":{\"Amount\":\"$LIMIT\",\"Unit\":\"USD\"},\"TimeUnit\":\"MONTHLY\",\"BudgetType\":\"COST\"}" \
      --notifications-with-subscribers "[
        {\"Notification\":{\"NotificationType\":\"ACTUAL\",\"ComparisonOperator\":\"GREATER_THAN\",\"Threshold\":50,\"ThresholdType\":\"PERCENTAGE\"},
         \"Subscribers\":[{\"SubscriptionType\":\"EMAIL\",\"Address\":\"$EMAIL\"}]},
        {\"Notification\":{\"NotificationType\":\"FORECASTED\",\"ComparisonOperator\":\"GREATER_THAN\",\"Threshold\":100,\"ThresholdType\":\"PERCENTAGE\"},
         \"Subscribers\":[{\"SubscriptionType\":\"EMAIL\",\"Address\":\"$EMAIL\"}]}]"
    ```
    The command prints nothing when it succeeds.

## Check it worked

```bash
aws budgets describe-budgets --account-id "$ACCOUNT" --query 'Budgets[].[BudgetName,BudgetLimit.Amount]' --output text
```

The output is `wh-monthly	50.0`.

## If it fails

| Message | Fix |
|---|---|
| `AccessDeniedException` | You're not signed in with the AdministratorAccess login. Run `aws sts get-caller-identity` and check the `Arn` |
| `DuplicateRecordException` | The budget already exists. Nothing to do |

US$50 covers a test run and a two-day event with some to spare. The real protection is still [deleting everything](../teardown.md) after the event.

**Next:** [Domain name](domain.md).
