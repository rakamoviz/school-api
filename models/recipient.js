const { Model, DataTypes } = require('sequelize');

module.exports = function init(sequelize) {
  class Recipient extends Model {}
  Recipient.init({
    name: {
      type: DataTypes.STRING,
      allowNull: false
    },
    address: {
      type: DataTypes.STRING,
      allowNull: false
    },
    quantity: {
      type: DataTypes.INTEGER,
      allowNull: false,
      validate: {
        min: 1
      } 
    }
  }, { sequelize, underscored: true, modelName: 'recipient' });

  return Recipient;
}