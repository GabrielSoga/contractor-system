const { Router } = require('express');
const { Op } = require('sequelize');

const router = Router();

const adminErrorMessage = {
  bestProfessionNotFound: (start, end) => ({
    message: "No highest earning profession found for the given time range",
    start,
    end
  }),
  bestClientsNotFound: (start, end) => ({
    message: "No highest paying clients found for the given time range",
    start,
    end
  }),
}

/**
 * @returns Returns the profession that earned the most money (sum of jobs paid)
 * for any contactor that worked in the query time range (e.g. 2023-07-30T08:00 to 2023-07-31T08:00).
 *
 * SHORTCUT: We're assuming the timestamps will always be present and come in 
 * a valid format, otherwise we'd have to add a validation middleware.
 *
 * SHORTCUT: As an admin endpoint, this should be behind a VPC to be authorized
 * through VPN. We'll be skipping any auth steps for the sake of simplicity.
 *
 * NOTE: The problem statement is not clear whether the query time period
 * should be by contract creation date or job payment date. We're assuming
 * it's the latter.
 */
router.get('/best-profession', async (req, res) => {
  const { start, end } = req.query;
  const { Contract, Job, Profile } = req.app.get('models')
  const sequelize = req.app.get('sequelize')

  try {
    const professionWithHighestEarnings = await Profile.findAll({
      attributes: [
        'profession',
        [sequelize.fn('SUM', sequelize.col('Contractor->Jobs.price')), 'totalEarnings'],
      ],
      include: [
        {
          model: Contract,
          as: 'Contractor',
          attributes: [],
          include: {
            model: Job,
            attributes: [],
            where: {
              paid: true,
              paymentDate: {
                [Op.between]: [start, end],
              },
            },
          },
        },
      ],
      group: ['profession'],
      order: [[sequelize.literal('totalEarnings'), 'DESC']],
      limit: 1,
      subQuery: false
    });

    const professionWithHighestEarningsData = professionWithHighestEarnings[0]?.dataValues;
    const profession = professionWithHighestEarningsData?.profession;
    const totalEarnings = professionWithHighestEarningsData?.totalEarnings;

    if (!profession || !totalEarnings) {
      return res
        .status(404)
        .json(adminErrorMessage.bestProfessionNotFound(start, end))
        .end()
    }

    return res
      .status(200)
      .json({
        profession,
        totalEarnings
      })
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: "Internal server error" }).end()
  }
})

/**
 * @returns returns the clients the paid the most for jobs in the query time period 
 * (e.g. 2023-07-30T08:00 to 2023-07-31T08:00).
 * Limit query parameter should be applied, default limit is 2.
 *
 * SHORTCUT: We're assuming the timestamps will always be present and come in 
 * a valid format, otherwise we'd have to add a validation middleware.
 *
 * SHORTCUT: As an admin endpoint, this should be behind a VPC to be authorized
 * through VPN. We'll be skipping any auth steps for the sake of simplicity.
 *
 * NOTE: The problem statement is not clear whether the query time period
 * should be by contract creation date or job payment date. We're assuming
 * it's the latter.
 */
router.get('/best-clients', async (req, res) => {
  const { start, end, limit = 2 } = req.query;
  const { Contract, Job, Profile } = req.app.get('models')
  const sequelize = req.app.get('sequelize')

  try {
    const clientsPaidMost = await Profile.findAll({
      attributes: [
        'id',
        'firstName',
        'lastName',
        [sequelize.fn('SUM', sequelize.col('Client->Jobs.price')), 'totalPaid'],
      ],
      include: [
        {
          model: Contract,
          as: 'Client',
          attributes: [],
          include: {
            model: Job,
            as: 'Jobs',
            attributes: [],
            where: {
              paid: true,
              paymentDate: {
                [Op.between]: [start, end],
              },
            },
          },
        },
      ],
      group: ['Profile.id'],
      order: [[sequelize.literal('totalPaid'), 'DESC']],
      having: sequelize.literal('totalPaid IS NOT NULL'),
      limit,
      subQuery: false
    });

    const clientsPaidMostData = clientsPaidMost.map((client) => client.dataValues);
    if (!clientsPaidMostData || clientsPaidMostData.length === 0) {
      return res
        .status(404)
        .json(adminErrorMessage.bestClientsNotFound(start, end))
        .end()
    }
    res.status(200).json({ data: clientsPaidMostData })
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: "Internal server error" }).end()
  }
})

module.exports = router;