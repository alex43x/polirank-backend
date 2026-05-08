import app from './src/app.js';
import sequelize from './src/config/db.js';
import './src/models/index.js';
import { env } from './src/config/env.js';

const startServer = async () => {
  try {
    await sequelize.authenticate();
    console.log('✅ Conexión a la base de datos establecida correctamente');

    await sequelize.sync({ force: false });
    console.log('✅ Modelos sincronizados con la base de datos');

    app.listen(env.port, () => {
      console.log(`🚀 Servidor corriendo en puerto ${env.port}`);
    });
  } catch (error) {
    console.error('❌ Error al iniciar el servidor:', error);
    process.exit(1);
  }
};

startServer();
