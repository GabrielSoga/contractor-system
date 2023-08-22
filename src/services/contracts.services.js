class ContractService {

  constructor(model, sequelize) {
    this.model = model;
    this.sequelize = sequelize;
    this.TERMINATED = 'terminated';
  }

  // Error Messages
  contractNotFound(profileIdFromHeader) {
    return {
      message: "No active contracts found for this profile id",
      profileId: profileIdFromHeader
    }
  }

  requestFail() {
    return {
      message: "Your request couldn't be completed"
    }
  }

  /**
   * Business logic for GET /contract/:id route.
   * @returns contract by id
   *
   * SHORTCUT: Here we're assuming the id parameter is always a valid entry,
   * otherwise we'd have add validation steps
  */
  async getContractById(contractId, profileId) {
    try {
      const contract = await this.model.Contract.findOne({
        where: {
          [this.sequelize.Op.and]: [
            { id: contractId },
            {
              [this.sequelize.Op.or]: [
                { ClientId: profileId },
                { ContractorId: profileId }
              ]
            }
          ]
        }
      })
      if (!contract) {
        return {
          status: 404,
          body: this.contractNotFound(profileId)
        }
      }

      return {
        status: 200,
        body: { data: contract }
      }
    } catch (e) {
      console.error(e);
      return {
        status: 500,
        body: this.requestFail()
      }
    }
  }

  /**
  * Business logic for GET '/contracts/' route.
  * @returns contract all contracts for an user (only non terminated contracts)
  * 
  * NOTE: All Non-terminated contracts will be fetched. So whether new status are created,
  * we'll be able to retrieve them.
  */
  async getAllContractsByUser(profileId) {
    try {
      const contracts = await this.model.Contract.findAll({
        where: {
          [this.sequelize.Op.and]: [
            { [this.sequelize.Op.not]: { status: this.TERMINATED } },
            {
              [this.sequelize.Op.or]: [
                { ClientId: profileId },
                { ContractorId: profileId }
              ]
            }

          ]
        }
      })
      if (!contracts || contracts.length === 0) {
        return {
          status: 404,
          body: this.contractNotFound(profileId)
        }
      }
      return {
        status: 200,
        body: { data: contracts }
      }
    } catch (e) {
      console.error(e);
      return {
        status: 500,
        body: this.requestFail()
      }
    }
  }
}

module.exports = ContractService;
