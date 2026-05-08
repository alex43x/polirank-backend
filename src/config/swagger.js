import swaggerJsdoc from 'swagger-jsdoc';
import { env } from './env.js';

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'PoliRank API',
      description: 'Documentación de la API para PoliRank',
      version: '1.0.0',
    },
    servers: [{ url: `http://localhost:${env.port}` }],
    components: {
      securitySchemes: {
        bearerAuth: { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' },
        carreraId: { type: 'apiKey', name: 'x-carrera-id', in: 'header' },
      },
      schemas: {
        Error: {
          type: 'object',
          properties: {
            error: {
              type: 'object',
              properties: {
                code: { type: 'string', example: 'student_not_found' },
                message: { type: 'string', example: 'Alumno no encontrado' },
                details: {
                  type: 'array',
                  items: {
                    type: 'object',
                    properties: {
                      field: { type: 'string' },
                      code: { type: 'string' },
                      message: { type: 'string' },
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
    security: [{ bearerAuth: [], carreraId: [] }],
  },
  apis: ['./src/modules/**/*Routes.js'],
};

export const swaggerSpec = swaggerJsdoc(options);
