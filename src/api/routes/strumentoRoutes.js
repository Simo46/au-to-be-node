'use strict';

const express = require('express');
const router = express.Router();
const strumentoController = require('../controllers/strumentoController');
const strumentoValidators = require('../validators/strumentoValidators');
const { authenticate } = require('../../middleware/authMiddleware');
const { checkPermission } = require('../../middleware/permissionMiddleware');

/**
 * @route GET /api/strumenti
 * @desc Ottiene la lista degli strumenti di misura con supporto per filtri e paginazione
 * @access Private
 */
router.get('/',
  authenticate,
  checkPermission('read', 'Asset'),
  strumentoController.getStrumenti
);

/**
 * @route GET /api/strumenti/:id
 * @desc Ottiene uno strumento di misura specifico per ID (ora usa l'ID dello strumento)
 * @access Private
 */
router.get('/:id',
  authenticate,
  strumentoController.getStrumentoById
);

/**
 * @route POST /api/strumenti
 * @desc Crea un nuovo strumento di misura completo (asset + dettagli)
 * @access Private
 */
router.post('/',
  authenticate,
  checkPermission('create', 'Asset'),
  strumentoValidators.createCombined,
  strumentoController.createStrumento
);

/**
 * @route PUT /api/strumenti/:id
 * @desc Aggiorna uno strumento di misura esistente (ora usa l'ID dello strumento)
 * @access Private
 */
router.put('/:id',
  authenticate,
  strumentoValidators.updateStrumento,
  strumentoController.updateStrumento
);

/**
 * @route DELETE /api/strumenti/:id
 * @desc Elimina uno strumento di misura (ora usa l'ID dello strumento)
 * @access Private
 */
router.delete('/:id',
  authenticate,
  strumentoController.deleteStrumento
);

/**
 * @route GET /api/strumenti/:id/history
 * @desc Ottiene la history delle modifiche di uno strumento di misura (ora usa l'ID dello strumento)
 * @access Private
 */
router.get('/:id/history',
  authenticate,
  strumentoController.getStrumentoHistory
);

// Endpoint speciale per aggiungere dettagli a un asset esistente (uso raro)
router.post('/add-to-existing',
  authenticate,
  checkPermission('create', 'Asset'),
  strumentoValidators.createStrumento,
  strumentoController.addToExistingAsset
);

module.exports = router;