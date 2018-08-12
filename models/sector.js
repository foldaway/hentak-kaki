'use strict';
module.exports = (sequelize, DataTypes) => {
  var Sector = sequelize.define('Sector', {
    name: DataTypes.STRING,
    previous_forecast: DataTypes.TEXT,
    latest_forecast: DataTypes.TEXT,
    previous_forecast_period_end: DataTypes.DATE,
    latest_forecast_period_end: DataTypes.DATE
  }, {});
  Sector.associate = function(models) {
    // associations can be defined here
  };
  return Sector;
};