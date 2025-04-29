'use strict';

const express = require('express');
const router = express.Router();
const assetController = require('../controllers/assetController');
const assetValidators = require('../validators/assetValidators');
const { authenticate } = require('../../middleware/authMiddleware');
const { checkPermission, filterByPermission } = require('../../middleware/permissionMiddleware');

/**
 * @route GET /api/assets
 * @desc Ottiene la lista degli asset con supporto per filtri e paginazione
 * @access Private
 */
router.get('/',
  authenticate,
  checkPermission('read', 'Asset'),
  assetController.getAssets
);

/**
 * @route GET /api/assets/:id
 * @desc Ottiene un asset specifico per ID
 * @access Private
 */
router.get('/:id',
  authenticate,
  assetController.getAssetById
);

/**
 * @route POST /api/assets
 * @desc Crea un nuovo asset
 * @access Private
 */
router.post('/',
  authenticate,
  checkPermission('create', 'Asset'),
  assetValidators.createAsset,
  assetController.createAsset
);

/**
 * @route PUT /api/assets/:id
 * @desc Aggiorna un asset esistente
 * @access Private
 */
router.put('/:id',
  authenticate,
  assetValidators.updateAsset,
  assetController.updateAsset
);

/**
 * @route DELETE /api/assets/:id
 * @desc Elimina un asset
 * @access Private
 */
router.delete('/:id',
  authenticate,
  assetController.deleteAsset
);

/**
 * @route GET /api/assets/:id/history
 * @desc Ottiene la history delle modifiche di un asset
 * @access Private
 */
router.get('/:id/history',
  authenticate,
  assetController.getAssetHistory
);

module.exports = router;