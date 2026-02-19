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

export type TeamStatus = 'ACTIVE' | 'INACTIVE';

export interface Team {
    id: string;
    name: string;
    adminCode: string;
    status: TeamStatus;
    createdAt: number;
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
    birthDate: string; 
    jerseyNumber?: number | null;
    alternativeRoles?: PlayerRole[];
    isSubAdmin?: boolean;
    adminExpires?: string; 
    isSuperAdmin?: boolean; 
    observations?: string;
    phone?: string;
    address?: string;
    email?: string;
    gamePoints?: number;
    lastGameDate?: string;
    dailyGameAttempts?: number;
}

export type Page = 'home' | 'fixture' | 'tournaments' | 'venues' | 'opponents' | 'my-team' | 'statistics' | 'treasury' | 'help' | 'chat' | 'logistics' | 'ratings' | 'third-half' | 'entertainment' | 'stopwatch' | 'super-admin' | 'standings-photos';

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
    goals?: number;
    goalsPlay?: number;
    goalsPenalty?: number;
    goalsHeader?: number;
    goalsSetPiece?: number;
    assists?: number; 
    yellowCards?: number;
    redCard?: boolean;
    quartersPlayed?: number;
    ownGoals?: number;
    penaltiesMissed?: number;
    badThrowIns?: number;
    badFreeKicks?: number;
    majorErrors?: number;
}

export type Ratings = {
    [raterId: number]: {
        [rateeId: number]: number;
    };
};

export type MatchStatus = 'PROGRAMADO' | 'FINALIZADO' | 'SUSPENDIDO';

export interface ThirdHalfItem {
    id: string;
    name: string;
    quantity: number;
    unitPrice: number;
    total: number;
}

export interface ThirdHalf {
    items: ThirdHalfItem[];
    totalSpent: number;
    paidByPlayerId?: number;
    observations?: string;
    completedPayerIds?: number[]; 
    playerPayments?: { [playerId: number]: number }; 
}

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
    finishedVoters?: number[];
    pardonedVoters?: number[];
    opponentScore?: number;
    opponentId?: number;
    venueId?: number;
    courtNumber?: string;
    status?: MatchStatus;
    myTeamScore?: number;
    warmUpTime?: string;
    coachTalkTime?: string;
    tournamentId?: number;
    penaltiesAgainst?: number;
    jerseyWasherId?: number;
    ballBringerId?: number;
    waterBringerId?: number;
    medicineKitBringerId?: number;
    thirdHalf?: ThirdHalf;
}

export interface StandingsPhoto {
    id: string;
    url: string;
    timestamp: number;
    uploadedBy: string;
}

export interface Teams {
    teamA: Player[];
    teamB: Player[];
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
    shieldUrl?: string;
    skillLevel?: number;
    jerseyColor?: string;
}

export interface Venue {
    id: number;
    name: string;
    address: string;
    mapLink?: string;
    photoUrl?: string;
}

export interface Tournament {
    id: number;
    name: string;
    year: number;
    description?: string;
    status?: 'EN_CURSO' | 'FINALIZADO';
}

export interface AppSettings {
    superAdminPlayerId: number;
    isPinAuthEnabled: boolean;
    announcement?: string;
    arcadeMaxAttempts?: number;
    arcadeStartTime?: string;
    arcadeEndTime?: string;
    hiddenGameIds?: string[];
}

export interface PlayerStats {
    player: Player;
    attendance: { confirmed: number, doubtful: number, absent: number };
    totalAmountPaid: number;
    totalQuartersPlayed: number;
    pj: number;
    pg: number;
    pe: number;
    pp: number;
    totalGoals: number;
    goalsPlay: number;
    goalsPenalty: number;
    goalsHeader: number;
    goalsSetPiece: number;
    assists: number;
    yellowCards: number;
    redCards: number;
    matchesWashed: number;
    matchesSinceWash: number;
    avgRating: number;
    ratingCount: number;
    ownGoals: number;
    penaltiesMissed: number;
    badThrowIns: number;
    badFreeKicks: number;
    majorErrors: number;
}

export interface ChatMessage {
    id: string;
    text?: string;
    audioUrl?: string;
    senderId: number;
    senderName: string;
    senderPhotoUrl?: string;
    timestamp: number;
    reactions?: { [emoji: string]: number[] };
    hasSound?: boolean;
}

export type ToastType = 'success' | 'error' | 'info' | 'warning';

export interface ToastMessage {
    id: string;
    message: string;
    type: ToastType;
}

export interface GameIdea {
    id: string;
    title: string;
    shortDesc: string;
    particleEmoji: string;
    color: string;
    engineType: 'GAME' | 'MAHJONG';
}

export interface TierImages {
    [key: number]: string | null;
}

export type GameStatus = 'READY' | 'PLAYING' | 'FINISHED';