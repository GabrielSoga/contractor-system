const { Router } = require('express');
const { Op } = require('sequelize');
const { getProfile } = require('../middleware/getProfile')

const router = Router();

/**
 * @returns contract by id
 */
router.get('/:id', getProfile, async (req, res) => {
  const { Contract } = req.app.get('models')
  const { id: contractId } = req.params
  const { id: profileIdFromHeader } = req.profile

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
  if (!contract) return res.status(404).end()
  res.json(contract)
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
  console.log(contracts)
  if (!contracts || contracts.length === 0) return res.status(404).end()
  res.json(contracts)

})
module.exports = router;