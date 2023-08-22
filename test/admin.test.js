const request = require('supertest');
const app = require('../src/app');

const clientDataStructure = {
  id: expect.any(Number),
  firstName: expect.any(String),
  lastName: expect.any(String),
  totalPaid: expect.any(Number),
}

const adminTests = () => {
  describe('GET /admin/best-profession', () => {
    it('should return the profession that earned the most money for the given time range', async () => {
      const start = "2020-08-14T19:11:26.737"
      const end = "2020-08-16T19:11:26.737"
      const response = await request(app).get(`/admin/best-profession?start=${start}&end=${end}`);
      expect(response.status).toBe(200);
      expect(response.body.profession).toBe('Programmer')
      expect(response.body.totalEarnings).toBe(2683)
    });

    it('should return 404 if no profession with highest earnings is found for the given time range', async () => {
      const start = "2022-08-14T19:11:26.737"
      const end = "2022-08-16T19:11:26.737"
      const response = await request(app).get(`/admin/best-profession?start=${start}&end=${end}`);
      expect(response.status).toBe(404);
      expect(response.body.message).toBe("No highest earning profession found for the given time range")
      expect(response.body.start).toBe(start)
      expect(response.body.end).toBe(end)
    });

    it('should not return 401 if theres no user auth', async () => {
      const start = "2022-08-14T19:11:26.737"
      const end = "2022-08-16T19:11:26.737"
      const response = await request(app).get(`/admin/best-profession?start=${start}&end=${end}`);

      expect(response.status).not.toBe(401);
    });
  });

  describe('GET /admin/best-clients', () => {
    it('should return the clients who paid the most for jobs in the given time range', async () => {
      const start = "2020-08-14T19:11:26.737"
      const end = "2020-08-16T19:11:26.737"
      const response = await request(app).get(`/admin/best-clients?start=${start}&end=${end}`);

      expect(response.status).toBe(200);
      expect(response.body.data).toHaveLength(2)
      expect(response.body.data).toEqual(
        expect.arrayContaining([
          expect.objectContaining(clientDataStructure)
        ])
      )
    });

    it('should return more than 2 clients who paid the most for jobs in the given time range', async () => {
      const start = "2020-08-14T19:11:26.737"
      const end = "2020-08-16T19:11:26.737"
      const limit = "3";
      const response = await request(app).get(`/admin/best-clients?start=${start}&end=${end}&limit=${limit}`);

      expect(response.status).toBe(200);
      expect(response.body.data).toHaveLength(3)
      expect(response.body.data).toEqual(
        expect.arrayContaining([
          expect.objectContaining(clientDataStructure)
        ])
      )
    });

    it('should return 404 if no clients who paid the most are found for the given time range', async () => {
      const start = "2022-08-14T19:11:26.737"
      const end = "2022-08-16T19:11:26.737"
      const response = await request(app).get(`/admin/best-clients?start=${start}&end=${end}`);
      expect(response.status).toBe(404);
      expect(response.body.message).toBe("No highest paying clients found for the given time range")
      expect(response.body.start).toBe(start)
      expect(response.body.end).toBe(end)
    });

    it('should not return 401 if theres no user auth', async () => {
      const start = "2022-08-14T19:11:26.737"
      const end = "2022-08-16T19:11:26.737"
      const response = await request(app).get(`/admin/best-clients?start=${start}&end=${end}`)

      expect(response.status).not.toBe(401);
    });
  });
};

module.exports = adminTests;
