'use strict';
// DEPRECATED: La tabla 'clients' fue eliminada en v2.0.
// Los clientes ahora son users con rol='cliente' en el auth-service.
// Esta migración se mantiene como no-op para compatibilidad con historial de Sequelize.
module.exports = {
  async up()   { /* no-op */ },
  async down()  { /* no-op */ },
};
