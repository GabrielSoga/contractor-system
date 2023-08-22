const { Router } = require('express');
const Sequelize = require('sequelize');
const model = require('../model');
const { getClientProfile } = require('../middleware/profiles');
const BalancesService = require('../services/balances.services');

const balancesService = new BalancesService(model, Sequelize);
const router = Router();

/**
 * @returns Deposits money into the balance of a client, a client
 * can't deposit more than 25% his total of jobs to pay (at the deposit moment).
 *
 * SHORTCUT: We're assuming the userId and amount will always be present and come in 
 * a valid format, otherwise we'd have to add a validation middleware.
 */
router.post('/deposit/:userId', getClientProfile, async (req, res) => {
  try {
    const { id: clientIdFromHeader } = req.profile;
    const { userId } = req.params;
    const { amount } = req.query;

    const result = await balancesService.depositToClient(clientIdFromHeader, userId, amount);
    return res
      .status(result.status)
      .json(result.body)
      .end()
  } catch (e) {
    console.error(e);
    return res
      .status(500)
      .json({ message: "Internal server error" })
      .end()
  }
})

module.exports = router;