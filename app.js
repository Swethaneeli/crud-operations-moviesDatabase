const express = require("express");

const path = require("path");

const { open } = require("sqlite");

const sqlite3 = require("sqlite3");

const app = express();

app.use(express.json());

const dbPath = path.join(__dirname, "moviesData.db");

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
  } catch (error) {
    console.log(`Db Error: ${error.message}`);
    process.exit(1);
  }
};
initializeDBAndServer();

const convertDbObjectToResponseObject = (dbObject) => {
  return {
    movieId: dbObject.movie_id,
    directorId: dbObject.director_id,
    movieName: dbObject.movie_name,
    leadActor: dbObject.lead_actor,
  };
};

const convertPromiseObjectToResponseObject = (promiseObject) => {
  return {
    directorId: promiseObject.director_id,
    directorName: promiseObject.director_name,
  };
};

//1) Get movie names list

app.get("/movies/", async (request, response) => {
  const getMoviesQuery = `
    SELECT movie_name
    FROM movie;`;
  const moviesArray = await db.all(getMoviesQuery);
  response.send(
    moviesArray.map((eachMovie) => ({ movieName: eachMovie.movie_name }))
  );
});

//3) Get movie with movieId
app.get("/movies/:movieId", async (request, response) => {
  const { movieId } = request.params;
  const getMovieQuery = `
    SELECT * 
    FROM movie
    WHERE movie_id = ${movieId};`;
  const movie = await db.get(getMovieQuery);
  response.send(convertDbObjectToResponseObject(movie));
});

//2) Post a movie
app.post("/movies/", async (request, response) => {
  const { directorId, movieName, leadActor } = request.body;
  const addMovieQuery = `
    INSERT INTO 
    movie ( director_id, movie_name, lead_actor )
    VALUES (
        '${directorId}',
        '${movieName}',
        '${leadActor}'
        );`;
  await db.run(addMovieQuery);
  response.send("Movie Successfully Added");
});

//4) Update a Movie
app.put("/movies/:movieId", async (request, response) => {
  const { movieId } = request.params;
  const { directorId, movieName, leadActor } = request.body;
  const updateMovieQuery = `
    UPDATE movie
    SET 
        director_id = '${directorId}',
        movie_name = '${movieName}',
        lead_actor = '${leadActor}'
    WHERE movie_id = ${movieId}; `;
  await db.run(updateMovieQuery);
  response.send("Movie Details Updated");
});

//5) Delete a Movie
app.delete("/movies/:movieId", async (request, response) => {
  const { movieId } = request.params;
  const deleteMovieQuery = `
    DELETE FROM movie
    WHERE movie_id = ${movieId};`;
  await db.run(deleteMovieQuery);
  response.send("Movie Removed");
});

//6) Get all Directors
app.get("/directors/", async (request, response) => {
  const getDirectorsQuery = `
    SELECT *
    FROM 
        director;`;
  const directorsArray = await db.all(getDirectorsQuery);
  response.send(
    directorsArray.map((eachDirector) =>
      convertPromiseObjectToResponseObject(eachDirector)
    )
  );
});

//7) Get movie names directed by director
app.get("/directors/:directorId/movies/", async (request, response) => {
  const { directorId } = request.params;
  const getDirectorMoviesQuery = `
    SELECT movie_name 
    FROM movie 
    WHERE director_id = '${directorId}';`;
  const moviesArray = await db.all(getDirectorMoviesQuery);
  response.send(
    moviesArray.map((eachMovie) => ({
      movieName: eachMovie.movie_name,
    }))
  );
});
module.exports = app;
