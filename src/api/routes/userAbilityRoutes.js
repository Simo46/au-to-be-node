'use strict';

const express = require('express');
const router = express.Router({ mergeParams: true });
const userAbilityController = require('../controllers/userAbilityController');
const userAbilityValidators = require('../validators/userAbilityValidators');
const { authenticate } = require('../../middleware/authMiddleware');
const { checkPermission } = require('../../middleware/permissionMiddleware');

/**
 * @route GET /api/users/:userId/abilities
 * @desc Ottiene tutti i permessi individuali di un utente
 * @access Private - Solo admin o l'utente stesso
 */
router.get('/',
  authenticate,
  userAbilityController.getUserAbilities
);

/**
 * @route GET /api/users/:userId/abilities/:abilityId
 * @desc Ottiene un permesso individuale specifico
 * @access Private - Solo admin o l'utente stesso
 */
router.get('/:abilityId',
  authenticate,
  userAbilityController.getUserAbilityById
);

/**
 * @route POST /api/users/:userId/abilities
 * @desc Crea un nuovo permesso individuale
 * @access Private - Solo admin
 */
router.post('/',
  authenticate,
  checkPermission('manage', 'UserAbility'),
  userAbilityValidators.createUserAbility,
  userAbilityController.createUserAbility
);

/**
 * @route PUT /api/users/:userId/abilities/:abilityId
 * @desc Aggiorna un permesso individuale esistente
 * @access Private - Solo admin
 */
router.put('/:abilityId',
  authenticate,
  checkPermission('manage', 'UserAbility'),
  userAbilityValidators.updateUserAbility,
  userAbilityController.updateUserAbility
);

/**
 * @route DELETE /api/users/:userId/abilities/:abilityId
 * @desc Elimina un permesso individuale
 * @access Private - Solo admin
 */
router.delete('/:abilityId',
  authenticate,
  checkPermission('manage', 'UserAbility'),
  userAbilityController.deleteUserAbility
);

/**
 * @route GET /api/users/:userId/effective-abilities
 * @desc Ottiene un riassunto combinato di tutti i permessi dell'utente
 * @access Private - Solo admin o l'utente stesso
 */
router.get('/effective',
  authenticate,
  userAbilityController.getUserEffectiveAbilities
);

module.exports = router;