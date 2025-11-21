export enum AttendanceStatus {
  CONFIRMED = 'CONFIRMED',
  DOUBTFUL = 'DOUBTFUL',
  ABSENT = 'ABSENT',
  PENDING = 'PENDING'
}

export enum PaymentStatus {
  PAID = 'PAID',
  PARTIAL = 'PARTIAL',
  UNPAID = 'UNPAID'
}

export enum PlayerRole {
  ARQUERO = 'Arquero',
  DEFENSA = 'Defensa',
  MEDIOCAMPO = 'Mediocampo',
  DELANTERO = 'Delantero'
}

export type Page = 'home' | 'tournaments' | 'venues' | 'opponents' | 'my-team' | 'statistics' | 'treasury' | 'fixture' | 'help';


export interface Player {
  id: number;
  firstName: string;
  lastName: string;
  nickname: string;
  photoUrl: string; 
  skillLevel: number; // 1 to 5
  role: PlayerRole;
  pin: string;
  primaryPosition?: string;
  birthDate?: string;
  isSubAdmin?: boolean;
  adminExpires?: string; // ISO date string
}

export interface PlayerMatchStatus {
  playerId: number;
  attendanceStatus: AttendanceStatus;
  paymentStatus: PaymentStatus;
  amountPaid: number;
  goals: number;
  yellowCards: number;
  redCard: boolean;
  quartersPlayed: number; // 0 a 4
}

export interface PlayerStats {
    player: Player;
    avgRating: number;
    ratingCount: number;
    attendance: {
        confirmed: number;
        doubtful: number;
        absent: number;
    };
    totalQuartersPlayed: number;
    totalAmountPaid: number;
}

export interface TeamStanding {
  id: number;
  name: string;
  position: number;
}

export type MatchStatus = 'PROGRAMADO' | 'FINALIZADO' | 'SUSPENDIDO';

export interface Match {
  id: number;
  date: string;
  time: string;
  location: string;
  address: string;
  courtFee: number;
  playerStatuses: PlayerMatchStatus[];
  tournamentId?: number;
  tournamentRound?: number;
  standings?: TeamStanding[];
  ratings?: { [raterId: string]: { [rateeId: string]: number } };
  ratingStatus?: 'OPEN' | 'CLOSED';
  venueId?: number;
  opponentId?: number;
  myTeamScore?: number;
  opponentScore?: number;
  courtNumber?: string;
  status?: MatchStatus;
}

export interface Teams {
  teamA: string[];
  teamB: string[];
}

export interface ChatMessage {
  // FIX: Changed id to string to match Firestore document ID type.
  id: string;
  matchId?: number;
  text: string;
  senderId: number;
  senderName: string;
  senderPhotoUrl?: string;
  timestamp: Date;
  reactions?: { [emoji: string]: number[] }; // Array of player IDs for each emoji
}

// --- Nuevos Tipos para Gestión ---

export interface MyTeam {
    name: string;
    shieldUrl?: string;
    primaryColor: string;
    secondaryColor: string;
}

export interface Tournament {
    id: number;
    name: string;
    year: number;
    description: string;
}

export interface Venue {
    id: number;
    name: string;
    address: string;
    mapLink: string;
    photoUrl?: string;
}

export interface Opponent {
    id: number;
    name: string;
    shieldUrl?: string;
    skillLevel: number; // 1 a 5
    jerseyColor?: string;
}