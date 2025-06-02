const movies = require("./movies.json");

// console.log(movies)

for (const movie of movies) {
  const sql = `INSERT INTO products (name, description, rating) VALUES ('${movie.title}', '${movie.description}', ${(movie.rating / 2).toFixed(2)});`;
  console.log(sql);
}
