# Card Game Score Tracker

A mobile-friendly web app for tracking scores across multiple card games. Supports guest play with local storage or account-based play with full game history.

## Supported Games

- **Rummy** — running point totals, lowest score wins
- **Gin Rummy** — gin/knock scoring with auto-detected undercut bonus, first to 100
- **Hand & Foot** — books, melds, red/black threes, laydown requirements, going out bonus
- **Wizard** — bid and trick scoring, screw the dealer rule, multi-deck support (up to 18 players)
- **500** — full bid table scoring for individuals or teams, non-bidder trick scoring
- **Euchre** — 2-team trick-taking, makers/defenders/loner scoring, auto-ends at 10
- **Cribbage** — running total to 121 with full scoring reference
- **Phase 10** — tracks current phase per player, card point scoring
- **Play Nine** — 9-hole golf card game, matching column bonuses, Hole-in-One scoring
- **Skyjo** — round-ender doubling rule, auto-ends at 100
- **Nerts** — cards played to foundations (+1) vs cards left in pile (-2), first to 100
- **The Game** — cooperative, tracks cards remaining as a team
- **Custom** — any game with simple round-by-round scoring

## Features

### Gameplay
- Play as a guest (current game saved locally) or create an account to save history
- Individual or team play (Hand & Foot, 500, and Euchre support both)
- Pre-configured scoring rules, editable before each game
- Undo last round button
- Add or remove players mid-game with optional starting score and position
- Auto-ends games when a target score is reached
- Log past games directly to history

### Scoreboard
- Live scoreboard sorted by current standings
- Sticky player names and totals when scrolling wide score tables
- Auto-scrolls to latest round after each entry
- Alternating row colors for easier reading
- Current round bids displayed live for Wizard and 500 (including on the watch page)

### Social & Sharing
- Share a live view link — anyone with the link can watch scores update in real time
- Link players to registered accounts — completed games appear in their history automatically
- Search for registered users by username when adding players (case-insensitive)
- "Games you're in" section on home screen for linked players

### History & Stats
- Game history searchable by game name or player name
- Stats summary (games played, avg rounds, top winner) when filtering by a single game
- Add a note when finishing a game
- Delete saved games from history
- Tap any history card to see full round-by-round breakdown and team rosters

### Account & Settings
- Settings page with sign in / register / sign out
- Change username and password
- Dark mode — follows system preference or set manually (System / Light / Dark)
- Save default game rules per game to your account (Hand & Foot, Wizard, and more)
- Login nudge for guest users at key moments (visit, start game, end game)

### UX
- PWA installable — "Add to Home Screen" prompt on Android/Chrome
- Offline mode — service worker caches the app shell
- Dark mode with manual override in Settings

### Easter Eggs
???

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

The local server connects to your AWS DynamoDB tables using credentials from `~/.aws/credentials`. Copy the env vars from `server/.env` and set your table names and region.

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
