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

// Start Razorpay plugin (runs from its own directory)
const razorpayProc = spawn(npmCmd, ['run', 'dev'], {
  cwd: 'razorpay_plugin',
  stdio: 'inherit',
  env: { ...process.env, ...envShared },
  shell: process.platform === 'win32',
})
razorpayProc.on('exit', (code) => {
  console.log(`[dev] razorpay-plugin exited with code ${code}`)
})
procs.push(razorpayProc)
console.log('[dev] starting razorpay-plugin: npm run dev (in razorpay_plugin/)')

// Start RAG Chatbot plugin (runs from its own directory)
const ragProc = spawn(npmCmd, ['run', 'dev'], {
  cwd: 'rag_chatbot_plugin',
  stdio: 'inherit',
  env: { ...process.env, ...envShared },
  shell: process.platform === 'win32',
})
ragProc.on('exit', (code) => {
  console.log(`[dev] rag-chatbot-plugin exited with code ${code}`)
})
procs.push(ragProc)
console.log('[dev] starting rag-chatbot-plugin: npm run dev (in rag_chatbot_plugin/)')

// Start WhatsApp plugin (runs from its own directory)
const whatsappProc = spawn(npmCmd, ['run', 'dev'], {
  cwd: 'whatsapp_plugin',
  stdio: 'inherit',
  env: { ...process.env, ...envShared },
  shell: process.platform === 'win32',
})
whatsappProc.on('exit', (code) => {
  console.log(`[dev] whatsapp-plugin exited with code ${code}`)
})
procs.push(whatsappProc)
console.log('[dev] starting whatsapp-plugin: npm run dev (in whatsapp_plugin/)')

// Start MCP Server plugin (Python-based database chat)
// Use venv's python on Windows
const mcpCmd = process.platform === 'win32' ? 'venv\\Scripts\\python.exe' : 'venv/bin/python'
const mcpProc = spawn(mcpCmd, ['-m', 'uvicorn', 'src.main:app', '--reload', '--port', '5003'], {
  cwd: 'mcp_server_plugin',
  stdio: 'inherit',
  env: { ...process.env, ...envShared },
  shell: false, // Don't use shell to avoid path issues
})
mcpProc.on('exit', (code) => {
  console.log(`[dev] mcp-server-plugin exited with code ${code}`)
})
procs.push(mcpProc)
console.log('[dev] starting mcp-server-plugin: venv\\Scripts\\python.exe -m uvicorn src.main:app --reload --port 5003 (in mcp_server_plugin/)')

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
    try { p.kill('SIGINT') } catch { }
  }
  setTimeout(() => process.exit(0), 500)
}

process.on('SIGINT', shutdown)
process.on('SIGTERM', shutdown)
