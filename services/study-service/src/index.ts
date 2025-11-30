import express from 'express';
import dotenv from 'dotenv';
import { connectMongo, connectRabbit, closeMongo, closeRabbit, logger } from '@school-sas/shared-lib';
import { Db, ObjectId } from 'mongodb';

dotenv.config();

const PORT = Number(process.env.PORT || 3002);
const MONGODB_URI = process.env.MONGODB_URI || '';
const RABBITMQ_URL = process.env.RABBITMQ_URL || '';

let db: Db | null = null;

async function bootstrap() {
  const app = express();
  app.use(express.json());

  app.get('/healthz', (_req, res) => res.status(200).json({ status: 'ok' }));
  app.get('/readyz', (_req, res) => res.status(200).json({ status: 'ready' }));

  // --- Classes ---
  app.post('/v1/classes', async (req, res) => {
    try {
      const { grade, section } = req.body;
      if (!grade || !section) {
        return res.status(400).json({ error: 'Grade and section are required' });
      }
      const classes = db!.collection('classes');
      const newClass = { grade, section, createdAt: new Date() };
      const result = await classes.insertOne(newClass);
      res.status(201).json({ id: result.insertedId, ...newClass });
    } catch (e) {
      logger.error('class_creation_failed', { err: (e as Error).message });
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  app.get('/v1/classes', async (_req, res) => {
    try {
      const classes = db!.collection('classes');
      const allClasses = await classes.find({}).toArray();
      res.status(200).json(allClasses);
    } catch (e) {
      logger.error('fetch_classes_failed', { err: (e as Error).message });
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  app.get('/v1/classes/:id', (req, res) => res.status(501).json({ error: 'not_implemented', id: req.params.id }));

  // --- Students ---
  app.post('/v1/students', async (req, res) => {
    try {
      const { appId, studentData, classId, grade } = req.body || {};
      if (!studentData || typeof studentData !== 'object') {
        return res.status(400).json({ error: 'studentData_required' });
      }

      const students = db!.collection('students');
      const classes = db!.collection('classes');

      let resolvedClassId: ObjectId | null = null;

      if (classId) {
        resolvedClassId = typeof classId === 'string' ? new ObjectId(classId) : classId;
      } else if (grade) {
        const g = String(grade).trim().toUpperCase();
        // Try to find class by grade
        const cls = await classes.findOne({ grade: g });
        if (cls) {
          resolvedClassId = cls._id as ObjectId;
        } else if (g === 'CLASS 1') {
          // Auto-create default CLASS 1 if not present
          const newClass = { grade: 'CLASS 1', section: 'A', createdAt: new Date() };
          const created = await classes.insertOne(newClass);
          resolvedClassId = created.insertedId as ObjectId;
        } else {
          return res.status(404).json({ error: 'class_not_found_for_grade', grade: g });
        }
      } else {
        // No classId and no grade — default to CLASS 1
        const cls = await classes.findOne({ grade: 'CLASS 1' });
        if (cls) {
          resolvedClassId = cls._id as ObjectId;
        } else {
          const created = await classes.insertOne({ grade: 'CLASS 1', section: 'A', createdAt: new Date() });
          resolvedClassId = created.insertedId as ObjectId;
        }
      }

      const payload: any = {
        classId: resolvedClassId,
        studentData,
        createdAt: new Date(),
      };
      if (appId) payload.appId = typeof appId === 'string' ? new ObjectId(appId) : appId;

      const result = await students.insertOne(payload);
      return res.status(201).json({ id: result.insertedId, ...payload });
    } catch (e) {
      logger.error('student_creation_failed', { err: (e as Error).message });
      return res.status(500).json({ error: 'internal_error' });
    }
  });

  app.get('/v1/students', async (_req, res) => {
    try {
      const students = db!.collection('students');
      const items = await students.find({}).sort({ createdAt: -1 }).toArray();
      return res.status(200).json({ items });
    } catch (e) {
      logger.error('students_list_failed', { err: (e as Error).message });
      return res.status(500).json({ error: 'internal_error' });
    }
  });

  // --- Admin wipe (dangerous; demo only) ---
  app.delete('/v1/admin/wipe', async (_req, res) => {
    try {
      await db!.collection('students').deleteMany({});
      await db!.collection('classes').deleteMany({});
    } catch {}
    return res.status(200).json({ ok: true, wiped: true });
  });

  try {
    if (MONGODB_URI) {
      const conn = await connectMongo(MONGODB_URI);
      db = conn.client.db();
    }
    if (RABBITMQ_URL) await connectRabbit(RABBITMQ_URL);
  } catch (err) {
    logger.error('Startup dependency error', { err: (err as Error).message });
  }

  const server = app.listen(PORT, () => logger.info('Study service started', { port: PORT }));

  const shutdown = async () => {
    logger.info('Shutting down');
    server.close(() => logger.info('HTTP server closed'));
    await closeMongo();
    await closeRabbit();
    process.exit(0);
  };

  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);
}

bootstrap().catch((e) => {
  logger.error('Bootstrap failed', { err: (e as Error).message });
  process.exit(1);
});
