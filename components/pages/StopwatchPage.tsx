
import React, { useState, useEffect } from 'react';

type Period = '1er Tiempo' | 'Entretiempo' | '2do Tiempo' | 'Finalizado';

interface StopwatchState {
    isRunning: boolean;
    currentPeriod: Period;
    endTime: number | null;
    remainingAtPause: number;
    initialDuration: number;
    history: { period: Period, duration: string, timestamp: string }[];
}

export const StopwatchPage: React.FC = () => {
    // 1. CARGAR ESTADO PERSISTENTE
    const getSavedState = (): StopwatchState => {
        const saved = localStorage.getItem('stopwatch_pro_v3');
        if (saved) return JSON.parse(saved);
        return {
            isRunning: false,
            currentPeriod: '1er Tiempo',
            endTime: null,
            remainingAtPause: 35 * 60,
            initialDuration: 35 * 60,
            history: []
        };
    };

    const [state, setState] = useState<StopwatchState>(getSavedState);
    const [displaySeconds, setDisplaySeconds] = useState(state.remainingAtPause);
    
    // Edición
    const [isEditing, setIsEditing] = useState(false);
    const [editMins, setEditMins] = useState(Math.floor(state.initialDuration / 60).toString());
    const [editSecs, setEditSecs] = useState((state.initialDuration % 60).toString());

    // 2. GUARDAR ESTADO
    useEffect(() => {
        localStorage.setItem('stopwatch_pro_v3', JSON.stringify({
            ...state,
            remainingAtPause: state.isRunning ? displaySeconds : state.remainingAtPause
        }));
    }, [state, displaySeconds]);

    // 3. MOTOR
    useEffect(() => {
        let interval: number;
        if (state.isRunning && state.endTime) {
            interval = window.setInterval(() => {
                const now = Date.now();
                const diffMs = state.endTime! - now;
                const diffSecs = Math.ceil(diffMs / 1000);

                if (diffSecs <= 0) {
                    setDisplaySeconds(0);
                    handleFinishPeriod();
                } else {
                    setDisplaySeconds(diffSecs);
                }
            }, 500);
        }
        return () => clearInterval(interval);
    }, [state.isRunning, state.endTime]);

    // ACCIONES CON CONFIRMACIÓN
    const handleStart = () => {
        const newEndTime = Date.now() + (displaySeconds * 1000);
        setState(prev => ({ ...prev, isRunning: true, endTime: newEndTime }));
    };

    const handlePause = () => {
        if (window.confirm("¿Seguro que quieres PAUSAR el tiempo?")) {
            setState(prev => ({ ...prev, isRunning: false, endTime: null, remainingAtPause: displaySeconds }));
        }
    };

    const handleResetPeriod = () => {
        if (window.confirm(`¿Reiniciar el ${state.currentPeriod}?`)) {
            setState(prev => ({ ...prev, isRunning: false, endTime: null, remainingAtPause: prev.initialDuration }));
            setDisplaySeconds(state.initialDuration);
        }
    };

    const handleFinishPeriod = () => {
        const timeLog = new Date().toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' });
        const durationStr = formatTime(state.initialDuration - displaySeconds);
        
        const newHistory = [...state.history, { period: state.currentPeriod, duration: durationStr, timestamp: timeLog }];
        
        let nextPeriod: Period = '1er Tiempo';
        let nextDuration = 35 * 60;

        if (state.currentPeriod === '1er Tiempo') {
            nextPeriod = 'Entretiempo';
            nextDuration = 15 * 60;
        } else if (state.currentPeriod === 'Entretiempo') {
            nextPeriod = '2do Tiempo';
            nextDuration = 35 * 60;
        } else {
            nextPeriod = 'Finalizado';
            nextDuration = 0;
        }

        setState(prev => ({
            ...prev,
            isRunning: false,
            endTime: null,
            currentPeriod: nextPeriod,
            initialDuration: nextDuration,
            remainingAtPause: nextDuration,
            history: newHistory
        }));
        setDisplaySeconds(nextDuration);
    };

    const handleGlobalReset = () => {
        if (window.confirm("⚠️ ¿BORRAR TODO EL REGISTRO y volver al inicio del partido?")) {
            const defaultState = {
                isRunning: false,
                currentPeriod: '1er Tiempo' as Period,
                endTime: null,
                remainingAtPause: 35 * 60,
                initialDuration: 35 * 60,
                history: []
            };
            setState(defaultState);
            setDisplaySeconds(35 * 60);
        }
    };

    const formatTime = (totalSecs: number) => {
        const absSecs = Math.abs(totalSecs);
        const mins = Math.floor(absSecs / 60);
        const secs = absSecs % 60;
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    };

    return (
        <div className="bg-gray-950 min-h-screen rounded-[2.5rem] p-4 text-white flex flex-col items-center relative overflow-hidden font-sans">
            <div className="absolute inset-0 opacity-10 pointer-events-none bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')]"></div>
            
            <div className="z-10 text-center my-6">
                <h2 className="text-4xl font-black italic uppercase tracking-tighter text-indigo-500">Reloj Oficial LD</h2>
                <div className="bg-indigo-600/20 text-indigo-400 px-4 py-1 rounded-full text-[10px] font-black uppercase mt-2 border border-indigo-500/30">
                    {state.currentPeriod}
                </div>
            </div>

            {/* DISPLAY PRINCIPAL */}
            <div className={`relative flex flex-col items-center justify-center p-10 rounded-[4rem] border-8 transition-all duration-700 ${state.isRunning ? 'border-green-500 shadow-[0_0_60px_rgba(34,197,94,0.2)]' : 'border-gray-800'} bg-black/40 backdrop-blur-xl mb-8 w-full max-w-lg`}>
                {isEditing ? (
                    <div className="flex flex-col items-center gap-6">
                        <div className="flex items-center gap-2 text-7xl font-mono font-black text-indigo-400">
                            <div className="flex flex-col items-center">
                                <span className="text-[10px] uppercase text-gray-500">Min</span>
                                <input type="number" value={editMins} onChange={e => setEditMins(e.target.value)} className="bg-transparent text-center outline-none border-b-4 border-indigo-500 w-24" />
                            </div>
                            <span className="mt-4">:</span>
                            <div className="flex flex-col items-center">
                                <span className="text-[10px] uppercase text-gray-500">Seg</span>
                                <input type="number" value={editSecs} onChange={e => setEditSecs(e.target.value)} className="bg-transparent text-center outline-none border-b-4 border-indigo-500 w-24" />
                            </div>
                        </div>
                        <button onClick={() => {
                            const total = (parseInt(editMins)||0)*60 + (parseInt(editSecs)||0);
                            setState(prev => ({ ...prev, initialDuration: total, remainingAtPause: total }));
                            setDisplaySeconds(total);
                            setIsEditing(false);
                        }} className="bg-indigo-600 px-10 py-3 rounded-2xl font-black uppercase text-sm shadow-xl">GUARDAR</button>
                    </div>
                ) : (
                    <div className="text-center cursor-pointer" onClick={() => !state.isRunning && setIsEditing(true)}>
                        <p className={`text-8xl md:text-[10rem] font-mono font-black leading-none tracking-tighter ${displaySeconds <= 10 && displaySeconds > 0 ? 'text-red-500 animate-pulse' : 'text-yellow-400'}`}>
                            {formatTime(displaySeconds)}
                        </p>
                        {!state.isRunning && state.currentPeriod !== 'Finalizado' && <p className="text-[10px] font-black text-indigo-400 uppercase mt-6 animate-pulse tracking-widest">Toca para ajustar tiempo</p>}
                    </div>
                )}
            </div>

            {/* BOTONES DE CONTROL */}
            <div className="grid grid-cols-2 gap-4 w-full max-w-md z-10 mb-8">
                {state.currentPeriod !== 'Finalizado' && (
                    !state.isRunning ? (
                        <button onClick={handleStart} className="h-20 bg-green-600 rounded-[2rem] font-black text-2xl shadow-xl active:scale-95 transition-all">INICIAR</button>
                    ) : (
                        <button onClick={handlePause} className="h-20 bg-orange-600 rounded-[2rem] font-black text-2xl shadow-xl active:scale-95 transition-all">PAUSAR</button>
                    )
                )}
                <button onClick={handleResetPeriod} className="h-20 bg-gray-800 rounded-[2rem] font-black text-xl border-2 border-white/10 active:scale-95 transition-all uppercase">Reiniciar</button>
            </div>

            {/* REGISTRO DE TIEMPOS */}
            <div className="w-full max-w-md bg-white/5 backdrop-blur-md rounded-[2.5rem] p-6 border border-white/10 z-10">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-xs font-black uppercase tracking-widest text-gray-400">Registro del Partido</h3>
                    <button onClick={handleGlobalReset} className="text-[10px] font-black text-red-500 uppercase hover:underline">Reiniciar Todo</button>
                </div>
                
                <div className="space-y-3">
                    {state.history.length === 0 ? (
                        <p className="text-center py-4 text-gray-600 text-[10px] font-bold uppercase italic">Esperando inicio de partido...</p>
                    ) : (
                        state.history.map((h, i) => (
                            <div key={i} className="flex justify-between items-center bg-black/30 p-3 rounded-2xl border border-white/5">
                                <div className="flex items-center gap-3">
                                    <span className="text-indigo-500 font-black text-xs">#{i+1}</span>
                                    <span className="font-black uppercase text-[11px]">{h.period}</span>
                                </div>
                                <div className="text-right">
                                    <p className="font-mono font-black text-yellow-500 text-sm">{h.duration}</p>
                                    <p className="text-[8px] text-gray-500 font-bold uppercase">{h.timestamp} hs</p>
                                </div>
                            </div>
                        ))
                    )}
                    
                    {state.currentPeriod === 'Finalizado' && (
                        <div className="text-center py-4 bg-green-600/20 rounded-2xl border border-green-500/30">
                            <p className="text-green-400 font-black uppercase text-xs">🏁 Partido Finalizado</p>
                        </div>
                    )}
                </div>
            </div>

            <p className="mt-8 text-[9px] font-bold text-gray-600 uppercase tracking-widest text-center px-10">
                El cronómetro avanza automáticamente entre etapas (1er T → Entretiempo → 2do T).
            </p>
        </div>
    );
};
