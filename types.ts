
export enum PlayerRole {
    ARQUERO = 'Arquero',
    DEFENSOR_CENTRAL = 'Defensor Central',
    LATERAL_DERECHO = 'Lateral Derecho',
    LATERAL_IZQUIERDO = 'Lateral Izquierdo',
    MEDIOCAMPISTA_DEFENSIVO = 'Mediocampista Defensivo',
    MEDIOCAMPISTA_CENTRAL = 'Mediocampista Central',
    MEDIOCAMPISTA_OFENSIVO = 'Mediocampista Ofensivo',
    EXTREMO_DERECHO = 'Extremo Derecho',
    EXTREMO_IZQUIERDO = 'Extremo Izquierdo',
    DELANTERO_CENTRO = 'Delantero Centro',
    DT = 'DT',
    AYUDANTE = 'Ayudante',
}

export interface Player {
    id: number;
    firstName: string;
    lastName: string;
    nickname: string;
    photoUrl: string;
    skillLevel: number;
    role: PlayerRole;
    pin: string;
    birthDate: string; // YYYY-MM-DD
    jerseyNumber?: number | null; // Acepta null para indicar que no tiene número
    alternativeRoles?: PlayerRole[];
    isSubAdmin?: boolean;
    adminExpires?: string; // ISO string
    isSuperAdmin?: boolean; // True if this player is the super admin
    observations?: string; // Nuevo campo para notas
}

export type Page = 'home' | 'fixture' | 'tournaments' | 'venues' | 'opponents' | 'my-team' | 'statistics' | 'treasury' | 'help' | 'chat' | 'logistics';

export interface TeamStanding {
    id: number;
    name: string;
    position: number;
}

export enum AttendanceStatus {
    CONFIRMED = 'CONFIRMED',
    DOUBTFUL = 'DOUBTFUL',
    ABSENT = 'ABSENT',
    PENDING = 'PENDING',
}

export enum PaymentStatus {
    PAID = 'PAID',
    PARTIAL = 'PARTIAL',
    UNPAID = 'UNPAID',
}

export interface PlayerMatchStatus {
    playerId: number;
    attendanceStatus: AttendanceStatus;
    paymentStatus: PaymentStatus;
    amountPaid: number;
    goals?: number; // Total, will be calculated
    goalsPlay?: number;
    goalsPenalty?: number;
    goalsHeader?: number;
    goalsSetPiece?: number;
    yellowCards?: number;
    redCard?: boolean;
    quartersPlayed?: number;
}

export type Ratings = {
    [raterId: number]: {
        [rateeId: number]: number;
    };
};

export type MatchStatus = 'PROGRAMADO' | 'FINALIZADO' | 'SUSPENDIDO';

export interface Match {
    id: number;
    date: string;
    time: string;
    location: string;
    address: string;
    courtFee: number;
    playerStatuses: PlayerMatchStatus[];
    standings?: TeamStanding[];
    tournamentRound?: number;
    ratings?: Ratings;
    ratingStatus: 'OPEN' | 'CLOSED';
    finishedVoters?: number[]; // IDs of users who clicked "OK"
    opponentScore?: number;
    opponentId?: number;
    venueId?: number;
    courtNumber?: string;
    status?: MatchStatus;
    myTeamScore?: number;
    tournamentId?: number;
    penaltiesAgainst?: number;
    
    // Logística / Utilería
    jerseyWasherId?: number;
    ballBringerId?: number;
    waterBringerId?: number;
    medicineKitBringerId?: number;
    
    warmUpTime?: string;
    coachTalkTime?: string;
}

export interface Teams {
    teamA: string[];
    teamB: string[];
}

export interface MyTeam {
    name: string;
    shieldUrl: string;
    primaryColor: string;
    secondaryColor: string;
}

export interface Opponent {
    id: number;
    name: string;
    shieldUrl: string;
    skillLevel: number;
    jerseyColor: string;
}

export type Reactions = {
    [emoji: string]: number[]; // array of user IDs
};

export interface ChatMessage {
    id: string;
    senderId: number;
    senderName: string;
    senderPhotoUrl?: string;
    text?: string;
    audioUrl?: string;
    timestamp: number;
    reactions?: Reactions;
}

export interface PlayerStats {
    player: Player;
    attendance: {
        confirmed: number;
        doubtful: number;
        absent: number;
    };
    avgRating: number;
    ratingCount: number;
    totalAmountPaid: number;
    totalQuartersPlayed: number;
    // New detailed stats
    pj: number;
    pg: number;
    pe: number;
    pp: number;
    totalGoals: number;
    goalsPlay: number;
    goalsPenalty: number;
    goalsHeader: number;
    goalsSetPiece: number;
    yellowCards: number;
    redCards: number;
    matchesWashed: number;
    // For "Lavadero" ranking
    matchesSinceWash: number;
}

export interface Tournament {
    id: number;
    name: string;
    year: number;
    description: string;
    status?: 'EN_CURSO' | 'FINALIZADO';
}

export interface Venue {
    id: number;
    name: string;
    address: string;
    mapLink: string;
    photoUrl: string;
}

export type ToastType = 'success' | 'error' | 'info' | 'warning';

export interface ToastMessage {
    id: string;
    message: string;
    type: ToastType;
}

export interface AppSettings {
    superAdminPlayerId: number;
    isPinAuthEnabled: boolean;
}