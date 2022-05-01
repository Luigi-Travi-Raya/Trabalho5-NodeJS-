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
    id_autor: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references:{
            model: 'users',
            key: 'id'  
        }
    },
    imagem: { 
        type: Sequelize.STRING 
    },
    descricao: {
        type: Sequelize.STRING
    }
})

module.exports = Fotos;