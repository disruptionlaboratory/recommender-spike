const { program } = require("commander");
const { post } = require("axios");

program.version("0.0.1").description("A command-line tool for embeddings");

program
    .command("generate <sentence>")
    .description("Generates embeddings given a sentence")
    .action(async (sentence) => {
        const response = await post(
            "http://recommender_spike_embeddings:7373/api/generate-embedding",
            {
                sentence: sentence,
            },
        );
        const embeddings = response.data.embedding[0];
        // console.log(embeddings);

        console.log(`ARRAY[${embeddings.join(", ")}]::vector(768)`);
    });

program.parse(process.argv);
