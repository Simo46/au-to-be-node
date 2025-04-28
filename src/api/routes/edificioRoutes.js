'use strict';

const express = require('express');
const router = express.Router();
const edificioController = require('../controllers/edificioController');
const edificioValidators = require('../validators/edificioValidators');
const { authenticate } = require('../../middleware/authMiddleware');
const { checkPermission, filterByPermission } = require('../../middleware/permissionMiddleware');

/**
 * @route GET /api/edifici
 * @desc Ottiene la lista degli edifici con supporto per filtri e paginazione
 * @access Private
 */
router.get('/',
  authenticate,
  checkPermission('read', 'Edificio'),
  edificioController.getEdifici
);

/**
 * @route GET /api/edifici/:id
 * @desc Ottiene un edificio specifico per ID
 * @access Private
 */
router.get('/:id',
  authenticate,
  edificioController.getEdificioById
);

/**
 * @route POST /api/edifici
 * @desc Crea un nuovo edificio
 * @access Private
 */
router.post('/',
  authenticate,
  checkPermission('create', 'Edificio'),
  edificioValidators.createEdificio,
  edificioController.createEdificio
);

/**
 * @route PUT /api/edifici/:id
 * @desc Aggiorna un edificio esistente
 * @access Private
 */
router.put('/:id',
  authenticate,
  edificioValidators.updateEdificio,
  edificioController.updateEdificio
);

/**
 * @route DELETE /api/edifici/:id
 * @desc Elimina un edificio
 * @access Private
 */
router.delete('/:id',
  authenticate,
  edificioController.deleteEdificio
);

/**
 * @route GET /api/edifici/:id/history
 * @desc Ottiene la history delle modifiche di un edificio
 * @access Private
 */
router.get('/:id/history',
  authenticate,
  edificioController.getEdificioHistory
);

module.exports = router;