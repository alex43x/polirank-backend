import { Sequelize } from 'sequelize';
import { env } from './env.js';

const sequelize = new Sequelize({
  dialect: 'postgres',
  username: env.db.user,
  host: env.db.host,
  database: env.db.database,
  password: env.db.password,
  port: env.db.port,
  logging: false,
  define: {
    freezeTableName: true,
  },
  dialectOptions: {
    ssl: {
      require: true,
      rejectUnauthorized: false,
    },
  },
});

export default sequelize;
