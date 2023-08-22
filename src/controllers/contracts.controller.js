const { Router } = require('express');
const Sequelize = require('sequelize');
const { getProfile } = require('../middleware/profiles')
const model = require('../model');
const ContractService = require('../services/contracts.services');

/**
 * @swagger
 * components:
 *   schemas:
 *     Contract:
 *       type: object
 *       properties:
 *         id:
 *           type: integer
 *           description: Contract ID
 *         terms:
 *           type: string
 *           description: Contract terms
 *         status:
 *           type: string
 *           description: Contract status
 *         createdAt:
 *           type: string
 *           format: date-time
 *           description: Contract creation date
 *         updatedAt:
 *           type: string
 *           format: date-time
 *           description: Contract update date
 *         ContractorId:
 *           type: integer
 *           description: ID of the contractor
 *         ClientId:
 *           type: integer
 *           description: ID of the client
 */

const router = Router();
const contractService = new ContractService(model, Sequelize);

/**
 * @swagger
 * /contracts/{id}:
 *   get:
 *     summary: Get a contract by ID
 *     description: Get a contract by its ID.
 *       <br><br> SHORTCUT - Here we're assuming the id parameter is always a valid entry, otherwise we'd have add validation steps
 *       <br><br> Valid parameters for testing - id = 1 / profile_id = 1
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: integer
 *         description: ID of the contract to retrieve
 *         required: true
 *       - in: header
 *         name: profile_id
 *         schema:
 *           type: integer
 *           description: ID of the authenticated user's profile
 *         required: true
 *     responses:
 *       200:
 *         description: Successful retrieval of the contract
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   $ref: '#/components/schemas/Contract'
 * 
 *       401:
 *         description: Unauthorized
 * 
 *       404:
 *         description: Contract not found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   description: Error message
 *                 profileId:
 *                   type: integer
 *                   description: Profile ID from header
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
router.get('/:id', getProfile, async (req, res) => {
  try {
    const { id: contractId } = req.params;
    const { id: profileIdFromHeader } = req.profile;
    const result = await contractService.getContractById(contractId, profileIdFromHeader);
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
 * @swagger
 * /contracts/:
 *   get:
 *     summary: Get all contracts by user
 *     description: Get all non-terminated contracts for a user (client or contractor).
 *       <br><br> Valid parameters for testing - profile_id = 2
 *     parameters:
 *       - in: header
 *         name: profile_id
 *         schema:
 *           type: integer
 *           description: ID of the authenticated user's profile
 *         required: true
 *     responses:
 *       200:
 *         description: Successful retrieval of contracts
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Contract'
 * 
 *       401:
 *         description: Unauthorized
 * 
 *       404:
 *         description: Contracts not found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   description: Error message
 *                 profileId:
 *                   type: integer
 *                   description: Profile ID from header
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
router.get('/', getProfile, async (req, res) => {
  try {
    const { id: profileIdFromHeader } = req.profile
    const result = await contractService.getAllContractsByUser(profileIdFromHeader);
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
