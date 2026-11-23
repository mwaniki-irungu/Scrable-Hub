# ScrabbleHub

ScrabbleHub is a browser-based app for managing Scrabble tournaments, players, game scores, and performance statistics.

## Getting started

1. Open `index.html` in a modern web browser.
2. Select **New Tournament** and enter the tournament name, venue, date, and number of rounds.
3. Open **Players** and select the new tournament's roster. Register new players for that event or add existing directory players. Each tournament starts with an empty roster.
4. Add at least two participants to the selected roster. Pairings use only players assigned to that tournament.
5. Open **Pairings** and select the tournament. Pairings are generated when at least two eligible participants are assigned.
6. Record scores for the current round. The next round is generated automatically after every game in the round has a score.
7. Whenever you are ready to start another event, choose **Refresh for next tournament** on the Dashboard. The new event starts with an empty roster and opens the Players page so you can register new players or add existing directory players. Previous tournaments and results are kept.
8. Select **Annotate** beside a pairing, or open **Annotation**, to record each move.
9. Open **Statistics** to browse the scoreboards and compare institutions. Use the tournament selector to filter results.

ScrabbleHub is a static front-end app. It requires no build step or package installation.

## Features

- Register players with a required name and non-negative Scrabble rating. Campus or institution is optional, and duplicate names are rejected regardless of capitalization.
- Browse and search the player directory, including player ratings, campus assignments, and recorded results.
- Edit a player's campus or institution assignment in the Players directory.
- Create tournaments with a venue, date, and round count.
- Use in-page forms and confirmations for tournament setup, player registration, campus edits, and kick-out or reinstatement actions.
- Start the next tournament from the Dashboard whenever you are ready. The command remains available while a tournament is in progress or after it is complete. The new event has an empty roster and opens the Players page for adding its participants; previous results are preserved.
- Maintain a separate participant roster for each tournament. New tournaments start with an empty roster, while the player directory and past results are retained. Legacy tournaments keep their existing player eligibility.
- Download the selected tournament's player names, ratings, and campuses as CSV, then attach the file in WhatsApp. The WhatsApp action opens a prefilled message; it does not send automatically. Ratings stay saved in this browser.
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

A player's spread is total points scored minus total points conceded. In standings, more wins rank first; the higher spread breaks a tie in wins.

- **Enhanced scoreboard** — games played, wins, losses, draws, points, average score, and spread.
- **Average scores** — each player's average points per game.
- **Average opponent score** — the average score opponents earned in those games.
- **High combined score** — games ranked by the sum of both players' scores.
- **High losses / Low losses** — players ranked by most or fewest losses, with spread breaking ties; High Losses also shows spread.
- **High wins / Low wins** — players ranked by most or fewest wins, with spread breaking ties; High Wins also shows spread.
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
