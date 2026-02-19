
import React, { useState, useMemo } from 'react';
import type { Match, Player, Opponent } from '../../types.ts';
import { AttendanceStatus } from '../../types.ts';

interface CourtPaymentPageProps {
    matches: Match[];
    players: Player[];
    opponents: Opponent[];
    onUpdatePayment: (matchId: number, playerId: number, amount: number) => void;
}

export const CourtPaymentPage: React.FC<CourtPaymentPageProps> = ({ matches, players, opponents, onUpdatePayment }) => {
    const [selectedMatchId, setSelectedMatchId] = useState<number | null>(null);

    const activeMatches = useMemo(() => {
        return [...matches].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, 10);
    }, [matches]);

    const selectedMatch = matches.find(m => m.id === selectedMatchId);

    const confirmedPlayers = useMemo(() => {
        if (!selectedMatch) return [];
        return players.filter(p => selectedMatch.playerStatuses.some(ps => ps.playerId === p.id && ps.attendanceStatus === AttendanceStatus.CONFIRMED));
    }, [selectedMatch, players]);

    const confirmedCount = confirmedPlayers.length;
    const fairShare = selectedMatch && confirmedCount > 0 ? selectedMatch.courtFee / confirmedCount : 0;
    
    const totalCollected = useMemo(() => {
        if (!selectedMatch) return 0;
        return selectedMatch.playerStatuses.reduce((acc, ps) => acc + (ps.amountPaid || 0), 0);
    }, [selectedMatch]);

    const formatter = new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', maximumFractionDigits: 0 });

    const handleShareWhatsApp = () => {
        if (!selectedMatch) return;
        const oppName = opponents.find(o => o.id === selectedMatch.opponentId)?.name || 'Rival';
        
        let text = `*🏟️ RECAUDACIÓN CANCHA: vs ${oppName}*\n`;
        text += `🗓️ ${selectedMatch.date}\n`;
        text += `--------------------------\n`;
        text += `💰 *VALOR TOTAL:* ${formatter.format(selectedMatch.courtFee)}\n`;
        text += `👥 *CONFIRMADOS:* ${confirmedCount}\n`;
        text += `⚡ *PAGO JUSTO:* ${formatter.format(fairShare)}\n`;
        text += `--------------------------\n\n`;
        
        const paidList = confirmedPlayers.filter(p => (selectedMatch.playerStatuses.find(s => s.playerId === p.id)?.amountPaid || 0) >= (fairShare - 5));
        const unpaidList = confirmedPlayers.filter(p => (selectedMatch.playerStatuses.find(s => s.playerId === p.id)?.amountPaid || 0) < (fairShare - 5));

        if (paidList.length > 0) {
            text += `✅ *PAGARON:*\n`;
            paidList.forEach(p => text += `- ${p.nickname}\n`);
            text += `\n`;
        }

        if (unpaidList.length > 0) {
            text += `❌ *PENDIENTES:*\n`;
            unpaidList.forEach(p => {
                const paid = selectedMatch.playerStatuses.find(s => s.playerId === p.id)?.amountPaid || 0;
                text += `- ${p.nickname} (Puso: ${formatter.format(paid)})\n`;
            });
            text += `\n`;
        }

        text += `📊 *ESTADO:* ${totalCollected >= selectedMatch.courtFee ? '¡CUENTA CUBIERTA! 🎉' : `Faltan ${formatter.format(selectedMatch.courtFee - totalCollected)}`}`;

        // PROTOCOLO DIRECTO PARA SALTAR PÁGINA INTERMEDIA
        window.location.href = `whatsapp://send?text=${encodeURIComponent(text)}`;
    };

    if (!selectedMatchId || !selectedMatch) {
        return (
            <div className="bg-white dark:bg-gray-800 rounded-[3rem] shadow-2xl p-8 min-h-[60vh] border-t-8 border-emerald-500 animate-fadeIn">
                <h2 className="text-8xl font-black text-center text-gray-800 dark:text-gray-100 mb-2 uppercase italic tracking-tighter leading-none">Cancha</h2>
                <p className="text-center text-gray-400 font-bold uppercase text-xs tracking-[0.3em] mb-10">Gestión de recaudación por partido</p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {activeMatches.map(m => {
                        const opp = opponents.find(o => o.id === m.opponentId)?.name || 'Rival';
                        const collected = m.playerStatuses.reduce((acc, ps) => acc + (ps.amountPaid || 0), 0);
                        const isCovered = collected >= m.courtFee && m.courtFee > 0;
                        
                        return (
                            <button key={m.id} onClick={() => setSelectedMatchId(m.id)} className={`p-6 rounded-3xl border-4 text-left transition-all active:scale-95 flex justify-between items-center ${isCovered ? 'bg-emerald-50 border-emerald-200' : 'bg-gray-50 border-gray-100 dark:bg-gray-700/50'}`}>
                                <div>
                                    <p className="text-[10px] font-black text-gray-400 uppercase">{m.date}</p>
                                    <h3 className="font-black text-xl text-gray-800 dark:text-white italic uppercase">vs {opp}</h3>
                                </div>
                                <div className="text-right">
                                    <p className="text-xs font-black text-emerald-600">{formatter.format(collected)}</p>
                                    <p className="text-[9px] font-bold text-gray-400 uppercase">Recaudado</p>
                                </div>
                            </button>
                        );
                    })}
                </div>
            </div>
        );
    }

    return (
        <div className="bg-white dark:bg-gray-800 rounded-[3rem] shadow-2xl p-4 md:p-10 border-t-8 border-emerald-500 animate-fadeIn">
            <div className="flex justify-between items-center mb-8">
                <button onClick={() => setSelectedMatchId(null)} className="font-black text-xs text-gray-400 hover:text-emerald-600 uppercase tracking-widest flex items-center gap-2">
                    ← Elegir otro partido
                </button>
                <button 
                    onClick={handleShareWhatsApp}
                    className="bg-green-600 text-white px-5 py-3 rounded-2xl font-black text-[12px] uppercase tracking-tighter shadow-xl active:scale-95 flex items-center gap-2"
                >
                    <span>📱</span> ENVIAR AL GRUPO
                </button>
            </div>

            <div className="flex flex-col lg:flex-row gap-8">
                {/* RESUMEN DE COSTOS */}
                <div className="flex-1 space-y-6">
                    <div className="bg-emerald-950 p-8 rounded-[2.5rem] text-white shadow-2xl relative overflow-hidden">
                        <div className="absolute -right-10 -bottom-10 text-[10rem] opacity-10">🏟️</div>
                        <div className="relative z-10">
                            <p className="text-xs font-black text-emerald-400 uppercase tracking-widest mb-2">Costo Total de la Cancha</p>
                            <h3 className="text-7xl font-black italic uppercase tracking-tighter leading-none mb-6">{formatter.format(selectedMatch.courtFee)}</h3>
                            
                            <div className="grid grid-cols-2 gap-4 pt-6 border-t border-white/10">
                                <div>
                                    <p className="text-[9px] font-bold text-emerald-500 uppercase">Pago Justo</p>
                                    <p className="text-4xl font-black">{formatter.format(fairShare)}</p>
                                </div>
                                <div className="text-right">
                                    <p className="text-[9px] font-bold text-emerald-500 uppercase">Confirmados</p>
                                    <p className="text-4xl font-black">{confirmedCount} <span className="text-sm font-normal opacity-50">pers.</span></p>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className={`p-6 rounded-[2rem] border-4 flex justify-between items-center ${totalCollected >= selectedMatch.courtFee ? 'bg-emerald-50 border-emerald-500/30' : 'bg-red-50 border-red-500/30'}`}>
                        <div>
                            <p className="text-[10px] font-black uppercase text-gray-500">Balance Actual</p>
                            <p className={`text-5xl font-black ${totalCollected >= selectedMatch.courtFee ? 'text-emerald-600' : 'text-red-600'}`}>
                                {formatter.format(totalCollected - selectedMatch.courtFee)}
                            </p>
                        </div>
                        <div className="text-right">
                            <p className="text-[10px] font-black uppercase text-gray-500">Total Recaudado</p>
                            <p className="text-3xl font-black text-gray-800 dark:text-white">{formatter.format(totalCollected)}</p>
                        </div>
                    </div>
                </div>

                {/* LISTA DE PAGADORES */}
                <div className="lg:w-96 space-y-6">
                    <div className="bg-gray-50 dark:bg-gray-900 rounded-[2.5rem] p-6 border-2 border-gray-100 dark:border-gray-800">
                        <h3 className="font-black uppercase tracking-tighter text-xl mb-6 text-gray-800 dark:text-white flex items-center gap-2">
                            <span>💳</span> Lista de Cobro
                        </h3>
                        
                        <div className="space-y-4 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">
                            {confirmedPlayers.map(p => {
                                const status = selectedMatch.playerStatuses.find(s => s.playerId === p.id);
                                const paidAmount = status?.amountPaid || 0;
                                const isFairPaid = paidAmount >= (fairShare - 5);

                                return (
                                    <div key={p.id} className={`p-4 rounded-3xl border-2 transition-all bg-white dark:bg-gray-800 ${isFairPaid ? 'border-emerald-500 shadow-md scale-[1.02]' : 'border-gray-100 dark:border-gray-700'}`}>
                                        <div className="flex items-center justify-between mb-3">
                                            <div className="flex items-center gap-3">
                                                <img src={p.photoUrl} className={`w-12 h-12 rounded-full object-cover border-2 ${isFairPaid ? 'border-emerald-500' : 'border-gray-300'}`} alt="" />
                                                <div className="text-left">
                                                    <p className="font-black text-sm uppercase text-gray-800 dark:text-gray-100 leading-none">{p.nickname}</p>
                                                    <p className={`text-[9px] font-bold uppercase mt-1 ${isFairPaid ? 'text-emerald-500' : 'text-gray-400'}`}>
                                                        {paidAmount === 0 ? 'Pendiente' : isFairPaid ? 'Pagó Todo ✅' : 'Incompleto'}
                                                    </p>
                                                </div>
                                            </div>
                                            {!isFairPaid && (
                                                <button 
                                                    onClick={() => onUpdatePayment(selectedMatch.id, p.id, Math.round(fairShare))} 
                                                    className="bg-emerald-600 text-white text-[9px] font-black px-3 py-2 rounded-xl uppercase tracking-tighter shadow-lg active:scale-90"
                                                >
                                                    Pago Justo ⚡
                                                </button>
                                            )}
                                        </div>
                                        
                                        <div className="flex items-center gap-2 bg-gray-50 dark:bg-gray-950 p-3 rounded-2xl border-2 border-dashed border-gray-200 dark:border-gray-700">
                                            <span className="text-xl font-black text-gray-400">$</span>
                                            <input 
                                                type="number" 
                                                value={paidAmount || ''}
                                                placeholder="¿Cuánto puso?"
                                                onChange={(e) => onUpdatePayment(selectedMatch.id, p.id, parseFloat(e.target.value) || 0)}
                                                className="w-full bg-transparent font-black text-xl text-emerald-600 outline-none"
                                            />
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
