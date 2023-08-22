const { Router } = require('express');
const Sequelize = require('sequelize');
const model = require('../model');
const AdminService = require('../services/admin.services');

const adminService = new AdminService(model, Sequelize);
const router = Router();

/**
 * @returns Returns the profession that earned the most money (sum of jobs paid)
 * for any contactor that worked in the query time range (e.g. 2023-07-30T08:00 to 2023-07-31T08:00).
 * SHORTCUT: We're assuming the timestamps will always be present and come in 
 * a valid format, otherwise we'd have to add a validation middleware.
 *
 * SHORTCUT: As an admin endpoint, this should be behind a VPC to be authorized
 * through VPN. We'll be skipping any auth steps for the sake of simplicity. 
*/
router.get('/best-profession', async (req, res) => {
  try {
    const { start, end } = req.query;
    const result = await adminService.getBestProfession({ start, end });
    return res
      .status(result.status)
      .json(result.body)
      .end()
  } catch (e) {
    console.error(e);
    res
      .status(500)
      .json({ message: "Internal server error" })
      .end()
  }
})

/**
 * @returns returns the clients the paid the most for jobs in the query time period 
 * (e.g. 2023-07-30T08:00 to 2023-07-31T08:00).
 * Limit query parameter should be applied, default limit is 2.
 * 
 * SHORTCUT: We're assuming the timestamps will always be present and come in 
 * a valid format, otherwise we'd have to add a validation middleware.
 *
 * SHORTCUT: As an admin endpoint, this should be behind a VPC to be authorized
 * through VPN. We'll be skipping any auth steps for the sake of simplicity.
*/
router.get('/best-clients', async (req, res) => {
  const { start, end, limit = 2 } = req.query;
  try {
    const result = await adminService.getBestClients({ start, end, limit });
    return res
      .status(result.status)
      .json(result.body)
      .end()
  } catch (e) {
    console.error(e);
    res
      .status(500)
      .json({ message: "Internal server error" })
      .end()
  }
})

module.exports = router;