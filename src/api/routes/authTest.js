const express = require('express');
const router = express.Router();
const { authenticate } = require('../../middleware/authMiddleware');

// Route pubblica
router.get('/public', (req, res) => {
  res.json({ message: 'Questo è un endpoint pubblico', timestamp: new Date() });
});

// Route protetta
router.get('/protected', authenticate, (req, res) => {
  res.json({ 
    message: 'Questo è un endpoint protetto',
    user: {
      id: req.user.id,
      name: req.user.name,
      email: req.user.email
    },
    timestamp: new Date()
  });
});

module.exports = router;