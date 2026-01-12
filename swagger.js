import swaggerAutogen from 'swagger-autogen';
import dotenv from 'dotenv';
dotenv.config();

const doc = {
  openapi: "3.0.0",
  info: {
    title: "PoliRank API",
    description: "Documentación de la API para PoliRank",
    version: "1.0.0"
  },
  servers: [
    {
      url: `http://localhost:${process.env.PORT || 3001}`
    }
  ],
  components: {
    securitySchemes: {
      bearerAuth: {
        type: "http",
        scheme: "bearer",
        bearerFormat: "JWT"
      }
    }
  },
  security: [
    {
      bearerAuth: []
    }
  ]
};

const outputFile = "./swagger_output.json";
const endpointsFiles = ["./app.js"];

swaggerAutogen({ openapi: "3.0.0" })(outputFile, endpointsFiles, doc);
