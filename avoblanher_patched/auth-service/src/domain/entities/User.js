/**
 * Entidad de dominio: User
 * Capa de dominio pura — sin dependencias externas.
 */
class User {
  constructor({ id, nombre, email, password, rol, refresh_token, activo, created_at, updated_at, cedula, telefono }) {
    this.id = id;
    this.nombre = nombre;
    this.email = email;
    this.cedula = cedula;
    this.telefono = telefono;
    this.password = password;
    this.rol = rol; // 'admin' | 'supervisor' | 'operador' | 'cliente'
    this.refresh_token = refresh_token || null;
    this.activo = activo !== undefined ? activo : true;
    this.created_at = created_at;
    this.updated_at = updated_at;
  }

  /**
   * Retorna los datos seguros del usuario (sin password ni refresh_token)
   */
  toPublic() {
    return {
      id: this.id,
      nombre: this.nombre,
      email: this.email,
      cedula: this.cedula,
      telefono: this.telefono,
      rol: this.rol,
      activo: this.activo,
      created_at: this.created_at,
    };
  }

  /**
   * Verifica si el usuario tiene permisos de administrador
   */
  isAdmin() {
    return this.rol === 'admin';
  }

  /**
   * Verifica si el usuario puede realizar una acción basada en su rol
   * Jerarquía: admin > supervisor > operador > cliente
   */
  hasRoleAtLeast(requiredRole) {
    const hierarchy = { admin: 4, supervisor: 3, operador: 2, cliente: 1 };
    return (hierarchy[this.rol] || 0) >= (hierarchy[requiredRole] || 0);
  }
}

module.exports = User;
