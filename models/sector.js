'use strict';
module.exports = (sequelize, DataTypes) => {
  var Sector = sequelize.define('Sector', {
    name: DataTypes.STRING,
    previous_forecast: DataTypes.TEXT,
    latest_forecast: DataTypes.TEXT,
    previous_forecast_period_end: DataTypes.DATE,
    latest_forecast_period_end: DataTypes.DATE
  }, {
    underscored: true,
    tableName: 'Sectors'
  });
  Sector.associate = function(models) {
    // associations can be defined here
    Sector.hasMany(models.Subscription);
  };
  return Sector;
};