const contractsRouter = require('./contracts');
// const contractsRouter = require('./jobs');
// const contractsRouter = require('./balances');
// const contractsRouter = require('./admin');
const { Router } = require('express');

const router = Router();

router.use('/contracts/', contractsRouter);
// router.use('/jobs/', jobsRouter);
// router.use('/balances/', balancesRouter);
// router.use('/admin/', adminRouter);

module.exports = router