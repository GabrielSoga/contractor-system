const { Router } = require('express');
const { Op } = require('sequelize');
const { getClientProfile } = require('../middleware/profiles');

// SHORTCUT: Ideally, the IN_PROGRESS keyword should be a Constant declared somewhere in
// Sequelize ENUM. but we'll take the shortcut and declare it here.
const IN_PROGRESS = 'in_progress';
const BALANCE_FIELD = 'balance';
const DEPOSIT_MAX_PERCENTAGE = 0.25;

const router = Router();

const balancesErrorMessage = {
  invalidUser: (yourId, userIdToDeposit) => ({
    message: "You can only deposit to your own account.",
    yourId,
    userIdToDeposit
  }),
  contractNotFound: (profileIdFromHeader) => ({
    message: "No active contracts found for this profile id",
    profileId: profileIdFromHeader
  }),
  invalidDeposit: (totalOfJobsToPay, maxDeposit, currentDeposit) => ({
    message: "Invalid deposit. Can't deposit more than 25% of the total of jobs to pay.",
    totalOfJobsToPay,
    maxDeposit,
    currentDeposit
  })
}

/**
 * @returns Deposits money into the balance of a client, a client
 * can't deposit more than 25% his total of jobs to pay (at the deposit moment).
 *
 * NOTE: This problem statement is lacking information regarding how to
 * express the amount to be deposit in the request. We'll assume it's in the QueryStrings
 * (parameter: amount) so the path remains unchanged.
 *
 * PERSONAL NOTE: The constraint for not being able to deposit more than 25% of his total
 * of jobs to pay doesn't make sense for me in a product perspective, but will be added
 * for the sake of the test.
 *
 * SHORTCUT: We're assuming the userId and amount will always be present and come in 
 * a valid format, otherwise we'd have to add a validation middleware.
 */
router.post('/deposit/:userId', getClientProfile, async (req, res) => {
  const { Contract, Job, Profile } = req.app.get('models')
  const { id: clientIdFromHeader } = req.profile
  const { userId } = req.params
  const { amount } = req.query;

  try {
    if (parseInt(clientIdFromHeader) !== parseInt(userId)) {
      return res
        .status(400)
        .json(balancesErrorMessage.invalidUser(clientIdFromHeader, userId))
        .end()
    }

    const contracts = await Contract.findAll({
      where: {
        [Op.and]: [
          { status: IN_PROGRESS },
          { ClientId: clientIdFromHeader },
        ],
      },
      include: [
        {
          model: Job,
          where: {
            [Op.or]: [
              { paid: false },
              { paid: null }
            ]
          }
        }
      ]
    });

    if (!contracts || contracts.length === 0) {
      return res.status(404)
        .json(balancesErrorMessage.contractNotFound(clientIdFromHeader))
        .end();
    }

    const totalFromQuery = contracts.reduce((total, contract) => {
      return total + contract.Jobs.reduce((jobsTotal, job) => jobsTotal + job.dataValues.price, 0);
    }, 0);

    const totalOfJobsToPay = Number(totalFromQuery)
    const maxDeposit = totalOfJobsToPay * DEPOSIT_MAX_PERCENTAGE;
    const currentDeposit = Number(amount);
    if (currentDeposit > maxDeposit) {
      return res
        .status(400)
        .json(balancesErrorMessage.invalidDeposit(totalOfJobsToPay, maxDeposit, currentDeposit))
        .end()
    }

    await Profile.increment(
      BALANCE_FIELD,
      {
        by: currentDeposit,
        where: { id: userId }
      }
    )

    return res.status(200).json({ message: "Deposit successful" })
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: "Internal server error" }).end()
  }
})

module.exports = router;