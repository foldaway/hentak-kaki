'use strict';
module.exports = (sequelize, DataTypes) => {
  var Subscription = sequelize.define('Subscription', {
    subscriber_id: DataTypes.INTEGER,
    sector_id: DataTypes.INTEGER
  }, {});
  Subscription.associate = function(models) {
    // associations can be defined here
    Subscription.hasOne(models.Sector, { foreignKey: 'sector_id' });
    Subscription.hasOne(models.Subscriber, { foreignKey: 'subscriber_id' });
  };
  return Subscription;
};