import React, { useState, useEffect, useMemo } from 'react';
import { useLocalStorage } from './hooks/useLocalStorage.ts';
import { 
    subscribeToCollection, 
    saveDocument, 
    deleteDocument, 
    subscribeToMessages, 
    addMessage, 
    deleteMessage, 
    toggleReaction, 
    getFirestoreInstance, 
    subscribeToTeam 
} from './services/firebaseService.ts';
import { INITIAL_PLAYERS, INITIAL_APP_SETTINGS } from './constants.ts';
import { PaymentStatus, AttendanceStatus, PlayerRole } from './types.ts';
import type { 
    Player, Match, Page, Teams, ChatMessage, MyTeam, Opponent, 
    Venue, Tournament, AppSettings, Team, StandingsPhoto, 
    PlayerMatchStatus, PlayerStats
} from './types.ts';
import { generateTeamsAI } from './services/geminiService.ts';
import { useToast } from './hooks/useToast.ts';

// Components
import { BottomNavigation } from './components/BottomNavigation.tsx';
import { QuickActionOverlay } from './components/QuickActionOverlay.tsx';
import { MatchCard } from './components/MatchCard.tsx';
import { TeamWhatsApp } from './components/TeamWhatsApp.tsx';
import { ToastContainer } from './components/Toast.tsx';
import { Header } from './components/Header.tsx';
import { TeamAccessModal } from './components/TeamAccessModal.tsx';
import { UserSelectionModal } from './components/UserSelectionModal.tsx';
import { SuperAdminPanel } from './components/pages/SuperAdminPanel.tsx';
import { PlayerProfileModal } from './components/PlayerProfileModal.tsx';
import { RosterManagementModal } from './components/RosterManagementModal.tsx';
import { PlayerForm } from './components/PlayerForm.tsx';
import { MatchForm } from './components/forms/MatchForm.tsx';
import { MatchSummaryModal } from './components/MatchSummaryModal.tsx';
import { BirthdayCard } from './components/BirthdayCard.tsx';
import { getWhatsAppShareText } from './lib/shareUtils.ts';


// Pages
import { FixturePage } from './components/pages/FixturePage.tsx';
import { StatisticsPage } from './components/pages/StatisticsPage.tsx';
import { TreasuryPage } from './components/pages/TreasuryPage.tsx';
import { MyTeamPage } from './components/pages/MyTeamPage.tsx';
import { EntertainmentPage } from './components/pages/EntertainmentPage.tsx';
import { RatingsPage } from './components/pages/RatingsPage.tsx';
import { ThirdHalfPage } from './components/pages/ThirdHalfPage.tsx';
import { StandingsPhotosPage } from './components/pages/StandingsPhotosPage.tsx';
import { LogisticsPage } from './components/pages/LogisticsPage.tsx';
import { HelpPage } from './components/pages/HelpPage.tsx';
import { CourtPaymentPage } from './components/pages/CourtPaymentPage.tsx';
import { VenuesPage } from './components/pages/VenuesPage.tsx';
import { OpponentsPage } from './components/pages/OpponentsPage.tsx';
import { TournamentsPage } from './components/pages/TournamentsPage.tsx';
import { StopwatchPage } from './components/pages/StopwatchPage.tsx';

export type V2Tab = 'HOME' | 'CLUB' | 'SOCIAL' | 'ADMIN';
export type ExtendedPage = Page | 'court-payment' | 'roster' | 'announcement' | 'stopwatch';

const App: React.FC = () => {
    const toast = useToast();

    // Helper para convertir "Miércoles, 26 de febrero de 2026" a objeto Date real
    const safeParseDate = (dateStr: string): Date => {
        try {
            // Intentar parseo directo por si es ISO
            const d = new Date(dateStr);
            if (!isNaN(d.getTime())) return d;

            // Si es formato largo "Día, DD de Mes de AAAA"
            const months = ["enero", "febrero", "marzo", "abril", "mayo", "junio", "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre"];
            const lower = dateStr.toLowerCase();
            const numbers = dateStr.match(/\d+/g); // Busca todos los números
            
            if (numbers && numbers.length >= 2) {
                const day = parseInt(numbers[0], 10);
                const year = parseInt(numbers[numbers.length - 1], 10);
                const monthIdx = months.findIndex(m => lower.includes(m));
                
                if (monthIdx !== -1) {
                    return new Date(year, monthIdx, day);
                }
            }
        } catch (e) {
            console.error("Error parseando fecha:", dateStr);
        }
        return new Date(0); // Fecha muy vieja si falla
    };

    // Auth & Team States
    const [selectedTeam, setSelectedTeam] = useLocalStorage<Team | null>('selectedTeam', null);
    const [currentUser, setCurrentUser] = useLocalStorage<Player | null>('currentUser', null);
    

    
    const [isTeamActive, setIsTeamActive] = useState(true);
    const [isFirebaseOnline, setIsFirebaseOnline] = useState(true);

    // Navigation States
    const [activeTab, setActiveTab] = useState<V2Tab>('HOME');
    const [clubSubPage, setClubSubPage] = useState<ExtendedPage>('fixture');
    const [adminSubPage, setAdminSubPage] = useState<ExtendedPage>('tournaments');
    const [socialSubPage, setSocialSubPage] = useState<Page>('chat');
    const [showSharePrompt, setShowSharePrompt] = useState<{ match: Match, status: AttendanceStatus } | null>(null);

    // Modals & Overlays
    const [selectedPlayerForProfile, setSelectedPlayerForProfile] = useState<Player | null>(null);

    const [isRosterModalOpen, setIsRosterModalOpen] = useState(false);
    const [isEditProfileOpen, setIsEditProfileOpen] = useState(false);
    const [quickActionPlayer, setQuickActionPlayer] = useState<Player | null>(null);
    const [matchFormParams, setMatchFormParams] = useState<{ tournamentId: number, match?: Match } | null>(null);
    const [selectedMatchForSummary, setSelectedMatchForSummary] = useState<Match | null>(null);
    const [selectedMatchForChat, setSelectedMatchForChat] = useState<Match | null>(null);
    
    const [selectedMatchId, setSelectedMatchId] = useState<number | null>(null);
    const [selectedTournamentId, setSelectedTournamentId] = useState<number | null>(null);
    const [homeView, setHomeView] = useState<'MAIN' | 'NEXT' | 'HISTORY'>('MAIN');
    const [currentTime, setCurrentTime] = useState(new Date());

    useEffect(() => {
        const timer = setInterval(() => setCurrentTime(new Date()), 60000);
        return () => clearInterval(timer);
    }, []);

    // Helper para obtener fecha y hora completa de un partido
    const getMatchDateTime = (match: Match): Date => {
        const d = safeParseDate(match.date);
        if (match.time) {
            const [hours, minutes] = match.time.split(':').map(Number);
            if (!isNaN(hours)) d.setHours(hours);
            if (!isNaN(minutes)) d.setMinutes(minutes);
        }
        return d;
    };

    // Data States
    const [players, setPlayers] = useState<Player[]>([]);
    const [matches, setMatches] = useState<Match[]>([]);
    const [myTeam, setMyTeam] = useState<MyTeam | null>(null);
    const [opponents, setOpponents] = useState<Opponent[]>([]);
    const [venues, setVenues] = useState<Venue[]>([]);
    const [tournaments, setTournaments] = useState<Tournament[]>([]);
    const [appSettings, setAppSettings] = useState<AppSettings>(INITIAL_APP_SETTINGS);
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [standingsPhotos, setStandingsPhotos] = useState<StandingsPhoto[]>([]);
    
    const sortedOpponents = useMemo(() => [...opponents].sort((a, b) => a.name.localeCompare(b.name)), [opponents]);
    const sortedTournaments = useMemo(() => [...tournaments].sort((a, b) => b.year !== a.year ? b.year - a.year : a.name.localeCompare(b.name)), [tournaments]);

    // AI & Helpers
    const [teams, setTeams] = useState<Teams | null>(null);
    const [isGeneratingTeams, setIsGeneratingTeams] = useState(false);
    const [deferredPrompt, setDeferredPrompt] = useState<any>(null);

    const birthdayPlayers = useMemo(() => {
        const today = new Date();
        const month = today.getMonth() + 1;
        const day = today.getDate();
        
        return players.filter(player => {
            if (!player.birthDate) return false;
            const parts = player.birthDate.split('-');
            if (parts.length < 3) return false;
            const pMonth = parseInt(parts[1], 10);
            const pDay = parseInt(parts[2], 10);
            return pMonth === month && pDay === day;
        });
    }, [players]);

    // --- PWA INSTALLATION LOGIC ---
    useEffect(() => {
        const handler = (e: any) => {
            e.preventDefault();
            setDeferredPrompt(e);
            console.log('PWA: Instalación lista');
        };
        window.addEventListener('beforeinstallprompt', handler);
        return () => window.removeEventListener('beforeinstallprompt', handler);
    }, []);

    const handleInstallApp = async () => {
        if (!deferredPrompt) {
            toast.info("Usa el menú de tu navegador ('Instalar' o 'Añadir a inicio') o espera unos segundos a que el sistema procese la App.");
            return;
        }
        deferredPrompt.prompt();
        const { outcome } = await deferredPrompt.userChoice;
        if (outcome === 'accepted') {
            setDeferredPrompt(null);
        }
    };

    // Roles Logic
    const isSuperAdmin = currentUser?.id === appSettings.superAdminPlayerId;
    const isSubAdmin = !!currentUser?.isSubAdmin;
    const isDT = currentUser?.role === PlayerRole.DT || currentUser?.role === PlayerRole.AYUDANTE;
    const isAdmin = isSuperAdmin || isSubAdmin;
    const canCargarDatos = isAdmin || isDT;

    // --- DATA SUBSCRIPTIONS ---
    useEffect(() => {
        if (!selectedTeam || selectedTeam.id === 'super-admin') return;
        const unsubTeam = subscribeToTeam(selectedTeam.id, (team) => {
            if (!team) { setSelectedTeam(null); return; }
            setIsTeamActive(team.status === 'ACTIVE');
        });
        return () => unsubTeam();
    }, [selectedTeam, setSelectedTeam]);

    useEffect(() => {
        if (!selectedTeam || selectedTeam.id === 'super-admin') return;
        const db = getFirestoreInstance();
        if (!db) { setIsFirebaseOnline(false); setPlayers(INITIAL_PLAYERS); return; }
        const unsubP = subscribeToCollection<Player>(selectedTeam.id, 'players', null, setPlayers, () => setIsFirebaseOnline(false));
        const unsubM = subscribeToCollection<Match>(selectedTeam.id, 'matches', null, setMatches, () => {});
        const unsubO = subscribeToCollection<Opponent>(selectedTeam.id, 'opponents', null, setOpponents, () => {});
        const unsubV = subscribeToCollection<Venue>(selectedTeam.id, 'venues', null, setVenues, () => {});
        const unsubT = subscribeToCollection<Tournament>(selectedTeam.id, 'tournaments', null, setTournaments, () => {});
        const unsubS = subscribeToCollection<any>(selectedTeam.id, 'settings', 'appSettings', (data) => data[0] && setAppSettings(data[0]), () => {});
        const unsubMT = subscribeToCollection<any>(selectedTeam.id, 'myTeam', 'info', (data) => data[0] && setMyTeam(data[0]), () => {});
        const unsubSP = subscribeToCollection<StandingsPhoto>(selectedTeam.id, 'standingsPhotos', null, setStandingsPhotos, () => {});
        return () => { unsubP(); unsubM(); unsubO(); unsubV(); unsubT(); unsubS(); unsubMT(); unsubSP(); };
    }, [selectedTeam]);

    // --- TOURNAMENT FILTERING ---
    useEffect(() => {
        if (appSettings.defaultTournamentId && selectedTournamentId === null) {
            setSelectedTournamentId(appSettings.defaultTournamentId);
        }
    }, [appSettings.defaultTournamentId]);

    const filteredMatches = useMemo(() => {
        if (!selectedTournamentId) return matches;
        return matches.filter(m => m.tournamentId === selectedTournamentId);
    }, [matches, selectedTournamentId]);

    const [lastChatReadTimestamp, setLastChatReadTimestamp] = useState<number>(() => {
        const saved = localStorage.getItem('lastChatRead');
        return saved ? parseInt(saved, 10) : 0;
    });

    const hasUnreadMessages = useMemo(() => {
        if (messages.length === 0) return false;
        // Solo marcar como no leído si NO estamos viendo el chat en este momento
        if (activeTab === 'SOCIAL' && socialSubPage === 'chat') return false;
        
        const latestMessage = [...messages].sort((a, b) => (Number(b.timestamp) || 0) - (Number(a.timestamp) || 0))[0];
        return (Number(latestMessage?.timestamp) || 0) > lastChatReadTimestamp;
    }, [messages, lastChatReadTimestamp, activeTab, socialSubPage]);

    useEffect(() => {
        if (activeTab === 'SOCIAL' && socialSubPage === 'chat' && messages.length > 0) {
            const latestMessage = [...messages].sort((a, b) => (Number(b.timestamp) || 0) - (Number(a.timestamp) || 0))[0];
            const ts = Number(latestMessage?.timestamp) || Date.now();
            if (ts > lastChatReadTimestamp) {
                setLastChatReadTimestamp(ts);
                localStorage.setItem('lastChatRead', ts.toString());
            }
        }
    }, [activeTab, socialSubPage, messages, lastChatReadTimestamp]);

    const operationalMatches = useMemo(() => {
        if (appSettings.defaultTournamentId) {
            return matches.filter(m => m.tournamentId === appSettings.defaultTournamentId);
        }
        return matches;
    }, [matches, appSettings.defaultTournamentId]);

    const matchesToRate = useMemo(() => {
        return operationalMatches.filter(m => m.status === 'FINALIZADO' && m.ratingStatus === 'OPEN');
    }, [operationalMatches]);

    const pinnedMatch = useMemo(() => {
        if (operationalMatches.length === 0) return null;
        
        const now = new Date();
        now.setHours(0, 0, 0, 0);

        const nextScheduled = [...operationalMatches]
            .filter((m: Match) => m.status === 'PROGRAMADO')
            .filter((m: Match) => {
                const mDate = safeParseDate(m.date);
                mDate.setHours(0, 0, 0, 0);
                return mDate >= now;
            })
            .sort((a, b) => safeParseDate(a.date).getTime() - safeParseDate(b.date).getTime())[0];

        if (nextScheduled) return nextScheduled;

        return [...operationalMatches]
            .filter((m: Match) => m.status === 'FINALIZADO')
            .sort((a, b) => safeParseDate(b.date).getTime() - safeParseDate(a.date).getTime())[0];
    }, [operationalMatches]);

    const currentMatch = useMemo(() => {
        if (filteredMatches.length === 0) return null;
        if (selectedMatchId) {
            const found = filteredMatches.find((m: Match) => m.id === selectedMatchId);
            if (found) return found;
        }

        const now = new Date();
        now.setHours(0, 0, 0, 0);

        const nextScheduled = [...filteredMatches]
            .filter((m: Match) => m.status === 'PROGRAMADO')
            .filter((m: Match) => {
                const mDate = safeParseDate(m.date);
                mDate.setHours(0, 0, 0, 0);
                return mDate >= now;
            })
            .sort((a, b) => safeParseDate(a.date).getTime() - safeParseDate(b.date).getTime())[0];

        if (nextScheduled) return nextScheduled;

        return [...filteredMatches]
            .filter((m: Match) => m.status === 'FINALIZADO')
            .sort((a, b) => safeParseDate(b.date).getTime() - safeParseDate(a.date).getTime())[0];
    }, [filteredMatches, selectedMatchId]);

    const countdown = useMemo(() => {
        if (!currentMatch || currentMatch.status !== 'PROGRAMADO') return null;
        const matchDate = getMatchDateTime(currentMatch);
        const diff = matchDate.getTime() - currentTime.getTime();
        
        // Solo habilitar si falta menos de 72 horas
        if (diff > 72 * 60 * 60 * 1000) return null;
        
        // Una vez que llegue a cero o pase la hora
        if (diff <= 0) {
            // Dejar de mostrar si pasaron más de 3 horas del inicio
            if (diff < -3 * 60 * 60 * 1000) return null;
            
            return {
                text: "El partido ya se debería estar jugando",
                isCritical: true,
                isOverdue: true
            };
        }
        
        const isCritical = diff <= 2 * 60 * 60 * 1000; // Menos de 2 horas
        
        const totalHours = Math.floor(diff / (1000 * 60 * 60));
        const mins = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        
        return {
            text: `${totalHours}hs ${mins}m`,
            isCritical,
            isOverdue: false
        };
    }, [currentMatch, currentTime]);

    const fairShare = useMemo(() => {
        if (!currentMatch) return 0;
        const confirmed = currentMatch.playerStatuses.filter(s => s.attendanceStatus === AttendanceStatus.CONFIRMED && !players.find(p => p.id === s.playerId && (p.role === PlayerRole.DT || p.role === PlayerRole.AYUDANTE))).length;
        return confirmed > 0 ? currentMatch.courtFee / confirmed : 0;
    }, [currentMatch, players]);

    const treasuryData = useMemo(() => {
        const finished = filteredMatches.filter(m => m.status === 'FINALIZADO').sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
        const matchDetails = finished.map(m => {
            const collected = m.playerStatuses.reduce((acc, ps) => acc + (ps.amountPaid || 0), 0);
            return { ...m, collected, balance: collected - m.courtFee };
        });
        const totalSpent = finished.reduce((acc, m) => acc + m.courtFee, 0);
        const totalCollected = finished.reduce((acc, m) => acc + m.playerStatuses.reduce((a, ps) => a + (ps.amountPaid || 0), 0), 0);
        return { totalSpent, totalCollected, balance: totalCollected - totalSpent, matches: matchDetails };
    }, [filteredMatches]);

    const globalPlayerStats: PlayerStats[] = useMemo(() => {
        return players.map(player => {
            const playerMatches = filteredMatches.filter(m => m.status === 'FINALIZADO' && m.playerStatuses.some(ps => ps.playerId === player.id && ps.attendanceStatus === AttendanceStatus.CONFIRMED));
            let goalsPlay = 0, goalsPenalty = 0, goalsHeader = 0, goalsSetPiece = 0, assists = 0, yellowCards = 0, totalAmountPaid = 0, totalQuartersPlayed = 0, ratingSum = 0, ratingCount = 0;
            let redCards = 0;

            playerMatches.forEach(m => {
                const ps = m.playerStatuses.find(s => s.playerId === player.id)!;
                const extraGoals = (ps.goals || 0); // Goles genéricos si existen
                goalsPlay += (ps.goalsPlay || 0) + extraGoals;
                goalsPenalty += (ps.goalsPenalty || 0);
                goalsHeader += (ps.goalsHeader || 0);
                goalsSetPiece += (ps.goalsSetPiece || 0);
                assists += (ps.assists || 0);
                yellowCards += (ps.yellowCards || 0);
                if (ps.redCard) redCards++;
                totalAmountPaid += (ps.amountPaid || 0);
                totalQuartersPlayed += (ps.quartersPlayed ?? 4);
                if (m.ratings) {
                    Object.values(m.ratings).forEach(raterRatings => {
                        if (raterRatings[player.id]) { ratingSum += raterRatings[player.id]; ratingCount++; }
                    });
                }
            });
            return {
                player,
                pj: playerMatches.length,
                totalGoals: goalsPlay + goalsPenalty + goalsHeader + goalsSetPiece,
                goalsPlay, goalsPenalty, goalsHeader, goalsSetPiece, assists, yellowCards, redCards, totalAmountPaid, totalQuartersPlayed,
                avgRating: ratingCount > 0 ? ratingSum / ratingCount : 0,
                ratingCount,
                attendance: { confirmed: 0, doubtful: 0, absent: 0 },
                matchesWashed: 0, matchesSinceWash: 0, ownGoals: 0, penaltiesMissed: 0, badThrowIns: 0, badFreeKicks: 0, majorErrors: 0, pg: 0, pe: 0, pp: 0
            } as PlayerStats;
        });
    }, [players, filteredMatches]);

    useEffect(() => {
        const matchToSub = selectedMatchForChat || currentMatch;
        if (!selectedTeam || !matchToSub) return;
        return subscribeToMessages(selectedTeam.id, matchToSub.id.toString(), setMessages, () => {});
    }, [currentMatch, selectedMatchForChat, selectedTeam]);

    useEffect(() => {
        if (currentMatch && selectedMatchId === null) {
            setSelectedMatchId(currentMatch.id);
        }
    }, [currentMatch, selectedMatchId]);

    const handlePlayerStatsChange = async (mid: number, pid: number, field: keyof PlayerMatchStatus, value: any) => {
        const m = matches.find(x => x.id === mid);
        if(!m) return;
        
        // Asignamos el valor directamente asegurando que sea un número si corresponde
        const newVal = typeof value === 'number' ? Number(value) : value;
        
        const newStatuses = m.playerStatuses.map(s => s.playerId === pid ? { ...s, [field]: newVal } : s);
        await saveDocument(selectedTeam!.id, 'matches', mid.toString(), { playerStatuses: newStatuses });
    };

    const handlePlayerStatusChange = async (mid: number, pid: number, st: AttendanceStatus) => {
        const m = matches.find(x => x.id === mid);
        if(!m) return;
        
        let ups = m.playerStatuses.map(s => {
            if (s.playerId === pid) {
                // Si cambia de estado, reseteamos los reclamos (nudgeCount)
                const updated = { ...s, attendanceStatus: st };
                if (st !== AttendanceStatus.PENDING) {
                    updated.nudgeCount = 0;
                }
                return updated;
            }
            return s;
        });

        if(!ups.some(s => s.playerId === pid)) {
            ups.push({
                playerId: pid, 
                attendanceStatus: st, 
                paymentStatus: PaymentStatus.UNPAID, 
                amountPaid: 0, 
                quartersPlayed: 4,
                nudgeCount: 0 // Nuevo jugador empieza en 0
            });
        }
        await saveDocument(selectedTeam!.id, 'matches', mid.toString(), { playerStatuses: ups });

        // Activar el botón gigante de compartir si se anotó o bajó
        if (st === AttendanceStatus.CONFIRMED || st === AttendanceStatus.ABSENT) {
            setShowSharePrompt({ match: { ...m, playerStatuses: ups }, status: st });
            // Auto-cerrar después de 15 segundos si no hace nada
            setTimeout(() => setShowSharePrompt(null), 15000);
        }
    };

    const handlePlayerPaymentAmount = async (mid: number, pid: number, amount: number) => {
        const m = matches.find(x => x.id === mid);
        if(!m) return;
        const confirmed = m.playerStatuses.filter(s => s.attendanceStatus === AttendanceStatus.CONFIRMED && !players.find(p => p.id === s.playerId && (p.role === PlayerRole.DT || p.role === PlayerRole.AYUDANTE))).length;
        const share = confirmed > 0 ? m.courtFee / confirmed : 0;
        let status = PaymentStatus.UNPAID;
        if (amount >= share * 0.95) status = PaymentStatus.PAID;
        else if (amount > 0) status = PaymentStatus.PARTIAL;
        const newStatuses = m.playerStatuses.map(s => s.playerId === pid ? { ...s, amountPaid: amount, paymentStatus: status } : s);
        await saveDocument(selectedTeam!.id, 'matches', mid.toString(), { playerStatuses: newStatuses });
    };

    const handleSelectMatchFromFixture = (id: number) => {
        setSelectedMatchId(id);
        setActiveTab('HOME');
    };

    const handleDuplicateTournament = async (sourceId: number) => {
        const source = tournaments.find(t => t.id === sourceId);
        if (!source) return;

        const newName = window.prompt(`🏆 DUPLICAR TORNEO\n\nEstás copiando el fixture de "${source.name}".\n\nIngresa el nombre del NUEVO campeonato:`, `${source.name} (Copia)`);
        
        if (!newName || newName.trim() === "") return;

        try {
            toast.info("Duplicando campeonato...");
            
            // 1. Crear el nuevo torneo
            const newId = tournaments.reduce((m, x) => Math.max(m, x.id), 0) + 1;
            const newTournament: Tournament = {
                id: newId,
                name: newName.trim(),
                year: new Date().getFullYear(),
                status: 'EN_CURSO'
            };
            await saveDocument(selectedTeam!.id, 'tournaments', newId.toString(), newTournament);

            // 2. Copiar los partidos
            const sourceMatches = matches.filter(m => m.tournamentId === sourceId).sort((a, b) => (a.tournamentRound || 0) - (b.tournamentRound || 0));
            
            for (const m of sourceMatches) {
                const nextMatchId = (matches.reduce((max, match) => Math.max(max, match.id), 0) + 1) + sourceMatches.indexOf(m);
                
                const cleanMatch: Match = {
                    ...m,
                    id: nextMatchId,
                    tournamentId: newId,
                    status: 'PROGRAMADO',
                    opponentScore: 0,
                    ratings: {},
                    ratingStatus: 'CLOSED',
                    finishedVoters: [],
                    thirdHalf: undefined,
                    // Resetear estados de jugadores a PENDING
                    playerStatuses: players.map(p => ({
                        playerId: p.id,
                        attendanceStatus: AttendanceStatus.PENDING,
                        paymentStatus: PaymentStatus.UNPAID,
                        amountPaid: 0,
                        quartersPlayed: 4
                    }))
                };
                
                await saveDocument(selectedTeam!.id, 'matches', nextMatchId.toString(), cleanMatch);
            }

            setSelectedTournamentId(newId);
            toast.success("¡Campeonato duplicado con éxito! 🏆");
        } catch (e) {
            console.error(e);
            toast.error("Error al duplicar el campeonato");
        }
    };

    const handleExitTeam = () => {
        setSelectedTeam(null);
        setCurrentUser(null);
        window.location.reload();
    };

    const handleResetAllAttempts = async () => {
        try {
            const updates = players.map(p => saveDocument(selectedTeam!.id, 'players', p.id.toString(), { dailyGameAttempts: 0 }));
            await Promise.all(updates);
            toast.success("¡Vidas diarias reiniciadas para todos!");
        } catch (e) {
            console.error(e);
            toast.error("Error al reiniciar vidas");
        }
    };

    const handleResetScores = async () => {
        try {
            const updates = players.map(p => saveDocument(selectedTeam!.id, 'players', p.id.toString(), { gamePoints: 0 }));
            await Promise.all(updates);
            toast.success("¡Puntajes de juegos reiniciados a cero!");
        } catch (e) {
            console.error(e);
            toast.error("Error al borrar puntajes");
        }
    };

    // --- FLUJO DE PANTALLAS ---
    


    // 2. Acceso al Equipo (UTN)
    if (!selectedTeam) return <TeamAccessModal onTeamSelect={setSelectedTeam} />;
    
    // 3. Estado del Servicio
    if (!isTeamActive && selectedTeam.id !== 'super-admin') return <div className="min-h-screen bg-indigo-950 flex items-center justify-center p-6 text-white uppercase font-black"><h1>SERVICIO SUSPENDIDO</h1></div>;
    
    // 4. Panel Super Admin (Opcional)
    if (selectedTeam.id === 'super-admin') return <div className="min-h-screen bg-gray-900 p-4"><SuperAdminPanel onExit={handleExitTeam} /><ToastContainer /></div>;
    
    // 5. Selección de Jugador (PIN)
    if (!currentUser) return <UserSelectionModal players={players} teamName={selectedTeam.name} onSelectUser={setCurrentUser} onExitTeam={handleExitTeam} isPinAuthEnabled={appSettings.isPinAuthEnabled} />;

    // 6. Aplicación Principal
    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 pb-24">
            <ToastContainer />
            <Header 
                currentUser={currentUser} 
                teamName={selectedTeam.name}
                onOpenRoster={() => setIsRosterModalOpen(true)} 
                onChangeUser={() => setCurrentUser(null)} 
                onExitTeam={handleExitTeam}
                isAdmin={isAdmin} 
                isSuperAdmin={isSuperAdmin}
                onEditProfile={() => setIsEditProfileOpen(true)} 
                isFirebaseOnline={isFirebaseOnline} 
                announcement={appSettings.announcement} 
                onUpdateAnnouncement={(t) => saveDocument(selectedTeam.id, 'settings', 'appSettings', {announcement: t})}
                canEditAnnouncement={isAdmin}
                notificationPermission="default"
                onRequestNotificationPermission={() => {}}
                />

                <main className="container mx-auto px-4 py-6 max-w-5xl">

                {activeTab === 'HOME' && (
                    <div className="space-y-6 animate-fadeIn">
                        {/* Selector de Campeonato Global */}
                        <div className="flex flex-col items-center gap-2 bg-white dark:bg-gray-800 p-6 rounded-[2.5rem] shadow-md border-2 border-indigo-100 dark:border-gray-700 transition-all">
                            <p className="text-[10px] font-black text-indigo-500 uppercase tracking-[0.3em] mb-1">Campeonato Activo</p>
                            <div className="flex flex-col items-center gap-2 w-full">
                                <div className="flex items-center justify-center gap-3 w-full">
                                    <span className="text-3xl">🏆</span>
                                    <select 
                                        value={selectedTournamentId || ''} 
                                        onChange={(e) => setSelectedTournamentId(e.target.value ? Number(e.target.value) : null)}
                                        className="bg-transparent font-black uppercase italic tracking-tighter text-gray-900 dark:text-white outline-none text-2xl md:text-3xl cursor-pointer text-center hover:text-indigo-600 transition-colors"
                                    >
                                        <option value="">-- Histórico (Todos) --</option>
                                        {sortedTournaments.map(t => (
                                            <option key={t.id} value={t.id} className="text-black text-base">{t.name} '{t.year % 100}</option>
                                        ))}
                                    </select>
                                </div>
                                {isAdmin && selectedTournamentId && (
                                    <button 
                                        onClick={() => saveDocument(selectedTeam.id, 'settings', 'appSettings', { defaultTournamentId: selectedTournamentId })}
                                        className="mt-2 text-[11px] bg-indigo-600 text-white px-4 py-1.5 rounded-full font-black uppercase tracking-widest shadow-lg shadow-indigo-500/30 active:scale-95 transition-all"
                                    >
                                        📌 FIJAR PARA EL EQUIPO
                                    </button>
                                )}
                            </div>
                        </div>

                        {birthdayPlayers.length > 0 && <BirthdayCard players={birthdayPlayers} />}
                        {homeView === 'MAIN' ? (
                            <div className="grid grid-cols-1 gap-6 pt-4">
                                <button 
                                    onClick={() => setHomeView('NEXT')}
                                    className={`bg-gradient-to-br from-indigo-600 to-indigo-800 p-6 rounded-[2.5rem] text-white shadow-xl transform transition-all active:scale-95 text-left relative overflow-hidden group ${countdown?.isCritical ? 'ring-4 ring-red-500/80 animate-pulse' : ''}`}
                                >
                                    <div className="relative z-10">
                                        <div className="flex items-start justify-between gap-2 mb-4">
                                            <div>
                                                <span className="bg-white/20 text-white text-[12px] font-black px-3 py-1 rounded-full uppercase tracking-widest mb-3 inline-block">Siguiente Fecha</span>
                                                <h2 className="text-4xl font-black italic tracking-tighter uppercase leading-none">Próximo<br/>Partido</h2>
                                            </div>
                                            {countdown && (
                                                <div className={`px-5 py-3 rounded-2xl backdrop-blur-md shadow-2xl border-2 ${countdown.isCritical ? 'bg-red-600/30 border-red-500 animate-bounce-slow' : 'bg-black/30 border-white/20'}`}>
                                                    <p className={`text-[32px] font-black font-orbitron tabular-nums leading-none ${countdown.isCritical ? 'text-red-500 drop-shadow-[0_0_10px_rgba(239,68,68,0.5)]' : 'text-emerald-400'}`}>
                                                        {countdown.text}
                                                    </p>
                                                </div>
                                            )}
                                        </div>
                                        <div className="mt-2">
                                            {currentMatch && currentMatch.status === 'PROGRAMADO' ? (
                                                <div className="flex flex-col gap-1">
                                                    <p className="text-white text-lg font-black uppercase italic tracking-tighter">
                                                        vs {opponents.find(o => o.id === currentMatch.opponentId)?.name || 'Rival'}
                                                    </p>
                                                    <p className="text-indigo-200 text-xs font-bold uppercase opacity-80 tracking-widest">Anotate, armá equipos y cargá los datos</p>
                                                </div>
                                            ) : (
                                                <p className="text-indigo-200 text-sm font-bold uppercase opacity-80 tracking-widest">Consultar próxima convocatoria</p>
                                            )}
                                        </div>
                                    </div>
                                    <span className="absolute -bottom-4 -right-4 text-9xl opacity-10 group-hover:scale-110 transition-transform">⚽</span>
                                </button>

                                <button 
                                    onClick={() => {
                                        setActiveTab('CLUB');
                                        setClubSubPage('ratings');
                                        setSelectedMatchId(null);
                                    }}
                                    className={`p-6 rounded-[2.5rem] shadow-xl transform transition-all active:scale-95 text-left relative overflow-hidden group border-2 ${matchesToRate.length > 0 ? 'bg-emerald-400 border-emerald-300 text-emerald-950 shadow-emerald-500/20 animate-light-beam' : 'bg-white dark:bg-gray-800 border-gray-100 dark:border-gray-700 text-gray-800 dark:text-white'}`}
                                >
                                    <div className="relative z-10">
                                        <span className={`${matchesToRate.length > 0 ? 'bg-emerald-500/20 text-emerald-900' : 'bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400'} text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-widest mb-2 inline-block`}>La Urna</span>
                                        <h2 className="text-4xl font-black italic tracking-tighter uppercase leading-none">Calificar<br/>Jugadores</h2>
                                        <p className={`${matchesToRate.length > 0 ? 'text-emerald-900/60' : 'text-gray-400'} text-sm font-bold mt-1 uppercase italic tracking-tighter`}>
                                            {matchesToRate.length > 0 ? `${matchesToRate.length} partidos abiertos para votar` : 'Sin votaciones activas'}
                                        </p>
                                    </div>
                                    <span className={`absolute -bottom-4 -right-4 text-9xl opacity-10 group-hover:scale-110 transition-transform ${matchesToRate.length > 0 ? 'animate-pulse' : ''}`}>⭐</span>
                                </button>

                                <button 
                                    onClick={() => setHomeView('HISTORY')}
                                    className="bg-white dark:bg-gray-800 p-8 rounded-[2.5rem] text-gray-800 dark:text-white shadow-xl border-2 border-gray-100 dark:border-gray-700 transform transition-all active:scale-95 text-left relative overflow-hidden group"
                                >
                                    <div className="relative z-10">
                                        <span className="bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400 text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-widest mb-4 inline-block font-bebas">Archivo Histórico</span>
                                        <h2 className="text-4xl font-black italic tracking-tighter uppercase leading-none mb-2">Historial</h2>
                                        <p className="text-gray-400 text-sm font-bold uppercase italic tracking-tighter">Resultados, goles y estadísticas.</p>
                                    </div>
                                    <span className="absolute -bottom-4 -right-4 text-9xl opacity-5 group-hover:scale-110 transition-transform">📊</span>
                                </button>
                            </div>
                        ) : (
                            <div className="space-y-6">
                                <div className="flex items-center gap-4 mb-2">
                                    <button 
                                        onClick={() => setHomeView('MAIN')}
                                        className="bg-white dark:bg-gray-800 p-3 rounded-2xl shadow-md border border-gray-100 dark:border-gray-700 font-black text-indigo-600"
                                    >
                                        ⬅ VOLVER
                                    </button>
                                    <h2 className="text-xl font-black uppercase italic tracking-tighter text-gray-800 dark:text-white">
                                        {homeView === 'NEXT' ? 'Convocatoria Abierta' : 'Partidos Jugados'}
                                    </h2>
                                </div>

                                {homeView === 'NEXT' ? (
                                    currentMatch ? (
                                        <MatchCard 
                                            teamId={selectedTeam.id} 
                                            match={currentMatch} 
                                            players={players} 
                                            currentUser={currentUser} 
                                            myTeam={myTeam} 
                                            opponents={opponents} 
                                            isAdmin={isAdmin}
                                            isGeneratingTeams={isGeneratingTeams}
                                            teams={teams}
                                            allMatches={matches}
                                            onSelectMatch={setSelectedMatchId}
                                            onGenerateTeams={async () => {
                                                setIsGeneratingTeams(true);
                                                setTeams(await generateTeamsAI(players, currentMatch));
                                                setIsGeneratingTeams(false);
                                            }}
                                            onPlayerStatusChange={handlePlayerStatusChange}
                                            onPlayerStatsChange={handlePlayerStatsChange}
                                            onCourtFeeChange={async (mid, fee) => saveDocument(selectedTeam.id, 'matches', mid.toString(), { courtFee: fee })}
                                            onUpdateMatchDetails={async (mid, f, v) => saveDocument(selectedTeam.id, 'matches', mid.toString(), { [f]: v })}
                                            onStandingsChange={async (mid, tid, pos) => saveDocument(selectedTeam.id, 'matches', mid.toString(), { standings: matches.find(x => x.id === mid)!.standings?.map(s => s.id === tid ? { ...s, position: pos } : s) })}
                                            onPlayerRatingChange={async (mid, rid, tid, r) => saveDocument(selectedTeam.id, 'matches', mid.toString(), { ratings: { ...matches.find(x => x.id === mid)!.ratings, [rid]: { ...(matches.find(x => x.id === mid)!.ratings?.[rid] || {}), [tid]: r } } })}
                                            onToggleRatingStatus={async (mid) => saveDocument(selectedTeam.id, 'matches', mid.toString(), { ratingStatus: matches.find(x => x.id === mid)!.ratingStatus === 'OPEN' ? 'CLOSED' : 'OPEN' })}
                                            onOpponentScoreChange={async (mid, s) => saveDocument(selectedTeam.id, 'matches', mid.toString(), { opponentScore: s })}
                                            onViewProfile={(p) => canCargarDatos ? setQuickActionPlayer(p) : setSelectedPlayerForProfile(p)}
                                            onViewSummary={(mid) => setSelectedMatchForSummary(matches.find(m => m.id === mid) || null)}
                                        />
                                    ) : (
                                        <div className="text-center py-20 bg-white dark:bg-gray-800 rounded-[2rem] border-4 border-dashed border-gray-100 dark:border-gray-700">
                                            <span className="text-6xl mb-4 block">🏟️</span>
                                            <h2 className="text-2xl font-black uppercase text-gray-400">Sin partidos a la vista</h2>
                                        </div>
                                    )
                                ) : (
                                    <div className="space-y-3">
                                        {filteredMatches
                                            .filter(m => m.status === 'FINALIZADO')
                                            .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                                            .map(match => {
                                                const opponent = opponents.find(o => o.id === match.opponentId);
                                                const myTeamScore = match.playerStatuses.reduce((t, ps) => t + (ps.goalsPlay || 0) + (ps.goalsHeader || 0) + (ps.goalsPenalty || 0) + (ps.goalsSetPiece || 0) + (ps.goals || 0), 0);
                                                const isWinner = myTeamScore > (match.opponentScore || 0);
                                                const isDraw = myTeamScore === (match.opponentScore || 0);

                                                return (
                                                    <div 
                                                        key={match.id}
                                                        onClick={() => setSelectedMatchForSummary(match)}
                                                        className="bg-white dark:bg-gray-800 p-4 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 flex items-center justify-between hover:border-indigo-300 dark:hover:border-indigo-500 transition-all cursor-pointer group active:scale-[0.98]"
                                                    >
                                                        <div className="flex items-center gap-4">
                                                            {/* Mini Marcador */}
                                                            <div className={`flex items-center justify-center gap-2 px-3 py-1.5 rounded-xl font-black text-sm ${isWinner ? 'bg-green-100 text-green-700' : isDraw ? 'bg-gray-100 text-gray-600' : 'bg-red-50 text-red-600'}`}>
                                                                <span>{myTeamScore}</span>
                                                                <span className="opacity-30">-</span>
                                                                <span>{match.opponentScore || 0}</span>
                                                            </div>
                                                            
                                                                                           <div>
                                                                <h4 className="font-black text-gray-800 dark:white uppercase text-sm italic">vs {opponent?.name || 'Rival'}</h4>
                                                                <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">{match.date}</p>
                                                            </div>
                                                        </div>

                                                        <div className="flex items-center gap-2">
                                                            {isAdmin && (
                                                                <button 
                                                                    onClick={(e) => {
                                                                        e.stopPropagation();
                                                                        setSelectedMatchId(match.id);
                                                                        setHomeView('NEXT'); // Lo llevamos a la vista de tarjeta que tiene el botón Admin
                                                                    }}
                                                                    className="bg-gray-100 dark:bg-gray-700 p-2 rounded-xl text-gray-500 hover:text-indigo-600 transition-colors"
                                                                    title="Editar Datos"
                                                                >
                                                                    🛠️
                                                                </button>
                                                            )}
                                                            {match.ratingStatus === 'OPEN' && (
                                                                <button 
                                                                    onClick={(e) => {
                                                                        e.stopPropagation();
                                                                        setClubSubPage('ratings');
                                                                        setSelectedMatchId(match.id);
                                                                    }}
                                                                    className="bg-yellow-400 text-yellow-950 text-[9px] font-black px-3 py-1.5 rounded-full uppercase tracking-tight animate-pulse shadow-sm"
                                                                >
                                                                    ⭐ Calificar
                                                                </button>
                                                            )}
                                                            <div className="text-right hidden sm:block">
                                                                <p className="text-[9px] font-black text-gray-400 uppercase">Fecha</p>
                                                                <p className="text-xs font-black text-indigo-600">#{match.tournamentRound || 1}</p>
                                                            </div>
                                                            <span className="text-gray-300 group-hover:text-indigo-500 transition-colors text-xl">→</span>
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        
                                        {matches.filter(m => m.status === 'FINALIZADO').length === 0 && (
                                            <p className="text-center py-10 text-gray-400 italic">No hay partidos registrados en el historial.</p>
                                        )}
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                )}

                {activeTab === 'CLUB' && (
                    <div className="animate-fadeIn space-y-6">
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-8">
                            {[
                                { id: 'fixture', label: 'Calendario', icon: '📅' },
                                { id: 'court-payment', label: 'Cobro Cancha', icon: '💸' },
                                { id: 'third-half', label: '3er Tiempo', icon: '🍻' },
                                { id: 'treasury', label: 'Caja Fuerte', icon: '💰' },
                                { id: 'statistics', label: 'Estadísticas', icon: '📈' },
                                { id: 'ratings', label: 'La Urna', icon: '🗳️' },
                                { id: 'roster', label: 'Plantilla', icon: '👥' },
                                { id: 'standings-photos', label: 'Posiciones', icon: '📊' },
                                { id: 'my-team', label: 'Nuestro Club', icon: '⭐' },
                                { id: 'logistics', label: 'Vestuario', icon: '👕' },
                                { id: 'stopwatch', label: 'Reloj Pro', icon: '⏱️' }
                            ].map(page => {
                                return (
                                    <button 
                                        key={page.id} 
                                        onClick={() => {
                                            if (page.id === 'roster') setIsRosterModalOpen(true);
                                            else setClubSubPage(page.id as ExtendedPage);
                                        }}
                                        className={`p-4 rounded-2xl flex flex-col items-center justify-center gap-2 border-2 transition-all active:scale-95 ${clubSubPage === page.id ? 'bg-indigo-600 border-indigo-500 text-white shadow-lg' : 'bg-white dark:bg-gray-800 border-transparent text-gray-500'}`}
                                    >
                                        <span className="text-2xl">{page.icon}</span>
                                        <span className="text-[10px] font-black uppercase tracking-tight">{page.label}</span>
                                    </button>
                                );
                            })}
                        </div>

                        {clubSubPage === 'fixture' && <FixturePage tournaments={sortedTournaments} myTeam={myTeam} matches={filteredMatches} opponents={sortedOpponents} venues={venues} setCurrentPage={() => {}} setSelectedMatchId={handleSelectMatchFromFixture} onOpenMatchForm={setMatchFormParams} onEditTournament={() => { setActiveTab('ADMIN'); setAdminSubPage('tournaments'); }} onDeleteMatch={(id) => deleteDocument(selectedTeam.id, 'matches', id.toString())} isAdmin={isAdmin} />}
                        {clubSubPage === 'court-payment' && <CourtPaymentPage matches={operationalMatches} players={players} opponents={sortedOpponents} onUpdatePayment={handlePlayerPaymentAmount} initialMatchId={pinnedMatch?.id} />}
                        {clubSubPage === 'standings-photos' && <StandingsPhotosPage photos={standingsPhotos} onAddPhoto={(url) => saveDocument(selectedTeam.id, 'standingsPhotos', Date.now().toString(), { url, timestamp: Date.now(), uploadedBy: currentUser.nickname })} onDeletePhoto={(id) => deleteDocument(selectedTeam.id, 'standingsPhotos', id)} isAdmin={isAdmin} leagueUrl={myTeam?.leagueUrl} />}
                        {clubSubPage === 'statistics' && <StatisticsPage stats={globalPlayerStats} canViewRatings={true} onViewProfile={setSelectedPlayerForProfile} teamPenaltiesAgainst={0} matches={matches} opponents={sortedOpponents} tournaments={sortedTournaments} isAdmin={isAdmin} />}
                        {clubSubPage === 'treasury' && <TreasuryPage data={treasuryData} players={players} />}
                        {clubSubPage === 'ratings' && (
                            <RatingsPage 
                                matches={filteredMatches} 
                                players={players} 
                                opponents={sortedOpponents} 
                                currentUser={currentUser} 
                                onPlayerRatingChange={async (mid, rid, tid, r) => saveDocument(selectedTeam.id, 'matches', mid.toString(), { ratings: { ...matches.find(x => x.id === mid)!.ratings, [rid]: { ...(matches.find(x => x.id === mid)!.ratings?.[rid] || {}), [tid]: r } } })} 
                                onFinishVoting={async (mid) => saveDocument(selectedTeam.id, 'matches', mid.toString(), { finishedVoters: [...(matches.find(x => x.id === mid)!.finishedVoters || []), currentUser.id] })} 
                                isAdmin={isAdmin} 
                                initialMatchId={selectedMatchId} 
                            />
                        )}
                        {clubSubPage === 'third-half' && (
                            <ThirdHalfPage 
                                matches={operationalMatches} 
                                opponents={sortedOpponents} 
                                players={players} 
                                onUpdateThirdHalf={(mid, items, payments, splitCount) => saveDocument(selectedTeam.id, 'matches', mid.toString(), { thirdHalf: { items, playerPayments: payments, totalSpent: items.reduce((a, b) => a + b.total, 0), splitCount } })} 
                                initialMatchId={pinnedMatch?.status === 'FINALIZADO' ? pinnedMatch.id : [...operationalMatches].filter(m => m.status === 'FINALIZADO').sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0]?.id} 
                            />
                        )}
                        {clubSubPage === 'my-team' && <MyTeamPage team={myTeam} onSave={(t) => saveDocument(selectedTeam.id, 'myTeam', 'info', t)} isAdmin={isAdmin} isSuperAdmin={isSuperAdmin} onTogglePinAuth={() => saveDocument(selectedTeam.id, 'settings', 'appSettings', { isPinAuthEnabled: !appSettings.isPinAuthEnabled })} isPinAuthEnabled={appSettings.isPinAuthEnabled} matches={filteredMatches} opponents={sortedOpponents} />}
                        {clubSubPage === 'logistics' && <LogisticsPage players={players} matches={operationalMatches} selectedMatchId={pinnedMatch?.id || 0} onUpdateLogistics={(mid, f, v) => saveDocument(selectedTeam.id, 'matches', mid.toString(), { [f]: v })} isAdmin={isAdmin} />}
                        {clubSubPage === 'stopwatch' && <StopwatchPage />}
                    </div>
                )}

                {activeTab === 'ADMIN' && isAdmin && (
                    <div className="animate-fadeIn space-y-6">
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-8">
                            {[
                                { id: 'tournaments', label: 'Campeonatos', icon: '🏆' },
                                { id: 'opponents', label: 'Rivales', icon: '🛡️' },
                                { id: 'venues', label: 'Canchas', icon: '🏟️' },
                                { id: 'announcement', label: 'Anuncio', icon: '📢' }
                            ].map(page => {
                                return (
                                    <button 
                                        key={page.id} 
                                        onClick={() => setAdminSubPage(page.id as ExtendedPage)}
                                        className={`p-4 rounded-2xl flex flex-col items-center justify-center gap-2 border-2 transition-all active:scale-95 ${adminSubPage === page.id ? 'bg-indigo-600 border-indigo-500 text-white shadow-lg' : 'bg-white dark:bg-gray-800 border-transparent text-gray-500'}`}
                                    >
                                        <span className="text-2xl">{page.icon}</span>
                                        <span className="text-[10px] font-black uppercase tracking-tight">{page.label}</span>
                                    </button>
                                );
                            })}
                        </div>

                        {adminSubPage === 'tournaments' && (
                            <div className="space-y-6">
                                <TournamentsPage 
                                    tournaments={sortedTournaments} 
                                    matches={matches} 
                                    onAddTournament={(t) => saveDocument(selectedTeam.id, 'tournaments', (tournaments.reduce((m, x) => Math.max(m, x.id), 0) + 1).toString(), t)} 
                                    onUpdateTournament={(t) => saveDocument(selectedTeam.id, 'tournaments', t.id.toString(), t)} 
                                    onDeleteTournament={(id) => deleteDocument(selectedTeam.id, 'tournaments', id.toString())} 
                                    onDuplicateTournament={handleDuplicateTournament}
                                    onOpenMatchForm={setMatchFormParams} 
                                    isAdmin={isAdmin} 
                                />
                                
                                <div className="bg-white dark:bg-gray-800 p-6 rounded-[2.5rem] shadow-xl border-t-8 border-blue-500">
                                    <h3 className="text-xl font-black uppercase italic mb-4">
                                        {selectedTournamentId 
                                            ? `Fixture: ${tournaments.find(t => t.id === selectedTournamentId)?.name || 'Campeonato'}` 
                                            : 'Fixture de Torneos (Todos)'}
                                    </h3>
                                    <FixturePage 
                                        tournaments={selectedTournamentId ? tournaments.filter(t => t.id === selectedTournamentId) : sortedTournaments} 
                                        myTeam={myTeam} 
                                        matches={filteredMatches} 
                                        opponents={sortedOpponents} 
                                        venues={venues} 
                                        setCurrentPage={() => {}} 
                                        setSelectedMatchId={handleSelectMatchFromFixture} 
                                        onOpenMatchForm={setMatchFormParams} 
                                        onEditTournament={() => setAdminSubPage('tournaments')} 
                                        onDeleteMatch={(id) => deleteDocument(selectedTeam.id, 'matches', id.toString())} 
                                        isAdmin={isAdmin} 
                                    />
                                </div>
                            </div>
                        )}
                        {adminSubPage === 'opponents' && <OpponentsPage opponents={sortedOpponents} onAddOpponent={(o) => saveDocument(selectedTeam.id, 'opponents', (opponents.reduce((m, x) => Math.max(m, x.id), 0) + 1).toString(), o)} onUpdateOpponent={(o) => saveDocument(selectedTeam.id, 'opponents', o.id.toString(), o)} onDeleteOpponent={(id) => deleteDocument(selectedTeam.id, 'opponents', id.toString())} isAdmin={isAdmin} />}
                        {adminSubPage === 'venues' && <VenuesPage venues={venues} onAddVenue={(v) => saveDocument(selectedTeam.id, 'venues', (venues.reduce((m, x) => Math.max(m, x.id), 0) + 1).toString(), v)} onUpdateVenue={(v) => saveDocument(selectedTeam.id, 'venues', v.id.toString(), v)} onDeleteVenue={(id) => deleteDocument(selectedTeam.id, 'venues', id.toString())} isAdmin={isAdmin} />}
                        {adminSubPage === ('announcement' as any) && (
                            <div className="bg-white dark:bg-gray-800 p-8 rounded-[2.5rem] shadow-xl border-t-8 border-indigo-600">
                                <h3 className="text-2xl font-black uppercase italic mb-4">📢 Anuncio Global</h3>
                                <p className="text-sm text-gray-500 mb-6 font-bold uppercase tracking-widest">Este mensaje aparecerá en la cabecera para todos los jugadores.</p>
                                <textarea 
                                    className="w-full p-4 rounded-2xl border-4 border-gray-100 dark:bg-gray-900 dark:border-gray-700 font-bold outline-none focus:border-indigo-500 min-h-[150px]"
                                    value={appSettings.announcement}
                                    onChange={(e) => saveDocument(selectedTeam.id, 'settings', 'appSettings', {announcement: e.target.value})}
                                    placeholder="Escribe el anuncio aquí..."
                                />
                            </div>
                        )}
                    </div>
                )}

                {activeTab === 'SOCIAL' && (
                    <div className="animate-fadeIn space-y-4">
                         <div className="flex bg-gray-200 dark:bg-gray-800 p-1 rounded-2xl gap-1 mb-4">
                            <button onClick={() => setSocialSubPage('chat')} className={`flex-1 py-3 rounded-xl font-black uppercase text-xs transition-all relative ${socialSubPage === 'chat' ? 'bg-indigo-600 text-white shadow-lg' : 'text-gray-500'}`}>
                                💬 Chat
                                {hasUnreadMessages && (
                                    <span className="absolute top-1.5 right-1.5 w-3 h-3 rounded-full animate-bounce-in shadow-md flex items-center justify-center overflow-hidden">
                                        <span className="absolute inset-0 bg-gradient-to-tr from-red-600 via-pink-500 to-orange-400 animate-hue-rotate"></span>
                                        <span className="relative text-[6px] font-black text-white">!</span>
                                    </span>
                                )}
                            </button>
                            <button onClick={() => setSocialSubPage('entertainment')} className={`flex-1 py-3 rounded-xl font-black uppercase text-xs transition-all ${socialSubPage === 'entertainment' ? 'bg-indigo-600 text-white shadow-lg' : 'text-gray-500'}`}>🎮 Arcade</button>
                            <button onClick={() => setSocialSubPage('help')} className={`flex-1 py-3 rounded-xl font-black uppercase text-xs transition-all ${socialSubPage === 'help' ? 'bg-indigo-600 text-white shadow-lg' : 'text-gray-500'}`}>❓ Ayuda</button>
                        </div>
                        {socialSubPage === 'chat' && (
                            <div className="fixed inset-0 bg-black/70 z-[100] flex flex-col animate-fadeIn">
                                {(() => {
                                    const activeChatMatch = selectedMatchForChat || currentMatch;
                                    
                                    return (
                                        <TeamWhatsApp 
                                            currentUser={currentUser} 
                                            players={players} 
                                            messages={messages} 
                                            onAddMessage={(c) => activeChatMatch && addMessage(selectedTeam.id, activeChatMatch.id.toString(), currentUser, c)}
                                            onDeleteMessage={(id) => activeChatMatch && deleteMessage(selectedTeam.id, activeChatMatch.id.toString(), id)}
                                            onToggleReaction={(id, e) => activeChatMatch && toggleReaction(selectedTeam.id, activeChatMatch.id.toString(), id, e, currentUser.id)}
                                            onClose={() => {
                                                setSocialSubPage('entertainment');
                                                setSelectedMatchForChat(null);
                                            }}
                                            matchTitle={activeChatMatch ? `vs ${sortedOpponents.find(o => o.id === activeChatMatch.opponentId)?.name}` : 'Chat General'}
                                            isFirebaseOnline={isFirebaseOnline}
                                            isAdmin={isAdmin}
                                            isMatchFinished={activeChatMatch?.status === 'FINALIZADO'}
                                        />
                                    );
                                })()}
                            </div>
                        )}
                        {socialSubPage === 'entertainment' && <EntertainmentPage players={players} currentUser={currentUser} onSavePlayer={(p) => saveDocument(selectedTeam.id, 'players', p.id.toString(), p)} messages={messages} appSettings={appSettings} onUpdateSettings={(s) => saveDocument(selectedTeam.id, 'settings', 'appSettings', s)} onResetAllAttempts={handleResetAllAttempts} onResetScores={handleResetScores} isAdmin={isAdmin} myTeam={myTeam} opponents={sortedOpponents} />}
                        {socialSubPage === 'help' && <HelpPage isAdmin={isAdmin} onInstallApp={handleInstallApp} />}
                    </div>
                )}
            </main>

            <BottomNavigation 
                activeTab={activeTab} 
                onTabChange={setActiveTab} 
                isAdmin={isAdmin} 
                hasUnreadMessages={hasUnreadMessages}
            />
            
            {showSharePrompt && (
                <div className="fixed bottom-24 left-4 right-4 z-[60] animate-bounce-in">
                    <div className="bg-white dark:bg-gray-800 p-4 rounded-[2rem] shadow-[0_10px_40px_rgba(0,0,0,0.3)] border-4 border-emerald-500 flex flex-col items-center text-center gap-3">
                        <div className="flex items-center gap-2">
                            <span className="text-2xl">✅</span>
                            <p className="font-black text-gray-800 dark:text-white uppercase italic tracking-tighter">
                                {showSharePrompt.status === AttendanceStatus.CONFIRMED ? '¡YA ESTÁS ANOTADO!' : '¡AVISASTE QUE NO VAS!'}
                            </p>
                        </div>
                        <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">¿Querés enviar la lista actualizada al grupo?</p>
                        
                        <div className="flex gap-2 w-full">
                            <button 
                                onClick={() => setShowSharePrompt(null)}
                                className="flex-1 py-3 bg-gray-100 dark:bg-gray-700 text-gray-400 font-black rounded-2xl text-xs uppercase"
                            >
                                AHORA NO
                            </button>
                            <button 
                                onClick={() => {
                                    const shareText = getWhatsAppShareText(showSharePrompt.match, players, myTeam, opponents);
                                    window.location.href = `whatsapp://send?text=${encodeURIComponent(shareText)}`;
                                    setShowSharePrompt(null);
                                }}
                                className="flex-[2] py-4 bg-emerald-600 text-white font-black rounded-2xl shadow-lg shadow-emerald-500/40 text-xs uppercase italic tracking-tighter flex items-center justify-center gap-2 animate-pulse-slow"
                            >
                                <span>📱</span> ENVIAR LISTA WA
                            </button>
                        </div>
                    </div>
                </div>
            )}
            
            {canCargarDatos && currentMatch && (
                <QuickActionOverlay 
                    player={quickActionPlayer} 
                    playerStatus={currentMatch.playerStatuses.find(s => s.playerId === quickActionPlayer?.id) || null}
                    onClose={() => setQuickActionPlayer(null)} 
                    onUpdateStat={(f, v) => quickActionPlayer && handlePlayerStatsChange(currentMatch.id, quickActionPlayer.id, f, v)}
                    onUpdatePayment={(amt) => quickActionPlayer && handlePlayerPaymentAmount(currentMatch.id, quickActionPlayer.id, amt)}
                    fairShare={fairShare}
                />
            )}

            {isRosterModalOpen && (
                <RosterManagementModal 
                    players={players} 
                    onClose={() => setIsRosterModalOpen(false)} 
                    onAddPlayer={(p) => saveDocument(selectedTeam.id, 'players', (players.reduce((m, x) => Math.max(m, x.id), 0) + 1).toString(), p)}
                    onUpdatePlayer={(p) => saveDocument(selectedTeam.id, 'players', p.id.toString(), p)}
                    onDeletePlayer={(id) => deleteDocument(selectedTeam.id, 'players', id.toString())}
                    onViewProfile={setSelectedPlayerForProfile}
                    isCurrentUserSuperAdmin={isSuperAdmin}
                    superAdminPlayerId={appSettings.superAdminPlayerId}
                    onTransferSuperAdmin={(id) => saveDocument(selectedTeam.id, 'settings', 'appSettings', {superAdminPlayerId: id})}
                    onToggleSubAdmin={(pid) => { const p = players.find(x => x.id === pid); if(p) return saveDocument(selectedTeam.id, 'players', pid.toString(), {...p, isSubAdmin: !p.isSubAdmin}); return Promise.resolve(); }}
                    currentUser={currentUser!}
                    isAdmin={isAdmin}
                />
            )}
            {selectedPlayerForProfile && <PlayerProfileModal player={selectedPlayerForProfile} matches={matches} opponents={sortedOpponents} onClose={() => setSelectedPlayerForProfile(null)} />}
            {selectedMatchForSummary && (
                <MatchSummaryModal 
                    match={selectedMatchForSummary} 
                    players={players} 
                    opponent={sortedOpponents.find(o => o.id === selectedMatchForSummary.opponentId)} 
                    onClose={() => setSelectedMatchForSummary(null)} 
                    onChatClick={() => {
                        setSelectedMatchForChat(selectedMatchForSummary);
                        setActiveTab('SOCIAL');
                        setSocialSubPage('chat');
                        setSelectedMatchForSummary(null);
                    }}
                    onVoteClick={() => {
                        setSelectedMatchId(selectedMatchForSummary.id);
                        setActiveTab('CLUB');
                        setClubSubPage('ratings');
                        setSelectedMatchForSummary(null);
                    }}
                    isAdmin={isAdmin}
                    onAdminClick={() => {
                        setSelectedMatchId(selectedMatchForSummary.id);
                        setHomeView('NEXT');
                        setSelectedMatchForSummary(null);
                    }}
                />
            )}
            {isEditProfileOpen && (
                <div className="fixed inset-0 bg-black/70 flex justify-center items-center z-[100] p-4">
                    <div className="bg-white dark:bg-gray-800 p-6 rounded-[2rem] w-full max-w-lg overflow-y-auto max-h-[90vh]">
                        <PlayerForm player={currentUser} onSave={(p) => { saveDocument(selectedTeam.id, 'players', currentUser!.id.toString(), p); setCurrentUser(p as Player); setIsEditProfileOpen(false); }} onCancel={() => setIsEditProfileOpen(false)} />
                    </div>
                </div>
            )}
            {matchFormParams && (
                <MatchForm 
                    match={matchFormParams.match} 
                    tournamentId={matchFormParams.tournamentId} 
                    allMatches={matches} 
                    onSave={(d) => {
                        saveDocument(selectedTeam.id, 'matches', (d as any).id?.toString() || (matches.reduce((m, x) => Math.max(m, x.id), 0) + 1).toString(), { ...d, playerStatuses: (d as any).playerStatuses || players.map(p => ({ playerId: p.id, attendanceStatus: AttendanceStatus.PENDING, paymentStatus: PaymentStatus.UNPAID, amountPaid: 0, quartersPlayed: 4 })), ratingStatus: (d as any).ratingStatus || 'CLOSED' });
                        setMatchFormParams(null);
                    }} 
                    onCancel={() => setMatchFormParams(null)} 
                    venues={venues} 
                    opponents={sortedOpponents} 
                />
            )}
            
            {/* QuickActionOverlay is renamed/reused or we can add a new modal call here if needed, 
                but based on MatchCard, MatchAdminModal is called from within MatchCard or similar. 
                Wait, I need to check where MatchAdminModal is actually used. 
            */}
        </div>
    );
};

export default App;