'use strict';

const express = require('express');
const router = express.Router();
const impiantoController = require('../controllers/impiantoController');
const impiantoValidators = require('../validators/impiantoValidators');
const { authenticate } = require('../../middleware/authMiddleware');
const { checkPermission } = require('../../middleware/permissionMiddleware');

/**
 * @route GET /api/impianti
 * @desc Ottiene la lista degli impianti tecnologici con supporto per filtri e paginazione
 * @access Private
 */
router.get('/',
  authenticate,
  checkPermission('read', 'Asset'),
  impiantoController.getImpianti
);

/**
 * @route GET /api/impianti/:id
 * @desc Ottiene un impianto tecnologico specifico per ID (ora usa l'ID dell'impianto)
 * @access Private
 */
router.get('/:id',
  authenticate,
  impiantoController.getImpiantoById
);

/**
 * @route POST /api/impianti
 * @desc Crea un nuovo impianto tecnologico completo (asset + dettagli)
 * @access Private
 */
router.post('/',
  authenticate,
  checkPermission('create', 'Asset'),
  impiantoValidators.createCombined,
  impiantoController.createImpianto
);

/**
 * @route PUT /api/impianti/:id
 * @desc Aggiorna un impianto tecnologico esistente (ora usa l'ID dell'impianto)
 * @access Private
 */
router.put('/:id',
  authenticate,
  impiantoValidators.updateImpianto,
  impiantoController.updateImpianto
);

/**
 * @route DELETE /api/impianti/:id
 * @desc Elimina un impianto tecnologico (ora usa l'ID dell'impianto)
 * @access Private
 */
router.delete('/:id',
  authenticate,
  impiantoController.deleteImpianto
);

/**
 * @route GET /api/impianti/:id/history
 * @desc Ottiene la history delle modifiche di un impianto tecnologico (ora usa l'ID dell'impianto)
 * @access Private
 */
router.get('/:id/history',
  authenticate,
  impiantoController.getImpiantoHistory
);

// Endpoint speciale per aggiungere dettagli a un asset esistente (uso raro)
router.post('/add-to-existing',
  authenticate,
  checkPermission('create', 'Asset'),
  impiantoValidators.createImpianto,
  impiantoController.addToExistingAsset
);

module.exports = router;