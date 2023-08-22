const swaggerJsdoc = require('swagger-jsdoc');

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Contractor System',
      version: '1.0.0',
      description: 'API documentation for the Contractor System',
    },
  },
  servers: ['http://localhost:3001'],
  apis: ['./src/controllers/*.controller.js']
};

const specs = swaggerJsdoc(options);

module.exports = specs;
