
import type { Player, Teams, Match } from "../types.ts";
import { PlayerRole, AttendanceStatus } from "../types.ts";

/**
 * Genera dos equipos basados en el Plan A: Simetría de Dorsales.
 * Enfrenta jugadores con el mismo número y equilibra el resto por roles.
 */
export const generateTeamsAI = async (players: Player[], currentMatch?: Match): Promise<Teams> => {
    await new Promise(resolve => setTimeout(resolve, 1000));

    // 1. Filtrar solo los jugadores CONFIRMADOS para este partido
    // Si no hay partido definido, tomamos a todos los que no son staff
    let pool: Player[] = [];
    if (currentMatch) {
        pool = players.filter(p => 
            currentMatch.playerStatuses.some(ps => ps.playerId === p.id && ps.attendanceStatus === AttendanceStatus.CONFIRMED) &&
            p.role !== PlayerRole.DT && p.role !== PlayerRole.AYUDANTE
        );
    } else {
        pool = players.filter(p => p.role !== PlayerRole.DT && p.role !== PlayerRole.AYUDANTE);
    }

    if (pool.length === 0) return { teamA: [], teamB: [] };

    const teamA: Player[] = [];
    const teamB: Player[] = [];

    // 2. Separar Arqueros (Por rol o Dorsal 1)
    const keepers = pool.filter(p => p.role === PlayerRole.ARQUERO || p.jerseyNumber === 1);
    const rest = pool.filter(p => p.role !== PlayerRole.ARQUERO && p.jerseyNumber !== 1);

    keepers.forEach((k, idx) => {
        if (idx % 2 === 0) teamA.push(k);
        else teamB.push(k);
    });

    // 3. Agrupar el resto por número de dorsal
    const byNumber: Record<number, Player[]> = {};
    rest.forEach(p => {
        const num = p.jerseyNumber || 999; // 999 para los que no tienen número
        if (!byNumber[num]) byNumber[num] = [];
        byNumber[num].push(p);
    });

    const singletons: Player[] = [];

    Object.entries(byNumber).forEach(([num, group]) => {
        if (num === "999") {
            singletons.push(...group);
            return;
        }

        // Si hay 2 o más del mismo número, repartimos los primeros 2
        if (group.length >= 2) {
            const shuffledGroup = [...group].sort(() => 0.5 - Math.random());
            teamA.push(shuffledGroup[0]);
            teamB.push(shuffledGroup[1]);
            // Los que sobran del grupo (triples) van a la bolsa de balanceo
            if (shuffledGroup.length > 2) {
                singletons.push(...shuffledGroup.slice(2));
            }
        } else {
            singletons.push(group[0]);
        }
    });

    // 4. Repartir el resto (singletons) buscando balance de roles
    // Ordenamos por rol: Defensa -> Medio -> Delantero
    const roleOrder = [
        PlayerRole.DEFENSOR_CENTRAL, PlayerRole.LATERAL_DERECHO, PlayerRole.LATERAL_IZQUIERDO,
        PlayerRole.MEDIOCAMPISTA_DEFENSIVO, PlayerRole.MEDIOCAMPISTA_CENTRAL, PlayerRole.MEDIOCAMPISTA_OFENSIVO,
        PlayerRole.EXTREMO_DERECHO, PlayerRole.EXTREMO_IZQUIERDO, PlayerRole.DELANTERO_CENTRO
    ];

    const sortedSingletons = singletons.sort((a, b) => {
        const idxA = roleOrder.indexOf(a.role);
        const idxB = roleOrder.indexOf(b.role);
        return idxA - idxB;
    });

    sortedSingletons.forEach(p => {
        // Asignamos al equipo que tenga menos gente en ese momento
        if (teamA.length <= teamB.length) teamA.push(p);
        else teamB.push(p);
    });

    return { teamA, teamB };
};

/**
 * Devuelve una frase motivacional de una lista local.
 */
export const generateMotivationalQuote = async (): Promise<string> => {
    const quotes = [
        "Hoy es un buen día para ganar.",
        "El talento gana partidos, pero el trabajo en equipo gana campeonatos.",
        "No cuentes los días, haz que los días cuenten.",
        "La actitud es una pequeña cosa que hace una gran diferencia.",
        "Juega con pasión, gana con honor.",
        "Si no pierdes, no puedes disfrutar de las victorias.",
        "El fútbol es lo más importante de las cosas menos importantes.",
        "Suda la camiseta.",
        "Lo difícil se hace, lo imposible se intenta."
    ];
    return quotes[Math.floor(Math.random() * quotes.length)];
};
