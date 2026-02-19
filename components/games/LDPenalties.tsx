
import React, { useState, useEffect, useRef } from 'react';
import type { Player, MyTeam, Opponent } from '../../types';

interface LDPenaltiesProps {
    players: Player[];
    myTeam: MyTeam | null;
    opponents: Opponent[];
    onFinish: (score: number) => void;
    muted?: boolean;
}

export const LDPenalties: React.FC<LDPenaltiesProps> = ({ myTeam, onFinish, muted }) => {
    const [score, setScore] = useState(0);
    const [timeLeft, setTimeLeft] = useState(30);
    const [gameStarted, setGameStarted] = useState(false);
    const [target, setTarget] = useState({ x: 50, y: 50, size: 60 });
    const [keeperPos, setKeeperPos] = useState(50);
    const [isKicking, setIsKicking] = useState(false);
    const [feedback, setFeedback] = useState<'GOAL' | 'MISS' | 'SAVED' | null>(null);

    const goalRef = useRef<HTMLDivElement>(null);

    const playSound = (freq: number, dur: number, type: OscillatorType = 'sine') => {
        if (muted) return;
        try {
            const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.type = type;
            osc.frequency.value = freq;
            gain.gain.setValueAtTime(0.1, ctx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + dur);
            osc.connect(gain);
            gain.connect(ctx.destination);
            osc.start();
            osc.stop(ctx.currentTime + dur);
        } catch (e) {}
    };

    useEffect(() => {
        if (!gameStarted) return;
        const interval = setInterval(() => {
            setKeeperPos(prev => {
                const move = (Math.random() - 0.5) * 15;
                return Math.max(20, Math.min(80, prev + move));
            });
        }, 150);
        return () => clearInterval(interval);
    }, [gameStarted]);

    useEffect(() => {
        if (gameStarted && timeLeft > 0) {
            const timer = setInterval(() => setTimeLeft(prev => prev - 1), 1000);
            return () => clearInterval(timer);
        } else if (timeLeft === 0 && gameStarted) {
            setGameStarted(false);
            onFinish(score);
        }
    }, [gameStarted, timeLeft, score, onFinish]);

    const spawnTarget = () => {
        setTarget({
            x: 15 + Math.random() * 70,
            y: 20 + Math.random() * 50,
            size: Math.max(40, 70 - score / 100)
        });
    };

    const handleKick = (e: React.MouseEvent | React.TouchEvent) => {
        if (!gameStarted || isKicking) return;
        
        setIsKicking(true);
        const rect = goalRef.current?.getBoundingClientRect();
        if (!rect) return;

        const clientX = 'touches' in e ? e.touches[0].clientX : (e as React.MouseEvent).clientX;
        const clientY = 'touches' in e ? e.touches[0].clientY : (e as React.MouseEvent).clientY;

        const x = ((clientX - rect.left) / rect.width) * 100;
        const y = ((clientY - rect.top) / rect.height) * 100;

        const distToTarget = Math.sqrt(Math.pow(x - target.x, 2) + Math.pow(y - target.y, 2));
        const distToKeeper = Math.sqrt(Math.pow(x - keeperPos, 2) + Math.pow(y - 65, 2));

        if (distToKeeper < 12) {
            setFeedback('SAVED');
            playSound(150, 0.4, 'square');
            setScore(prev => Math.max(0, prev - 20));
        } else if (distToTarget < 10) {
            setFeedback('GOAL');
            playSound(880, 0.2);
            setTimeout(() => playSound(1200, 0.4), 100);
            setScore(prev => prev + 100);
            spawnTarget();
        } else {
            setFeedback('MISS');
            playSound(100, 0.3, 'sine');
        }

        setTimeout(() => {
            setFeedback(null);
            setIsKicking(false);
        }, 800);
    };

    return (
        <div className="w-full max-w-2xl mx-auto bg-green-900 rounded-[3rem] p-4 shadow-2xl border-4 border-white/10 overflow-hidden relative min-h-[500px] select-none">
            <div className="absolute inset-0 opacity-30 pointer-events-none bg-[url('https://www.transparenttextures.com/patterns/fake-grass.png')]"></div>
            
            <div className="relative z-10 flex justify-between items-center mb-6 px-4">
                <div className="bg-black/50 p-3 rounded-2xl border border-white/10 shadow-xl">
                    <p className="text-[10px] font-black text-green-400 uppercase">Créditos</p>
                    <p className="text-2xl font-black text-white">{score}</p>
                </div>
                <div className="bg-black/50 p-3 rounded-2xl border border-white/10 shadow-xl text-right">
                    <p className="text-[10px] font-black text-red-400 uppercase">Tiempo</p>
                    <p className={`text-2xl font-black ${timeLeft < 10 ? 'text-red-500 animate-pulse' : 'text-white'}`}>{timeLeft}s</p>
                </div>
            </div>

            {!gameStarted ? (
                <div className="relative z-20 h-[400px] flex flex-col items-center justify-center text-center p-6 space-y-6">
                    <div className="w-24 h-24 bg-white rounded-full flex items-center justify-center shadow-2xl animate-bounce overflow-hidden">
                        {myTeam?.shieldUrl ? (
                            <img src={myTeam.shieldUrl} alt="Team" className="w-16 h-16 object-contain" />
                        ) : (
                            <span className="text-6xl">⚽</span>
                        )}
                    </div>
                    <h3 className="text-4xl font-black italic uppercase tracking-tighter text-white">PENALES LD</h3>
                    <p className="text-green-200 text-sm font-bold uppercase tracking-widest max-w-xs">
                        TOCA LOS OBJETIVOS EN EL ARCO<br/>
                        <span className="text-yellow-400">EVITA LAS MANOS DEL ARQUERO</span>
                    </p>
                    <button 
                        onClick={() => { setGameStarted(true); spawnTarget(); }}
                        className="px-12 py-5 bg-white text-green-950 font-black rounded-3xl text-2xl shadow-xl hover:scale-105 active:scale-95 transition-all uppercase italic"
                    >
                        Patear
                    </button>
                </div>
            ) : (
                <div 
                    ref={goalRef}
                    onMouseDown={handleKick}
                    className="relative w-full h-[400px] bg-blue-400/20 rounded-t-[2rem] border-x-[12px] border-t-[12px] border-white shadow-inner overflow-hidden cursor-crosshair"
                >
                    <div className="absolute inset-0 opacity-20 bg-[url('https://www.transparenttextures.com/patterns/diagmonds-light.png')]"></div>

                    <div 
                        className="absolute transition-all duration-150 ease-out"
                        style={{ left: `${keeperPos}%`, bottom: '15%', transform: 'translateX(-50%)' }}
                    >
                        <div className="relative">
                            <div className="w-16 h-24 bg-red-600 rounded-t-full border-4 border-black relative">
                                <div className="absolute -left-8 top-4 w-10 h-4 bg-red-500 rounded-full border-2 border-black rotate-45"></div>
                                <div className="absolute -right-8 top-4 w-10 h-4 bg-red-500 rounded-full border-2 border-black -rotate-45"></div>
                                <div className="w-8 h-8 bg-pink-200 rounded-full mx-auto mt-2 border-2 border-black"></div>
                            </div>
                        </div>
                    </div>

                    {!isKicking && (
                        <div 
                            className="absolute bg-yellow-400/80 rounded-full border-4 border-yellow-200 animate-pulse flex items-center justify-center shadow-[0_0_20px_rgba(255,255,0,0.5)]"
                            style={{ 
                                left: `${target.x}%`, 
                                top: `${target.y}%`, 
                                width: target.size, 
                                height: target.size,
                                transform: 'translate(-50%, -50%)'
                            }}
                        >
                            <span className="text-yellow-900 font-black text-xs">PUNTERÍA</span>
                        </div>
                    )}

                    {feedback && (
                        <div className="absolute inset-0 flex items-center justify-center z-30 pointer-events-none animate-zoomIn">
                            <h2 className={`text-6xl font-black italic uppercase tracking-tighter drop-shadow-2xl ${
                                feedback === 'GOAL' ? 'text-green-400' : feedback === 'SAVED' ? 'text-red-500' : 'text-gray-400'
                            }`}>
                                {feedback === 'GOAL' ? '¡GOLAZO!' : feedback === 'SAVED' ? '¡ATAJÓ!' : '¡AFUERA!'}
                            </h2>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};
