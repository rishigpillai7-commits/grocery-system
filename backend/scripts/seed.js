// Populates the database with demo data.
//   npm run seed              -> insert demo data (tables must already exist: npm run migrate)
//   npm run seed -- --reset   -> DROP + recreate all tables from the models, then insert demo data
require('dotenv').config();
const { sequelize, Client, Freelancer, Project, Milestone, Task, EscrowTransaction } = require('../models');

const day = (offset) => {
  const d = new Date();
  d.setDate(d.getDate() + offset);
  return d.toISOString().slice(0, 10);
};

// Create a milestone and the ledger rows that match its status.
async function addMilestone(project, { title, amount, status = 'pending', due, tasks = [] }) {
  const milestone = await Milestone.create({
    title,
    amount,
    status,
    dueDate: due,
    projectId: project.id,
  });

  const ledger = [];
  if (['funded', 'submitted', 'disputed', 'released', 'refunded'].includes(status)) {
    ledger.push({ type: 'deposit', note: 'Client funded milestone into escrow' });
  }
  if (status === 'released') ledger.push({ type: 'release', note: 'Escrow released to freelancer' });
  if (status === 'refunded') ledger.push({ type: 'refund', note: 'Escrow refunded to client' });
  for (const entry of ledger) {
    await EscrowTransaction.create({ ...entry, amount, milestoneId: milestone.id });
  }

  for (const [taskTitle, isDone] of tasks) {
    await Task.create({ title: taskTitle, isDone, milestoneId: milestone.id });
  }
  return milestone;
}

(async () => {
  try {
    await sequelize.authenticate();

    if (process.argv.includes('--reset')) {
      await sequelize.sync({ force: true });
      console.log('✔ Tables recreated from models');
    } else if ((await Client.count()) > 0) {
      console.log('Database already has data. Use "npm run seed -- --reset" to wipe and reseed.');
      process.exit(0);
    }

    // Created one by one so every instance reliably carries its generated id.
    const createAll = async (Model, rows) => {
      const out = [];
      for (const row of rows) out.push(await Model.create(row));
      return out;
    };

    const [aarav, sofia, rahul] = await createAll(Client, [
      { name: 'Aarav Mehta', email: 'aarav@mehtatextiles.in', company: 'Mehta Textiles' },
      { name: 'Sofia Fernandes', email: 'sofia@goaeats.in', company: 'Goa Eats' },
      { name: 'Rahul Naik', email: 'rahul@naikrealty.in', company: 'Naik Realty' },
    ]);

    const [priya, daniel, meera, karan] = await createAll(Freelancer, [
      { name: 'Priya Kamat', email: 'priya.kamat@mail.com', skills: 'React, Node.js, MySQL', hourlyRate: 1200 },
      { name: "Daniel D'Souza", email: 'daniel.dsouza@mail.com', skills: 'UI/UX, Figma, Branding', hourlyRate: 1000 },
      { name: 'Meera Shenoy', email: 'meera.shenoy@mail.com', skills: 'Content Writing, SEO', hourlyRate: 700 },
      { name: 'Karan Gaonkar', email: 'karan.gaonkar@mail.com', skills: 'Flutter, Firebase, Android', hourlyRate: 1400 },
    ]);

    // 1. In progress — one milestone released, one awaiting client approval, one not funded yet
    const p1 = await Project.create({
      title: 'E-commerce website redesign',
      description: 'Redesign the storefront and rebuild the checkout in React.',
      budget: 60000,
      status: 'in_progress',
      deadline: day(45),
      clientId: aarav.id,
      freelancerId: priya.id,
    });
    await addMilestone(p1, {
      title: 'Design mockups', amount: 15000, status: 'released', due: day(-10),
      tasks: [['Home page mockup', true], ['Product page mockup', true]],
    });
    await addMilestone(p1, {
      title: 'Frontend build', amount: 30000, status: 'submitted', due: day(10),
      tasks: [['Product listing page', true], ['Cart and checkout', true], ['Responsive QA', false]],
    });
    await addMilestone(p1, {
      title: 'Deployment and handover', amount: 15000, status: 'pending', due: day(40),
      tasks: [['Deploy to hosting', false]],
    });

    // 2. In progress — money sitting in escrow
    const p2 = await Project.create({
      title: 'Restaurant ordering app',
      description: 'Mobile app for table ordering with live kitchen status.',
      budget: 90000,
      status: 'in_progress',
      deadline: day(75),
      clientId: sofia.id,
      freelancerId: karan.id,
    });
    await addMilestone(p2, { title: 'Wireframes', amount: 20000, status: 'released', due: day(-5) });
    await addMilestone(p2, {
      title: 'MVP app', amount: 50000, status: 'funded', due: day(40),
      tasks: [['Menu screen', true], ['Order flow', false], ['Kitchen dashboard', false]],
    });
    await addMilestone(p2, { title: 'Testing and launch', amount: 20000, status: 'pending', due: day(70) });

    // 3. Completed — everything released
    const p3 = await Project.create({
      title: 'SEO blog content pack',
      description: 'Keyword research plus ten SEO blog posts.',
      budget: 25000,
      status: 'completed',
      deadline: day(5),
      clientId: sofia.id,
      freelancerId: meera.id,
    });
    await addMilestone(p3, { title: 'Keyword research', amount: 8000, status: 'released', due: day(-30) });
    await addMilestone(p3, { title: 'Ten blog posts', amount: 17000, status: 'released', due: day(-8) });

    // 4. Open — no freelancer yet
    const p4 = await Project.create({
      title: 'Property listing portal',
      description: 'Search, filter and enquiry portal for property listings.',
      budget: 120000,
      status: 'open',
      deadline: day(120),
      clientId: rahul.id,
    });
    await addMilestone(p4, { title: 'Requirements document', amount: 10000, status: 'pending', due: day(20) });

    // 5. In progress — a disputed and a refunded milestone
    const p5 = await Project.create({
      title: 'Brand identity kit',
      description: 'Logo, colour palette and style guide.',
      budget: 40000,
      status: 'in_progress',
      deadline: day(30),
      clientId: aarav.id,
      freelancerId: daniel.id,
    });
    await addMilestone(p5, { title: 'Logo concepts', amount: 12000, status: 'disputed', due: day(-2) });
    await addMilestone(p5, { title: 'Social media templates', amount: 5000, status: 'refunded', due: day(-1) });
    await addMilestone(p5, { title: 'Style guide', amount: 23000, status: 'pending', due: day(25) });

    console.log('✔ Demo data inserted: 3 clients, 4 freelancers, 5 projects, 15 milestones');
    await sequelize.close();
  } catch (err) {
    console.error('✘ Seeding failed:', err.message);
    process.exit(1);
  }
})();
