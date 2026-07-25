const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const User = sequelize.define('User', {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true
    },
    email: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
      validate: {
        isEmail: true
      }
    },
    password: {
      type: DataTypes.STRING,
      allowNull: false
    },
    username: {
      type: DataTypes.STRING,
      allowNull: true,
      defaultValue: null
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false
    },
    role: {
      type: DataTypes.STRING,
      defaultValue: 'user'
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      defaultValue: true
    },
    moneroAddress: {
      type: DataTypes.STRING,
      allowNull: true
    },
    pgpPublicKey: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    location: {
      type: DataTypes.JSON,
      allowNull: true
    },
    rating: {
      type: DataTypes.FLOAT,
      defaultValue: 0
    }
  }, {
    timestamps: true,
    tableName: 'Users'
  });

  return User;
};
