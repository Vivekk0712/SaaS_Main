import express from 'express'
import dotenv from 'dotenv'
import { connectMongo, connectRabbit, closeMongo, closeRabbit, logger } from '@school-sas/shared-lib'
import { Db, ObjectId } from 'mongodb'
import cors from 'cors'
import { gradeToSAS } from './grade'

dotenv.config()

const PORT = Number(process.env.PORT || 3005)
const MONGODB_URI = process.env.MONGODB_URI || ''
const RABBITMQ_URL = process.env.RABBITMQ_URL || ''

let db: Db | null = null

async function bootstrap() {
  const app = express()
  app.use(cors())
  app.use(express.json({ limit: '2mb' }))

  app.get('/healthz', (_req, res) => res.status(200).json({ status: 'ok' }))
  app.get('/readyz', (_req, res) => res.status(200).json({ status: 'ready' }))

  // Public: Parent signup/login (simple password auth; demo only)
  app.post('/v1/onboarding/public/signup', async (req, res) => {
    try {
      const { phone, parentName, password } = req.body || {}
      if (!phone || !parentName || !password) return res.status(400).json({ error: 'missing_fields' })
      const parents = db!.collection('parents')
      const exists = await parents.findOne({ phone })
      if (exists) return res.status(200).json({ ok: true, next: 'login' })
      await parents.insertOne({ phone, parentName, password, createdAt: new Date() })
      return res.status(200).json({ ok: true, next: 'login' })
    } catch (e) {
      logger.error('signup_failed', { err: (e as Error).message })
      return res.status(500).json({ error: 'internal_error' })
    }
  })
  app.post('/v1/onboarding/public/login', async (req, res) => {
    try {
      const { phone, password } = req.body || {}
      if (!phone || !password) return res.status(400).json({ error: 'missing_fields' })
      const parents = db!.collection('parents')
      const p = await parents.findOne({ phone, password })
      if (!p) return res.status(401).json({ error: 'invalid_credentials' })
      return res.status(200).json({ ok: true })
    } catch (e) {
      logger.error('login_failed', { err: (e as Error).message })
      return res.status(500).json({ error: 'internal_error' })
    }
  })

  // Applications
  app.post('/v1/onboarding/applications', async (req, res) => {
    try {
      const { application } = req.body || {}
      const parentPhone = req.header('x-parent-phone') || ''
      if (!parentPhone || !application) return res.status(400).json({ error: 'missing_fields' })
      const apps = db!.collection('applications')
      const doc = { parentPhone, data: application, status: 'submitted', createdAt: new Date() }
      const r = await apps.insertOne(doc)
      return res.status(200).json({ ok: true, id: r.insertedId, status: 'submitted' })
    } catch (e) {
      logger.error('app_submit_failed', { err: (e as Error).message })
      return res.status(500).json({ error: 'internal_error' })
    }
  })
  app.get('/v1/onboarding/applications/:id', async (req, res) => {
    try {
      const appDoc = await db!.collection('applications').findOne({ _id: new ObjectId(req.params.id) })
      if (!appDoc) return res.status(404).json({ error: 'not_found' })
      return res.status(200).json(appDoc)
    } catch (e) { return res.status(400).json({ error: 'bad_request' }) }
  })

  // Staff auth middleware (very basic for demo)
  function requireAnyStaff(roles: Array<'admissions'|'principal'|'accountant'>) {
    return (req: express.Request, res: express.Response, next: express.NextFunction) => {
      const pass = req.header('x-password')
      const r = (req.header('x-role') || '').toLowerCase() as any
      if (pass !== '12345' || !roles.includes(r)) return res.status(401).json({ error: 'unauthorized' })
      next()
    }
  }
  function requireStaff(role: 'admissions'|'principal'|'accountant') {
    return (req: express.Request, res: express.Response, next: express.NextFunction) => {
      const pass = req.header('x-password')
      const r = (req.header('x-role') || '').toLowerCase() as any
      if (pass !== '12345' || r !== role) return res.status(401).json({ error: 'unauthorized' })
      next()
    }
  }

  // Admissions: list and confirm
  app.get('/v1/onboarding/staff/applications', requireAnyStaff(['admissions','principal']), async (req, res) => {
    const status = String(req.query.status || 'submitted')
    const apps = await db!.collection('applications').find({ status }).sort({ createdAt: -1 }).toArray()
    return res.status(200).json({ items: apps })
  })
  app.post('/v1/onboarding/staff/applications/:id/confirm', requireAnyStaff(['admissions','principal']), async (req, res) => {
    const id = req.params.id;
    const applications = db!.collection('applications');
    const application = await applications.findOne({ _id: new ObjectId(id) });

    if (!application) {
      return res.status(404).json({ error: 'Application not found' });
    }

    await applications.updateOne({ _id: new ObjectId(id) }, { $set: { status: 'admissions_confirmed', confirmedAt: new Date() } });

    // Create the student directly in SAS (study-service), defaulting to CLASS 1 when needed
    try {
      const grade = application.data?.admission?.grade;
      const sasGrade = gradeToSAS(grade || '');
      const studyApiUrl = process.env.STUDY_API_URL || 'http://localhost:3002';

      const admissionData = application.data?.admission || {};
      const studentData = {
        ...application.data?.student,
        roll: admissionData.roll || '',
        section: admissionData.section || '',
        grade: sasGrade || 'CLASS 1',
      };

      const resp = await fetch(`${studyApiUrl}/v1/students`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ appId: String(application._id), studentData, grade: sasGrade || 'CLASS 1' }),
      });
      if (!resp.ok) {
        const detail = await resp.text().catch(() => '');
        logger.warn('sas_student_create_failed', { status: resp.status, detail });
      } else {
        const created = await resp.json();
        logger.info('student_assigned_in_sas', { appId: id, sasStudentId: created.id, grade: studentData.grade });
      }
    } catch (e) {
      logger.error('sas_student_create_error', { err: (e as Error).message });
    }

    return res.status(200).json({ ok: true });
  });

  // Admissions/Principal: edit application details (allow corrections)
  app.patch('/v1/onboarding/staff/applications/:id', requireAnyStaff(['admissions','principal']), async (req, res) => {
    const id = req.params.id
    const { application } = req.body || {}
    if (!application || typeof application !== 'object') return res.status(400).json({ error: 'application_required' })
    await db!.collection('applications').updateOne({ _id: new ObjectId(id) }, { $set: { data: application, updatedAt: new Date() } })
    return res.status(200).json({ ok: true })
  })

  // Fees: create/update for application
  app.post('/v1/onboarding/staff/applications/:id/fees', requireAnyStaff(['admissions','accountant','principal']), async (req, res) => {
    const id = req.params.id
    const { items, total, installments } = req.body || {}
    if (!Array.isArray(items)) return res.status(400).json({ error: 'items_required' })
    const fees = db!.collection('fees')
    // Normalize installments: allow array or { count, parts }
    let installmentsField: any = undefined
    if (Array.isArray(installments)) {
      installmentsField = installments
    } else if (installments && typeof installments === 'object') {
      const parts = Array.isArray((installments as any).parts) ? (installments as any).parts : undefined
      if (parts) installmentsField = parts
      // If only count provided without parts, ignore to avoid ambiguous schedules
    }
    await fees.updateOne(
      { appId: new ObjectId(id) },
      { $set: { items, total: total ?? items.reduce((s:number, it:any)=> s + Number(it.amount||0), 0), installments: installmentsField, updatedAt: new Date() } },
      { upsert: true }
    )
    await db!.collection('applications').updateOne({ _id: new ObjectId(id) }, { $set: { status: 'fees_set' } })
    // Best‑effort: notify all staff roles (placeholder)
    try { logger.info('fees_updated_notify', { appId: id, to: ['admissions','accountant','principal'] }) } catch {}
    return res.status(200).json({ ok: true })
  })

  // Staff fees views (all roles)
  app.get('/v1/onboarding/staff/fees', requireAnyStaff(['admissions','accountant','principal']), async (_req, res) => {
    const fees = await db!.collection('fees').aggregate([
      { $lookup: { from: 'applications', localField: 'appId', foreignField: '_id', as: 'app' } },
      { $unwind: '$app' },
      { $sort: { updatedAt: -1 } }
    ]).toArray()
    return res.status(200).json({ items: fees })
  })
  // Per-application fees fetch (all roles)
  app.get('/v1/onboarding/staff/applications/:id/fees', requireAnyStaff(['admissions','accountant','principal']), async (req, res) => {
    try {
      const id = req.params.id
      const fee = await db!.collection('fees').findOne({ appId: new ObjectId(id) })
      if (!fee) return res.status(404).json({ error: 'not_found' })
      return res.status(200).json(fee)
    } catch (e) {
      return res.status(400).json({ error: 'bad_request' })
    }
  })
  app.get('/v1/onboarding/staff/overview', requireStaff('principal'), async (_req, res) => {
    const totalApps = await db!.collection('applications').countDocuments()
    const submitted = await db!.collection('applications').countDocuments({ status: 'submitted' })
    const confirmed = await db!.collection('applications').countDocuments({ status: 'admissions_confirmed' })
    const feesSet = await db!.collection('applications').countDocuments({ status: 'fees_set' })
    return res.status(200).json({ totalApps, submitted, confirmed, feesSet })
  })

  // Admin: wipe all onboarding data (dangerous; demo only). Principal only.
  app.delete('/v1/onboarding/staff/admin/wipe', requireStaff('principal'), async (_req, res) => {
    try {
      await db!.collection('applications').deleteMany({})
      await db!.collection('fees').deleteMany({})
      await db!.collection('parents').deleteMany({})
      // also clear any stray students created before SAS integration
      try { await db!.collection('students').deleteMany({}) } catch {}
    } catch {}
    return res.status(200).json({ ok: true, wiped: true })
  })

  try {
    if (MONGODB_URI) {
      const conn = await connectMongo(MONGODB_URI)
      db = conn.client.db()
    }
    if (RABBITMQ_URL) await connectRabbit(RABBITMQ_URL)
  } catch (err) {
    logger.error('Startup dependency error', { err: (err as Error).message })
  }

  const server = app.listen(PORT, () => logger.info('Onboarding service started', { port: PORT }))

  const shutdown = async () => {
    logger.info('Shutting down')
    server.close(() => logger.info('HTTP server closed'))
    await closeMongo()
    await closeRabbit()
    process.exit(0)
  }

  process.on('SIGINT', shutdown)
  process.on('SIGTERM', shutdown)
}

bootstrap().catch((e) => {
  logger.error('Bootstrap failed', { err: (e as Error).message })
  process.exit(1)
})
