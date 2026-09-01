import { AppController } from './app.controller.js';

describe('AppController', () => {
  it('returns a healthy service payload', () => {
    const result = new AppController().health();
    expect(result.name).toBe('Solar Inventory Management API');
    expect(result.status).toBe('ok');
    expect(Number.isNaN(Date.parse(result.timestamp))).toBe(false);
  });
});
