const { Sequelize, DataTypes } = require("sequelize");

module.exports = (sequelize) => {
    const Product = sequelize.define(
        "Product",
        {
            id: {
                type: DataTypes.INTEGER,
                primaryKey: true,
                autoIncrement: true,
            },
            name: {
                type: DataTypes.STRING,
                allowNull: false,
            },
            description: {
                type: DataTypes.TEXT,
                allowNull: false,
            },
            rating: {
                type: DataTypes.DECIMAL,
                allowNull: false
            }
        },
        {
            tableName: "products",
            timestamps: false,
        },
    );

    Product.associate = function(models) {
        const { embeddings, orders_items } = models;
        Product.hasOne(embeddings, {
            as: "Embedding",
            // sourceKey: "products_id",
            foreignKey: 'products_id' });

        Product.hasMany(orders_items, {
            as: "Order",
            foreignKey: "orders_id"
        })

    };

    return Product;
};
