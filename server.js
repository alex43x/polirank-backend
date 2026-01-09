import app from './app.js';
import sequelize from './db/connection.js';
import './models/index.js';

const PORT = process.env.PORT || 3000;

const startServer = async () => {
    try {
        // Prueba la conexión
        await sequelize.authenticate();
        console.log('✅ Conexión a la base de datos establecida correctamente');
        
        // Sincroniza los modelos (crea las tablas si no existen)
        await sequelize.sync({ force: false });
        console.log('✅ Modelos sincronizados con la base de datos');
        
        // Inicia el servidor
        app.listen(PORT, () => {
            console.log(`🚀 Servidor corriendo en puerto ${PORT}`);
        });
    } catch (error) {
        console.error('❌ Error al iniciar el servidor:', error);
        process.exit(1);
    }
};

startServer();
