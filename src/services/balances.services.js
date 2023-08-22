class BalancesService {

  constructor(model, sequelize) {
    this.model = model;
    this.sequelize = sequelize;
    this.IN_PROGRESS = 'in_progress';
    this.BALANCE_FIELD = 'balance';
    this.DEPOSIT_MAX_PERCENTAGE = 0.25;
  }

  // Error Messages
  invalidUser(yourId, userIdToDeposit) {
    return {
      message: "You can only deposit to your own account.",
      yourId,
      userIdToDeposit
    }
  }

  contractNotFound(profileIdFromHeader) {
    return {
      message: "No active contracts found for this profile id",
      profileId: profileIdFromHeader
    }
  }

  invalidDeposit(totalOfJobsToPay, maxDeposit, currentDeposit) {
    return {
      message: "Invalid deposit. Can't deposit more than 25% of the total of jobs to pay.",
      totalOfJobsToPay,
      maxDeposit,
      currentDeposit
    }
  }

  requestFail() {
    return {
      message: "Your request couldn't be completed"
    }
  }

  /**
   * Business logic for POST '/balances/deposit/:userId' route.
   * @returns Deposits money into the balance of a client, a client
   * can't deposit more than 25% his total of jobs to pay (at the deposit moment).
   *
   * NOTE: This problem statement is lacking information regarding how to
   * express the amount to be deposit in the request. We'll assume it's in the QueryStrings
   * (parameter: amount) so the path remains unchanged.
   *
   * PERSONAL NOTE: The constraint for not being able to deposit more than 25% of his total
   * of jobs to pay doesn't make sense for me in a product perspective, but will be added
   * for the sake of the test.
   */
  async depositToClient(clientId, userId, amount) {
    try {
      if (parseInt(clientId) !== parseInt(userId)) {
        return {
          status: 400,
          body: this.invalidUser(clientId, userId)
        }
      }

      const contracts = await this.model.Contract.findAll({
        where: {
          [this.sequelize.Op.and]: [
            { status: this.IN_PROGRESS },
            { ClientId: clientId },
          ],
        },
        include: [
          {
            model: this.model.Job,
            where: {
              [this.sequelize.Op.or]: [
                { paid: false },
                { paid: null }
              ]
            }
          }
        ]
      });

      if (!contracts || contracts.length === 0) {
        return {
          status: 404,
          body: this.contractNotFound(clientId)
        }
      }

      const totalFromQuery = contracts.reduce((total, contract) => {
        return total + contract.Jobs.reduce((jobsTotal, job) => jobsTotal + job.dataValues.price, 0);
      }, 0);

      const totalOfJobsToPay = Number(totalFromQuery)
      const maxDeposit = totalOfJobsToPay * this.DEPOSIT_MAX_PERCENTAGE;
      const currentDeposit = Number(amount);
      if (currentDeposit > maxDeposit) {
        return {
          status: 400,
          body: this.invalidDeposit(totalOfJobsToPay, maxDeposit, currentDeposit)
        }
      }

      await this.model.Profile.increment(
        this.BALANCE_FIELD,
        {
          by: currentDeposit,
          where: { id: userId }
        }
      )

      return {
        status: 200,
        body: { message: "Deposit successful" }
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

module.exports = BalancesService;
