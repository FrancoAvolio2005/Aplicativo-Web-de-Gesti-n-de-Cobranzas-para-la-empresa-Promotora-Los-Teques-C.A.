/**
 * Puerto (interfaz) del repositorio de usuarios.
 * Define el contrato que debe cumplir cualquier implementación concreta.
 * La capa de dominio solo conoce esta interfaz, no la implementación.
 */
class IUserRepository {
  async findById(id) { throw new Error('Not implemented'); }
  async findByEmail(email) { throw new Error('Not implemented'); }
  async create(userData) { throw new Error('Not implemented'); }
  async update(id, data) { throw new Error('Not implemented'); }
  async saveRefreshToken(userId, token) { throw new Error('Not implemented'); }
  async clearRefreshToken(userId) { throw new Error('Not implemented'); }
  async findByRefreshToken(token) { throw new Error('Not implemented'); }
}

module.exports = IUserRepository;
