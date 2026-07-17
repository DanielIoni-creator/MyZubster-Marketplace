require('dotenv').config();
const { Sequelize, DataTypes } = require('sequelize');

// Connessione al database (usa SQLite in sviluppo, PostgreSQL in produzione)
const sequelize = new Sequelize(
  process.env.DATABASE_URL || 'sqlite:./database.sqlite',
  {
    logging: process.env.NODE_ENV === 'development' ? console.log : false,
    dialectOptions: process.env.DATABASE_URL ? {
      ssl: {
        require: true,
        rejectUnauthorized: false
      }
    } : {}
  }
);

// Importa i modelli (factory pattern)
const User = require('./User')(sequelize, DataTypes);
const Order = require('./Order')(sequelize, DataTypes);
const Skill = require('./Skill')(sequelize, DataTypes);

// ========== RELAZIONI ==========

// Un utente può avere molti ordini (come acquirente)
User.hasMany(Order, {
  foreignKey: 'buyerId',
  as: 'orders'
});
Order.belongsTo(User, {
  foreignKey: 'buyerId',
  as: 'buyer'
});

// Un utente può avere molte competenze (come venditore)
User.hasMany(Skill, {
  foreignKey: 'sellerId',
  as: 'skills'
});
Skill.belongsTo(User, {
  foreignKey: 'sellerId',
  as: 'seller'
});

// ========== ESPORTAZIONI ==========
module.exports = {
  sequelize,
  Sequelize,
  User,
  Order,
  Skill
};