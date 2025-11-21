import type { Match, Player, PlayerMatchStatus } from './types';
// fix: Changed Role to PlayerRole to match the exported enum from types.ts
import { AttendanceStatus, PaymentStatus, PlayerRole } from './types';

const getTodayForBirthday = () => {
    const today = new Date();
    // Use a past year for realism
    const year = 1961;
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
};

export const PLAYERS_ROSTER: Player[] = [
    { id: 1, firstName: "Andres", lastName: "Álvares", nickname: "Araña", photoUrl: "", skillLevel: 4, role: PlayerRole.MEDIOCAMPO, pin: "1234", primaryPosition: "8 (MC)", birthDate: "1975-03-15" },
    { id: 2, firstName: "Sergio", lastName: "Alvarez", nickname: "Negrito", photoUrl: "", skillLevel: 4, role: PlayerRole.DEFENSA, pin: "1234", primaryPosition: "4 (LD)", birthDate: "1976-08-22" },
    { id: 3, firstName: "Luciano", lastName: "Baglietto", nickname: "Lucho", photoUrl: "", skillLevel: 4, role: PlayerRole.MEDIOCAMPO, pin: "1234", primaryPosition: "10 (MCO)", birthDate: "1978-05-10" },
    { id: 4, firstName: "Cesar", lastName: "Bantar", nickname: "Tota", photoUrl: "", skillLevel: 3, role: PlayerRole.DEFENSA, pin: "1234", primaryPosition: "3 (LI)", birthDate: "1974-11-30" },
    { id: 5, firstName: "Livio", lastName: "Cejas", nickname: "Betito", photoUrl: "", skillLevel: 4, role: PlayerRole.DELANTERO, pin: "1234", primaryPosition: "9 (DC)", birthDate: "1977-02-18" },
    { id: 6, firstName: "Jorge", lastName: "Cepeda", nickname: "Carucha", photoUrl: "", skillLevel: 4, role: PlayerRole.MEDIOCAMPO, pin: "1234", primaryPosition: "5 (MCD)", birthDate: "1975-09-25" },
    { id: 7, firstName: "Jorge", lastName: "Contino", nickname: "Copito", photoUrl: "", skillLevel: 3, role: PlayerRole.DEFENSA, pin: "1234", primaryPosition: "2 (DFC)", birthDate: "1976-04-12" },
    { id: 8, firstName: "Diego", lastName: "Couso", nickname: "Dieguiro", photoUrl: "", skillLevel: 4, role: PlayerRole.MEDIOCAMPO, pin: "1234", primaryPosition: "8 (MC)", birthDate: "1979-07-08" },
    { id: 9, firstName: "Leonardo", lastName: "Delgado", nickname: "Leito", photoUrl: "", skillLevel: 4, role: PlayerRole.DEFENSA, pin: "1234", primaryPosition: "6 (DFC)", birthDate: "1977-01-20" },
    { id: 10, firstName: "Ruben", lastName: "Delgado", nickname: "Fino", photoUrl: "", skillLevel: 3, role: PlayerRole.MEDIOCAMPO, pin: "1234", primaryPosition: "8 (MC)", birthDate: "1978-10-05" },
    { id: 11, firstName: "Sergio", lastName: "Di Nardo", nickname: "Serguito", photoUrl: "", skillLevel: 4, role: PlayerRole.DELANTERO, pin: "1234", primaryPosition: "7 (ED)", birthDate: "1976-12-14" },
    { id: 12, firstName: "Leonardo", lastName: "Dziecevich", nickname: "Ruso", photoUrl: "", skillLevel: 4, role: PlayerRole.DEFENSA, pin: "1234", primaryPosition: "4 (LD)", birthDate: "1975-06-28" },
    { id: 13, firstName: "Gabriel", lastName: "Gomes", nickname: "Gaby", photoUrl: "", skillLevel: 4, role: PlayerRole.MEDIOCAMPO, pin: "1234", primaryPosition: "10 (MCO)", birthDate: "1979-03-17" },
    { id: 14, firstName: "Adrian", lastName: "Grimaldi", nickname: "Pale", photoUrl: "", skillLevel: 3, role: PlayerRole.DEFENSA, pin: "1234", primaryPosition: "2 (DFC)", birthDate: "1977-08-09" },
    { id: 15, firstName: "Alberto", lastName: "Hansen", nickname: "Martín", photoUrl: "", skillLevel: 4, role: PlayerRole.MEDIOCAMPO, pin: "1234", primaryPosition: "5 (MCD)", birthDate: "1978-11-22" },
    { id: 16, firstName: "Ariel", lastName: "Insaurralde", nickname: "Arielo", photoUrl: "", skillLevel: 4, role: PlayerRole.DELANTERO, pin: "1234", primaryPosition: "9 (DC)", birthDate: "1976-05-30" },
    { id: 17, firstName: "Pablo", lastName: "Karlovich", nickname: "Tweety", photoUrl: "", skillLevel: 3, role: PlayerRole.ARQUERO, pin: "1234", primaryPosition: "1 (ARQ)", birthDate: "1975-02-11" },
    { id: 18, firstName: "Juan", lastName: "Labourdette", nickname: "Pelado", photoUrl: "", skillLevel: 4, role: PlayerRole.DEFENSA, pin: "1234", primaryPosition: "6 (DFC)", birthDate: "1977-09-19" },
    { id: 19, firstName: "Adrian", lastName: "Lescano", nickname: "El Doc", photoUrl: "", skillLevel: 4, role: PlayerRole.MEDIOCAMPO, pin: "1234", primaryPosition: "8 (MC)", birthDate: "1979-01-26" },
    { id: 20, firstName: "Jorge", lastName: "Lopez", nickname: "Pulpo", photoUrl: "", skillLevel: 3, role: PlayerRole.ARQUERO, pin: "1234", primaryPosition: "1 (ARQ)", birthDate: "1976-07-15" },
    { id: 21, firstName: "Ramon", lastName: "Martinez", nickname: "Tachi", photoUrl: "", skillLevel: 4, role: PlayerRole.DELANTERO, pin: "1234", primaryPosition: "11 (EI)", birthDate: "1978-04-03" },
    { id: 22, firstName: "Alfonso", lastName: "Mercado", nickname: "Capria", photoUrl: "", skillLevel: 4, role: PlayerRole.MEDIOCAMPO, pin: "1234", primaryPosition: "10 (MCO)", birthDate: "1977-12-08" },
    { id: 23, firstName: "Victor", lastName: "Montenegro", nickname: "El Viejo", photoUrl: "", skillLevel: 5, role: PlayerRole.DEFENSA, pin: "1234", primaryPosition: "2 (DFC)", birthDate: "1974-06-21" },
    { id: 24, firstName: "Jorge", lastName: "Morinigo", nickname: "Jogito", photoUrl: "", skillLevel: 4, role: PlayerRole.MEDIOCAMPO, pin: "1234", primaryPosition: "5 (MCD)", birthDate: "1979-10-12" },
    { id: 25, firstName: "Hugo", lastName: "Patiño", nickname: "Huguito", photoUrl: "", skillLevel: 3, role: PlayerRole.DELANTERO, pin: "1234", primaryPosition: "9 (DC)", birthDate: "1978-08-27" },
    { id: 26, firstName: "Miguel", lastName: "Vocal", nickname: "Ibarra", photoUrl: "", skillLevel: 4, role: PlayerRole.MEDIOCAMPO, pin: "1234", primaryPosition: "8 (MC)", birthDate: "1976-03-14" },
    { id: 27, firstName: "Pedro", lastName: "Zarate", nickname: "Guillote", photoUrl: "", skillLevel: 4, role: PlayerRole.DELANTERO, pin: "1234", primaryPosition: "7 (ED)", birthDate: "1977-11-05" },
    { id: 28, firstName: "Gustavo", lastName: "Zerfuz", nickname: "Pato", photoUrl: "", skillLevel: 4, role: PlayerRole.DEFENSA, pin: "1234", primaryPosition: "3 (LI)", birthDate: "1975-09-18" }
];

const INITIAL_PLAYER_STATUSES: PlayerMatchStatus[] = PLAYERS_ROSTER.map(player => ({
    playerId: player.id,
    attendanceStatus: AttendanceStatus.PENDING,
    paymentStatus: PaymentStatus.UNPAID,
    amountPaid: 0,
    goals: 0,
    yellowCards: 0,
    redCard: false,
    quartersPlayed: 0,
}));


// Function to get next Saturday's date
const getNextSaturday = (): string => {
    const today = new Date();
    const dayOfWeek = today.getDay(); // Sunday - 0, Monday - 1, ..., Saturday - 6
    const daysUntilSaturday = dayOfWeek === 6 ? 7 : (6 - dayOfWeek);
    const nextSaturday = new Date(today);
    nextSaturday.setDate(today.getDate() + daysUntilSaturday);
    
    return nextSaturday.toLocaleDateString('es-ES', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
    });
}


export const INITIAL_MATCHES: Match[] = [
    {
        id: 1,
        date: getNextSaturday().replace(/^\w/, (c) => c.toUpperCase()),
        time: '15:15',
        location: 'Estadio del Rojo, cancha 2',
        address: 'Alsina 1905, esquina Cordero, Avellaneda',
        courtFee: 45000,
        tournamentRound: 5,
        standings: [
            { id: 1, name: 'Tu Equipo', position: 2 },
            { id: 2, name: 'Rival de Torneo', position: 4 },
        ],
        playerStatuses: [...INITIAL_PLAYER_STATUSES],
        ratings: {},
        opponentScore: 0,
        status: 'PROGRAMADO',
    }
];