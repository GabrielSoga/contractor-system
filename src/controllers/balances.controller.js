const { Router } = require('express');
const Sequelize = require('sequelize');
const model = require('../model');
const { getClientProfile } = require('../middleware/profiles');
const BalancesService = require('../services/balances.services');

const balancesService = new BalancesService(model, Sequelize);
const router = Router();

/**
 * @swagger
 * /balances/deposit/{userId}:
 *   post:
 *     summary: Deposit money into the balance of a client
 *     description: Deposits money into the balance of a client. A client can't deposit more than 25% of their total jobs' worth.
 *       <br><br>SHORTCUT - We're assuming the userId and amount will always be present and come in a valid format, otherwise we'd have to add a validation middleware.
 *       <br><br>Valid inputs for testing - userId=2 / profile_id = 2 / amount=100
 *     parameters:
 *       - in: path
 *         name: userId
 *         schema:
 *           type: integer
 *           description: ID of the client user
 *         required: true
 *       - in: query
 *         name: amount
 *         schema:
 *           type: number
 *           description: Amount to be deposited
 *         required: true
 *       - in: header
 *         name: profile_id
 *         schema:
 *           type: integer
 *           description: ID of the authenticated user's profile
 *         required: true
 *     responses:
 *       200:
 *         description: Successful deposit response
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   description: Success message
 *       400:
 *         description: Invalid user or deposit amount exceeds limit
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   description: Error message
 *       401:
 *         description: Unauthorized
 * 
 *       404:
 *         description: No active contracts found for the user
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   description: Error message
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   description: Error message
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