/**
 * OcrService — Validación de comprobantes bancarios sin Tesseract.js.
 *
 * ESTRATEGIA LIGERA:
 * - Si el cliente envía texto extraído del comprobante (campo `texto`), se usa directamente.
 * - Si envía imagen base64/buffer, se devuelve un resultado "pendiente de revisión manual"
 *   en lugar de correr Tesseract.js (que consume ~300-500 MB de RAM por worker).
 *
 * Esto reduce el consumo de RAM del servicio a < 80 MB en reposo.
 * El administrador puede revisar el comprobante adjunto manualmente si es necesario.
 */
const logger = require('../../infrastructure/logger/logger');

const KEYWORDS = [
  'transferencia', 'pago', 'movil', 'referencia', 'ref', 'monto',
  'banco', 'mercantil', 'banesco', 'venezuela', 'provincial',
  'bicentenario', 'bnc', 'bdv', 'exterior', 'sofitasa',
  'aprobado', 'exitosa', 'confirmado', 'transacción', 'operación',
  'fecha', 'hora', 'bs', 'bolivares',
];

const BANCOS = ['mercantil', 'banesco', 'provincial', 'venezolano de crédito', 'exterior', 'bicentenario', 'bnc', 'bdv', 'sofitasa'];

class OcrService {

  /**
   * Valida un comprobante.
   * @param {Buffer|null} imageBuffer - imagen (no se procesa con OCR para ahorrar RAM)
   * @param {string|null} texto       - texto ya extraído por el cliente (opcional)
   */
  async validate(imageBuffer, texto = null) {

    // Si viene texto pre-extraído (recomendado), analizarlo directamente
    if (texto && texto.trim().length > 10) {
      logger.info('OcrService: analizando texto pre-extraído (sin OCR)');
      return this._analizarTexto(texto);
    }

    // Si solo viene imagen sin texto → devolver "pendiente manual"
    // (evita cargar Tesseract.js y sus workers en RAM)
    if (imageBuffer) {
      logger.info('OcrService: imagen recibida sin texto → marcando para revisión manual');
      return {
        valido: null,
        texto: '',
        datos: { referencia: null, monto: null, fecha: null, banco: null },
        keywords_encontradas: 0,
        razon: 'Comprobante recibido. Requiere revisión manual por el administrador.',
        revision_manual: true,
      };
    }

    return {
      valido: false,
      texto: '',
      datos: {},
      keywords_encontradas: 0,
      razon: 'No se recibió imagen ni texto del comprobante.',
    };
  }

  _analizarTexto(text) {
    const textLower = text.toLowerCase();
    const hits = KEYWORDS.filter(k => textLower.includes(k)).length;
    const valido = hits >= 3;

    const datos = {
      referencia: this._extract(text, /(?:ref(?:erencia)?\.?\s*[:#]?\s*)([A-Z0-9\-]{6,20})/i),
      monto:      this._extract(text, /(?:monto|bs\.?|bolivares)[\s:]*([0-9.,]+)/i),
      fecha:      this._extract(text, /(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4})/),
      banco:      BANCOS.find(b => textLower.includes(b)) || null,
    };

    logger.info(`OcrService: válido=${valido}, keywords=${hits}`);

    return {
      valido,
      texto: text.trim(),
      datos,
      keywords_encontradas: hits,
      razon: valido
        ? 'Comprobante con suficientes indicadores de validez'
        : `Pocos indicadores bancarios encontrados (${hits}/3 mínimo)`,
      revision_manual: false,
    };
  }

  _extract(text, regex) {
    const match = text.match(regex);
    return match ? match[1].trim() : null;
  }
}

module.exports = new OcrService();
