const express = require ('express') ; // 1. charger la bibliothèque Express
const articleRoutes = require ('./routes/articleRoutes');
const dotenv= require ('dotenv');
const userRoutes = require ('./routes/userRoutes');
const connectDB = require('./config/db');

dotenv.config();
const app = express () ; // 2. créer l’ application : c’est notre serveur
const PORT = process.env.PORT || 3000;
// Middlewares globaux
app.use(express.json()); // indispensable pour lire le corps JSON (req.body)

// Montage du routeur sous le préfixe "/api/articles"
app.use("/api/articles", articleRoutes);
app.use("/api/users", userRoutes);

// Route d’accueil pour tester le statut général du serveur
app.get("/", (req, res) => {
  res.json({
    message: "API du Blog - Serveur Modulaire Opérationnel (SoC)"
  });
});

(async () => {
  try {
    await connectDB(process.env.MONGODB_URI);
    app.listen(PORT, () => {
          console.log(`MERN server running on http://localhost:${PORT}`);
  });

}
  catch (error) {
    console.error('(’Critical server startup error:', error.message);
    process.exit(1); // Arrête le processus avec un code d'erreur
  }
})();

