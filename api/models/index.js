const { Sequelize } = require("sequelize");
const pgvector = require("pgvector/sequelize");
const dotenv = require("dotenv");

dotenv.config("./../.env");

const sequelize = new Sequelize(
    process.env.DATABASE_DATABASE,
    process.env.DATABASE_USER,
    process.env.DATABASE_PASSWORD,
    {
        port: process.env.DATABASE_PORT,
        host: process.env.DATABASE_HOST,
        dialect: process.env.DATABASE_DIALECT,
        define: {
            timestamps: false,
        },
    },
);

// pgvector.registerType(sequelize);

const db = {
    sequelize: sequelize,
    products: require("./products")(sequelize),
    embeddings: require("./embeddings")(sequelize),
    users: require("./users")(sequelize),
    orders: require("./orders")(sequelize),
    orders_items: require("./orders_items")(sequelize)
};

Object.keys(db).forEach((modelName) => {
    if (modelName !== "sequelize") {
        if (db[modelName].associate) {
            db[modelName].associate(db);
        }
    }
});

module.exports = db;


