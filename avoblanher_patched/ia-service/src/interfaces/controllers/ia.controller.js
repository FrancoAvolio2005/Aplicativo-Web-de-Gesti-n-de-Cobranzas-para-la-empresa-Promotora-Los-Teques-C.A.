const ocrService  = require('../../application/services/OcrService');
const riskService = require('../../application/services/RiskService');
const logger      = require('../../infrastructure/logger/logger');

module.exports = {
  // POST /api/ocr/validate — recibe imagen multipart/base64 o texto plano del comprobante
  async validateOcr(req, res) {
    try {
      const imageBuffer = req.file ? req.file.buffer : (req.body.imageBase64 ? Buffer.from(req.body.imageBase64, 'base64') : null);
      // 'texto' permite al frontend enviar el texto del comprobante directamente (recomendado para ahorrar RAM)
      const texto = req.body.texto || null;

      if (!imageBuffer && !texto) {
        return res.status(400).json({ error: 'Se requiere imagen (multipart o base64) o campo "texto" con el contenido del comprobante' });
      }

      const result = await ocrService.validate(imageBuffer, texto);
      res.json(result);
    } catch (e) {
      logger.error(`OCR error: ${e.message}`);
      res.status(500).json({ error: e.message });
    }
  },

  // POST /api/risk/classify
  async classify(req, res) {
    try {
      const { user_id, promedioRetrasoRaw, tasaCumplimiento, promedioCobertura, frecuenciaEfectivo, cantidadRegistros } = req.body;
      if (!user_id) return res.status(400).json({ error: 'user_id es requerido' });
      const result = await riskService.classify({
        user_id,
        promedioRetrasoRaw:  parseFloat(promedioRetrasoRaw  || 0),
        tasaCumplimiento:    parseFloat(tasaCumplimiento    || 1),
        promedioCobertura:   parseFloat(promedioCobertura   || 1),
        frecuenciaEfectivo:  parseFloat(frecuenciaEfectivo  || 0),
        cantidadRegistros:   parseInt(cantidadRegistros      || 1),
      });
      res.status(201).json(result);
    } catch (e) {
      logger.error(`classify error: ${e.message}`);
      res.status(e.status || 500).json({ error: e.message });
    }
  },

  // GET /api/risk/report
  async getReport(req, res) {
    try { res.json(await riskService.getReport(req.query)); }
    catch (e) { res.status(500).json({ error: e.message }); }
  },

  // POST /api/risk/train — mantiene compatibilidad (heurístico, no necesita entrenamiento real)
  async retrain(req, res) {
    try { res.json(await riskService.retrain(req.body.data)); }
    catch (e) { res.status(500).json({ error: e.message }); }
  },
};
