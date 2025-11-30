import { spawn } from 'node:child_process'

const procs = []

const npmCmd = process.platform === 'win32' ? 'npm.cmd' : 'npm'

function run(name, cmd, args, env = {}) {
  console.log(`[dev] starting ${name}: ${cmd} ${args.join(' ')}`)
  const p = spawn(cmd, args, {
    stdio: 'inherit',
    env: { ...process.env, ...env },
    shell: process.platform === 'win32',
  })
  p.on('exit', (code) => {
    console.log(`[dev] ${name} exited with code ${code}`)
  })
  procs.push(p)
}

// Env defaults for shared DB/API
const envShared = {
  MONGODB_URI: process.env.MONGODB_URI || 'mongodb://localhost:27017/school-sas',
  RABBITMQ_URL: process.env.RABBITMQ_URL || 'amqp://localhost:5672',
  STUDY_API_URL: process.env.STUDY_API_URL || 'http://localhost:3002',
  NEXT_PUBLIC_ONBOARDING_API_URL: process.env.NEXT_PUBLIC_ONBOARDING_API_URL || 'http://localhost:3005',
}

// Start services first (API)
run('study-service', npmCmd, ['run', 'dev', '-w', '@school-sas/study-service'], envShared)
run('onboarding-service', npmCmd, ['run', 'dev', '-w', '@school-sas/onboarding-service'], envShared)

// Start websites
run('frontend-next', npmCmd, ['run', 'dev', '-w', 'frontend-next'], envShared)
run('onboarding-next', npmCmd, ['run', 'dev', '-w', 'onboarding-next'], envShared)
run('students-next', npmCmd, ['run', 'dev', '-w', 'students-next'], envShared)

// Optional: admissions form demo app (enable with WITH_ADMISSIONS=1)
if (process.env.WITH_ADMISSIONS === '1') {
  run('admissions-form', npmCmd, ['run', 'dev', '-w', 'admissions-form-next'], envShared)
}

const shutdown = () => {
  console.log('Shutting down child processes...')
  for (const p of procs) {
    try { p.kill('SIGINT') } catch {}
  }
  setTimeout(() => process.exit(0), 500)
}

process.on('SIGINT', shutdown)
process.on('SIGTERM', shutdown)
