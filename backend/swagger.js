import swaggerJSDoc from 'swagger-jsdoc';

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Choply API',
      version: '1.0.0',
      description: 'Choply food delivery platform backend REST API documentation. Includes authentication, menu/restaurant, profiling, and order operations.',
      contact: {
        name: 'Choply Support Team',
      },
    },
    servers: [
      {
        url: 'http://localhost:3000',
        description: 'Local Development Server',
      },
    ],
    components: {
      securitySchemes: {
        BearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'Enter your JWT token in the format: <token> (without "Bearer " prefix)',
        },
      },
    },
    security: [],
  },
  apis: ['./routes/*.js', './server.js'], // Files containing annotations
};

const swaggerSpec = swaggerJSDoc(options);

export default swaggerSpec;
