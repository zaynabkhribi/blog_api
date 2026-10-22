
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/userModel');
const Article = require('../models/articleModel');

// Utilitaire de génération du token JWT
const generateToken = (id, role) => {
  return jwt.sign(
    { id, role },
    process.env.JWT_SECRET,
    { expiresIn: '1d' }
  );
};

// POST /api/users/register - Inscription
const registerUser = async (req, res) => {
  try {
    const { name, email, password, age } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({
        message: 'Nom, email et mot de passe requis',
      });
    }

    const userExists = await User.findOne({ email });

    if (userExists) {
      return res.status(409).json({
        message: 'Cet email est déjà utilisé',
      });
    }

    // Hachage du mot de passe
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Le rôle par défaut est défini par le modèle User.
    // Ne pas accepter le rôle admin depuis le formulaire d'inscription.
    const user = await User.create({
      name,
      email,
      password: hashedPassword,
      age,
      role: 'user',
    });

    return res.status(201).json({
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      token: generateToken(user._id.toString(), user.role),
    });
  } catch (err) {
    if (err.name === 'ValidationError') {
      return res.status(400).json({ message: err.message });
    }

    return res.status(500).json({ message: 'Erreur interne du serveur' });
  }
};

// POST /api/users/login - Connexion
const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        message: 'Email et mot de passe requis',
      });
    }

    const user = await User.findOne({ email });

    if (!user) {
      return res.status(401).json({
        message: 'Identifiants invalides',
      });
    }

    // Vérification du mot de passe
    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return res.status(401).json({
        message: 'Identifiants invalides',
      });
    }

    return res.status(200).json({
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      token: generateToken(user._id.toString(), user.role),
    });
  } catch (err) {
    return res.status(500).json({
      message: 'Erreur interne du serveur',
    });
  }
};

// GET /api/users/profile - Profil protégé
const getUserProfile = async (req, res) => {
  try {
    return res.status(200).json(req.user);
  } catch (err) {
    return res.status(500).json({
      message: 'Erreur interne du serveur',
    });
  }
};

// GET /api/users - Récupérer tous les utilisateurs
// À protéger avec protect et adminOnly dans les routes
const getUsers = async (req, res) => {
  try {
    const users = await User.find().select('-password');

    return res.status(200).json(users);
  } catch (err) {
    return res.status(500).json({
      message: 'Erreur interne du serveur',
    });
  }
};

// POST /api/users - Créer un utilisateur sans mot de passe
const createUser = async (req, res) => {
  try {
    const { name, email, age } = req.body;

    if (!name || !email) {
      return res.status(400).json({
        message: 'Nom et email requis',
      });
    }

    const exists = await User.findOne({ email });

    if (exists) {
      return res.status(409).json({
        message: 'Cet email est déjà utilisé',
      });
    }

    // Cette fonction crée un utilisateur sans authentification.
    // Le modèle doit autoriser un utilisateur sans mot de passe.
    const user = await User.create({ name, email, age });

    return res.status(201).json({
      _id: user._id,
      name: user.name,
      email: user.email,
      age: user.age,
      role: user.role,
    });
  } catch (err) {
    if (err.name === 'ValidationError') {
      return res.status(400).json({ message: err.message });
    }

    return res.status(500).json({
      message: 'Erreur interne du serveur',
    });
  }
};

// GET /api/users/:id - Récupérer un utilisateur par ID
const getUserById = async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('-password');

    if (!user) {
      return res.status(404).json({
        message: 'Utilisateur introuvable',
      });
    }

    return res.status(200).json(user);
  } catch (err) {
    if (err.name === 'CastError') {
      return res.status(400).json({
        message: 'Identifiant utilisateur invalide',
      });
    }

    return res.status(500).json({
      message: 'Erreur interne du serveur',
    });
  }
};

// DELETE /api/users/:id - Supprimer un utilisateur
const deleteUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({
        message: 'Utilisateur introuvable',
      });
    }

    // Vérifier si l'utilisateur possède des articles
    const article = await Article.findOne({
      author: req.params.id,
    });

    if (article) {
      return res.status(400).json({
        message:
          'Impossible de supprimer cet utilisateur : supprimez d’abord ses articles.',
      });
    }

    await User.findByIdAndDelete(req.params.id);

    return res.status(200).json({
      message: 'Utilisateur supprimé avec succès',
    });
  } catch (err) {
    if (err.name === 'CastError') {
      return res.status(400).json({
        message: 'Identifiant utilisateur invalide',
      });
    }

    return res.status(500).json({
      message: 'Erreur interne du serveur',
    });
  }
};

// PUT /api/users/update-password
const updatePassword = async (req, res) => {
  try {
    const { oldPassword, newPassword } = req.body;

    if (!oldPassword || !newPassword) {
      return res.status(400).json({
        message: 'Ancien et nouveau mots de passe requis',
      });
    }

    if (newPassword.length < 8) {
      return res.status(400).json({
        message: 'Le nouveau mot de passe doit contenir au moins 8 caractères',
      });
    }

    // Récupérer l'utilisateur connecté
    const user = await User.findById(req.user._id);

    if (!user) {
      return res.status(404).json({
        message: 'Utilisateur introuvable',
      });
    }

    // Vérifier l'ancien mot de passe
    const isMatch = await bcrypt.compare(
      oldPassword,
      user.password
    );

    if (!isMatch) {
      return res.status(401).json({
        message: 'Ancien mot de passe incorrect',
      });
    }

    // Hacher le nouveau mot de passe
    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(newPassword, salt);

    // Sauvegarder les modifications
    await user.save();

    return res.status(200).json({
      message: 'Mot de passe modifié avec succès',
    });
  } catch (err) {
    return res.status(500).json({
      message: 'Erreur interne du serveur',
    });
  }
};

const updateUserRole = async (req, res) => {
  try {
    const { role } = req.body;

    if (!['user', 'admin'].includes(role)) {
      return res.status(400).json({
        message: 'Rôle invalide. Les rôles autorisés sont user et admin.',
      });
    }

    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({
        message: 'Utilisateur introuvable',
      });
    }

    user.role = role;
    await user.save();

    return res.status(200).json({
      message: 'Rôle modifié avec succès',
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (err) {
    if (err.name === 'CastError') {
      return res.status(400).json({
        message: 'Identifiant utilisateur invalide',
      });
    }

    return res.status(500).json({
      message: 'Erreur interne du serveur',
    });
  }
};

module.exports = {
  registerUser,
  loginUser,
  getUserProfile,
  getUsers,
  createUser,
  getUserById,
  deleteUser,
  updatePassword,
  updateUserRole,
};
