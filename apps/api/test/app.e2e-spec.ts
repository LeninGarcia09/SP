import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../src/app.module';

describe('BizOps API (E2E)', () => {
  let app: INestApplication;
  let token: string;
  let userId: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix('api/v1');
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    );
    await app.init();

    // Authenticate via dev-login
    const loginRes = await request(app.getHttpServer())
      .post('/api/v1/auth/dev-login')
      .expect(201);

    token = loginRes.body.data.access_token;
    userId = loginRes.body.data.user.id;
    expect(token).toBeDefined();
    expect(userId).toBeDefined();
  }, 30_000);

  afterAll(async () => {
    await app.close();
  });

  // ─── Auth ──────────────────────────────────────────────

  describe('Auth', () => {
    it('POST /auth/dev-login returns access_token and user', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/v1/auth/dev-login')
        .expect(201);

      expect(res.body.data).toHaveProperty('access_token');
      expect(res.body.data.user).toHaveProperty('email', 'dev@bizops.local');
      expect(res.body.data.user).toHaveProperty('role');
    });

    it('GET /projects returns 401 without token', async () => {
      await request(app.getHttpServer())
        .get('/api/v1/projects')
        .expect(401);
    });
  });

  // ─── System Health ─────────────────────────────────────

  describe('System Health', () => {
    it('GET /system/health returns healthy status', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/v1/system/health')
        .expect(200);

      expect(res.body.status).toBe('healthy');
      expect(res.body.checks.database).toBe('ok');
      expect(res.body).toHaveProperty('uptime');
      expect(res.body).toHaveProperty('timestamp');
    });
  });

  // ─── Projects CRUD ─────────────────────────────────────

  describe('Projects', () => {
    let projectId: string;

    it('POST /projects creates a project', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/v1/projects')
        .set('Authorization', `Bearer ${token}`)
        .send({
          name: 'E2E Test Project',
          description: 'Created by E2E test',
          status: 'PLANNING',
          startDate: '2026-01-01',
          endDate: '2026-12-31',
          budget: 50000,
          projectLeadId: userId,
        })
        .expect(201);

      expect(res.body.data).toHaveProperty('id');
      expect(res.body.data.name).toBe('E2E Test Project');
      projectId = res.body.data.id;
    });

    it('GET /projects returns paginated list', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/v1/projects')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(res.body.data).toBeInstanceOf(Array);
      expect(res.body.meta).toHaveProperty('total');
      expect(res.body.meta).toHaveProperty('page');
    });

    it('GET /projects/:id returns a single project', async () => {
      const res = await request(app.getHttpServer())
        .get(`/api/v1/projects/${projectId}`)
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(res.body.data.id).toBe(projectId);
      expect(res.body.data.name).toBe('E2E Test Project');
    });

    it('PATCH /projects/:id updates a project', async () => {
      const res = await request(app.getHttpServer())
        .patch(`/api/v1/projects/${projectId}`)
        .set('Authorization', `Bearer ${token}`)
        .send({ name: 'E2E Updated Project' })
        .expect(200);

      expect(res.body.data.name).toBe('E2E Updated Project');
    });

    it('DELETE /projects/:id soft-deletes a project', async () => {
      await request(app.getHttpServer())
        .delete(`/api/v1/projects/${projectId}`)
        .set('Authorization', `Bearer ${token}`)
        .expect(200);
    });
  });

  // ─── Tasks ─────────────────────────────────────────────

  describe('Tasks', () => {
    let projectId: string;
    let taskId: string;

    beforeAll(async () => {
      // Create a project for task tests
      const res = await request(app.getHttpServer())
        .post('/api/v1/projects')
        .set('Authorization', `Bearer ${token}`)
        .send({
          name: 'Task Test Project',
          description: 'Project for task E2E tests',
          status: 'ACTIVE',
          startDate: '2026-01-01',
          endDate: '2026-12-31',
          budget: 10000,
          projectLeadId: userId,
        })
        .expect(201);

      projectId = res.body.data.id;
    });

    it('POST /projects/:projectId/tasks creates a task', async () => {
      const res = await request(app.getHttpServer())
        .post(`/api/v1/projects/${projectId}/tasks`)
        .set('Authorization', `Bearer ${token}`)
        .send({
          title: 'E2E Test Task',
          description: 'Created by E2E test',
          status: 'TODO',
          priority: 'HIGH',
          dueDate: '2026-06-30',
        })
        .expect(201);

      expect(res.body.data).toHaveProperty('id');
      expect(res.body.data.title).toBe('E2E Test Task');
      taskId = res.body.data.id;
    });

    it('GET /projects/:projectId/tasks returns task list', async () => {
      const res = await request(app.getHttpServer())
        .get(`/api/v1/projects/${projectId}/tasks`)
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(res.body.data).toBeInstanceOf(Array);
      expect(res.body.data.length).toBeGreaterThanOrEqual(1);
    });

    it('PATCH /projects/:projectId/tasks/:id updates task status', async () => {
      const res = await request(app.getHttpServer())
        .patch(`/api/v1/projects/${projectId}/tasks/${taskId}`)
        .set('Authorization', `Bearer ${token}`)
        .send({ status: 'IN_PROGRESS' })
        .expect(200);

      expect(res.body.data.status).toBe('IN_PROGRESS');
    });
  });

  // ─── Users ─────────────────────────────────────────────

  describe('Users', () => {
    it('GET /users returns a list that includes the dev user', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/v1/users')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(res.body.data).toBeInstanceOf(Array);
      const devUser = res.body.data.find((u: { email: string }) => u.email === 'dev@bizops.local');
      expect(devUser).toBeDefined();
    });
  });

  // ─── Inventory ─────────────────────────────────────────

  describe('Inventory', () => {
    let itemId: string;

    it('POST /inventory creates an item', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/v1/inventory')
        .set('Authorization', `Bearer ${token}`)
        .send({
          sku: `E2E-SKU-${Date.now()}`,
          name: 'E2E Test Item',
          category: 'TOOL_EQUIPMENT',
        })
        .expect(201);

      expect(res.body.data).toHaveProperty('id');
      itemId = res.body.data.id;
    });

    it('GET /inventory returns paginated list', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/v1/inventory')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(res.body.data).toBeInstanceOf(Array);
    });
  });

  // ─── Validation ────────────────────────────────────────

  describe('Validation', () => {
    it('rejects invalid body with 400', async () => {
      await request(app.getHttpServer())
        .post('/api/v1/projects')
        .set('Authorization', `Bearer ${token}`)
        .send({ name: '' }) // missing required fields
        .expect(400);
    });

    it('rejects invalid UUID in path with 400', async () => {
      await request(app.getHttpServer())
        .get('/api/v1/projects/not-a-uuid')
        .set('Authorization', `Bearer ${token}`)
        .expect(400);
    });
  });
});
