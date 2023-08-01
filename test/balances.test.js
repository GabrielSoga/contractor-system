const request = require('supertest');
const app = require('../src/app');

const balancesTests = () => {
  describe('POST /balances/deposit/:userId', () => {
    it('should successfully deposit money into the client balance', async () => {
      const amountToDeposit = 100;
      const clientProfileId = 2
      const response = await request(app)
        .post(`/balances/deposit/${clientProfileId}?amount=${amountToDeposit}`)
        .set('profile_id', clientProfileId)
        .expect(200)

      expect(response.body.message).toBe('Deposit successful');
    });

    it('should return 400 if trying to deposit more than 25% of the total jobs to pay', async () => {
      const amountToDeposit = 101;
      const clientProfileId = 2
      const response = await request(app)
        .post(`/balances/deposit/${clientProfileId}?amount=${amountToDeposit}`)
        .set('profile_id', clientProfileId)
        .expect(400);

      // Add your assertions here based on the response
      expect(response.body.message).toBe(`Invalid deposit. Can't deposit more than 25% of the total of jobs to pay.`);
    });

    it('should return 400 if trying to deposit to another user account', async () => {
      const amountToDeposit = 50;
      const clientProfileId = 2
      const response = await request(app)
        .post(`/balances/deposit/${clientProfileId}?amount=${amountToDeposit}`)
        .set('profile_id', 3)
        .expect(400);

      expect(response.body.message).toBe('You can only deposit to your own account.');
    });

    it('should return 404 if no active contracts found for the authenticated user', async () => {
      const amountToDeposit = 50;
      const clientProfileId = 10
      const response = await request(app)
        .post(`/balances/deposit/${clientProfileId}?amount=${amountToDeposit}`)
        .set('profile_id', clientProfileId)
        .expect(404);

      expect(response.body.message).toBe('No active contracts found for this profile id');
    });

    it('should return 401 if theres no user auth', async () => {
      await request(app)
        .get('/jobs/unpaid')
        .expect(401);
    });
  });
};

module.exports = balancesTests