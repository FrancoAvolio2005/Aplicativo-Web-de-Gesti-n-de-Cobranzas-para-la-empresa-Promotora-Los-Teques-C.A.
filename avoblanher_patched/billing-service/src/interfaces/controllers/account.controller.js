const AccountService = require('../../application/services/AccountService');
const svc = new AccountService();

module.exports = {
  // GET /accounts/:userId?company_id=...&no_company=true
  async getAccount(req, res) {
    try {
      const userId    = req.params.userId;
      const companyId = req.query.company_id || null;
      const noCompany = req.query.no_company === 'true';
      res.json(await svc.getAccountSummary(userId, companyId, noCompany));
    } catch (e) { res.status(e.status || 500).json({ error: e.message }); }
  },

  // El cliente autenticado consulta su propio estado de cuenta
  async getMyAccount(req, res) {
    try {
      const userId    = req.user.id;
      const companyId = req.query.company_id || null;
      const noCompany = req.query.no_company === 'true';
      res.json(await svc.getAccountSummary(userId, companyId, noCompany));
    } catch (e) { res.status(e.status || 500).json({ error: e.message }); }
  },
};

