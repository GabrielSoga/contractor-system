const { Router } = require('express');
const Sequelize = require('sequelize');
const { getProfile, getClientProfile } = require('../middleware/profiles');
const model = require('../model');
const JobsService = require('../services/jobs.services');

/**
 * @swagger
 * components:
 *   schemas:
 *     Job:
 *       type: object
 *       properties:
 *         id:
 *           type: integer
 *           description: Job ID
 *         description:
 *           type: string
 *           description: Job description
 *         price:
 *           type: number
 *           description: Job price
 *         paid:
 *           type: boolean
 *           description: Whether it was paid or not. Can be null
 *         paymentDate:
 *           description: Job payment date. Can be null
 *           type: string
 *           format: date-time
 *         createdAt:
 *           description: Job creation date
 *           type: string
 *           format: date-time
 *         updatedAt:
 *           description: Job update date
 *           type: string
 *           format: date-time
 *         ContractId:
 *           description: ID of the associated contract
 *           type: integer
 */


const jobsService = new JobsService(model, Sequelize)
const router = Router();

/**
 * @swagger
 * /jobs/unpaid/:
 *   get:
 *     summary: Get unpaid jobs for an authenticated user
 *     description: Returns unpaid jobs for an authenticated user (contractor or client) in active contracts.
 *       <br><br> Valid parameters for testing - profile_id = 1
 *     parameters:
 *       - in: header
 *         name: profile_id
 *         schema:
 *           type: integer
 *           description: ID of the authenticated user's profile
 *         required: true
 *     responses:
 *       200:
 *         description: Successful response containing unpaid jobs
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   $ref: '#/components/schemas/Job'
 *       401:
 *         description: Unauthorized - User is not authenticated
 * 
 *       404:
 *         description: No active contracts or unpaid jobs found for the user
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
 * @swagger
 * /jobs/{job_id}/pay:
 *   post:
 *     summary: Client pays for a job
 *     description: Pay for a job, a client can only pay if their balance >= the amount to pay.
 *       The amount should be moved from the client's balance to the contractor balance.
 *       <br><br> SHORTCUT - Here we're assuming the job_id parameter is always a valid entry, otherwise we'd have add validation steps
 *       <br><br> Valid inputs for testing - job_id = 3 / profile_id = 2
 *     parameters:
 *       - in: path
 *         name: job_id
 *         schema:
 *           type: integer
 *         description: ID of the job to pay for
 *         required: true
 *       - in: header
 *         name: profile_id
 *         schema:
 *           type: integer
 *           description: ID of the authenticated user's profile. Must be a Client
 *         required: true
 *     responses:
 *       200:
 *         description: Successful payment
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   description: Payment successful message
 *       400:
 *         description: Bad Request - Not enough balance or other errors
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   description: Error message
 *                 currentBalance:
 *                   type: number
 *                   description: Current client balance
 *                 minimumBalance:
 *                   type: number
 *                   description: Minimum required balance for payment
 *       401:
 *         description: Unauthorized - User is not authenticated
 *
 *       404:
 *         description: Not Found - Contract, job, or user not found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   description: Error message
 *       500:
 *         description: Internal server error or transaction failure
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   description: Error message
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