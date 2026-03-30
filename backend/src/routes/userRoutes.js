const userController = require('../controllers/userController');
const { protect, restrictTo } = require('../middlewares/auth');

const express = require('express');
const router = express.Router();

router.use(protect);

router.get('/', restrictTo('admin'), userController.getAllUsers);
router.get('/:id', userController.getUser);
router.patch('/:id', userController.updateUser);
router.delete('/:id', restrictTo('admin'), userController.deleteUser);

module.exports = router;
