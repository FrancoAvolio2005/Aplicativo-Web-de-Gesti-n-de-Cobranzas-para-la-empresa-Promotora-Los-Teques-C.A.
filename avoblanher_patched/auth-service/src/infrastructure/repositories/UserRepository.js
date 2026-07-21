const IUserRepository = require('../../domain/repositories/IUserRepository');
const UserModel = require('../models/UserModel');
const User = require('../../domain/entities/User');
const { sequelize } = require('../database/connection');

class UserRepository extends IUserRepository {
  _toDomain(model) {
    if (!model) return null;
    return new User(model.toJSON());
  }

  async findById(id) {
    return this._toDomain(await UserModel.findByPk(id));
  }

  // FIX: Búsqueda case-insensitive + normalización para evitar conflictos con puntos y espacios
  async findByEmail(email) {
    const normalizedEmail = String(email).toLowerCase().trim();
    return this._toDomain(
      await UserModel.findOne({ 
        where: sequelize.where(
          sequelize.fn('LOWER', sequelize.col('email')),
          normalizedEmail
        )
      })
    );
  }

  async findAllByRol(rol) {
    const records = await UserModel.findAll({ where: { rol }, order: [['nombre', 'ASC']] });
    return records.map(r => this._toDomain(r));
  }

  // CORREGIDO: Creación limpia
  async create(userData) {
    const record = await UserModel.create(userData); 
    return this._toDomain(record);
  }

  async update(id, data) {
    await UserModel.update(data, { where: { id } });
    return this.findById(id);
  }

  async deleteById(id) {
    return UserModel.destroy({ where: { id } });
  }

  async saveRefreshToken(userId, token) {
    await UserModel.update({ refresh_token: token }, { where: { id: userId } });
  }

  async clearRefreshToken(userId) {
    await UserModel.update({ refresh_token: null }, { where: { id: userId } });
  }

  async findByRefreshToken(token) {
    return this._toDomain(await UserModel.findOne({ where: { refresh_token: token } }));
  }

  async saveResetCode(userId, code, expiresAt) {
    await UserModel.update({ reset_code: code, reset_code_expires: expiresAt }, { where: { id: userId } });
  }

  async clearResetCode(userId) {
    await UserModel.update({ reset_code: null, reset_code_expires: null }, { where: { id: userId } });
  }

  async updatePassword(userId, hashedPassword) {
    await UserModel.update({ password: hashedPassword }, { where: { id: userId } });
  }

  async findRawById(id) {
    return UserModel.findByPk(id);
  }
}

module.exports = UserRepository;