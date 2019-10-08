const { Model, DataTypes } = require('sequelize');

module.exports = function init(sequelize) {
  class School extends Model {}
  School.init({
    name: {
      type: DataTypes.STRING,
      allowNull: false
    },
    address: {
      type: DataTypes.STRING,
      allowNull: false
    }
  }, { sequelize, underscored: true, modelName: 'school' });

  return School;
}