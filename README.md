# ScrabbleHub

ScrabbleHub is a browser-based tool for managing Scrabble tournaments, players, game scores, and player statistics.

## Getting started

1. Open `index.html` in a modern web browser.
2. Select **Register Player** on the dashboard and add at least two players. Add each player's rating if you want to use the Upsets board.
3. Optionally create a tournament with **New Tournament**.
4. Open **Pairings** and choose a tournament. Pairings are created automatically when at least two players are registered.
5. Record scores for the current round. The next round is paired automatically after every game in the round has a score.
6. Use **Annotate** next to a pairing or open **Annotation** to keep a move-by-move game log.
7. Open **Statistics** to browse the scoreboards. Use the tournament selector to filter results.

The app is a static front-end project and does not require a build step or package installation.

## Features

- Register players with Scrabble ratings and an optional campus or institution.
- Assign players to campuses or institutions, then browse and search the player directory and their recorded results.
- Create tournaments with a venue, date, and round count.
- Automatically create Swiss pairings from the registered player list: the first round is rating-seeded, later rounds follow standings, and repeat opponents are never paired. If no complete set of non-repeating games can be made, the app leaves that round unpaired rather than scheduling a rematch. An eligible player receives a bye when the player count is odd.
- Withdraw an unavailable player from a tournament using the action beside their name in Pairings. Their current-round pairings and recorded results remain unchanged; they are excluded from pairings generated later. Withdrawn players can be reinstated for subsequent pairings.
- Record game scores, rounds, and tournament association.
- Add a move-by-move annotation log to a generated pairing, with player, word, score, and optional notes.
- Review recent tournaments and dashboard totals.
- Filter scoreboards by tournament.
- Compare campuses by the mean of their players' per-game averages and identify the leading institution by total tournament points (1 point per win, 0.5 per draw).
- View responsive scoreboards for desktop and mobile layouts.

## Scoreboards

Statistics are calculated from recorded games:

- **Enhanced scoreboard** — games played, wins, losses, draws, points, average score, and spread.
- **Average scores** — each player's average points per game.
- **Average opponent score** — the average score their opponents earned in those games.
- **High combined score** — games ranked by the sum of both scores.
- **High losses / Low losses** — players ranked by most or fewest losses.
- **High wins / Low wins** — players ranked by most or fewest wins.
- **High spreads** — games ranked by the absolute difference between the scores.
- **Lucky stiffs** — losing games ranked by the loser's score.
- **Scoreboard 1–16** — the top 16 players ranked by wins, then spread.
- **Score card** — recorded game results, newest first.
- **High total scores** — players ranked by total points scored.
- **Tuff luck rating** — players ranked by losses with a margin of 10 points or fewer.
- **Upsets** — games where the lower-rated player beat the higher-rated player.
- **Wall chart** — player scores and opponents organized by round.

Players without a recorded game are omitted from player rankings. Ties count as draws, not wins or losses. The Tuff luck margin is currently set to 10 points.

## Data storage

Player, tournament, and game data are stored in the browser's `localStorage` on the device where the app is opened. Data is not synchronized to a server or shared between browsers. Clearing site data in the browser may remove saved records.

## Project files

- `index.html` — app layout and score-entry form.
- `style.css` — visual styling and responsive layouts.
- `script.js` — tournament, score-entry, storage, and statistics logic.
- `README.md` — project setup and feature guide.
