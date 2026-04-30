const router = require('express').Router();
const { utilization, summary } = require('../controllers/reportsController');
const { requireAuth } = require('../middleware/auth');

router.get('/utilization', requireAuth, utilization);
router.get('/summary',     requireAuth, summary);

module.exports = router;
