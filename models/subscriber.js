'use strict';
module.exports = (sequelize, DataTypes) => {
  var Subscriber = sequelize.define('Subscriber', {
    chat_id: DataTypes.STRING
  }, { underscored: true });
  Subscriber.associate = function(models) {
    // associations can be defined here
    Subscriber.hasMany(models.Subscription);
  };
  return Subscriber;
};