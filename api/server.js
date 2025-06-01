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
    // res.status(200);
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

app.post("/api/products/recommendation", async (req, res) => {
    try {
        const { products: productIds } = req.body;

        if (productIds.length === 0) {
            res.json([])
            return;
        }

        const productsLiked = await db.products.findAll({
            where: {
                id: {
                    [Op.in]: productIds
                }
            },
            include: [
                {
                    model: db.embeddings,
                    as: "Embedding"
                }
            ]
        })


        const embeddings = []
        productsLiked.forEach((p) => {
            embeddings.push(JSON.parse(p.Embedding.embedding));
        })

        const embedding = getAverageEmbedding(embeddings);

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

        const productIdsAndSimilarity = matches.map((m) => {
            return {
                id: m.products_id,
                similarity: m.similarity
            }})
        //     .filter((p) => {
        //     return p.id !== order.OrderItems[0].Product.id
        // })

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
        const products = await db.products.findAll({
            include: [
                {
                    model: db.embeddings,
                    as: 'Embedding'
                }
            ]
        });
        res.render("template", {
            locals: {
                title: "",
                products
            },
            partials: {
                partial: "/index",
            },
        });
        } catch (e) {
            console.log(e)
            res.json(e);
        }
});

app.use(express.static("public", { etag: false, lastModified: false }));

app.listen(process.env.INTERNAL_PORT, () => {
    console.log(`Server listening on port ${process.env.INTERNAL_PORT}`);
});
