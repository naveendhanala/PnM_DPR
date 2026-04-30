const router = require('express').Router();
const { login, getMe } = require('../controllers/authController');
const { requireAuth } = require('../middleware/auth');

router.post('/login', login);
router.get('/me', requireAuth, getMe);

module.exports = router;
