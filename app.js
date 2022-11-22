const express = require("express");
const path = require("path");

const { open } = require("sqlite");
const sqlite3 = require("sqlite3");

const app = express();
app.use(express.json());
const dbPath = path.join(__dirname, "covid19India.db");

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

// Returning states with GET

app.get("/states/", async (request, response) => {
  const stateQuery = `
        SELECT
          *
        FROM 
        state;
    `;
  const stateDb = await db.all(stateQuery);
  let stateDbCamel = [];
  for (let obj of stateDb) {
    let newObj = {
      stateId: obj.state_id,
      stateName: obj.state_name,
      population: obj.population,
    };
    stateDbCamel.push(newObj);
  }
  response.send(stateDbCamel);
});

// Returning state wrt stateId

app.get("/states/:stateId/", async (request, response) => {
  const { stateId } = request.params;
  const stateQuery = `
        SELECT * 
        FROM state
        WHERE state_id = ${stateId};
    `;
  const stateDb = await db.get(stateQuery);
  const stateDbCamelCase = {
    stateId: stateDb.state_id,
    stateName: stateDb.state_name,
    population: stateDb.population,
  };
  response.send(stateDbCamelCase);
});

// Adding one district

app.post("/districts/", async (request, response) => {
  const districtData = request.body;
  const { districtName, stateId, cases, cured, active, deaths } = districtData;

  const districtAddQuery = `
        INSERT INTO 
          district(district_name,state_id,cases,cured,active,deaths)
        VALUES
        (
            '${districtName}',
            ${stateId},
            ${cases},
            ${cured},
            ${active},
            ${deaths}

        );
        
    `;
  const dbResponse = await db.run(districtAddQuery);
  response.send("District Successfully Added");
});

// Getting DistrictId

app.get("/districts/:districtId/", async (request, response) => {
  const { districtId } = request.params;
  const districtQuery = `
    SELECT * 
    FROM district 
    WHERE district_id = ${districtId}
  `;
  const dbObj = await db.get(districtQuery);
  const dbObjInCamel = {
    districtId: dbObj.district_id,
    districtName: dbObj.district_name,
    stateId: dbObj.state_id,
    cases: dbObj.cases,
    cured: dbObj.cured,
    active: dbObj.active,
    deaths: dbObj.deaths,
  };
  response.send(dbObjInCamel);
});

//Deleting

app.delete("/districts/:districtId", async (request, response) => {
  const { districtId } = request.params;
  const deleteQuery = `
        DELETE 
        FROM district
        WHERE district_id = ${districtId}
    `;
  await db.run(deleteQuery);
  response.send("District Removed");
});

// Updating details based on districtId

app.put("/districts/:districtId/", async (request, response) => {
  const { districtId } = request.params;
  const districtData = request.body;
  const { districtName, stateId, cases, cured, active, deaths } = districtData;
  const updateQuery = `
        UPDATE district
        SET 
        district_name = '${districtName}',
        state_id = ${stateId},
        cases = ${cases},
        cured = ${cured},
        active = ${active},
        deaths = ${deaths}
        WHERE 
        distric_id = ${districtId}
    `;
  await db.run(updateQuery);
  response.send("District Details Updated");
});

// Stats of total cases

app.get("/states/:stateId/stats/", async (request, response) => {
  const { stateId } = request.params;

  const statsQuery = `
        SELECT 
        sum(cases),
        sum(cured),
        sum(active),
        sum(deaths)
        FROM district
        GROUP BY state_id
        WHERE state_id = ${stateId}

    `;
  const statsArray = await get(statsQuery);

  response.send(statsArray);
});

module.exports = app;
