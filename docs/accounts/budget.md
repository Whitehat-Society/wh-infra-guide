# Budget alert

A **budget** in AWS is a spending threshold that emails you as your spending approaches it. It doesn't stop any spending, but it does warn you in time to act. This page creates a monthly budget that emails you twice, first when actual spending passes half the threshold, and again when AWS predicts that you'll pass the whole threshold by the end of the month.

1. Set your email address and the monthly limit in US dollars, replacing the example address with your own:
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
    When it succeeds, the command prints nothing.

## Check it worked

```bash
aws budgets describe-budgets --account-id "$ACCOUNT" --query 'Budgets[].[BudgetName,BudgetLimit.Amount]' --output text
```

The output should be `wh-monthly	50.0`.

## If it fails

| Message | Fix |
|---|---|
| `AccessDeniedException` | You aren't signed in with the AdministratorAccess login. Run `aws sts get-caller-identity` and check the `Arn`. |
| `DuplicateRecordException` | The budget already exists, so there is nothing more to do. |

A limit of US$50 covers a test run and a two-day event with some to spare. The real protection, though, is still [deleting everything](../teardown.md) after the event.

**Next:** [Domain name](domain.md).
