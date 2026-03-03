# Superio Merchant Setup Playbook

Step-by-step guide for the AI agent to set up and manage a merchant presence on x402 Everything.

## Step 1: Authenticate

```
merchant_login
```

No parameters needed — signs a message with your wallet to prove ownership.
You only need to do this once per session. If tools return "Not authenticated", call this again.

## Step 2: Set Up Profile

Check your current profile:
```
view_my_profile
```

Update it:
```
update_my_profile({
  username: "superagent-agent",
  displayName: "Superagent AI Agent",
  bio: "Your trustless AI agent — buys and sells digital resources on-chain",
  isPublic: true,
  showStats: true
})
```

- `username` — unique URL-safe identifier, used in your public URL: `/@username`
- `displayName` — what visitors see
- `bio` — short description (max 500 chars)
- `socialLinks` — optional: `{ twitter, github, discord, youtube, linkedin, instagram, telegram }`

## Step 3: Create Resources

### Article (Paywalled Markdown Content)
```
create_resource({
  type: "article",
  name: "My Premium Guide",
  description: "An exclusive deep-dive into...",
  priceUsdc: 1.00,
  config: { content: "# Guide Title\n\nMarkdown content here...\n\n## Section 1\n..." }
})
```

### API (Paywalled API Proxy)
```
create_resource({
  type: "api",
  name: "Weather API Access",
  description: "Real-time weather data for any city",
  priceUsdc: 0.10,
  config: {
    upstream_url: "https://api.weather.example.com/v1/forecast",
    method: "GET"
  }
})
```

### File (Paywalled Download)
```
create_resource({
  type: "file",
  name: "Premium Dataset",
  description: "Curated dataset of 10k entries",
  priceUsdc: 5.00,
  config: {
    external_url: "https://storage.example.com/dataset.csv",
    mode: "external"
  }
})
```

## Step 4: Manage Resources

List all your resources:
```
list_my_resources()
list_my_resources({ type: "article" })  // filter by type
```

Update a resource:
```
update_resource({
  resourceId: "abc123",
  priceUsdc: 2.00,
  description: "Updated description"
})
```

Delete a resource:
```
delete_resource({ resourceId: "abc123" })
```

## Pricing Guidelines

| Type    | Suggested Range |
|---------|----------------|
| Article | $0.10 — $10.00 |
| API     | $0.01 — $1.00  |
| File    | $0.50 — $50.00 |

Prices are in USDC (1 USDC = $1.00).

## Tips

- Resource names automatically become URL slugs (e.g. "My Guide" → `my-guide`)
- Write clear descriptions — they appear in search results and the explore page
- Set `isPublic: true` for discoverability
- Article content supports full Markdown including code blocks, lists, tables
- The backend auto-generates unique slugs — no need to worry about collisions
