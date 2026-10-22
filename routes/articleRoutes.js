
const express = require('express');
const router = express.Router();

const {
  getAllArticles,
  getArticleById,
  createArticle,
  updateArticle,
  deleteArticle,
  getMyArticles,
} = require('../controllers/articleControllers');

const { protect } = require('../middlewares/authMiddleware');
router.get('/my-articles', protect, getMyArticles);

// Consultation publique
router.get('/', getAllArticles);
router.get('/:id', getArticleById);

// Opérations d'écriture protégées par authentification JWT
router.post('/', protect, createArticle);
router.put('/:id', protect, updateArticle);
router.delete('/:id', protect, deleteArticle);

module.exports = router;
