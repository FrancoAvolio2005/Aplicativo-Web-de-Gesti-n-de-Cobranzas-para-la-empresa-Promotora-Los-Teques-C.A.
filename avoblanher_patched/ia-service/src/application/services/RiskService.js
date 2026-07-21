/**
 * RiskService — Clasificación de riesgo ligera sin Brain.js.
 * Usa un sistema de puntaje heurístico basado en reglas ponderadas.
 * Elimina el entrenamiento de red neuronal para reducir RAM y CPU al mínimo.
 */
const RiskClassificationRepository = require('../../infrastructure/repositories/RiskClassificationRepository');
const logger = require('../../infrastructure/logger/logger');

const repo = new RiskClassificationRepository();

class RiskService {

  /**
   * Clasifica el riesgo usando puntaje ponderado (sin ML pesado).
   * Rango del puntaje: 0 (muy bueno) → 100 (muy alto riesgo)
   */
  _calcularPuntaje({ promedioRetrasoRaw, tasaCumplimiento, promedioCobertura, frecuenciaEfectivo, cantidadRegistros }) {
    // Peso 1: Promedio de retraso en días (max referencia: 90 días = peor caso)
    const p_retraso = Math.min(promedioRetrasoRaw / 90, 1) * 40; // hasta 40 pts

    // Peso 2: Tasa de cumplimiento (1 = siempre cumple → 0 riesgo, 0 = nunca → max riesgo)
    const p_cumplimiento = (1 - Math.min(Math.max(tasaCumplimiento, 0), 1)) * 30; // hasta 30 pts

    // Peso 3: Cobertura de pagos (1 = paga todo → 0 riesgo)
    const p_cobertura = (1 - Math.min(Math.max(promedioCobertura, 0), 1)) * 20; // hasta 20 pts

    // Peso 4: Historial escaso penaliza levemente (menos de 3 registros = incertidumbre)
    const p_historial = cantidadRegistros < 3 ? 10 : 0; // 10 pts penalización por historial escaso

    return p_retraso + p_cumplimiento + p_cobertura + p_historial;
  }

  _clasificarNivel(puntaje) {
    if (puntaje < 30) return 'bajo';
    if (puntaje < 65) return 'medio';
    return 'alto';
  }

  _getRecomendacion(nivel) {
    const map = {
      bajo:  'Cliente con buen historial. Se recomienda mantener condiciones actuales.',
      medio: 'Historial irregular. Se recomienda seguimiento mensual y alertas preventivas.',
      alto:  'Alto riesgo. Se recomienda reducir plazos de crédito e iniciar gestión de cobro proactiva.',
    };
    return map[nivel];
  }

  async classify({ user_id, promedioRetrasoRaw, tasaCumplimiento, promedioCobertura, frecuenciaEfectivo, cantidadRegistros }) {
    const puntaje = this._calcularPuntaje({ promedioRetrasoRaw, tasaCumplimiento, promedioCobertura, frecuenciaEfectivo, cantidadRegistros });
    const nivel   = this._clasificarNivel(puntaje);

    // Probabilidades aproximadas basadas en puntaje para mantener compatibilidad con el frontend
    const pBajo  = parseFloat(Math.max(0, (1 - puntaje / 100) * (nivel === 'bajo' ? 1 : 0.5)).toFixed(4));
    const pAlto  = parseFloat(Math.min(1, (puntaje / 100) * (nivel === 'alto'  ? 1 : 0.5)).toFixed(4));
    const pMedio = parseFloat(Math.max(0, 1 - pBajo - pAlto).toFixed(4));

    const result = {
      user_id,
      nivel_riesgo:       nivel,
      probabilidad_bajo:  pBajo,
      probabilidad_medio: pMedio,
      probabilidad_alto:  pAlto,
      promedio_retraso:    promedioRetrasoRaw,
      tasa_cumplimiento:   tasaCumplimiento,
      promedio_cobertura:  promedioCobertura,
      frecuencia_efectivo: frecuenciaEfectivo,
      cantidad_registros:  cantidadRegistros,
      recomendacion: this._getRecomendacion(nivel),
    };

    const saved = await repo.create(result);
    logger.info(`Clasificación: cliente ${user_id} → ${nivel} (puntaje: ${puntaje.toFixed(1)})`);
    return saved;
  }

  async getReport(query) {
    return repo.findAll(query);
  }

  // Se mantiene para compatibilidad con el endpoint /retrain aunque ya no hay modelo que entrenar
  async retrain(_newData) {
    logger.info('ℹ️  retrain llamado — sistema heurístico, no requiere entrenamiento');
    return { message: 'Sistema heurístico actualizado. No se requiere entrenamiento.' };
  }
}

module.exports = new RiskService();
