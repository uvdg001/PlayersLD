import { GoogleGenAI, Type } from "@google/genai";
import type { Player } from "../types";

const API_KEY = process.env.API_KEY;

// No inicializamos 'ai' aquí globalmente para evitar errores si la key falta al cargar el archivo.
const getAIClient = () => {
    if (!API_KEY) return null;
    return new GoogleGenAI({ apiKey: API_KEY });
};

export const getMotivationalQuote = async (): Promise<string> => {
    const ai = getAIClient();
    if (!ai) {
        console.warn("API_KEY faltante. Usando frase por defecto.");
        return "La mayor victoria es la amistad que forjamos en la cancha.";
    }
    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: 'Genera una frase motivacional corta, inspiradora y un poco divertida para un equipo de fútbol de amigos mayores de 50 años que juegan por diversión todos los sábados. El tono debe ser de camaradería y celebrar la experiencia sobre el resultado.',
        });
        
        return response.text.trim();
    } catch (error) {
        console.error("Error fetching motivational quote from Gemini:", error);
        return "En esta cancha, la edad es solo un número en la camiseta.";
    }
};

export const generateTeams = async (players: Player[]): Promise<{ teamA: string[], teamB: string[] }> => {
    const ai = getAIClient();
    
    const playersInfo = players.map(p => 
        `${p.firstName} '${p.nickname}' ${p.lastName} (Rol: ${p.role}, Habilidad: ${p.skillLevel}/5)`
    ).join('; ');
    
    if (!ai) {
        console.warn("API_KEY not set. Using fallback for team generation.");
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

        const jsonText = response.text.trim();
        const parsedResponse = JSON.parse(jsonText);
        
        // Ensure the response only contains valid player names
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