import React, { useState, useCallback, useEffect, useMemo } from 'react';
import { Header } from './components/Header';
import { MotivationalQuote } from './components/MotivationalQuote';
import { BirthdayCard } from './components/BirthdayCard';
import { Chat } from './components/Chat';
import { UserSelectionModal } from './components/UserSelectionModal';
import { RosterManagementModal } from './components/RosterManagementModal';
import { MyTeamPage } from './components/pages/MyTeamPage';
import { TournamentsPage } from './components/pages/TournamentsPage';
import { VenuesPage } from './components/pages/VenuesPage';
import { OpponentsPage } from './components/pages/OpponentsPage';
import { StatisticsPage } from './components/pages/StatisticsPage';
import { TreasuryPage } from './components/pages/TreasuryPage';
import { FixturePage } from './components/pages/FixturePage';
import { HelpPage } from './components/pages/HelpPage';
import { MatchCard } from './components/MatchCard';

import type {
    Player,
    Match,
    MyTeam,
    Tournament,
    Venue,
    Opponent,
    ChatMessage,
    Teams,
    Page,
    PlayerMatchStatus,
    PlayerStats
} from './types';
import {
    AttendanceStatus as AttendanceStatusEnum,
    PaymentStatus,
} from './types';
import { generateTeams } from './services/geminiService';
import { PLAYERS_ROSTER, INITIAL_MATCHES } from './constants';

import firebase from 'firebase/compat/app';
import 'firebase/compat/auth';
import 'firebase/compat/firestore';

// --- NUEVA LÓGICA DE ESTADO Y CONSTANTES ---
type DbStatus = 'CONNECTING' | 'CONNECTED' | 'OFFLINE';
const OFFLINE_WARNING = "La aplicación está en modo offline. Los cambios no se guardarán en la nube.";
const CONNECTING_WARNING = "Aún conectando a la base de datos. Por favor, espera un momento.";

// Esta variable global es inyectada por el entorno de ejecución (ej. Vercel)
declare let __initial_auth_token: string | undefined;

// --- Helpers ---
const generateNumericId = (): number => Date.now();
const PUBLIC_COLLECTION_PATH = (collectionName: string) => `apps/F50Manager/${collectionName}`;

// --- Mapeo de DocumentData de Firestore ---
const mapPlayer = (doc: firebase.firestore.QueryDocumentSnapshot<firebase.firestore.DocumentData>): Player => ({ id: parseInt(doc.id, 10), ...doc.data() } as Player);
const mapMatch = (doc: firebase.firestore.QueryDocumentSnapshot<firebase.firestore.DocumentData>): Match => ({ id: parseInt(doc.id, 10), ...doc.data() } as Match);
const mapVenue = (doc: firebase.firestore.QueryDocumentSnapshot<firebase.firestore.DocumentData>): Venue => ({ id: parseInt(doc.id, 10), ...doc.data() } as Venue);
const mapOpponent = (doc: firebase.firestore.QueryDocumentSnapshot<firebase.firestore.DocumentData>): Opponent => ({ id: parseInt(doc.id, 10), ...doc.data() } as Opponent);
const mapTournament = (doc: firebase.firestore.QueryDocumentSnapshot<firebase.firestore.DocumentData>): Tournament => ({ id: parseInt(doc.id, 10), ...doc.data() } as Tournament);
const mapChatMessage = (doc: firebase.firestore.QueryDocumentSnapshot<firebase.firestore.DocumentData>): ChatMessage => {
    const data = doc.data();
    return { id: doc.id, ...data, timestamp: data.timestamp instanceof firebase.firestore.Timestamp ? data.timestamp.toDate() : new Date(), reactions: data.reactions || {} } as ChatMessage;
};
const mapMyTeam = (doc: firebase.firestore.QueryDocumentSnapshot<firebase.firestore.DocumentData>): MyTeam => doc.data() as MyTeam;


const MatchSelector: React.FC<{
    matches: Match[];
    opponents: Opponent[];
    selectedMatchId: number | null;
    onSelectMatch: (id: number) => void;
}> = ({ matches, opponents, selectedMatchId, onSelectMatch }) => {
    const sorted = [...matches].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    const getOpponentName = (opponentId?: number): string => {
        return opponents.find(o => o.id === opponentId)?.name || 'Rival';
    };

    return (
        <div className="mb-6 bg-white dark:bg-gray-800 p-4 rounded-lg shadow-md">
            <label htmlFor="match-selector" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Seleccionar Partido
            </label>
            <select
                id="match-selector"
                value={selectedMatchId || ''}
                onChange={(e) => onSelectMatch(parseInt(e.target.value, 10))}
                className="w-full p-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 focus:ring-2 focus:ring-blue-500 focus:outline-none text-gray-900 dark:text-white"
            >
                {sorted.map(match => (
                    <option key={match.id} value={match.id}>
                        {match.date} vs {getOpponentName(match.opponentId)}
                    </option>
                ))}
            </select>
        </div>
    );
};


const App: React.FC = () => {
    // --- ESTADO DE AUTENTICACIÓN Y FIREBASE ---
    const [db, setDb] = useState<firebase.firestore.Firestore | null>(null);
    const [auth, setAuth] = useState<firebase.auth.Auth | null>(null);
    const [user, setUser] = useState<firebase.User | null>(null);
    const [dbStatus, setDbStatus] = useState<DbStatus>('CONNECTING');
    const isDemoMode = useMemo(() => dbStatus === 'OFFLINE', [dbStatus]);

    // --- ESTADO DE DATOS ---
    const [players, setPlayers] = useState<Player[]>([]);
    const [matches, setMatches] = useState<Match[]>([]);
    const [myTeam, setMyTeam] = useState<MyTeam | null>(null);
    const [venues, setVenues] = useState<Venue[]>([]);
    const [opponents, setOpponents] = useState<Opponent[]>([]);
    const [tournaments, setTournaments] = useState<Tournament[]>([]);
    const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);

    // --- ESTADO DE LA UI ---
    const [currentPage, setCurrentPage] = useState<Page>('home');
    const [loggedInPlayerId, setLoggedInPlayerId] = useState<number | null>(null);
    const [isRosterModalOpen, setIsRosterModalOpen] = useState(false);
    const [isChatOpen, setIsChatOpen] = useState(false);
    const [teams, setTeams] = useState < Teams | null > (null);
    const [isGeneratingTeams, setIsGeneratingTeams] = useState(false);
    const [selectedMatchId, setSelectedMatchId] = useState<number | null>(null);
    const [isPinAuthEnabled, setIsPinAuthEnabled] = useState(true);

    // --- 1. INICIALIZACIÓN DE FIREBASE Y AUTENTICACIÓN ---
    useEffect(() => {
        // CORRECCIÓN: Usar el método estándar de Vite para leer variables de entorno.
        const firebaseConfigJson = import.meta.env.VITE_FIREBASE_CONFIG_JSON;
        let firebaseConfig: any = {};
        let isValidConfig = false;

        try {
            if (firebaseConfigJson && typeof firebaseConfigJson === 'string') {
                 firebaseConfig = JSON.parse(firebaseConfigJson);
                 if (firebaseConfig?.apiKey) {
                    isValidConfig = true;
                 }
            }
        } catch (e) {
            console.error("Firebase no está configurado o el JSON es inválido. Ejecutando en modo LOCAL.", e);
        }
        
        console.log("APP INICIADA. Configuración válida:", isValidConfig);


        if (!isValidConfig) {
            console.warn("ADVERTENCIA: Configuración de Firebase inválida o ausente. Iniciando en MODO OFFLINE.");
            setDbStatus('OFFLINE');
            setPlayers(PLAYERS_ROSTER);
            setMatches(INITIAL_MATCHES);
            return;
        }

        try {
            if (!firebase.apps.length) firebase.initializeApp(firebaseConfig);
            const currentAuth = firebase.auth();
            const currentDb = firebase.firestore();
            setDb(currentDb);
            setAuth(currentAuth);

            const unsubscribe = currentAuth.onAuthStateChanged(async (currentUser) => {
                if (currentUser) {
                    setUser(currentUser);
                    if (dbStatus !== 'CONNECTED') {
                        setDbStatus('CONNECTED');
                        console.log("Firebase Conectado y Autenticado.");
                    }
                } else {
                    const token = typeof __initial_auth_token !== 'undefined' ? __initial_auth_token : null;
                    try {
                        if (token) await currentAuth.signInWithCustomToken(token);
                        else await currentAuth.signInAnonymously();
                    } catch (authError) {
                        console.error("ERROR DE AUTENTICACIÓN. Revisa la config en Firebase.", authError);
                        setDbStatus('OFFLINE');
                        setPlayers(PLAYERS_ROSTER);
                        setMatches(INITIAL_MATCHES);
                    }
                }
            });
            return () => unsubscribe();
        } catch (error) {
            console.error("ERROR FATAL inicializando Firebase.", error);
            setDbStatus('OFFLINE');
            setPlayers(PLAYERS_ROSTER);
            setMatches(INITIAL_MATCHES);
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);


    // --- 2. LISTENERS DE DATOS DE FIREBASE (onSnapshot) ---
    useEffect(() => {
        if (dbStatus !== 'CONNECTED' || !db) return;

        const collections = {
            players: { query: db.collection(PUBLIC_COLLECTION_PATH('players')), setter: setPlayers, mapper: mapPlayer },
            matches: { query: db.collection(PUBLIC_COLLECTION_PATH('matches')).orderBy('date', 'desc'), setter: setMatches, mapper: mapMatch },
            myTeam: { query: db.collection(PUBLIC_COLLECTION_PATH('my-team')), setter: (data: MyTeam[]) => setMyTeam(data[0] || null), mapper: mapMyTeam },
            venues: { query: db.collection(PUBLIC_COLLECTION_PATH('venues')), setter: setVenues, mapper: mapVenue },
            opponents: { query: db.collection(PUBLIC_COLLECTION_PATH('opponents')), setter: setOpponents, mapper: mapOpponent },
            tournaments: { query: db.collection(PUBLIC_COLLECTION_PATH('tournaments')), setter: setTournaments, mapper: mapTournament },
            chatMessages: { query: db.collection(PUBLIC_COLLECTION_PATH('chat-messages')).orderBy('timestamp', 'asc'), setter: setChatMessages, mapper: mapChatMessage },
        };

        const unsubscribes = Object.values(collections).map(({ query, setter, mapper }) =>
            query.onSnapshot(
                (snapshot) => setter(snapshot.docs.map(mapper as any) as any),
                (error) => console.error(`Error en listener:`, error)
            )
        );

        return () => unsubscribes.forEach(unsub => unsub());
    }, [dbStatus, db]);

    // --- LÓGICA DERIVADA ---
    const loggedInPlayer = useMemo(() => {
        const source = players.length > 0 ? players : PLAYERS_ROSTER;
        return source.find(p => p.id === loggedInPlayerId) || null;
    }, [players, loggedInPlayerId]);

    const isAdmin = useMemo(() => {
        if (!loggedInPlayer) return false;
        if (isDemoMode) return true; // En modo demo, todos son admins para probar
        if (players.length === 0 && !isDemoMode) return true;
        if (!myTeam && players.length > 0) return true;
        if ([1, 9].includes(loggedInPlayer.id)) return true; // Master admins
        return loggedInPlayer.isSubAdmin && loggedInPlayer.adminExpires ? new Date(loggedInPlayer.adminExpires) > new Date() : false;
    }, [loggedInPlayer, myTeam, players, isDemoMode]);
    
    const sortedMatches = useMemo(() => [...matches].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()), [matches]);
    
    useEffect(() => {
        if (!selectedMatchId && sortedMatches.length > 0) {
            setSelectedMatchId(sortedMatches[0].id);
        }
    }, [sortedMatches, selectedMatchId]);
    
    const selectedMatch = useMemo(() => matches.find(m => m.id === selectedMatchId) || null, [matches, selectedMatchId]);
    const filteredChatMessages = useMemo(() => chatMessages.filter(msg => msg.matchId === selectedMatchId), [chatMessages, selectedMatchId]);

    const birthdayPlayers = useMemo(() => {
        const today = new Date();
        return players.filter(p => {
            if (!p.birthDate || !/^\d{4}-\d{2}-\d{2}$/.test(p.birthDate)) return false;
            const [, month, day] = p.birthDate.split('-').map(Number);
            return (month - 1) === today.getMonth() && day === today.getDate();
        });
    }, [players]);

    const playerStats: PlayerStats[] = useMemo(() => { /* Lógica sin cambios */
        return players.map(player => {
            let totalRating = 0;
            let ratingCount = 0;
            const attendance = { confirmed: 0, doubtful: 0, absent: 0 };
            let totalQuartersPlayed = 0;
            let totalAmountPaid = 0;
    
            matches.forEach(match => {
                if (match.ratings) {
                    Object.values(match.ratings).forEach(raterRatings => {
                        if (raterRatings[player.id]) {
                            totalRating += raterRatings[player.id];
                            ratingCount++;
                        }
                    });
                }
    
                const playerStatus = match.playerStatuses.find(ps => ps.playerId === player.id);
                if (playerStatus) {
                    switch (playerStatus.attendanceStatus) {
                        case AttendanceStatusEnum.CONFIRMED:
                            attendance.confirmed++;
                            totalQuartersPlayed += playerStatus.quartersPlayed || 0;
                            break;
                        case AttendanceStatusEnum.DOUBTFUL:
                            attendance.doubtful++;
                            break;
                        case AttendanceStatusEnum.ABSENT:
                            attendance.absent++;
                            break;
                    }
                    totalAmountPaid += playerStatus.amountPaid || 0;
                }
            });
    
            return {
                player,
                avgRating: ratingCount > 0 ? totalRating / ratingCount : 0,
                ratingCount,
                attendance,
                totalQuartersPlayed,
                totalAmountPaid,
            };
        });
    }, [players, matches]);
    
    const treasuryData = useMemo(() => { /* Lógica sin cambios */
        const totalSpent = matches.reduce((sum, match) => sum + match.courtFee, 0);
        
        const totalCollected = matches.reduce((sum, match) => {
            return sum + match.playerStatuses.reduce((playerSum, ps) => playerSum + ps.amountPaid, 0);
        }, 0);
    
        const matchDetails = matches.map(match => {
            const collected = match.playerStatuses.reduce((sum, ps) => sum + ps.amountPaid, 0);
            return {
                ...match,
                collected,
                balance: collected - match.courtFee,
            };
        }).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    
        return {
            totalSpent,
            totalCollected,
            balance: totalCollected - totalSpent,
            matches: matchDetails,
        };
    }, [matches]);

    const canViewRatings = useMemo(() => { /* Lógica sin cambios */
        if (!loggedInPlayer) return false;

        const openRatingMatches = matches.filter(m => m.ratingStatus === 'OPEN');
        if (openRatingMatches.length === 0) return true;

        for (const match of openRatingMatches) {
            const confirmedPlayers = match.playerStatuses.filter(
                ps => ps.attendanceStatus === AttendanceStatusEnum.CONFIRMED
            );

            if (!confirmedPlayers.some(p => p.playerId === loggedInPlayer.id)) {
                continue;
            }

            const ratees = confirmedPlayers.filter(p => p.playerId !== loggedInPlayer.id);
            const userRatingsForMatch = match.ratings?.[loggedInPlayer.id] || {};
            const ratedCount = Object.keys(userRatingsForMatch).length;

            if (ratedCount < ratees.length) {
                return false;
            }
        }

        return true;
    }, [loggedInPlayer, matches]);


    // --- 3. FUNCIONES CRUD ---
    const setDoc = useCallback(async (collection: string, id: number | string, data: object) => {
        if (!db) { alert(OFFLINE_WARNING); return; }
        await db.collection(PUBLIC_COLLECTION_PATH(collection)).doc(id.toString()).set(data);
    }, [db]);

    const updateDoc = useCallback(async (collection: string, id: number, data: object) => {
        if (!db) { alert(OFFLINE_WARNING); return; }
        await db.collection(PUBLIC_COLLECTION_PATH(collection)).doc(id.toString()).update(data);
    }, [db]);

    const deleteDoc = useCallback(async (collection: string, id: number) => {
        if (!db) { alert(OFFLINE_WARNING); return; }
        await db.collection(PUBLIC_COLLECTION_PATH(collection)).doc(id.toString()).delete();
    }, [db]);
    
    const checkConnection = useCallback(() => {
        if (dbStatus === 'CONNECTING') { alert(CONNECTING_WARNING); return false; }
        if (dbStatus === 'OFFLINE') { alert(OFFLINE_WARNING); return false; }
        return true;
    }, [dbStatus]);

    // ** LÓGICA DE MANEJO DE EVENTOS (HANDLERS) **
    const handleUpdateMatch = useCallback(async (match: Match) => {
        if (isDemoMode) {
            setMatches(prev => prev.map(m => m.id === match.id ? match : m));
            return;
        }
        if (!checkConnection()) return;
        const { id, ...matchData } = match;
        await updateDoc('matches', id, matchData);
    }, [isDemoMode, checkConnection, updateDoc]);

    const handlePlayerStatusChange = useCallback((matchId: number, playerId: number, newStatus: AttendanceStatusEnum) => {
        setTeams(null);
        const match = matches.find(m => m.id === matchId);
        if (!match) return;
        const updatedStatuses = match.playerStatuses.map(ps =>
            ps.playerId === playerId ? { ...ps, attendanceStatus: newStatus } : ps
        );
        handleUpdateMatch({ ...match, playerStatuses: updatedStatuses });
    }, [matches, handleUpdateMatch]);

    const handlePlayerPaymentChange = useCallback((matchId: number, playerId: number, newStatus: PaymentStatus, amount: number) => {
        const match = matches.find(m => m.id === matchId);
        if (!match) return;
        const updatedStatuses = match.playerStatuses.map(ps =>
            ps.playerId === playerId ? { ...ps, paymentStatus: newStatus, amountPaid: amount } : ps
        );
        handleUpdateMatch({ ...match, playerStatuses: updatedStatuses });
    }, [matches, handleUpdateMatch]);
    
    const handleCourtFeeChange = useCallback((matchId: number, newFee: number) => {
        const match = matches.find(m => m.id === matchId);
        if (match) handleUpdateMatch({...match, courtFee: newFee});
    }, [matches, handleUpdateMatch]);
    
    const handlePlayerRatingChange = useCallback((matchId: number, raterId: number, rateeId: number, rating: number) => {
        const match = matches.find(m => m.id === matchId);
        if (!match) return;
        const newRatings = JSON.parse(JSON.stringify(match.ratings || {}));
        if (!newRatings[raterId]) newRatings[raterId] = {};
        newRatings[raterId][rateeId] = rating;
        handleUpdateMatch({ ...match, ratings: newRatings });
    }, [matches, handleUpdateMatch]);

    // ... OTROS HANDLERS ...
    // Añadí checkConnection() a todas las funciones que escriben en la base de datos
    const handleAddPlayer = useCallback(async (newPlayer: Omit<Player, 'id'>) => {
        if (isDemoMode) {
             setPlayers(prev => [...prev, { ...newPlayer, id: generateNumericId() }]);
             return;
        }
        if (!checkConnection() || !db) return;
        
        const newId = generateNumericId();
        await setDoc('players', newId, newPlayer);
        
        const batch = db.batch();
        matches.forEach(match => {
            const newStatus: PlayerMatchStatus = { playerId: newId, attendanceStatus: AttendanceStatusEnum.PENDING, paymentStatus: PaymentStatus.UNPAID, amountPaid: 0, goals: 0, yellowCards: 0, redCard: false, quartersPlayed: 0 };
            const ref = db.collection(PUBLIC_COLLECTION_PATH('matches')).doc(match.id.toString());
            batch.update(ref, { playerStatuses: firebase.firestore.FieldValue.arrayUnion(newStatus) });
        });
        await batch.commit();

    }, [isDemoMode, checkConnection, db, matches, setDoc]);

    const handleUpdatePlayer = useCallback(async (player: Player) => {
        if (isDemoMode) {
            setPlayers(prev => prev.map(p => p.id === player.id ? player : p));
            return;
        }
        if (!checkConnection()) return;
        const { id, ...playerData } = player;
        await updateDoc('players', id, playerData);
    }, [isDemoMode, checkConnection, updateDoc]);

    const handleDeletePlayer = useCallback(async (playerId: number) => {
         if (isDemoMode) {
            setPlayers(prev => prev.filter(p => p.id !== playerId));
            return;
        }
        if (!checkConnection() || !db) return;
        await deleteDoc('players', playerId);
        
        const batch = db.batch();
        matches.forEach(match => {
            const updatedStatuses = match.playerStatuses.filter(ps => ps.playerId !== playerId);
            const ref = db.collection(PUBLIC_COLLECTION_PATH('matches')).doc(match.id.toString());
            batch.update(ref, { playerStatuses: updatedStatuses });
        });
        await batch.commit();
    }, [isDemoMode, checkConnection, db, matches, deleteDoc]);

     const handleAddMessage = useCallback(async (text: string) => {
        if (!loggedInPlayerId || !selectedMatchId) return;
        const player = players.find(p => p.id === loggedInPlayerId);
        if (!player) return;

        const newMessage: Omit<ChatMessage, 'id'> = {
            matchId: selectedMatchId, text, senderId: player.id, senderName: player.nickname,
            senderPhotoUrl: player.photoUrl, reactions: {}, timestamp: new Date(),
        };
        
        if (isDemoMode) {
            // FIX: Ensure the created object matches the ChatMessage type, specifically the 'id' property.
            setChatMessages(prev => [...prev, { ...newMessage, id: generateNumericId().toString() } as ChatMessage]);
            return;
        }

        if (!checkConnection() || !db) return;
        await db.collection(PUBLIC_COLLECTION_PATH('chat-messages')).add({
            ...newMessage,
            timestamp: firebase.firestore.FieldValue.serverTimestamp()
        });
    }, [db, loggedInPlayerId, players, selectedMatchId, isDemoMode, checkConnection]);

    //... y así para todos los demás handlers que modifican datos ...
    const handleSaveMyTeam = useCallback(async (teamData: MyTeam) => { if (isDemoMode) { setMyTeam(teamData); return; } if (!checkConnection()) return; await setDoc('my-team', 'teamData', teamData); }, [isDemoMode, checkConnection, setDoc]);
    const handleAddVenue = useCallback(async (newVenue: Omit<Venue, 'id'>) => { if (isDemoMode) { setVenues(prev => [...prev, { ...newVenue, id: generateNumericId() }]); return; } if (!checkConnection()) return; await setDoc('venues', generateNumericId(), newVenue); }, [isDemoMode, checkConnection, setDoc]);
    const handleUpdateVenue = useCallback(async (venue: Venue) => { if (isDemoMode) { setVenues(prev => prev.map(v => v.id === venue.id ? venue : v)); return; } if (!checkConnection()) return; const { id, ...data } = venue; await updateDoc('venues', id, data); }, [isDemoMode, checkConnection, updateDoc]);
    const handleDeleteVenue = useCallback(async (venueId: number) => { if (isDemoMode) { setVenues(prev => prev.filter(v => v.id !== venueId)); return; } if (!checkConnection()) return; await deleteDoc('venues', venueId); }, [isDemoMode, checkConnection, deleteDoc]);
    const handleAddOpponent = useCallback(async (newOpponent: Omit<Opponent, 'id'>) => { if (isDemoMode) { setOpponents(prev => [...prev, { ...newOpponent, id: generateNumericId() }]); return; } if (!checkConnection()) return; await setDoc('opponents', generateNumericId(), newOpponent); }, [isDemoMode, checkConnection, setDoc]);
    const handleUpdateOpponent = useCallback(async (opponent: Opponent) => { if (isDemoMode) { setOpponents(prev => prev.map(o => o.id === opponent.id ? opponent : o)); return; } if (!checkConnection()) return; const { id, ...data } = opponent; await updateDoc('opponents', id, data); }, [isDemoMode, checkConnection, updateDoc]);
    const handleDeleteOpponent = useCallback(async (opponentId: number) => { if (isDemoMode) { setOpponents(prev => prev.filter(o => o.id !== opponentId)); return; } if (!checkConnection()) return; await deleteDoc('opponents', opponentId); }, [isDemoMode, checkConnection, deleteDoc]);
    const handleAddTournament = useCallback(async (newTournament: Omit<Tournament, 'id'>) => { if (isDemoMode) { setTournaments(prev => [...prev, { ...newTournament, id: generateNumericId() }]); return; } if (!checkConnection()) return; await setDoc('tournaments', generateNumericId(), newTournament); }, [isDemoMode, checkConnection, setDoc]);
    const handleUpdateTournament = useCallback(async (tournament: Tournament) => { if (isDemoMode) { setTournaments(prev => prev.map(t => t.id === tournament.id ? tournament : t)); return; } if (!checkConnection()) return; const { id, ...data } = tournament; await updateDoc('tournaments', id, data); }, [isDemoMode, checkConnection, updateDoc]);
    const handleDeleteTournament = useCallback(async (tournamentId: number) => { if (isDemoMode) { setTournaments(prev => prev.filter(t => t.id !== tournamentId)); return; } if (!checkConnection()) return; await deleteDoc('tournaments', tournamentId); }, [isDemoMode, checkConnection, deleteDoc]);
    const handleAddMatch = useCallback(async (newMatchData: Omit<Match, 'id' | 'playerStatuses' | 'ratingStatus'>) => { const newId = generateNumericId(); const newMatch: Match = { id: newId, ...newMatchData, location: venues.find(v => v.id === newMatchData.venueId)?.name || '', address: venues.find(v => v.id === newMatchData.venueId)?.address || '', playerStatuses: players.map(p => ({ playerId: p.id, attendanceStatus: AttendanceStatusEnum.PENDING, paymentStatus: PaymentStatus.UNPAID, amountPaid: 0, goals: 0, yellowCards: 0, redCard: false, quartersPlayed: 0 })), ratingStatus: 'CLOSED', status: 'PROGRAMADO' }; if (isDemoMode) { setMatches(prev => [newMatch, ...prev]); return; } if (!checkConnection()) return; const { id, ...matchForDb } = newMatch; await setDoc('matches', id, matchForDb); }, [isDemoMode, checkConnection, players, venues, setDoc]);
    const handleDeleteMatch = useCallback(async (matchId: number) => { if (isDemoMode) { setMatches(prev => prev.filter(m => m.id !== matchId)); return; } if (!checkConnection()) return; await deleteDoc('matches', matchId); }, [isDemoMode, checkConnection, deleteDoc]);
    const handleDeleteMessage = useCallback(async (messageId: string | number) => { if (isDemoMode) { setChatMessages(prev => prev.filter(m => m.id !== messageId)); return; } if (!checkConnection() || !db) return; await db.collection(PUBLIC_COLLECTION_PATH('chat-messages')).doc(messageId.toString()).delete(); }, [isDemoMode, checkConnection, db]);
    const handleToggleReaction = useCallback(async (messageId: string | number, emoji: string) => { if (!loggedInPlayerId) return; const message = chatMessages.find(m => m.id === messageId); if (!message) return; const newReactions = JSON.parse(JSON.stringify(message.reactions || {})); if (!newReactions[emoji]) newReactions[emoji] = []; const userIndex = newReactions[emoji].indexOf(loggedInPlayerId); if (userIndex > -1) { newReactions[emoji].splice(userIndex, 1); if (newReactions[emoji].length === 0) delete newReactions[emoji]; } else { newReactions[emoji].push(loggedInPlayerId); } if (isDemoMode) { setChatMessages(prev => prev.map(m => m.id === messageId ? { ...m, reactions: newReactions } : m)); return; } if (!checkConnection() || !db) return; await db.collection(PUBLIC_COLLECTION_PATH('chat-messages')).doc(messageId.toString()).update({ reactions: newReactions }); }, [loggedInPlayerId, chatMessages, isDemoMode, checkConnection, db]);
    const handleOpponentScoreChange = useCallback((matchId: number, newScore: number) => { const match = matches.find(m => m.id === matchId); if (match) handleUpdateMatch({ ...match, opponentScore: newScore }); }, [matches, handleUpdateMatch]);
    const handlePlayerStatsChange = useCallback((matchId: number, playerId: number, field: keyof PlayerMatchStatus, value: any) => { const match = matches.find(m => m.id === matchId); if (!match) return; const updatedStatuses = match.playerStatuses.map(ps => (ps.playerId === playerId) ? { ...ps, [field]: value, redCard: (field === 'yellowCards' && value === 2) ? true : ps.redCard } : ps); handleUpdateMatch({ ...match, playerStatuses: updatedStatuses }); }, [matches, handleUpdateMatch]);
    const handleToggleRatingStatus = useCallback((matchId: number) => { const match = matches.find(m => m.id === matchId); if (match) handleUpdateMatch({ ...match, ratingStatus: match.ratingStatus === 'OPEN' ? 'CLOSED' : 'OPEN' }); }, [matches, handleUpdateMatch]);
    const handleStandingsChange = useCallback((matchId: number, teamId: number, newPosition: number) => { const match = matches.find(m => m.id === matchId); if (!match || !match.standings) return; const updatedStandings = match.standings.map(s => s.id === teamId ? {...s, position: newPosition} : s); handleUpdateMatch({...match, standings: updatedStandings}); }, [matches, handleUpdateMatch]);
    const handleUpdateMatch = useCallback(async (match: Match) => { if (isDemoMode) { setMatches(prev => prev.map(m => m.id === match.id ? match : m)); return; } if (!checkConnection()) return; const { id, ...matchData } = match; await updateDoc('matches', id, matchData); }, [isDemoMode, checkConnection, updateDoc]);


    const handleGenerateTeams = useCallback(async () => {
        if (!selectedMatch) return;
        const confirmedPlayers = players.filter(p => selectedMatch.playerStatuses.some(ps => ps.playerId === p.id && ps.attendanceStatus === AttendanceStatusEnum.CONFIRMED));
        if (confirmedPlayers.length < 2) { alert("Se necesitan al menos 2 jugadores confirmados."); return; }

        setIsGeneratingTeams(true);
        try {
            setTeams(await generateTeams(confirmedPlayers));
        } finally {
            setIsGeneratingTeams(false);
        }
    }, [selectedMatch, players]);


    const renderPage = () => {
        if (!loggedInPlayer) return null;
        switch (currentPage) {
            case 'home':
                return (
                    <div className="space-y-6">
                        <MatchSelector matches={matches} opponents={opponents} selectedMatchId={selectedMatchId} onSelectMatch={setSelectedMatchId} />
                        <BirthdayCard players={birthdayPlayers} />
                        <MotivationalQuote />
                        {selectedMatch ? (
                            // FIX: Replaced shorthand props with explicit key-value pairs.
                            <MatchCard match={selectedMatch} players={players} currentUser={loggedInPlayer} myTeam={myTeam} opponents={opponents} onPlayerStatusChange={handlePlayerStatusChange} onPlayerPaymentChange={handlePlayerPaymentChange} onCourtFeeChange={handleCourtFeeChange} onStandingsChange={handleStandingsChange} onPlayerRatingChange={handlePlayerRatingChange} onToggleRatingStatus={handleToggleRatingStatus} onPlayerStatsChange={handlePlayerStatsChange} onOpponentScoreChange={handleOpponentScoreChange} teams={teams} isGeneratingTeams={isGeneratingTeams} onGenerateTeams={handleGenerateTeams} isAdmin={isAdmin} />
                        ) : (
                             <div className="text-center p-8 bg-white dark:bg-gray-800 rounded-lg shadow-md">
                                <h2 className="text-2xl font-bold mb-4">¡Bienvenido!</h2>
                                <p className="text-gray-600 dark:text-gray-400">No hay partidos programados.</p>
                            </div>
                        )}
                    </div>
                );
            case 'fixture': return <FixturePage {...{ myTeam, tournaments, matches, opponents, venues, setCurrentPage, setSelectedMatchId }} />;
            // FIX: Replaced shorthand props with explicit key-value pairs.
            case 'tournaments': return <TournamentsPage tournaments={tournaments} matches={matches} venues={venues} opponents={opponents} onAddTournament={handleAddTournament} onUpdateTournament={handleUpdateTournament} onDeleteTournament={handleDeleteTournament} onAddMatch={handleAddMatch} onUpdateMatch={handleUpdateMatch} onDeleteMatch={handleDeleteMatch} setCurrentPage={setCurrentPage} setSelectedMatchId={setSelectedMatchId} isAdmin={isAdmin} />;
            // FIX: Replaced shorthand props with explicit key-value pairs.
            case 'venues': return <VenuesPage venues={venues} onAddVenue={handleAddVenue} onUpdateVenue={handleUpdateVenue} onDeleteVenue={handleDeleteVenue} isAdmin={isAdmin} />;
            // FIX: Replaced shorthand props with explicit key-value pairs.
            case 'opponents': return <OpponentsPage opponents={opponents} onAddOpponent={handleAddOpponent} onUpdateOpponent={handleUpdateOpponent} onDeleteOpponent={handleDeleteOpponent} isAdmin={isAdmin} />;
            case 'my-team': return <MyTeamPage {...{ team: myTeam, onSave: handleSaveMyTeam, isAdmin, currentUser: loggedInPlayer, players, onUpdatePlayer: handleUpdatePlayer }} />;
            case 'statistics': return <StatisticsPage stats={playerStats} canViewRatings={canViewRatings} />;
            case 'treasury': return <TreasuryPage data={treasuryData} />;
            case 'help': return <HelpPage isAdmin={isAdmin}/>;
            default: return <div>Página no encontrada</div>;
        }
    };

    if (dbStatus === 'CONNECTING' && !isDemoMode) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-100 dark:bg-gray-900">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
                    <p className="text-gray-600 dark:text-gray-300">Conectando a la nube...</p>
                </div>
            </div>
        );
    }

    if (!loggedInPlayerId) {
        return <UserSelectionModal players={players.length > 0 ? players : PLAYERS_ROSTER} onSelectUser={(player) => setLoggedInPlayerId(player.id)} isPinAuthEnabled={isPinAuthEnabled} onTogglePinAuth={() => setIsPinAuthEnabled(prev => !prev)} />;
    }
    
    const footerStatus = {
        'CONNECTED': { text: 'CONECTADO A NUBE', color: 'bg-green-500', textColor: 'text-green-600 dark:text-green-400' },
        'OFFLINE': { text: 'MODO LOCAL (NO GUARDA)', color: 'bg-orange-500', textColor: 'text-orange-500' },
        'CONNECTING': { text: 'CONECTANDO...', color: 'bg-yellow-500', textColor: 'text-yellow-500' }
    }[dbStatus];
    
    return (
        <div className="min-h-screen bg-gray-100 dark:bg-gray-900 text-gray-900 dark:text-gray-100 font-sans flex flex-col">
            {isDemoMode && (
                <div className="bg-amber-500 text-white text-center p-2 text-sm font-bold sticky top-0 z-[100]">
                    ⚠️ MODO DEMO OFFLINE: Los cambios NO se guardarán en la nube.
                </div>
            )}
            {isRosterModalOpen && <RosterManagementModal {...{ players, onClose: () => setIsRosterModalOpen(false), onAddPlayer: handleAddPlayer, onUpdatePlayer: handleUpdatePlayer, onDeletePlayer: handleDeletePlayer }} />}
            
            <Header {...{ currentUser: loggedInPlayer!, onOpenRoster: () => setIsRosterModalOpen(true), onChangeUser: () => setLoggedInPlayerId(null), currentPage, setCurrentPage, isAdmin }} />
            
            <main className="container mx-auto p-4 md:p-6 flex-grow pb-16">
                {renderPage()}
            </main>

            <footer className="fixed bottom-0 w-full bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 p-2 z-50 flex justify-between items-center text-xs px-4">
                <span className="text-gray-500 dark:text-gray-400">© 2025 Players LD</span>
                <div className="flex items-center space-x-2">
                    <div className={`w-2 h-2 rounded-full ${footerStatus.color} ${dbStatus !== 'OFFLINE' ? 'animate-pulse' : ''}`}></div>
                    <span className={`font-bold ${footerStatus.textColor}`}>{footerStatus.text}</span>
                </div>
            </footer>

            {selectedMatch && loggedInPlayer && (
                 <>
                    <button onClick={() => setIsChatOpen(true)} className="fixed bottom-12 right-6 bg-green-600 text-white p-3 rounded-full shadow-lg hover:bg-green-700 transition-colors z-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 flex items-center px-5 mb-2" aria-label="Abrir chat">
                        {/* FIX: Removed duplicate viewBox attribute. */}
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6"><path fillRule="evenodd" d="M4.804 21.644A6.707 6.707 0 0 0 6 21.75a6.721 6.721 0 0 0 3.583-1.029c.774.182 1.584.279 2.417.279 5.352 0 9.75-3.62 9.75-8.125S17.352 4.75 12 4.75c-4.636 0-8.547 3.028-9.456 7.027.06.002.12.004.181.004A6.72 6.72 0 0 0 6 11.25a6.72 6.72 0 0 0-1.196.166Z" clipRule="evenodd" /><path fillRule="evenodd" d="M1.086 13.522a8.216 8.216 0 0 0 2.52.426A8.203 8.203 0 0 1 6 14.25c.094 0 .188.003.28.008a8.21 8.21 0 0 0 2.288 1.414 6.71 6.71 0 0 0 2.86.376 6.71 6.71 0 0 0 2.86-.376 8.21 8.21 0 0 0 2.288-1.414c.092-.005.186-.008.28-.008a8.203 8.203 0 0 1 2.394-.302c1.075 0 2.033.204 2.82.572.348.16.482.593.26.876a11.192 11.192 0 0 1-2.392 2.152 10.99 10.99 0 0 1-1.42 1.045 8.212 8.212 0 0 1-2.288 1.414 6.72 6.72 0 0 1-5.72 0 8.212 8.212 0 0 1-2.288-1.414 10.99 10.99 0 0 1-1.42-1.045A11.191 11.191 0 0 1 .825 14.4c-.222-.282-.087-.715.26-.877Z" clipRule="evenodd" /></svg>
                        <span className="ml-2 font-semibold">Chat!</span>
                    </button>
                    {isChatOpen && (
                        <div className="fixed inset-0 bg-black/60 flex justify-center items-center z-[60] p-4" onClick={() => setIsChatOpen(false)}>
                            <div className="w-full max-w-2xl h-[85vh] max-h-[700px] bg-transparent" onClick={e => e.stopPropagation()}>
                                {/* FIX: Replaced shorthand props with explicit key-value pairs. */}
                                <Chat currentUser={loggedInPlayer} players={players} messages={filteredChatMessages} onAddMessage={handleAddMessage} onDeleteMessage={handleDeleteMessage} onToggleReaction={handleToggleReaction} matchTitle={selectedMatch?.date} birthdayPlayers={birthdayPlayers} />
                            </div>
                        </div>
                    )}
                 </>
            )}
        </div>
    );
};

export default App;
