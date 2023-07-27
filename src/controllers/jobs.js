const { Router } = require('express');
const { Op } = require('sequelize');

const router = Router();

/**
 * @returns unpaid jobs for an user (contractor or client) for active contracts
 */
router.get('/:id', getProfile, async (req, res) => {
    const { Jobs } = req.app.get('models')

})