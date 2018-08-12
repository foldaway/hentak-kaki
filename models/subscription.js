'use strict';
module.exports = (sequelize, DataTypes) => {
  var Subscription = sequelize.define('Subscription', {
    subscriber_id: DataTypes.INTEGER,
    sector_id: DataTypes.INTEGER
  }, { underscored: true });
  Subscription.associate = function(models) {
    // associations can be defined here
    Subscription.belongsTo(models.Sector);
    Subscription.belongsTo(models.Subscriber);
  };
  return Subscription;
};