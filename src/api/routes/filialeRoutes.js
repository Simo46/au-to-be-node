'use strict';

const express = require('express');
const router = express.Router();
const filialeController = require('../controllers/filialeController');
const filialeValidators = require('../validators/filialeValidators');
const { authenticate } = require('../../middleware/authMiddleware');
const { checkPermission, filterByPermission } = require('../../middleware/permissionMiddleware');

/**
 * @route GET /api/filiali
 * @desc Ottiene la lista delle filiali con supporto per filtri e paginazione
 * @access Private
 */
router.get('/',
  authenticate,
  checkPermission('read', 'Filiale'),
  filialeController.getFiliali
);

/**
 * @route GET /api/filiali/:id
 * @desc Ottiene una filiale specifica per ID
 * @access Private
 */
router.get('/:id',
  authenticate,
  filialeController.getFilialeById
);

/**
 * @route POST /api/filiali
 * @desc Crea una nuova filiale
 * @access Private
 */
router.post('/',
  authenticate,
  checkPermission('create', 'Filiale'),
  filialeValidators.createFiliale,
  filialeController.createFiliale
);

/**
 * @route PUT /api/filiali/:id
 * @desc Aggiorna una filiale esistente
 * @access Private
 */
router.put('/:id',
  authenticate,
  filialeValidators.updateFiliale,
  filialeController.updateFiliale
);

/**
 * @route DELETE /api/filiali/:id
 * @desc Elimina una filiale
 * @access Private
 */
router.delete('/:id',
  authenticate,
  filialeController.deleteFiliale
);

/**
 * @route GET /api/filiali/:id/history
 * @desc Ottiene la history delle modifiche di una filiale
 * @access Private
 */
router.get('/:id/history',
  authenticate,
  filialeController.getFilialeHistory
);

module.exports = router;