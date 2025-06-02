const movies = require("./movies.json");
const { post } = require("axios");

const process = () => {
  return new Promise(async (resolve, reject) => {
    for (const movie of movies) {
      const { title, description, rating } = movie;
      try {
        const response = await post(
          "http://recommender_spike_embeddings:7373/api/generate-embedding",
          {
            sentence: description,
          },
        );
        const embedding = response.data.embedding[0];
        const sql = `INSERT INTO embeddings (products_id, description, embedding) VALUES ((SELECT id FROM products WHERE name = '${title}'),(SELECT description FROM products WHERE name = '${title}'),ARRAY[${embedding.join(", ")}]::vector(768));`;
        console.log(sql);
      } catch (e) {
        reject(e);
      }
    }
    resolve(true);
  });
};

process().then(() => {
  console.log("\n");
});
