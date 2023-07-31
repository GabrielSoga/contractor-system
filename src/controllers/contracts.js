const { Router } = require('express');
const { Op } = require('sequelize');
const { getProfile } = require('../middleware/profiles')

const router = Router();

// SHORTCUT: This ideally would be a class to enable testing, but we'll get this shortcut
const contractErrorMessage = {
  contractNotFound: (profileIdFromHeader) => ({
    message: "No active contracts found for this profile id",
    profileId: profileIdFromHeader
  })
}

/**
 * @returns contract by id
 *
 * SHORTCUT: Here we're assuming the id parameter is always a valid entry,
 * otherwise we'd have add validation steps
 */
router.get('/:id', getProfile, async (req, res) => {
  const { Contract } = req.app.get('models')
  const { id: contractId } = req.params
  const { id: profileIdFromHeader } = req.profile

  try {
    const contract = await Contract.findOne({
      where: {
        [Op.and]: [
          { id: contractId },
          {
            [Op.or]: [
              { ClientId: profileIdFromHeader },
              { ContractorId: profileIdFromHeader }
            ]
          }
        ]
      }
    })
    if (!contract) {
      return res.status(404)
      .json(contractErrorMessage.contractNotFound(profileIdFromHeader))
      .end()
    }
    res.json(contract)
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: "Internal server error" }).end()
  }
})

/**
* @returns contract all contracts for an user (only non terminated contracts)
* SHORTCUT: Ideally, the terminated keyword should be a Constant declared somewhere in 
* Sequelize ENUM. but we'll take the shortcut and declare it here.
* 
* NOTE: All Non-terminated contracts will be fetched. So whether new status are created,
* we'll be able to retrieve them.
*/
router.get('/', getProfile, async (req, res) => {
  const { Contract } = req.app.get('models')
  const { id: profileIdFromHeader } = req.profile
  const TERMINATED = 'terminated'

  try {
    const contracts = await Contract.findAll({
      where: {
        [Op.and]: [
          { [Op.not]: { status: TERMINATED } },
          {
            [Op.or]: [
              { ClientId: profileIdFromHeader },
              { ContractorId: profileIdFromHeader }
            ]
          }

        ]
      }
    })
    if (!contracts || contracts.length === 0) {
      return res.status(404)
      .json(contractErrorMessage.contractNotFound(profileIdFromHeader))
      .end()
    }
    res.json(contracts)
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: "Internal server error" }).end()
  }
})
module.exports = router;
