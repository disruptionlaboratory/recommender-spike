const { Sequelize, DataTypes } = require("sequelize");

module.exports = (sequelize) => {
    const Embedding = sequelize.define(
        "Embedding",
        {
            id: {
                type: DataTypes.INTEGER,
                primaryKey: true,
                autoIncrement: true,
            },
            products_id: {
                type: DataTypes.INTEGER,
            },
            description: {
                type: DataTypes.TEXT,
            },
            embedding: {
                type: DataTypes.TSVECTOR,
                allowNull: false,
            }
        },
        {
            tableName: "embeddings",
            timestamps: false,
        },
    );

    // Embedding.associate = function(models) {
    //     const { products } = models;
    //     Embedding.hasOne(products, {
    //         as: "Product",
    //         sourceKey: "products_id",
    //         foreignKey: 'id'
    //     });
    //
    // };

    return Embedding;
};