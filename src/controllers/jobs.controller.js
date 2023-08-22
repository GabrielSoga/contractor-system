const { Router } = require('express');
const Sequelize = require('sequelize');
const { getProfile, getClientProfile } = require('../middleware/profiles');
const model = require('../model');
const JobsService = require('../services/jobs.services');

const jobsService = new JobsService(model, Sequelize)
const router = Router();

/**
 * @returns unpaid jobs for an user (contractor or client) in active contracts.
 */
router.get('/unpaid/', getProfile, async (req, res) => {
  try {
    const { id: profileIdFromHeader } = req.profile;
    const result = await jobsService.getUnpaidJobs(profileIdFromHeader);
    res
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
 * @returns Pay for a job, a client can only pay if his balance >= the amount to pay.
 * The amount should be moved from the client's balance to the contractor balance.
 *
 * SHORTCUT: Here we're assuming the job_id parameter is always a valid entry,
 * otherwise we'd have add validation steps
 */
router.post('/:job_id/pay', getClientProfile, async (req, res) => {
  try {
    const { job_id: jobId } = req.params;
    const { id: clientIdFromHeader } = req.profile;
    const result = await jobsService.payForJob(jobId, clientIdFromHeader);
    res
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