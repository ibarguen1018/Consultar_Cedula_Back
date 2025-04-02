// src/index.js
require("dotenv").config();
const express = require("express");
const cors = require("cors");
const db = require("./firebaseService");
const fs = require("fs");
const path = require("path");

const app = express();
app.use(cors({
  origin: "https://consultar-cedula-front.onrender.com", 
}));

app.use(express.json());

// 1. Endpoint para migrar datos a Firestore (opcional, puedes ejecutarlo una sola vez)
app.get("/migrar", async (req, res) => {
  try {
    const rawData = fs.readFileSync(path.join(__dirname, "data.json"), "utf-8");
    const personas = JSON.parse(rawData);

    const batch = db.batch();
    personas.forEach((persona) => {
      const docRef = db.collection("personas").doc(persona.cedula);
      batch.set(docRef, persona);
    });
    await batch.commit();

    return res.status(200).json({ message: "Datos migrados con éxito" });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Error al migrar datos" });
  }
});

// 2. Endpoint para buscar persona por cédula
app.get("/buscar", async (req, res) => {
  try {
    const cedula = req.query.cedula;
    if (!cedula) {
      return res.status(400).json({ error: "Cédula no proporcionada" });
    }

    const docRef = db.collection("personas").doc(cedula);
    const doc = await docRef.get();

    if (!doc.exists) {
      return res.status(404).json({ error: "Persona no encontrada" });
    }

    return res.status(200).json(doc.data());
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Error al buscar persona" });
  }
});

// Iniciar servidor
const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Servidor corriendo en http://localhost:${PORT}`);
});
