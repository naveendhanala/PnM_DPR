const router = require('express').Router();
const { getAll, create, remove } = require('../controllers/equipmentTypesController');
const { requireAuth, requireAdmin } = require('../middleware/auth');

router.get('/',       requireAuth,              getAll);
router.post('/',      requireAuth, requireAdmin, create);
router.delete('/:id', requireAuth, requireAdmin, remove);

module.exports = router;
