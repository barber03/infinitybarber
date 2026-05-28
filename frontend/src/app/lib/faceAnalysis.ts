export type FaceShape = "Ovalado" | "Redondo" | "Cuadrado" | "Alargado" | "Corazón";

export interface AnalysisResult {
  faceShape: FaceShape;
  recommendation: string;
  description: string;
}

/**
 * Calcula la distancia euclidiana entre dos puntos.
 */
const getDistance = (p1: { x: number; y: number }, p2: { x: number; y: number }) => {
  return Math.sqrt(Math.pow(p2.x - p1.x, 2) + Math.pow(p2.y - p1.y, 2));
};

/**
 * Analiza los landmarks de face-api.js para determinar la forma del rostro.
 * @param landmarks Array de 68 puntos faciales
 */
export const analyzeFaceShape = (landmarks: any[]): AnalysisResult => {
  // Puntos clave (0-indexed)
  const jawline = landmarks.slice(0, 17);
  const leftBrow = landmarks[17];
  const rightBrow = landmarks[26];
  const chin = landmarks[8];
  const leftCheek = landmarks[2];
  const rightCheek = landmarks[14];
  const leftJaw = landmarks[4];
  const rightJaw = landmarks[12];
  const noseBridge = landmarks[27];

  // Medidas básicas
  const faceWidth = getDistance(leftCheek, rightCheek);
  const jawWidth = getDistance(leftJaw, rightJaw);
  const foreheadWidth = getDistance(leftBrow, rightBrow);
  // Usamos el puente de la nariz al mentón como proxy de altura ya que los 68 landmarks 
  // no llegan al nacimiento del cabello.
  const faceHeight = getDistance(noseBridge, chin) * 1.5; 

  const heightWidthRatio = faceHeight / faceWidth;
  const jawCheekRatio = jawWidth / faceWidth;

  let faceShape: FaceShape = "Ovalado";

  // Heurística de clasificación
  if (heightWidthRatio > 1.7) {
    faceShape = "Alargado";
  } else if (heightWidthRatio < 1.25) {
    if (jawCheekRatio > 0.8) {
        faceShape = "Cuadrado";
    } else {
        faceShape = "Redondo";
    }
  } else {
    // Rango medio (1.25 - 1.7)
    if (foreheadWidth > faceWidth * 0.9) {
        faceShape = "Corazón";
    } else {
        faceShape = "Ovalado";
    }
  }

  return getRecommendation(faceShape);
};

const getRecommendation = (shape: FaceShape): AnalysisResult => {
  switch (shape) {
    case "Redondo":
      return {
        faceShape: "Redondo",
        recommendation: "Pompadour o Quiff con Fade Alto",
        description: "Busca cortes que añadan altura y volumen en la parte superior para alargar visualmente el rostro. Evita volumen a los lados.",
      };
    case "Cuadrado":
      return {
        faceShape: "Cuadrado",
        recommendation: "Buzz Cut o Side Part Clásico",
        description: "Tus facciones son fuertes. Un corte corto resalta tu mandíbula, o un peinado hacia un lado suaviza un poco los ángulos.",
      };
    case "Alargado":
      return {
        faceShape: "Alargado",
        recommendation: "Corte con Flequillo o Side Swept",
        description: "Necesitas equilibrio. Un poco de flequillo o volumen lateral ayuda a que el rostro no se vea tan largo.",
      };
    case "Corazón":
      return {
        faceShape: "Corazón",
        recommendation: "Mid length con textura",
        description: "Busca volumen en la parte baja (barba ayuda mucho) y evita que la parte superior sea demasiado ancha.",
      };
    case "Ovalado":
    default:
      return {
        faceShape: "Ovalado",
        recommendation: "Cualquier estilo (Combover, Top Knot, Undercut)",
        description: "Tienes la forma de rostro más versátil. Casi cualquier corte te quedará bien. Prueba un Undercut para resaltar tus facciones.",
      };
  }
};
