
import React, { useState, useEffect } from 'react';
import type { Player, PlayerMatchStatus } from '../../types.ts';

interface QuickActionOverlayProps {
    player: Player | null;
    playerStatus: PlayerMatchStatus | null;
    onClose: () => void;
    onUpdateStat: (field: keyof PlayerMatchStatus, value: any) => void;
    onUpdatePayment: (amount: number) => void;
    fairShare: number;
}

export const QuickActionOverlay: React.FC<QuickActionOverlayProps> = ({ player, playerStatus, onClose, onUpdateStat, onUpdatePayment, fairShare }) => {
    const [manualAmount, setManualAmount] = useState<string>('');

    useEffect(() => {
        if (playerStatus) {
            setManualAmount(playerStatus.amountPaid?.toString() || '');
        }
    }, [playerStatus]);

    if (!player || !playerStatus) return null;

    const handleAmountChange = (val: string) => {
        setManualAmount(val);
        const num = parseFloat(val);
        if (!isNaN(num)) {
            onUpdatePayment(num);
        } else if (val === '') {
            onUpdatePayment(0);
        }
    };

    return (
        <div className="fixed inset-0 z-[110] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-fadeIn" onClick={onClose}>
            <div className="bg-white dark:bg-gray-800 rounded-[2.5rem] w-full max-w-sm overflow-hidden shadow-2xl border-4 border-indigo-500" onClick={e => e.stopPropagation()}>
                <header className="p-6 text-center bg-gray-50 dark:bg-gray-900 border-b dark:border-gray-700 relative">
                    <button onClick={onClose} className="absolute right-4 top-4 text-gray-400 text-xl font-black">✕</button>
                    <img src={player.photoUrl} className="w-24 h-24 rounded-full mx-auto border-4 border-white shadow-lg mb-3 object-cover" />
                    <h3 className="text-2xl font-black uppercase tracking-tighter italic text-indigo-600">{player.nickname}</h3>
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Planilla Rápida de Campo</p>
                </header>

                <div className="p-6 space-y-6">
                    {/* Botones de Stats */}
                    <div className="grid grid-cols-2 gap-4">
                        <ActionButton icon="⚽" label="+1 GOL" color="bg-green-600" onClick={() => onUpdateStat('goalsPlay', 1)} />
                        <ActionButton icon="👟" label="+1 ASIST" color="bg-blue-600" onClick={() => onUpdateStat('assists', 1)} />
                        <ActionButton icon="🟨" label="AMARILLA" color="bg-yellow-500" onClick={() => onUpdateStat('yellowCards', 1)} />
                        <ActionButton icon="🟥" label="ROJA" color="bg-red-600" onClick={() => onUpdateStat('redCard', !playerStatus.redCard)} />
                    </div>
                    
                    {/* Sección de Pagos */}
                    <div className="pt-4 border-t dark:border-gray-700 mt-2">
                        <p className="text-center text-[10px] font-black text-gray-500 uppercase mb-4 tracking-widest">Control de Pagos (Cancha)</p>
                        
                        <div className="space-y-3">
                            <div className="flex items-center gap-3 bg-gray-100 dark:bg-gray-900 p-4 rounded-2xl border-2 border-dashed border-gray-300 dark:border-gray-700">
                                <span className="text-2xl font-black text-gray-400">$</span>
                                <input 
                                    type="number" 
                                    value={manualAmount}
                                    placeholder="¿Cuánto puso?"
                                    onChange={(e) => handleAmountChange(e.target.value)}
                                    className="w-full bg-transparent text-2xl font-black text-emerald-600 outline-none"
                                    autoFocus
                                />
                            </div>

                            <button 
                                onClick={(e) => { e.stopPropagation(); onUpdatePayment(Math.round(fairShare)); onClose(); }} 
                                className="w-full py-4 bg-emerald-500 text-white rounded-2xl font-black uppercase italic tracking-tighter shadow-lg active:scale-95 transition-all flex flex-col items-center justify-center leading-none"
                            >
                                <span className="text-xs opacity-80 mb-1">Cargar Pera Justa</span>
                                <span className="text-xl">$ {Math.round(fairShare)} ⚡</span>
                            </button>
                        </div>
                    </div>
                </div>

                <footer className="p-4 bg-gray-50 dark:bg-gray-900 text-center border-t dark:border-gray-700">
                    <button onClick={onClose} className="text-gray-400 font-black uppercase text-xs tracking-widest">Listo / Cerrar</button>
                </footer>
            </div>
        </div>
    );
};

const ActionButton: React.FC<{ icon: string, label: string, color: string, onClick: () => void }> = ({ icon, label, color, onClick }) => (
    <button 
        onClick={(e) => { e.stopPropagation(); onClick(); }}
        className={`${color} text-white p-4 rounded-3xl flex flex-col items-center justify-center gap-1 shadow-lg active:scale-90 transition-all`}
    >
        <span className="text-3xl">{icon}</span>
        <span className="text-[10px] font-black uppercase tracking-tighter">{label}</span>
    </button>
);
