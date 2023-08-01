const request = require('supertest');
const app = require('../src/app');

const contractDataStructure = {
  id: expect.any(Number),
  terms: expect.any(String),
  status: expect.any(String),
  createdAt: expect.any(String),
  updatedAt: expect.any(String),
  ContractorId: expect.any(Number),
  ClientId: expect.any(Number)
}

const contractsTests = () => {
  describe('GET /contracts/:id', () => {
    it('should return a contract by id if it belongs to the client', async () => {
      const clientProfileId = 1;
      const contractId = 1;
      const response = await request(app).get(`/contracts/${contractId}`).set('profile_id', clientProfileId);

      expect(response.status).toBe(200);
      expect(response.body).toEqual(
        expect.objectContaining(contractDataStructure)
      )
    });

    it('should return 404 error if no contract is found', async () => {
      const clientProfileId = 2
      const contractId = 15;
      const response = await request(app).get(`/contracts/${contractId}`).set('profile_id', clientProfileId);

      expect(response.status).toBe(404);
      expect(response.body.message).toBe("No active contracts found for this profile id")
      expect(response.body.profileId).toBe(clientProfileId)
    });

    it('should return 401 if theres no user auth', async () => {
      await request(app)
        .get('/jobs/unpaid')
        .expect(401);
    });
  });

  describe('GET /contracts', () => {
    it('should return all non-terminated contracts for the client', async () => {
      const clientProfileId = 2
      const response = await request(app).get('/contracts').set('profile_id', clientProfileId);

      expect(response.status).toBe(200);
      expect(response.body.data).toHaveLength(2);
      expect(response.body.data).toEqual(
        expect.arrayContaining([
          expect.objectContaining(contractDataStructure)
        ])
      )
    });

    it('should return 404 error if no non-terminated contracts for the client', async () => {
      const clientProfileId = 9
      const response = await request(app).get('/contracts').set('profile_id', clientProfileId);

      expect(response.status).toBe(404);
      expect(response.body.message).toBe("No active contracts found for this profile id")
      expect(response.body.profileId).toBe(clientProfileId)
    });

    it('should return 401 if theres no user auth', async () => {
      await request(app)
        .get('/jobs/unpaid')
        .expect(401);
    });
  });
};

module.exports = contractsTests;
