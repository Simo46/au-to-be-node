'use strict';

const express = require('express');
const router = express.Router();
const pianoController = require('../controllers/pianoController');
const pianoValidators = require('../validators/pianoValidators');
const { authenticate } = require('../../middleware/authMiddleware');
const { checkPermission, filterByPermission } = require('../../middleware/permissionMiddleware');

/**
 * @route GET /api/piani
 * @desc Ottiene la lista dei piani con supporto per filtri e paginazione
 * @access Private
 */
router.get('/',
  authenticate,
  checkPermission('read', 'Piano'),
  pianoController.getPiani
);

/**
 * @route GET /api/piani/:id
 * @desc Ottiene un piano specifico per ID
 * @access Private
 */
router.get('/:id',
  authenticate,
  pianoController.getPianoById
);

/**
 * @route POST /api/piani
 * @desc Crea un nuovo piano
 * @access Private
 */
router.post('/',
  authenticate,
  checkPermission('create', 'Piano'),
  pianoValidators.createPiano,
  pianoController.createPiano
);

/**
 * @route PUT /api/piani/:id
 * @desc Aggiorna un piano esistente
 * @access Private
 */
router.put('/:id',
  authenticate,
  pianoValidators.updatePiano,
  pianoController.updatePiano
);

/**
 * @route DELETE /api/piani/:id
 * @desc Elimina un piano
 * @access Private
 */
router.delete('/:id',
  authenticate,
  pianoController.deletePiano
);

/**
 * @route GET /api/piani/:id/history
 * @desc Ottiene la history delle modifiche di un piano
 * @access Private
 */
router.get('/:id/history',
  authenticate,
  pianoController.getPianoHistory
);

module.exports = router;