
import React, { lazy } from 'react';
import type { Player, MyTeam, AppSettings, GameIdea } from './types.ts';
import { PlayerRole } from './types.ts';

export interface GameCatalogItem {
    id: string;
    title: string;
    description: string;
    icon: string;
    color: string;
    component: React.LazyExoticComponent<React.FC<any>>;
    isTrivia?: boolean;
    triviaMode?: 'CALENDAR' | 'SCOUT' | 'RADIO';
}

// Registro de Juegos para Lazy Loading
export const GAME_CATALOG: GameCatalogItem[] = [
    { 
        id: 'MAGIC_LINES', 
        title: 'Magic Lines LD', 
        description: 'Dibuja el camino • Puzzle Físico', 
        icon: '🪄', 
        color: 'from-purple-600 to-indigo-900',
        component: lazy(() => import('./components/games/LDMagicLines').then(m => ({ default: m.LDMagicLines })))
    },
    { 
        id: 'BOWLING', 
        title: 'Bowling LD', 
        description: 'Efecto y Potencia • Voltea al Equipo', 
        icon: '🎳', 
        color: 'from-blue-600 to-indigo-900',
        component: lazy(() => import('./components/games/LDBowling').then(m => ({ default: m.LDBowling })))
    },
    { 
        id: 'SEQUENCE', 
        title: 'Secuencia LD', 
        description: 'Memoria Visual • 4, 6 y 8 pasos', 
        icon: '🧠', 
        color: 'from-cyan-600 to-blue-900',
        component: lazy(() => import('./components/games/LDSequence').then(m => ({ default: m.LDSequence })))
    },
    { 
        id: 'PUZZLE', 
        title: 'Puzzle LD', 
        description: 'Rompecabezas • 3 Niveles', 
        icon: '🧩', 
        color: 'from-amber-500 to-orange-700',
        component: lazy(() => import('./components/games/LDPuzzle').then(m => ({ default: m.LDPuzzle })))
    },
    { 
        id: 'DRIBBLER', 
        title: 'Dribelador LD', 
        description: 'Arcade de Reacción • 35s', 
        icon: '⚽', 
        color: 'from-indigo-600 to-blue-800',
        component: lazy(() => import('./components/games/LDDribbler').then(m => ({ default: m.LDDribbler })))
    },
    { 
        id: 'MAHJONG', 
        title: 'Parejas LD', 
        description: 'Memoria y Rapidez', 
        icon: '🃏', 
        color: 'from-green-600 to-teal-800',
        component: lazy(() => import('./components/games/LDMahjong').then(m => ({ default: m.LDMahjong })))
    },
    { 
        id: 'PENALTIES', 
        title: 'Penales LD', 
        description: 'Puntería • 30s', 
        icon: '🥅', 
        color: 'from-green-700 to-emerald-900',
        component: lazy(() => import('./components/games/LDPenalties').then(m => ({ default: m.LDPenalties })))
    },
    { 
        id: 'TRIVIA_CAL', 
        title: 'Trivia: Cumples', 
        description: '¿Conocés a tus amigos?', 
        icon: '📅', 
        color: 'from-purple-600 to-indigo-800',
        isTrivia: true,
        triviaMode: 'CALENDAR',
        component: lazy(() => import('./components/games/LDTrivia').then(m => ({ default: m.LDTrivia })))
    },
    { 
        id: 'TRIVIA_SCOUT', 
        title: 'Trivia: Roles', 
        description: '¿Quién juega de qué?', 
        icon: '🔍', 
        color: 'from-pink-600 to-rose-800',
        isTrivia: true,
        triviaMode: 'SCOUT',
        component: lazy(() => import('./components/games/LDTrivia').then(m => ({ default: m.LDTrivia })))
    },
    { 
        id: 'TRIVIA_RADIO', 
        title: 'Trivia: Radio', 
        description: '¿Quién dijo qué en el chat?', 
        icon: '📻', 
        color: 'from-yellow-600 to-orange-800',
        isTrivia: true,
        triviaMode: 'RADIO',
        component: lazy(() => import('./components/games/LDTrivia').then(m => ({ default: m.LDTrivia })))
    }
];

export const NEW_TEAM_INITIAL_PLAYER: Player = {
    id: 1,
    firstName: 'ADMIN',
    lastName: 'INICIAL',
    nickname: 'CAPITÁN',
    pin: '0000',
    photoUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Admin&backgroundColor=4f46e5',
    role: PlayerRole.DT,
    skillLevel: 5,
    birthDate: '1990-01-01',
    isSuperAdmin: true
};

export const INITIAL_PLAYERS: Player[] = [
    { id: 1, firstName: 'Leonardo', lastName: 'Delgado', nickname: 'Leito', pin: '0000', photoUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Leito&backgroundColor=b6e3f4', role: PlayerRole.MEDIOCAMPISTA_CENTRAL, skillLevel: 5, birthDate: '1980-01-01', isSuperAdmin: true },
    { id: 2, firstName: 'Sergio', lastName: 'Alvarez', nickname: 'Negrito', pin: '0000', photoUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Negrito&backgroundColor=c0aede', role: PlayerRole.MEDIOCAMPISTA_DEFENSIVO, skillLevel: 3, birthDate: '1980-01-01' },
    { id: 3, firstName: 'Andres', lastName: 'Álvarez', nickname: 'Andrelo', pin: '0000', photoUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Andrelo&backgroundColor=b6e3f4', role: PlayerRole.LATERAL_IZQUIERDO, skillLevel: 3, birthDate: '1980-01-01' },
    { id: 4, firstName: 'Luciano', lastName: 'Baglietto', nickname: 'Lucho', pin: '0000', photoUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Lucho&backgroundColor=ffdfbf', role: PlayerRole.DEFENSOR_CENTRAL, skillLevel: 4, birthDate: '1980-01-01' },
    { id: 5, firstName: 'Cesar', lastName: 'Bantar', nickname: 'Tota', pin: '0000', photoUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Tota&backgroundColor=d1d4f9', role: PlayerRole.MEDIOCAMPISTA_CENTRAL, skillLevel: 3, birthDate: '1980-01-01' },
    { id: 6, firstName: 'Gabriel', lastName: 'Brasenas', nickname: 'Gaby Arco', pin: '0000', photoUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=GabyArco&backgroundColor=ffd5dc&accessories=glasses', role: PlayerRole.ARQUERO, skillLevel: 5, birthDate: '1980-01-01' },
    { id: 7, firstName: 'Livio', lastName: 'Cejas', nickname: 'Betito', pin: '0000', photoUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Betito&backgroundColor=c0aede', role: PlayerRole.EXTREMO_DERECHO, skillLevel: 4, birthDate: '1980-01-01' },
    { id: 8, firstName: 'Jorge', lastName: 'Cepeda', nickname: 'Carucha', pin: '0000', photoUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Carucha&backgroundColor=b6e3f4', role: PlayerRole.DELANTERO_CENTRO, skillLevel: 3, birthDate: '1980-01-01' },
    { id: 9, firstName: 'Jorge', lastName: 'Contino', nickname: 'Copito', pin: '0000', photoUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Copito&backgroundColor=ffdfbf', role: PlayerRole.LATERAL_DERECHO, skillLevel: 3, birthDate: '1980-01-01' },
    { id: 10, firstName: 'Diego', lastName: 'Couso', nickname: 'Dieguito', pin: '0000', photoUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Dieguito&backgroundColor=d1d4f9', role: PlayerRole.MEDIOCAMPISTA_OFENSIVO, skillLevel: 4, birthDate: '1980-01-01' },
    { id: 11, firstName: 'Ruben', lastName: 'Delgado', nickname: 'Fino', pin: '0000', photoUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Fino&backgroundColor=ffd5dc', role: PlayerRole.DEFENSOR_CENTRAL, skillLevel: 4, birthDate: '1980-01-01' },
    { id: 13, firstName: 'Sergio', lastName: 'Di Nardo', nickname: 'Sergito', pin: '0000', photoUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Sergito&backgroundColor=b6e3f4', role: PlayerRole.LATERAL_IZQUIERDO, skillLevel: 3, birthDate: '1980-01-01' },
    { id: 14, firstName: 'Leonardo', lastName: 'Dziecevich', nickname: 'Ruso', pin: '0000', photoUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Ruso&backgroundColor=ffdfbf', role: PlayerRole.DEFENSOR_CENTRAL, skillLevel: 4, birthDate: '1980-01-01' },
    { id: 15, firstName: 'Gabriel', lastName: 'Gomes', nickname: 'Gaby', pin: '0000', photoUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Gaby&backgroundColor=d1d4f9', role: PlayerRole.MEDIOCAMPISTA_OFENSIVO, skillLevel: 3, birthDate: '1980-01-01' },
    { id: 16, firstName: 'Adrian', lastName: 'Grimaldi', nickname: 'Palermo', pin: '0000', photoUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Palermo&backgroundColor=ffd5dc', role: PlayerRole.DELANTERO_CENTRO, skillLevel: 4, birthDate: '1980-01-01' },
    { id: 17, firstName: 'Alberto', lastName: 'Hansen', nickname: 'Tincho', pin: '0000', photoUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Tincho&backgroundColor=c0aede', role: PlayerRole.DEFENSOR_CENTRAL, skillLevel: 3, birthDate: '1980-01-01' },
    { id: 18, firstName: 'Ariel', lastName: 'Insaurralde', nickname: 'Arielo', pin: '0000', photoUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Arielo&backgroundColor=b6e3f4', role: PlayerRole.MEDIOCAMPISTA_DEFENSIVO, skillLevel: 3, birthDate: '1980-01-01' },
    { id: 19, firstName: 'Pablo', lastName: 'Karlovich', nickname: 'Tweety', pin: '0000', photoUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Tweety&backgroundColor=ffdfbf', role: PlayerRole.EXTREMO_IZQUIERDO, skillLevel: 4, birthDate: '1980-01-01' },
    { id: 20, firstName: 'Juan', lastName: 'Labourdette', nickname: 'Pelado', pin: '0000', photoUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Pelado&backgroundColor=d1d4f9', role: PlayerRole.DEFENSOR_CENTRAL, skillLevel: 3, birthDate: '1980-01-01' },
    { id: 21, firstName: 'Adrian', lastName: 'Lescano', nickname: 'Doc', pin: '0000', photoUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Doc&backgroundColor=ffd5dc', role: PlayerRole.MEDIOCAMPISTA_CENTRAL, skillLevel: 3, birthDate: '1980-01-01' },
    { id: 22, firstName: 'Jorge', lastName: 'Lopez', nickname: 'Pulpo', pin: '0000', photoUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Pulpo&backgroundColor=c0aede', role: PlayerRole.ARQUERO, skillLevel: 4, birthDate: '1980-01-01' },
    { id: 23, firstName: 'Ramon', lastName: 'Martinez', nickname: 'Taci', pin: '0000', photoUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Taci&backgroundColor=b6e3f4', role: PlayerRole.LATERAL_DERECHO, skillLevel: 3, birthDate: '1980-01-01' },
    { id: 24, firstName: 'Alfonso', lastName: 'Mercado', nickname: 'Capria', pin: '0000', photoUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Capria&backgroundColor=ffdfbf', role: PlayerRole.MEDIOCAMPISTA_OFENSIVO, skillLevel: 4, birthDate: '1980-01-01' },
    { id: 25, firstName: 'Victor', lastName: 'Montenegro', nickname: 'El viejo', pin: '0000', photoUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Elviejo&backgroundColor=d1d4f9', role: PlayerRole.DEFENSOR_CENTRAL, skillLevel: 3, birthDate: '1980-01-01' },
    { id: 26, firstName: 'Jorge', lastName: 'Morinigo', nickname: 'Jojito', pin: '0000', photoUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Jojito&backgroundColor=ffd5dc', role: PlayerRole.EXTREMO_DERECHO, skillLevel: 3, birthDate: '1980-01-01' },
    { id: 27, firstName: 'Hugo', lastName: 'Patiño', nickname: 'Huguito', pin: '0000', photoUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Huguito&backgroundColor=c0aede', role: PlayerRole.MEDIOCAMPISTA_DEFENSIVO, skillLevel: 3, birthDate: '1980-01-01' },
    { id: 28, firstName: 'Miguel', lastName: 'Vocal', nickname: 'Ibarra', pin: '0000', photoUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Ibarra&backgroundColor=b6e3f4', role: PlayerRole.LATERAL_IZQUIERDO, skillLevel: 4, birthDate: '1980-01-01' },
    { id: 29, firstName: 'Pedro', lastName: 'Zarate', nickname: 'Guillote', pin: '0000', photoUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Guillote&backgroundColor=ffdfbf', role: PlayerRole.DELANTERO_CENTRO, skillLevel: 3, birthDate: '1980-01-01' },
    { id: 30, firstName: 'Gustavo', lastName: 'Zerfuz', nickname: 'Pato', pin: '0000', photoUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Pato&backgroundColor=d1d4f9', role: PlayerRole.ARQUERO, skillLevel: 4, birthDate: '1980-01-01' }
];

export const INITIAL_MY_TEAM: MyTeam = {
    name: 'PLAYERS LD',
    shieldUrl: '/favicon.svg',
    primaryColor: '#4f46e5',
    secondaryColor: '#60a5fa',
};

export const INITIAL_APP_SETTINGS: AppSettings = {
    superAdminPlayerId: 1, 
    isPinAuthEnabled: true,
    announcement: '¡Bienvenidos!',
};

export const translations = {
    es: {
        appTitle: "PLAYERS LD",
        home: "Convocatoria",
        fixture: "Fixture",
        tournaments: "Torneos",
        venues: "Canchas",
        rivals: "Rivales",
        myTeam: "Mi Equipo",
        logistics: "Vestuario",
        stats: "Estadísticas",
        treasury: "Tesorería",
        help: "Ayuda",
        roster: "Plantilla",
        installApp: "Instalar App",
        nextMatch: "Próximo Partido",
        callUp: "Convocatoria",
        confirm: "Confirmar",
        doubt: "En Duda",
        absent: "Ausente",
        adminMatch: "🛠️ Cargar Datos / Admin",
        share: "Compartir",
        shareStats: "Compartir Resumen",
        myProfile: "Mi Perfil",
        matchStatus: {
            PROGRAMADO: "PROGRAMADO",
            FINALIZADO: "FINALIZADO",
            SUSPENDIDO: "SUSPENDIDO"
        },
        payment: {
            paid: "Pagado",
            partial: "Parcial",
            unpaid: "Debe"
        },
        search: "Buscar...",
        loading: "Cargando...",
        back: "Volver",
        genTeams: "⚽ Armar Equipos (Aleatorio)",
        generating: "Mezclando...",
        adminOptions: "Administrar Votación",
        openVoting: "Abrir Votación",
        closeVoting: "Cerrar Votación",
        votingOpen: "HABILITADA",
        votingClosed: "DESHABILITADA",
        ratings: "⭐ Votación",
        votingStatus: "Estado de Votación",
        thirdHalf: "🍻 3er Tiempo"
    },
    en: {
        appTitle: "PLAYERS LD",
        home: "Call-up",
        fixture: "Fixture",
        tournaments: "Tournaments",
        venues: "Venues",
        rivals: "Opponents",
        myTeam: "My Team",
        logistics: "Locker Room",
        stats: "Stats",
        treasury: "Treasury",
        help: "Help",
        roster: "Roster",
        installApp: "Install App",
        nextMatch: "Next Match",
        callUp: "Call Up",
        confirm: "Confirm",
        doubt: "Maybe",
        absent: "Absent",
        adminMatch: "🛠️ Admin / Data",
        share: "Share",
        shareStats: "Share Summary",
        myProfile: "My Profile",
        matchStatus: {
            PROGRAMADO: "SCHEDULED",
            FINALIZADO: "FINISHED",
            SUSPENDIDO: "SUSPENDED"
        },
        payment: {
            paid: "Paid",
            partial: "Partial",
            unpaid: "Unpaid"
        },
        search: "Search...",
        loading: "Loading...",
        back: "Back",
        genTeams: "⚽ Generate Teams (Random)",
        generating: "Shuffling...",
        adminOptions: "Manage Voting",
        openVoting: "Open Voting",
        closeVoting: "Close Voting",
        votingOpen: "ENABLED",
        votingClosed: "DISABLED",
        ratings: "⭐ Voting",
        votingStatus: "Voting Status",
        thirdHalf: "🍻 3rd Half"
    },
    pt: {
        appTitle: "PLAYERS LD",
        home: "Convocação",
        fixture: "Calendário",
        tournaments: "Torneios",
        venues: "Campos",
        rivals: "Rivais",
        myTeam: "Meu Time",
        logistics: "Vestiário",
        stats: "Estatísticas",
        treasury: "Tesouraria",
        help: "Ajuda",
        roster: "Elenco",
        installApp: "Instalar App",
        nextMatch: "Próxima Partida",
        callUp: "Convocação",
        confirm: "Confirmar",
        doubt: "Dúvida",
        absent: "Ausente",
        adminMatch: "🛠️ Admin / Dados",
        share: "Compartilhar",
        shareStats: "Compartilhar Resumo",
        myProfile: "Meu Perfil",
        matchStatus: {
            PROGRAMADO: "AGENDADO",
            FINALIZADO: "FINALIZADO",
            SUSPENDIDO: "SUSPENSO"
        },
        payment: {
            paid: "Pago",
            partial: "Parcial",
            unpaid: "Deve"
        },
        search: "Buscar...",
        loading: "Carregando...",
        back: "Voltar",
        genTeams: "⚽ Gerar Times (Aleatório)",
        generating: "Misturando...",
        adminOptions: "Gerenciar Votacción",
        openVoting: "Abrir Votación",
        closeVoting: "Fechar Votação",
        votingOpen: "HABILITADA",
        votingClosed: "DESABILITADA",
        ratings: "⭐ Votación",
        votingStatus: "Status da Votação",
        thirdHalf: "🍻 3º Tiempo"
    }
};

export const GAME_IDEAS: GameIdea[] = [
    { id: '1', title: 'NIGHT LAB', shortDesc: 'TEST ENGINE', particleEmoji: '💀', color: '#ff0000', engineType: 'GAME' }
];

export const BACKGROUNDS: any[] = [
    { id: '1', name: 'Darkness', url: '' }
];
