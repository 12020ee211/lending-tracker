# Ledger Tracker

A React app deployed on GitHub Pages for tracking money lent and borrowed. Data is stored in a private GitHub repository (`ledger-data`) via the GitHub API.

## Features

- **Auth**: Email + password registration and login (SHA-256 hashed, stored in private repo)
- **Roles**: Master Admin, Admin, Editor, Viewer — with granular permissions
- **Loans**: Add lending/borrowing entries with counterparty details, interest, due dates, purpose, collateral, witness
- **Payments**: Record partial repayments with payment method tracking
- **Dashboard**: Summary stats, overdue alerts, recent activity
- **Admin panel**: Grant/revoke roles, activate/deactivate users
- **Master Admin**: `pamisettymobile@gmail.com` auto-assigned on first registration

## Tech stack

- React 18 + React Router v6
- Tailwind CSS
- GitHub API (private repo as database)
- GitHub Actions + GitHub Pages (hosting)

## Setup

See [LEDGER_DATA_SETUP.md](./LEDGER_DATA_SETUP.md) for full setup instructions.

## Role permissions

| Permission | Viewer | Editor | Admin | Master Admin |
|---|---|---|---|---|
| View loans | ✓ | ✓ | ✓ | ✓ |
| Add loans | | ✓ | ✓ | ✓ |
| Edit loans | | ✓ | ✓ | ✓ |
| Delete loans | | | ✓ | ✓ |
| Manage users | | | ✓ | ✓ |
