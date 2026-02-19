import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Header } from './components/Header.tsx';
import { MatchCard } from './components/MatchCard.tsx';
import { RosterManagementModal } from './components/RosterManagementModal.tsx';
import { UserSelectionModal } from './components/UserSelectionModal.tsx';
import { TeamAccessModal } from './components/TeamAccessModal.tsx';
import { SuperAdminPanel } from './components/pages/SuperAdminPanel.tsx';
import { Chat } from './components/Chat.tsx';
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
import { RatingsPage } from './components/pages/RatingsPage.tsx';
import { ThirdHalfPage } from './components/pages/ThirdHalfPage.tsx';
import { EntertainmentPage } from './components/pages/EntertainmentPage.tsx'; 
import { StopwatchPage } from './components/pages/StopwatchPage.tsx'; 
import { StandingsPhotosPage } from './components/pages/StandingsPhotosPage.tsx';
import { BirthdayCard } from './components/BirthdayCard.tsx';
import { MatchForm } from './components/forms/MatchForm.tsx';
import { PlayerForm } from './components/PlayerForm.tsx';
import { useLocalStorage } from './hooks/useLocalStorage.ts';
import { subscribeToCollection, saveDocument, deleteDocument, subscribeToMessages, addMessage, deleteMessage, toggleReaction, getFirestoreInstance, subscribeToTeam } from './services/firebaseService.ts';
import { INITIAL_PLAYERS, INITIAL_APP_SETTINGS } from './constants.ts';
import { PaymentStatus, AttendanceStatus } from './types.ts';
import type { Player, Match, Page, Teams, ChatMessage, MyTeam, Opponent, Venue, Tournament, AppSettings, PlayerStats, Team, StandingsPhoto, PlayerMatchStatus } from './types.ts';
import { generateTeamsAI } from './services/geminiService.ts';

const App: React.FC = () => {
    const [selectedTeam, setSelectedTeam] = useLocalStorage<Team | null>('selectedTeam', null);
    const [isTeamActive, setIsTeamActive] = useState(true);
    const [currentUser, setCurrentUser] = useLocalStorage<Player | null>('currentUser', null);
    const [currentPage, setCurrentPage] = useState<Page>('home');
    const [isRosterModalOpen, setIsRosterModalOpen] = useState(false);
    const [matchFormParams, setMatchFormParams] = useState<{ tournamentId: number, match?: Match } | null>(null);
    const [selectedPlayerForProfile, setSelectedPlayerForProfile] = useState<Player | null>(null);
    const [teams, setTeams] = useState<Teams | null>(null);
    const [isGeneratingTeams, setIsGeneratingTeams] = useState(false);
    const [isFirebaseOnline, setIsFirebaseOnline] = useState(true);
    const [isEditProfileOpen, setIsEditProfileOpen] = useState(false);
    
    const [players, setPlayers] = useState<Player[]>([]);
    const [matches, setMatches] = useState<Match[]>([]);
    const [myTeam, setMyTeam] = useState<MyTeam | null>(null);
    const [opponents, setOpponents] = useState<Opponent[]>([]);
    const [venues, setVenues] = useState<Venue[]>([]);
    const [tournaments, setTournaments] = useState<Tournament[]>([]);
    const [appSettings, setAppSettings] = useState<AppSettings>(INITIAL_APP_SETTINGS);
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [standingsPhotos, setStandingsPhotos] = useState<StandingsPhoto[]>([]);
    const [selectedMatchId, setSelectedMatchId] = useState<number | null>(null);

    const [bubblePos, setBubblePos] = useState({ x: 20, y: 120 });
    const isDragging = useRef(false);
    const dragStart = useRef({ x: 0, y: 0 });

    const handlePointerDown = (e: React.PointerEvent) => {
        isDragging.current = true;
        dragStart.current = { x: e.clientX, y: e.clientY };
        (e.target as HTMLElement).setPointerCapture(e.pointerId);
    };

    const handlePointerMove = (e: React.PointerEvent) => {
        if (!isDragging.current) return;
        const deltaX = dragStart.current.x - e.clientX;
        const deltaY = dragStart.current.y - e.clientY;
        
        setBubblePos(prev => ({
            x: Math.max(10, Math.min(window.innerWidth - 80, prev.x + deltaX)),
            y: Math.max(10, Math.min(window.innerHeight - 80, prev.y + deltaY))
        }));
        
        dragStart.current = { x: e.clientX, y: e.clientY };
    };

    const handlePointerUp = (e: React.PointerEvent) => {
        isDragging.current = false;
        (e.target as HTMLElement).releasePointerCapture(e.pointerId);
    };

    useEffect(() => {
        if (!selectedTeam || selectedTeam.id === 'super-admin') return;
        const unsubTeam = subscribeToTeam(selectedTeam.id, (team: Team | null) => {
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
        const unsubS = subscribeToCollection<any>(selectedTeam.id, 'settings', 'appSettings', (data) => { if(data[0]) setAppSettings(data[0]); }, () => {});
        const unsubMT = subscribeToCollection<any>(selectedTeam.id, 'myTeam', 'info', (data) => { if(data[0]) setMyTeam(data[0]); }, () => {});
        const unsubSP = subscribeToCollection<StandingsPhoto>(selectedTeam.id, 'standingsPhotos', null, setStandingsPhotos, () => {});
        return () => { unsubP(); unsubM(); unsubO(); unsubV(); unsubT(); unsubS(); unsubMT(); unsubSP(); };
    }, [selectedTeam]);

    const birthdayPlayers = useMemo(() => {
        const today = new Date();
        const month = (today.getMonth() + 1).toString().padStart(2, '0');
        const day = today.getDate().toString().padStart(2, '0');
        const todayStr = `${month}-${day}`; 
        
        return players.filter(p => {
            if (!p.birthDate) return false;
            return p.birthDate.endsWith(todayStr);
        });
    }, [players]);

    const nextMatch = useMemo(() => selectedMatchId ? matches.find(m => m.id === selectedMatchId) || null : matches.filter(m => m.status !== 'FINALIZADO').sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())[0] || null, [matches, selectedMatchId]);

    useEffect(() => {
        if (!selectedTeam || selectedTeam.id === 'super-admin' || !nextMatch) { setMessages([]); return; }
        return subscribeToMessages(selectedTeam.id, nextMatch.id.toString(), setMessages, () => {});
    }, [nextMatch, selectedTeam]);

    const isAdmin = !!(currentUser?.id === appSettings.superAdminPlayerId || currentUser?.isSubAdmin);

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

    const handleLogout = () => {
        if (window.confirm("¿Seguro quieres salir de tu usuario?")) {
            setCurrentUser(null);
        }
    };

    if (!selectedTeam) return <TeamAccessModal onTeamSelect={setSelectedTeam} />;
    if (!isTeamActive && selectedTeam.id !== 'super-admin') return <div className="min-h-screen bg-indigo-950 flex items-center justify-center p-6 text-center text-white"><h1>SERVICIO SUSPENDIDO</h1></div>;
    if (selectedTeam.id === 'super-admin') return <div className="min-h-screen bg-gray-900 p-4"><SuperAdminPanel /><ToastContainer /></div>;
    if (!currentUser) return <UserSelectionModal players={players} onSelectUser={setCurrentUser} isPinAuthEnabled={appSettings.isPinAuthEnabled} onTogglePinAuth={() => {}} />;

    const ChatComponent = (
        <Chat 
            currentUser={currentUser} 
            players={players} 
            messages={messages} 
            onAddMessage={(c) => nextMatch && addMessage(selectedTeam.id, nextMatch.id.toString(), currentUser, c)} 
            onDeleteMessage={(id) => nextMatch && deleteMessage(selectedTeam.id, nextMatch.id.toString(), id)} 
            onToggleReaction={(id, e) => nextMatch && toggleReaction(selectedTeam.id, nextMatch.id.toString(), id, e, currentUser.id)} 
            matchTitle={nextMatch ? `vs ${opponents.find(o => o.id === nextMatch.opponentId)?.name}` : 'General'} 
            birthdayPlayers={birthdayPlayers} 
            isFirebaseOnline={isFirebaseOnline} 
            isMatchFinished={nextMatch?.status === 'FINALIZADO'} 
        />
    );

    return (
        <div className="min-h-screen bg-gray-100 dark:bg-gray-900">
             <ToastContainer />
            <Header 
                currentUser={currentUser} 
                onOpenRoster={() => setIsRosterModalOpen(true)} 
                onChangeUser={handleLogout} 
                currentPage={currentPage} 
                setCurrentPage={setCurrentPage} 
                isAdmin={isAdmin} 
                onEditProfile={() => setIsEditProfileOpen(true)} 
                isFirebaseOnline={isFirebaseOnline} 
                announcement={appSettings.announcement} 
                onUpdateAnnouncement={(t) => saveDocument(selectedTeam.id, 'settings', 'appSettings', {announcement: t})} 
                canEditAnnouncement={isAdmin} 
                notificationPermission="default" 
                onRequestNotificationPermission={() => {}} 
            />
            
            <main className="container mx-auto px-1 md:px-4 py-4 pb-24">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 md:gap-6">
                    <div className={`${currentPage === 'chat' ? 'lg:col-span-12' : 'lg:col-span-8'} space-y-6`}> 
                        {currentPage === 'home' && (
                            <>
                                {birthdayPlayers.length > 0 && <BirthdayCard players={birthdayPlayers} />}
                                {nextMatch && (
                                    <MatchCard 
                                        teamId={selectedTeam.id} 
                                        match={nextMatch} 
                                        players={players} 
                                        currentUser={currentUser!} 
                                        myTeam={myTeam} 
                                        opponents={opponents} 
                                        onPlayerStatusChange={async (mid: number, pid: number, st: AttendanceStatus) => { 
                                            const m = matches.find(x => x.id === mid); 
                                            if(m) { 
                                                const ups = m.playerStatuses.map(s => s.playerId === pid ? { ...s, attendanceStatus: st } : s); 
                                                if(!ups.some(s=>s.playerId === pid)) ups.push({playerId: pid, attendanceStatus: st, paymentStatus: PaymentStatus.UNPAID, amountPaid: 0, quartersPlayed: 4}); 
                                                return saveDocument(selectedTeam.id, 'matches', mid.toString(), { playerStatuses: ups }); 
                                            } 
                                            return Promise.resolve(); 
                                        }} 
                                        onCourtFeeChange={async (mid: number, fee: number) => saveDocument(selectedTeam.id, 'matches', mid.toString(), { courtFee: fee })} 
                                        onUpdateMatchDetails={async (mid: number, f: string, v: any) => saveDocument(selectedTeam.id, 'matches', mid.toString(), { [f]: v })} 
                                        onStandingsChange={async (mid: number, tId: number, p: number) => { 
                                            const m = matches.find(x => x.id === mid); 
                                            if(m?.standings) return saveDocument(selectedTeam.id, 'matches', mid.toString(), { standings: m.standings.map(s => s.id === tId ? { ...s, position: p } : s) }); 
                                            return Promise.resolve(); 
                                        }} 
                                        onPlayerRatingChange={async (mid: number, rId: number, targetId: number, r: number) => { 
                                            const m = matches.find(x => x.id === mid); 
                                            if(m) return saveDocument(selectedTeam.id, 'matches', mid.toString(), { ratings: { ...m.ratings, [rId]: { ...(m.ratings?.[rId] || {}), [targetId]: r } } }); 
                                            return Promise.resolve(); 
                                        }} 
                                        onToggleRatingStatus={async (mid: number) => { 
                                            const m = matches.find(x => x.id === mid); 
                                            if(m) return saveDocument(selectedTeam.id, 'matches', mid.toString(), { ratingStatus: m.ratingStatus === 'OPEN' ? 'CLOSED' : 'OPEN' }); 
                                            return Promise.resolve(); 
                                        }} 
                                        onPlayerStatsChange={async (mid: number, pid: number, f: keyof PlayerMatchStatus, v: any) => saveDocument(selectedTeam.id, 'matches', mid.toString(), { playerStatuses: matches.find(x => x.id === mid)!.playerStatuses.map(s => s.playerId === pid ? { ...s, [f]: v } : s) })} 
                                        onOpponentScoreChange={async (mid: number, s: number) => saveDocument(selectedTeam.id, 'matches', mid.toString(), { opponentScore: s })} 
                                        teams={teams} 
                                        onGenerateTeams={async () => {setIsGeneratingTeams(true); setTeams(await generateTeamsAI(players, nextMatch || undefined)); setIsGeneratingTeams(false);}} 
                                        isAdmin={isAdmin} 
                                        isGeneratingTeams={isGeneratingTeams} 
                                        allMatches={matches} 
                                        onSelectMatch={setSelectedMatchId} 
                                        onDeleteMatch={(id: number) => deleteDocument(selectedTeam.id, 'matches', id.toString())} 
                                        onViewProfile={(p) => setSelectedPlayerForProfile(p)} 
                                    />
                                )}
                            </>
                        )}
                        {currentPage === 'fixture' && <FixturePage tournaments={tournaments} myTeam={myTeam} matches={matches} opponents={opponents} venues={venues} setCurrentPage={setCurrentPage} setSelectedMatchId={setSelectedMatchId} onOpenMatchForm={setMatchFormParams} onDeleteMatch={(id) => deleteDocument(selectedTeam.id, 'matches', id.toString())} isAdmin={isAdmin} />}
                        {currentPage === 'tournaments' && <TournamentsPage tournaments={tournaments} matches={matches} onAddTournament={(t) => saveDocument(selectedTeam.id, 'tournaments', Date.now().toString(), t)} onUpdateTournament={(t) => saveDocument(selectedTeam.id, 'tournaments', t.id.toString(), t)} onDeleteTournament={(id) => deleteDocument(selectedTeam.id, 'tournaments', id.toString())} onOpenMatchForm={setMatchFormParams} isAdmin={isAdmin} />}
                        {currentPage === 'venues' && <VenuesPage venues={venues} onAddVenue={(v) => saveDocument(selectedTeam.id, 'venues', Date.now().toString(), v)} onUpdateVenue={(v) => saveDocument(selectedTeam.id, 'venues', v.id.toString(), v)} onDeleteVenue={(id) => deleteDocument(selectedTeam.id, 'venues', id.toString())} isAdmin={isAdmin} />}
                        {currentPage === 'opponents' && <OpponentsPage opponents={opponents} onAddOpponent={(o) => saveDocument(selectedTeam.id, 'opponents', Date.now().toString(), o)} onUpdateOpponent={(o) => saveDocument(selectedTeam.id, 'opponents', o.id.toString(), o)} onDeleteOpponent={(id) => deleteDocument(selectedTeam.id, 'opponents', id.toString())} isAdmin={isAdmin} />}
                        {currentPage === 'my-team' && <MyTeamPage team={myTeam} onSave={(t) => saveDocument(selectedTeam.id, 'myTeam', 'info', t)} isAdmin={isAdmin} isSuperAdmin={currentUser?.id === appSettings.superAdminPlayerId} onTogglePinAuth={() => saveDocument(selectedTeam.id, 'settings', 'appSettings', { isPinAuthEnabled: !appSettings.isPinAuthEnabled })} isPinAuthEnabled={appSettings.isPinAuthEnabled} matches={matches} opponents={opponents} />}
                        {currentPage === 'logistics' && <LogisticsPage players={players} matches={matches} selectedMatchId={selectedMatchId || (nextMatch?.id || 0)} onUpdateLogistics={(mid, f, v) => saveDocument(selectedTeam.id, 'matches', mid.toString(), { [f]: v })} isAdmin={isAdmin} />}
                        {currentPage === 'statistics' && <StatisticsPage stats={globalPlayerStats} canViewRatings={true} onViewProfile={setSelectedPlayerForProfile} teamPenaltiesAgainst={matches.reduce((acc, m) => acc + (m.penaltiesAgainst || 0), 0)} matches={matches} currentUser={currentUser!} opponents={opponents} isAdmin={isAdmin} />}
                        {currentPage === 'treasury' && <TreasuryPage data={treasuryData} />}
                        {currentPage === 'third-half' && <ThirdHalfPage matches={matches} opponents={opponents} players={players} onUpdateThirdHalf={(mid, items, pids) => saveDocument(selectedTeam.id, 'matches', mid.toString(), { thirdHalf: { items, completedPayerIds: pids, totalSpent: items.reduce((a, b) => a + b.total, 0) } })} initialMatchId={selectedMatchId} />}
                        {currentPage === 'chat' && <div className="h-[calc(100vh-180px)]">{ChatComponent}</div>}
                        {currentPage === 'standings-photos' && <StandingsPhotosPage photos={standingsPhotos} onAddPhoto={(url) => saveDocument(selectedTeam.id, 'standingsPhotos', Date.now().toString(), { url, timestamp: Date.now(), uploadedBy: currentUser!.nickname })} onDeletePhoto={(id) => deleteDocument(selectedTeam.id, 'standingsPhotos', String(id))} isAdmin={isAdmin} />}
                        {currentPage === 'ratings' && <RatingsPage matches={matches} players={players} opponents={opponents} currentUser={currentUser!} onPlayerRatingChange={(mid, rId, targetId, r) => saveDocument(selectedTeam.id, 'matches', mid.toString(), { ratings: { ...matches.find(x => x.id === mid)!.ratings, [rId]: { ...(matches.find(x => x.id === mid)!.ratings?.[rId] || {}), [targetId]: r } } })} onFinishVoting={(mid) => saveDocument(selectedTeam.id, 'matches', mid.toString(), { finishedVoters: [...(matches.find(x => x.id === mid)!.finishedVoters || []), currentUser!.id] })} isAdmin={isAdmin} initialMatchId={selectedMatchId} />}
                        {currentPage === 'stopwatch' && <StopwatchPage />}
                        {currentPage === 'entertainment' && <EntertainmentPage players={players} currentUser={currentUser!} onSavePlayer={(p) => saveDocument(selectedTeam.id, 'players', p.id.toString(), p)} messages={messages} appSettings={appSettings} onUpdateSettings={(s) => saveDocument(selectedTeam.id, 'settings', 'appSettings', s)} onResetAllAttempts={() => Promise.resolve()} onResetScores={() => Promise.resolve()} isAdmin={isAdmin} myTeam={myTeam} opponents={opponents} />}
                        {currentPage === 'help' && <HelpPage isAdmin={isAdmin} onWipeFixture={() => {}} />}
                    </div>
                    {currentPage !== 'chat' && (
                        <div className="hidden lg:block lg:col-span-4">
                            <div className="sticky top-24 h-[calc(100vh-140px)]">
                                {ChatComponent}
                            </div>
                        </div>
                    )}
                </div>
            </main>

            {/* BOTÓN FLOTANTE DE CHAT */}
            {currentPage !== 'chat' && (
                <div 
                    style={{ 
                        bottom: `${bubblePos.y}px`, 
                        right: `${bubblePos.x}px`, 
                        touchAction: 'none' 
                    }}
                    className="fixed z-[99999] flex flex-col items-center pointer-events-none md:hidden"
                >
                    <div className="absolute inset-0 w-16 h-16 bg-emerald-500 rounded-full animate-ping opacity-40"></div>
                    
                    <button 
                        onPointerDown={handlePointerDown}
                        onPointerMove={handlePointerMove}
                        onPointerUp={handlePointerUp}
                        onClick={() => !isDragging.current && setCurrentPage('chat')}
                        className="pointer-events-auto relative w-16 h-16 bg-emerald-500 text-white rounded-full shadow-[0_12px_35px_rgba(16,185,129,0.6)] flex items-center justify-center border-4 border-white active:scale-95 transition-transform overflow-visible"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-8 h-8">
                            <path d="M4.913 2.658c2.326-.305 4.695-.451 7.087-.432 2.392-.019 4.761.127 7.087.432 1.944.254 3.413 1.944 3.413 3.9v6.024c0 1.956-1.469 3.646-3.413 3.9-2.326.305-4.695.451-7.087.432-2.392.019-4.761-.127-7.087-.432-2.392.019-4.761-.127-7.087-.432C2.969 16.252 1.5 14.562 1.5 12.606V6.558c0-1.956 1.469-3.646 3.413-3.9Z" />
                        </svg>
                        <div className="absolute top-0 right-0 w-4 h-4 bg-yellow-400 rounded-full border-2 border-emerald-500 animate-bounce"></div>
                    </button>
                    
                    <span className="mt-1 text-[10px] font-black text-emerald-700 dark:text-emerald-400 uppercase tracking-widest bg-white/90 dark:bg-black/80 px-2 py-0.5 rounded-full shadow-md border border-emerald-200 dark:border-emerald-900 pointer-events-none">CHAT LD</span>
                </div>
            )}

            {isRosterModalOpen && <RosterManagementModal players={players} onClose={() => setIsRosterModalOpen(false)} onAddPlayer={(p) => saveDocument(selectedTeam.id, 'players', (players.reduce((m, x) => Math.max(m, x.id), 0) + 1).toString(), p)} onUpdatePlayer={(p) => saveDocument(selectedTeam.id, 'players', p.id.toString(), p)} onDeletePlayer={(id) => deleteDocument(selectedTeam.id, 'players', id.toString())} onViewProfile={setSelectedPlayerForProfile} isCurrentUserSuperAdmin={currentUser?.id === appSettings.superAdminPlayerId} superAdminPlayerId={appSettings.superAdminPlayerId} onTransferSuperAdmin={(id) => saveDocument(selectedTeam.id, 'settings', 'appSettings', {superAdminPlayerId: id})} onToggleSubAdmin={(pid) => { const p = players.find(x => x.id === pid); if(p) return saveDocument(selectedTeam.id, 'players', pid.toString(), {...p, isSubAdmin: !p.isSubAdmin}); return Promise.resolve(); }} />}
            {selectedPlayerForProfile && <PlayerProfileModal player={selectedPlayerForProfile} matches={matches} opponents={opponents} onClose={() => setSelectedPlayerForProfile(null)} />}
            {matchFormParams && <MatchForm match={matchFormParams.match} tournamentId={matchFormParams.tournamentId} allMatches={matches} onSave={(d) => saveDocument(selectedTeam.id, 'matches', (d as any).id?.toString() || (matches.reduce((m, x) => Math.max(m, x.id), 0) + 1).toString(), { ...d, playerStatuses: (d as any).playerStatuses || players.map(p => ({ playerId: p.id, attendanceStatus: AttendanceStatus.PENDING, paymentStatus: PaymentStatus.UNPAID, amountPaid: 0, quartersPlayed: 4 })), ratingStatus: (d as any).ratingStatus || 'CLOSED' })} onCancel={() => setMatchFormParams(null)} venues={venues} opponents={opponents} />}
            {isEditProfileOpen && <div className="fixed inset-0 bg-black/70 flex justify-center items-center z-[100] p-4"><div className="bg-white dark:bg-gray-800 p-6 rounded-xl w-full max-w-lg overflow-y-auto max-h-[90vh]"><PlayerForm player={currentUser} onSave={(p) => { saveDocument(selectedTeam.id, 'players', currentUser!.id.toString(), p); setCurrentUser(p as Player); setIsEditProfileOpen(false); }} onCancel={() => setIsEditProfileOpen(false)} /></div></div>}
        </div>
    );
};

export default App;