const Sequelize = require('sequelize');
const sequelize = new Sequelize('nodejs', 'root', '',
{dialect: 'mysql', host: 'localhost', query:{raw:true}}
);

module.exports = sequelize;