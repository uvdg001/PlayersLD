import { GoogleGenAI, Type } from "@google/genai";
import type { Player } from "../types";

// Helper para inicializar el cliente de forma segura.
const getGeminiClient = () => {
    const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
    if (!apiKey) {
        console.error("VITE_GEMINI_API_KEY no está definida. Las funciones de IA no funcionarán.");
        return null;
    }
    return new GoogleGenAI({ apiKey });
};

export const getMotivationalQuote = async (): Promise<string> => {
    const ai = getGeminiClient();
    if (!ai) return "En esta cancha, la edad es solo un número en la camiseta.";

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: 'Genera una frase motivacional corta, inspiradora y un poco divertida para un equipo de fútbol de amigos mayores de 50 años que juegan por diversión todos los sábados. El tono debe ser de camaradería y celebrar la experiencia sobre el resultado.',
        });
        
        return response.text?.trim() || "La mayor victoria es la amistad que forjamos en la cancha.";
    } catch (error) {
        console.error("Error fetching motivational quote from Gemini:", error);
        return "En esta cancha, la edad es solo un número en la camiseta.";
    }
};

export const generateTeams = async (players: Player[]): Promise<{ teamA: string[], teamB: string[] }> => {
    const playersInfo = players.map(p => 
        `${p.firstName} '${p.nickname}' ${p.lastName} (Rol: ${p.role}, Habilidad: ${p.skillLevel}/5)`
    ).join('; ');
    
    const ai = getGeminiClient();
    if (!ai) {
        alert("La API de IA no está configurada. Se armarán los equipos de forma aleatoria.");
        // Fallback a lógica aleatoria si no hay cliente.
        const playerNames = players.map(p => `${p.firstName} '${p.nickname}' ${p.lastName}`);
        const mid = Math.ceil(playerNames.length / 2);
        return {
            teamA: playerNames.slice(0, mid),
            teamB: playerNames.slice(mid)
        };
    }

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: `Eres un director técnico experimentado y justo. Tu tarea es armar dos equipos de fútbol para un partido amistoso entre amigos. A partir de la siguiente lista de jugadores, con su rol y nivel de habilidad, crea dos equipos (Equipo A y Equipo B) lo más equilibrados posible. Prioriza balancear la habilidad total y la cantidad de jugadores por rol en cada equipo. Devuelve solo los nombres completos de los jugadores. La lista es: ${playersInfo}.`,
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        teamA: {
                            type: Type.ARRAY,
                            items: { type: Type.STRING },
                            description: 'Nombres de los jugadores del primer equipo.'
                        },
                        teamB: {
                            type: Type.ARRAY,
                            items: { type: Type.STRING },
                            description: 'Nombres de los jugadores del segundo equipo.'
                        }
                    },
                    required: ["teamA", "teamB"]
                }
            }
        });

        const jsonText = response.text?.trim();
        if (!jsonText) {
            throw new Error("Received empty response from Gemini API.");
        }
        const parsedResponse = JSON.parse(jsonText);
        
        const allPlayerNames = players.map(p => `${p.firstName} '${p.nickname}' ${p.lastName}`);
        const filterTeam = (team: any[]) => Array.isArray(team) ? team.filter(name => typeof name === 'string' && allPlayerNames.includes(name)) : [];

        return {
          teamA: filterTeam(parsedResponse.teamA),
          teamB: filterTeam(parsedResponse.teamB),
        };

    } catch (error) {
        console.error("Error generating teams with Gemini:", error);
        alert("Hubo un error con la IA. Se armarán los equipos de forma aleatoria.");
        const playerNames = players.map(p => `${p.firstName} '${p.nickname}' ${p.lastName}`);
        const mid = Math.ceil(playerNames.length / 2);
        return {
            teamA: playerNames.slice(0, mid),
            teamB: playerNames.slice(mid)
        };
    }
};