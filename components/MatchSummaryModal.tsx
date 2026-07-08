import React from 'react';
import type { Match, Player, Opponent } from '../types.ts';
import { AttendanceStatus } from '../types.ts';

interface MatchSummaryModalProps {
    match: Match;
    players: Player[];
    opponent: Opponent | undefined;
    onClose: () => void;
    onVoteClick?: () => void;
    onChatClick?: () => void;
    onAdminClick?: () => void;
    isAdmin?: boolean;
}

export const MatchSummaryModal: React.FC<MatchSummaryModalProps> = ({ match, players, opponent, onClose, onVoteClick, onChatClick, onAdminClick, isAdmin }) => {
    const [view, setView] = React.useState<'MENU' | 'REPORT' | 'CHAT'>('MENU');

    const playedPlayers = match.playerStatuses
        .filter(ps => ps.attendanceStatus === AttendanceStatus.CONFIRMED && (ps.quartersPlayed || 0) > 0)
        .map(ps => {
            const p = players.find(x => x.id === ps.playerId);
            return { ...p, status: ps };
        });

    const goalScorers = playedPlayers.filter(p => 
        (p.status.goalsPlay || 0) > 0 || 
        (p.status.goalsHeader || 0) > 0 || 
        (p.status.goalsPenalty || 0) > 0 || 
        (p.status.goalsSetPiece || 0) > 0 ||
        (p.status.goals || 0) > 0
    );

    const bloopers = playedPlayers.filter(p => 
        (p.status.majorErrors || 0) > 0 || 
        (p.status.penaltiesMissed || 0) > 0 ||
        (p.status.ownGoals || 0) > 0
    );

    return (
        <div className="fixed inset-0 bg-black/90 flex justify-center items-center z-[100] p-4 animate-fadeIn" onClick={onClose}>
            <div className="bg-white dark:bg-gray-900 rounded-[2.5rem] w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden shadow-2xl border-4 border-indigo-500/20" onClick={e => e.stopPropagation()}>
                
                {/* HEADER: EL MARCADOR REPETIDO PERO ESTILIZADO */}
                <div className="bg-gray-950 p-8 text-white text-center relative">
                    <button onClick={onClose} className="absolute top-6 right-6 text-gray-400 hover:text-white text-2xl">✕</button>
                    
                    <p className="text-indigo-400 font-black uppercase tracking-[0.3em] text-[10px] mb-4">Resumen de Partido</p>
                    
                    <div className="flex items-center justify-center gap-6 mb-4">
                        <div className="text-center flex-1">
                            <p className="text-sm font-black uppercase truncate italic">NUESTRO CLUB</p>
                        </div>
                        <div className="flex items-center gap-4 bg-white/5 px-6 py-2 rounded-2xl border border-white/10">
                            <span className="text-6xl font-black italic">{match.playerStatuses.reduce((t, ps) => t + (ps.goalsPlay||0) + (ps.goalsHeader||0) + (ps.goalsPenalty||0) + (ps.goalsSetPiece||0) + (ps.goals||0), 0)}</span>
                            <span className="text-gray-600 text-4xl font-black">-</span>
                            <span className="text-6xl font-black italic text-red-500">{match.opponentScore || 0}</span>
                        </div>
                        <div className="text-center flex-1">
                            <p className="text-sm font-black uppercase truncate italic">{opponent?.name || 'Rival'}</p>
                        </div>
                    </div>

                    <div className="flex flex-wrap justify-center gap-4 text-[10px] font-bold uppercase text-gray-400">
                        <span className="bg-white/10 px-3 py-1 rounded-full text-white">🗓️ {match.date}</span>
                        <span className="bg-white/10 px-3 py-1 rounded-full text-white">🏆 FECHA #{match.tournamentRound || 1}</span>
                        <span className="bg-white/10 px-3 py-1 rounded-full text-white">📍 {match.location}</span>
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto p-6 space-y-8 bg-gray-50 dark:bg-gray-900">
                    
                    {view === 'MENU' && (
                        <div className="grid grid-cols-1 gap-4 py-4 animate-fadeIn">
                            <button 
                                onClick={() => setView('REPORT')}
                                className="bg-gradient-to-r from-indigo-600 to-blue-600 p-6 rounded-3xl text-white shadow-lg flex items-center justify-between group active:scale-95 transition-all"
                            >
                                <div className="text-left">
                                    <p className="text-[10px] font-black uppercase opacity-70 tracking-widest">Estadísticas</p>
                                    <h4 className="text-xl font-black italic uppercase tracking-tighter">Informe de Goles</h4>
                                </div>
                                <span className="text-4xl group-hover:rotate-12 transition-transform">⚽</span>
                            </button>

                            {match.ratingStatus === 'OPEN' && (
                                <button 
                                    onClick={onVoteClick}
                                    className="bg-gradient-to-r from-yellow-400 to-amber-500 p-6 rounded-3xl text-yellow-950 shadow-lg flex items-center justify-between group active:scale-95 transition-all"
                                >
                                    <div className="text-left">
                                        <p className="text-[10px] font-black uppercase opacity-70 tracking-widest">La Urna</p>
                                        <h4 className="text-xl font-black italic uppercase tracking-tighter">Calificarcompañeros</h4>
                                    </div>
                                    <span className="text-4xl group-hover:scale-110 transition-transform">⭐</span>
                                </button>
                            )}

                            <button 
                                onClick={onChatClick}
                                className="bg-stone-200 dark:bg-stone-800 p-6 rounded-3xl text-stone-800 dark:text-stone-200 shadow-lg flex items-center justify-between group active:scale-95 transition-all border border-stone-300 dark:border-stone-700"
                            >
                                <div className="text-left">
                                    <p className="text-[10px] font-black uppercase opacity-70 tracking-widest">Archivo</p>
                                    <h4 className="text-xl font-black italic uppercase tracking-tighter">Chat de la Fecha</h4>
                                </div>
                                <span className="text-4xl group-hover:-rotate-12 transition-transform">💬</span>
                            </button>

                            {isAdmin && (
                                <button 
                                    onClick={onAdminClick}
                                    className="bg-gradient-to-r from-gray-800 to-gray-950 p-6 rounded-3xl text-white shadow-lg flex items-center justify-between group active:scale-95 transition-all border-2 border-gray-700"
                                >
                                    <div className="text-left">
                                        <p className="text-[10px] font-black uppercase opacity-70 tracking-widest text-indigo-400">Seguridad</p>
                                        <h4 className="text-xl font-black italic uppercase tracking-tighter">Gestión de Datos</h4>
                                    </div>
                                    <span className="text-4xl group-hover:scale-110 transition-transform">🛠️</span>
                                </button>
                            )}
                        </div>
                    )}

                    {view === 'REPORT' && (
                        <div className="space-y-8 animate-fadeIn">
                            <button onClick={() => setView('MENU')} className="text-indigo-600 font-black text-xs uppercase tracking-widest flex items-center gap-1">← Volver al Menú</button>
                            
                            {/* SECCIÓN GOLES */}
                            <div>
                                <h3 className="text-xs font-black uppercase tracking-widest text-indigo-600 dark:text-indigo-400 mb-4 flex items-center gap-2">
                                    <span className="text-xl">⚽</span> ARTILLERÍA Y GOLEADORES
                                </h3>
                                {goalScorers.length > 0 ? (
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                        {goalScorers.map(p => (
                                            <div key={p.id} className="flex items-center justify-between bg-white dark:bg-gray-800 p-3 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700">
                                                <div className="flex items-center gap-3">
                                                    <img src={p.photoUrl} className="w-10 h-10 rounded-full object-cover" alt="" />
                                                    <span className="font-black text-sm uppercase">{p.nickname}</span>
                                                </div>
                                                                                        <div className="flex gap-1">
                                                                                            {Array(p.status.goalsPlay || 0).fill(0).map((_, i) => <span key={`p-${i}`} title="Jugada">⚽</span>)}
                                                                                            {Array(p.status.goalsHeader || 0).fill(0).map((_, i) => <span key={`h-${i}`} title="Cabeza">🧠</span>)}
                                                                                            {Array(p.status.goalsPenalty || 0).fill(0).map((_, i) => <span key={`pe-${i}`} title="Penal">🎯</span>)}
                                                                                            {Array(p.status.goalsSetPiece || 0).fill(0).map((_, i) => <span key={`s-${i}`} title="T. Libre">👟</span>)}
                                                                                            {Array(p.status.goals || 0).fill(0).map((_, i) => <span key={`g-${i}`} title="Goleador">⚽</span>)}
                                                                                            {/* Asistencias */}
                                                                                            {Array(p.status.assists || 0).fill(0).map((_, i) => <span key={`a-${i}`} className="text-indigo-500 font-black" title="Asistencia">🅰️</span>)}
                                                                                        </div>
                                                
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <p className="text-center py-4 text-gray-400 italic text-sm">No se registraron goles propios.</p>
                                )}
                            </div>

                            {/* SECCIÓN BLOOPERS */}
                            {bloopers.length > 0 && (
                                <div className="bg-red-50 dark:bg-red-950/20 p-5 rounded-[2rem] border border-red-100 dark:border-red-900/30">
                                    <h3 className="text-xs font-black uppercase tracking-widest text-red-600 mb-4 flex items-center gap-2">
                                        <span className="text-xl">🤦</span> ZONA DE BLOOPERS Y ERRORES
                                    </h3>
                                    <div className="space-y-2">
                                        {bloopers.map(p => (
                                            <div key={p.id} className="flex items-center justify-between text-sm">
                                                <span className="font-bold dark:text-gray-300">{p.nickname}</span>
                                                <div className="flex gap-2">
                                                    {Array(p.status.majorErrors || 0).fill(0).map((_, i) => <span key={i} className="bg-red-100 text-red-600 px-2 py-0.5 rounded-full text-[10px] font-black">ERROR GRAVE</span>)}
                                                    {Array(p.status.penaltiesMissed || 0).fill(0).map((_, i) => <span key={i} className="bg-orange-100 text-orange-600 px-2 py-0.5 rounded-full text-[10px] font-black">PENAL ERRADO</span>)}
                                                    {Array(p.status.ownGoals || 0).fill(0).map((_, i) => <span key={i} className="bg-black text-white px-2 py-0.5 rounded-full text-[10px] font-black">GOL EN CONTRA</span>)}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* SECCIÓN PLANTILLA */}
                            <div>
                                <h3 className="text-xs font-black uppercase tracking-widest text-gray-500 mb-4 flex items-center gap-2">
                                    <span className="text-xl">🏃</span> JUGADORES (MIN. 1/4)
                                </h3>
                                <div className="flex flex-wrap gap-2">
                                    {playedPlayers.map(p => (
                                        <div key={p.id} className="bg-white dark:bg-gray-800 px-4 py-2 rounded-xl border border-gray-200 dark:border-gray-700 text-xs font-bold shadow-sm">
                                            {p.nickname} <span className="text-gray-400 ml-1">{p.status.quartersPlayed}/4</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}

                </div>

                <div className="p-6 bg-white dark:bg-gray-800 border-t dark:border-gray-700 text-center">
                    <button 
                        onClick={onClose}
                        className="px-10 py-3 bg-indigo-600 text-white font-black rounded-2xl shadow-lg hover:bg-indigo-700 transition-all uppercase italic tracking-tighter text-sm"
                    >
                        Entendido
                    </button>
                </div>
            </div>
        </div>
    );
};
