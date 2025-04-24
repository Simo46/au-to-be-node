'use strict';

const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const userValidators = require('../validators/userValidators');
const { authenticate } = require('../../middleware/authMiddleware');
const { checkPermission, filterByPermission } = require('../../middleware/permissionMiddleware');

/**
 * @route GET /api/users/roles/all
 * @desc Ottiene i ruoli disponibili
 * @access Private
 */
router.get('/roles/all',
  authenticate,
  userController.getRoles
);

/**
 * @route GET /api/users
 * @desc Ottiene la lista degli utenti con supporto per filtri e paginazione
 * @access Private
 */
router.get('/',
  authenticate,
  checkPermission('read', 'User'),
  userController.getUsers
);

/**
 * @route GET /api/users/:id
 * @desc Ottiene un utente specifico per ID
 * @access Private
 */
router.get('/:id',
  authenticate,
  userController.getUserById
);

/**
 * @route POST /api/users
 * @desc Crea un nuovo utente
 * @access Private
 */
router.post('/',
  authenticate,
  checkPermission('create', 'User'),
  userValidators.createUser,
  userController.createUser
);

/**
 * @route PUT /api/users/:id
 * @desc Aggiorna un utente esistente
 * @access Private
 */
router.put('/:id',
  authenticate,
  userValidators.updateUser,
  userController.updateUser
);

/**
 * @route DELETE /api/users/:id
 * @desc Elimina un utente
 * @access Private
 */
router.delete('/:id',
  authenticate,
  userController.deleteUser
);

/**
 * @route POST /api/users/:id/roles
 * @desc Assegna ruoli a un utente
 * @access Private
 */
router.post('/:id/roles',
  authenticate,
  userValidators.assignRoles,
  userController.assignRoles
);

module.exports = router;