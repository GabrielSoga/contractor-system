class AdminService {

  constructor(model, sequelize) {
    this.model = model;
    this.sequelize = sequelize;
  }

  // Error Messages
  bestProfessionNotFound(start, end) {
    return {
      message: "No highest earning profession found for the given time range",
      start,
      end
    }
  }

  bestClientsNotFound(start, end) {
    return {
      message: "No highest paying clients found for the given time range",
      start,
      end
    }
  }

  requestFail() {
    return {
      message: "Your request couldn't be completed"
    }
  }

  /**
   * Business logic for GET '/admin/best-profession/' route.
   * @returns 
   * Returns the profession that earned the most money (sum of jobs paid)
   * for any contactor that worked in the query time range (e.g. 2023-07-30T08:00 to 2023-07-31T08:00).
   * 
   * NOTE: The problem statement is not clear whether the query time period
   * should be by contract creation date or job payment date. We're assuming
   * it's the latter.
  */
  async getBestProfession({ start, end }) {
    try {
      const professionWithHighestEarnings = await this.model.Profile.findAll({
        attributes: [
          'profession',
          [this.sequelize.fn('SUM', this.sequelize.col('Contractor->Jobs.price')), 'totalEarnings'],
        ],
        include: [
          {
            model: this.model.Contract,
            as: 'Contractor',
            attributes: [],
            include: {
              model: this.model.Job,
              attributes: [],
              where: {
                paid: true,
                paymentDate: {
                  [this.sequelize.Op.between]: [start, end],
                },
              },
            },
          },
        ],
        group: ['profession'],
        order: [[this.sequelize.literal('totalEarnings'), 'DESC']],
        limit: 1,
        subQuery: false
      });

      const professionWithHighestEarningsData = professionWithHighestEarnings[0]?.dataValues;
      const profession = professionWithHighestEarningsData?.profession;
      const totalEarnings = professionWithHighestEarningsData?.totalEarnings;

      if (!profession || !totalEarnings) {
        return {
          status: 404,
          body: this.bestProfessionNotFound(start, end)
        }
      }

      return {
        status: 200,
        body: {
          profession,
          totalEarnings
        }
      }
    } catch (e) {
      console.error(e)
      return {
        status: 500,
        body: this.requestFail()
      }
    }
  }

  /**
   * Business logic for GET '/admin/best-clients/' route
   * @returns returns the clients the paid the most for jobs in the query time period 
   * (e.g. 2023-07-30T08:00 to 2023-07-31T08:00).
   * Limit query parameter should be applied, default limit is 2.
   *
   * NOTE: The problem statement is not clear whether the query time period
   * should be by contract creation date or job payment date. We're assuming
   * it's the latter.
  */
  async getBestClients({ start, end, limit }) {
    try {
      const clientsPaidMost = await this.model.Profile.findAll({
        attributes: [
          'id',
          [this.sequelize.literal("firstName ||' '|| lastName"), 'fullName'],
          [this.sequelize.fn('SUM', this.sequelize.col('Client->Jobs.price')), 'totalPaid'],
        ],
        include: [
          {
            model: this.model.Contract,
            as: 'Client',
            attributes: [],
            include: {
              model: this.model.Job,
              as: 'Jobs',
              attributes: [],
              where: {
                paid: true,
                paymentDate: {
                  [this.sequelize.Op.between]: [start, end],
                },
              },
            },
          },
        ],
        group: ['Profile.id'],
        order: [[this.sequelize.literal('totalPaid'), 'DESC']],
        having: this.sequelize.literal('totalPaid IS NOT NULL'),
        limit,
        subQuery: false
      });

      const clientsPaidMostData = clientsPaidMost.map((client) => client.dataValues);
      if (!clientsPaidMostData || clientsPaidMostData.length === 0) {
        return {
          status: 404,
          body: this.bestClientsNotFound(start, end)
        }
      }
      return {
        status: 200,
        body: { data: clientsPaidMostData }
      }
    } catch (e) {
      console.error(e)
      return {
        status: 500,
        body: this.requestFail()
      }
    }
  }
}

module.exports = AdminService;
