const { DataTypes } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  const Order = sequelize.define('Order', {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true
    },
    buyerId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'Users',
        key: 'id'
      }
    },
    skillId: {
      type: DataTypes.INTEGER,
      allowNull: true
    },
    amount: {
      type: DataTypes.FLOAT,
      allowNull: false
    },
    currency: {
      type: DataTypes.STRING,
      defaultValue: 'USD'
    },
    moneroAddress: {
      type: DataTypes.STRING,
      allowNull: true
    },
    moneroAmount: {
      type: DataTypes.FLOAT,
      allowNull: true
    },
    addressIndex: {
      type: DataTypes.INTEGER,
      allowNull: true
    },
    status: {
      type: DataTypes.STRING,
      defaultValue: 'pending'
    },
    network: {
      type: DataTypes.STRING,
      defaultValue: 'testnet'
    },
    confirmations: {
      type: DataTypes.INTEGER,
      defaultValue: 0
    },
    amountReceived: {
      type: DataTypes.FLOAT,
      defaultValue: 0
    }
  }, {
    timestamps: true,
    tableName: 'Orders'
  });

  return Order;
};