# Card Game Score Tracker

A mobile-friendly web app for tracking scores across multiple card games. Supports guest play with local storage or account-based play with full game history.

## Supported Games

- **Rummy** — running point totals, lowest score wins
- **Hand & Foot** — books, melds, red/black threes, laydown requirements, going out bonus
- **Wizard** — bid and trick scoring, screw the dealer rule, multi-deck support (up to 18 players)
- **500** — full bid table scoring for individuals or teams, non-bidder trick scoring
- **The Game** — cooperative, tracks cards remaining as a team
- **Phase 10** — tracks current phase per player, card point scoring
- **Play Nine** — 9-hole golf card game, matching column bonuses, Hole-in-One scoring
- **Euchre** — 2-team trick-taking, makers/defenders/loner scoring, auto-ends at 10
- **Skyjo** — round-ender doubling rule, auto-ends at 100
- **Cribbage** — running total to 121, full scoring reference
- **Custom** — any game with simple round-by-round scoring

## Features

- Play as a guest (current game saved locally) or create an account to save history
- Individual or team play (Hand & Foot, 500, and Euchre support both)
- Pre-configured scoring rules, editable before each game
- Live scoreboard sorted by current standings
- Sticky player names and totals when scrolling wide score tables
- Auto-scrolls to latest round after each entry
- Auto-ends games when a target score is reached
- Add or remove players mid-game with optional starting score and position
- Link players to registered accounts — completed games appear in their history automatically
- Search for registered users by username when adding players (case-insensitive)
- Share a live view link — anyone with the link can watch scores update in real time
- Current round bids displayed live on the scoreboard (Wizard and 500)
- Add a note when finishing a game
- Log past games directly to history
- Delete saved games from history
- Game history searchable by game name or player name
- "Games you're in" section on home screen for linked players

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

The local server connects to your AWS DynamoDB tables using credentials from `~/.aws/credentials`. Copy `server/.env.example` to `server/.env` and set your table names and region.

## Deployment

The app deploys to AWS using CDK:
- React client → S3 + CloudFront
- Express API → AWS Lambda + API Gateway
- Data → DynamoDB (two tables: `card-tracker-users`, `card-tracker-games`)

### First-time setup

```bash
# Install AWS CLI and configure credentials
aws configure

# Install CDK globally
npm install -g aws-cdk

# Install infra deps and bootstrap CDK in your account/region
npm install --prefix infra
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
