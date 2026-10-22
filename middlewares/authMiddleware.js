
const jwt = require('jsonwebtoken');
const User = require('../models/userModel');

// 1. Protection des routes privées : vérifie la validité du JWT
const protect = async (req, res, next) => {
  let token;

  // Vérification de la présence de l'en-tête Authorization avec Bearer
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer ')
  ) {
    try {
      // Extraction du token (après "Bearer ")
      token = req.headers.authorization.split(' ')[1];

      // Vérification cryptographique de la signature avec le secret
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      // Récupération de l'utilisateur associé (exclusion du mot de passe)
      req.user = await User.findById(decoded.id).select('-password');

      if (!req.user) {
        return res.status(401).json({
          message: 'Not authorized, user not found',
        });
      }

      // Passage au middleware ou contrôleur suivant
      return next();
    
} catch (err) {
  if (err.name === 'TokenExpiredError') {
    return res.status(401).json({
      message: 'Your session has expired. Please log in again.',
    });
  }

  return res.status(401).json({
    message: 'Not authorized, token failed',
  });
}
  }


  // Si aucun en-tête Authorization n'est fourni
  return res.status(401).json({
    message: 'Not authorized, no token provided',
  });
};

// 2. Contrôle d'accès basé sur les rôles (RBAC) : réservé aux administrateurs
const adminOnly = (req, res, next) => {
  if (req.user && req.user.role === 'admin') {
    return next();
  }

  return res.status(403).json({
    message: 'Access denied : admin rights required',
  });
};

module.exports = { protect, adminOnly };
