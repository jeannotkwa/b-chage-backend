// Script d'initialisation de la base de données
// À exécuter après avoir créé le schéma

const mysql = require("mysql2/promise")
const bcrypt = require("bcryptjs")
const fs = require("fs")
const path = require("path")

async function initializeDatabase() {
  try {
    // Connexion à la base de données
    const connection = await mysql.createConnection({
      host: process.env.MYSQL_HOST || "localhost",
      user: process.env.MYSQL_USER || "root",
      password: process.env.MYSQL_PASSWORD || "",
      multipleStatements: true,
    })

    console.log("Connexion à MySQL établie")

    // Création de la base de données si elle n'existe pas
    await connection.query("CREATE DATABASE IF NOT EXISTS bureau_de_change")
    console.log("Base de données créée ou déjà existante")

    // Utilisation de la base de données
    await connection.query("USE bureau_de_change")

    // Lecture du fichier de schéma
    const schemaPath = path.join(__dirname, "schema.sql")
    const schema = fs.readFileSync(schemaPath, "utf8")

    // Exécution du script de schéma
    await connection.query(schema)
    console.log("Schéma de base de données créé avec succès")

    // Vérification si l'utilisateur admin existe déjà
    const [adminUsers] = await connection.query('SELECT id FROM users WHERE username = "admin"')

    if (adminUsers.length === 0) {
      // Création de l'utilisateur admin si non existant
      const hashedPassword = await bcrypt.hash("admin123", 10)
      await connection.query(
        "INSERT INTO users (username, password, full_name, role, created_at) VALUES (?, ?, ?, ?, NOW())",
        ["admin", hashedPassword, "Administrateur", "admin"],
      )
      console.log("Utilisateur admin créé avec succès")
    } else {
      console.log("Utilisateur admin déjà existant")
    }

    // Fermeture de la connexion
    await connection.end()
    console.log("Initialisation de la base de données terminée avec succès")
  } catch (error) {
    console.error("Erreur lors de l'initialisation de la base de données:", error)
    process.exit(1)
  }
}

// Exécution de la fonction d'initialisation
initializeDatabase()
