// SCRABBLEHUB SYSTEM

let players = JSON.parse(localStorage.getItem("scrabblePlayers")) || [];
let tournaments = JSON.parse(localStorage.getItem("scrabbleTournaments")) || [];
let matches = JSON.parse(localStorage.getItem("scrabbleMatches")) || [];
let pairings = JSON.parse(localStorage.getItem("scrabblePairings")) || [];
let annotations = JSON.parse(localStorage.getItem("scrabbleAnnotations")) || [];
let tournamentRosterMigrationNeeded = false;
tournaments.forEach(function(tournament) {
    if (!Array.isArray(tournament.playerNames)) {
        tournament.playerNames = players.map(function(player) { return player.name; });
        tournamentRosterMigrationNeeded = true;
    }
});
if (tournamentRosterMigrationNeeded) {
    localStorage.setItem("scrabbleTournaments", JSON.stringify(tournaments));
}
let activeRounds = 0;
let currentBoard = "enhanced";
let editingCampusPlayerName = "";
let pendingWithdrawal = null;

const boardDetails = {
    enhanced: ["Enhanced Scoreboard", "A complete view of wins, losses, points and averages."],
    "average-scores": ["Average Scores", "Players ranked by average points scored per game."],
    "average-opponent": ["Average Opponent Score", "Average points scored by each player's opponents."],
    combined: ["High Combined Score", "Games ranked by the combined score of both players."],
    "high-losses": ["High Losses", "Players ranked by losses, with spread breaking ties."],
    spreads: ["High Spreads", "Games ranked by the winning margin."],
    "high-wins": ["High Wins", "Players ranked by wins, with spread breaking ties."],
    "low-losses": ["Low Losses", "Players ranked by fewest losses (players with games only)."],
    "low-wins": ["Low Wins", "Players ranked by fewest wins (players with games only)."],
    "lucky-stiffs": ["Lucky Stiffs", "Highest individual scores from games the player lost."],
    "scoreboard-1-16": ["Scoreboard 1–16", "Top 16 tournament standings, ranked by wins then spread."],
    "score-card": ["Score Card", "Recorded game results, including round and tournament."],
    "high-total": ["High Total Scores", "Players ranked by total points scored across games."],
    "tuff-luck": ["Tuff Luck Rating", "Players with the most close losses (10 points or fewer)."],
    upsets: ["Upsets", "Lower-rated players who beat higher-rated opponents."],
    "wall-chart": ["Wall Chart", "Round-by-round scores and opponents for each player."],
    institutions: ["Institutions", "Campus averages and tournament points by institution."]
};

function escapeHtml(value) {
    return String(value == null ? "" : value).replace(/[&<>"']/g, function(character) {
        return {
            "&": "&amp;",
            "<": "&lt;",
            ">": "&gt;",
            '"': "&quot;",
            "'": "&#39;"
        }[character];
    });
}

function saveMatches() {
    localStorage.setItem("scrabbleMatches", JSON.stringify(matches));
}

function saveTournaments() {
    localStorage.setItem("scrabbleTournaments", JSON.stringify(tournaments));
}

function getTournamentPlayerNames(tournamentName) {
    const tournament = tournaments.find(function(item) { return item.name === tournamentName; });
    return tournament && Array.isArray(tournament.playerNames) ? tournament.playerNames : [];
}

function getTournamentPlayers(tournamentName) {
    const tournamentPlayerNames = new Set(getTournamentPlayerNames(tournamentName));
    return players.filter(function(player) { return tournamentPlayerNames.has(player.name); });
}

function isPlayerInTournament(playerName, tournamentName) {
    return getTournamentPlayerNames(tournamentName).indexOf(playerName) !== -1;
}

function addPlayerToTournament(playerName, tournamentName) {
    const tournament = tournaments.find(function(item) { return item.name === tournamentName; });
    if (!tournament || isTournamentComplete(tournament) || isPlayerInTournament(playerName, tournamentName)) {
        return false;
    }
    if (!Array.isArray(tournament.playerNames)) tournament.playerNames = [];
    tournament.playerNames.push(playerName);
    saveTournaments();
    return true;
}

function getActiveRoundCount() {
    const activeRounds = pairings.filter(function(pairing) {
        return !pairing.bye && !getMatchForPairing(pairing);
    }).map(function(pairing) {
        return JSON.stringify([pairing.tournament, pairing.round]);
    });
    return new Set(activeRounds).size;
}

function updateActiveRoundsDisplay() {
    activeRounds = getActiveRoundCount();
    document.getElementById("activeRounds").textContent = activeRounds;
}

function updateDashboard() {
    updateActiveRoundsDisplay();
    document.getElementById("totalPlayers").textContent = players.length;
    document.getElementById("totalTournaments").textContent = tournaments.length;
    document.getElementById("totalMatches").textContent = matches.length;
    document.getElementById("activeRounds").textContent = activeRounds;
    displayTournaments();
    populateTournamentOptions();
    renderPlayers();
    renderPairings();
    updateCompletedTournamentPanel();
    renderAnnotationPage();
    updateStatistics();
}

function displayTournaments() {
    const list = document.getElementById("tournamentList");

    if (tournaments.length === 0) {
        list.innerHTML = `
            <div>🏆</div>
            <h3>No tournaments yet</h3>
            <p>Create your first tournament to get started.</p>
        `;
        return;
    }

    list.innerHTML = tournaments.map(function(tournament) {
        return `
            <div class="tournament-item">
                <h3>${escapeHtml(tournament.name)}</h3>
                <p>${escapeHtml(tournament.venue)}</p>
                <small>${escapeHtml(tournament.date)} | ${escapeHtml(tournament.rounds)} Rounds</small>
            </div>
        `;
    }).join("");
}

function populateTournamentOptions() {
    const statsSelect = document.getElementById("statisticsTournament");
    const scoreSelect = document.getElementById("scoreTournament");
    const pairingsSelect = document.getElementById("pairingsTournament");
    const annotationSelect = document.getElementById("annotationTournament");
    const playersTournamentSelect = document.getElementById("playersTournament");
    const playerTournamentSelect = document.getElementById("playerTournament");
    const selectedStats = statsSelect.value;
    const selectedScore = scoreSelect.value;
    const selectedPairings = pairingsSelect.value;
    const selectedAnnotation = annotationSelect.value;
    const selectedPlayersTournament = playersTournamentSelect.value;
    const selectedPlayerTournament = playerTournamentSelect.value;

    statsSelect.innerHTML = '<option value="all">All tournaments</option>';
    scoreSelect.innerHTML = '<option value="">Unassigned game</option>';
    pairingsSelect.innerHTML = '<option value="">Select a tournament</option>';
    annotationSelect.innerHTML = '<option value="">Select a tournament</option>';
    playersTournamentSelect.innerHTML = '<option value="">Select a tournament</option>';
    playerTournamentSelect.innerHTML = '<option value="">Directory only</option>';

    tournaments.forEach(function(tournament) {
        const statsOption = document.createElement("option");
        statsOption.value = tournament.name;
        statsOption.textContent = tournament.name;
        statsSelect.appendChild(statsOption);

        const scoreOption = document.createElement("option");
        scoreOption.value = tournament.name;
        scoreOption.textContent = tournament.name;
        scoreSelect.appendChild(scoreOption);

        [pairingsSelect, annotationSelect].forEach(function(select) {
            const option = document.createElement("option");
            option.value = tournament.name;
            option.textContent = tournament.name;
            select.appendChild(option);
        });

        [playersTournamentSelect, playerTournamentSelect].forEach(function(select) {
            const option = document.createElement("option");
            option.value = tournament.name;
            option.textContent = tournament.name;
            select.appendChild(option);
        });
    });

    if (Array.from(statsSelect.options).some(function(option) { return option.value === selectedStats; })) {
        statsSelect.value = selectedStats;
    }
    if (Array.from(scoreSelect.options).some(function(option) { return option.value === selectedScore; })) {
        scoreSelect.value = selectedScore;
    }
    if (selectedPairings && Array.from(pairingsSelect.options).some(function(option) {
        return option.value === selectedPairings;
    })) {
        pairingsSelect.value = selectedPairings;
    } else if (tournaments.length) {
        pairingsSelect.value = tournaments[tournaments.length - 1].name;
    }
    if (selectedAnnotation && Array.from(annotationSelect.options).some(function(option) {
        return option.value === selectedAnnotation;
    })) {
        annotationSelect.value = selectedAnnotation;
    } else if (tournaments.length) {
        annotationSelect.value = tournaments[tournaments.length - 1].name;
    }
    if (selectedPlayersTournament && Array.from(playersTournamentSelect.options).some(function(option) {
        return option.value === selectedPlayersTournament;
    })) {
        playersTournamentSelect.value = selectedPlayersTournament;
    } else if (tournaments.length) {
        playersTournamentSelect.value = tournaments[tournaments.length - 1].name;
    }
    if (selectedPlayerTournament && Array.from(playerTournamentSelect.options).some(function(option) {
        return option.value === selectedPlayerTournament;
    })) {
        playerTournamentSelect.value = selectedPlayerTournament;
    }
    updateRoundOptions(pairingsSelect, document.getElementById("pairingsRound"), "Select a tournament first");
    if (!selectedPairings && pairingsSelect.value) {
        document.getElementById("pairingsRound").value = String(getNextPairingRound(pairingsSelect.value));
    }
    updateRoundOptions(annotationSelect, document.getElementById("annotationRound"), "Select a tournament first");
    updateAnnotationPairingOptions();
}

function populatePlayerOptions(tournamentName) {
    const firstSelect = document.getElementById("scorePlayer1");
    const secondSelect = document.getElementById("scorePlayer2");
    const previousFirst = firstSelect.value;
    const previousSecond = secondSelect.value;
    const tournamentPlayerNames = tournamentName ? new Set(getTournamentPlayerNames(tournamentName)) : null;
    const availableIndexes = [];
    players.forEach(function(player, index) {
        if (!tournamentPlayerNames || tournamentPlayerNames.has(player.name)) {
            availableIndexes.push(index);
        }
    });

    [firstSelect, secondSelect].forEach(function(select) {
        select.innerHTML = "";
        availableIndexes.forEach(function(index) {
            const option = document.createElement("option");
            option.value = String(index);
            option.textContent = players[index].name;
            select.appendChild(option);
        });
    });

    if (previousFirst && availableIndexes.indexOf(Number(previousFirst)) !== -1) {
        firstSelect.value = previousFirst;
    } else if (availableIndexes.length) {
        firstSelect.value = String(availableIndexes[0]);
    }
    if (previousSecond && previousSecond !== firstSelect.value &&
        availableIndexes.indexOf(Number(previousSecond)) !== -1) {
        secondSelect.value = previousSecond;
    } else {
        const secondIndex = availableIndexes.find(function(index) {
            return String(index) !== firstSelect.value;
        });
        if (secondIndex !== undefined) secondSelect.value = String(secondIndex);
    }
}

function getCurrentTournamentName() {
    const playersPage = document.getElementById("playersPage");
    if (!playersPage.hidden) {
        const selectedName = document.getElementById("playersTournament").value;
        const selectedTournament = tournaments.find(function(item) { return item.name === selectedName; });
        return selectedTournament && !isTournamentComplete(selectedTournament) ?
            selectedTournament.name : "";
    }

    const latestTournament = tournaments[tournaments.length - 1];
    return latestTournament && !isTournamentComplete(latestTournament) ? latestTournament.name : "";
}

function updateRoundOptions(tournamentSelect, roundSelect, placeholder) {
    const selectedRound = roundSelect.value;
    const tournament = tournaments.find(function(item) {
        return item.name === tournamentSelect.value;
    });
    roundSelect.innerHTML = "";

    if (!tournament) {
        const option = document.createElement("option");
        option.value = "";
        option.textContent = placeholder;
        roundSelect.appendChild(option);
        roundSelect.disabled = true;
        return;
    }

    const rounds = Math.max(0, Math.floor(Number(tournament.rounds) || 0));
    for (let round = 1; round <= rounds; round += 1) {
        const option = document.createElement("option");
        option.value = String(round);
        option.textContent = "Round " + round;
        roundSelect.appendChild(option);
    }
    roundSelect.disabled = rounds === 0;
    if (rounds && Array.from(roundSelect.options).some(function(option) {
        return option.value === selectedRound;
    })) {
        roundSelect.value = selectedRound;
    } else if (rounds) {
        roundSelect.value = "1";
    } else {
        const option = document.createElement("option");
        option.value = "";
        option.textContent = "No rounds configured";
        roundSelect.appendChild(option);
    }
}

function getPairingsForRound(tournamentName, round) {
    return pairings.filter(function(pairing) {
        return pairing.tournament === tournamentName && Number(pairing.round) === Number(round);
    });
}

function getNextPairingRound(tournamentName) {
    const tournament = tournaments.find(function(item) { return item.name === tournamentName; });
    const roundCount = tournament ? Math.max(1, Math.floor(Number(tournament.rounds) || 1)) : 1;
    for (let round = 1; round <= roundCount; round += 1) {
        const roundPairings = getPairingsForRound(tournamentName, round);
        if (!roundPairings.length || roundPairings.some(function(pairing) {
            return !pairing.bye && !getMatchForPairing(pairing);
        })) {
            return round;
        }
    }
    return roundCount;
}

function getMatchForPairing(pairing) {
    return matches.find(function(match) {
        return match.tournament === pairing.tournament &&
            Number(match.round) === Number(pairing.round) &&
            ((match.player1 === pairing.player1 && match.player2 === pairing.player2) ||
                (match.player1 === pairing.player2 && match.player2 === pairing.player1));
    });
}

function isTournamentComplete(tournament) {
    const roundCount = Number(tournament.rounds);
    if (!Number.isInteger(roundCount) || roundCount < 1) return false;

    for (let round = 1; round <= roundCount; round += 1) {
        const roundPairings = getPairingsForRound(tournament.name, round);
        if (!roundPairings.length || roundPairings.some(function(pairing) {
            return !pairing.bye && !getMatchForPairing(pairing);
        })) {
            return false;
        }
    }
    return true;
}

function updateCompletedTournamentPanel() {
    const panel = document.getElementById("completedTournamentPanel");
    const latestTournament = tournaments[tournaments.length - 1];
    const isComplete = latestTournament && isTournamentComplete(latestTournament);
    panel.hidden = !isComplete;
    if (isComplete) {
        document.getElementById("completedTournamentName").textContent = latestTournament.name;
    }
}

function getWithdrawnPlayers(tournamentName) {
    const tournament = tournaments.find(function(item) {
        return item.name === tournamentName;
    });
    return tournament && Array.isArray(tournament.withdrawnPlayers) ?
        tournament.withdrawnPlayers : [];
}

function isPlayerWithdrawn(tournamentName, playerName) {
    return getWithdrawnPlayers(tournamentName).indexOf(playerName) !== -1;
}

function renderPairingPlayer(playerName, tournamentName) {
    const withdrawn = isPlayerWithdrawn(tournamentName, playerName);
    const action = withdrawn ? "Reinstate" : "Kick out";
    return '<div class="pairing-player">' +
        '<span>' + escapeHtml(playerName) +
        (withdrawn ? ' <span class="withdrawn-label">Kicked out</span>' : "") +
        '</span>' +
        '<button type="button" class="small-action secondary-action" data-toggle-withdrawal="' +
        escapeHtml(playerName) + '" data-withdrawal-tournament="' + escapeHtml(tournamentName) +
        '" aria-label="' + action + " " + escapeHtml(playerName) + " " +
        (withdrawn ? "for " : "from ") + escapeHtml(tournamentName) + '">' +
        action + '</button>' +
        '</div>';
}

function renderPlayers() {
    const searchInput = document.getElementById("playerSearch");
    const query = searchInput.value.trim().toLowerCase();
    const rosterTournamentName = document.getElementById("playersTournament").value;
    const rosterTournament = tournaments.find(function(item) {
        return item.name === rosterTournamentName;
    });
    const rosterLocked = rosterTournament && isTournamentComplete(rosterTournament);
    const playerStats = getStats(matches);
    const playerRows = players.slice().sort(function(a, b) {
        return a.name.localeCompare(b.name);
    }).filter(function(player) {
        return player.name.toLowerCase().includes(query);
    }).map(function(player, index) {
        const stats = playerStats.find(function(item) { return item.name === player.name; });
        const rosterAction = !rosterTournamentName ?
            '<span class="player-roster-status">Select a tournament</span>' :
            isPlayerInTournament(player.name, rosterTournamentName) ?
                '<span class="player-roster-status">In roster</span>' :
                rosterLocked ?
                    '<span class="player-roster-status">Tournament complete</span>' :
                    '<button type="button" class="small-action secondary-action" data-add-to-tournament="' +
                    escapeHtml(player.name) + '">Add to roster</button>';
        return "<tr>" +
            "<td>" + (index + 1) + "</td>" +
            "<td>" + escapeHtml(player.name) + "</td>" +
            "<td>" + escapeHtml(player.campus || "Not assigned") + "</td>" +
            "<td>" + (Number(player.rating) || 0) + "</td>" +
            "<td>" + (stats ? stats.games : 0) + "</td>" +
            "<td>" + (stats ? stats.wins : 0) + "</td>" +
            "<td>" + (stats ? stats.losses : 0) + "</td>" +
            "<td>" + (stats ? stats.draws : 0) + "</td>" +
            "<td>" + (stats ? stats.total : 0) + "</td>" +
            "<td>" + (stats ? stats.average.toFixed(1) : "—") + "</td>" +
            "<td>" + rosterAction + ' <button type="button" class="small-action secondary-action" data-edit-campus="' +
            escapeHtml(player.name) + '">Edit campus</button></td>' +
            "</tr>";
    });

    let directoryCount = players.length + (players.length === 1 ? " registered player" : " registered players");
    if (rosterTournamentName) {
        directoryCount += " | " + getTournamentPlayers(rosterTournamentName).length +
            " in " + rosterTournamentName;
    }
    document.getElementById("playerDirectoryCount").textContent = directoryCount;
    document.getElementById("downloadPlayerRatingsBtn").disabled = !rosterTournament;
    document.getElementById("sharePlayerRatingsBtn").disabled = !rosterTournament;
    document.getElementById("playersTable").innerHTML =
        '<table class="scoreboard-table"><thead><tr>' +
        "<th>#</th><th>Player</th><th>Campus / institution</th><th>Rating</th>" +
        "<th>Games</th><th>Wins</th><th>Losses</th><th>Draws</th><th>Points</th><th>Average</th>" +
        "<th>Actions</th></tr></thead><tbody>" + playerRows.join("") +
        (playerRows.length ? "" : '<tr><td colspan="11">No players found.</td></tr>') +
        "</tbody></table>";
}

function csvCell(value) {
    const text = String(value == null ? "" : value);
    const safeText = /^[\s]*[=+\-@]/.test(text) ? "'" + text : text;
    return '"' + safeText.replace(/"/g, '""') + '"';
}

function downloadPlayerRatingsCsv() {
    const tournamentName = document.getElementById("playersTournament").value;
    const tournament = tournaments.find(function(item) { return item.name === tournamentName; });
    if (!tournament) return;

    const rows = [["Tournament", "Player", "Rating", "Campus"]].concat(
        getTournamentPlayers(tournamentName).slice().sort(function(a, b) {
            return a.name.localeCompare(b.name);
        }).map(function(player) {
            return [tournamentName, player.name, player.rating, player.campus || ""];
        })
    );
    const csv = "\uFEFF" + rows.map(function(row) {
        return row.map(csvCell).join(",");
    }).join("\r\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    const safeName = tournamentName.replace(/[\\/:*?"<>|]+/g, "-").trim() || "tournament";
    anchor.href = url;
    anchor.download = safeName + "-player-ratings.csv";
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    window.setTimeout(function() { URL.revokeObjectURL(url); }, 1000);
}

function sharePlayerRatingsOnWhatsApp() {
    const tournamentName = document.getElementById("playersTournament").value;
    const tournament = tournaments.find(function(item) { return item.name === tournamentName; });
    if (!tournament) return;

    const count = getTournamentPlayers(tournamentName).length;
    const message = "Player names and ratings for " + tournamentName + " (" + count +
        " participants). Please attach the downloaded roster CSV.";
    window.open("https://wa.me/?text=" + encodeURIComponent(message), "_blank", "noopener");
}

function renderPairings() {
    const tournamentName = document.getElementById("pairingsTournament").value;
    const round = document.getElementById("pairingsRound").value;
    const table = document.getElementById("pairingsTable");
    const notice = document.getElementById("pairingsNotice");

    if (!tournamentName || !round) {
        notice.textContent = tournaments.length ?
            "Select a tournament and round to view pairings." :
            "Create a tournament first; pairings will appear once at least two players are registered.";
        table.innerHTML = "";
        return;
    }

    let roundPairings = getPairingsForRound(tournamentName, round);
    let generated = false;
    if (!roundPairings.length) {
        const result = ensurePairings(tournamentName, Number(round));
        generated = result.generated;
        roundPairings = getPairingsForRound(tournamentName, round);
        if (!roundPairings.length) {
            notice.textContent = result.message;
            table.innerHTML = "";
            return;
        }
    }

    notice.textContent = generated ?
        "Automatically created " + roundPairings.length + " pairing" +
            (roundPairings.length === 1 ? "" : "s") + " for Round " + round + "." :
        roundPairings.length + " pairing" + (roundPairings.length === 1 ? "" : "s") +
            " for Round " + round + ".";
    const rows = roundPairings.map(function(pairing, index) {
        const match = getMatchForPairing(pairing);
        const gameStatus = pairing.bye ? "Bye" :
            match ? match.score1 + "–" + match.score2 : "Awaiting score";
        const actions = pairing.bye ? "—" : [
            match ? "" : '<button type="button" class="small-action" data-score-pairing="' +
                escapeHtml(pairing.id) + '">Record score</button>',
            '<button type="button" class="small-action secondary-action" data-annotate-pairing="' +
                escapeHtml(pairing.id) + '">Annotate</button>'
        ].join(" ");
        return "<tr>" +
            "<td>" + (index + 1) + "</td>" +
            "<td>" + renderPairingPlayer(pairing.player1, tournamentName) + "</td>" +
            "<td>" + (pairing.bye ? '<span class="bye-label">BYE</span>' :
                renderPairingPlayer(pairing.player2, tournamentName)) + "</td>" +
            "<td>" + escapeHtml(gameStatus) +
            (pairing.rematch ? ' <span class="rematch-label">Rematch</span>' : "") + "</td>" +
            "<td>" + actions + "</td>" +
            "</tr>";
    });
    table.innerHTML = '<table class="scoreboard-table"><thead><tr>' +
        "<th>Board</th><th>Player 1</th><th>Player 2</th><th>Status</th><th>Actions</th>" +
        "</tr></thead><tbody>" + rows.join("") + "</tbody></table>";
}

function updateAnnotationPairingOptions() {
    const tournamentName = document.getElementById("annotationTournament").value;
    const round = document.getElementById("annotationRound").value;
    const pairingSelect = document.getElementById("annotationPairing");
    const selectedPairing = pairingSelect.value;
    const availablePairings = getPairingsForRound(tournamentName, round).filter(function(pairing) {
        return !pairing.bye;
    });
    pairingSelect.innerHTML = '<option value="">Select a paired game</option>';

    availablePairings.forEach(function(pairing) {
        const option = document.createElement("option");
        option.value = pairing.id;
        option.textContent = pairing.player1 + " vs " + pairing.player2;
        pairingSelect.appendChild(option);
    });
    if (availablePairings.some(function(pairing) { return pairing.id === selectedPairing; })) {
        pairingSelect.value = selectedPairing;
    }
    renderAnnotationPage();
}

function renderAnnotationPage() {
    const pairingId = document.getElementById("annotationPairing").value;
    const pairing = pairings.find(function(item) { return item.id === pairingId; });
    const content = document.getElementById("annotationContent");
    const notice = document.getElementById("annotationNotice");
    const table = document.getElementById("annotationMovesTable");

    if (!pairing || pairing.bye) {
        content.hidden = true;
        table.innerHTML = "";
        notice.textContent = document.getElementById("annotationTournament").value ?
            "Choose a round with generated pairings, then select a game to annotate." :
            "Choose a tournament and round to find a game to annotate.";
        return;
    }

    content.hidden = false;
    notice.textContent = pairing.player1 + " vs " + pairing.player2 +
        " · Round " + pairing.round + " · " + pairing.tournament;
    const moveRows = annotations.filter(function(move) {
        return move.pairingId === pairing.id;
    }).sort(function(a, b) { return a.turn - b.turn; }).map(function(move) {
        return [move.turn, move.player, move.word, move.score, move.notes || "—"];
    });
    table.innerHTML = createTable(["Turn", "Player", "Word", "Score", "Notes"], moveRows);

    const playerSelect = document.getElementById("annotationPlayer");
    const selectedPlayer = playerSelect.value;
    playerSelect.innerHTML = "";
    [pairing.player1, pairing.player2].forEach(function(name) {
        const option = document.createElement("option");
        option.value = name;
        option.textContent = name;
        playerSelect.appendChild(option);
    });
    if ([pairing.player1, pairing.player2].indexOf(selectedPlayer) !== -1) {
        playerSelect.value = selectedPlayer;
    }
}

function getTournamentStandings(tournamentName, beforeRound) {
    const standings = getTournamentPlayers(tournamentName).map(function(player) {
        return {
            name: player.name,
            rating: Number(player.rating) || 0,
            points: 0,
            spread: 0,
            byes: 0
        };
    });
    const byName = new Map(standings.map(function(player) { return [player.name, player]; }));
    matches.filter(function(match) {
        return match.tournament === tournamentName && Number(match.round) >= 1 &&
            Number(match.round) < beforeRound;
    }).forEach(function(match) {
        const first = byName.get(match.player1);
        const second = byName.get(match.player2);
        if (!first || !second) return;
        const score1 = Number(match.score1);
        const score2 = Number(match.score2);
        first.spread += score1 - score2;
        second.spread += score2 - score1;
        if (score1 > score2) first.points += 1;
        else if (score2 > score1) second.points += 1;
        else {
            first.points += 0.5;
            second.points += 0.5;
        }
    });
    pairings.filter(function(pairing) {
        return pairing.tournament === tournamentName && Number(pairing.round) < beforeRound && pairing.bye;
    }).forEach(function(pairing) {
        const player = byName.get(pairing.player1);
        if (player) {
            player.points += 1;
            player.byes += 1;
        }
    });

    return standings.filter(function(player) {
        return !isPlayerWithdrawn(tournamentName, player.name);
    }).sort(function(a, b) {
        if (beforeRound === 1) return b.rating - a.rating || a.name.localeCompare(b.name);
        return b.points - a.points || b.spread - a.spread ||
            b.rating - a.rating || a.name.localeCompare(b.name);
    });
}

function getPreviousOpponents(tournamentName, beforeRound) {
    const opponents = new Map(getTournamentPlayers(tournamentName).map(function(player) {
        return [player.name, new Set()];
    }));
    matches.filter(function(match) {
        return match.tournament === tournamentName && Number(match.round) >= 1 &&
            Number(match.round) < beforeRound;
    }).forEach(function(match) {
        if (opponents.has(match.player1) && opponents.has(match.player2)) {
            opponents.get(match.player1).add(match.player2);
            opponents.get(match.player2).add(match.player1);
        }
    });
    return opponents;
}

function findNoRematchPairing(remaining, opponents) {
    let attempts = 0;
    function search(unpaired) {
        if (!unpaired.length) return [];
        attempts += 1;
        if (attempts > 25000) return null;

        const first = unpaired[0];
        for (let index = 1; index < unpaired.length; index += 1) {
            const candidate = unpaired[index];
            if (opponents.get(first.name).has(candidate.name)) continue;
            const rest = unpaired.slice(1, index).concat(unpaired.slice(index + 1));
            const solution = search(rest);
            if (solution) return [[first, candidate]].concat(solution);
        }
        return null;
    }
    return search(remaining);
}

function makeSwissPairings(tournamentName, round) {
    const standings = getTournamentStandings(tournamentName, round);
    const byes = pairings.filter(function(pairing) {
        return pairing.tournament === tournamentName && pairing.bye && Number(pairing.round) < round;
    }).map(function(pairing) { return pairing.player1; });

    let byePlayer = null;
    if (standings.length % 2 === 1) {
        for (let index = standings.length - 1; index >= 0; index -= 1) {
            if (byes.indexOf(standings[index].name) === -1) {
                byePlayer = standings[index];
                break;
            }
        }
        if (!byePlayer) byePlayer = standings[standings.length - 1];
    }

    const remaining = standings.filter(function(player) {
        return !byePlayer || player.name !== byePlayer.name;
    });
    const opponents = getPreviousOpponents(tournamentName, round);
    let pairedPlayers = [];

    if (round === 1) {
        const half = remaining.length / 2;
        for (let index = 0; index < half; index += 1) {
            pairedPlayers.push([remaining[index], remaining[index + half]]);
        }
    } else {
        pairedPlayers = findNoRematchPairing(remaining, opponents);
        if (!pairedPlayers) return null;
    }

    const newPairings = pairedPlayers.map(function(pair, index) {
        return {
            id: Date.now().toString(36) + "-" + round + "-" + index + "-" +
                Math.random().toString(36).slice(2, 8),
            tournament: tournamentName,
            round: round,
            player1: pair[0].name,
            player2: pair[1].name,
            bye: false,
            rematch: opponents.get(pair[0].name).has(pair[1].name)
        };
    });
    if (byePlayer) {
        newPairings.push({
            id: Date.now().toString(36) + "-" + round + "-bye-" + Math.random().toString(36).slice(2, 8),
            tournament: tournamentName,
            round: round,
            player1: byePlayer.name,
            player2: "",
            bye: true,
            rematch: false
        });
    }
    return newPairings;
}

function ensurePairings(tournamentName, round) {
    if (!tournamentName || !round) {
        return { generated: false, message: "Select a tournament and round to view pairings." };
    }
    const availablePlayers = getTournamentPlayers(tournamentName).filter(function(player) {
        return !isPlayerWithdrawn(tournamentName, player.name);
    });
    if (availablePlayers.length < 2) {
        return {
            generated: false,
            message: "Add at least two available players to this tournament's roster to create pairings."
        };
    }
    if (getPairingsForRound(tournamentName, round).length) {
        return { generated: false, message: "" };
    }
    if (round > 1) {
        const previousPairings = getPairingsForRound(tournamentName, round - 1);
        if (!previousPairings.length) {
            return {
                generated: false,
                message: "Round " + round + " will be paired automatically after Round " +
                    (round - 1) + " is generated and completed."
            };
        }
        const incomplete = previousPairings.some(function(pairing) {
            return !pairing.bye && !getMatchForPairing(pairing);
        });
        if (incomplete) {
            return {
                generated: false,
                message: "Round " + round + " will be paired automatically after all Round " +
                    (round - 1) + " scores are entered."
            };
        }
    }

    const generated = makeSwissPairings(tournamentName, round);
    if (!generated) {
        return {
            generated: false,
            message: "No complete repeat-free pairing could be found for Round " + round +
                " with the current results. No rematch was created."
        };
    }
    pairings = pairings.concat(generated);
    localStorage.setItem("scrabblePairings", JSON.stringify(pairings));
    updateActiveRoundsDisplay();
    updateAnnotationPairingOptions();
    return { generated: true, message: "" };
}

function advancePairingsAfterScore(tournamentName, round) {
    const tournament = tournaments.find(function(item) { return item.name === tournamentName; });
    const roundPairings = getPairingsForRound(tournamentName, round);
    if (!tournament || !roundPairings.length || roundPairings.some(function(pairing) {
        return !pairing.bye && !getMatchForPairing(pairing);
    })) {
        return;
    }

    const nextRound = Number(round) + 1;
    if (nextRound > Number(tournament.rounds)) return;

    const tournamentSelect = document.getElementById("pairingsTournament");
    const roundSelect = document.getElementById("pairingsRound");
    tournamentSelect.value = tournamentName;
    updateRoundOptions(tournamentSelect, roundSelect, "Select a tournament first");
    roundSelect.value = String(nextRound);
    renderPairings();
}

function getFilteredMatches() {
    const tournamentName = document.getElementById("statisticsTournament").value;
    return matches.filter(function(match) {
        return tournamentName === "all" || match.tournament === tournamentName;
    }).filter(function(match) {
        return match.player1 && match.player2 &&
            Number.isFinite(Number(match.score1)) && Number.isFinite(Number(match.score2));
    });
}

function matchRound(match) {
    return match.round ? "Round " + match.round : "Unassigned";
}

function getStats(games) {
    const statsByName = new Map();
    players.forEach(function(player) {
        if (player && player.name) {
            statsByName.set(player.name, {
                name: player.name,
                rating: Number(player.rating) || 0,
                games: 0,
                wins: 0,
                losses: 0,
                draws: 0,
                total: 0,
                opponentTotal: 0,
                closeLosses: 0
            });
        }
    });

    function ensurePlayer(name) {
        if (!statsByName.has(name)) {
            statsByName.set(name, {
                name: name,
                rating: 0,
                games: 0,
                wins: 0,
                losses: 0,
                draws: 0,
                total: 0,
                opponentTotal: 0,
                closeLosses: 0
            });
        }
        return statsByName.get(name);
    }

    games.forEach(function(game) {
        const first = ensurePlayer(game.player1);
        const second = ensurePlayer(game.player2);
        const score1 = Number(game.score1);
        const score2 = Number(game.score2);
        first.games += 1;
        second.games += 1;
        first.total += score1;
        second.total += score2;
        first.opponentTotal += score2;
        second.opponentTotal += score1;

        if (score1 > score2) {
            first.wins += 1;
            second.losses += 1;
            if (score1 - score2 <= 10) second.closeLosses += 1;
        } else if (score2 > score1) {
            second.wins += 1;
            first.losses += 1;
            if (score2 - score1 <= 10) first.closeLosses += 1;
        } else {
            first.draws += 1;
            second.draws += 1;
        }
    });

    return Array.from(statsByName.values()).filter(function(player) {
        return player.games > 0;
    }).map(function(player) {
        player.average = player.total / player.games;
        player.averageOpponent = player.opponentTotal / player.games;
        player.spread = player.total - player.opponentTotal;
        return player;
    });
}

function createTable(headers, rows) {
    const body = rows.length ? rows.map(function(row) {
        return "<tr>" + row.map(function(cell) {
            return "<td>" + escapeHtml(cell) + "</td>";
        }).join("") + "</tr>";
    }).join("") : '<tr><td colspan="' + headers.length + '">No records for this board yet.</td></tr>';
    return `
        <table class="scoreboard-table">
            <thead><tr>${headers.map(function(header) {
                return "<th>" + escapeHtml(header) + "</th>";
            }).join("")}</tr></thead>
            <tbody>${body}</tbody>
        </table>
    `;
}

function rankRows(stats, metric, direction) {
    return stats.slice().sort(function(a, b) {
        return (b[metric] - a[metric]) * direction ||
            b.spread - a.spread ||
            a.name.localeCompare(b.name);
    });
}

function renderPlayerBoard(games, stats, config) {
    const ranked = rankRows(stats, config.metric, config.direction);
    return createTable(config.headers, ranked.slice(0, config.limit || ranked.length).map(function(player, index) {
        return config.row(player, index + 1);
    }));
}

function renderGamesBoard(games, gameList) {
    const rows = gameList.map(function(game, index) {
        return [
            index + 1,
            game.player1 + " " + game.score1 + " – " + game.score2 + " " + game.player2,
            Number(game.score1) + Number(game.score2),
            matchRound(game),
            game.tournament || "Unassigned"
        ];
    });
    return createTable(["#", "Game", "Combined", "Round", "Tournament"], rows);
}

function renderWallChart(games) {
    const rounds = Array.from(new Set(games.map(matchRound))).sort(function(a, b) {
        const roundA = parseInt(a.replace(/\D/g, ""), 10) || 0;
        const roundB = parseInt(b.replace(/\D/g, ""), 10) || 0;
        return roundA - roundB;
    });
    const names = new Set();
    games.forEach(function(game) {
        names.add(game.player1);
        names.add(game.player2);
    });
    const rows = Array.from(names).sort().map(function(name) {
        const cells = rounds.map(function(round) {
            const game = games.find(function(item) {
                return matchRound(item) === round && (item.player1 === name || item.player2 === name);
            });
            if (!game) return "—";
            const ownScore = game.player1 === name ? game.score1 : game.score2;
            const otherScore = game.player1 === name ? game.score2 : game.score1;
            const opponent = game.player1 === name ? game.player2 : game.player1;
            return ownScore + "–" + otherScore + " vs " + opponent;
        });
        return [name].concat(cells);
    });
    return createTable(["Player"].concat(rounds), rows);
}

function renderInstitutionBoard(stats) {
    const statsByName = new Map(stats.map(function(player) {
        return [player.name, player];
    }));
    const institutions = new Map();
    let unassignedPlayers = 0;

    players.forEach(function(player) {
        const campus = String(player.campus || "").trim();
        if (!campus) {
            unassignedPlayers += 1;
            return;
        }

        const key = campus.toLocaleLowerCase();
        if (!institutions.has(key)) {
            institutions.set(key, {
                name: campus,
                players: 0,
                playersWithGames: 0,
                averageTotal: 0,
                tournamentPoints: 0,
                wins: 0,
                draws: 0
            });
        }
        const institution = institutions.get(key);
        institution.players += 1;

        const playerStats = statsByName.get(player.name);
        if (!playerStats) return;
        institution.playersWithGames += 1;
        institution.averageTotal += playerStats.average;
        institution.tournamentPoints += playerStats.wins + playerStats.draws * 0.5;
        institution.wins += playerStats.wins;
        institution.draws += playerStats.draws;
    });

    const unassignedNotice = unassignedPlayers ?
        '<p class="page-notice">' + unassignedPlayers +
            (unassignedPlayers === 1 ? " player has" : " players have") +
            ' no campus assigned. Add one in the Players directory to include them.</p>' : "";
    const ranked = Array.from(institutions.values()).map(function(institution) {
        institution.average = institution.playersWithGames ?
            institution.averageTotal / institution.playersWithGames : null;
        return institution;
    }).sort(function(a, b) {
        return b.tournamentPoints - a.tournamentPoints ||
            (b.average || 0) - (a.average || 0) ||
            a.name.localeCompare(b.name);
    });

    if (!ranked.length) {
        return unassignedNotice +
            '<p class="page-notice">Assign a campus to players in the Players directory to see institution results.</p>';
    }

    const topPoints = ranked[0].tournamentPoints;
    const leaders = ranked.filter(function(institution) {
        return institution.tournamentPoints === topPoints;
    });
    const leaderNotice = topPoints ?
        "Leading institution by tournament points: " +
            leaders.map(function(institution) { return institution.name; }).join(", ") +
            " (" + topPoints.toFixed(1) + " points)." :
        "No institution has earned tournament points yet.";
    const rows = ranked.map(function(institution, index) {
        const rank = index > 0 && institution.tournamentPoints === ranked[index - 1].tournamentPoints ?
            ranked[index - 1].rank : index + 1;
        institution.rank = rank;
        return [
            rank,
            institution.name,
            institution.players,
            institution.playersWithGames,
            institution.average === null ? "—" : institution.average.toFixed(1),
            institution.tournamentPoints.toFixed(1),
            institution.wins,
            institution.draws
        ];
    });
    return unassignedNotice +
        '<p class="page-notice"><strong>' + escapeHtml(leaderNotice) + "</strong> " +
        "Campus average is the mean of member players' per-game averages.</p>" +
        createTable(
            ["Rank", "Institution / campus", "Players", "Players with games",
                "Average points per game", "Tournament points", "Wins", "Draws"],
            rows
        );
}

function getBoardMarkup(games, stats) {
    const gamesByTotal = games.slice().sort(function(a, b) {
        return (Number(b.score1) + Number(b.score2)) - (Number(a.score1) + Number(a.score2));
    });
    const gamesBySpread = games.slice().sort(function(a, b) {
        return Math.abs(Number(b.score1) - Number(b.score2)) - Math.abs(Number(a.score1) - Number(a.score2));
    });
    const gamesByLosingScore = games.filter(function(game) {
        return Number(game.score1) !== Number(game.score2);
    }).sort(function(a, b) {
        const losingScore = function(item) {
            return Math.min(Number(item.score1), Number(item.score2));
        };
        return losingScore(b) - losingScore(a);
    });

    switch (currentBoard) {
        case "average-scores":
            return renderPlayerBoard(games, stats, {
                metric: "average", direction: 1, headers: ["#", "Player", "Games", "Average score", "Total points"],
                row: function(player, rank) { return [rank, player.name, player.games, player.average.toFixed(1), player.total]; }
            });
        case "average-opponent":
            return renderPlayerBoard(games, stats, {
                metric: "averageOpponent", direction: 1, headers: ["#", "Player", "Games", "Average opponent score"],
                row: function(player, rank) { return [rank, player.name, player.games, player.averageOpponent.toFixed(1)]; }
            });
        case "combined":
            return renderGamesBoard(games, gamesByTotal);
        case "high-losses":
            return renderPlayerBoard(games, stats, {
                metric: "losses", direction: 1, headers: ["#", "Player", "Losses", "Spread", "Games", "Wins"],
                row: function(player, rank) { return [rank, player.name, player.losses, player.spread, player.games, player.wins]; }
            });
        case "spreads":
            return renderGamesBoard(games, gamesBySpread);
        case "high-wins":
            return renderPlayerBoard(games, stats, {
                metric: "wins", direction: 1, headers: ["#", "Player", "Wins", "Spread", "Games", "Losses"],
                row: function(player, rank) { return [rank, player.name, player.wins, player.spread, player.games, player.losses]; }
            });
        case "low-losses":
            return renderPlayerBoard(games, stats, {
                metric: "losses", direction: -1, headers: ["#", "Player", "Losses", "Games", "Wins"],
                row: function(player, rank) { return [rank, player.name, player.losses, player.games, player.wins]; }
            });
        case "low-wins":
            return renderPlayerBoard(games, stats, {
                metric: "wins", direction: -1, headers: ["#", "Player", "Wins", "Games", "Losses"],
                row: function(player, rank) { return [rank, player.name, player.wins, player.games, player.losses]; }
            });
        case "lucky-stiffs":
            return renderGamesBoard(games, gamesByLosingScore);
        case "scoreboard-1-16":
            return renderPlayerBoard(games, stats, {
                metric: "wins", direction: 1, limit: 16,
                headers: ["Rank", "Player", "Wins", "Losses", "Spread", "Total points"],
                row: function(player, rank) { return [rank, player.name, player.wins, player.losses, player.spread, player.total]; }
            });
        case "score-card":
            return renderGamesBoard(games, games.slice().reverse());
        case "high-total":
            return renderPlayerBoard(games, stats, {
                metric: "total", direction: 1, headers: ["#", "Player", "Total points", "Games", "Average"],
                row: function(player, rank) { return [rank, player.name, player.total, player.games, player.average.toFixed(1)]; }
            });
        case "tuff-luck":
            return renderPlayerBoard(games, stats, {
                metric: "closeLosses", direction: 1, headers: ["#", "Player", "Close losses", "Total losses", "Close-loss rate"],
                row: function(player, rank) {
                    const rate = player.losses ? (player.closeLosses / player.losses * 100).toFixed(0) + "%" : "—";
                    return [rank, player.name, player.closeLosses, player.losses, rate];
                }
            });
        case "upsets":
            const upsetGames = games.filter(function(game) {
                const player1 = players.find(function(player) { return player.name === game.player1; });
                const player2 = players.find(function(player) { return player.name === game.player2; });
                const rating1 = Number(player1 && player1.rating) || 0;
                const rating2 = Number(player2 && player2.rating) || 0;
                return (Number(game.score1) > Number(game.score2) && rating2 > rating1) ||
                    (Number(game.score2) > Number(game.score1) && rating1 > rating2);
            }).sort(function(a, b) {
                const gap = function(game) {
                    const first = players.find(function(player) { return player.name === game.player1; });
                    const second = players.find(function(player) { return player.name === game.player2; });
                    return Math.abs((Number(first && first.rating) || 0) - (Number(second && second.rating) || 0));
                };
                return gap(b) - gap(a);
            });
            return renderGamesBoard(games, upsetGames);
        case "wall-chart":
            return renderWallChart(games);
        case "institutions":
            return renderInstitutionBoard(stats);
        default:
            return renderPlayerBoard(games, stats, {
                metric: "wins", direction: 1,
                headers: ["#", "Player", "Games", "Wins", "Losses", "Draws", "Total points", "Average", "Spread"],
                row: function(player, rank) {
                    return [rank, player.name, player.games, player.wins, player.losses, player.draws,
                        player.total, player.average.toFixed(1), player.spread];
                }
            });
    }
}

function updateStatistics() {
    const games = getFilteredMatches();
    const stats = getStats(games);
    const gameTotals = games.map(function(game) {
        return Number(game.score1) + Number(game.score2);
    });
    const spreads = games.map(function(game) {
        return Math.abs(Number(game.score1) - Number(game.score2));
    });

    document.getElementById("statsGamesCount").textContent = games.length;
    document.getElementById("statsPlayersCount").textContent = stats.length;
    document.getElementById("statsHighestTotal").textContent = gameTotals.length ? Math.max.apply(null, gameTotals) : "—";
    document.getElementById("statsBiggestSpread").textContent = spreads.length ? Math.max.apply(null, spreads) : "—";

    const details = boardDetails[currentBoard];
    document.getElementById("scoreboardTitle").textContent = details[0];
    document.getElementById("scoreboardDescription").textContent = details[1];
    const table = document.getElementById("scoreboardTable");
    const empty = document.getElementById("scoreboardEmpty");
    if (!games.length) {
        table.innerHTML = "";
        table.hidden = true;
        empty.hidden = false;
        return;
    }

    table.innerHTML = getBoardMarkup(games, stats);
    table.hidden = false;
    empty.hidden = true;
}

function openScoreDialog(context) {
    const form = document.getElementById("scoreForm");
    form.reset();
    document.getElementById("scoreFormError").textContent = "";
    const player1Select = document.getElementById("scorePlayer1");
    const player2Select = document.getElementById("scorePlayer2");
    const tournamentSelect = document.getElementById("scoreTournament");
    const roundInput = document.getElementById("scoreRound");
    [player1Select, player2Select, tournamentSelect, roundInput].forEach(function(field) {
        field.disabled = false;
    });
    if (players.length < 2) {
        populatePlayerOptions(tournamentSelect.value);
        document.getElementById("scoreFormError").textContent =
            "Register at least two players before entering a score.";
        document.getElementById("scoreDialog").showModal();
        return;
    }
    if (context) {
        tournamentSelect.value = context.tournament;
    }
    populatePlayerOptions(tournamentSelect.value);
    if (context) {
        player1Select.value = String(players.findIndex(function(player) {
            return player.name === context.player1;
        }));
        player2Select.value = String(players.findIndex(function(player) {
            return player.name === context.player2;
        }));
        tournamentSelect.value = context.tournament;
        roundInput.value = String(context.round);
        [player1Select, player2Select, tournamentSelect, roundInput].forEach(function(field) {
            field.disabled = true;
        });
    }
    document.getElementById("scoreDialog").showModal();
}

function openPlayerDialog() {
    document.getElementById("playerForm").reset();
    document.getElementById("playerFormError").textContent = "";
    document.getElementById("playerTournament").value = getCurrentTournamentName();
    document.getElementById("playerDialog").showModal();
}

function openCampusDialog(playerName) {
    const player = players.find(function(item) { return item.name === playerName; });
    if (!player) return;
    editingCampusPlayerName = playerName;
    document.getElementById("campusValue").value = player.campus || "";
    document.getElementById("campusDialog").showModal();
}

function openTournamentDialog() {
    document.getElementById("tournamentForm").reset();
    document.getElementById("tournamentFormError").textContent = "";
    document.getElementById("tournamentDialog").showModal();
}

function openWithdrawalDialog(tournamentName, playerName) {
    const withdrawn = isPlayerWithdrawn(tournamentName, playerName);
    pendingWithdrawal = {
        tournamentName: tournamentName,
        playerName: playerName,
        withdrawn: withdrawn
    };
    document.getElementById("withdrawalDialogTitle").textContent =
        withdrawn ? "Reinstate player?" : "Kick out player?";
    document.getElementById("withdrawalDialogMessage").textContent = withdrawn ?
        playerName + " will be included in pairings generated from now on." :
        playerName + "'s current-round pairings and recorded results will stay unchanged. " +
            "They will be left out of later rounds.";
    document.getElementById("confirmWithdrawalButton").textContent = withdrawn ? "Reinstate" : "Kick out";
    document.getElementById("withdrawalDialog").showModal();
}

function confirmPlayerWithdrawal() {
    if (!pendingWithdrawal) return;
    const tournament = tournaments.find(function(item) {
        return item.name === pendingWithdrawal.tournamentName;
    });
    if (!tournament) return;

    if (!Array.isArray(tournament.withdrawnPlayers)) tournament.withdrawnPlayers = [];
    if (pendingWithdrawal.withdrawn) {
        tournament.withdrawnPlayers = tournament.withdrawnPlayers.filter(function(name) {
            return name !== pendingWithdrawal.playerName;
        });
    } else if (tournament.withdrawnPlayers.indexOf(pendingWithdrawal.playerName) === -1) {
        tournament.withdrawnPlayers.push(pendingWithdrawal.playerName);
    }
    localStorage.setItem("scrabbleTournaments", JSON.stringify(tournaments));
    pendingWithdrawal = null;
    document.getElementById("withdrawalDialog").close();
    renderPairings();
}

function showPage(page) {
    const pageIds = {
        dashboard: "dashboardPage",
        players: "playersPage",
        pairings: "pairingsPage",
        annotation: "annotationPage",
        statistics: "statisticsPage"
    };
    Object.keys(pageIds).forEach(function(pageName) {
        document.getElementById(pageIds[pageName]).hidden = pageName !== page;
    });
    document.querySelectorAll(".sidebar nav a[data-page]").forEach(function(link) {
        link.classList.toggle("active", link.dataset.page === page);
    });
    if (page === "players") renderPlayers();
    if (page === "pairings") renderPairings();
    if (page === "annotation") updateAnnotationPairingOptions();
    if (page === "statistics") updateStatistics();
}

function createTournamentFromForm(event) {
    event.preventDefault();
    const name = document.getElementById("tournamentName").value.trim();
    const venue = document.getElementById("tournamentVenue").value.trim();
    const date = document.getElementById("tournamentDate").value.trim();
    const rounds = Number(document.getElementById("tournamentRounds").value);
    const error = document.getElementById("tournamentFormError");

    if (!name || !venue || !date) {
        error.textContent = "Enter the tournament name, venue, and date.";
        return;
    }
    if (tournaments.some(function(tournament) {
        return tournament.name.toLowerCase() === name.toLowerCase();
    })) {
        error.textContent = "A tournament with that name already exists.";
        return;
    }
    if (!Number.isInteger(rounds) || rounds < 1) {
        error.textContent = "Enter a whole number of rounds greater than zero.";
        return;
    }

    tournaments.push({
        name: name,
        venue: venue,
        date: date,
        rounds: rounds,
        playerNames: []
    });
    saveTournaments();
    document.getElementById("tournamentDialog").close();
    document.getElementById("tournamentForm").reset();
    updateDashboard();
    const pairingsTournament = document.getElementById("pairingsTournament");
    pairingsTournament.value = name;
    updateRoundOptions(
        pairingsTournament,
        document.getElementById("pairingsRound"),
        "Select a tournament first"
    );
    document.getElementById("pairingsRound").value = "1";
    renderPairings();
    document.getElementById("playersTournament").value = name;
    document.getElementById("playerRosterNotice").textContent =
        "New tournament created with an empty roster. Register new players or use Add to roster for existing directory players.";
    showPage("players");
}

document.getElementById("newTournamentBtn").addEventListener("click", openTournamentDialog);
document.getElementById("startAnotherTournamentBtn").addEventListener("click", openTournamentDialog);
document.getElementById("tournamentForm").addEventListener("submit", createTournamentFromForm);
document.getElementById("closeTournamentDialog").addEventListener("click", function() {
    document.getElementById("tournamentDialog").close();
});
document.getElementById("cancelTournamentDialog").addEventListener("click", function() {
    document.getElementById("tournamentDialog").close();
});

document.getElementById("registerPlayerBtn").addEventListener("click", openPlayerDialog);
document.getElementById("playersRegisterBtn").addEventListener("click", openPlayerDialog);
document.getElementById("playerForm").addEventListener("submit", function(event) {
    event.preventDefault();
    const name = document.getElementById("playerName").value.trim();
    const rating = Number(document.getElementById("playerRating").value);
    const campus = document.getElementById("playerCampus").value.trim();
    const tournamentName = document.getElementById("playerTournament").value;
    const error = document.getElementById("playerFormError");

    if (!name) {
        error.textContent = "Enter the player's name.";
        return;
    }
    if (players.some(function(player) {
        return player.name && player.name.toLowerCase() === name.toLowerCase();
    })) {
        error.textContent = "A player with that name is already registered.";
        return;
    }
    if (!Number.isFinite(rating) || rating < 0) {
        error.textContent = "Enter a valid player rating of zero or more.";
        return;
    }
    if (tournamentName) {
        const tournament = tournaments.find(function(item) { return item.name === tournamentName; });
        if (!tournament || isTournamentComplete(tournament)) {
            error.textContent = "Choose an active tournament or leave the player in the directory only.";
            return;
        }
    }

    players.push({ name: name, rating: rating, campus: campus });
    localStorage.setItem("scrabblePlayers", JSON.stringify(players));
    if (tournamentName) addPlayerToTournament(name, tournamentName);
    document.getElementById("playerDialog").close();
    document.getElementById("playerForm").reset();
    updateDashboard();
    if (tournamentName) {
        document.getElementById("playerRosterNotice").textContent =
            name + " was added to " + tournamentName + ".";
    }
    if (!document.getElementById("playersPage").hidden) renderPlayers();
    updateStatistics();
});

document.getElementById("closePlayerDialog").addEventListener("click", function() {
    document.getElementById("playerDialog").close();
});
document.getElementById("cancelPlayerDialog").addEventListener("click", function() {
    document.getElementById("playerDialog").close();
});

document.getElementById("closeCampusDialog").addEventListener("click", function() {
    document.getElementById("campusDialog").close();
});
document.getElementById("cancelCampusDialog").addEventListener("click", function() {
    document.getElementById("campusDialog").close();
});
document.getElementById("campusForm").addEventListener("submit", function(event) {
    event.preventDefault();
    const player = players.find(function(item) { return item.name === editingCampusPlayerName; });
    if (!player) return;

    player.campus = document.getElementById("campusValue").value.trim();
    localStorage.setItem("scrabblePlayers", JSON.stringify(players));
    document.getElementById("campusDialog").close();
    renderPlayers();
    updateStatistics();
});

document.getElementById("createPairingBtn").addEventListener("click", function() {
    showPage("pairings");
});

document.getElementById("enterScoreBtn").addEventListener("click", openScoreDialog);
document.getElementById("statisticsScoreBtn").addEventListener("click", openScoreDialog);
document.getElementById("emptyScoreBtn").addEventListener("click", openScoreDialog);
document.getElementById("viewStandingsBtn").addEventListener("click", function() {
    currentBoard = "scoreboard-1-16";
    document.querySelectorAll(".scoreboard-link").forEach(function(link) {
        link.classList.toggle("active", link.dataset.board === currentBoard);
    });
    showPage("statistics");
});

document.querySelectorAll(".sidebar nav a[data-action]").forEach(function(link) {
    link.addEventListener("click", function(event) {
        event.preventDefault();
        if (link.dataset.action === "score-entry") {
            openScoreDialog();
        } else {
            currentBoard = "scoreboard-1-16";
            document.querySelectorAll(".scoreboard-link").forEach(function(item) {
                item.classList.toggle("active", item.dataset.board === currentBoard);
            });
            showPage("statistics");
        }
    });
});

document.querySelectorAll(".scoreboard-link").forEach(function(link) {
    link.addEventListener("click", function() {
        currentBoard = link.dataset.board;
        document.querySelectorAll(".scoreboard-link").forEach(function(item) {
            item.classList.toggle("active", item === link);
        });
        updateStatistics();
    });
});

document.getElementById("statisticsTournament").addEventListener("change", updateStatistics);
document.getElementById("pairingsTournament").addEventListener("change", function() {
    const tournamentSelect = document.getElementById("pairingsTournament");
    const roundSelect = document.getElementById("pairingsRound");
    updateRoundOptions(
        tournamentSelect,
        roundSelect,
        "Select a tournament first"
    );
    if (tournamentSelect.value) {
        roundSelect.value = String(getNextPairingRound(tournamentSelect.value));
    }
    renderPairings();
});
document.getElementById("pairingsRound").addEventListener("change", renderPairings);
document.getElementById("playerSearch").addEventListener("input", renderPlayers);
document.getElementById("playersTournament").addEventListener("change", function() {
    document.getElementById("playerRosterNotice").textContent =
        "Roster changes affect only this tournament. Download the CSV, then attach it in WhatsApp.";
    renderPlayers();
});
document.getElementById("downloadPlayerRatingsBtn").addEventListener("click", downloadPlayerRatingsCsv);
document.getElementById("sharePlayerRatingsBtn").addEventListener("click", sharePlayerRatingsOnWhatsApp);
document.getElementById("playersTable").addEventListener("click", function(event) {
    const addButton = event.target.closest("[data-add-to-tournament]");
    if (addButton) {
        const tournamentName = document.getElementById("playersTournament").value;
        const playerName = addButton.dataset.addToTournament;
        const hasPairings = pairings.some(function(pairing) {
            return pairing.tournament === tournamentName;
        });
        if (addPlayerToTournament(playerName, tournamentName)) {
            updateDashboard();
            document.getElementById("playerRosterNotice").textContent =
                playerName + " was added to " + tournamentName +
                (hasPairings ? ". Existing pairings stay unchanged; the player can join future rounds." : ".");
        } else {
            document.getElementById("playerRosterNotice").textContent =
                "The player could not be added to this tournament.";
        }
        return;
    }

    const editButton = event.target.closest("[data-edit-campus]");
    if (!editButton) return;
    openCampusDialog(editButton.dataset.editCampus);
});
document.getElementById("scoreTournament").addEventListener("change", function() {
    populatePlayerOptions(this.value);
    const assignedPlayers = this.value ? getTournamentPlayers(this.value) : players;
    document.getElementById("scoreFormError").textContent = assignedPlayers.length < 2 ?
        "At least two players must be available for the selected tournament." : "";
});
document.getElementById("annotationTournament").addEventListener("change", function() {
    updateRoundOptions(
        document.getElementById("annotationTournament"),
        document.getElementById("annotationRound"),
        "Select a tournament first"
    );
    updateAnnotationPairingOptions();
});
document.getElementById("annotationRound").addEventListener("change", updateAnnotationPairingOptions);
document.getElementById("annotationPairing").addEventListener("change", renderAnnotationPage);
document.getElementById("closeWithdrawalDialog").addEventListener("click", function() {
    pendingWithdrawal = null;
    document.getElementById("withdrawalDialog").close();
});
document.getElementById("cancelWithdrawalDialog").addEventListener("click", function() {
    pendingWithdrawal = null;
    document.getElementById("withdrawalDialog").close();
});
document.getElementById("confirmWithdrawalButton").addEventListener("click", confirmPlayerWithdrawal);
document.getElementById("withdrawalDialog").addEventListener("cancel", function() {
    pendingWithdrawal = null;
});
document.getElementById("pairingsTable").addEventListener("click", function(event) {
    const withdrawalButton = event.target.closest("[data-toggle-withdrawal]");
    if (withdrawalButton) {
        openWithdrawalDialog(
            withdrawalButton.dataset.withdrawalTournament,
            withdrawalButton.dataset.toggleWithdrawal
        );
        return;
    }

    const scoreButton = event.target.closest("[data-score-pairing]");
    if (scoreButton) {
        const pairing = pairings.find(function(item) { return item.id === scoreButton.dataset.scorePairing; });
        if (pairing) openScoreDialog(pairing);
        return;
    }
    const annotationButton = event.target.closest("[data-annotate-pairing]");
    if (annotationButton) {
        const pairing = pairings.find(function(item) { return item.id === annotationButton.dataset.annotatePairing; });
        if (!pairing) return;
        document.getElementById("annotationTournament").value = pairing.tournament;
        updateRoundOptions(
            document.getElementById("annotationTournament"),
            document.getElementById("annotationRound"),
            "Select a tournament first"
        );
        document.getElementById("annotationRound").value = String(pairing.round);
        updateAnnotationPairingOptions();
        document.getElementById("annotationPairing").value = pairing.id;
        showPage("annotation");
    }
});
document.getElementById("closeScoreDialog").addEventListener("click", function() {
    document.getElementById("scoreDialog").close();
});
document.getElementById("cancelScoreDialog").addEventListener("click", function() {
    document.getElementById("scoreDialog").close();
});

document.getElementById("scoreForm").addEventListener("submit", function(event) {
    event.preventDefault();
    const firstIndex = Number(document.getElementById("scorePlayer1").value);
    const secondIndex = Number(document.getElementById("scorePlayer2").value);
    const score1 = Number(document.getElementById("scoreValue1").value);
    const score2 = Number(document.getElementById("scoreValue2").value);
    const roundInput = document.getElementById("scoreRound").value;
    const error = document.getElementById("scoreFormError");

    if (!players[firstIndex] || !players[secondIndex] ||
        firstIndex === secondIndex || players[firstIndex].name === players[secondIndex].name) {
        error.textContent = "Choose two different players.";
        return;
    }
    if (!Number.isInteger(score1) || score1 < 0 || !Number.isInteger(score2) || score2 < 0) {
        error.textContent = "Scores must be whole numbers greater than or equal to zero.";
        return;
    }
    if (roundInput && (!Number.isInteger(Number(roundInput)) || Number(roundInput) < 1)) {
        error.textContent = "Round must be a whole number greater than zero.";
        return;
    }

    const tournamentName = document.getElementById("scoreTournament").value;
    const player1 = players[firstIndex].name;
    const player2 = players[secondIndex].name;
    if (tournamentName && (!isPlayerInTournament(player1, tournamentName) ||
        !isPlayerInTournament(player2, tournamentName))) {
        error.textContent = "Choose players assigned to the selected tournament.";
        return;
    }
    const duplicate = Boolean(tournamentName && roundInput) && matches.some(function(match) {
        return match.tournament === tournamentName &&
            Number(match.round) === Number(roundInput) &&
            ((match.player1 === player1 && match.player2 === player2) ||
                (match.player1 === player2 && match.player2 === player1));
    });
    if (duplicate) {
        error.textContent = "A score for this pairing and round has already been recorded.";
        return;
    }

    matches.push({
        player1: player1,
        player2: player2,
        score1: score1,
        score2: score2,
        round: roundInput ? Number(roundInput) : "",
        tournament: tournamentName,
        date: new Date().toISOString()
    });
    saveMatches();
    const form = document.getElementById("scoreForm");
    form.reset();
    ["scorePlayer1", "scorePlayer2", "scoreTournament", "scoreRound"].forEach(function(id) {
        document.getElementById(id).disabled = false;
    });
    document.getElementById("scoreDialog").close();
    updateDashboard();
    if (tournamentName && roundInput) {
        advancePairingsAfterScore(tournamentName, Number(roundInput));
    }
});

document.getElementById("annotationForm").addEventListener("submit", function(event) {
    event.preventDefault();
    const pairing = pairings.find(function(item) {
        return item.id === document.getElementById("annotationPairing").value;
    });
    const word = document.getElementById("annotationWord").value.trim();
    const score = Number(document.getElementById("annotationScore").value);
    const error = document.getElementById("annotationFormError");

    if (!pairing) {
        error.textContent = "Select a paired game before recording a move.";
        return;
    }
    if (!word) {
        error.textContent = "Enter the word played.";
        return;
    }
    if (!Number.isInteger(score) || score < 0) {
        error.textContent = "Move score must be a whole number greater than or equal to zero.";
        return;
    }

    const pairingMoves = annotations.filter(function(move) {
        return move.pairingId === pairing.id;
    });
    annotations.push({
        pairingId: pairing.id,
        tournament: pairing.tournament,
        round: pairing.round,
        turn: pairingMoves.length + 1,
        player: document.getElementById("annotationPlayer").value,
        word: word.toUpperCase(),
        score: score,
        notes: document.getElementById("annotationNotes").value.trim(),
        createdAt: new Date().toISOString()
    });
    localStorage.setItem("scrabbleAnnotations", JSON.stringify(annotations));
    document.getElementById("annotationForm").reset();
    error.textContent = "";
    renderAnnotationPage();
});

document.querySelectorAll(".sidebar nav a[data-page]").forEach(function(link) {
    link.addEventListener("click", function(event) {
        event.preventDefault();
        showPage(link.dataset.page);
    });
});

document.getElementById("statisticsPage").hidden = true;
updateDashboard();
