'use strict';
const { v4: uuidv4 } = require('uuid');

module.exports = {
  async up(queryInterface) {
    const clientId1 = uuidv4();
    const clientId2 = uuidv4();
    const clientId3 = uuidv4();

    await queryInterface.bulkInsert('clients', [
      { id: clientId1, nombre: 'Carlos Rodríguez', email: 'carlos.rodriguez@email.com', cedula: '31490068', telefono: '0412-1234567', direccion: 'Urb. Los Altos, Los Teques', activo: true, created_at: new Date(), updated_at: new Date() },
      { id: clientId2, nombre: 'Inversiones Delta C.A.', email: 'delta@inversiones.com', cedula: 'J-12345678-9', telefono: '0212-9876543', direccion: 'Av. Principal, Caracas', activo: true, created_at: new Date(), updated_at: new Date() },
      { id: clientId3, nombre: 'Logística Rápida S.A.', email: 'logistica@rapida.com', cedula: 'J-98765432-1', telefono: '0212-1111111', direccion: 'Zona Industrial, La Trinidad', activo: true, created_at: new Date(), updated_at: new Date() },
    ]);

    const inv1 = uuidv4();
    const inv2 = uuidv4();
    const inv3 = uuidv4();

    const today = new Date();
    const past = new Date(today); past.setDate(past.getDate() - 15);
    const future = new Date(today); future.setDate(future.getDate() + 15);

    await queryInterface.bulkInsert('invoices', [
      { id: inv1, cliente_id: clientId1, descripcion: 'Servicio mensual de cobranza - Enero 2026', monto_ves: 150000.00, status: 'pendiente', fecha_emision: today.toISOString().split('T')[0], fecha_vencimiento: future.toISOString().split('T')[0], created_at: new Date(), updated_at: new Date() },
      { id: inv2, cliente_id: clientId2, descripcion: 'Mantenimiento y gestión - Diciembre 2025', monto_ves: 320000.00, status: 'vencida', fecha_emision: past.toISOString().split('T')[0], fecha_vencimiento: past.toISOString().split('T')[0], created_at: new Date(), updated_at: new Date() },
      { id: inv3, cliente_id: clientId3, descripcion: 'Servicio de notificaciones - Enero 2026', monto_ves: 85000.00, status: 'pagada', fecha_emision: past.toISOString().split('T')[0], fecha_vencimiento: today.toISOString().split('T')[0], created_at: new Date(), updated_at: new Date() },
    ]);

    console.log('✅ Seeder billing ejecutado correctamente');
  },
  async down(queryInterface) {
    await queryInterface.bulkDelete('payments', null, {});
    await queryInterface.bulkDelete('invoices', null, {});
    await queryInterface.bulkDelete('clients', null, {});
  }
};
