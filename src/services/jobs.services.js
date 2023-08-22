class JobsService {
  constructor(model, sequelize) {
    this.model = model;
    this.sequelize = sequelize
    this.IN_PROGRESS = 'in_progress';
    this.BALANCE_FIELD = 'balance';
  }

  // Error Messages
  contractNotFound(profileIdFromHeader) {
    return {
      message: "No active contracts found for this profile id",
      profileId: profileIdFromHeader
    }
  }

  jobsContractNotFound(profileIdFromHeader) {
    return {
      message: "No active contracts or unpaid jobs found for this profile id",
      profileId: profileIdFromHeader
    }
  }

  unpaidJobsNotFound(profileIdFromHeader) {
    return {
      message: `No unpaid jobs found for this profile id`,
      profileId: profileIdFromHeader
    }
  }

  jobNotFound(jobId, clientIdFromHeader) {
    return {
      message: `JobId not found for this client`,
      jobId: jobId,
      clientId: clientIdFromHeader
    }
  }

  notEnoughBalance(balance, price) {
    return {
      message: `Not enough balance`,
      currentBalance: balance,
      minimumBalance: price
    }
  }

  requestFail() {
    return {
      message: "Your request couldn't be completed"
    }
  }

  /**
   * Business logic for GET '/jobs/unpaid/' route.
   * @returns unpaid jobs for an user (contractor or client) in active contracts.
  */
  async getUnpaidJobs(id) {
    try {
      const contracts = await this.model.Contract.findAll({
        where: {
          [this.sequelize.Op.and]: [
            { status: this.IN_PROGRESS },
            {
              [this.sequelize.Op.or]: [
                { ClientId: id },
                { ContractorId: id },
              ],
            },
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
          body: this.jobsContractNotFound(id)
        }
      }

      const unpaidJobs = contracts.reduce((jobs, contract) => {
        return jobs.concat(contract.Jobs.map((job) => job.dataValues));
      }, []);

      if (!unpaidJobs || unpaidJobs.length === 0) {
        return {
          status: 404,
          body: this.unpaidJobsNotFound(id)
        }
      }

      return {
        status: 200,
        body: { data: unpaidJobs }
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
   * Business logic for POST '/jobs/:job_id/pay' route.
   * @returns Pay for a job, a client can only pay if his balance >= the amount to pay.
   * The amount should be moved from the client's balance to the contractor balance.
   *
   * NOTE: We're applying a transaction to ensure the balance/jobs update will always happen together
  */
  async payForJob(jobId, clientId) {
    try {
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
            where: { id: jobId }
          },
          {
            model: this.model.Profile,
            as: 'Client'
          },
          {
            model: this.model.Profile,
            as: 'Contractor'
          }
        ]
      });

      if (!contracts || contracts.length === 0) {
        return {
          status: 404,
          body: this.contractNotFound(clientId)
        }
      }

      const [targetJob] = contracts[0].Jobs
      const targetClient = contracts[0].Client
      const targetContractor = contracts[0].Contractor

      if (!targetJob) {
        return {
          status: 404,
          body: this.jobNotFound(jobId, clientIdFromHeader)
        }
      }

      if (targetClient.balance < targetJob.price) {
        return {
          status: 400,
          body: this.notEnoughBalance(targetClient.balance, targetJob.price)
        }
      }

      await this.model.sequelize.transaction(async (t) => {
        try {
          await this.model.Profile.decrement(
            this.BALANCE_FIELD,
            { by: targetJob.price, where: { id: targetClient.id } },
            { transaction: t }
          )
          await this.model.Profile.increment(
            this.BALANCE_FIELD,
            { by: targetJob.price, where: { id: targetContractor.id } },
            { transaction: t }
          )
          await this.model.Job.update(
            { paid: true, paymentDate: new Date() },
            { where: { id: targetJob.id } },
            { transaction: t }
          )
        } catch (e) {
          console.error(e);
          return {
            status: 500,
            body: { message: "Transaction failed" }
          }
        }
      })

      return {
        status: 200,
        body: { message: "Payment successful" }
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

module.exports = JobsService;
