const request = require('supertest');
const app = require('../main');

describe('Express App', () => {
  describe('GET /health', () => {
    it('should return health status', async () => {
      const response = await request(app)
        .get('/health')
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('message');
      expect(response.body).toHaveProperty('timestamp');
      expect(response.body).toHaveProperty('version');
    });
  });

  describe('GET /api', () => {
    it('should return API documentation', async () => {
      const response = await request(app)
        .get('/api')
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('message', 'Scraper Layer API');
      expect(response.body).toHaveProperty('endpoints');
    });
  });

  describe('GET /nonexistent', () => {
    it('should return 404 for non-existent routes', async () => {
      const response = await request(app)
        .get('/nonexistent')
        .expect(404);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toHaveProperty('message');
      expect(response.body.error).toHaveProperty('statusCode', 404);
    });
  });

  describe('POST /api/v1/jobs', () => {
    it('should require authentication', async () => {
      const response = await request(app)
        .post('/api/v1/jobs')
        .send({ url: 'https://example.com' })
        .expect(401);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toHaveProperty('statusCode', 401);
    });

    it('should accept valid API key', async () => {
      // Mock the services to avoid actual AWS calls
      const dynamodb = require('../services/dynamodb');
      const sqs = require('../services/sqs');
      const validator = require('../services/validator');

      validator.validate.mockReturnValue({
        isValid: true,
        data: { url: 'https://example.com', options: {} },
      });

      dynamodb.createJob.mockResolvedValue({ success: true });
      sqs.sendScrapingJob.mockResolvedValue({ success: true, messageId: 'msg-123' });

      const response = await request(app)
        .post('/api/v1/jobs')
        .set('X-API-Key', 'test-api-key-12345678901234567890')
        .send({ url: 'https://example.com' })
        .expect(202);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('data');
      expect(response.body.data).toHaveProperty('jobId');
    });
  });
});
