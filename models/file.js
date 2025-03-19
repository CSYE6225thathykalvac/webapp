// models/file.js
const { Model, DataTypes } = require('sequelize');
const sequelize = require('../config/db');

class File extends Model {}

File.init(
    {
        id: {
            type: DataTypes.UUID,
            defaultValue: DataTypes.UUIDV4,
            primaryKey: true,
        },
        file_name: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        url: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        upload_date: {
            type: DataTypes.DATEONLY,
            allowNull: false,
        },
    },
    {
        sequelize,
        modelName: 'File',
        tableName: 'files',
        timestamps: false,
    }
);
sequelize.sync({force:true})

module.exports = File;