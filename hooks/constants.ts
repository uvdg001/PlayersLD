
import type { Player, MyTeam, AppSettings } from '../types.ts';
import { PlayerRole } from '../types.ts';

export const INITIAL_PLAYERS: Player[] = [
    { id: 1, firstName: 'Leonardo', lastName: 'Delgado', nickname: 'Leito', pin: '0000', photoUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Leito&backgroundColor=c0aede', role: PlayerRole.MEDIOCAMPISTA_CENTRAL, skillLevel: 5, birthDate: '1980-01-01', isSuperAdmin: true }
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
    announcement: '',
};
