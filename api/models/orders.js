const { Sequelize, DataTypes } = require("sequelize");

module.exports = (sequelize) => {
    const Order = sequelize.define(
        "Order",
        {
            id: {
                type: DataTypes.INTEGER,
                primaryKey: true,
                autoIncrement: true,
            },
            users_id: {
                type: DataTypes.INTEGER,
                allowNull: false,
            }
        },
        {
            tableName: "orders",
            timestamps: false,
        },
    );

    Order.associate = function(models) {
        const { users, orders_items } = models;
        Order.hasOne(users, {
            as: "User",
            sourceKey: "users_id",
            foreignKey: 'id' });

        Order.hasMany(orders_items, {
            as: "OrderItems",
            foreignKey: "orders_id"
        })

    };

    return Order;
};