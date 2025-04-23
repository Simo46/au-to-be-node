'use strict';

const express = require('express');
const router = express.Router();
const permissionTestController = require('../controllers/test/permissionTestController');
const { authenticate } = require('../../middleware/authMiddleware');

// Rotte protette (richiedono autenticazione)
router.get('/my-permissions', authenticate, permissionTestController.testUserPermissions);
router.get('/:resourceType/:action/:resourceId', authenticate, permissionTestController.testResourcePermission);

module.exports = router;