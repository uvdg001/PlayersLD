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
    PlayerRole
} from './types';
import { generateTeams } from './services/geminiService';
import { PLAYERS_ROSTER, INITIAL_MATCHES } from './constants';

// Importaciones de Firebase
import { initializeApp } from 'firebase/app';
import {
    getAuth,
    signInAnonymously,
    signInWithCustomToken,
    onAuthStateChanged,
    User as FirebaseUser
} from 'firebase/auth';
import type { Auth } from 'firebase/auth';
import {
    getFirestore,
    doc,
    collection,
    query,
    orderBy,
    onSnapshot,
    setDoc,
    updateDoc,
    deleteDoc,
    serverTimestamp,
    writeBatch,
    QueryDocumentSnapshot,
    DocumentData,
    Firestore,
    Timestamp
} from 'firebase/firestore';

// Esta variable global es inyectada por el entorno de ejecución (ej. Vercel)
declare let __initial_auth_token: string | undefined;
// Vercel inyecta las variables de entorno en process.env, pero aquí manejamos la inyección directa
// para asegurar compatibilidad.
declare let FIREBASE_CONFIG_JSON: string | undefined;

// Helper para parsear config de forma segura
const parseFirebaseConfig = () => {
    try {
        // Prioridad 1: Variable global inyectada (común en algunos bundlers)
        if (typeof FIREBASE_CONFIG_JSON !== 'undefined' && FIREBASE_CONFIG_JSON && FIREBASE_CONFIG_JSON.trim() !== "") {
            const config = JSON.parse(FIREBASE_CONFIG_JSON);
            // Validación básica: debe tener apiKey
            if (config && config.apiKey) return config;
        }
    } catch (e) {
        console.error("Error parseando FIREBASE_CONFIG_JSON", e);
    }
    return {};
};

const firebaseConfig = parseFirebaseConfig();
const initialConfigValid = Object.keys(firebaseConfig).length > 0;

// --- Helpers ---

const generateNumericId = (): number => Date.now();

// Corregido: Se eliminó 'collections/' para que la ruta base sea impar (3 segmentos)
// apps (col) -> F50Manager (doc) -> collectionName (subcol)
const PUBLIC_COLLECTION_PATH = (collectionName: string) => `apps/F50Manager/${collectionName}`;

// --- Mapeo de DocumentData de Firestore ---

const mapPlayer = (doc: QueryDocumentSnapshot<DocumentData>): Player => ({
    id: parseInt(doc.id, 10),
    ...doc.data()
} as Player);

const mapMatch = (doc: QueryDocumentSnapshot<DocumentData>): Match => {
    const data = doc.data();
    return {
        id: parseInt(doc.id, 10),
        ...data,
        // Firestore convierte Date a Timestamp, hay que reconvertirlo si es necesario
        date: data.date instanceof Timestamp ? data.date.toDate().toLocaleDateString('es-ES') : data.date,
    } as Match;
};

const mapVenue = (doc: QueryDocumentSnapshot<DocumentData>): Venue => ({
    id: parseInt(doc.id, 10),
    ...doc.data()
} as Venue);

const mapOpponent = (doc: QueryDocumentSnapshot<DocumentData>): Opponent => ({
    id: parseInt(doc.id, 10),
    ...doc.data()
} as Opponent);

const mapTournament = (doc: QueryDocumentSnapshot<DocumentData>): Tournament => ({
    id: parseInt(doc.id, 10),
    ...doc.data()
} as Tournament);

const mapChatMessage = (doc: QueryDocumentSnapshot<DocumentData>): ChatMessage => {
    const data = doc.data();
    return {
        id: parseInt(doc.id, 10),
        ...data,
        timestamp: data.timestamp instanceof Timestamp ? data.timestamp.toDate() : new Date(),
        reactions: data.reactions || {},
    } as ChatMessage;
};

const mapMyTeam = (doc: QueryDocumentSnapshot<DocumentData>): MyTeam => {
    return doc.data() as MyTeam;
};

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
    const [db, setDb] = useState<Firestore | null>(null);
    const [auth, setAuth] = useState<Auth | null>(null);
    const [user, setUser] = useState<FirebaseUser | null>(null);
    const [userId, setUserId] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
    const [isSyncing, setIsSyncing] = useState(false);
    
    // isDemoMode ahora es un estado para permitir fallback en caso de error de auth
    const [isDemoMode, setIsDemoMode] = useState(!initialConfigValid);

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
        console.log("APP INICIADA. Configuración válida:", initialConfigValid);
        
        if (!initialConfigValid) {
            console.warn("Firebase no está configurado o el JSON es inválido. Ejecutando en modo LOCAL.");
            setPlayers(PLAYERS_ROSTER);
            setMatches(INITIAL_MATCHES);
            setLoading(false);
            setIsDemoMode(true);
            return;
        }

        try {
            const app = initializeApp(firebaseConfig);
            const currentAuth = getAuth(app);
            const currentDb = getFirestore(app);

            setDb(currentDb);
            setAuth(currentAuth);

            const unsubscribe = onAuthStateChanged(currentAuth, async (currentUser) => {
                if (currentUser) {
                    setUser(currentUser);
                    setUserId(currentUser.uid);
                    setLoading(false);
                    setIsDemoMode(false); // Conexión exitosa
                } else {
                    const token = typeof __initial_auth_token !== 'undefined' ? __initial_auth_token : null;
                    try {
                        if (token) {
                            await signInWithCustomToken(currentAuth, token);
                        } else {
                            await signInAnonymously(currentAuth);
                        }
                    } catch (error) {
                        console.error("Error signing in:", error);
                        alert("No se pudo conectar a la nube (Error de Autenticación). Se usará el Modo Local.");
                        setPlayers(PLAYERS_ROSTER);
                        setMatches(INITIAL_MATCHES);
                        setLoading(false);
                        setIsDemoMode(true); // Fallback a demo
                    }
                }
            });
            return () => unsubscribe();

        } catch (error) {
            console.error("Error fatal inicializando Firebase:", error);
            alert("Error de configuración de Firebase. Se usará el Modo Local.");
            setPlayers(PLAYERS_ROSTER);
            setMatches(INITIAL_MATCHES);
            setLoading(false);
            setIsDemoMode(true);
        }
    }, []);

    // --- 2. LISTENERS DE DATOS DE FIREBASE (onSnapshot) ---
    useEffect(() => {
        if (!db || !user || isDemoMode) return;

        const collectionsToWatch = {
            players: { query: query(collection(db, PUBLIC_COLLECTION_PATH('players'))), setter: setPlayers, mapper: mapPlayer },
            matches: { query: query(collection(db, PUBLIC_COLLECTION_PATH('matches')), orderBy('date', 'desc')), setter: setMatches, mapper: mapMatch },
            myTeam: { query: query(collection(db, PUBLIC_COLLECTION_PATH('my-team'))), setter: (data: MyTeam[]) => setMyTeam(data[0] || null), mapper: mapMyTeam },
            venues: { query: query(collection(db, PUBLIC_COLLECTION_PATH('venues'))), setter: setVenues, mapper: mapVenue },
            opponents: { query: query(collection(db, PUBLIC_COLLECTION_PATH('opponents'))), setter: setOpponents, mapper: mapOpponent },
            tournaments: { query: query(collection(db, PUBLIC_COLLECTION_PATH('tournaments'))), setter: setTournaments, mapper: mapTournament },
            chatMessages: { query: query(collection(db, PUBLIC_COLLECTION_PATH('chat-messages')), orderBy('timestamp', 'asc')), setter: setChatMessages, mapper: mapChatMessage },
        };

        const unsubscribes = Object.entries(collectionsToWatch).map(([collectionName, { query, setter, mapper }]) => {
            return onSnapshot(query, (snapshot) => {
                const data = snapshot.docs.map(mapper);
                setter(data as any);
            }, (error) => {
                console.error(`Error listening to collection ${collectionName}:`, error);
            });
        });

        return () => unsubscribes.forEach(unsub => unsub());

    }, [db, user, isDemoMode]);

    // --- LÓGICA DERIVADA DEL ESTADO ---
    const loggedInPlayer = useMemo(() => {
        // Si no hay jugadores cargados (DB vacía), usamos PLAYERS_ROSTER para permitir login inicial si coincide el ID
        if (players.length === 0) return PLAYERS_ROSTER.find(p => p.id === loggedInPlayerId) || null;
        return players.find(p => p.id === loggedInPlayerId) || null;
    }, [players, loggedInPlayerId]);

    const isAdmin = useMemo(() => {
        if (!loggedInPlayer) return false;

        // --- REGLAS DE ADMINISTRADOR ---
        
        // 1. Acceso de Emergencia / Configuración Inicial
        if (players.length === 0 && !isDemoMode) return true;
        // Si no hay datos de equipo (App nueva), CUALQUIER usuario es admin temporalmente
        if (!myTeam && players.length > 0) return true;

        // 2. Administradores Maestros por ID
        if (loggedInPlayer.id === 9 || loggedInPlayer.id === 1) return true;
        
        // 3. Administradores por Nombre
        if (loggedInPlayer.nickname === 'Araña') return true;
        if (loggedInPlayer.firstName === 'Leonardo' && loggedInPlayer.lastName === 'Delgado') return true;

        // 4. Sub-administradores Temporales
        if (loggedInPlayer.isSubAdmin && loggedInPlayer.adminExpires) {
            return new Date(loggedInPlayer.adminExpires) > new Date();
        }
        
        return false;
    }, [loggedInPlayer, myTeam, players, isDemoMode]);
    
    const sortedMatches = useMemo(() => 
        [...matches].sort((a, b) => {
            try {
                const dateA = new Date(a.date.split(', ')[1] || a.date);
                const dateB = new Date(b.date.split(', ')[1] || b.date);
                return dateB.getTime() - dateA.getTime();
            } catch (e) {
                return 0;
            }
        }),
    [matches]);
    
    useEffect(() => {
        if (!selectedMatchId && sortedMatches.length > 0) {
            setSelectedMatchId(sortedMatches[0].id);
        }
    }, [sortedMatches, selectedMatchId]);
    
    const selectedMatch = useMemo(() => {
        return matches.find(m => m.id === selectedMatchId) || null;
    }, [matches, selectedMatchId]);

    const filteredChatMessages = useMemo(() => {
        if (!selectedMatchId) return [];
        return chatMessages.filter(msg => msg.matchId === selectedMatchId);
    }, [chatMessages, selectedMatchId]);

    const birthdayPlayers = useMemo(() => {
        const today = new Date();
        const currentMonth = today.getMonth();
        const currentDay = today.getDate();

        return players.filter(player => {
            if (!player.birthDate || !/^\d{4}-\d{2}-\d{2}$/.test(player.birthDate)) {
                return false;
            }
            const [, month, day] = player.birthDate.split('-').map(Number);
            return (month - 1) === currentMonth && day === currentDay;
        });
    }, [players]);

    const playerStats: PlayerStats[] = useMemo(() => {
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
    
    const treasuryData = useMemo(() => {
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

    const canViewRatings = useMemo(() => {
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


    // --- 3. FUNCIONES CRUD DE FIREBASE ---

    const setDocInFirestore = useCallback(async (collectionName: string, id: number, data: object) => {
        if (!db || isDemoMode) return;
        try {
            await setDoc(doc(db, PUBLIC_COLLECTION_PATH(collectionName), id.toString()), data);
        } catch (e) { console.error("Error writing to DB", e); }
    }, [db, isDemoMode]);

    const updateDocInFirestore = useCallback(async (collectionName: string, id: number, data: object) => {
        if (!db || isDemoMode) return;
        try {
            await updateDoc(doc(db, PUBLIC_COLLECTION_PATH(collectionName), id.toString()), data);
        } catch (e) { console.error("Error updating DB", e); }
    }, [db, isDemoMode]);

    const deleteDocInFirestore = useCallback(async (collectionName: string, id: number) => {
        if (!db || isDemoMode) return;
        try {
            await deleteDoc(doc(db, PUBLIC_COLLECTION_PATH(collectionName), id.toString()));
        } catch (e) { console.error("Error deleting from DB", e); }
    }, [db, isDemoMode]);
    
    const uploadInitialData = async () => {
        if (!db || isDemoMode) return;
        if (!window.confirm("¿Estás seguro? Esto subirá los jugadores y partidos por defecto a la base de datos. Solo haz esto si la base de datos está vacía.")) return;

        setIsSyncing(true);
        try {
            const batch = writeBatch(db);

            // Upload Players
            PLAYERS_ROSTER.forEach(player => {
                const ref = doc(db, PUBLIC_COLLECTION_PATH('players'), player.id.toString());
                batch.set(ref, player);
            });

            // Upload Matches
            INITIAL_MATCHES.forEach(match => {
                const { id, ...matchData } = match;
                const cleanMatchData = JSON.parse(JSON.stringify(matchData)); 
                const ref = doc(db, PUBLIC_COLLECTION_PATH('matches'), match.id.toString());
                batch.set(ref, cleanMatchData);
            });

            await batch.commit();
            alert("¡Datos subidos correctamente! Ahora todos los usuarios verán esta información.");
        } catch (error) {
            console.error("Error uploading initial data:", error);
            alert("Hubo un error subiendo los datos. Revisa la consola.");
        } finally {
            setIsSyncing(false);
        }
    };


    // ** A. Jugadores (Players) **
    const handleAddPlayer = useCallback(async (newPlayer: Omit < Player, 'id' > ) => {
        const newId = generateNumericId();
        const playerWithId: Player = { ...newPlayer, id: newId };
        
        if (isDemoMode) {
            setPlayers(prev => [...prev, playerWithId]);
        }
        
        if (db && !isDemoMode) {
            await setDocInFirestore('players', newId, newPlayer);
        }

        // Update matches logic (Local or Remote)
        if (matches.length > 0) {
             const updatedMatches = matches.map(match => ({
                ...match,
                playerStatuses: [
                    ...match.playerStatuses, {
                        playerId: newId,
                        attendanceStatus: AttendanceStatusEnum.PENDING,
                        paymentStatus: PaymentStatus.UNPAID,
                        amountPaid: 0,
                        goals: 0,
                        yellowCards: 0,
                        redCard: false,
                        quartersPlayed: 0
                    }
                ]
            }));
            
            if (isDemoMode) setMatches(updatedMatches);

            if (db && !isDemoMode) {
                const batch = writeBatch(db);
                matches.forEach(match => {
                    const matchRef = doc(db, PUBLIC_COLLECTION_PATH('matches'), match.id.toString());
                     const status = updatedMatches.find(m => m.id === match.id)?.playerStatuses;
                     if(status) batch.update(matchRef, { playerStatuses: status });
                });
                await batch.commit();
            }
        }
    }, [db, matches, setDocInFirestore, isDemoMode]);

    const handleUpdatePlayer = useCallback(async (player: Player) => {
        if (isDemoMode) setPlayers(prev => prev.map(p => p.id === player.id ? player : p));
        if (db && !isDemoMode) {
            const { id, ...playerData } = player;
            await updateDocInFirestore('players', id, playerData);
        }
    }, [db, updateDocInFirestore, isDemoMode]);

    const handleDeletePlayer = useCallback(async (playerId: number) => {
        if (isDemoMode) {
            setPlayers(prev => prev.filter(p => p.id !== playerId));
            const updatedMatches = matches.map(match => ({
                ...match,
                playerStatuses: match.playerStatuses.filter(ps => ps.playerId !== playerId)
            }));
            setMatches(updatedMatches);
        }

        if (db && !isDemoMode) {
            await deleteDocInFirestore('players', playerId);
             // Cleanup matches in DB
            const updatedMatches = matches.map(match => ({
                ...match,
                playerStatuses: match.playerStatuses.filter(ps => ps.playerId !== playerId)
            }));
            const batch = writeBatch(db);
            matches.forEach(match => {
                const matchRef = doc(db, PUBLIC_COLLECTION_PATH('matches'), match.id.toString());
                const status = updatedMatches.find(m => m.id === match.id)?.playerStatuses;
                if (status) batch.update(matchRef, { playerStatuses: status });
            });
            await batch.commit();
        }
    }, [db, matches, deleteDocInFirestore, isDemoMode]);


    // ** B. Mi Equipo (MyTeam) **
    const handleSaveMyTeam = useCallback(async (teamData: MyTeam) => {
        if (isDemoMode) setMyTeam(teamData);
        if (db && !isDemoMode) {
            await setDoc(doc(db, PUBLIC_COLLECTION_PATH('my-team'), 'teamData'), teamData);
        }
    }, [db, isDemoMode]);


    // ** C. Canchas (Venues) **
    const handleAddVenue = useCallback(async (newVenue: Omit < Venue, 'id' > ) => {
        const newId = generateNumericId();
        if (isDemoMode) setVenues(prev => [...prev, { ...newVenue, id: newId }]);
        if (db && !isDemoMode) {
            await setDocInFirestore('venues', newId, newVenue);
        }
    }, [db, setDocInFirestore, isDemoMode]);

    const handleUpdateVenue = useCallback(async (venue: Venue) => {
        if (isDemoMode) setVenues(prev => prev.map(v => v.id === venue.id ? venue : v));
        if (db && !isDemoMode) {
            const { id, ...venueData } = venue;
            await updateDocInFirestore('venues', id, venueData);
        }
    }, [db, updateDocInFirestore, isDemoMode]);

    const handleDeleteVenue = useCallback(async (venueId: number) => {
        if (isDemoMode) setVenues(prev => prev.filter(v => v.id !== venueId));
        if (db && !isDemoMode) {
            await deleteDocInFirestore('venues', venueId);
        }
    }, [db, deleteDocInFirestore, isDemoMode]);


    // ** D. Rivales (Opponents) **
    const handleAddOpponent = useCallback(async (newOpponent: Omit < Opponent, 'id' > ) => {
        const newId = generateNumericId();
        if (isDemoMode) setOpponents(prev => [...prev, { ...newOpponent, id: newId }]);
        if (db && !isDemoMode) {
            await setDocInFirestore('opponents', newId, newOpponent);
        }
    }, [db, setDocInFirestore, isDemoMode]);

    const handleUpdateOpponent = useCallback(async (opponent: Opponent) => {
        if (isDemoMode) setOpponents(prev => prev.map(o => o.id === opponent.id ? opponent : o));
        if (db && !isDemoMode) {
            const { id, ...opponentData } = opponent;
            await updateDocInFirestore('opponents', id, opponentData);
        }
    }, [db, updateDocInFirestore, isDemoMode]);

    const handleDeleteOpponent = useCallback(async (opponentId: number) => {
        if (isDemoMode) setOpponents(prev => prev.filter(o => o.id !== opponentId));
        if (db && !isDemoMode) {
            await deleteDocInFirestore('opponents', opponentId);
        }
    }, [db, deleteDocInFirestore, isDemoMode]);


    // ** E. Torneos (Tournaments) **
    const handleAddTournament = useCallback(async (newTournament: Omit < Tournament, 'id' > ) => {
        const newId = generateNumericId();
        if (isDemoMode) setTournaments(prev => [...prev, { ...newTournament, id: newId }]);
        if (db && !isDemoMode) {
            await setDocInFirestore('tournaments', newId, newTournament);
        }
    }, [db, setDocInFirestore, isDemoMode]);

    const handleUpdateTournament = useCallback(async (tournament: Tournament) => {
        if (isDemoMode) setTournaments(prev => prev.map(t => t.id === tournament.id ? tournament : t));
        if (db && !isDemoMode) {
            const { id, ...tournamentData } = tournament;
            await updateDocInFirestore('tournaments', id, tournamentData);
        }
    }, [db, updateDocInFirestore, isDemoMode]);

    const handleDeleteTournament = useCallback(async (tournamentId: number) => {
        if (isDemoMode) {
            setTournaments(prev => prev.filter(t => t.id !== tournamentId));
            setMatches(prev => prev.filter(m => m.tournamentId !== tournamentId));
        }
        if (db && !isDemoMode) {
            try {
                await deleteDocInFirestore('tournaments', tournamentId);
                const matchesToDelete = matches.filter(m => m.tournamentId === tournamentId);
                if (matchesToDelete.length > 0) {
                    const batch = writeBatch(db);
                    matchesToDelete.forEach(match => {
                        batch.delete(doc(db, PUBLIC_COLLECTION_PATH('matches'), match.id.toString()));
                    });
                    await batch.commit();
                }
            } catch (error) {
                console.error("Error deleting tournament and associated matches:", error);
            }
        }
    }, [db, matches, deleteDocInFirestore, isDemoMode]);


    // ** F. Partidos (Matches) **
    const handleAddMatch = useCallback(async (newMatchData: Omit<Match, 'id' | 'playerStatuses' | 'ratingStatus'>) => {
        const newId = generateNumericId();
        const initialPlayerStatuses = players.map(player => ({
            playerId: player.id,
            attendanceStatus: AttendanceStatusEnum.PENDING,
            paymentStatus: PaymentStatus.UNPAID,
            amountPaid: 0,
            goals: 0,
            yellowCards: 0,
            redCard: false,
            quartersPlayed: 0,
        }));
    
        const venue = venues.find(v => v.id === newMatchData.venueId);
        
        const newMatch: Match = {
            id: newId,
            ...newMatchData,
            location: venue?.name || 'Cancha a definir',
            address: venue?.address || 'Dirección a definir',
            playerStatuses: initialPlayerStatuses,
            ratingStatus: 'CLOSED',
            status: 'PROGRAMADO',
        };
        
        if (isDemoMode) setMatches(prev => [newMatch, ...prev].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()));
        
        if (db && !isDemoMode) {
            const { id, ...matchForDb } = newMatch;
            await setDocInFirestore('matches', newId, matchForDb);
        }
    }, [db, players, venues, setDocInFirestore, isDemoMode]);

    const handleUpdateMatch = useCallback(async (match: Match) => {
        if (isDemoMode) setMatches(prev => prev.map(m => m.id === match.id ? match : m));
        if (db && !isDemoMode) {
            const { id, ...matchData } = match;
            await updateDocInFirestore('matches', id, matchData);
        }
    }, [db, updateDocInFirestore, isDemoMode]);

    const handleDeleteMatch = useCallback(async (matchId: number) => {
        if (isDemoMode) setMatches(prev => prev.filter(m => m.id !== matchId));
        if (db && !isDemoMode) {
            await deleteDocInFirestore('matches', matchId);
        }
    }, [db, deleteDocInFirestore, isDemoMode]);


    // ** G. Chat (ChatMessages) **
    const handleAddMessage = useCallback(async (text: string) => {
        if (!loggedInPlayerId || !selectedMatchId) return;
        const player = players.find(p => p.id === loggedInPlayerId);
        if (!player) return;

        const newId = generateNumericId();
        const newMessage: ChatMessage = {
            id: newId,
            matchId: selectedMatchId,
            text,
            senderId: player.id,
            senderName: player.nickname,
            senderPhotoUrl: player.photoUrl,
            reactions: {},
            timestamp: new Date(),
        };
        
        if (isDemoMode) setChatMessages(prev => [...prev, newMessage]);

        if (db && !isDemoMode) {
            const { id, ...messageForDb } = newMessage;
            await setDocInFirestore('chat-messages', newId, { ...messageForDb, timestamp: serverTimestamp() });
        }
    }, [db, loggedInPlayerId, players, selectedMatchId, setDocInFirestore, isDemoMode]);

    const handleDeleteMessage = useCallback(async (messageId: number) => {
        if (isDemoMode) setChatMessages(prev => prev.filter(m => m.id !== messageId));
        if (db && !isDemoMode) {
            await deleteDocInFirestore('chat-messages', messageId);
        }
    }, [db, deleteDocInFirestore, isDemoMode]);
    
    const handleToggleReaction = useCallback(async (messageId: number, emoji: string) => {
        if (!loggedInPlayerId) return;
        
        const message = chatMessages.find(m => m.id === messageId);
        if (!message) return;

        const newReactions = JSON.parse(JSON.stringify(message.reactions || {}));
        
        if (!newReactions[emoji]) {
            newReactions[emoji] = [];
        }

        const userIndex = newReactions[emoji].indexOf(loggedInPlayerId);

        if (userIndex > -1) {
            newReactions[emoji].splice(userIndex, 1);
            if (newReactions[emoji].length === 0) {
                delete newReactions[emoji];
            }
        } else {
            newReactions[emoji].push(loggedInPlayerId);
        }
        
        if (isDemoMode) {
            setChatMessages(prev => prev.map(m => 
                m.id === messageId ? { ...m, reactions: newReactions } : m
            ));
        }
        
        if (db && !isDemoMode) {
            await updateDocInFirestore('chat-messages', messageId, { reactions: newReactions });
        }
    }, [db, loggedInPlayerId, chatMessages, updateDocInFirestore, isDemoMode]);

    // ** H. Generación de Equipos (Equipos) **
    const handleGenerateTeams = useCallback(async () => {
        if (!selectedMatch) return;

        const confirmedPlayerIds = selectedMatch.playerStatuses
            .filter(p => p.attendanceStatus === AttendanceStatusEnum.CONFIRMED)
            .map(p => p.playerId);

        const confirmedPlayers = players.filter(p => confirmedPlayerIds.includes(p.id));

        if (confirmedPlayers.length < 2) {
            alert("Se necesitan al menos 2 jugadores confirmados para armar los equipos.");
            return;
        }

        setIsGeneratingTeams(true);
        try {
            const generatedTeams = await generateTeams(confirmedPlayers);
            setTeams(generatedTeams);
        } catch (error) {
            console.error("Failed to generate teams", error);
        } finally {
            setIsGeneratingTeams(false);
        }
    }, [selectedMatch, players]);
    
    // ** I. Gestión de Asistencia y Pagos (PlayerMatchStatus) **
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
    
    // ** J. Resultados y Detalles del Partido **
    const handleCourtFeeChange = useCallback((matchId: number, newFee: number) => {
        const match = matches.find(m => m.id === matchId);
        if (match) {
           handleUpdateMatch({...match, courtFee: newFee});
        }
    }, [matches, handleUpdateMatch]);

    const handleStandingsChange = useCallback((matchId: number, teamId: number, newPosition: number) => {
         const match = matches.find(m => m.id === matchId);
        if (!match || !match.standings) return;
        const updatedStandings = match.standings.map(s => s.id === teamId ? {...s, position: newPosition} : s);
        handleUpdateMatch({...match, standings: updatedStandings});
    }, [matches, handleUpdateMatch]);

    const handleToggleRatingStatus = useCallback((matchId: number) => {
        const match = matches.find(m => m.id === matchId);
        if (match) {
            const newStatus = match.ratingStatus === 'OPEN' ? 'CLOSED' : 'OPEN';
            handleUpdateMatch({ ...match, ratingStatus: newStatus });
        }
    }, [matches, handleUpdateMatch]);
    
    
    // ** K. Puntuaciones de Jugadores (Player Ratings) **
    const handlePlayerRatingChange = useCallback((matchId: number, raterId: number, rateeId: number, rating: number) => {
        const match = matches.find(m => m.id === matchId);
        if (!match) return;

        const newRatings = { ...(match.ratings || {}) };
        if (!newRatings[raterId]) {
            newRatings[raterId] = {};
        }
        newRatings[raterId][rateeId] = rating;
        
        handleUpdateMatch({ ...match, ratings: newRatings });

    }, [matches, handleUpdateMatch]);
    
    // ** L. Estadísticas del Partido (Player Stats) **
    const handlePlayerStatsChange = useCallback((matchId: number, playerId: number, field: keyof PlayerMatchStatus, value: any) => {
        const match = matches.find(m => m.id === matchId);
        if (!match) return;
    
        const updatedStatuses = match.playerStatuses.map(ps => {
            if (ps.playerId === playerId) {
                const updatedPs = { ...ps, [field]: value };
                if (field === 'yellowCards' && value === 2) {
                    updatedPs.redCard = true;
                }
                return updatedPs;
            }
            return ps;
        });
    
        handleUpdateMatch({ ...match, playerStatuses: updatedStatuses });
    
    }, [matches, handleUpdateMatch]);
    
    
    const handleOpponentScoreChange = useCallback((matchId: number, newScore: number) => {
        const match = matches.find(m => m.id === matchId);
        if (match) {
            handleUpdateMatch({ ...match, opponentScore: newScore });
        }
    }, [matches, handleUpdateMatch]);


    const renderPage = () => {
        if (!loggedInPlayer) return null;
        switch (currentPage) {
            case 'home':
                return (
                    <div className="space-y-6">
                         {!isDemoMode && players.length === 0 && isAdmin && (
                             <div className="bg-blue-100 border-l-4 border-blue-500 text-blue-700 p-4 mb-6 rounded-md shadow-sm" role="alert">
                                <p className="font-bold">¡Base de datos conectada pero vacía!</p>
                                <p className="text-sm mb-3">Parece que has configurado Firebase pero aún no hay datos. Puedes subir los datos de prueba iniciales (Jugadores y Partido) con un solo clic.</p>
                                <button 
                                    onClick={uploadInitialData} 
                                    disabled={isSyncing}
                                    className="px-4 py-2 bg-blue-600 text-white font-semibold rounded hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2"
                                >
                                    {isSyncing ? 'Subiendo...' : '📤 Cargar Datos Iniciales en la Nube'}
                                </button>
                            </div>
                        )}
                        
                        <MatchSelector
                            matches={matches}
                            opponents={opponents}
                            selectedMatchId={selectedMatchId}
                            onSelectMatch={setSelectedMatchId}
                        />
                        <BirthdayCard players={birthdayPlayers} />
                        <MotivationalQuote />
                        {selectedMatch && loggedInPlayer && (
                            <MatchCard
                                match={selectedMatch}
                                players={players}
                                currentUser={loggedInPlayer}
                                myTeam={myTeam}
                                opponents={opponents}
                                onPlayerStatusChange={handlePlayerStatusChange}
                                onPlayerPaymentChange={handlePlayerPaymentChange}
                                onCourtFeeChange={handleCourtFeeChange}
                                onStandingsChange={handleStandingsChange}
                                onPlayerRatingChange={handlePlayerRatingChange}
                                onToggleRatingStatus={handleToggleRatingStatus}
                                onPlayerStatsChange={handlePlayerStatsChange}
                                onOpponentScoreChange={handleOpponentScoreChange}
                                teams={teams}
                                isGeneratingTeams={isGeneratingTeams}
                                onGenerateTeams={handleGenerateTeams}
                                isAdmin={isAdmin}
                            />
                        )}
                         {!selectedMatch && (
                             <div className="text-center p-8 bg-white dark:bg-gray-800 rounded-lg shadow-md">
                                <h2 className="text-2xl font-bold mb-4">¡Bienvenido!</h2>
                                <p className="text-gray-600 dark:text-gray-400">Aún no hay partidos programados. {isAdmin && 'Ve a la sección "Torneos" para crear uno.'}</p>
                            </div>
                        )}
                    </div>
                );
            case 'fixture':
                return <FixturePage myTeam={myTeam} tournaments={tournaments} matches={matches} opponents={opponents} venues={venues} setCurrentPage={setCurrentPage} setSelectedMatchId={setSelectedMatchId} />;
            case 'tournaments':
                return <TournamentsPage tournaments={tournaments} matches={matches} venues={venues} opponents={opponents} onAddTournament={handleAddTournament} onUpdateTournament={handleUpdateTournament} onDeleteTournament={handleDeleteTournament} onAddMatch={handleAddMatch} onUpdateMatch={handleUpdateMatch} onDeleteMatch={handleDeleteMatch} setCurrentPage={setCurrentPage} setSelectedMatchId={setSelectedMatchId} isAdmin={isAdmin} />;
            case 'venues':
                return <VenuesPage venues={venues} onAddVenue={handleAddVenue} onUpdateVenue={handleUpdateVenue} onDeleteVenue={handleDeleteVenue} isAdmin={isAdmin} />;
            case 'opponents':
                return <OpponentsPage opponents={opponents} onAddOpponent={handleAddOpponent} onUpdateOpponent={handleUpdateOpponent} onDeleteOpponent={handleDeleteOpponent} isAdmin={isAdmin} />;
            case 'my-team':
                return <MyTeamPage team={myTeam} onSave={handleSaveMyTeam} isAdmin={isAdmin} currentUser={loggedInPlayer} players={players} onUpdatePlayer={handleUpdatePlayer} />;
            case 'statistics':
                return <StatisticsPage stats={playerStats} canViewRatings={canViewRatings} />;
            case 'treasury':
                return <TreasuryPage data={treasuryData} />;
            case 'help':
                return <HelpPage isAdmin={isAdmin}/>;
            default:
                return <div>Página no encontrada</div>;
        }
    };

    // Show loading state while auth and DB are initializing
    if (loading && !isDemoMode) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-100 dark:bg-gray-900">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
                    <p className="text-gray-600 dark:text-gray-300">Conectando a la base de datos...</p>
                </div>
            </div>
        );
    }

    // If DB is empty and we are not in Demo Mode, we need to provide a way to login as Admin.
    // We use the UserSelectionModal, but we need to populate it with mock players if players array is empty so the admin can select themselves and then Upload Data.
    const effectivePlayersForLogin = players.length > 0 ? players : PLAYERS_ROSTER;

    if (!loggedInPlayerId) {
        return (
            <>
                {isDemoMode && (
                     <div className="bg-amber-500 text-white text-center p-2 text-sm font-bold sticky top-0 z-50">
                        ⚠️ MODO DEMO OFFLINE: Los datos no se guardarán.
                    </div>
                )}
                <UserSelectionModal 
                    players={effectivePlayersForLogin} 
                    onSelectUser={(player) => setLoggedInPlayerId(player.id)} 
                    isPinAuthEnabled={isPinAuthEnabled} 
                    onTogglePinAuth={() => setIsPinAuthEnabled(prev => !prev)} 
                />
            </>
        );
    }
    
    return (
        <div className="min-h-screen bg-gray-100 dark:bg-gray-900 text-gray-900 dark:text-gray-100 font-sans flex flex-col">
            {isRosterModalOpen && (
                <RosterManagementModal
                    players={players}
                    onClose={() => setIsRosterModalOpen(false)}
                    onAddPlayer={handleAddPlayer}
                    onUpdatePlayer={handleUpdatePlayer}
                    onDeletePlayer={handleDeletePlayer}
                />
            )}
            
            <Header
                currentUser={loggedInPlayer || (effectivePlayersForLogin.find(p => p.id === loggedInPlayerId) as Player)}
                onOpenRoster={() => setIsRosterModalOpen(true)}
                onChangeUser={() => setLoggedInPlayerId(null)}
                currentPage={currentPage}
                setCurrentPage={setCurrentPage}
                isAdmin={isAdmin}
            />
            
            <main className="container mx-auto p-4 md:p-6 flex-grow pb-16">
                {renderPage()}
            </main>

             {/* Status Footer */}
            <footer className="fixed bottom-0 w-full bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 p-2 z-50 flex justify-between items-center text-xs px-4">
                <span className="text-gray-500 dark:text-gray-400">© 2025 Players LD</span>
                <div className="flex items-center space-x-2">
                    <div className={`w-2 h-2 rounded-full ${!isDemoMode ? 'bg-green-500 animate-pulse' : 'bg-orange-500'}`}></div>
                    <span className={`font-bold ${!isDemoMode ? 'text-green-600 dark:text-green-400' : 'text-orange-500'}`}>
                        {!isDemoMode ? 'CONECTADO A NUBE' : 'MODO LOCAL (NO GUARDA)'}
                    </span>
                </div>
            </footer>

            {selectedMatch && (
                 <>
                    <button
                        onClick={() => setIsChatOpen(true)}
                        className="fixed bottom-12 right-6 bg-green-600 text-white p-3 rounded-full shadow-lg hover:bg-green-700 transition-colors z-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 flex items-center px-5 mb-2"
                        aria-label="Abrir chat"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6">
                            <path fillRule="evenodd" d="M4.804 21.644A6.707 6.707 0 0 0 6 21.75a6.721 6.721 0 0 0 3.583-1.029c.774.182 1.584.279 2.417.279 5.352 0 9.75-3.62 9.75-8.125S17.352 4.75 12 4.75c-4.636 0-8.547 3.028-9.456 7.027.06.002.12.004.181.004A6.72 6.72 0 0 0 6 11.25a6.72 6.72 0 0 0-1.196.166Z" clipRule="evenodd" />
                            <path fillRule="evenodd" d="M1.086 13.522a8.216 8.216 0 0 0 2.52.426A8.203 8.203 0 0 1 6 14.25c.094 0 .188.003.28.008a8.21 8.21 0 0 0 2.288 1.414 6.71 6.71 0 0 0 2.86.376 6.71 6.71 0 0 0 2.86-.376 8.21 8.21 0 0 0 2.288-1.414c.092-.005.186-.008.28-.008a8.203 8.203 0 0 1 2.394-.302c1.075 0 2.033.204 2.82.572.348.16.482.593.26.876a11.192 11.192 0 0 1-2.392 2.152 10.99 10.99 0 0 1-1.42 1.045 8.212 8.212 0 0 1-2.288 1.414 6.72 6.72 0 0 1-5.72 0 8.212 8.212 0 0 1-2.288-1.414 10.99 10.99 0 0 1-1.42-1.045A11.191 11.191 0 0 1 .825 14.4c-.222-.282-.087-.715.26-.877Z" clipRule="evenodd" />
                        </svg>
                        <span className="ml-2 font-semibold">Chat!</span>
                    </button>

                    {isChatOpen && (
                        <div className="fixed inset-0 bg-black/60 flex justify-center items-center z-[60] p-4" onClick={() => setIsChatOpen(false)}>
                            <div className="w-full max-w-2xl h-[85vh] max-h-[700px] bg-transparent" onClick={e => e.stopPropagation()}>
                                <Chat
                                    currentUser={loggedInPlayer || (effectivePlayersForLogin.find(p => p.id === loggedInPlayerId) as Player)}
                                    players={players.length > 0 ? players : effectivePlayersForLogin}
                                    messages={filteredChatMessages}
                                    onAddMessage={handleAddMessage}
                                    onDeleteMessage={handleDeleteMessage}
                                    onToggleReaction={handleToggleReaction}
                                    matchTitle={selectedMatch?.date}
                                    birthdayPlayers={birthdayPlayers}
                                />
                            </div>
                        </div>
                    )}
                 </>
            )}
        </div>
    );
};

export default App;