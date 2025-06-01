const { Sequelize, DataTypes } = require("sequelize");

module.exports = (sequelize) => {
    const OrderItem = sequelize.define(
        "OrderItem",
        {
            id: {
                type: DataTypes.INTEGER,
                primaryKey: true,
                autoIncrement: true,
            },
            orders_id: {
                type: DataTypes.INTEGER,
            },
            products_id: {
                type: DataTypes.INTEGER,
            },
            qty: {
                type: DataTypes.INTEGER,
                allowNull: false
            }
        },
        {
            tableName: "orders_items",
            timestamps: false,
        },
    );

    OrderItem.associate = function(models) {
        const {orders, products} = models;
        OrderItem.hasOne(orders, {
            as: "Order",
            sourceKey: "orders_id",
            foreignKey: 'id'
        });
        OrderItem.hasOne(products, {
            as: "Product",
            sourceKey: "products_id",
            foreignKey: 'id'
        });
    };

    return OrderItem;
};