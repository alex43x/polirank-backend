import { Umzug, SequelizeStorage } from 'umzug';
import sequelize from '../config/db.js';

const umzug = new Umzug({
  migrations: {
    glob: 'src/database/migrations/*.js',
    resolve: ({ name, path: migrationPath }) => ({
      name,
      up: async ({ context }) => {
        const { up } = await import(migrationPath);
        return up(context);
      },
      down: async ({ context }) => {
        const { down } = await import(migrationPath);
        return down(context);
      },
    }),
  },
  context: sequelize.getQueryInterface(),
  storage: new SequelizeStorage({ sequelize, tableName: 'migraciones' }),
  logger: console,
});

export default umzug;