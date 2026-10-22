
const Article = require('../models/articleModel');
const User = require('../models/userModel');

// 1. GET /api/articles - Récupérer tous les articles
const getAllArticles = async (req, res) => {
  try {
    const articles = await Article.find().populate(
      'author',
      'name email role'
    );

    return res.status(200).json(articles);
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};

// 2. POST /api/articles - Créer un article (route protégée)
const createArticle = async (req, res) => {
  try {
    const { title, content } = req.body;

    if (!title || !content) {
      return res.status(400).json({
        message: 'Le titre et le contenu sont obligatoires',
      });
    }

    // L'auteur est récupéré depuis le token JWT vérifié
    const newArticle = await Article.create({
      title,
      content,
      author: req.user._id,
    });

    const populated = await newArticle.populate(
      'author',
      'name email role'
    );

    return res.status(201).json(populated);
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};

// 3. GET /api/articles/:id - Récupérer un article par ID
const getArticleById = async (req, res) => {
  try {
    const article = await Article.findById(req.params.id).populate(
      'author',
      'name email role'
    );

    if (!article) {
      return res.status(404).json({
        message: 'Article introuvable',
      });
    }

    return res.status(200).json(article);
  } catch (err) {
    if (err.name === 'CastError') {
      return res.status(400).json({
        message: 'Identifiant d’article invalide',
      });
    }

    return res.status(500).json({ message: err.message });
  }
};

// 4. PUT /api/articles/:id - Modifier un article
// Seul l'auteur ou un administrateur peut modifier l'article
const updateArticle = async (req, res) => {
  try {
    const article = await Article.findById(req.params.id);

    if (!article) {
      return res.status(404).json({
        message: 'Article introuvable',
      });
    }

    // Vérification des droits de propriété
    if (
      article.author.toString() !== req.user._id.toString() &&
      req.user.role !== 'admin'
    ) {
      return res.status(403).json({
        message: 'Action interdite : vous n’êtes pas l’auteur de cet article',
      });
    }

    // Mise à jour des champs autorisés
    if (req.body.title !== undefined) {
      article.title = req.body.title;
    }

    if (req.body.content !== undefined) {
      article.content = req.body.content;
    }

    const updated = await article.save();

    const populated = await updated.populate(
      'author',
      'name email role'
    );

    return res.status(200).json(populated);
  } catch (err) {
    if (err.name === 'CastError') {
      return res.status(400).json({
        message: 'Identifiant d’article invalide',
      });
    }

    if (err.name === 'ValidationError') {
      return res.status(400).json({ message: err.message });
    }

    return res.status(500).json({ message: err.message });
  }
};

// 5. DELETE /api/articles/:id - Supprimer un article
// Seul l'auteur ou un administrateur peut supprimer l'article
const deleteArticle = async (req, res) => {
  try {
    const article = await Article.findById(req.params.id);

    if (!article) {
      return res.status(404).json({
        message: 'Article introuvable',
      });
    }

    // Vérification des droits de propriété
    if (
      article.author.toString() !== req.user._id.toString() &&
      req.user.role !== 'admin'
    ) {
      return res.status(403).json({
        message: 'Action interdite : vous n’êtes pas l’auteur de cet article',
      });
    }

    await Article.findByIdAndDelete(req.params.id);

    return res.status(200).json({
      message: 'Article supprimé avec succès',
      id: req.params.id,
    });
  } catch (err) {
    if (err.name === 'CastError') {
      return res.status(400).json({
        message: 'Identifiant d’article invalide',
      });
    }

    return res.status(500).json({ message: err.message });
  }
};

const getMyArticles = async (req, res) => {
  try {
    const articles = await Article.find({
      author: req.user._id,
    }).populate('author', 'name email role');

    return res.status(200).json(articles);
  } catch (err) {
    return res.status(500).json({
      message: 'Erreur interne du serveur',
    });
  }
};


module.exports = {
  getAllArticles,
  createArticle,
  getArticleById,
  updateArticle,
  deleteArticle,
  getMyArticles,
};
