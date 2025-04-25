'use strict';

const express = require('express');
const router = express.Router();
const roleController = require('../controllers/roleController');
const roleValidators = require('../validators/roleValidators');
const { authenticate } = require('../../middleware/authMiddleware');
const { checkPermission } = require('../../middleware/permissionMiddleware');

/**
 * @route GET /api/roles
 * @desc Ottiene la lista dei ruoli con supporto per filtri e paginazione
 * @access Private
 */
router.get('/',
  authenticate,
  checkPermission('read', 'Role'),
  roleController.getRoles
);

/**
 * @route GET /api/roles/:id
 * @desc Ottiene un ruolo specifico per ID
 * @access Private
 */
router.get('/:id',
  authenticate,
  roleController.getRoleById
);

/**
 * @route POST /api/roles
 * @desc Crea un nuovo ruolo
 * @access Private
 */
router.post('/',
  authenticate,
  checkPermission('create', 'Role'),
  roleValidators.createRole,
  roleController.createRole
);

/**
 * @route PUT /api/roles/:id
 * @desc Aggiorna un ruolo esistente
 * @access Private
 */
router.put('/:id',
  authenticate,
  roleValidators.updateRole,
  roleController.updateRole
);

/**
 * @route DELETE /api/roles/:id
 * @desc Elimina un ruolo
 * @access Private
 */
router.delete('/:id',
  authenticate,
  roleController.deleteRole
);

/**
 * @route POST /api/roles/:id/abilities
 * @desc Assegna abilities a un ruolo
 * @access Private
 */
router.post('/:id/abilities',
  authenticate,
  roleValidators.assignAbilities,
  roleController.assignAbilities
);

/**
 * @route DELETE /api/roles/:id/abilities
 * @desc Rimuove abilities da un ruolo
 * @access Private
 */
router.delete('/:id/abilities',
  authenticate,
  roleController.removeAbilities
);

/**
 * @route PUT /api/roles/:id/abilities
 * @desc Sostituisce completamente le abilities di un ruolo
 * @access Private
 */
router.put('/:id/abilities',
  authenticate,
  roleValidators.assignAbilities,
  roleController.replaceAbilities
);

module.exports = router;