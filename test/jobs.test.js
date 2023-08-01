const request = require('supertest');
const app = require('../src/app');

const jobDataStructure = {
  id: expect.any(Number),
  description: expect.any(String),
  price: expect.any(Number),
  createdAt: expect.any(String),
  updatedAt: expect.any(String),
  ContractId: expect.any(Number),
};

const jobsTests = () => {
  describe('GET /jobs/unpaid', () => {
    it('should return unpaid jobs for the authenticated user', async () => {
      const profileId = 2;
      const response = await request(app)
        .get('/jobs/unpaid')
        .set('profile_id', profileId)

      expect(response.status).toBe(200);
      expect(response.body.data).toHaveLength(2);
      expect(response.body.data).toEqual(
        expect.arrayContaining([
          expect.objectContaining(jobDataStructure)
        ])
      )
    });

    it('should return 404 if no active contracts were found for the authenticated user', async () => {
      const profileId = 9;
      const response = await request(app)
        .get('/jobs/unpaid')
        .set('profile_id', profileId)

      expect(response.status).toBe(404);
      expect(response.body.message).toBe("No active contracts or unpaid jobs found for this profile id");
      expect(response.body.profileId).toBe(profileId)
    });

    it('should return 404 if no unpaid jobs were found for the authenticated user', async () => {
      const profileId = 11;
      const response = await request(app)
        .get('/jobs/unpaid')
        .set('profile_id', profileId)

      expect(response.status).toBe(404);
      expect(response.body.message).toBe("No active contracts or unpaid jobs found for this profile id");
      expect(response.body.profileId).toBe(profileId)
    });

    it('should return 401 if theres no user auth', async () => {
      await request(app)
        .get('/jobs/unpaid')
        .expect(401);
    });
  });

  describe('POST /jobs/:job_id/pay', () => {
    it('should successfully pay for a job', async () => {
      const jobIdToPay = 3;
      const profileId = 2;
      const response = await request(app)
        .post(`/jobs/${jobIdToPay}/pay`)
        .set('profile_id', profileId)

      expect(response.status).toBe(200);
      expect(response.body.message).toBe('Payment successful');
    });

    it('should return 404 if the specified job not found for the authenticated user', async () => {
      const jobIdToPay = 3;
      const profileId = 4;
      const response = await request(app)
        .post(`/jobs/${jobIdToPay}/pay`)
        .set('profile_id', profileId)

      expect(response.status).toBe(404);
      expect(response.body.message).toBe('No active contracts found for this profile id');
      expect(response.body.profileId).toBe(profileId)
    });

    it('should return 400 if the client does not have enough balance to pay for the job', async () => {
      const jobIdToPay = 3;
      const response = await request(app)
        .post(`/jobs/${jobIdToPay}/pay`)
        .set('profile_id', 2)

      expect(response.status).toBe(400);
      expect(response.body.message).toBe('Not enough balance');
      expect(response.body).toHaveProperty('currentBalance');
      expect(response.body).toHaveProperty('minimumBalance');
    });

    it('should return 401 if theres no user auth', async () => {
      await request(app)
        .get('/jobs/unpaid')
        .expect(401);
    });
  });
};

module.exports = jobsTests;
