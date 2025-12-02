import { GoogleGenAI, Type } from "@google/genai";
import type { Player, Teams } from "../types";
import { PlayerRole } from "../types";


// Inicializar el cliente de Gemini con la API Key del entorno
// Se usa un getter seguro por si la env var no está definida para evitar crashes inmediatos,
// aunque la llamada fallará si no hay key.
const getApiKey = () => {
    try {
        return (import.meta as any).env?.API_KEY || '';
    } catch {
        return '';
    }
};

const ai = new GoogleGenAI({ apiKey: getApiKey() });

/**
 * Genera dos equipos equilibrados utilizando IA generativa.
 * Analiza roles, nivel de habilidad y posiciones para armar el mejor partido posible.
 */
export const generateTeamsAI = async (players: Player[]): Promise<Teams> => {
    // Filtrar al cuerpo técnico para que no sean incluidos en los equipos
    const fieldPlayers = players.filter(p => p.role !== PlayerRole.DT && p.role !== PlayerRole.AYUDANTE);
    
    // 1. Preparar la data para el modelo
    const playersList = fieldPlayers.map(p => ({
        name: `${p.firstName} ${p.lastName} (${p.nickname})`,
        role: p.role,
        skill: p.skillLevel
    }));

    // 2. Crear el prompt
    const prompt = `
        Actúa como un director técnico profesional de fútbol experto en balancear partidos.
        Tengo la siguiente lista de jugadores con sus roles y niveles de habilidad (1-5):
        ${JSON.stringify(playersList)}

        Tu tarea es dividir a estos jugadores en dos equipos (Equipo A y Equipo B) lo más equilibrados posible.
        Considera:
        1. Que la suma de niveles de habilidad sea similar en ambos equipos.
        2. Que los roles (Arqueros, Defensas, etc.) estén distribuidos equitativamente.
        3. Si hay arqueros, pon uno en cada equipo si es posible.

        Devuelve solo los nombres de los jugadores en el formato JSON solicitado.
    `;

    try {
        // 3. Llamar al modelo con responseSchema para JSON estricto
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        teamA: {
                            type: Type.ARRAY,
                            items: { type: Type.STRING },
                            description: "Lista de nombres completos de los jugadores del Equipo A"
                        },
                        teamB: {
                            type: Type.ARRAY,
                            items: { type: Type.STRING },
                            description: "Lista de nombres completos de los jugadores del Equipo B"
                        }
                    },
                    required: ["teamA", "teamB"]
                },
                temperature: 0.3, // Bajo para ser más analítico
            }
        });

        const jsonText = response.text;
        if (!jsonText) throw new Error("No se recibió respuesta de la IA");

        const parsedResult = JSON.parse(jsonText) as Teams;
        return parsedResult;

    } catch (error) {
        console.error("Error al generar equipos con IA:", error);
        // Fallback básico en caso de error de API
        return fallbackRandomTeams(fieldPlayers); // Usar la lista filtrada también en el fallback
    }
};

/**
 * Genera una frase motivacional para el equipo.
 */
export const generateMotivationalQuote = async (): Promise<string> => {
    const prompt = "Genera una frase motivacional corta, épica y con aliento para un equipo de fútbol amateur antes de su partido. Máximo 15 palabras. Solo el texto.";

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
        });

        const text = response.text;
        return text ? text.replace(/^"|"$/g, '').trim() : "Hoy es un buen día para ganar.";

    } catch (error) {
        console.error("Error al generar frase motivacional:", error);
        return "Juega con pasión, gana con honor.";
    }
};

// Fallback por si falla la API
const fallbackRandomTeams = (players: Player[]): Teams => {
    const playerNames = players.map(p => `${p.firstName} '${p.nickname}' ${p.lastName}`).sort(() => 0.5 - Math.random());
    const mid = Math.ceil(playerNames.length / 2);
    return {
        teamA: playerNames.slice(0, mid),
        teamB: playerNames.slice(mid)
    };
};