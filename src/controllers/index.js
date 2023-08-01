const contractsRouter = require('./contracts');
const jobsRouter = require('./jobs');
const balancesRouter = require('./balances');
const adminRouter = require('./admin');
const { Router } = require('express');

const router = Router();

//SHORTCUT: Ideally we should use Service/Repository layers
//to improve testing, but we'll implement everything in the Controller layer
router.use('/contracts/', contractsRouter);
router.use('/jobs/', jobsRouter);
router.use('/balances/', balancesRouter);
router.use('/admin/', adminRouter);

module.exports = router