'use strict';
module.exports = (sequelize, DataTypes) => {
  var Subscriber = sequelize.define('Subscriber', {
    chat_id: DataTypes.STRING
  }, {});
  Subscriber.associate = function(models) {
    // associations can be defined here
  };
  return Subscriber;
};