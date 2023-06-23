const express = require("express");
const sqlite3 = require("sqlite3");
const { open } = require("sqlite");
const path = require("path");

const app = express();
module.exports = app;
app.use(express.json());

const port = 3000;

let dbPath = path.join(__dirname, "cricketMatchDetails.db");
let db = null;

const initializeDbWithServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    app.listen(port, () => {
      console.log("Server Running at http://localhost:3000");
    });
  } catch (error) {
    console.log(`DB Error: ${error}`);
  }
};

initializeDbWithServer();

// change case1
const changeCase1 = (dbObj) => {
  return {
    playerId: dbObj.player_id,
    playerName: dbObj.player_name,
  };
};

const changeCase2 = (dbObj) => {
  return {
    matchId: dbObj.match_id,
    match: dbObj.match,
    year: dbObj.year,
  };
};

const changeCase3 = (dbObj) => {
  return {
    playerId: dbObj.player_id,
    playerName: dbObj.player_name,
    totalScore: dbObj.totalScore,
    totalFours: dbObj.totalFours,
    totalSixes: dbObj.totalSixes,
  };
};

// api -1
app.get("/players/", async (request, response) => {
  const getAllPlayerDetailsQuery = `
        SELECT
            *
        FROM 
            player_details;
    `;

  const playerDetailsArray = await db.all(getAllPlayerDetailsQuery);
  camelCaseArray = [];
  for (let eachObject of playerDetailsArray) {
    camelCaseArray.push(changeCase1(eachObject));
  }
  response.send(camelCaseArray);
});

// api -2
app.get("/players/:playerId/", async (request, response) => {
  const { playerId } = request.params;
  const getSinglePlayerQuery = `
    SELECT *
    FROM 
        player_details
    WHERE 
        player_id = ${playerId};
  `;

  const singlePlayerDetailsArray = await db.get(getSinglePlayerQuery);
  response.send(changeCase1(singlePlayerDetailsArray));
});

// api -3
app.put("/players/:playerId/", async (request, response) => {
  const { playerId } = request.params;
  const { playerName } = request.body;
  const updateQuery = `
    UPDATE
        player_details
    SET
        player_name = '${playerName}'
    WHERE 
        player_id = ${playerId};
  `;

  const dbResponse = await db.run(updateQuery);
  response.send("Player Details Updated");
});

// api- 4
app.get("/matches/:matchId/", async (request, response) => {
  const { matchId } = request.params;
  const getSingleMatchQuery = `
    SELECT *
    FROM   
        match_details
    WHERE 
        match_id = ${matchId};
  `;

  const singleMatchDetails = await db.get(getSingleMatchQuery);
  response.send(changeCase2(singleMatchDetails));
});

// api - 5
app.get("/players/:playerId/matches", async (request, response) => {
  const { playerId } = request.params;
  const getAllMatchDetailsByPlayerIdQuery = `
    
        SELECT 
            match_details.match_id,
            match_details.match,
            match_details.year
        FROM 
            match_details INNER JOIN player_match_score 
            ON match_details.match_id = player_match_score.match_id
        WHERE
            player_id = ${playerId};
    `;
  const allMatchDetailsOfPlayerArray = await db.all(
    getAllMatchDetailsByPlayerIdQuery
  );

  const camelCaseArray = [];
  for (let eachObject of allMatchDetailsOfPlayerArray) {
    camelCaseArray.push(changeCase2(eachObject));
  }
  response.send(camelCaseArray);
});

// api - 6 Returns a list of players of a specific match
app.get("/matches/:matchId/players", async (request, response) => {
  const { matchId } = request.params;
  const getListOfPlayersOfASpecificMatch = `
        SELECT 
            player_details.player_id,
            player_details.player_name
        FROM 
            (player_details INNER JOIN player_match_score ON
                player_details.player_id = player_match_score.player_id) AS T
                INNER JOIN match_details ON T.match_id = match_details.match_id
        WHERE 
                match_details.match_id = ${matchId};
    `;

  const ArrayOfPlayersOfASpecificMatch = await db.all(
    getListOfPlayersOfASpecificMatch
  );
  const camelCaseArrayList = [];
  for (let eachObject of ArrayOfPlayersOfASpecificMatch) {
    camelCaseArrayList.push(changeCase1(eachObject));
  }
  response.send(camelCaseArrayList);
});

// api - 7  Returns the statistics of the total score, fours, sixes of a specific player based on the player ID
app.get("/players/:playerId/playerScores", async (request, response) => {
  const { playerId } = request.params;
  const getCompleteDetailsOfPlayerQuery = `
   SELECT 
        player_details.player_id,
        player_details.player_name,
        SUM(player_match_score.score) AS totalScore,
        COUNT(player_match_score.fours) AS totalFours,
        COUNT(player_match_score.sixes) AS totalSixes
    FROM 
        player_details NATURAL JOIN player_match_score
    WHERE
        player_details.player_id = ${playerId}
   `;

  const ArrayOfCompleteDetailsOfPlayer = await db.all(
    getCompleteDetailsOfPlayerQuery
  );

  camelCaseArrayOfCompleteDetails = [];
  for (let eachObject of ArrayOfCompleteDetailsOfPlayer) {
    camelCaseArrayOfCompleteDetails.push(changeCase3(eachObject));
  }
  response.send(camelCaseArrayOfCompleteDetails);
});
