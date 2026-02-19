
import React, { useState, useEffect } from 'react';
import type { Player, MyTeam, Opponent } from '../../types.ts';

interface LDMahjongProps {
    players: Player[];
    myTeam: MyTeam | null;
    opponents: Opponent[];
    onFinish: (score: number) => void;
    muted?: boolean;
}

interface Tile {
    id: number;
    img: string;
    isFlipped: boolean;
    isMatched: boolean;
    pairId: string;
}

type Difficulty = 'EASY' | 'MEDIUM' | 'HARD';

const DIFFICULTY_CONFIG = {
    EASY: { pairs: 6, cols: 'grid-cols-3', pointsPerPair: 20, time: 60, label: 'Amateur', color: 'bg-blue-600' },
    MEDIUM: { pairs: 8, cols: 'grid-cols-4', pointsPerPair: 50, time: 60, label: 'Profesional', color: 'bg-green-600' },
    HARD: { pairs: 12, cols: 'grid-cols-4', pointsPerPair: 100, time: 90, label: 'Crack', color: 'bg-red-600' }
};

export const LDMahjong: React.FC<LDMahjongProps> = ({ players, myTeam, opponents, onFinish, muted }) => {
    const [tiles, setTiles] = useState<Tile[]>([]);
    const [flippedIndices, setFlippedIndices] = useState<number[]>([]);
    const [score, setScore] = useState(0);
    const [timeLeft, setTimeLeft] = useState(60);
    const [gameStarted, setGameStarted] = useState(false);
    const [matchesCount, setMatchesCount] = useState(0);
    const [currentDifficulty, setCurrentDifficulty] = useState<Difficulty>('MEDIUM');

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

    const initGame = (diff: Difficulty) => {
        const config = DIFFICULTY_CONFIG[diff];
        const numPairs = config.pairs;
        
        const items = [];
        items.push({ id: 'shield', img: myTeam?.shieldUrl || '' });
        opponents.slice(0, 3).forEach(o => {
            if (items.length < numPairs) items.push({ id: `rival-${o.id}`, img: o.shieldUrl || '' });
        });

        const pool = [...players].sort(() => 0.5 - Math.random());
        while (items.length < numPairs && pool.length > 0) {
            const p = pool.pop();
            if (p) items.push({ id: `player-${p.id}`, img: p.photoUrl });
        }

        const gameTiles: Tile[] = [...items, ...items].map((item, index) => ({
            id: index,
            pairId: item.id,
            img: item.img,
            isFlipped: false,
            isMatched: false
        })).sort(() => 0.5 - Math.random());

        setTiles(gameTiles);
        setScore(0);
        setMatchesCount(0);
        setTimeLeft(config.time);
        setCurrentDifficulty(diff);
        setGameStarted(true);
        playSound(600, 0.2);
    };

    useEffect(() => {
        let timer: number;
        if (gameStarted && timeLeft > 0) {
            timer = window.setInterval(() => setTimeLeft(prev => prev - 1), 1000);
        } else if (timeLeft === 0 && gameStarted) {
            playSound(150, 0.5, 'square');
            onFinish(score);
            setGameStarted(false);
        }
        return () => clearInterval(timer);
    }, [gameStarted, timeLeft]);

    const handleTileClick = (index: number) => {
        if (flippedIndices.length === 2 || tiles[index].isFlipped || tiles[index].isMatched) return;
        
        const newTiles = [...tiles];
        newTiles[index].isFlipped = true;
        setTiles(newTiles);
        playSound(440, 0.1);
        
        const newFlipped = [...flippedIndices, index];
        setFlippedIndices(newFlipped);

        if (newFlipped.length === 2) {
            const [first, second] = newFlipped;
            const config = DIFFICULTY_CONFIG[currentDifficulty];

            if (tiles[first].pairId === tiles[second].pairId) {
                setTimeout(() => {
                    const matchedTiles = [...tiles];
                    matchedTiles[first].isMatched = true;
                    matchedTiles[second].isMatched = true;
                    setTiles(matchedTiles);
                    setFlippedIndices([]);
                    playSound(880, 0.3);
                    
                    const newScore = score + config.pointsPerPair;
                    setScore(newScore);
                    setMatchesCount(prev => prev + 1);
                    
                    if (matchesCount + 1 === config.pairs) {
                        playSound(1200, 0.5);
                        const timeBonus = timeLeft * (currentDifficulty === 'HARD' ? 10 : 5);
                        onFinish(newScore + timeBonus);
                        setGameStarted(false);
                    }
                }, 500);
            } else {
                setTimeout(() => {
                    const resetTiles = [...tiles];
                    resetTiles[first].isFlipped = false;
                    resetTiles[second].isFlipped = false;
                    setTiles(resetTiles);
                    setFlippedIndices([]);
                    playSound(200, 0.3, 'sine');
                    setScore(prev => Math.max(0, prev - 2));
                }, 800);
            }
        }
    };

    return (
        <div className="relative w-full max-w-lg mx-auto bg-indigo-950 rounded-3xl p-4 shadow-2xl border-4 border-indigo-900 overflow-hidden min-h-[500px]">
            <div className="absolute inset-0 opacity-10 pointer-events-none bg-[url('https://www.transparenttextures.com/patterns/cubes.png')]"></div>
            
            {!gameStarted ? (
                <div className="relative z-10 h-full flex flex-col items-center justify-center text-center p-6 space-y-8 min-h-[460px]">
                    <div className="space-y-2">
                        <span className="text-7xl block animate-bounce">🃏</span>
                        <h3 className="text-4xl font-black italic uppercase tracking-tighter text-white">Parejas LD</h3>
                        <p className="text-indigo-300 text-sm font-bold uppercase tracking-widest">Elige tu nivel de entrenamiento</p>
                    </div>

                    <div className="grid grid-cols-1 gap-3 w-full max-w-xs">
                        {(Object.keys(DIFFICULTY_CONFIG) as Difficulty[]).map((key) => {
                            const conf = DIFFICULTY_CONFIG[key];
                            return (
                                <button 
                                    key={key}
                                    onClick={() => initGame(key)}
                                    className={`${conf.color} text-white p-4 rounded-2xl flex justify-between items-center hover:scale-105 transition-transform active:scale-95 shadow-lg group`}
                                >
                                    <div className="text-left">
                                        <p className="font-black uppercase tracking-tighter text-lg leading-none">{conf.label}</p>
                                        <p className="text-[10px] opacity-80 font-bold uppercase">{conf.pairs} PAREJAS • {conf.pointsPerPair} PTS</p>
                                    </div>
                                    <span className="text-2xl group-hover:translate-x-1 transition-transform">⚽</span>
                                </button>
                            );
                        })}
                    </div>
                </div>
            ) : (
                <div className="relative z-10 h-full flex flex-col">
                    <div className="flex justify-between items-center mb-4 px-2">
                        <div className="bg-black/40 px-4 py-2 rounded-xl border border-white/10">
                            <p className="text-[10px] font-black text-indigo-300 uppercase">Créditos</p>
                            <p className="text-2xl font-black text-yellow-400 leading-none">{score}</p>
                        </div>
                        <div className="text-center">
                            <p className="text-[10px] font-black text-indigo-300 uppercase italic">{DIFFICULTY_CONFIG[currentDifficulty].label}</p>
                            <p className="text-xs font-bold text-white">{matchesCount} / {DIFFICULTY_CONFIG[currentDifficulty].pairs}</p>
                        </div>
                        <div className="bg-black/40 px-4 py-2 rounded-xl border border-white/10 text-right">
                            <p className="text-[10px] font-black text-red-400 uppercase">Tiempo</p>
                            <p className={`text-2xl font-black leading-none ${timeLeft < 10 ? 'text-red-500 animate-pulse' : 'text-white'}`}>{timeLeft}s</p>
                        </div>
                    </div>

                    <div className={`grid ${DIFFICULTY_CONFIG[currentDifficulty].cols} gap-2 flex-1`}>
                        {tiles.map((tile, i) => (
                            <div 
                                key={tile.id} 
                                onClick={() => handleTileClick(i)} 
                                className={`relative aspect-square cursor-pointer transition-all duration-500 [transform-style:preserve-3d] ${tile.isFlipped || tile.isMatched ? '[transform:rotateY(180deg)]' : ''}`}
                            >
                                <div className="absolute inset-0 bg-indigo-800 border-2 border-indigo-500 rounded-xl flex items-center justify-center text-indigo-300 font-black [backface-visibility:hidden] shadow-md hover:bg-indigo-700 transition-colors">
                                    <span className="text-xl">?</span>
                                </div>
                                <div className="absolute inset-0 bg-white border-2 border-yellow-400 rounded-xl [transform:rotateY(180deg)] [backface-visibility:hidden] overflow-hidden">
                                    <img src={tile.img} className={`w-full h-full object-cover ${tile.isMatched ? 'grayscale opacity-50' : ''}`} alt="memory-tile" />
                                    {tile.isMatched && (
                                        <div className="absolute inset-0 flex items-center justify-center bg-green-500/20">
                                            <span className="text-white text-3xl font-black drop-shadow-[0_2px_4px_rgba(0,0,0,0.5)]">✓</span>
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>

                    <button 
                        onClick={() => { if(window.confirm('¿Abandonar partida?')) setGameStarted(false); }}
                        className="mt-4 text-[10px] font-black text-indigo-400 uppercase tracking-widest hover:text-white transition-colors"
                    >
                        ✖ Salir del juego
                    </button>
                </div>
            )}
        </div>
    );
};
