'use strict';

const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const authValidators = require('../validators/authValidators');
const { authenticate } = require('../../middleware/authMiddleware');
const { checkPermission } = require('../../middleware/permissionMiddleware');

/**
 * @route POST /api/auth/register
 * @desc Registrazione di un nuovo utente (richiede autenticazione e permessi)
 * @access Private - Solo admin, ufficio tecnico e post vendita
 */
router.post('/register', 
    authenticate, 
    checkPermission('create', 'User'),
    authValidators.register, 
    authController.register
);

/**
 * @route POST /api/auth/login
 * @desc Login utente
 * @access Public
 */
router.post('/login', authValidators.login, authController.login);

/**
 * @route POST /api/auth/logout
 * @desc Logout utente
 * @access Private
 */
router.post('/logout', authenticate, authController.logout);

/**
 * @route POST /api/auth/refresh
 * @desc Refresh token
 * @access Public
 */
router.post('/refresh', authValidators.refreshToken, authController.refreshToken);

/**
 * @route GET /api/auth/me
 * @desc Ottieni informazioni utente autenticato
 * @access Private
 */
router.get('/me', authenticate, authController.me);

module.exports = router;