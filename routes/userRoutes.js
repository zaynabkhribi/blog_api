
const express = require('express');
const router = express.Router();

const userController = require('../controllers/userController');

const {
  registerUser,
  loginUser,
  getUserProfile,
    getUsers,
    createUser,
    getUserById,
    updatePassword,
    updateUserRole,
    deleteUser,
} = userController;

const { protect, adminOnly } = require('../middlewares/authMiddleware');

// Routes publiques d'authentification
router.post('/register', registerUser);
router.post('/login', loginUser);

// Route privée : profil de l'utilisateur connecté
router.get('/profile', protect, getUserProfile);

// Routes réservées aux administrateurs
router.get('/', protect, adminOnly, getUsers);
router.get('/:id', protect, adminOnly, getUserById);
router.post('/', protect, adminOnly, createUser);
router.delete('/:id', protect, adminOnly, deleteUser);
router.put('/update-password', protect, updatePassword);
router.put('/:id/role', protect, adminOnly, updateUserRole);

module.exports = router;
