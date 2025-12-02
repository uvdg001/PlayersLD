
import type { Player, Match, MyTeam, Opponent, Tournament, Venue, AppSettings } from './types.ts';
import { PlayerRole, AttendanceStatus, PaymentStatus } from './types.ts';

// Usamos DiceBear para generar avatares estables y divertidos.
export const INITIAL_PLAYERS: Player[] = [
    { 
        id: 1, firstName: 'Default', lastName: 'User', nickname: 'Jugador 1', pin: '0000', 
        photoUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Jugador1&backgroundColor=c0aede', 
        role: PlayerRole.MEDIOCAMPISTA_CENTRAL, skillLevel: 3, birthDate: '1990-01-01' 
    },
    { 
        id: 2, firstName: 'Sergio', lastName: 'Alvarez', nickname: 'Negrito', pin: '0000', 
        photoUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Negrito&backgroundColor=c0aede', 
        role: PlayerRole.MEDIOCAMPISTA_DEFENSIVO, skillLevel: 3, birthDate: '1980-01-01' 
    },
    { 
        id: 3, firstName: 'Andres', lastName: 'Álvarez', nickname: 'Andrelo', pin: '0000', 
        photoUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Andrelo&backgroundColor=b6e3f4', 
        role: PlayerRole.LATERAL_IZQUIERDO, skillLevel: 3, birthDate: '1980-01-01' 
    },
    { 
        id: 4, firstName: 'Luciano', lastName: 'Baglietto', nickname: 'Lucho', pin: '0000', 
        photoUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Lucho&backgroundColor=ffdfbf', 
        role: PlayerRole.DEFENSOR_CENTRAL, skillLevel: 4, birthDate: '1980-01-01' 
    },
    { 
        id: 5, firstName: 'Cesar', lastName: 'Bantar', nickname: 'Tota', pin: '0000', 
        photoUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Tota&backgroundColor=d1d4f9', 
        role: PlayerRole.MEDIOCAMPISTA_CENTRAL, skillLevel: 3, birthDate: '1980-01-01' 
    },
    { 
        id: 6, firstName: 'Gabriel', lastName: 'Brasenas', nickname: 'Gaby Arco', pin: '0000', 
        photoUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=GabyArco&backgroundColor=ffd5dc&accessories=glasses', 
        role: PlayerRole.ARQUERO, skillLevel: 5, birthDate: '1980-01-01' 
    },
    { 
        id: 7, firstName: 'Livio', lastName: 'Cejas', nickname: 'Betito', pin: '0000', 
        photoUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Betito&backgroundColor=c0aede', 
        role: PlayerRole.EXTREMO_DERECHO, skillLevel: 4, birthDate: '1980-01-01' 
    },
    { 
        id: 8, firstName: 'Jorge', lastName: 'Cepeda', nickname: 'Carucha', pin: '0000', 
        photoUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Carucha&backgroundColor=b6e3f4', 
        role: PlayerRole.DELANTERO_CENTRO, skillLevel: 3, birthDate: '1980-01-01' 
    },
    { 
        id: 9, firstName: 'Jorge', lastName: 'Contino', nickname: 'Copito', pin: '0000', 
        photoUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Copito&backgroundColor=ffdfbf', 
        role: PlayerRole.LATERAL_DERECHO, skillLevel: 3, birthDate: '1980-01-01' 
    },
    { 
        id: 10, firstName: 'Diego', lastName: 'Couso', nickname: 'Dieguito', pin: '0000', 
        photoUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Dieguito&backgroundColor=d1d4f9', 
        role: PlayerRole.MEDIOCAMPISTA_OFENSIVO, skillLevel: 4, birthDate: '1980-01-01' 
    },
    { 
        id: 11, firstName: 'Ruben', lastName: 'Delgado', nickname: 'Fino', pin: '0000', 
        photoUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Fino&backgroundColor=ffd5dc', 
        role: PlayerRole.DEFENSOR_CENTRAL, skillLevel: 4, birthDate: '1980-01-01' 
    },
    { 
        id: 12, firstName: 'Leonardo', lastName: 'Delgado', nickname: 'Leito', pin: '0000', 
        photoUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Leito&backgroundColor=c0aede&top=shortHairDreads', 
        role: PlayerRole.MEDIOCAMPISTA_CENTRAL, skillLevel: 5, birthDate: '1980-01-01' ,
        isSuperAdmin: true, // Leito is the initial super admin
    },
    { 
        id: 13, firstName: 'Sergio', lastName: 'Di Nardo', nickname: 'Sergito', pin: '0000', 
        photoUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Sergito&backgroundColor=b6e3f4', 
        role: PlayerRole.LATERAL_IZQUIERDO, skillLevel: 3, birthDate: '1980-01-01' 
    },
    { 
        id: 14, firstName: 'Leonardo', lastName: 'Dziecevich', nickname: 'Ruso', pin: '0000', 
        photoUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Ruso&backgroundColor=ffdfbf', 
        role: PlayerRole.DEFENSOR_CENTRAL, skillLevel: 4, birthDate: '1980-01-01' 
    },
    { 
        id: 15, firstName: 'Gabriel', lastName: 'Gomes', nickname: 'Gaby', pin: '0000', 
        photoUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Gaby&backgroundColor=d1d4f9', 
        role: PlayerRole.MEDIOCAMPISTA_OFENSIVO, skillLevel: 3, birthDate: '1980-01-01' 
    },
    { 
        id: 16, firstName: 'Adrian', lastName: 'Grimaldi', nickname: 'Palermo', pin: '0000', 
        photoUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Palermo&backgroundColor=ffd5dc', 
        role: PlayerRole.DELANTERO_CENTRO, skillLevel: 4, birthDate: '1980-01-01' 
    },
    { 
        id: 17, firstName: 'Alberto', lastName: 'Hansen', nickname: 'Tincho', pin: '0000', 
        photoUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Tincho&backgroundColor=c0aede', 
        role: PlayerRole.DEFENSOR_CENTRAL, skillLevel: 3, birthDate: '1980-01-01' 
    },
    { 
        id: 18, firstName: 'Ariel', lastName: 'Insaurralde', nickname: 'Arielo', pin: '0000', 
        photoUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Arielo&backgroundColor=b6e3f4', 
        role: PlayerRole.MEDIOCAMPISTA_DEFENSIVO, skillLevel: 3, birthDate: '1980-01-01' 
    },
    { 
        id: 19, firstName: 'Pablo', lastName: 'Karlovich', nickname: 'Tweety', pin: '0000', 
        photoUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Tweety&backgroundColor=ffdfbf', 
        role: PlayerRole.EXTREMO_IZQUIERDO, skillLevel: 4, birthDate: '1980-01-01' 
    },
    { 
        id: 20, firstName: 'Juan', lastName: 'Labourdette', nickname: 'Pelado', pin: '0000', 
        photoUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Pelado&backgroundColor=d1d4f9', 
        role: PlayerRole.DEFENSOR_CENTRAL, skillLevel: 3, birthDate: '1980-01-01' 
    },
    { 
        id: 21, firstName: 'Adrian', lastName: 'Lescano', nickname: 'Doc', pin: '0000', 
        photoUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Doc&backgroundColor=ffd5dc', 
        role: PlayerRole.MEDIOCAMPISTA_CENTRAL, skillLevel: 3, birthDate: '1980-01-01' 
    },
    { 
        id: 22, firstName: 'Jorge', lastName: 'Lopez', nickname: 'Pulpo', pin: '0000', 
        photoUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Pulpo&backgroundColor=c0aede', 
        role: PlayerRole.ARQUERO, skillLevel: 4, birthDate: '1980-01-01' 
    },
    { 
        id: 23, firstName: 'Ramon', lastName: 'Martinez', nickname: 'Taci', pin: '0000', 
        photoUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Taci&backgroundColor=b6e3f4', 
        role: PlayerRole.LATERAL_DERECHO, skillLevel: 3, birthDate: '1980-01-01' 
    },
    { 
        id: 24, firstName: 'Alfonso', lastName: 'Mercado', nickname: 'Capria', pin: '0000', 
        photoUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Capria&backgroundColor=ffdfbf', 
        role: PlayerRole.MEDIOCAMPISTA_OFENSIVO, skillLevel: 4, birthDate: '1980-01-01' 
    },
    { 
        id: 25, firstName: 'Victor', lastName: 'Montenegro', nickname: 'El viejo', pin: '0000', 
        photoUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Elviejo&backgroundColor=d1d4f9', 
        role: PlayerRole.DEFENSOR_CENTRAL, skillLevel: 3, birthDate: '1980-01-01' 
    },
    { 
        id: 26, firstName: 'Jorge', lastName: 'Morinigo', nickname: 'Jojito', pin: '0000', 
        photoUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Jojito&backgroundColor=ffd5dc', 
        role: PlayerRole.EXTREMO_DERECHO, skillLevel: 3, birthDate: '1980-01-01' 
    },
    { 
        id: 27, firstName: 'Hugo', lastName: 'Patiño', nickname: 'Huguito', pin: '0000', 
        photoUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Huguito&backgroundColor=c0aede', 
        role: PlayerRole.MEDIOCAMPISTA_DEFENSIVO, skillLevel: 3, birthDate: '1980-01-01' 
    },
    { 
        id: 28, firstName: 'Miguel', lastName: 'Vocal', nickname: 'Ibarra', pin: '0000', 
        photoUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Ibarra&backgroundColor=b6e3f4', 
        role: PlayerRole.LATERAL_IZQUIERDO, skillLevel: 4, birthDate: '1980-01-01' 
    },
    { 
        id: 29, firstName: 'Pedro', lastName: 'Zarate', nickname: 'Guillote', pin: '0000', 
        photoUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Guillote&backgroundColor=ffdfbf', 
        role: PlayerRole.DELANTERO_CENTRO, skillLevel: 3, birthDate: '1980-01-01' 
    },
    { 
        id: 30, firstName: 'Gustavo', lastName: 'Zerfuz', nickname: 'Pato', pin: '0000', 
        photoUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Pato&backgroundColor=d1d4f9', 
        role: PlayerRole.ARQUERO, skillLevel: 4, birthDate: '1980-01-01' 
    }
];

export const INITIAL_MY_TEAM: MyTeam = {
    name: 'PLAYERS LD',
    shieldUrl: '/favicon.svg', // Referencia al favicon existente
    primaryColor: '#4f46e5', // Tailwind indigo-600
    secondaryColor: '#60a5fa', // Tailwind blue-400
};

export const INITIAL_OPPONENTS: Opponent[] = [];

export const INITIAL_VENUES: Venue[] = [];

export const INITIAL_TOURNAMENTS: Tournament[] = [];

// Eliminar la pre-carga del partido de ejemplo
export const INITIAL_MATCHES: Match[] = [];

export const INITIAL_APP_SETTINGS: AppSettings = {
    superAdminPlayerId: 12, // Default to Leito's ID
    isPinAuthEnabled: true,
};