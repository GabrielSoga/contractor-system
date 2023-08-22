const { Router } = require('express');
const Sequelize = require('sequelize');
const model = require('../model');
const AdminService = require('../services/admin.services');

/**
 * @swagger
 * components:
 *   schemas:
 *     Profile:
 *       type: object
 *       properties:
 *         id:
 *           type: number
 *           description: Client's ID
 *         fullName:
 *           type: string
 *           description: Client's full name
 *         totalPaid:
 *           type: number
 *           description: Total amount paid by the client
 */

const adminService = new AdminService(model, Sequelize);
const router = Router();

/**
 * @swagger
 * /admin/best-profession:
 *   get:
 *     summary: Get the profession that earned the most money within a time range
 *     description: Returns the profession that earned the most money (sum of jobs paid) for any contractor that worked in the query time range. 
 *        <br><br>SHORTCUT - We're assuming the timestamps will always be present and come in a valid format, otherwise we'd have to add a validation middleware.
 *        <br>SHORTCUT - As an admin endpoint, this should be behind a VPC to be authorized through VPN. We'll be skipping any auth steps for the sake of simplicity.
 *        <br><br>Valid timestamps for testing - start=2020-08-14 end=2020-08-16
 * 
 *     parameters:
 *       - in: query
 *         name: start
 *         schema:
 *           type: string
 *           format: date-time
 *         description: Start of the time range
 *       - in: query
 *         name: end
 *         schema:
 *           type: string
 *           format: date-time
 *         description: End of the time range
 *     responses:
 *       200:
 *         description: Successful response with the best-earning profession
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 profession:
 *                   type: string
 *                   description: The profession that earned the most money
 *                 totalEarnings:
 *                   type: number
 *                   description: Total earnings for the profession
 *       404:
 *         description: No highest earning profession found for the given time range
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
 * @swagger
 * /admin/best-clients:
 *   get:
 *     summary: Get the clients who paid the most within a time range
 *     description: Returns the clients who paid the most for jobs in the query time period.
 *        <br><br>SHORTCUT - We're assuming the timestamps will always be present and come in a valid format, otherwise we'd have to add a validation middleware.
 *        <br>SHORTCUT - As an admin endpoint, this should be behind a VPC to be authorized through VPN. We'll be skipping any auth steps for the sake of simplicity.
 *        <br><br>Valid timestamps for testing - start=2020-08-14 / end=2020-08-16
 *     parameters:
 *       - in: query
 *         name: start
 *         schema:
 *           type: string
 *           format: date-time
 *         description: Start of the time range
 *       - in: query
 *         name: end
 *         schema:
 *           type: string
 *           format: date-time
 *         description: End of the time range
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *         description: Maximum number of clients to retrieve (default is 2)
 *     responses:
 *       200:
 *         description: Successful response with the best-paying clients
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   type: array
 *                   description: Array of client objects with payment information
 *                   items:
 *                     $ref: '#/components/schemas/Profile'
 *
 *       404:
 *         description: No highest paying clients found for the given time range
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