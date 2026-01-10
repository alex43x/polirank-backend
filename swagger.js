import swaggerAutogen from 'swagger-autogen';
import dotenv from 'dotenv';

dotenv.config();

const doc = {
    info: {
        title: 'PoliRank API',
        description: 'Documentación de la API para PoliRank',
    },
    host: `localhost:${process.env.PORT}`,
    schemes: ['http'],
};

console.log(`Generating swagger doc for host: localhost:${process.env.PORT}`);
const outputFile = './swagger_output.json';
const endpointsFiles = ['./app.js']; 

swaggerAutogen(outputFile, endpointsFiles)