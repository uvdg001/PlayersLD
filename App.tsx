
import React, { useState, useEffect, useMemo } from 'react';
import { Header } from './components/Header.tsx';
import { PlayerList } from './components/PlayerList.tsx';
import { MatchCard } from './components/MatchCard.tsx';
import { RosterManagementModal } from './components/RosterManagementModal.tsx';
import { UserSelectionModal } from './components/UserSelectionModal.tsx';
import { Chat } from './components/Chat.tsx';
import { PaymentModal } from './components/PaymentModal.tsx';
import { PlayerProfileModal } from './components/PlayerProfileModal.tsx';
import { ToastContainer } from './components/Toast.tsx';
import { MyTeamPage } from './components/pages/MyTeamPage.tsx';
import { OpponentsPage } from './components/pages/OpponentsPage.tsx';
import { VenuesPage } from './components/pages/VenuesPage.tsx';
import { TournamentsPage } from './components/pages/TournamentsPage.tsx';
import { FixturePage } from './components/pages/FixturePage.tsx';
import { StatisticsPage } from './components/pages/StatisticsPage.tsx';
import { TreasuryPage } from './components/pages/TreasuryPage.tsx';
import { LogisticsPage } from './components/pages/LogisticsPage.tsx';
import { HelpPage } from './components/pages/HelpPage.tsx';
import { MatchForm } from './components/forms/MatchForm.tsx';
import { BirthdayCard } from './components/BirthdayCard.tsx';
import { PlayerForm } from './components/PlayerForm.tsx'; // Import PlayerForm for profile editing

import { useToast } from './hooks/useToast.ts';
import { useLocalStorage } from './hooks/useLocalStorage.ts';
import { generateTeamsAI } from './services/geminiService.ts';
import { 
    subscribeToCollection, 
    saveDocument, 
    deleteDocument, 
    subscribeToMessages, 
    addMessage, 
    deleteMessage, 
    toggleReaction,
    isCollectionEmpty,
    getFirestoreInstance
} from './services/firebaseService.ts';

import { 
    INITIAL_PLAYERS, 
    INITIAL_MY_TEAM, 
    INITIAL_APP_SETTINGS
} from './constants.ts';

import { PaymentStatus } from './types.ts';

import type { 
    Player, 
    Match, 
    Page, 
    AttendanceStatus, 
    Teams, 
    PlayerMatchStatus, 
    ChatMessage, 
    PlayerStats, 
    MyTeam, 
    Opponent, 
    Venue, 
    Tournament,
    AppSettings
} from './types.ts';

const App: React.FC = () => {
    // --- ESTADO GLOBAL ---
    const [currentUser, setCurrentUser] = useLocalStorage<Player | null>('currentUser', null);
    const [currentPage, setCurrentPage] = useState<Page>('home');
    const [isRosterModalOpen, setIsRosterModalOpen] = useState(false);
    const [isMatchFormOpen, setIsMatchFormOpen] = useState(false);
    const [matchFormParams, setMatchFormParams] = useState<{ tournamentId: number, match?: Match } | null>(null);
    const [selectedPlayerForPayment, setSelectedPlayerForPayment] = useState<Player | null>(null);
    const [paymentModalMatchId, setPaymentModalMatchId] = useState<number | null>(null);
    const [selectedPlayerForProfile, setSelectedPlayerForProfile] = useState<Player | null>(null);
    const [teams, setTeams] = useState<Teams | null>(null);
    const [isChatOpen, setIsChatOpen] = useState(false);
    const [isGeneratingTeams, setIsGeneratingTeams] = useState(false);
    const [isFirebaseOnline, setIsFirebaseOnline] = useState(true);
    
    // Edit Profile State
    const [isEditProfileOpen, setIsEditProfileOpen] = useState(false);

    // --- DATOS DE FIREBASE ---
    const [players, setPlayers] = useState<Player[]>([]);
    const [matches, setMatches] = useState<Match[]>([]);
    const [myTeam, setMyTeam] = useState<MyTeam | null>(null);
    const [opponents, setOpponents] = useState<Opponent[]>([]);
    const [venues, setVenues] = useState<Venue[]>([]);
    const [tournaments, setTournaments] = useState<Tournament[]>([]);
    const [appSettings, setAppSettings] = useState<AppSettings>(INITIAL_APP_SETTINGS);
    
    // --- CHAT STATE ---
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [selectedMatchId, setSelectedMatchId] = useState<number | null>(null);

    const toast = useToast();

    // --- INITIALIZATION & SUBSCRIPTIONS ---
    useEffect(() => {
        const db = getFirestoreInstance();
        if (!db) {
            setIsFirebaseOnline((prev) => {
                if (prev) toast.error("Modo Offline: No se pudo conectar a Firebase. Revisa tu configuración.");
                return false;
            });
            setPlayers(INITIAL_PLAYERS);
            setMyTeam(INITIAL_MY_TEAM);
            return;
        }

        const checkData = async () => {
             try {
                 const playersEmpty = await isCollectionEmpty('players');
                 if (playersEmpty) {
                     console.log("Sembrando datos iniciales...");
                     for (const p of INITIAL_PLAYERS) await saveDocument('players', p.id.toString(), p);
                     await saveDocument('settings', 'appSettings', INITIAL_APP_SETTINGS);
                     await saveDocument('myTeam', 'info', INITIAL_MY_TEAM);
                 }
             } catch (e) {
                 console.error("Error checking/seeding data:", e);
             }
        };
        checkData();

        const handleConnectionError = (err: Error) => {
             console.error("Firebase connection error:", err);
             setIsFirebaseOnline((prev) => {
                 if (prev) return false;
                 return prev;
             });
        };

        const unsubPlayers = subscribeToCollection<Player>('players', null, setPlayers, handleConnectionError);
        const unsubMatches = subscribeToCollection<Match>('matches', null, setMatches, () => {});
        const unsubOpponents = subscribeToCollection<Opponent>('opponents', null, setOpponents, () => {});
        const unsubVenues = subscribeToCollection<Venue>('venues', null, setVenues, () => {});
        const unsubTournaments = subscribeToCollection<Tournament>('tournaments', null, setTournaments, () => {});
        
        const unsubSettings = subscribeToCollection<any>('settings', 'appSettings', (data) => {
            if (data[0]) setAppSettings(data[0] as AppSettings);
        }, () => {});
        
        const unsubMyTeam = subscribeToCollection<any>('myTeam', 'info', (data) => {
            if (data[0]) setMyTeam(data[0] as MyTeam);
        }, () => {});

        return () => {
            unsubPlayers();
            unsubMatches();
            unsubOpponents();
            unsubVenues();
            unsubTournaments();
            unsubSettings();
            unsubMyTeam();
        };
    }, []);

    // --- CHAT SUBSCRIPTION ---
    useEffect(() => {
        let chatId = 'general';
        if (selectedMatchId) {
            chatId = selectedMatchId.toString();
        } else {
             const nextMatch = matches
                .filter(m => m.status !== 'FINALIZADO')
                .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())[0];
             if (nextMatch) chatId = nextMatch.id.toString();
        }

        const unsubChat = subscribeToMessages(chatId, setMessages, (err) => console.error("Chat error", err));
        return () => unsubChat();
    }, [selectedMatchId, matches]);

    useEffect(() => {
        if (matchFormParams) setIsMatchFormOpen(true);
    }, [matchFormParams]);


    // --- COMPUTED PROPERTIES ---
    const nextMatch = useMemo(() => {
        if (selectedMatchId) {
            return matches.find(m => m.id === selectedMatchId) || null;
        }
        return matches
            .filter(m => m.status !== 'FINALIZADO')
            .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())[0] || null;
    }, [matches, selectedMatchId]);

    const isSuperAdmin = currentUser?.id === appSettings.superAdminPlayerId;
    const isSubAdmin = currentUser?.isSubAdmin === true && (!currentUser.adminExpires || new Date(currentUser.adminExpires) > new Date());
    const isAdmin = isSuperAdmin || isSubAdmin;

    const activePlayers = players;

    const playerStats: PlayerStats[] = useMemo(() => {
        return players.map(player => {
            const playerMatches = matches.filter(m => m.playerStatuses.some(ps => ps.playerId === player.id));
            
            const attendance = { confirmed: 0, doubtful: 0, absent: 0 };
            
            let totalAmountPaid = 0;
            let totalQuartersPlayed = 0;
            let totalGoals = 0;
            let goalsPlay = 0, goalsPenalty = 0, goalsHeader = 0, goalsSetPiece = 0;
            let yellowCards = 0, redCards = 0;
            let matchesWashed = 0;
            
            let pj = 0, pg = 0, pe = 0, pp = 0;
            let ratingSum = 0;
            let ratingCount = 0;

            playerMatches.forEach(match => {
                const ps = match.playerStatuses.find(s => s.playerId === player.id)!;
                
                if (ps.attendanceStatus === 'CONFIRMED') attendance.confirmed++;
                if (ps.attendanceStatus === 'DOUBTFUL') attendance.doubtful++;
                if (ps.attendanceStatus === 'ABSENT') attendance.absent++;

                if (match.status === 'FINALIZADO' && ps.attendanceStatus === 'CONFIRMED') {
                    pj++;
                    totalAmountPaid += ps.amountPaid || 0;
                    totalQuartersPlayed += ps.quartersPlayed || 0;
                    
                    goalsPlay += ps.goalsPlay || 0;
                    goalsPenalty += ps.goalsPenalty || 0;
                    goalsHeader += ps.goalsHeader || 0;
                    goalsSetPiece += ps.goalsSetPiece || 0;
                    
                    yellowCards += ps.yellowCards || 0;
                    if (ps.redCard) redCards++;

                    const myScore = match.playerStatuses.reduce((acc, curr) => 
                        acc + (curr.goalsPlay||0) + (curr.goalsPenalty||0) + (curr.goalsHeader||0) + (curr.goalsSetPiece||0), 0);
                    const oppScore = match.opponentScore || 0;
                    
                    if (myScore > oppScore) pg++;
                    else if (myScore < oppScore) pp++;
                    else pe++;

                    if (match.ratings) {
                        let matchRatingSum = 0;
                        let matchRatingCount = 0;
                        Object.values(match.ratings).forEach(raterRatings => {
                            if (raterRatings[player.id]) {
                                matchRatingSum += raterRatings[player.id];
                                matchRatingCount++;
                            }
                        });
                        if (matchRatingCount > 0) {
                            ratingSum += (matchRatingSum / matchRatingCount);
                            ratingCount++;
                        }
                    }
                }
                
                if (match.status === 'FINALIZADO' && match.jerseyWasherId === player.id) {
                    matchesWashed++;
                }
            });

            totalGoals = goalsPlay + goalsPenalty + goalsHeader + goalsSetPiece;

            const lastWashMatch = matches
                .filter(m => m.status === 'FINALIZADO' && m.jerseyWasherId === player.id)
                .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0];
            
            let matchesSinceWash = 0;
            if (!lastWashMatch) {
                matchesSinceWash = pj;
            } else {
                matchesSinceWash = matches
                    .filter(m => m.status === 'FINALIZADO' && new Date(m.date) > new Date(lastWashMatch.date))
                    .length;
            }

            return {
                player,
                attendance,
                avgRating: ratingCount > 0 ? ratingSum / ratingCount : 0,
                ratingCount,
                totalAmountPaid,
                totalQuartersPlayed,
                pj, pg, pe, pp,
                totalGoals,
                goalsPlay, goalsPenalty, goalsHeader, goalsSetPiece,
                yellowCards, redCards,
                matchesWashed,
                matchesSinceWash
            };
        });
    }, [players, matches]);

    const treasuryData = useMemo(() => {
        let totalSpent = 0;
        let totalCollected = 0;
        const matchesData = matches
            .filter(m => m.status === 'FINALIZADO')
            .map(m => {
                const collected = m.playerStatuses.reduce((acc, ps) => acc + (ps.amountPaid || 0), 0);
                totalSpent += m.courtFee;
                totalCollected += collected;
                return { ...m, collected, balance: collected - m.courtFee };
            })
            .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

        return {
            totalSpent,
            totalCollected,
            balance: totalCollected - totalSpent,
            matches: matchesData
        };
    }, [matches]);

    const birthdayPlayers = useMemo(() => {
        const today = new Date();
        const currentMonth = today.getMonth() + 1;
        const currentDay = today.getDate();
        return players.filter(p => {
            const [year, month, day] = p.birthDate.split('-').map(Number);
            return month === currentMonth && day === currentDay;
        });
    }, [players]);

    // --- ACTIONS ---

    const handlePlayerStatusChange = async (matchId: number, playerId: number, newStatus: AttendanceStatus) => {
        if (!currentUser) return;
        if (!isAdmin && currentUser.id !== playerId) {
            toast.error("No puedes cambiar la asistencia de otro jugador.");
            return;
        }

        const match = matches.find(m => m.id === matchId);
        if (!match) return;

        if (match.status === 'FINALIZADO' && !isAdmin) {
             toast.error("El partido ha finalizado, no se pueden cambiar asistencias.");
             return;
        }

        const updatedStatuses = match.playerStatuses.map(ps => 
            ps.playerId === playerId ? { ...ps, attendanceStatus: newStatus } : ps
        );

        if (!updatedStatuses.some(ps => ps.playerId === playerId)) {
            updatedStatuses.push({
                playerId,
                attendanceStatus: newStatus,
                paymentStatus: 'UNPAID' as any,
                amountPaid: 0
            });
        }

        try {
            await saveDocument('matches', matchId.toString(), { playerStatuses: updatedStatuses });
            toast.success("Asistencia actualizada.");
        } catch (e) {
            toast.error("Error al guardar asistencia.");
        }
    };

    const handlePlayerPaymentChange = async (matchId: number, playerId: number, newStatus: PaymentStatus, amount: number) => {
        if (!isAdmin) return;
        const match = matches.find(m => m.id === matchId);
        if (!match) return;

        const updatedStatuses = match.playerStatuses.map(ps => 
            ps.playerId === playerId ? { ...ps, paymentStatus: newStatus, amountPaid: amount } : ps
        );
        try {
            await saveDocument('matches', matchId.toString(), { playerStatuses: updatedStatuses });
            toast.success("Pago registrado.");
        } catch(e) {
            toast.error("Error al registrar pago.");
        }
    };

    const handleCourtFeeChange = async (matchId: number, newFee: number) => {
        if (!isAdmin) return;
        await saveDocument('matches', matchId.toString(), { courtFee: newFee });
    };

    const handleUpdateMatchDetails = async (matchId: number, field: 'penaltiesAgainst' | 'jerseyWasherId' | 'ballBringerId' | 'waterBringerId' | 'medicineKitBringerId', value: any) => {
        if (!isAdmin && field === 'penaltiesAgainst') return; 
        if (!isAdmin) return; 

        await saveDocument('matches', matchId.toString(), { [field]: value });
        toast.success("Detalle actualizado.");
    };

    const handleStandingsChange = async (matchId: number, teamId: number, newPosition: number) => {
         const match = matches.find(m => m.id === matchId);
         if (!match || !match.standings) return;
         
         const updatedStandings = match.standings.map(s => 
            s.id === teamId ? { ...s, position: newPosition } : s
         );
         await saveDocument('matches', matchId.toString(), { standings: updatedStandings });
    };
    
    const handlePlayerRatingChange = async (matchId: number, raterId: number, rateeId: number, rating: number) => {
        const match = matches.find(m => m.id === matchId);
        if (!match) return;
        if (match.ratingStatus !== 'OPEN') {
            toast.error("La votación está cerrada.");
            return;
        }

        const currentRatings = match.ratings || {};
        const raterRatings = currentRatings[raterId] || {};
        
        const updatedRatings = {
            ...currentRatings,
            [raterId]: {
                ...raterRatings,
                [rateeId]: rating
            }
        };
        
        await saveDocument('matches', matchId.toString(), { ratings: updatedRatings });
    };

    const handleToggleRatingStatus = async (matchId: number) => {
        if (!isAdmin) return;
        const match = matches.find(m => m.id === matchId);
        if (!match) return;
        const newStatus = match.ratingStatus === 'OPEN' ? 'CLOSED' : 'OPEN';
        await saveDocument('matches', matchId.toString(), { ratingStatus: newStatus });
        toast[newStatus === 'OPEN' ? 'success' : 'info'](newStatus === 'OPEN' ? 'Votación ABIERTA' : 'Votación CERRADA');
    };

    const handleFinishVoting = async (matchId: number) => {
         const match = matches.find(m => m.id === matchId);
         if (!match) return;
         
         const finishedVoters = match.finishedVoters || [];
         if (!finishedVoters.includes(currentUser!.id)) {
             await saveDocument('matches', matchId.toString(), { finishedVoters: [...finishedVoters, currentUser!.id] });
             toast.success("Has finalizado tu votación.");
         }
    };

    const handlePlayerStatsChange = async (matchId: number, playerId: number, field: keyof PlayerMatchStatus, value: any) => {
        if (!isAdmin) return;
        const match = matches.find(m => m.id === matchId);
        if (!match) return;

        const updatedStatuses = match.playerStatuses.map(ps => 
            ps.playerId === playerId ? { ...ps, [field]: value } : ps
        );
        await saveDocument('matches', matchId.toString(), { playerStatuses: updatedStatuses });
    };
    
    const handleOpponentScoreChange = async (matchId: number, newScore: number) => {
        if (!isAdmin) return;
        await saveDocument('matches', matchId.toString(), { opponentScore: newScore });
    };

    const handleGenerateTeams = async () => {
        if (!nextMatch) return;
        setIsGeneratingTeams(true);
        const confirmedPlayers = activePlayers.filter(p => 
            nextMatch.playerStatuses.some(ps => ps.playerId === p.id && ps.attendanceStatus === 'CONFIRMED')
        );

        if (confirmedPlayers.length < 10) {
            toast.warning("Se recomiendan al menos 10 jugadores confirmados para armar equipos.");
        }

        const generatedTeams = await generateTeamsAI(confirmedPlayers);
        setTeams(generatedTeams);
        setIsGeneratingTeams(false);
        toast.success("Equipos generados con IA.");
    };

    // --- CRUD HANDLERS ---
    
    const handleSavePlayer = async (player: Player | Omit<Player, 'id'>) => {
        if (!isAdmin && 'id' in player && player.id !== currentUser?.id) return; 
        
        let id = 'id' in player ? player.id : 0;
        if (!id) {
             const maxId = players.reduce((max, p) => Math.max(max, p.id), 0);
             id = maxId + 1;
        }
        
        const playerToSave = { ...player, id };
        
        try {
            await saveDocument('players', id.toString(), playerToSave);
            toast.success("Jugador guardado exitosamente.");
            
            if (currentUser?.id === id) {
                setCurrentUser(playerToSave as Player);
            }
            // Close edit profile modal if open
            if (isEditProfileOpen) setIsEditProfileOpen(false);
        } catch (error: any) {
            console.error("Error FATAL al guardar jugador:", error);
            toast.error(`Error al guardar: ${error.message || 'Desconocido'}`);
        }
    };

    const handleDeletePlayer = async (id: number) => {
        if (!isAdmin) return;
        try {
            await deleteDocument('players', id.toString());
            toast.success("Jugador eliminado.");
        } catch(e) {
            toast.error("Error al eliminar jugador.");
        }
    };

    const handleSaveOpponent = async (opp: Opponent | Omit<Opponent, 'id'>) => {
        if (!isAdmin) return;
        let id = 'id' in opp ? opp.id : Date.now();
        await saveDocument('opponents', id.toString(), { ...opp, id });
        toast.success("Rival guardado.");
    };
    const handleDeleteOpponent = async (id: number) => {
        if (!isAdmin) return;
        await deleteDocument('opponents', id.toString());
    };

    const handleSaveVenue = async (venue: Venue | Omit<Venue, 'id'>) => {
        if (!isAdmin) return;
        let id = 'id' in venue ? venue.id : Date.now();
        await saveDocument('venues', id.toString(), { ...venue, id });
        toast.success("Cancha guardada.");
    };
    const handleDeleteVenue = async (id: number) => {
         if (!isAdmin) return;
         await deleteDocument('venues', id.toString());
    };

    const handleSaveTournament = async (tour: Tournament | Omit<Tournament, 'id'>) => {
        if (!isAdmin) return;
        let id = 'id' in tour ? tour.id : Date.now();
        await saveDocument('tournaments', id.toString(), { ...tour, id });
        toast.success("Torneo guardado.");
    };
    const handleDeleteTournament = async (id: number) => {
        if (!isAdmin) return;
        await deleteDocument('tournaments', id.toString());
    };

    const handleSaveMatch = async (matchData: Match | Omit<Match, 'id' | 'playerStatuses' | 'ratingStatus'>) => {
        if (!isAdmin) return;
        
        let id = 0;
        let dataToSave: any = { ...matchData };

        if ('id' in matchData) {
            id = matchData.id;
        } else {
            id = Date.now();
            dataToSave.id = id;
            dataToSave.playerStatuses = players.map(p => ({
                playerId: p.id,
                attendanceStatus: 'PENDING',
                paymentStatus: 'UNPAID',
                amountPaid: 0
            }));
            dataToSave.ratingStatus = 'CLOSED';
            
            if (myTeam && opponents.length > 0) {
                 const opp = opponents.find(o => o.id === dataToSave.opponentId);
                 dataToSave.standings = [
                     { id: 1, name: myTeam.name, position: 1 },
                     { id: 2, name: opp?.name || 'Rival', position: 2 }
                 ];
            }
        }
        
        await saveDocument('matches', id.toString(), dataToSave);
        setIsMatchFormOpen(false);
        setMatchFormParams(null);
        toast.success("Partido guardado.");
    };

    const handleDeleteMatch = async (matchId: number) => {
        if (!isAdmin) return;
        if (!confirm("¿Estás seguro de eliminar este partido?")) return;
        try {
            await deleteDocument('matches', matchId.toString());
            toast.success("Partido eliminado correctamente.");
            if (selectedMatchId === matchId) {
                setSelectedMatchId(null);
                setCurrentPage('home');
            }
        } catch (e) {
            console.error(e);
            toast.error("Error al eliminar el partido.");
        }
    };

    const handleSaveMyTeam = async (team: MyTeam) => {
        if (!isAdmin) return;
        await saveDocument('myTeam', 'info', team);
        toast.success("Información del equipo actualizada.");
    };

    const handleTogglePinAuth = async () => {
        if (!isSuperAdmin) return;
        const newVal = !appSettings.isPinAuthEnabled;
        setAppSettings(prev => ({ ...prev, isPinAuthEnabled: newVal }));
        await saveDocument('settings', 'appSettings', { isPinAuthEnabled: newVal });
        toast.info(`Autenticación por PIN ${newVal ? 'Activada' : 'Desactivada'}`);
    };
    
    const handleTransferSuperAdmin = async (newAdminId: number) => {
        if (!isSuperAdmin) return;
        if (!confirm("¿Estás seguro? Perderás tus privilegios de Super Admin.")) return;
        
        await saveDocument('settings', 'appSettings', { superAdminPlayerId: newAdminId });
        toast.success("Super Admin transferido exitosamente.");
        setAppSettings(prev => ({ ...prev, superAdminPlayerId: newAdminId }));
    };

    const handleEditProfile = () => {
        setIsEditProfileOpen(true);
    };

    // --- RENDER HELPERS ---
    
    if (!currentUser) {
        return (
            <UserSelectionModal 
                players={players} 
                onSelectUser={setCurrentUser} 
                isPinAuthEnabled={appSettings.isPinAuthEnabled}
                onTogglePinAuth={handleTogglePinAuth}
            />
        );
    }

    const renderContent = () => {
        switch (currentPage) {
            case 'home':
                return nextMatch ? (
                    <MatchCard
                        match={nextMatch}
                        players={players}
                        currentUser={currentUser}
                        myTeam={myTeam}
                        opponents={opponents}
                        onPlayerStatusChange={handlePlayerStatusChange}
                        onPlayerPaymentChange={handlePlayerPaymentChange}
                        onCourtFeeChange={handleCourtFeeChange}
                        onUpdateMatchDetails={handleUpdateMatchDetails}
                        onStandingsChange={handleStandingsChange}
                        onPlayerRatingChange={handlePlayerRatingChange}
                        onToggleRatingStatus={handleToggleRatingStatus}
                        onFinishVoting={handleFinishVoting}
                        onPlayerStatsChange={handlePlayerStatsChange}
                        onOpponentScoreChange={handleOpponentScoreChange}
                        teams={teams}
                        onGenerateTeams={handleGenerateTeams}
                        isAdmin={isAdmin}
                        isGeneratingTeams={isGeneratingTeams}
                        allMatches={matches}
                        onSelectMatch={setSelectedMatchId}
                        onDeleteMatch={handleDeleteMatch}
                    />
                ) : (
                    <div className="text-center py-10 bg-white dark:bg-gray-800 rounded-lg shadow-lg">
                        <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100">No hay partidos programados</h2>
                        <p className="text-gray-600 dark:text-gray-400 mt-2">¡El administrador debe crear un torneo y agregar fechas!</p>
                        {isAdmin && (
                            <button 
                                onClick={() => setCurrentPage('tournaments')}
                                className="mt-4 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
                            >
                                Ir a Torneos
                            </button>
                        )}
                    </div>
                );
            case 'my-team':
                return (
                    <MyTeamPage
                        team={myTeam}
                        onSave={handleSaveMyTeam}
                        isAdmin={isAdmin}
                        isSuperAdmin={isSuperAdmin}
                        currentUser={currentUser}
                        players={players}
                        onUpdatePlayer={handleSavePlayer}
                        onTogglePinAuth={handleTogglePinAuth}
                        isPinAuthEnabled={appSettings.isPinAuthEnabled}
                        matches={matches} // Pasar matches
                        opponents={opponents} // Pasar opponents
                    />
                );
            case 'fixture':
                return (
                    <FixturePage
                        tournaments={tournaments}
                        myTeam={myTeam}
                        matches={matches}
                        opponents={opponents}
                        venues={venues}
                        setCurrentPage={setCurrentPage}
                        setSelectedMatchId={setSelectedMatchId}
                        onOpenMatchForm={setMatchFormParams}
                        onDeleteMatch={handleDeleteMatch}
                        isAdmin={isAdmin}
                    />
                );
            case 'tournaments':
                return (
                    <TournamentsPage 
                        tournaments={tournaments} 
                        matches={matches}
                        onAddTournament={handleSaveTournament} 
                        onUpdateTournament={handleSaveTournament} 
                        onDeleteTournament={handleDeleteTournament}
                        onOpenMatchForm={setMatchFormParams}
                        isAdmin={isAdmin}
                    />
                );
            case 'venues':
                return (
                    <VenuesPage 
                        venues={venues} 
                        onAddVenue={handleSaveVenue} 
                        onUpdateVenue={handleSaveVenue} 
                        onDeleteVenue={handleDeleteVenue} 
                        isAdmin={isAdmin} 
                    />
                );
            case 'opponents':
                return (
                    <OpponentsPage 
                        opponents={opponents} 
                        onAddOpponent={handleSaveOpponent} 
                        onUpdateOpponent={handleSaveOpponent} 
                        onDeleteOpponent={handleDeleteOpponent} 
                        isAdmin={isAdmin} 
                    />
                );
            case 'statistics':
                return (
                    <StatisticsPage 
                        stats={playerStats} 
                        canViewRatings={isAdmin || (nextMatch?.status === 'FINALIZADO' && nextMatch.ratingStatus === 'CLOSED')} 
                        onViewProfile={setSelectedPlayerForProfile}
                        teamPenaltiesAgainst={matches.filter(m => m.status === 'FINALIZADO').reduce((acc, m) => acc + (m.penaltiesAgainst || 0), 0)}
                        matches={matches}
                    />
                );
            case 'treasury':
                return (
                    <TreasuryPage data={treasuryData} />
                );
            case 'logistics':
                return (
                    <LogisticsPage
                        players={players}
                        matches={matches}
                        selectedMatchId={selectedMatchId || nextMatch?.id || 0}
                        onUpdateLogistics={handleUpdateMatchDetails}
                        isAdmin={isAdmin}
                    />
                );
            case 'help':
                return (
                    <HelpPage isAdmin={isAdmin} />
                );
            default:
                return null;
        }
    };

    return (
        <div className="min-h-screen bg-gray-100 dark:bg-gray-900 transition-colors duration-200">
             <ToastContainer />
            <Header
                currentUser={currentUser}
                onOpenRoster={() => setIsRosterModalOpen(true)}
                onChangeUser={() => setCurrentUser(null)}
                currentPage={currentPage}
                setCurrentPage={setCurrentPage}
                isAdmin={isAdmin}
                onEditProfile={handleEditProfile}
            />

            <main className="container mx-auto px-4 py-6 md:pb-24">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                    {/* Panel Izquierdo / Central */}
                    <div className="lg:col-span-8 space-y-6">
                         {birthdayPlayers.length > 0 && <BirthdayCard players={birthdayPlayers} />}
                         {renderContent()}
                    </div>

                    {/* Panel Derecho (Chat) - Visible en desktop o movil si se togglea */}
                    <div className={`fixed inset-0 z-40 lg:static lg:z-auto lg:col-span-4 ${isChatOpen ? 'block' : 'hidden lg:block'}`}>
                         <div className="absolute inset-0 bg-black/50 lg:hidden" onClick={() => setIsChatOpen(false)}></div>
                         <div className="absolute right-0 top-0 bottom-0 w-full max-w-md bg-white dark:bg-gray-800 shadow-xl lg:shadow-none lg:bg-transparent lg:static h-full flex flex-col p-4 lg:p-0">
                            <div className="lg:hidden flex justify-end mb-2">
                                <button onClick={() => setIsChatOpen(false)} className="text-white bg-red-500 rounded-full p-2">
                                     <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                                </button>
                            </div>
                            <div className="flex-1 h-[600px] lg:h-[calc(100vh-140px)] sticky top-24">
                                <Chat
                                    currentUser={currentUser}
                                    players={players}
                                    messages={messages}
                                    onAddMessage={(content) => nextMatch ? addMessage(nextMatch.id.toString(), currentUser, content) : toast.error("No hay partido activo para chatear")}
                                    onDeleteMessage={(msgId) => nextMatch && deleteMessage(nextMatch.id.toString(), msgId)}
                                    onToggleReaction={(msgId, emoji) => nextMatch && toggleReaction(nextMatch.id.toString(), msgId, emoji, currentUser.id)}
                                    matchTitle={nextMatch ? `Partido vs ${opponents.find(o => o.id === nextMatch.opponentId)?.name || 'Rival'}` : 'Chat General'}
                                    matchDate={nextMatch?.date}
                                    birthdayPlayers={birthdayPlayers}
                                    isFirebaseOnline={isFirebaseOnline}
                                    onClose={() => setIsChatOpen(false)} // For mobile view
                                />
                            </div>
                         </div>
                    </div>
                </div>
            </main>

            {/* Floating Chat Button (Mobile) - HIDDEN WHEN CHAT IS OPEN */}
            {!isChatOpen && (
                <button
                    onClick={() => setIsChatOpen(true)}
                    className="fixed bottom-6 right-6 lg:hidden bg-green-600 text-white p-4 rounded-full shadow-lg z-50 hover:bg-green-700 transition-colors animate-bounce-subtle"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                    </svg>
                </button>
            )}

            {/* Modals */}
            {isRosterModalOpen && (
                <RosterManagementModal
                    players={players}
                    onClose={() => setIsRosterModalOpen(false)}
                    onAddPlayer={handleSavePlayer}
                    onUpdatePlayer={handleSavePlayer}
                    onDeletePlayer={handleDeletePlayer}
                    onViewProfile={setSelectedPlayerForProfile}
                    isCurrentUserSuperAdmin={isSuperAdmin}
                    superAdminPlayerId={appSettings.superAdminPlayerId}
                    onTransferSuperAdmin={handleTransferSuperAdmin}
                />
            )}

            {isEditProfileOpen && (
                <div className="fixed inset-0 bg-black bg-opacity-70 flex justify-center items-center z-50 p-4" onClick={() => setIsEditProfileOpen(false)}>
                    <div className="relative bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-2xl flex flex-col" onClick={e => e.stopPropagation()}>
                        <div className="p-6">
                            <PlayerForm
                                player={currentUser}
                                onSave={handleSavePlayer}
                                onCancel={() => setIsEditProfileOpen(false)}
                            />
                        </div>
                    </div>
                </div>
            )}

            {isMatchFormOpen && (
                <MatchForm
                    match={matchFormParams?.match}
                    onSave={handleSaveMatch}
                    onCancel={() => { setIsMatchFormOpen(false); setMatchFormParams(null); }}
                    venues={venues}
                    opponents={opponents}
                    tournamentMatches={matchFormParams?.tournamentId ? matches.filter(m => m.tournamentId === matchFormParams?.tournamentId) : []}
                    nextRoundNumber={matchFormParams?.tournamentId ? (matches.filter(m => m.tournamentId === matchFormParams?.tournamentId).length + 1) : 1}
                    tournamentId={matchFormParams?.tournamentId}
                />
            )}

            {selectedPlayerForPayment && paymentModalMatchId && (
                <PaymentModal
                    isOpen={!!selectedPlayerForPayment}
                    onClose={() => { setSelectedPlayerForPayment(null); setPaymentModalMatchId(null); }}
                    player={selectedPlayerForPayment}
                    amountDue={(matches.find(m => m.id === paymentModalMatchId)?.courtFee || 0) / (matches.find(m => m.id === paymentModalMatchId)?.playerStatuses.filter(ps => ps.attendanceStatus === 'CONFIRMED').length || 1)}
                    onConfirmPayment={(pId, amount) => {
                        handlePlayerPaymentChange(paymentModalMatchId, pId, PaymentStatus.PAID, amount);
                        setSelectedPlayerForPayment(null);
                        setPaymentModalMatchId(null);
                    }}
                />
            )}

            {selectedPlayerForProfile && (
                <PlayerProfileModal
                    player={selectedPlayerForProfile}
                    matches={matches}
                    opponents={opponents}
                    onClose={() => setSelectedPlayerForProfile(null)}
                />
            )}
        </div>
    );
};

export default App;