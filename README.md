# Card Score Tracker

A mobile-friendly web app for tracking scores across multiple card games. Supports guest play with local storage or account-based play with full game history.

## Supported Games

- **Rummy** — running point totals, lowest score wins
- **Hand & Foot** — books, melds, red/black threes, going out bonus
- **Wizard** — bid and trick scoring with optional "no even bids" rule
- **500** — bid table scoring for individuals or teams

## Features

- Play as a guest (current game saved locally) or create an account to save history
- Individual or team play (Hand & Foot and 500 support both)
- Pre-configured scoring rules, editable before each game
- Scoreboard updates in real time as rounds are entered
- Add a note when finishing a game
- Delete saved games from history
- Mobile-first UI

## Local Development

### Prerequisites
- Node.js 20+

### Setup

```bash
# Install all dependencies
npm run install:all

# Start the backend (runs on http://localhost:3001)
npm run dev:server

# Start the frontend (runs on http://localhost:5173)
npm run dev:client
```

The client proxies `/api` requests to the server automatically. Guest mode uses `localStorage` — no server needed for basic play.

## Deployment

The app deploys to AWS using CDK:
- React client → S3 + CloudFront
- Express API → AWS Lambda + API Gateway
- Data → DynamoDB

### First-time setup

```bash
# Install AWS CLI and configure credentials
aws configure

# Install CDK globally
npm install -g aws-cdk

# Bootstrap CDK in your account/region
cd infra && cdk bootstrap

# Build and deploy
cd ..
npm run build:client
cd infra && cdk deploy
```

### CI/CD

Pushing to `main` triggers an automatic deploy via GitHub Actions. Add these secrets to your GitHub repo:

| Secret | Description |
|---|---|
| `AWS_ACCESS_KEY_ID` | IAM user access key |
| `AWS_SECRET_ACCESS_KEY` | IAM user secret key |
| `JWT_SECRET` | Random string for signing JWTs |

## Project Structure

```
card-games/
  client/       # React + TypeScript (Vite)
  server/       # Express + TypeScript (Lambda)
  infra/        # AWS CDK stack
```
