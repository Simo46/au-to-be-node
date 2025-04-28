'use strict';

const express = require('express');
const router = express.Router();
const localeController = require('../controllers/localeController');
const localeValidators = require('../validators/localeValidators');
const { authenticate } = require('../../middleware/authMiddleware');
const { checkPermission, filterByPermission } = require('../../middleware/permissionMiddleware');

/**
 * @route GET /api/locali
 * @desc Ottiene la lista dei locali con supporto per filtri e paginazione
 * @access Private
 */
router.get('/',
  authenticate,
  checkPermission('read', 'locale'),
  localeController.getLocali
);

/**
 * @route GET /api/locali/:id
 * @desc Ottiene un locale specifico per ID
 * @access Private
 */
router.get('/:id',
  authenticate,
  localeController.getLocaleById
);

/**
 * @route POST /api/locali
 * @desc Crea un nuovo locale
 * @access Private
 */
router.post('/',
  authenticate,
  checkPermission('create', 'locale'),
  localeValidators.createLocale,
  localeController.createLocale
);

/**
 * @route PUT /api/locali/:id
 * @desc Aggiorna un locale esistente
 * @access Private
 */
router.put('/:id',
  authenticate,
  localeValidators.updateLocale,
  localeController.updateLocale
);

/**
 * @route DELETE /api/locali/:id
 * @desc Elimina un locale
 * @access Private
 */
router.delete('/:id',
  authenticate,
  localeController.deleteLocale
);

/**
 * @route GET /api/locali/:id/history
 * @desc Ottiene la history delle modifiche di un locale
 * @access Private
 */
router.get('/:id/history',
  authenticate,
  localeController.getLocaleHistory
);

module.exports = router;