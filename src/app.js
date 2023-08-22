const express = require('express');
const bodyParser = require('body-parser');
const { sequelize } = require('./model')
const controllers = require('./controllers');
const swaggerUi = require('swagger-ui-express');
const swaggerSpec = require('./swaggerConfig');


const app = express();
app.use(bodyParser.json());
app.set('sequelize', sequelize)
app.set('models', sequelize.models)
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));
app.use(controllers)

module.exports = app;
