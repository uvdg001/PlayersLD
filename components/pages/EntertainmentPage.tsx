
import React, { useState, Suspense } from 'react';
import type { Player, ChatMessage, AppSettings, MyTeam, Opponent } from '../../types.ts';
import { useToast } from '../../hooks/useToast.ts';
import { GAME_CATALOG, GameCatalogItem } from '../../constants.ts';

interface EntertainmentPageProps {
    players: Player[];
    currentUser: Player;
    onSavePlayer: (player: Player) => Promise<void>;
    messages: ChatMessage[];
    appSettings: AppSettings;
    onUpdateSettings: (settings: Partial<AppSettings>) => void;
    onResetAllAttempts: () => Promise<void>;
    onResetScores: () => Promise<void>;
    isAdmin: boolean;
    myTeam: MyTeam | null;
    opponents: Opponent[];
}

type GameState = 'NONE' | 'PLAYING';

export const EntertainmentPage: React.FC<EntertainmentPageProps> = ({ 
    players, 
    currentUser, 
    onSavePlayer, 
    messages, 
    appSettings,
    onUpdateSettings,
    onResetAllAttempts,
    onResetScores,
    isAdmin,
    myTeam,
    opponents
}) => {
    const toast = useToast();
    const [gameState, setGameState] = useState<GameState>('NONE');
    const [activeGameId, setActiveGameId] = useState<string | null>(null);
    const [showResult, setShowResult] = useState<boolean>(false);
    const [earnedPoints, setEarnedPoints] = useState(0);
    const [showAdminPanel, setShowAdminPanel] = useState(false);
    const [isMuted, setIsMuted] = useState(() => localStorage.getItem('arcade_muted') === 'true');
    
    const [adminStartTime, setAdminStartTime] = useState(appSettings.arcadeStartTime || "00:00");
    const [adminEndTime, setAdminEndTime] = useState(appSettings.arcadeEndTime || "23:59");
    const [adminMaxAttempts, setAdminMaxAttempts] = useState(appSettings.arcadeMaxAttempts || 5);
    const [hiddenGameIds, setHiddenGameIds] = useState<string[]>(appSettings.hiddenGameIds || []);

    const isArcadeOpen = () => {
        if (isAdmin) return true;
        const now = new Date();
        const currentTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
        return currentTime >= adminStartTime && currentTime <= adminEndTime;
    };

    const canPlayToday = () => {
        const today = new Date().toISOString().split('T')[0];
        if (currentUser.lastGameDate !== today) return true;
        const attempts = currentUser.dailyGameAttempts || 0;
        return attempts < adminMaxAttempts;
    };

    const toggleMute = () => {
        const newVal = !isMuted;
        setIsMuted(newVal);
        localStorage.setItem('arcade_muted', String(newVal));
    };

    const startSelectedGame = (gameId: string) => {
        if (!isArcadeOpen()) {
            toast.error(`🕒 Arcade cerrado: ${adminStartTime} a ${adminEndTime}`);
            return;
        }
        if (!canPlayToday() && !isAdmin) {
            toast.warning(`⛔ Agotaste tus ${adminMaxAttempts} intentos de hoy.`);
            return;
        }

        setActiveGameId(gameId);
        setGameState('PLAYING');
        setShowResult(false);
    };

    const endGame = async (score: number) => {
        setEarnedPoints(score);
        setGameState('NONE');
        setShowResult(true);

        const today = new Date().toISOString().split('T')[0];
        let attempts = currentUser.dailyGameAttempts || 0;
        if (currentUser.lastGameDate !== today) attempts = 0;
        
        await onSavePlayer({
            ...currentUser,
            gamePoints: (currentUser.gamePoints || 0) + score,
            lastGameDate: today,
            dailyGameAttempts: attempts + 1
        });
    };

    const handleResetAttempts = async () => {
        if (window.confirm("⚠️ ¿RESETEAR VIDAS?\nEsto permitirá que todos vuelvan a jugar hoy mismo.")) {
            await onResetAllAttempts();
            toast.success("Vidas reiniciadas");
        }
    };

    const handleResetScores = async () => {
        if (window.confirm("🚨 ¡ATENCIÓN!\n¿Deseas resetear los CRÉDITOS ARCADE de todos los jugadores?")) {
            await onResetScores();
            toast.success("¡Créditos Arcade reseteados!");
        }
    };

    const toggleGameVisibility = (gameId: string) => {
        const newHidden = hiddenGameIds.includes(gameId)
            ? hiddenGameIds.filter(id => id !== gameId)
            : [...hiddenGameIds, gameId];
        setHiddenGameIds(newHidden);
    };

    const activeGame = GAME_CATALOG.find(g => g.id === activeGameId);
    const ActiveGameComponent = activeGame?.component;
    const attemptsUsed = currentUser.dailyGameAttempts || 0;
    const remainingLives = Math.max(0, adminMaxAttempts - attemptsUsed);

    const visibleGames = GAME_CATALOG.filter(g => !hiddenGameIds.includes(g.id));

    return (
        <div className="bg-gray-900 text-white min-h-screen p-4 pb-24">
            <div className="flex justify-between items-center mb-8 border-b border-gray-700 pb-4">
                <div className="flex items-center gap-4">
                    <h2 className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-600 italic tracking-tighter uppercase">Arcade Players</h2>
                    <button 
                        onClick={toggleMute}
                        className={`p-2 rounded-xl border transition-all ${isMuted ? 'bg-red-500/20 border-red-500 text-red-500' : 'bg-green-500/20 border-green-500 text-green-500'}`}
                        title={isMuted ? "Activar Sonido" : "Silenciar"}
                    >
                        {isMuted ? '🔇' : '🔊'}
                    </button>
                </div>
                <div className="flex gap-4 items-center">
                    <div className="text-center px-3 py-1 bg-gray-800 rounded-xl border border-gray-700">
                        <p className="text-[8px] text-gray-500 font-black uppercase">Vidas</p>
                        <p className={`text-sm font-black ${remainingLives === 0 ? 'text-red-500' : 'text-green-400'}`}>{remainingLives}/{adminMaxAttempts}</p>
                    </div>
                    <div className="text-right">
                        <p className="text-[10px] text-gray-400 font-black uppercase">Créditos</p>
                        <p className="text-2xl font-black text-yellow-400 leading-none">{currentUser.gamePoints || 0}</p>
                    </div>
                </div>
            </div>

            {isAdmin && gameState === 'NONE' && !showResult && (
                <div className="mb-6">
                    <button onClick={() => setShowAdminPanel(!showAdminPanel)} className="w-full py-3 bg-indigo-600/20 border-2 border-indigo-500/50 rounded-2xl text-[11px] font-black uppercase text-indigo-400 flex items-center justify-center gap-2 hover:bg-indigo-600/30 transition-all">
                        {showAdminPanel ? '🔼 Cerrar Herramientas' : '⚙️ Configurar Sala (Solo Admin)'}
                    </button>
                    {showAdminPanel && (
                        <div className="bg-gray-800 p-6 rounded-3xl mt-3 border-2 border-indigo-500/30 space-y-6 animate-fadeIn shadow-2xl">
                            <div className="grid grid-cols-2 gap-4">
                                <div><label className="text-[10px] uppercase font-bold text-gray-500">Abre</label><input type="time" value={adminStartTime} onChange={e => setAdminStartTime(e.target.value)} className="w-full bg-gray-700 p-2 rounded-xl" /></div>
                                <div><label className="text-[10px] uppercase font-bold text-gray-500">Cierra</label><input type="time" value={adminEndTime} onChange={e => setAdminEndTime(e.target.value)} className="w-full bg-gray-700 p-2 rounded-xl" /></div>
                            </div>
                            
                            <div>
                                <label className="text-[10px] uppercase font-bold text-gray-500">Vidas por día</label>
                                <input type="number" value={adminMaxAttempts} onChange={e => setAdminMaxAttempts(parseInt(e.target.value))} className="w-full bg-gray-700 p-3 rounded-xl font-black" />
                            </div>

                            <div className="pt-4 border-t border-gray-700">
                                <label className="text-[10px] uppercase font-bold text-gray-400 block mb-3">Gestionar Visibilidad de Juegos</label>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                    {GAME_CATALOG.map(game => {
                                        const isHidden = hiddenGameIds.includes(game.id);
                                        return (
                                            <div key={game.id} className="flex items-center justify-between p-2 bg-gray-900/50 rounded-xl border border-gray-700">
                                                <div className="flex items-center gap-2">
                                                    <span className="text-sm">{game.icon}</span>
                                                    <span className="text-[10px] font-bold truncate max-w-[100px]">{game.title}</span>
                                                </div>
                                                <button 
                                                    onClick={() => toggleGameVisibility(game.id)}
                                                    className={`px-2 py-1 rounded-lg text-[8px] font-black uppercase transition-all ${isHidden ? 'bg-red-500/20 text-red-400 border border-red-500/30' : 'bg-green-500/20 text-green-400 border border-green-500/30'}`}
                                                >
                                                    {isHidden ? 'Oculto' : 'Visible'}
                                                </button>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>

                            <button onClick={() => { onUpdateSettings({ arcadeStartTime: adminStartTime, arcadeEndTime: adminEndTime, arcadeMaxAttempts: adminMaxAttempts, hiddenGameIds: hiddenGameIds }); setShowAdminPanel(false); toast.success("Guardado"); }} className="w-full bg-indigo-600 py-3 rounded-xl font-black uppercase text-xs">Guardar Configuración</button>

                            <div className="pt-4 border-t border-gray-700 grid grid-cols-2 gap-3">
                                <button onClick={handleResetAttempts} className="bg-orange-950/40 text-orange-400 border-2 border-orange-900/50 text-[10px] py-3 rounded-xl font-black uppercase">Limpiar Vidas</button>
                                <button onClick={handleResetScores} className="bg-red-950/40 text-red-400 border-2 border-red-900/50 text-[10px] py-3 rounded-xl font-black uppercase">Borrar Créditos</button>
                            </div>
                        </div>
                    )}
                </div>
            )}

            {gameState === 'NONE' && !showResult && (
                <div className="space-y-6 animate-fadeIn">
                    <p className="text-[10px] font-black text-gray-500 uppercase tracking-[0.3em] mb-2">Selecciona un entrenamiento:</p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {visibleGames.length > 0 ? visibleGames.map((game: GameCatalogItem) => (
                            <button 
                                key={game.id} 
                                onClick={() => startSelectedGame(game.id)} 
                                className={`relative overflow-hidden bg-gradient-to-br ${game.color} p-6 rounded-[2rem] border-4 border-white/10 shadow-lg group transition-all active:scale-95 text-left flex flex-col justify-end min-h-[140px]`}
                            >
                                <div className="absolute -right-4 -top-4 text-8xl opacity-10 group-hover:scale-110 group-hover:rotate-12 transition-transform">{game.icon}</div>
                                <h3 className="text-2xl font-black italic uppercase tracking-tighter mb-1 relative z-10">{game.title}</h3>
                                <p className="text-white/80 text-[10px] font-bold uppercase tracking-widest relative z-10">{game.description}</p>
                            </button>
                        )) : (
                            <div className="col-span-full py-12 text-center bg-gray-800/50 rounded-3xl border-2 border-dashed border-gray-700">
                                <p className="text-gray-400 italic">Sala de juegos vacía.</p>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {gameState === 'PLAYING' && ActiveGameComponent && (
                <Suspense fallback={<div className="h-[400px] flex items-center justify-center font-black animate-pulse text-indigo-500">PREPARANDO CANCHA...</div>}>
                    <ActiveGameComponent 
                        players={players} 
                        myTeam={myTeam} 
                        opponents={opponents} 
                        messages={messages}
                        mode={activeGame?.triviaMode}
                        onFinish={endGame} 
                        muted={isMuted}
                    />
                </Suspense>
            )}

            {showResult && (
                <div className="flex flex-col items-center justify-center min-h-[65vh] text-center animate-bounce-in">
                    <div className="text-9xl mb-4 filter drop-shadow-2xl">{earnedPoints > 0 ? '🏆' : '⚽'}</div>
                    <h2 className="text-6xl font-black mb-2 italic uppercase tracking-tighter text-yellow-400">
                        {earnedPoints > 0 ? '¡GRAN ENTRENAMIENTO!' : '¡A SEGUIR PRACTICANDO!'}
                    </h2>
                    <p className="text-gray-400 text-xl font-bold mb-10">
                        Sumaste <span className="text-white text-4xl">+{earnedPoints}</span> créditos.
                    </p>
                    <button 
                        onClick={() => setShowResult(false)} 
                        className="px-16 py-6 bg-white text-indigo-950 font-black rounded-[2rem] uppercase tracking-widest shadow-2xl transition-transform hover:scale-105 active:scale-95"
                    >
                        Volver a la Sala
                    </button>
                </div>
            )}
        </div>
    );
};
