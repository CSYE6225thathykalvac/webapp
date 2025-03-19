const { Model, DataTypes } = require('sequelize');
const sequelize = require('../config/db');

class HealthCheck extends Model {}

HealthCheck.init({
  check_id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  datetime: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
  },
}, {
  sequelize,
  modelName: 'HealthCheck',
  tableName: 'health_checks',
  timestamps : false
});

sequelize.sync({force:true})

module.exports = HealthCheck;
