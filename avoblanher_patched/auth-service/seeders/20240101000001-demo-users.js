'use strict';
const bcrypt = require('bcrypt');
const { v4: uuidv4 } = require('uuid');

module.exports = {
  async up(queryInterface, Sequelize) {
    const SALT_ROUNDS = 12;

    const users = [
      {
        id: uuidv4(),
        nombre: 'Administrador Principal',
        email: 'admin@avoblanher.com',
        password: await bcrypt.hash('Admin1234!', SALT_ROUNDS),
        rol: 'admin',
        activo: true,
        refresh_token: null,
        created_at: new Date(),
        updated_at: new Date(),
      },
      {
        id: uuidv4(),
        nombre: 'Supervisora Ana García',
        email: 'ana.garcia@avoblanher.com',
        password: await bcrypt.hash('Super1234!', SALT_ROUNDS),
        rol: 'supervisor',
        activo: true,
        refresh_token: null,
        created_at: new Date(),
        updated_at: new Date(),
      },
      {
        id: uuidv4(),
        nombre: 'Operador Luis Martínez',
        email: 'luis.martinez@avoblanher.com',
        password: await bcrypt.hash('Operador1234!', SALT_ROUNDS),
        rol: 'operador',
        activo: true,
        refresh_token: null,
        created_at: new Date(),
        updated_at: new Date(),
      },
      // Usuario cliente de prueba (para el portal)
      {
        id: uuidv4(),
        nombre: 'Carlos Rodríguez',
        email: 'carlos.rodriguez@email.com',
        password: await bcrypt.hash('Carlos1234!', SALT_ROUNDS),
        rol: 'cliente',
        activo: true,
        refresh_token: null,
        created_at: new Date(),
        updated_at: new Date(),
      },
    ];

    await queryInterface.bulkInsert('users', users, {});
    console.log('✅ Seeder users ejecutado correctamente');
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete('users', null, {});
  },
};
