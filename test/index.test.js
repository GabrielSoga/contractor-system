const contractsTests = require('./contracts.test')
const adminTests = require('./admin.test')
const balancesTests = require('./balances.test')
const jobsTests = require('./jobs.test')

// SHORTCUT: Tests should ideally mock DB data, but we'll use seed data here
// SHORTCUT: We'll only test Controllers, but ideally we should test Service/Repository layers as well
describe('Contracts API', contractsTests)
describe('Admin API', adminTests)
describe('Balances API', balancesTests)
describe('Jobs API', jobsTests)