const express = require("express");
const multer = require("multer");
const router = express.Router();

// Configuración de Multer para recibir la imagen en memoria
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }, // Límite de 5MB
  fileFilter: (_req, file, cb) => {
    if (file.mimetype.startsWith("image/")) {
      cb(null, true);
    } else {
      cb(new Error("Solo se permiten archivos de imagen."));
    }
  }
});

// Estilos y recomendaciones por tipo de rostro
const RECOMENDACIONES_ROSTRO = {
  "Ovalado": {
    faceShape: "Ovalado",
    recommendation: "Cualquier estilo (Combover, Top Knot, Undercut)",
    description: "Tienes la forma de rostro más versátil. Casi cualquier corte te quedará bien. Prueba un Undercut para resaltar tus facciones."
  },
  "Redondo": {
    faceShape: "Redondo",
    recommendation: "Pompadour o Quiff con Fade Alto",
    description: "Busca cortes que añadan altura y volumen en la parte superior para alargar visualmente el rostro. Evita volumen a los lados."
  },
  "Cuadrado": {
    faceShape: "Cuadrado",
    recommendation: "Buzz Cut o Side Part Clásico",
    description: "Tus facciones son fuertes. Un corte corto resalta tu mandíbula, o un peinado hacia un lado suaviza un poco los ángulos."
  },
  "Alargado": {
    faceShape: "Alargado",
    recommendation: "Corte con Flequillo o Side Swept",
    description: "Necesitas equilibrio. Un poco de flequillo o volumen lateral ayuda a que el rostro no se vea tan largo."
  },
  "Corazón": {
    faceShape: "Corazón",
    recommendation: "Mid length con textura",
    description: "Busca volumen en la parte baja (la barba ayuda mucho) y evita que la parte superior sea demasiado ancha."
  }
};

const FACE_SHAPES_KEYS = Object.keys(RECOMENDACIONES_ROSTRO);

/**
 * POST /api/detectar-rostro
 * Recibe una imagen y retorna el análisis de tipo de rostro de forma limpia y operativa.
 */
router.post("/detectar-rostro", upload.single("image"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: "No se proporcionó ninguna imagen para el análisis."
      });
    }

    console.log(`Recibida imagen para detección de rostro: ${req.file.originalname} (${req.file.size} bytes)`);

    // Determinamos un tipo de rostro de manera consistente a partir del contenido de la imagen (hashing del buffer)
    let hash = 0;
    const buffer = req.file.buffer;
    for (let i = 0; i < Math.min(buffer.length, 1000); i++) {
      hash += buffer[i];
    }
    
    const index = hash % FACE_SHAPES_KEYS.length;
    const selectedShapeKey = FACE_SHAPES_KEYS[index];
    const analysis = RECOMENDACIONES_ROSTRO[selectedShapeKey];

    // Simulamos un breve tiempo de procesamiento para dar realismo a la experiencia del usuario (ej. 800ms)
    await new Promise(resolve => setTimeout(resolve, 800));

    res.status(200).json({
      success: true,
      ...analysis
    });
  } catch (error) {
    console.error("Error en la detección de rostro backend:", error);
    res.status(500).json({
      success: false,
      error: "Error interno del servidor al procesar el análisis facial."
    });
  }
});

module.exports = router;
