# ScrabbleHub

ScrabbleHub is a browser-based app for managing Scrabble tournaments, players, game scores, and performance statistics.

## Getting started

1. Open `index.html` in a modern web browser.
2. Select **Register Player** on the Dashboard or Players page. Enter a player name and Scrabble rating; campus or institution is optional. Duplicate names are not allowed. Register at least two players to start a tournament.
3. Select **New Tournament** and enter the tournament name, venue, date, and number of rounds.
4. Open **Pairings** and select the tournament. Pairings are generated when at least two eligible players are registered.
5. Record scores for the current round. The next round is generated automatically after every game in the round has a score.
6. Select **Annotate** beside a pairing, or open **Annotation**, to record each move.
7. Open **Statistics** to browse the scoreboards and compare institutions. Use the tournament selector to filter results.

ScrabbleHub is a static front-end app. It requires no build step or package installation.

## Features

- Register players with a required name and non-negative Scrabble rating. Campus or institution is optional, and duplicate names are rejected regardless of capitalization.
- Browse and search the player directory, including player ratings, campus assignments, and recorded results.
- Edit a player's campus or institution assignment in the Players directory.
- Create tournaments with a venue, date, and round count.
- Generate Swiss pairings. The first round is rating-seeded; later rounds follow standings. Repeat opponents are avoided. If a complete set of non-rematch pairings cannot be made, the round remains unpaired. When the number of eligible players is odd, one eligible player receives a bye.
- Use **Kick out** beside an unavailable player in **Pairings** to exclude them from future rounds. Current-round pairings and recorded results stay unchanged; the player can be reinstated for subsequent rounds.
- Record game scores, rounds, and tournament associations.
- Keep a move-by-move annotation log for each pairing, including player, word, score, and optional notes.
- Review recent tournaments and player, tournament, and match totals on the Dashboard.
- Filter scoreboards by tournament.
- Compare campuses by the mean of their members' per-game averages. Identify the leading institution by tournament points: one point per win and half a point per draw.
- Use responsive layouts on desktop and mobile devices.

## Scoreboards

Statistics are calculated from recorded games:

- **Enhanced scoreboard** — games played, wins, losses, draws, points, average score, and spread.
- **Average scores** — each player's average points per game.
- **Average opponent score** — the average score opponents earned in those games.
- **High combined score** — games ranked by the sum of both players' scores.
- **High losses / Low losses** — players ranked by most or fewest losses.
- **High wins / Low wins** — players ranked by most or fewest wins.
- **High spreads** — games ranked by the absolute difference between the two scores.
- **Lucky stiffs** — losing games ranked by the loser's score.
- **Scoreboard 1–16** — the top 16 players ranked by wins, then spread.
- **Score card** — recorded game results, newest first.
- **High total scores** — players ranked by total points scored.
- **Tuff luck rating** — losses by 10 points or fewer.
- **Upsets** — games in which the lower-rated player beat the higher-rated player.
- **Wall chart** — player scores and opponents organized by round.
- **Institutions** — campus averages and tournament points by institution.

Players without a recorded game are omitted from player rankings. Tied scores count as draws, not wins or losses.

## Data storage

Player, tournament, and game data are stored in the browser's `localStorage`. Data is specific to the browser and device where ScrabbleHub is opened; it is not synchronized to a server or shared with other browsers. Clearing the browser's site data may delete saved records.

## Project files

- `index.html` — app structure and forms.
- `style.css` — visual styling and responsive layouts.
- `script.js` — player and tournament management, pairings, scores, storage, and statistics.
- `README.md` — setup instructions and feature guide.
