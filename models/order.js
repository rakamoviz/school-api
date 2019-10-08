const { Model, DataTypes } = require('sequelize');
const constants = require('../constants');

module.exports = function init(sequelize) {
  class Order extends Model {}
  Order.init({
    date: DataTypes.DATEONLY,
    giftType: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        isIn: [Object.keys(constants.GIFT_TYPES)]
      } 
    },
    workflowStatus: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        isIn: [Object.keys(constants.WORKFLOW_STATUS)]
      } 
    }
  }, { sequelize, underscored: true, modelName: 'order' });

  return Order;
}