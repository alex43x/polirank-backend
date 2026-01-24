import 'dotenv/config'
import { Sequelize } from 'sequelize';

const sequelize = new Sequelize({
    dialect: 'postgres',
    username: process.env.PG_USER,
    host: process.env.PG_HOST,
    database: process.env.PG_DATABASE,
    password: process.env.PG_PASSWORD,
    port: process.env.PG_PORT || 5432,
    logging: false,
    dialectOptions: {
    ssl: {
      require: true,
      rejectUnauthorized: false // Importante para Supabase
        }
    }
});

export default sequelize;
