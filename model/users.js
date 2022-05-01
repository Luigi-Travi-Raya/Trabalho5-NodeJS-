const database = require('../config/db');
const Sequelize = require('sequelize');
const Fotos = require('./fotos.js')

const Users = database.define('Users', {
    id: {
        type: Sequelize.INTEGER,
        autoIncrement: true,
        allowNull: false,
        primaryKey: true
    },
    nome: {
        type: Sequelize.STRING,
        allowNull: false
    },
    email: {
        type: Sequelize.STRING,
        allowNull: false,
        unique: true
    },
    senha: {
        type: Sequelize.STRING,
        allowNull: false,
    }
})
Users.hasMany(Fotos);
module.exports = Users;