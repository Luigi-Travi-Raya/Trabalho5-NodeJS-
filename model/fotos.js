const database = require('../config/db');
const Sequelize = require('sequelize');

const Fotos = database.define('Fotos', {
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
    autor: {
        type: Sequelize.STRING,
        allowNull: false
    },
    imagem: { 
        type: Sequelize.STRING 
    },
    descricao: {
        type: Sequelize.STRING
    }
})

module.exports = Fotos;