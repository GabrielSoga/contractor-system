const { Router } = require('express');
const Sequelize = require('sequelize');
const { getProfile } = require('../middleware/profiles')
const model = require('../model');
const ContractService = require('../services/contracts.services');

const router = Router();
const contractService = new ContractService(model, Sequelize);

/**
 * @returns contract by id
 *
 * SHORTCUT: Here we're assuming the id parameter is always a valid entry,
 * otherwise we'd have add validation steps
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
* @returns contract all contracts for an user (only non terminated contracts)
* SHORTCUT: Ideally, the terminated keyword should be a Constant declared somewhere in 
* Sequelize ENUM. but we'll take the shortcut and declare it here.
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
