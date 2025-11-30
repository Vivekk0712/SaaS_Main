// Utility to wipe onboarding and study databases via their admin endpoints
// Usage: node scripts/wipe-all.mjs

const ONBOARDING_URL = process.env.ONBOARDING_URL || 'http://localhost:3005';
const STUDY_URL = process.env.STUDY_URL || 'http://localhost:3002';

async function main() {
  const wipe = async (name, url, opts = {}) => {
    try {
      const res = await fetch(url, { method: 'DELETE', ...opts });
      const txt = await res.text();
      console.log(`[wipe] ${name} -> ${res.status} ${txt}`);
    } catch (e) {
      console.error(`[wipe] ${name} failed:`, e.message);
    }
  };

  // Onboarding wipe requires principal auth header per service guard
  await wipe('onboarding', `${ONBOARDING_URL}/v1/onboarding/staff/admin/wipe`, {
    headers: { 'x-role': 'principal', 'x-password': '12345' },
  });

  await wipe('study', `${STUDY_URL}/v1/admin/wipe`);
}

main();

