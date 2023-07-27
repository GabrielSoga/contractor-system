const express = require('express');
const bodyParser = require('body-parser');
const { sequelize } = require('./model')
const controllers = require('./controllers');

const app = express();
app.use(bodyParser.json());
app.set('sequelize', sequelize)
app.set('models', sequelize.models)
app.use(controllers)

module.exports = app;
