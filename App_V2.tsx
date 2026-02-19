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

// V2 Components
import { BottomNavigation } from './components/v2/BottomNavigation.tsx';
import { QuickActionOverlay } from './components/v2/QuickActionOverlay.tsx';

// Existing Components (reused in V2 tabs)
import { MatchCard } from './components/MatchCard.tsx';
import { Chat } from './components/Chat.tsx';
import { ToastContainer } from './components/Toast.tsx';
import { Header } from './components/Header.tsx';
import { TeamAccessModal } from './components/TeamAccessModal.tsx';
import { UserSelectionModal } from './components/UserSelectionModal.tsx';
import { SuperAdminPanel } from './components/pages/SuperAdminPanel.tsx';
import { PlayerProfileModal } from './components/PlayerProfileModal.tsx';
import { RosterManagementModal } from './components/RosterManagementModal.tsx';
import { PlayerForm } from './components/PlayerForm.tsx';
import { MatchForm } from './components/forms/MatchForm.tsx';

// Pages grouped by V2 Tabs
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

export type V2Tab = 'HOME' | 'CLUB' | 'SOCIAL';
export type ExtendedPage = Page | 'court-payment';

const AppV2: React.FC = () => {
    // Auth & Team States
    const [selectedTeam, setSelectedTeam] = useLocalStorage<Team | null>('selectedTeam', null);
    const [currentUser, setCurrentUser] = useLocalStorage<Player | null>('currentUser', null);
    const [isTeamActive, setIsTeamActive] = useState(true);
    const [isFirebaseOnline, setIsFirebaseOnline] = useState(true);

    // V2 Navigation States
    const [activeTab, setActiveTab] = useState<V2Tab>('HOME');
    const [clubSubPage, setClubSubPage] = useState<ExtendedPage>('fixture');
    const [socialSubPage, setSocialSubPage] = useState<Page>('chat');

    // Modals & Overlays
    const [selectedPlayerForProfile, setSelectedPlayerForProfile] = useState<Player | null>(null);
    const [isRosterModalOpen, setIsRosterModalOpen] = useState(false);
    const [isEditProfileOpen, setIsEditProfileOpen] = useState(false);
    const [quickActionPlayer, setQuickActionPlayer] = useState<Player | null>(null);
    const [matchFormParams, setMatchFormParams] = useState<{ tournamentId: number, match?: Match } | null>(null);
    
    const [selectedMatchId, setSelectedMatchId] = useState<number | null>(null);

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
    
    // AI & Helpers
    const [teams, setTeams] = useState<Teams | null>(null);
    const [isGeneratingTeams, setIsGeneratingTeams] = useState(false);

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

    const currentMatch = useMemo(() => {
        if (matches.length === 0) return null;
        if (selectedMatchId) {
            const found = matches.find(m => m.id === selectedMatchId);
            if (found) return found;
        }
        const now = new Date();
        const nowTime = now.getTime();
        const oneDayMs = 24 * 60 * 60 * 1000;
        const urgentMatch = matches.find(m => {
            const mDate = new Date(m.date).getTime();
            return m.status === 'PROGRAMADO' && Math.abs(mDate - nowTime) < oneDayMs;
        });
        if (urgentMatch) return urgentMatch;
        const nextScheduled = [...matches]
            .filter(m => m.status === 'PROGRAMADO')
            .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())[0];
        if (nextScheduled) return nextScheduled;
        return [...matches]
            .filter(m => m.status === 'FINALIZADO')
            .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())[0];
    }, [matches, selectedMatchId]);

    const fairShare = useMemo(() => {
        if (!currentMatch) return 0;
        const confirmed = currentMatch.playerStatuses.filter(s => s.attendanceStatus === AttendanceStatus.CONFIRMED && !players.find(p => p.id === s.playerId && (p.role === PlayerRole.DT || p.role === PlayerRole.AYUDANTE))).length;
        return confirmed > 0 ? currentMatch.courtFee / confirmed : 0;
    }, [currentMatch, players]);

    const treasuryData = useMemo(() => {
        const finished = matches.filter(m => m.status === 'FINALIZADO');
        const matchDetails = finished.map(m => {
            const collected = m.playerStatuses.reduce((acc, ps) => acc + (ps.amountPaid || 0), 0);
            return { ...m, collected, balance: collected - m.courtFee };
        });
        const totalSpent = finished.reduce((acc, m) => acc + m.courtFee, 0);
        const totalCollected = finished.reduce((acc, m) => acc + m.playerStatuses.reduce((a, ps) => a + (ps.amountPaid || 0), 0), 0);
        return { totalSpent, totalCollected, balance: totalCollected - totalSpent, matches: matchDetails };
    }, [matches]);

    const globalPlayerStats: PlayerStats[] = useMemo(() => {
        return players.map(player => {
            const playerMatches = matches.filter(m => m.status === 'FINALIZADO' && m.playerStatuses.some(ps => ps.playerId === player.id && ps.attendanceStatus === AttendanceStatus.CONFIRMED));
            let goalsPlay = 0, goalsPenalty = 0, goalsHeader = 0, goalsSetPiece = 0, assists = 0, yellowCards = 0, totalAmountPaid = 0, totalQuartersPlayed = 0, ratingSum = 0, ratingCount = 0;
            let redCards = 0;

            playerMatches.forEach(m => {
                const ps = m.playerStatuses.find(s => s.playerId === player.id)!;
                goalsPlay += (ps.goalsPlay || 0);
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
    }, [players, matches]);

    useEffect(() => {
        if (!selectedTeam || !currentMatch) return;
        return subscribeToMessages(selectedTeam.id, currentMatch.id.toString(), setMessages, () => {});
    }, [currentMatch, selectedTeam]);

    const handlePlayerStatsChange = async (mid: number, pid: number, field: keyof PlayerMatchStatus, value: any) => {
        const m = matches.find(x => x.id === mid);
        if(!m) return;
        const currentVal = (m.playerStatuses.find(s => s.playerId === pid) as any)?.[field] || 0;
        const newVal = typeof value === 'number' ? currentVal + value : value;
        const newStatuses = m.playerStatuses.map(s => s.playerId === pid ? { ...s, [field]: newVal } : s);
        await saveDocument(selectedTeam!.id, 'matches', mid.toString(), { playerStatuses: newStatuses });
    };

    const handlePlayerStatusChange = async (mid: number, pid: number, st: AttendanceStatus) => {
        const m = matches.find(x => x.id === mid);
        if(!m) return;
        let ups = m.playerStatuses.map(s => s.playerId === pid ? { ...s, attendanceStatus: st } : s);
        if(!ups.some(s => s.playerId === pid)) {
            ups.push({playerId: pid, attendanceStatus: st, paymentStatus: PaymentStatus.UNPAID, amountPaid: 0, quartersPlayed: 4});
        }
        await saveDocument(selectedTeam!.id, 'matches', mid.toString(), { playerStatuses: ups });
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

    if (!selectedTeam) return <TeamAccessModal onTeamSelect={setSelectedTeam} />;
    if (!isTeamActive && selectedTeam.id !== 'super-admin') return <div className="min-h-screen bg-indigo-950 flex items-center justify-center p-6 text-white uppercase font-black"><h1>SERVICIO SUSPENDIDO</h1></div>;
    if (selectedTeam.id === 'super-admin') return <div className="min-h-screen bg-gray-900 p-4"><SuperAdminPanel /><ToastContainer /></div>;
    if (!currentUser) return <UserSelectionModal players={players} onSelectUser={setCurrentUser} isPinAuthEnabled={appSettings.isPinAuthEnabled} onTogglePinAuth={() => {}} />;

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 pb-24">
            <ToastContainer />
            <Header 
                currentUser={currentUser} 
                onOpenRoster={() => setIsRosterModalOpen(true)} 
                onChangeUser={() => setCurrentUser(null)} 
                currentPage={activeTab === 'HOME' ? 'home' : 'chat'} 
                setCurrentPage={() => {}} 
                isAdmin={isAdmin} 
                onEditProfile={() => setIsEditProfileOpen(true)} 
                isFirebaseOnline={isFirebaseOnline} 
                announcement={appSettings.announcement} 
                onUpdateAnnouncement={(t) => saveDocument(selectedTeam.id, 'settings', 'appSettings', {announcement: t})}
                canEditAnnouncement={isAdmin}
                notificationPermission="default"
                onRequestNotificationPermission={() => {}}
                hideNav={true}
            />

            <main className="container mx-auto px-4 py-6 max-w-5xl">
                {activeTab === 'HOME' && (
                    <div className="space-y-6 animate-fadeIn">
                        {currentMatch ? (
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
                            />
                        ) : (
                            <div className="text-center py-20 bg-white dark:bg-gray-800 rounded-[2rem] border-4 border-dashed border-gray-100 dark:border-gray-700">
                                <span className="text-6xl mb-4 block">🏟️</span>
                                <h2 className="text-2xl font-black uppercase text-gray-400">Sin partidos a la vista</h2>
                                <p className="text-indigo-500 font-bold mt-2">Ve al "Mundo Players" para organizar el próximo.</p>
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
                                { id: 'standings-photos', label: 'Posiciones', icon: '📊' },
                                { id: 'my-team', label: 'Nuestro Club', icon: '🛡️' },
                                { id: 'logistics', label: 'Utilería', icon: '👕' }
                            ].map(page => (
                                <button 
                                    key={page.id} 
                                    onClick={() => setClubSubPage(page.id as ExtendedPage)}
                                    className={`p-4 rounded-2xl flex flex-col items-center justify-center gap-2 border-2 transition-all active:scale-95 ${clubSubPage === page.id ? 'bg-indigo-600 border-indigo-500 text-white shadow-lg' : 'bg-white dark:bg-gray-800 border-transparent text-gray-500'}`}
                                >
                                    <span className="text-2xl">{page.icon}</span>
                                    <span className="text-[10px] font-black uppercase tracking-tight">{page.label}</span>
                                </button>
                            ))}
                        </div>

                        {clubSubPage === 'fixture' && <FixturePage tournaments={tournaments} myTeam={myTeam} matches={matches} opponents={opponents} venues={venues} setCurrentPage={() => {}} setSelectedMatchId={handleSelectMatchFromFixture} onOpenMatchForm={setMatchFormParams} onDeleteMatch={(id) => deleteDocument(selectedTeam.id, 'matches', id.toString())} isAdmin={isAdmin} />}
                        {clubSubPage === 'court-payment' && <CourtPaymentPage matches={matches} players={players} opponents={opponents} onUpdatePayment={handlePlayerPaymentAmount} />}
                        {clubSubPage === 'standings-photos' && <StandingsPhotosPage photos={standingsPhotos} onAddPhoto={(url) => saveDocument(selectedTeam.id, 'standingsPhotos', Date.now().toString(), { url, timestamp: Date.now(), uploadedBy: currentUser.nickname })} onDeletePhoto={(id) => deleteDocument(selectedTeam.id, 'standingsPhotos', id)} isAdmin={isAdmin} />}
                        {clubSubPage === 'statistics' && <StatisticsPage stats={globalPlayerStats} canViewRatings={true} onViewProfile={setSelectedPlayerForProfile} teamPenaltiesAgainst={0} matches={matches} currentUser={currentUser} opponents={opponents} isAdmin={isAdmin} />}
                        {clubSubPage === 'treasury' && <TreasuryPage data={treasuryData} />}
                        {clubSubPage === 'ratings' && <RatingsPage matches={matches} players={players} opponents={opponents} currentUser={currentUser} onPlayerRatingChange={async (mid, rid, tid, r) => saveDocument(selectedTeam.id, 'matches', mid.toString(), { ratings: { ...matches.find(x => x.id === mid)!.ratings, [rid]: { ...(matches.find(x => x.id === mid)!.ratings?.[rid] || {}), [tid]: r } } })} onFinishVoting={async (mid) => saveDocument(selectedTeam.id, 'matches', mid.toString(), { finishedVoters: [...(matches.find(x => x.id === mid)!.finishedVoters || []), currentUser.id] })} isAdmin={isAdmin} />}
                        {clubSubPage === 'third-half' && <ThirdHalfPage matches={matches} opponents={opponents} players={players} onUpdateThirdHalf={(mid, items, payments) => saveDocument(selectedTeam.id, 'matches', mid.toString(), { thirdHalf: { items, playerPayments: payments, totalSpent: items.reduce((a, b) => a + b.total, 0) } })} />}
                        {clubSubPage === 'my-team' && <MyTeamPage team={myTeam} onSave={(t) => saveDocument(selectedTeam.id, 'myTeam', 'info', t)} isAdmin={isAdmin} isSuperAdmin={isSuperAdmin} onTogglePinAuth={() => saveDocument(selectedTeam.id, 'settings', 'appSettings', { isPinAuthEnabled: !appSettings.isPinAuthEnabled })} isPinAuthEnabled={appSettings.isPinAuthEnabled} matches={matches} opponents={opponents} />}
                        {clubSubPage === 'logistics' && <LogisticsPage players={players} matches={matches} selectedMatchId={currentMatch?.id || 0} onUpdateLogistics={(mid, f, v) => saveDocument(selectedTeam.id, 'matches', mid.toString(), { [f]: v })} isAdmin={isAdmin} />}
                    </div>
                )}

                {activeTab === 'SOCIAL' && (
                    <div className="animate-fadeIn space-y-4">
                         <div className="flex bg-gray-200 dark:bg-gray-800 p-1 rounded-2xl gap-1 mb-4">
                            <button onClick={() => setSocialSubPage('chat')} className={`flex-1 py-3 rounded-xl font-black uppercase text-xs transition-all ${socialSubPage === 'chat' ? 'bg-indigo-600 text-white shadow-lg' : 'text-gray-500'}`}>💬 Chat</button>
                            <button onClick={() => setSocialSubPage('entertainment')} className={`flex-1 py-3 rounded-xl font-black uppercase text-xs transition-all ${socialSubPage === 'entertainment' ? 'bg-indigo-600 text-white shadow-lg' : 'text-gray-500'}`}>🎮 Arcade</button>
                            <button onClick={() => setSocialSubPage('help')} className={`flex-1 py-3 rounded-xl font-black uppercase text-xs transition-all ${socialSubPage === 'help' ? 'bg-indigo-600 text-white shadow-lg' : 'text-gray-500'}`}>❓ Ayuda</button>
                        </div>
                        {socialSubPage === 'chat' && (
                            <div className="h-[calc(100vh-220px)] min-h-[500px]">
                                <Chat 
                                    currentUser={currentUser} 
                                    players={players} 
                                    messages={messages} 
                                    onAddMessage={(c) => currentMatch && addMessage(selectedTeam.id, currentMatch.id.toString(), currentUser, c)}
                                    onDeleteMessage={(id) => currentMatch && deleteMessage(selectedTeam.id, currentMatch.id.toString(), id)}
                                    onToggleReaction={(id, e) => currentMatch && toggleReaction(selectedTeam.id, currentMatch.id.toString(), id, e, currentUser.id)}
                                    matchTitle={currentMatch ? `vs ${opponents.find(o => o.id === currentMatch.opponentId)?.name}` : 'Chat General'}
                                    birthdayPlayers={[]}
                                    isFirebaseOnline={isFirebaseOnline}
                                />
                            </div>
                        )}
                        {socialSubPage === 'entertainment' && <EntertainmentPage players={players} currentUser={currentUser} onSavePlayer={(p) => saveDocument(selectedTeam.id, 'players', p.id.toString(), p)} messages={messages} appSettings={appSettings} onUpdateSettings={(s) => saveDocument(selectedTeam.id, 'settings', 'appSettings', s)} onResetAllAttempts={() => Promise.resolve()} onResetScores={() => Promise.resolve()} isAdmin={isAdmin} myTeam={myTeam} opponents={opponents} />}
                        {socialSubPage === 'help' && <HelpPage isAdmin={isAdmin} />}
                    </div>
                )}
            </main>

            <BottomNavigation activeTab={activeTab} onTabChange={setActiveTab} />
            
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
                />
            )}
            {selectedPlayerForProfile && <PlayerProfileModal player={selectedPlayerForProfile} matches={matches} opponents={opponents} onClose={() => setSelectedPlayerForProfile(null)} />}
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
                    opponents={opponents} 
                />
            )}
        </div>
    );
};

export default AppV2;