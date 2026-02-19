
import React, { useState, useEffect, useRef } from 'react';

type PresetSound = 'WHISTLE' | 'DOUBLE_WHISTLE' | 'TRIPLE_WHISTLE' | 'BEEP' | 'BUZZER';

export const StopwatchPage: React.FC = () => {
    const savedAudio = JSON.parse(localStorage.getItem('stopwatch_audio_settings') || '{}');

    // Estados principales
    const [isRunning, setIsRunning] = useState(false);
    const [initialTargetSeconds, setInitialTargetSeconds] = useState(35 * 60); 
    const [displaySeconds, setDisplaySeconds] = useState(35 * 60);
    const [wakeLockEnabled, setWakeLockEnabled] = useState(false);
    
    // Configuración de Audio
    const [intermediateSound, setIntermediateSound] = useState<PresetSound>(savedAudio.intermediate || 'BEEP');
    const [finalSound, setFinalSound] = useState<PresetSound>(savedAudio.final || 'TRIPLE_WHISTLE');
    const [alertFrequency, setAlertFrequency] = useState(5 * 60); 
    const [volume, setVolume] = useState(savedAudio.volume ?? 0.5);
    const [isMuted, setIsMuted] = useState(savedAudio.muted ?? false);
    
    // Edición de tiempo
    const [isEditing, setIsEditing] = useState(false);
    const [editMins, setEditMins] = useState('35');
    const [editSecs, setEditSecs] = useState('00');

    // Referencias para lógica de fondo (resistente a bloqueos)
    const startTimeRef = useRef<number | null>(null);
    const accumulatedTimeRef = useRef<number>(0); 
    const lastAlertMinuteRef = useRef<number>(-1);
    const hasTriggeredFinalRef = useRef<boolean>(false);
    const intervalRef = useRef<number | null>(null);
    const wakeLockRef = useRef<any>(null);

    // --- LÓGICA DE BLOQUEO DE PANTALLA (WAKE LOCK) ---
    const requestWakeLock = async () => {
        if ('wakeLock' in navigator) {
            try {
                wakeLockRef.current = await (navigator as any).wakeLock.request('screen');
                setWakeLockEnabled(true);
                console.log("Pantalla bloqueada: No se apagará");
                
                wakeLockRef.current.addEventListener('release', () => {
                    setWakeLockEnabled(false);
                    console.log("Wake Lock liberado");
                });
            } catch (err) {
                console.error("Error solicitando Wake Lock:", err);
            }
        }
    };

    const releaseWakeLock = () => {
        if (wakeLockRef.current) {
            wakeLockRef.current.release();
            wakeLockRef.current = null;
        }
    };

    // Re-solicitar si la app vuelve de fondo
    useEffect(() => {
        const handleVisibilityChange = async () => {
            if (isRunning && document.visibilityState === 'visible') {
                await requestWakeLock();
            }
        };
        document.addEventListener('visibilitychange', handleVisibilityChange);
        return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
    }, [isRunning]);

    // Persistencia de settings
    useEffect(() => {
        localStorage.setItem('stopwatch_audio_settings', JSON.stringify({
            intermediate: intermediateSound,
            final: finalSound,
            volume,
            muted: isMuted
        }));
    }, [intermediateSound, finalSound, volume, isMuted]);

    // --- MOTOR DE AUDIO ---
    const createAudioContext = () => new (window.AudioContext || (window as any).webkitAudioContext)();

    const playRefereeWhistle = (isLong = false) => {
        if (isMuted) return;
        const ctx = createAudioContext();
        const duration = isLong ? 1.5 : 0.3;
        [2000, 2050].forEach(f => {
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            const lfo = ctx.createOscillator();
            const lfoGain = ctx.createGain();
            osc.type = 'sine';
            osc.frequency.value = f;
            lfo.frequency.value = 30; 
            lfoGain.gain.value = 40;
            lfo.connect(lfoGain);
            lfoGain.connect(osc.frequency);
            gain.gain.setValueAtTime(0, ctx.currentTime);
            gain.gain.linearRampToValueAtTime(volume * 0.4, ctx.currentTime + 0.05);
            gain.gain.setValueAtTime(volume * 0.4, ctx.currentTime + duration - 0.1);
            gain.gain.linearRampToValueAtTime(0, ctx.currentTime + duration);
            osc.connect(gain);
            gain.connect(ctx.destination);
            lfo.start();
            osc.start();
            osc.stop(ctx.currentTime + duration);
        });
    };

    const triggerSound = (type: PresetSound) => {
        const ctx = createAudioContext();
        const playTone = (freq: number, dur: number) => {
            if (isMuted) return;
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.frequency.value = freq;
            gain.gain.setValueAtTime(volume, ctx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + dur);
            osc.connect(gain);
            gain.connect(ctx.destination);
            osc.start();
            osc.stop(ctx.currentTime + dur);
        };

        switch(type) {
            case 'BEEP': playTone(1000, 0.2); break;
            case 'WHISTLE': playRefereeWhistle(false); break;
            case 'DOUBLE_WHISTLE':
                playRefereeWhistle(false);
                setTimeout(() => playRefereeWhistle(true), 400);
                break;
            case 'TRIPLE_WHISTLE':
                playRefereeWhistle(false); // Corto
                setTimeout(() => playRefereeWhistle(false), 400); // Corto
                setTimeout(() => playRefereeWhistle(true), 800); // Largo (Final)
                break;
            case 'BUZZER': playTone(150, 1.2); break;
        }
    };

    // --- LÓGICA DE TIEMPO ABSOLUTO ---
    const handleStartStop = async () => {
        if (isRunning) {
            if (startTimeRef.current) {
                accumulatedTimeRef.current += Date.now() - startTimeRef.current;
            }
            startTimeRef.current = null;
            setIsRunning(false);
            releaseWakeLock();
        } else {
            startTimeRef.current = Date.now();
            setIsRunning(true);
            await requestWakeLock();
        }
    };

    const handleReset = () => {
        startTimeRef.current = null;
        accumulatedTimeRef.current = 0;
        lastAlertMinuteRef.current = -1;
        hasTriggeredFinalRef.current = false;
        setIsRunning(false);
        setDisplaySeconds(initialTargetSeconds);
        releaseWakeLock();
    };

    useEffect(() => {
        if (isRunning) {
            intervalRef.current = window.setInterval(() => {
                if (!startTimeRef.current) return;
                
                // Cálculo de tiempo absoluto (resistente a pausas de CPU/bloqueo)
                const now = Date.now();
                const totalElapsedMs = accumulatedTimeRef.current + (now - startTimeRef.current);
                const totalElapsedSecs = Math.floor(totalElapsedMs / 1000);
                const remaining = initialTargetSeconds - totalElapsedSecs;
                setDisplaySeconds(remaining);

                // Alertas intermedias
                if (totalElapsedSecs > 0 && totalElapsedSecs % alertFrequency === 0 && Math.floor(totalElapsedSecs/60) !== lastAlertMinuteRef.current) {
                    lastAlertMinuteRef.current = Math.floor(totalElapsedSecs/60);
                    if (remaining > 0) triggerSound(intermediateSound);
                }

                // Alerta Final (Triple Silbato)
                if (remaining <= 0 && !hasTriggeredFinalRef.current) {
                    hasTriggeredFinalRef.current = true;
                    triggerSound(finalSound);
                }
            }, 100); // Check cada 100ms para precisión total
        } else {
            if (intervalRef.current) clearInterval(intervalRef.current);
        }
        return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
    }, [isRunning, initialTargetSeconds, alertFrequency, intermediateSound, finalSound]);

    const formatTime = (totalSecs: number) => {
        const absSecs = Math.abs(totalSecs);
        const mins = Math.floor(absSecs / 60);
        const secs = absSecs % 60;
        const sign = totalSecs < 0 ? '+' : '';
        return `${sign}${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    };

    return (
        <div className="bg-gray-950 min-h-screen rounded-[2.5rem] p-4 md:p-10 text-white flex flex-col items-center shadow-2xl border-b-8 border-indigo-600 relative overflow-hidden">
            <div className="absolute inset-0 opacity-10 pointer-events-none bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')]"></div>
            
            <div className="w-full flex justify-between items-center mb-10 z-10">
                <div className="text-left">
                    <div className="flex items-center gap-2">
                        <span className="text-indigo-500 font-black uppercase tracking-[0.2em] text-[10px]">Reloj de Campo</span>
                        {wakeLockEnabled && <span className="bg-green-500/20 text-green-400 text-[8px] font-black px-2 py-0.5 rounded-full border border-green-500/30 animate-pulse">PANTALLA ACTIVA</span>}
                    </div>
                    <h2 className="text-3xl font-black italic uppercase tracking-tighter leading-none">CRONÓMETRO LD</h2>
                </div>
                <button onClick={() => setIsMuted(!isMuted)} className={`w-14 h-14 flex items-center justify-center rounded-2xl shadow-lg transition-all active:scale-90 ${isMuted ? 'bg-red-600' : 'bg-indigo-600'}`}>
                    <span className="text-2xl">{isMuted ? '🔇' : '🔊'}</span>
                </button>
            </div>

            <div className="w-full max-w-xl grid grid-cols-1 md:grid-cols-2 gap-4 mb-8 z-10">
                <div className="bg-white/5 backdrop-blur-md p-4 rounded-3xl border border-white/10">
                    <p className="text-[10px] font-black text-indigo-400 uppercase mb-2 tracking-widest">Avisos cada:</p>
                    <select value={alertFrequency} onChange={e => setAlertFrequency(parseInt(e.target.value))} className="w-full bg-gray-800 p-2 rounded-xl text-xs font-black uppercase outline-none">
                        <option value={60}>1 Minuto</option>
                        <option value={300}>5 Minutos</option>
                        <option value={600}>10 Minutos</option>
                        <option value={900}>15 Minutos</option>
                    </select>
                </div>
                <div className="bg-white/5 backdrop-blur-md p-4 rounded-3xl border border-white/10 flex flex-col justify-center">
                    <p className="text-[10px] font-black text-orange-400 uppercase mb-2 tracking-widest">Volumen Alarma</p>
                    <input type="range" min="0" max="1" step="0.1" value={volume} onChange={e => setVolume(parseFloat(e.target.value))} className="w-full accent-indigo-500" />
                </div>
            </div>

            <div className={`relative flex flex-col items-center justify-center p-10 md:p-20 rounded-[4rem] border-8 transition-all duration-700 ${isRunning ? 'border-green-500 shadow-[0_0_80px_rgba(34,197,94,0.15)]' : 'border-gray-800'} bg-black/40 backdrop-blur-xl mb-10 min-w-[320px] md:min-w-[500px]`}>
                {displaySeconds <= 0 && <div className="absolute -top-6 bg-red-600 text-white px-6 py-1 rounded-full text-[12px] font-black uppercase tracking-widest animate-pulse shadow-xl border-2 border-white/20">Tiempo Adicional</div>}
                
                {isEditing ? (
                    <form onSubmit={(e) => { e.preventDefault(); const total = (parseInt(editMins)||0)*60+(parseInt(editSecs)||0); setInitialTargetSeconds(total); setDisplaySeconds(total); handleReset(); setIsEditing(false); }} className="flex flex-col items-center gap-6">
                        <div className="flex items-center gap-2 text-7xl md:text-9xl font-mono font-black text-indigo-400">
                            <input type="number" value={editMins} onChange={e => setEditMins(e.target.value)} className="w-24 md:w-40 bg-transparent text-center outline-none border-b-4 border-indigo-500" autoFocus />
                            <span>:</span><input type="number" value={editSecs} onChange={e => setEditSecs(e.target.value)} className="w-24 md:w-40 bg-transparent text-center outline-none border-b-4 border-indigo-500" />
                        </div>
                        <button type="submit" className="px-10 py-4 bg-indigo-600 rounded-2xl font-black uppercase tracking-widest text-sm shadow-xl hover:bg-indigo-500 transition-all">Establecer Tiempo</button>
                    </form>
                ) : (
                    <div className="text-center cursor-pointer group" onClick={() => !isRunning && setIsEditing(true)}>
                        <p className={`text-8xl md:text-[13rem] font-mono font-black leading-none tracking-tighter transition-colors ${displaySeconds <= 0 ? 'text-red-500' : 'text-yellow-400 group-hover:text-yellow-300'}`}>
                            {formatTime(displaySeconds)}
                        </p>
                        {!isRunning && <p className="text-[10px] font-black text-indigo-400 uppercase mt-6 animate-pulse tracking-[0.3em]">Toca los números para editar</p>}
                    </div>
                )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full max-w-xl z-10 mb-12">
                <button onClick={handleStartStop} className={`h-24 rounded-[2.5rem] font-black text-3xl shadow-2xl transition-all active:scale-95 ${isRunning ? 'bg-red-600 hover:bg-red-700' : 'bg-green-600 hover:bg-green-700'}`}>
                    {isRunning ? 'PAUSAR' : 'INICIAR PARTIDO'}
                </button>
                <button onClick={handleReset} className="h-24 bg-gray-800 hover:bg-gray-700 rounded-[2.5rem] font-black text-xl uppercase border-2 border-white/10 shadow-xl transition-all active:scale-95">REINICIAR</button>
            </div>

            <div className="w-full max-w-xl bg-black/40 rounded-[2rem] p-6 border border-white/5 z-10 grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                    <h3 className="text-[10px] font-black text-indigo-400 uppercase mb-3 tracking-widest">Sonido Alerta</h3>
                    <div className="grid grid-cols-2 gap-2">
                        {(['BEEP', 'WHISTLE', 'BUZZER'] as PresetSound[]).map(s => (
                            <button key={s} onClick={() => { setIntermediateSound(s); triggerSound(s); }} className={`py-2 text-[9px] font-black rounded-lg border transition-all ${intermediateSound === s ? 'bg-indigo-600 border-indigo-400 text-white' : 'bg-gray-800 border-transparent text-gray-500'}`}>{s}</button>
                        ))}
                    </div>
                </div>
                <div>
                    <h3 className="text-[10px] font-black text-red-400 uppercase mb-3 tracking-widest">Sonido de Fin</h3>
                    <div className="grid grid-cols-2 gap-2">
                        {(['TRIPLE_WHISTLE', 'DOUBLE_WHISTLE', 'WHISTLE', 'BUZZER'] as PresetSound[]).map(s => (
                            <button key={s} onClick={() => { setFinalSound(s); triggerSound(s); }} className={`py-2 text-[9px] font-black rounded-lg border transition-all ${finalSound === s ? 'bg-red-600 border-red-400 text-white' : 'bg-gray-800 border-transparent text-gray-500'}`}>
                                {s === 'TRIPLE_WHISTLE' ? 'TRIPLE 🏁' : s === 'DOUBLE_WHISTLE' ? 'DOBLE' : s}
                            </button>
                        ))}
                    </div>
                </div>
            </div>
            
            <p className="mt-8 text-[9px] font-bold text-gray-600 uppercase tracking-widest text-center px-10">
                La pantalla permanecerá encendida automáticamente mientras el cronómetro esté corriendo para asegurar la precisión.
            </p>
        </div>
    );
};
