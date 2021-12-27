const express = require("express");
const path = require("path");
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");

const app = express();
app.use(express.json());

const dbPath = path.join(__dirname, "cricketMatchDetails.db");

let db = null;

const initializeDBAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });

    app.listen(3000, () => {
      console.log("Server Running at http://localhost:3000/");
    });
  } catch (e) {
    console.log(`DB Error: ${e.message}`);

    process.exit(1);
  }
};

initializeDBAndServer();

const convertPlayerDb = (object) => {
  return {
    playerId: object.player_id,
    playerName: object.player_name,
  };
};

const convertMatchDb = (object) => {
  return {
    matchId: object.match_id,
    match: object.match,
    year: object.year,
  };
};

app.get("/players/", async (request, response) => {
  const getAllPlayersQuery = `
    SELECT * FROM player_details;`;

  const allPlayers = await db.all(getAllPlayersQuery);
  response.send(allPlayers.map((eachPlayer) => convertPlayerDb(eachPlayer)));
});

app.get("/players/:playerId/", async (request, response) => {
  const { playerId } = request.params;

  const getRequiredPlayerQuery = `
    SELECT * FROM player_details WHERE player_id = ${playerId};`;

  const requiredPlayers = await db.get(getRequiredPlayerQuery);
  response.send(convertPlayerDb(requiredPlayers));
});

app.put("/players/:playerId/", async (request, response) => {
  const { playerId } = request.params;
  const { playerName } = request.body;

  const updatePlayerQuery = `
    UPDATE 
    player_details
    SET player_name = '${playerName}'
    WHERE player_id = ${playerId};`;

  const updatePlayer = await db.run(updatePlayerQuery);
  response.send("Player Details Updated");
});

app.get("/matches/:matchId/", async (request, response) => {
  const { matchId } = request.params;

  const getRequiredMatchQuery = `
    SELECT * FROM match_details WHERE match_id = ${matchId};`;

  const requiredMatch = await db.get(getRequiredMatchQuery);
  response.send(convertMatchDb(requiredMatch));
});

app.get("/players/:playerId/matches/", async (request, response) => {
  const { playerId } = request.params;

  const matchesOfaPlayerQuery = `
  SELECT
      *
    FROM player_match_score 
      NATURAL JOIN match_details
    WHERE
      player_id = ${playerId};`;

  let playerMatches = await db.all(matchesOfaPlayerQuery);
  response.send(playerMatches.map((match) => convertMatchDb(match)));
});

app.get("/matches/:matchId/players/", async (request, response) => {
  const { matchId } = request.params;

  const playersOfMatchQuery = `
   SELECT
      *
    FROM player_match_score
      NATURAL JOIN player_details
    WHERE
      match_id = ${matchId};`;

  let matchesOfPlayers = await db.all(playersOfMatchQuery);
  response.send(matchesOfPlayers.map((player) => convertPlayerDb(player)));
});

app.get("/players/:playerId/playerScores/", async (request, response) => {
  const { playerId } = request.params;
  const getPlayerStatsQuery = `
     SELECT
      player_id AS playerId,
      player_name AS playerName,
      SUM(score) AS totalScore,
      SUM(fours) AS totalFours,
      SUM(sixes) AS totalSixes
    FROM player_match_score
      NATURAL JOIN player_details
    WHERE
      player_id = ${playerId};`;
  const stats = await db.get(getPlayerStatsQuery);
  response.send(stats);
});

module.exports = app;
