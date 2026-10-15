// End-to-end API check. Start the server first (npm start), then run: npm run smoke
// Needs Node 18+ (built-in fetch). Uses API_URL or http://localhost:5000/api.
const BASE = process.env.API_URL || 'http://localhost:5000/api';
let passed = 0;
let failed = 0;

async function call(method, path, body) {
  const res = await fetch(BASE + path, {
    method,
    headers: { 'Content-Type': 'application/json' },
    body: body ? JSON.stringify(body) : undefined,
  });
  const text = await res.text();
  return { status: res.status, body: text ? JSON.parse(text) : null };
}

function check(name, condition, extra = '') {
  if (condition) {
    passed += 1;
    console.log(`  ✔ ${name}`);
  } else {
    failed += 1;
    console.log(`  ✘ ${name} ${extra}`);
  }
}

(async () => {
  const stamp = Date.now();
  console.log(`Smoke test against ${BASE}\n`);

  let r = await call('GET', '/health');
  check('health check', r.status === 200);

  console.log('\nValidation & constraints');
  r = await call('POST', '/clients', { name: 'X', email: 'not-an-email' });
  check('invalid client -> 400', r.status === 400, JSON.stringify(r.body));

  r = await call('POST', '/clients', { name: 'Test Client', email: `client${stamp}@test.com`, company: 'Test Co' });
  check('create client -> 201', r.status === 201, JSON.stringify(r.body));
  const client = r.body;

  r = await call('POST', '/clients', { name: 'Dup Client', email: `client${stamp}@test.com` });
  check('duplicate email -> 409', r.status === 409, JSON.stringify(r.body));

  r = await call('POST', '/freelancers', { name: 'Test Freelancer', email: `free${stamp}@test.com`, skills: 'Node' });
  check('create freelancer -> 201', r.status === 201, JSON.stringify(r.body));
  const freelancer = r.body;

  console.log('\nProjects & milestones');
  r = await call('POST', '/projects', { title: 'Smoke project', budget: -5, clientId: client.id });
  check('negative budget -> 400', r.status === 400, JSON.stringify(r.body));

  r = await call('POST', '/projects', { title: 'Smoke project', budget: 10000, clientId: client.id });
  check('create project -> 201', r.status === 201, JSON.stringify(r.body));
  const project = r.body;

  r = await call('PUT', `/projects/${project.id}`, { freelancerId: freelancer.id });
  check('assign freelancer -> in_progress', r.status === 200 && r.body.status === 'in_progress', JSON.stringify(r.body));

  r = await call('POST', `/projects/${project.id}/milestones`, { title: 'Milestone one', amount: 6000 });
  check('create milestone -> 201', r.status === 201, JSON.stringify(r.body));
  const m1 = r.body;

  r = await call('POST', `/projects/${project.id}/milestones`, { title: 'Too big', amount: 5000 });
  check('milestones over budget -> 422', r.status === 422, JSON.stringify(r.body));

  r = await call('POST', `/projects/${project.id}/milestones`, { title: 'Milestone two', amount: 4000 });
  const m2 = r.body;

  r = await call('POST', `/milestones/${m1.id}/tasks`, { title: 'Do the work' });
  check('create task -> 201', r.status === 201, JSON.stringify(r.body));

  console.log('\nEscrow state machine');
  r = await call('POST', `/milestones/${m1.id}/action`, { action: 'release' });
  check('release before funding -> 409', r.status === 409, JSON.stringify(r.body));

  r = await call('POST', `/milestones/${m1.id}/action`, { action: 'fund' });
  check('fund -> funded', r.status === 200 && r.body.status === 'funded', JSON.stringify(r.body));

  r = await call('POST', `/milestones/${m1.id}/action`, { action: 'submit' });
  check('submit -> submitted', r.status === 200 && r.body.status === 'submitted', JSON.stringify(r.body));

  r = await call('POST', `/milestones/${m1.id}/action`, { action: 'release' });
  check('release -> released (2 ledger rows)', r.status === 200 && r.body.status === 'released' && r.body.transactions.length === 2, JSON.stringify(r.body));

  r = await call('PUT', `/milestones/${m1.id}`, { amount: 100 });
  check('edit funded/settled milestone -> 409', r.status === 409);

  await call('POST', `/milestones/${m2.id}/action`, { action: 'fund' });
  await call('POST', `/milestones/${m2.id}/action`, { action: 'submit' });
  await call('POST', `/milestones/${m2.id}/action`, { action: 'release' });
  r = await call('GET', `/projects/${project.id}`);
  check('all released -> project completed', r.body.status === 'completed' && r.body.escrow.released === 10000, JSON.stringify(r.body.escrow));

  console.log('\nFiltering & raw SQL reports');
  r = await call('GET', `/projects?status=completed&minBudget=5000&search=Smoke&sortBy=budget&order=asc`);
  check('advanced filter', r.status === 200 && r.body.data.some((p) => p.id === project.id), JSON.stringify(r.body).slice(0, 200));

  r = await call('GET', '/reports/escrow-summary');
  check('escrow-summary (raw SQL)', r.status === 200 && Array.isArray(r.body.projects) && r.body.totals.released >= 10000);

  r = await call('GET', '/reports/freelancer-earnings');
  check('freelancer-earnings (raw SQL)', r.status === 200 && r.body.some((f) => f.id === freelancer.id && f.totalEarned === 10000));

  console.log('\nIntegrity');
  r = await call('DELETE', `/projects/${project.id}`);
  check('delete settled project -> 409', r.status === 409);
  r = await call('DELETE', `/clients/${client.id}`);
  check('delete client with projects -> 409', r.status === 409);
  r = await call('GET', '/projects/999999');
  check('missing project -> 404', r.status === 404);

  console.log(`\n${passed} passed, ${failed} failed`);
  process.exit(failed ? 1 : 0);
})().catch((err) => {
  console.error('Smoke test crashed:', err.message, '\nIs the server running (npm start)?');
  process.exit(1);
});
