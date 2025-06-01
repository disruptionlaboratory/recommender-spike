const express = require("express");
const { Sequelize, Op } = require("sequelize");

const { post } = require("axios");
const nlp = require("compromise");

const es6Renderer = require("express-es6-template-engine");
const cookieParser = require("cookie-parser");
const cors = require("cors");
const path = require("path");

const dotenv = require("dotenv");

dotenv.config();

const db = require("./models");
// const { calculate } = require("./pricing");

const app = express();

app.engine("html", es6Renderer);
app.set("views", path.join(__dirname, "views"));
app.set("view engine", "html");

app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ extended: true, limit: "50mb" }));


const getAverageEmbedding = (embeddings) => {
    if (!embeddings.length) return [];

    const sum = embeddings.reduce((acc, curr) => acc.map((val, idx) => val + curr[idx]), new Array(embeddings[0].length).fill(0));
    return sum.map(val => val / embeddings.length);
}



const corsOptions = {
    origin: ["http://localhost:8383"],
};
app.use(cors(corsOptions));

app.use(cookieParser());

app.get("/api/ping", (req, res) => {
    res.status(200);
    res.json({
        message: "Pong!",
    });
});


app.get("/api/products", async (req, res) => {
    res.status(200);
    try {
        const products = await db.products.findAll({});
        res.json(products);
    } catch (e) {
        console.log(e)
        res.json(e);
    }
})

app.get("/api/products/recommendation", async (req, res) => {
    try {
        const users_id = req.query.users_id ?? null;
        const order = await db.orders.findOne({
            where: {
                users_id
            },
            include: [
                {
                    model: db.users,
                    as: "User",
                },
                {
                    model: db.orders_items,
                    as: "OrderItems",
                    include: [
                        {
                            model: db.products,
                            as: "Product",
                            include: [
                                {
                                    model: db.embeddings,
                                    as: "Embedding"
                                }
                            ]
                        }
                    ]
                },
            ]
        })

        const embeddings = []
        order.OrderItems.forEach((i) => {
            embeddings.push(JSON.parse(i.Product.Embedding.embedding));
        })

        const embedding = getAverageEmbedding(embeddings);
        // const embedding = JSON.parse(order.OrderItems[0].Product.Embedding.embedding);

        const threshold = 0.1;
        const limit = 100;

        const results = await db.sequelize.query(
            `SELECT id, products_id, description,
              1 - (embedding <=> ARRAY[${embedding.join(", ")}]::vector(768)) AS similarity
       FROM embeddings
       WHERE (1 - (embedding <=> ARRAY[${embedding.join(", ")}]::vector(768))) > ${threshold}
       ORDER BY similarity DESC
         LIMIT ${limit}`
        );

        const matches = results[0];

        // filters out movies already watched
        const productIdsAndSimilarity = matches.map((m) => {
            return {
                id: m.products_id,
                similarity: m.similarity
            }}).filter((p) => {
            return p.id !== order.OrderItems[0].Product.id
        })

        const products = await db.products.findAll({
            where: {
                id: {
                    [Op.in]: productIdsAndSimilarity.map((i) => (i.id))
                }
            }
        })

        const recommendations = productIdsAndSimilarity.map((p) => {
            const product = products.find((i) => (i.id === p.id))
            return {
                product,
                similarity: p.similarity
            }
        }).sort((a, b) => {
            if (a.similarity > b.similarity) {
                return -1
            } else if (b.similarity > a.similarity) {
                return 1
            }
            return 0;
        })

        res.json(recommendations);

    } catch (e) {
        res.status(500);
        res.json(e);
    }
})

app.get("/", async (req, res) => {
    try {
        res.render("template", {
            locals: {
                title: "",
            },
            partials: {
                partial: "/index",
            },
        });
    } catch (e) {
        console.log(e);
    }
});

// app.get("/articles", async (req, res) => {
//     try {
//         res.render("template", {
//             locals: {
//                 title: "",
//             },
//             partials: {
//                 partial: "/articles",
//             },
//         });
//     } catch (e) {
//         console.log(e);
//     }
// });
//
// app.post("/api/articles/infer", async (req, res) => {
//     try {
//         const { systemPrompt, prompt, threshold, limit, model } = req.body;
//         const response = await post(
//             "http://recommender_spike_embeddings:7373/api/generate-embedding",
//             {
//                 sentence: prompt,
//             },
//         );
//         const embeddings = response.data.embedding[0];
//         // We now want to perform similarity search...
//         const results = await db.sequelize.query(
//             `SELECT id,
//           articles_id,
//               sentence,
//               embedding,
//               1 - (embedding <=> ARRAY[${embeddings.join(", ")}]::vector(768)) AS similarity
//        FROM articles_embeddings
//        WHERE (1 - (embedding <=> ARRAY[${embeddings.join(", ")}]::vector(768))) > ${threshold}
//        ORDER BY similarity DESC
//          LIMIT ${limit}`,
//         );
//
//         const items = results[0];
//
//         // We now want to capture the appropriate articles
//         const uniqueArticles = [];
//
//         items.forEach((i) => {
//             if (!uniqueArticles.includes(i.articles_id)) {
//                 uniqueArticles.push(i.articles_id);
//             }
//         });
//
//         const articles = await db.articles.findAll({
//             where: {
//                 id: {
//                     [Op.in]: uniqueArticles, // Use Op.in to check if the id is in the array
//                 },
//             },
//         });
//
//         let context = "Context: ";
//
//         articles.forEach((article) => {
//             context += "\n\n\n" + article.content;
//         });
//
//         const promptData =
//             systemPrompt + "\n" + context + "\nUser: " + prompt + "\nSystem: ";
//
//         console.log(promptData);
//
//         const llmResponse = await post(
//             "http://host.docker.internal:11434/api/generate",
//             {
//                 model: model,
//                 stream: false,
//                 prompt: promptData,
//             },
//         );
//
//         console.log(llmResponse.data);
//
//         const duration = llmResponse.data.eval_duration / 1000000;
//         const inputTokens = llmResponse.data.prompt_eval_count;
//         const outputTokens = llmResponse.data.eval_count;
//
//         const inputTokenCostPerThousand = 0.001;
//         const outputTokenCostPerThousand = 0.002;
//
//         const promptsPerDay = 1000;
//
//         res.json({
//             data: {
//                 model: llmResponse.data.model,
//                 duration: duration,
//                 output_tokens: outputTokens,
//                 input_tokens: inputTokens,
//                 response: llmResponse.data.response,
//                 cost: calculate(
//                     inputTokens,
//                     outputTokens,
//                     inputTokenCostPerThousand,
//                     outputTokenCostPerThousand,
//                 ),
//             },
//         });
//     } catch (e) {
//         console.log(JSON.stringify(e));
//         res.json({ message: "Oops", details: JSON.stringify(e) });
//     }
// });

// app.post("/api/infer", async (req, res) => {
//     try {
//         const { systemPrompt, prompt, threshold, limit, model } = req.body;
//         const response = await post(
//             "http://recommender_spike_embeddings:7373/api/generate-embedding",
//             {
//                 sentence: prompt,
//             },
//         );
//         const embeddings = response.data.embedding[0];
//         // We now want to perform similarity search...
//         const results = await db.sequelize.query(
//             `SELECT id,
//               description,
//               embedding,
//               1 - (embedding <=> ARRAY[${embeddings.join(", ")}]::vector(768)) AS similarity
//        FROM knowledge
//        WHERE (1 - (embedding <=> ARRAY[${embeddings.join(", ")}]::vector(768))) > ${threshold}
//        ORDER BY similarity DESC
//          LIMIT ${limit}`,
//         );
//
//         const items = results[0];
//
//         let context = "Context: ";
//
//         items.forEach((item) => {
//             context += "\n" + item.description;
//         });
//
//         const promptData =
//             systemPrompt + "\n" + context + "\nUser: " + prompt + "\nSystem: ";
//
//         console.log(promptData);
//
//         const llmResponse = await post(
//             "http://host.docker.internal:11434/api/generate",
//             {
//                 model: model,
//                 stream: false,
//                 prompt: promptData,
//             },
//         );
//
//         console.log(llmResponse.data);
//
//         const inputTokens = llmResponse.data.prompt_eval_count;
//         const outputTokens = llmResponse.data.eval_count;
//
//         const inputTokenCostPerThousand = 0.001;
//         const outputTokenCostPerThousand = 0.002;
//
//         const promptsPerDay = 1000;
//
//         res.json({
//             data: {
//                 model: llmResponse.data.model,
//                 duration: llmResponse.data.eval_duration / 1000000,
//                 output_tokens: outputTokens,
//                 input_tokens: inputTokens,
//                 response: llmResponse.data.response,
//                 cost: calculate(
//                     inputTokens,
//                     outputTokens,
//                     inputTokenCostPerThousand,
//                     outputTokenCostPerThousand,
//                 ),
//             },
//         });
//     } catch (e) {
//         console.log(JSON.stringify(e));
//         res.json({ message: "Oops", details: JSON.stringify(e) });
//     }
// });

// app.post("/api/search", async (req, res) => {
//     try {
//         const { search, threshold, limit } = req.body;
//         const response = await post(
//             "http://recommender_spike_embeddings:7373/api/generate-embedding",
//             {
//                 sentence: search,
//             },
//         );
//         const embeddings = response.data.embedding[0];
//         // We now want to perform similarity search...
//         const results = await db.sequelize.query(
//             `SELECT id,
//               description,
//               embedding,
//               1 - (embedding <=> ARRAY[${embeddings.join(", ")}]::vector(768)) AS similarity
//        FROM knowledge
//        WHERE (1 - (embedding <=> ARRAY[${embeddings.join(", ")}]::vector(768))) > ${threshold}
//        ORDER BY similarity DESC
//          LIMIT ${limit}`,
//         );
//         res.json(results[0]);
//     } catch (e) {
//         console.log(JSON.stringify(e));
//         res.json({ message: "Oops", details: JSON.stringify(e) });
//     }
// });

// app.post("/api/articles", async (req, res) => {
//     try {
//         const { content } = req.body;
//
//         console.log(content);
//
//         const article = await db.articles.create({
//             content,
//         });
//
//         const sentences = nlp(content)
//             .sentences()
//             .out("array")
//             .filter((i) => i.length > 25); // Filtering out "noise" where one or two words is treated as a sentence
//         console.log(sentences);
//
//         for (sentence of sentences) {
//             const response = await post(
//                 "http://recommender_spike_embeddings:7373/api/generate-embedding",
//                 {
//                     sentence: sentence,
//                 },
//             );
//             const embeddings = response.data.embedding[0];
//
//             const articleEmbedding = await db.articles_embeddings.create(
//                 {
//                     articles_id: article.id,
//                     sentence: sentence,
//                     embedding: `[${embeddings.join(", ")}]`,
//                 },
//                 { raw: true },
//             );
//         }
//
//         res.json(article);
//     } catch (e) {
//         console.log(JSON.stringify(e));
//         res.json({ message: "Oops", details: JSON.stringify(e) });
//     }
// });

// app.post("/api/articles/search", async (req, res) => {
//     try {
//         const { search, threshold, limit } = req.body;
//         const response = await post(
//             "http://recommender_spike_embeddings:7373/api/generate-embedding",
//             {
//                 sentence: search,
//             },
//         );
//         const embeddings = response.data.embedding[0];
//
//         console.log(embeddings);
//
//         // We now want to perform similarity search...
//         const results = await db.sequelize.query(
//             `SELECT id,
//                 articles_id,
//               sentence,
//               embedding,
//               1 - (embedding <=> ARRAY[${embeddings.join(", ")}]::vector(768)) AS similarity
//        FROM articles_embeddings
//        WHERE (1 - (embedding <=> ARRAY[${embeddings.join(", ")}]::vector(768))) > ${threshold}
//        ORDER BY similarity DESC
//          LIMIT ${limit}`,
//         );
//         res.json(results[0]);
//     } catch (e) {
//         console.log(JSON.stringify(e));
//         res.json({ message: "Oops", details: JSON.stringify(e) });
//     }
// });

// app.post("/api/knowledge/batch", async (req, res) => {
//     try {
//         const { content } = req.body;
//
//         console.log(content);
//
//         const sentences = nlp(content)
//             .sentences()
//             .out("array")
//             .filter((i) => i.length > 25); // Filtering out "noise" where one or two words is treated as a sentence
//         console.log(sentences);
//
//         for (sentence of sentences) {
//             const response = await post(
//                 "http://recommender_spike_embeddings:7373/api/generate-embedding",
//                 {
//                     sentence: sentence,
//                 },
//             );
//             const embeddings = response.data.embedding[0];
//             const k = await db.knowledge.create(
//                 {
//                     description: sentence,
//                     embedding: `[${embeddings.join(", ")}]`,
//                 },
//                 { raw: true },
//             );
//         }
//
//         res.json({
//             content: sentences,
//         });
//     } catch (e) {
//         console.log(JSON.stringify(e));
//         res.json({ message: "Oops", details: JSON.stringify(e) });
//     }
// });

// app.post("/api/knowledge", async (req, res) => {
//     try {
//         const { description } = req.body;
//         const response = await post(
//             "http://recommender_spike_embeddings:7373/api/generate-embedding",
//             {
//                 sentence: description,
//             },
//         );
//         const embeddings = response.data.embedding[0];
//         const k = await db.knowledge.create(
//             {
//                 description,
//                 embedding: `[${embeddings.join(", ")}]`,
//             },
//             { raw: true },
//         );
//         res.json(k.toJSON());
//     } catch (e) {
//         console.log(JSON.stringify(e));
//         res.json({ message: "Oops", details: JSON.stringify(e) });
//     }
// });

app.use(express.static("public", { etag: false, lastModified: false }));

app.listen(process.env.INTERNAL_PORT, () => {
    console.log(`Server listening on port ${process.env.INTERNAL_PORT}`);
});
