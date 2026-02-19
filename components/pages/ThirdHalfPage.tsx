
import React, { useState, useEffect, useMemo, useRef } from 'react';
import type { Match, ThirdHalfItem, Opponent, Player, ThirdHalf } from '../../types.ts';
import { AttendanceStatus } from '../../types.ts';
import { useToast } from '../../hooks/useToast.ts';

interface ThirdHalfPageProps {
    matches: Match[];
    opponents: Opponent[];
    players: Player[]; 
    onUpdateThirdHalf: (matchId: number, items: ThirdHalfItem[], playerPayments: { [pid: number]: number }) => void;
    initialMatchId?: number | null;
}

const PRESET_ITEMS = [
    { id: 'beer', name: 'Cerveza (Litros)', emoji: '🍺', defaultPrice: 4000 },
    { id: 'fernet', name: 'Fernet (Botella)', emoji: '🍷', defaultPrice: 12000 },
    { id: 'pizza', name: 'Pizzas', emoji: '🍕', defaultPrice: 8000 },
    { id: 'asado', name: 'Asado (Kg)', emoji: '🥩', defaultPrice: 15000 },
    { id: 'ice', name: 'Bolsa Hielo', emoji: '🧊', defaultPrice: 2000 },
    { id: 'soda', name: 'Gaseosa (2.5L)', emoji: '🥤', defaultPrice: 3500 },
    { id: 'chips', name: 'Papas/Snacks', emoji: '🍟', defaultPrice: 2500 },
    { id: 'other', name: 'Varios', emoji: '🛒', defaultPrice: 1000 },
];

export const ThirdHalfPage: React.FC<ThirdHalfPageProps> = ({ matches, opponents, players, onUpdateThirdHalf, initialMatchId }) => {
    const toast = useToast();
    const [selectedMatchId, setSelectedMatchId] = useState<number | null>(null);
    const [items, setItems] = useState<ThirdHalfItem[]>([]);
    const [playerPayments, setPlayerPayments] = useState<{ [pid: number]: number }>({});
    const [splitCount, setSplitCount] = useState(1);
    const lastLoadedMatchId = useRef<number | null>(null);

    useEffect(() => {
        if (initialMatchId) setSelectedMatchId(initialMatchId);
    }, [initialMatchId]);

    const finishedMatches = useMemo(() => matches
        .filter(m => m.status === 'FINALIZADO')
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()), [matches]);

    const selectedMatch = useMemo(() => matches.find(m => m.id === selectedMatchId), [matches, selectedMatchId]);

    const confirmedPlayers = useMemo(() => {
        if (!selectedMatch) return [];
        return players.filter(p => selectedMatch.playerStatuses.some(ps => ps.playerId === p.id && ps.attendanceStatus === AttendanceStatus.CONFIRMED));
    }, [selectedMatch, players]);

    const totalSpent = items.reduce((sum, item) => sum + item.total, 0);
    const totalCollected = Object.values(playerPayments).reduce((sum, val) => sum + (val || 0), 0);
    const amountPerPerson = splitCount > 0 ? totalSpent / splitCount : 0;
    const formatter = new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', maximumFractionDigits: 0 });

    useEffect(() => {
        if (selectedMatch && selectedMatchId !== lastLoadedMatchId.current) {
            const data = selectedMatch.thirdHalf as ThirdHalf | undefined;
            const existingItems = data?.items || [];
            const mergedItems = PRESET_ITEMS.map(preset => {
                const found = existingItems.find(e => e.id === preset.id);
                return found || { id: preset.id, name: preset.name, quantity: 0, unitPrice: preset.defaultPrice, total: 0 };
            });
            setItems(mergedItems);
            const paymentsMap: { [pid: number]: number } = {};
            if (data?.playerPayments) {
                Object.assign(paymentsMap, data.playerPayments);
            }
            setPlayerPayments(paymentsMap);
            const initialSplit = data?.totalSpent && data?.totalSpent > 0 
                ? (data.playerPayments ? Object.keys(data.playerPayments).length : 10)
                : 10;
            setSplitCount(initialSplit);
            lastLoadedMatchId.current = selectedMatchId;
        }
    }, [selectedMatchId, selectedMatch]);

    const handleShareWhatsApp = () => {
        if (!selectedMatch) return;
        const oppName = opponents.find(o => o.id === selectedMatch.opponentId)?.name || 'Rival';
        let text = `*🍻 RESUMEN 3ER TIEMPO: vs ${oppName}*\n🗓️ ${selectedMatch.date}\n--------------------------\n💰 *GASTO TOTAL:* ${formatter.format(totalSpent)}\n👥 *DIVIDIDO POR:* ${splitCount} pagadores\n⚡ *POR PERA:* ${formatter.format(amountPerPerson)}\n--------------------------\n\n`;
        const paidList = confirmedPlayers.filter(p => (playerPayments[p.id] || 0) >= (amountPerPerson - 5));
        const unpaidList = confirmedPlayers.filter(p => (playerPayments[p.id] || 0) < (amountPerPerson - 5));
        if (paidList.length > 0) {
            text += `✅ *PAGARON:*\n`;
            paidList.forEach(p => text += `- ${p.nickname}\n`);
            text += `\n`;
        }
        if (unpaidList.length > 0) {
            text += `❌ *DEBEN:*\n`;
            unpaidList.forEach(p => text += `- ${p.nickname}\n`);
            text += `\n`;
        }
        text += `📊 *ESTADO:* ${totalCollected >= totalSpent ? 'CUENTA SALDADA 🍺' : `Faltan ${formatter.format(totalSpent - totalCollected)}`}`;
        window.location.href = `whatsapp://send?text=${encodeURIComponent(text)}`;
    };

    const handleQuantityChange = (id: string, delta: number) => {
        setItems(prev => prev.map(item => {
            if (item.id === id) {
                const newQ = Math.max(0, item.quantity + delta);
                return { ...item, quantity: newQ, total: newQ * item.unitPrice };
            }
            return item;
        }));
    };

    const handlePriceChange = (id: string, newPrice: number) => {
        setItems(prev => prev.map(item => {
            if (item.id === id) return { ...item, unitPrice: newPrice, total: item.quantity * newPrice };
            return item;
        }));
    };

    const handlePlayerPaymentChange = (pid: number, amount: number) => {
        setPlayerPayments(prev => ({ ...prev, [pid]: amount }));
    };

    const handleSave = () => {
        if (!selectedMatchId) return;
        const activeItems = items.filter(i => i.quantity > 0 || i.total > 0);
        const cleanPayments: { [pid: number]: number } = {};
        Object.entries(playerPayments).forEach(([pid, amt]) => {
            if (amt > 0) cleanPayments[Number(pid)] = amt;
        });
        onUpdateThirdHalf(selectedMatchId, activeItems, cleanPayments);
        toast.success("¡Gastos y pagos guardados! 🍻");
    };

    if (!selectedMatchId || !selectedMatch) {
        return (
            <div className="bg-white dark:bg-gray-800 rounded-[3rem] shadow-2xl p-8 min-h-[60vh] border-t-8 border-yellow-500">
                <h2 className="text-8xl font-black text-center text-gray-800 dark:text-gray-100 mb-2 uppercase italic tracking-tighter leading-none">3er Tiempo</h2>
                <p className="text-center text-gray-400 font-bold uppercase text-xs tracking-widest mb-10">Control de consumo y división de gastos</p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {finishedMatches.map(m => {
                         const opp = opponents.find(o => o.id === m.opponentId)?.name || 'Rival';
                         const hasData = m.thirdHalf && m.thirdHalf.totalSpent > 0;
                         return (
                            <button key={m.id} onClick={() => setSelectedMatchId(m.id)} className={`p-6 rounded-3xl border-4 text-left transition-all active:scale-95 flex justify-between items-center ${hasData ? 'bg-yellow-50 border-yellow-200' : 'bg-gray-50 border-gray-100 dark:bg-gray-700/50'}`}>
                                <div>
                                    <p className="text-[10px] font-black text-gray-400 uppercase">{m.date}</p>
                                    <h3 className="font-black text-xl text-gray-800 dark:text-white italic uppercase">vs {opp}</h3>
                                </div>
                                <div className="text-right">
                                    {hasData ? (
                                        <p className="text-lg font-black text-yellow-600">{formatter.format(m.thirdHalf!.totalSpent)}</p>
                                    ) : (
                                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Sin datos</p>
                                    )}
                                </div>
                            </button>
                         )
                    })}
                </div>
            </div>
        );
    }

    return (
        <div className="bg-white dark:bg-gray-800 rounded-[3rem] shadow-2xl p-4 md:p-10 border-t-8 border-yellow-500 animate-fadeIn">
            <div className="flex justify-between items-center mb-8">
                <button onClick={() => { setSelectedMatchId(null); lastLoadedMatchId.current = null; }} className="font-black text-xs text-gray-400 hover:text-yellow-600 uppercase tracking-widest flex items-center gap-2">← Elegir otro partido</button>
                <button onClick={handleShareWhatsApp} className="bg-green-600 text-white px-5 py-3 rounded-2xl font-black text-[12px] uppercase tracking-tighter shadow-xl active:scale-95 flex items-center gap-2"><span>📱</span> ENVIAR RESUMEN 🍻</button>
            </div>
            <div className="flex flex-col lg:flex-row gap-8">
                <div className="flex-1 space-y-6">
                    <div className="bg-yellow-50 dark:bg-yellow-900/10 p-8 rounded-[2.5rem] border-2 border-yellow-100 dark:border-yellow-900/50">
                        <h3 className="text-5xl font-black italic uppercase tracking-tighter mb-8 flex items-center gap-2 text-gray-800 dark:text-yellow-500"><span>🛒</span> Ticket</h3>
                        <div className="space-y-3">
                            {items.map(item => (
                                <div key={item.id} className="p-4 bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm">
                                    <div className="flex items-center justify-between mb-3">
                                        <div className="flex items-center gap-3">
                                            <span className="text-3xl">{PRESET_ITEMS.find(p => p.id === item.id)?.emoji}</span>
                                            <span className="font-black text-gray-700 dark:text-gray-200 text-sm uppercase tracking-tight">{item.name}</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <button onClick={() => handleQuantityChange(item.id, -1)} className="w-10 h-10 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-400 font-black text-xl">-</button>
                                            <span className="w-8 text-center font-black text-2xl text-yellow-600">{item.quantity}</span>
                                            <button onClick={() => handleQuantityChange(item.id, 1)} className="w-10 h-10 rounded-full bg-yellow-400 text-black font-black text-xl">+</button>
                                        </div>
                                    </div>
                                    <div className="flex justify-between items-center pl-10 border-t dark:border-gray-800 pt-3">
                                        <div className="flex items-center gap-2">
                                            <span className="text-[10px] font-black text-gray-400 uppercase">P. Unit: $</span>
                                            <input type="number" value={item.unitPrice} onChange={(e) => handlePriceChange(item.id, parseFloat(e.target.value) || 0)} className="w-24 bg-transparent font-bold text-lg text-gray-600 dark:text-gray-400 outline-none border-b border-dashed border-gray-300" />
                                        </div>
                                        <span className="font-black text-lg text-gray-400">{formatter.format(item.total)}</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                        <div className="mt-10 pt-6 border-t-4 border-dashed border-yellow-200 dark:border-yellow-900 flex justify-between items-center">
                            <span className="font-black text-gray-400 uppercase text-xs">Total Gastado:</span>
                            <span className="text-6xl font-black text-green-600">{formatter.format(totalSpent)}</span>
                        </div>
                    </div>
                </div>
                <div className="lg:w-96 space-y-6">
                    <div className="bg-indigo-950 p-8 rounded-[2.5rem] text-white shadow-xl relative overflow-hidden">
                        <div className="absolute -right-5 -bottom-5 text-9xl opacity-10">👥</div>
                        <p className="text-[10px] font-black text-indigo-300 uppercase tracking-widest mb-4">¿Cuántos pagan hoy?</p>
                        <div className="flex items-center gap-4 mb-8">
                            <input type="number" value={splitCount} onChange={(e) => setSplitCount(Math.max(1, parseInt(e.target.value) || 1))} className="w-24 bg-white/10 rounded-2xl text-center font-black text-5xl p-4 text-white outline-none border-2 border-indigo-500 shadow-inner" />
                            <div className="flex flex-col"><span className="text-xl font-black uppercase italic leading-none">Pagadores</span><span className="text-[10px] text-indigo-400 font-bold uppercase mt-1">Manual</span></div>
                        </div>
                        <div className="pt-6 border-t border-indigo-900">
                             <p className="text-[10px] font-black text-indigo-300 uppercase tracking-widest mb-1">Monto por Persona</p>
                             <h4 className="text-6xl font-black italic uppercase tracking-tighter text-yellow-400">{formatter.format(amountPerPerson)}</h4>
                        </div>
                    </div>
                    <div className="bg-gray-50 dark:bg-gray-900 rounded-[2.5rem] p-6 border-2 border-gray-100 dark:border-gray-800">
                        <h3 className="font-black uppercase tracking-tighter text-xl mb-6 text-gray-800 dark:text-white flex items-center gap-2"><span>✅</span> Lista de Cobro</h3>
                        <div className="space-y-4 max-h-[450px] overflow-y-auto pr-2 custom-scrollbar">
                            {confirmedPlayers.map(p => {
                                const paidAmount = playerPayments[p.id] || 0;
                                const isFairPaid = paidAmount >= (amountPerPerson - 5); 
                                return (
                                    <div key={p.id} className={`p-4 rounded-3xl border-2 transition-all bg-white dark:bg-gray-800 ${isFairPaid ? 'border-green-500 shadow-md scale-[1.02]' : 'border-gray-100 dark:border-gray-700'}`}>
                                        <div className="flex items-center justify-between mb-3">
                                            <div className="flex items-center gap-3">
                                                <img src={p.photoUrl} className={`w-12 h-12 rounded-full object-cover border-2 ${paidAmount === 0 ? 'border-gray-300' : 'border-indigo-500'}`} alt="" />
                                                <div className="text-left">
                                                    <p className="font-black text-sm uppercase text-gray-800 dark:text-gray-100 leading-none">{p.nickname}</p>
                                                    <p className={`text-[9px] font-bold uppercase mt-1 ${isFairPaid ? 'text-green-500' : 'text-gray-400'}`}>{paidAmount === 0 ? 'Pendiente' : isFairPaid ? 'Pagó Todo ✅' : 'Incompleto'}</p>
                                                </div>
                                            </div>
                                            {!isFairPaid && <button onClick={() => handlePlayerPaymentChange(p.id, Math.round(amountPerPerson))} className="bg-indigo-600 text-white text-[9px] font-black px-3 py-2 rounded-xl uppercase tracking-tighter shadow-lg active:scale-90">Pago Justo ⚡</button>}
                                        </div>
                                        <div className="flex items-center gap-2 bg-gray-50 dark:bg-gray-950 p-3 rounded-2xl border-2 border-dashed border-gray-200 dark:border-gray-700">
                                            <span className="text-xl font-black text-gray-400">$</span>
                                            <input type="number" value={paidAmount || ''} placeholder="0" onChange={(e) => handlePlayerPaymentChange(p.id, parseFloat(e.target.value) || 0)} className="w-full bg-transparent font-black text-2xl text-yellow-600 outline-none" />
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                    <button onClick={handleSave} className="w-full py-6 bg-indigo-600 hover:bg-indigo-700 text-white font-black rounded-[2.5rem] shadow-2xl shadow-indigo-500/30 transition-all transform active:scale-95 flex items-center justify-center gap-3 uppercase tracking-widest italic text-sm"><span>💾</span> GUARDAR PLANILLA</button>
                </div>
            </div>
        </div>
    );
};
