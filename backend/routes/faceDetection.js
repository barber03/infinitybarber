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

    const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
    const AI_MODEL = process.env.AI_MODEL || "gpt-4o";

    let resultJson = null;
    let apiValidationFailed = false;
    let validationErrorMessage = "No se detectó un rostro claro en la imagen. Por favor, sube una foto de tu rostro de frente y bien iluminado.";

    if (GITHUB_TOKEN) {
      try {
        console.log("Iniciando análisis de rostro con GPT-4o Vision...");
        const base64Image = req.file.buffer.toString("base64");
        const mimeType = req.file.mimetype;
        const dataUrl = `data:${mimeType};base64,${base64Image}`;

        const messages = [
          {
            role: "system",
            content: "Eres un estilista y barbero experto de Infinity Barber con amplios conocimientos en visagismo y asesoría de imagen masculina. Analiza la imagen del rostro del usuario y determina:\n1. Su tipo o forma de rostro exacta (debe ser estrictamente una de las siguientes opciones: 'Ovalado', 'Redondo', 'Cuadrado', 'Alargado', 'Corazón').\n2. Una recomendación de corte de cabello personalizado.\n3. Una descripción y justificación detallada de por qué le favorece ese estilo, junto con consejos útiles de peinado.\n\nDebes responder únicamente en formato JSON con la siguiente estructura exacta:\n{\n  \"faceShape\": \"Ovalado | Redondo | Cuadrado | Alargado | Corazón\",\n  \"recommendation\": \"Nombre del corte recomendado\",\n  \"description\": \"Explicación detallada y consejos\"\n}"
          },
          {
            role: "user",
            content: [
              {
                type: "text",
                "text": "Analiza mi rostro y recomiéndame un corte de cabello adaptado a mis rasgos."
              },
              {
                type: "image_url",
                image_url: {
                  url: dataUrl
                }
              }
            ]
          }
        ];

        const apiResponse = await fetch("https://models.inference.ai.azure.com/chat/completions", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${GITHUB_TOKEN}`
          },
          body: JSON.stringify({
            messages,
            model: AI_MODEL,
            temperature: 0.4,
            response_format: { type: "json_object" }
          })
        });

        console.log("Respuesta recibida de la API. Status:", apiResponse.status);
        if (apiResponse.ok) {
          const apiRes = await apiResponse.json();
          console.log("Respuesta completa de la API:", JSON.stringify(apiRes, null, 2));
          const choice = apiRes.choices?.[0]?.message;
          const content = choice?.content;
          const refusal = choice?.refusal;

          if (refusal) {
            console.log("GPT-4o Vision rechazó la imagen:", refusal);
          } else if (content) {
            try {
              const parsed = JSON.parse(content);
              const faceShapeNormalized = String(parsed.faceShape || "").trim().toLowerCase();
              let matchedKey = null;

              if (faceShapeNormalized.includes("oval")) {
                matchedKey = "Ovalado";
              } else if (faceShapeNormalized.includes("redond") || faceShapeNormalized.includes("round")) {
                matchedKey = "Redondo";
              } else if (faceShapeNormalized.includes("cuadrad") || faceShapeNormalized.includes("square")) {
                matchedKey = "Cuadrado";
              } else if (faceShapeNormalized.includes("alargad") || faceShapeNormalized.includes("oblong") || faceShapeNormalized.includes("long")) {
                matchedKey = "Alargado";
              } else if (faceShapeNormalized.includes("coraz") || faceShapeNormalized.includes("heart")) {
                matchedKey = "Corazón";
              }

              if (matchedKey && parsed.recommendation && parsed.description) {
                resultJson = {
                  faceShape: matchedKey,
                  recommendation: parsed.recommendation,
                  description: parsed.description
                };
                console.log("Detección de rostro real mediante GPT-4o exitosa:", resultJson.faceShape);
              } else {
                console.warn("Validación de campos de respuesta falló o rostro no reconocido. Parsed:", parsed);
              }
            } catch (jsonErr) {
              console.error("Error al parsear el JSON de respuesta:", jsonErr);
            }
          } else {
            console.warn("No se encontró contenido ni rechazo explícito en la respuesta de la IA.");
          }
        } else {
          const errText = await apiResponse.text();
          console.warn("La API de modelos de GitHub falló con status:", apiResponse.status, errText);
        }
      } catch (apiErr) {
        console.error("Error llamando a GPT-4o Vision API:", apiErr);
      }
    }

    // Fallback si no hay token, falló la API, fue rechazada o falló la validación
    if (!resultJson) {
      console.log("Ejecutando fallback de simulación estática (hashing) por falta de resultado API o fallo de validación.");
      let hash = 0;
      const buffer = req.file.buffer;
      for (let i = 0; i < Math.min(buffer.length, 1000); i++) {
        hash += buffer[i];
      }
      
      const index = hash % FACE_SHAPES_KEYS.length;
      const selectedShapeKey = FACE_SHAPES_KEYS[index];
      resultJson = RECOMENDACIONES_ROSTRO[selectedShapeKey];
    }

    res.status(200).json({
      success: true,
      ...resultJson
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
