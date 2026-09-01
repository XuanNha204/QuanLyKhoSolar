import assert from 'node:assert/strict';
import { after, before, test } from 'node:test';
import { NestFactory } from '@nestjs/core';
import request from 'supertest';
import { AppModule } from '../dist/app.module.js';

let app;
before(async () => {
  app = await NestFactory.create(AppModule, { logger: false });
  await app.init();
});
after(async () => {
  await app.close();
});

test('GET / returns backend health', async () => {
  const response = await request(app.getHttpServer()).get('/').expect(200);
  assert.equal(response.body.name, 'Solar Inventory Management API');
  assert.equal(response.body.status, 'ok');
});
