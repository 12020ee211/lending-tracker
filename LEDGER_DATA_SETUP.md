# ledger-data repo setup

This file describes what to create in your **private** `ledger-data` repo.

## Required files

Create two files at the root of the repo with the exact content below:

### users.json
```json
[]
```

### loans.json
```json
[]
```

Both files must exist before the app runs for the first time. You can create them via the GitHub UI → "Add file" → "Create new file".

## GitHub Secret

In the **ledger-tracker** (public) repo:
1. Go to Settings → Secrets and variables → Actions
2. Add a new secret:
   - **Name**: `LEDGER_DATA_TOKEN`
   - **Value**: A GitHub Personal Access Token (classic) with `repo` scope (full access to private repos)

## Update package.json

In `ledger-tracker/package.json`, change the `homepage` field:
```
"homepage": "https://YOUR_GITHUB_USERNAME.github.io/ledger-tracker"
```

## Update deploy.yml

In `.github/workflows/deploy.yml`, replace `YOUR_GITHUB_USERNAME` with your actual GitHub username in:
```yaml
REACT_APP_DATA_REPO_OWNER: YOUR_GITHUB_USERNAME
```

## Deploy

Push to `main` branch — GitHub Actions will build and deploy automatically.
First-time deploy may take 2–3 minutes.
