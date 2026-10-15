const express = require('express');
const client = require('../controllers/clientController');
const freelancer = require('../controllers/freelancerController');
const project = require('../controllers/projectController');
const milestone = require('../controllers/milestoneController');
const task = require('../controllers/taskController');
const transaction = require('../controllers/transactionController');
const report = require('../controllers/reportController');

const router = express.Router();

// Clients
router.get('/clients', client.list);
router.post('/clients', client.create);
router.get('/clients/:id', client.get);
router.put('/clients/:id', client.update);
router.delete('/clients/:id', client.remove);

// Freelancers
router.get('/freelancers', freelancer.list);
router.post('/freelancers', freelancer.create);
router.get('/freelancers/:id', freelancer.get);
router.put('/freelancers/:id', freelancer.update);
router.delete('/freelancers/:id', freelancer.remove);

// Projects
router.get('/projects', project.list);
router.post('/projects', project.create);
router.get('/projects/:id', project.get);
router.put('/projects/:id', project.update);
router.delete('/projects/:id', project.remove);

// Milestones (escrow payments)
router.get('/projects/:projectId/milestones', milestone.listForProject);
router.post('/projects/:projectId/milestones', milestone.create);
router.get('/milestones/:id', milestone.get);
router.put('/milestones/:id', milestone.update);
router.delete('/milestones/:id', milestone.remove);
router.post('/milestones/:id/action', milestone.performAction);

// Tasks
router.post('/milestones/:milestoneId/tasks', task.create);
router.put('/tasks/:id', task.update);
router.delete('/tasks/:id', task.remove);

// Ledger + raw-SQL reports
router.get('/transactions', transaction.list);
router.get('/reports/escrow-summary', report.escrowSummary);
router.get('/reports/freelancer-earnings', report.freelancerEarnings);

module.exports = router;
