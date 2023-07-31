const { Router } = require('express');
const { Op } = require('sequelize');
const { getProfile, getClientProfile } = require('../middleware/profiles')

// SHORTCUT: Ideally, the IN_PROGRESS keyword should be a Constant declared somewhere in 
// Sequelize ENUM. but we'll take the shortcut and declare it here.
const IN_PROGRESS = 'in_progress'

const router = Router();

// SHORTCUT: This ideally would be a class to enable testing, but we'll get this shortcut
const jobErrorMessage = {
  contractNotFound: (profileIdFromHeader) => ({
    message: "No active contracts found for this profile id",
    profileId: profileIdFromHeader
  }),
  unpaidJobsNotFound: (profileIdFromHeader) => ({
    message: `No unpaid jobs found for this profile id`,
    profileId: profileIdFromHeader
  }),
  jobNotFound: (jobId, clientIdFromHeader) => ({
    message: `JobId not found for this client`,
    jobId: jobId,
    clientId: clientIdFromHeader
  }),
  notEnoughBalance: (balance, price) => ({
    message: `Not enough balance`,
    currentBalance: balance,
    minimumBalance: price
  })
}

/**
 * @returns unpaid jobs for an user (contractor or client) in active contracts.
 * Using sequelize include to join Contract and Job models
 */
router.get('/unpaid/', getProfile, async (req, res) => {
  const { Contract, Job } = req.app.get('models')
  const { id: profileIdFromHeader } = req.profile

  try {
    const contracts = await Contract.findAll({
      where: {
        [Op.and]: [
          { status: IN_PROGRESS },
          {
            [Op.or]: [
              { ClientId: profileIdFromHeader },
              { ContractorId: profileIdFromHeader },
            ],
          },
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
        .json(jobErrorMessage.contractNotFound(profileIdFromHeader))
        .end();
    }

    const unpaidJobs = contracts.reduce((jobs, contract) => {
      return jobs.concat(contract.Jobs.map((job) => job.dataValues));
    }, []);

    if (!unpaidJobs || unpaidJobs.length === 0) {
      return res.status(404)
        .json(jobErrorMessage.unpaidJobsNotFound(profileIdFromHeader))
        .end()
    }

    res.status(200).json(unpaidJobs)
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: "Internal server error" }).end()
  }
})

/**
 * @returns Pay for a job, a client can only pay if his balance >= the amount to pay.
 *  The amount should be moved from the client's balance to the contractor balance.
 *
 * SHORTCUT: Here we're assuming the job_id parameter is always a valid entry,
 * otherwise we'd have add validation steps
 *
 * NOTE: We're applying a transaction to ensure the balance/jobs update will always happen together
 */
router.post('/:job_id/pay', getClientProfile, async (req, res) => {
  const { job_id: jobId } = req.params
  const { id: clientIdFromHeader } = req.profile
  const { Job, Contract, Profile } = req.app.get('models')
  const sequelize = req.app.get('sequelize')
  const BALANCE_FIELD = 'balance';

  try {
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
          where: { id: jobId }
        },
        {
          model: Profile,
          as: 'Client'
        },
        {
          model: Profile,
          as: 'Contractor'
        }
      ]
    });

    if (!contracts || contracts.length === 0) {
      return res.status(404)
        .json(jobErrorMessage.contractNotFound(profileIdFromHeader))
        .end();
    }


    const [targetJob] = contracts[0].Jobs
    const targetClient = contracts[0].Client
    const targetContractor = contracts[0].Contractor

    if (!targetJob) {
      return res.status(404)
        .json(jobErrorMessage.jobNotFound(jobId, clientIdFromHeader))
        .end();
    }

    if (targetClient.balance < targetJob.price) {
      return res.status(400)
        .json(jobErrorMessage.notEnoughBalance(targetClient.balance, targetJob.price))
        .end()
    }

    await sequelize.transaction(async (t) => {
      try {
        await Profile.decrement(
          BALANCE_FIELD,
          { by: targetJob.price, where: { id: targetClient.id } },
          { transaction: t }
        )
        await Profile.increment(
          BALANCE_FIELD,
          { by: targetJob.price, where: { id: targetContractor.id } },
          { transaction: t }
        )
        await Job.update(
          { paid: true, paymentDate: new Date() },
          { where: { id: targetJob.id } },
          { transaction: t }
        )
      } catch (e) {
        console.error(e);
        res.status(500).json({ message: "Transaction failed" }).end()
      }
    })
    res.status(200).json({ message: "Payment successful" })
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: "Internal server error" }).end()
  }
})

module.exports = router;