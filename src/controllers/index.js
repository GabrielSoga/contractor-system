const contractsRouter = require('./contracts.controller');
const jobsRouter = require('./jobs.controller');
const balancesRouter = require('./balances.controller');
const adminRouter = require('./admin.controller');
const { Router } = require('express');

const router = Router();

router.use('/contracts/', contractsRouter);
router.use('/jobs/', jobsRouter);
router.use('/balances/', balancesRouter);
router.use('/admin/', adminRouter);

module.exports = router