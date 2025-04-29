'use strict';

const express = require('express');
const router = express.Router();
const attrezzaturaController = require('../controllers/attrezzaturaController');
const attrezzaturaValidators = require('../validators/attrezzaturaValidators');
const { authenticate } = require('../../middleware/authMiddleware');
const { checkPermission } = require('../../middleware/permissionMiddleware');

/**
 * @route GET /api/attrezzature
 * @desc Ottiene la lista delle attrezzature con supporto per filtri e paginazione
 * @access Private
 */
router.get('/',
  authenticate,
  checkPermission('read', 'Asset'),
  attrezzaturaController.getAttrezzature
);

/**
 * @route GET /api/attrezzature/:id
 * @desc Ottiene un'attrezzatura specifica per ID (ora usa l'ID dell'attrezzatura)
 * @access Private
 */
router.get('/:id',
  authenticate,
  attrezzaturaController.getAttrezzaturaById
);

/**
 * @route POST /api/attrezzature
 * @desc Crea una nuova attrezzatura completa (asset + dettagli)
 * @access Private
 */
router.post('/',
  authenticate,
  checkPermission('create', 'Asset'),
  attrezzaturaValidators.createCombined,
  attrezzaturaController.createAttrezzatura
);

/**
 * @route PUT /api/attrezzature/:id
 * @desc Aggiorna un'attrezzatura esistente (ora usa l'ID dell'attrezzatura)
 * @access Private
 */
router.put('/:id',
  authenticate,
  attrezzaturaValidators.updateAttrezzatura,
  attrezzaturaController.updateAttrezzatura
);

/**
 * @route DELETE /api/attrezzature/:id
 * @desc Elimina un'attrezzatura (ora usa l'ID dell'attrezzatura)
 * @access Private
 */
router.delete('/:id',
  authenticate,
  attrezzaturaController.deleteAttrezzatura
);

/**
 * @route GET /api/attrezzature/:id/history
 * @desc Ottiene la history delle modifiche di un'attrezzatura (ora usa l'ID dell'attrezzatura)
 * @access Private
 */
router.get('/:id/history',
  authenticate,
  attrezzaturaController.getAttrezzaturaHistory
);

// Endpoint speciale per aggiungere dettagli a un asset esistente (uso raro)
/* router.post('/add-to-existing',
  authenticate,
  checkPermission('create', 'Asset'),
  attrezzaturaValidators.createAttrezzatura,
  attrezzaturaController.addToExistingAsset
); */

module.exports = router;