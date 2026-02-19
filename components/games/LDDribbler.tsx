
import React, { useState, useEffect, useRef } from 'react';
import type { Player, MyTeam, Opponent } from '../../types.ts';

interface LDDribblerProps {
    players: Player[];
    myTeam: MyTeam | null;
    opponents: Opponent[];
    onFinish: (score: number) => void;
    muted?: boolean;
}

interface GameObject {
    id: number;
    x: number;
    y: number;
    size: number;
    type: 'PLAYER' | 'SHIELD' | 'RIVAL' | 'BALL';
    img: string;
    speedY: number;
    speedX: number;
    rotation: number;
    rotSpeed: number;
}

export const LDDribbler: React.FC<LDDribblerProps> = ({ players, myTeam, opponents, onFinish, muted }) => {
    const [score, setScore] = useState(0);
    const [combo, setCombo] = useState(0);
    const [timeLeft, setTimeLeft] = useState(35);
    const [objects, setObjects] = useState<GameObject[]>([]);
    const [gameStarted, setGameStarted] = useState(false);
    const [level, setLevel] = useState(1);
    const [showLevelUp, setShowLevelUp] = useState(false);
    
    const containerRef = useRef<HTMLDivElement>(null);
    const requestRef = useRef<number>(0);
    const lastSpawnRef = useRef<number>(0);

    const playSound = (freq: number, dur: number, type: OscillatorType = 'sine') => {
        if (muted) return;
        try {
            const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.type = type;
            osc.frequency.value = freq;
            gain.gain.setValueAtTime(0.05, ctx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + dur);
            osc.connect(gain);
            gain.connect(ctx.destination);
            osc.start();
            osc.stop(ctx.currentTime + dur);
        } catch (e) {}
    };

    const getSpawnRate = () => Math.max(250, 850 - (level * 90)); 
    const getSpeedBoost = () => 1 + (level * 0.15); 

    const startGame = () => {
        setScore(0);
        setCombo(0);
        setLevel(1);
        setTimeLeft(35);
        setObjects([]);
        setGameStarted(true);
        playSound(600, 0.2);
    };

    const spawnObject = () => {
        if (!containerRef.current) return;
        const { width, height } = containerRef.current.getBoundingClientRect();
        
        const rand = Math.random();
        let type: GameObject['type'] = 'PLAYER';
        let img = '';
        let size = 65; 

        const rivalProb = 0.75 - (level * 0.04); 

        if (rand > 0.93) {
            type = 'SHIELD';
            img = myTeam?.shieldUrl || '';
            size = 85;
        } else if (rand > rivalProb && opponents.length > 0) {
            type = 'RIVAL';
            const rival = opponents[Math.floor(Math.random() * opponents.length)];
            img = rival.shieldUrl || '';
            size = 80;
        } else if (rand > 0.5) {
            type = 'BALL';
            img = 'https://cdn-icons-png.flaticon.com/512/53/53283.png';
            size = 55;
        } else {
            const p = players[Math.floor(Math.random() * players.length)];
            img = p.photoUrl;
        }

        const speedMultiplier = getSpeedBoost();

        const newObj: GameObject = {
            id: Date.now() + Math.random(),
            x: Math.random() * (width - size),
            y: height + 20, 
            size,
            type,
            img,
            speedY: -(Math.random() * 5 + 13) * speedMultiplier,
            speedX: (Math.random() - 0.5) * 5 * speedMultiplier,
            rotation: 0,
            rotSpeed: (Math.random() - 0.5) * 15
        };

        setObjects(prev => [...prev, newObj]);
    };

    const update = (time: number) => {
        if (time - lastSpawnRef.current > getSpawnRate()) {
            spawnObject();
            lastSpawnRef.current = time;
        }

        setObjects(prev => prev.map(obj => ({
            ...obj,
            y: obj.y + obj.speedY,
            x: obj.x + obj.speedX,
            speedY: obj.speedY + 0.32,
            rotation: obj.rotation + obj.rotSpeed
        })).filter(obj => obj.y < 820));

        requestRef.current = requestAnimationFrame(update);
    };

    useEffect(() => {
        const newLevel = Math.floor(score / 200) + 1;
        if (newLevel > level) {
            setLevel(newLevel);
            setShowLevelUp(true);
            playSound(1000, 0.4);
            setTimeout(() => setShowLevelUp(false), 1200);
        }
    }, [score, level]);

    useEffect(() => {
        if (gameStarted && timeLeft > 0) {
            requestRef.current = requestAnimationFrame(update);
            const timer = setInterval(() => setTimeLeft(prev => prev - 1), 1000);
            return () => {
                if (requestRef.current) cancelAnimationFrame(requestRef.current);
                clearInterval(timer);
            };
        } else if (timeLeft === 0 && gameStarted) {
            playSound(200, 0.6, 'square');
            setGameStarted(false);
            onFinish(score);
        }
    }, [gameStarted, timeLeft]);

    const handleHit = (obj: GameObject) => {
        if (obj.type === 'RIVAL') {
            playSound(150, 0.3, 'sawtooth');
            setScore(prev => Math.max(0, prev - 75));
            setTimeLeft(prev => Math.max(0, prev - 4));
            setCombo(0);
            if (containerRef.current) {
                containerRef.current.classList.add('animate-shake');
                setTimeout(() => containerRef.current?.classList.remove('animate-shake'), 300);
            }
        } else {
            const points = obj.type === 'SHIELD' ? 60 : 15;
            const comboBonus = Math.floor(combo / 4) * 10;
            playSound(400 + (combo * 50), 0.1);
            setScore(prev => prev + points + comboBonus);
            setCombo(prev => prev + 1);
        }
        setObjects(prev => prev.filter(o => o.id !== obj.id));
    };

    return (
        <div ref={containerRef} className="relative w-full h-[720px] mb-12 bg-indigo-950 rounded-[2.5rem] overflow-hidden shadow-[0_20px_50px_rgba(0,0,0,0.5)] border-4 border-indigo-800 select-none transition-all duration-300" style={{ touchAction: 'manipulation' }}>
            <div className="absolute inset-0 opacity-20 pointer-events-none" style={{ backgroundImage: 'url("https://www.transparenttextures.com/patterns/fake-grass.png")' }}></div>
            
            <div className="absolute top-4 left-0 right-0 flex justify-between px-6 z-20 pointer-events-none">
                <div className="flex gap-3">
                    <div className="bg-black/70 backdrop-blur-md p-3 rounded-2xl border border-white/20 shadow-2xl">
                        <p className="text-[9px] font-black text-indigo-300 uppercase tracking-widest mb-1">Score</p>
                        <p className="text-2xl font-black text-white leading-none">{score}</p>
                    </div>
                    {combo > 2 && (
                        <div className="bg-orange-500 text-white p-3 rounded-2xl border border-orange-400 shadow-xl animate-bounce">
                            <p className="text-[9px] font-black uppercase">🔥 x{combo}</p>
                        </div>
                    )}
                </div>

                <div className="flex flex-col items-end gap-2">
                    <div className="bg-black/70 backdrop-blur-md p-3 rounded-2xl border border-white/20 text-right shadow-2xl">
                        <p className="text-[9px] font-black text-red-400 uppercase tracking-widest mb-1">Tiempo</p>
                        <p className={`text-2xl font-black leading-none ${timeLeft < 10 ? 'text-red-500 animate-pulse' : 'text-white'}`}>{timeLeft}s</p>
                    </div>
                    <div className="bg-indigo-600 px-4 py-1 rounded-full border border-indigo-400 shadow-md">
                        <p className="text-[9px] font-black text-white uppercase italic">Nivel {level}</p>
                    </div>
                </div>
            </div>

            {showLevelUp && (
                <div className="absolute inset-0 flex items-center justify-center z-40 pointer-events-none">
                    <h2 className="text-6xl font-black text-yellow-400 italic uppercase tracking-tighter drop-shadow-2xl animate-ping">GOOOOOL!</h2>
                </div>
            )}

            {!gameStarted ? (
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-indigo-900/90 backdrop-blur-xl z-30 p-8 text-center">
                    <div className="w-24 h-24 mb-6 animate-pulse">
                        <img src={myTeam?.shieldUrl || ''} className="w-full h-full object-contain filter drop-shadow-2xl" alt="LD" />
                    </div>
                    <h3 className="text-5xl font-black text-white uppercase italic tracking-tighter mb-2">DRIBELADOR LD</h3>
                    <div className="h-1 w-20 bg-yellow-400 mb-6 mx-auto rounded-full"></div>
                    <p className="text-indigo-100 text-[11px] mb-8 max-w-xs leading-relaxed font-bold uppercase tracking-[0.2em]">
                        TOCA A TUS COMPAÑEROS<br/>
                        RECOGE EL ESCUDO PARA BONUS<br/>
                        <span className="text-red-500 font-black">⚠️ EVITA A LOS RIVALES</span>
                    </p>
                    <button 
                        onClick={startGame}
                        className="px-12 py-5 bg-white text-indigo-950 font-black rounded-3xl text-2xl shadow-[0_15px_30px_rgba(255,255,255,0.2)] hover:scale-105 active:scale-95 transition-all uppercase italic tracking-tighter"
                    >
                        Pisar la Pelota
                    </button>
                </div>
            ) : (
                <div className="relative w-full h-full">
                    {objects.map(obj => (
                        <div
                            key={obj.id}
                            onPointerDown={(e) => {
                                e.preventDefault();
                                handleHit(obj);
                            }}
                            className={`absolute cursor-pointer transition-transform active:scale-75 ${obj.type === 'SHIELD' ? 'animate-pulse' : ''}`}
                            style={{
                                left: obj.x,
                                top: obj.y,
                                width: obj.size,
                                height: obj.size,
                                transform: `rotate(${obj.rotation}deg)`,
                                zIndex: 10
                            }}
                        >
                            <div className={`relative w-full h-full rounded-full border-[4px] overflow-hidden shadow-2xl ${
                                obj.type === 'RIVAL' ? 'border-red-600 bg-red-950' : 
                                obj.type === 'SHIELD' ? 'border-yellow-400 bg-white' : 
                                'border-white bg-indigo-800'
                            }`}>
                                <img 
                                    src={obj.img} 
                                    className={`w-full h-full object-cover ${obj.type === 'RIVAL' ? 'grayscale brightness-75' : ''}`} 
                                    alt=""
                                />
                                {obj.type === 'RIVAL' && (
                                    <div className="absolute inset-0 flex items-center justify-center bg-red-600/30">
                                        <span className="text-white text-4xl font-black drop-shadow-lg">✕</span>
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            )}

            <style dangerouslySetInnerHTML={{ __html: `
                @keyframes shake {
                    0% { transform: translate(2px, 2px) rotate(0deg); }
                    10% { transform: translate(-2px, -4px) rotate(-1deg); }
                    20% { transform: translate(-6px, 0px) rotate(1deg); }
                    30% { transform: translate(6px, 4px) rotate(0deg); }
                    40% { transform: translate(2px, -2px) rotate(1deg); }
                    50% { transform: translate(-2px, 4px) rotate(-1deg); }
                    100% { transform: translate(0,0) rotate(0); }
                }
                .animate-shake {
                    animation: shake 0.3s cubic-bezier(.36,.07,.19,.97) both;
                }
            `}} />
        </div>
    );
};
