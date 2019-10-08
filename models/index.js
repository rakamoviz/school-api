module.exports = function init(sequelize) {
  const School = require('./school')(sequelize);
  const Recipient = require('./recipient')(sequelize);
  const Order = require('./order')(sequelize);

  Recipient.belongsTo(Order);
  Order.hasMany(Recipient); 
  
  Order.belongsTo(School);
  School.hasMany(Order);

  Recipient.belongsTo(School); //both recipient and order points to school, denormalization.

  return sequelize.sync().then(() => {
    return {
      School, Recipient, Order
    };
  });
}