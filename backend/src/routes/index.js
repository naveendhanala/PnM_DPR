const router = require('express').Router();

router.use('/auth',            require('./auth'));
router.use('/projects',        require('./projects'));
router.use('/machines',        require('./machines'));
router.use('/entries',         require('./entries'));
router.use('/reports',         require('./reports'));
router.use('/equipment-types', require('./equipmentTypes'));
router.use('/users',           require('./users'));

module.exports = router;
