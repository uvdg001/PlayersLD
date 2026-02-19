
import React, { useState } from 'react';
import type { Player, MyTeam } from '../../types';

interface LDPuzzleProps {
    players: Player[];
    myTeam: MyTeam | null;
    onFinish: (score: number) => void;
    muted?: boolean;
}

type Difficulty = 'AMATEUR' | 'PRO' | 'CRACK';

const DIFF_CONFIG = {
    AMATEUR: { size: 3, label: 'Amateur', color: 'bg-green-600', bonus: 1, desc: '3x3 Piezas' },
    PRO: { size: 4, label: 'Profesional', color: 'bg-blue-600', bonus: 2, desc: '4x4 Piezas' },
    CRACK: { size: 5, label: 'Crack', color: 'bg-red-600', bonus: 4, desc: '5x5 Piezas' }
};

export const LDPuzzle: React.FC<LDPuzzleProps> = ({ players, myTeam, onFinish, muted }) => {
    const [grid, setGrid] = useState<number[]>([]);
    const [imgUrl, setImgUrl] = useState('');
    const [gameStarted, setGameStarted] = useState(false);
    const [score, setScore] = useState(0);
    const [moves, setMoves] = useState(0);
    const [difficulty, setDifficulty] = useState<Difficulty>('AMATEUR');
    const [showHelp, setShowHelp] = useState(false);

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
        const config = DIFF_CONFIG[diff];
        const randomPlayer = players[Math.floor(Math.random() * players.length)];
        setImgUrl(Math.random() > 0.4 ? (myTeam?.shieldUrl || randomPlayer.photoUrl) : randomPlayer.photoUrl);
        const totalTiles = config.size * config.size;
        let newGrid = Array.from({length: totalTiles}, (_, i) => i);
        const emptyIdxVal = totalTiles - 1;
        for (let i = 0; i < config.size * 60; i++) {
            const emptyPos = newGrid.indexOf(emptyIdxVal);
            const r = Math.floor(emptyPos / config.size), c = emptyPos % config.size;
            const moves = [];
            if (r > 0) moves.push(emptyPos - config.size);
            if (r < config.size - 1) moves.push(emptyPos + config.size);
            if (c > 0) moves.push(emptyPos - 1);
            if (c < config.size - 1) moves.push(emptyPos + 1);
            const moveIdx = moves[Math.floor(Math.random() * moves.length)];
            [newGrid[emptyPos], newGrid[moveIdx]] = [newGrid[moveIdx], newGrid[emptyPos]];
        }
        setDifficulty(diff);
        setGrid(newGrid);
        setMoves(0);
        setScore(600 * config.bonus);
        setGameStarted(true);
        setShowHelp(false);
        playSound(600, 0.2);
    };

    const handleTileClick = (idx: number) => {
        const config = DIFF_CONFIG[difficulty];
        const emptyIdxVal = (config.size * config.size) - 1;
        const emptyPos = grid.indexOf(emptyIdxVal);
        const r = Math.floor(idx / config.size), c = idx % config.size;
        const er = Math.floor(emptyPos / config.size), ec = emptyPos % config.size;
        if (Math.abs(r - er) + Math.abs(c - ec) === 1) {
            const newGrid = [...grid];
            [newGrid[idx], newGrid[emptyPos]] = [newGrid[emptyPos], newGrid[idx]];
            setGrid(newGrid);
            setMoves(m => m + 1);
            setScore(s => Math.max(100, s - 2));
            playSound(300, 0.1);
            if (newGrid.every((v, i) => v === i)) {
                playSound(880, 0.5);
                setGameStarted(false);
                onFinish(score);
            }
        }
    };

    return (
        <div className="w-full max-w-md mx-auto bg-amber-900 rounded-[2.5rem] p-6 shadow-2xl border-4 border-amber-700 text-center relative overflow-hidden min-h-[600px]">
            <div className="absolute inset-0 opacity-20 pointer-events-none bg-[url('https://www.transparenttextures.com/patterns/wood-pattern.png')]"></div>
            <div className="relative z-10 flex justify-between items-center mb-6">
                <div className="bg-black/60 p-3 rounded-2xl border border-white/10 shadow-xl"><p className="text-[10px] font-black text-amber-400 uppercase">Potencial</p><p className="text-2xl font-black text-white">{score}</p></div>
                <div className="bg-black/60 p-3 rounded-2xl border border-white/10 shadow-xl"><p className="text-[10px] font-black text-white uppercase">Pasos</p><p className="text-2xl font-black text-amber-400">{moves}</p></div>
            </div>
            {!gameStarted ? (
                <div className="h-[420px] flex flex-col items-center justify-center space-y-6">
                    <div className="text-7xl animate-bounce">🧩</div>
                    <h3 className="text-4xl font-black italic uppercase tracking-tighter text-white">PUZZLE LD</h3>
                    <p className="text-amber-400 text-xs font-black uppercase tracking-[0.3em] bg-black/30 px-4 py-1 rounded-full">Seleccionar Nivel</p>
                    <div className="grid grid-cols-1 gap-3 w-full px-4">
                        {(Object.keys(DIFF_CONFIG) as Difficulty[]).map(k => (
                            <button key={k} onClick={() => initGame(k)} className={`${DIFF_CONFIG[k].color} py-5 rounded-[1.5rem] font-black uppercase italic shadow-xl hover:scale-105 active:scale-95 transition-all text-white border-b-4 border-black/20`}>
                                {DIFF_CONFIG[k].label}
                                <span className="block text-[9px] opacity-70 not-italic">{DIFF_CONFIG[k].desc}</span>
                            </button>
                        ))}
                    </div>
                </div>
            ) : (
                <div className="relative space-y-6 animate-zoomIn">
                    <div className="grid gap-1 bg-black/40 p-1 rounded-2xl shadow-inner aspect-square overflow-hidden" style={{ gridTemplateColumns: `repeat(${DIFF_CONFIG[difficulty].size}, 1fr)` }}>
                        {grid.map((val, idx) => {
                            const config = DIFF_CONFIG[difficulty];
                            const emptyIdxVal = (config.size * config.size) - 1;
                            if (val === emptyIdxVal) return <div key="empty" className="bg-amber-950/20 rounded-lg"></div>;
                            const r = Math.floor(val / config.size), c = val % config.size;
                            const bx = (c / (config.size - 1)) * 100, by = (r / (config.size - 1)) * 100;
                            return (
                                <button key={val} onClick={() => handleTileClick(idx)} className="relative rounded-lg overflow-hidden border border-amber-800/30 transition-transform active:scale-95" style={{ backgroundImage: `url(${imgUrl})`, backgroundSize: `${config.size * 100}% ${config.size * 100}%`, backgroundPosition: `${bx}% ${by}%` }} />
                            );
                        })}
                    </div>
                    <div className="flex gap-3">
                        <button onPointerDown={() => setShowHelp(true)} onPointerUp={() => setShowHelp(false)} onPointerLeave={() => setShowHelp(false)} className="flex-1 py-4 bg-indigo-600 text-white font-black rounded-2xl text-xs uppercase shadow-lg active:scale-95 transition-all">Ver Original (Mantener)</button>
                        <button onClick={() => setGameStarted(false)} className="px-6 bg-gray-800 text-white rounded-2xl text-xs font-black uppercase">Salir</button>
                    </div>
                    {showHelp && (
                        <div className="absolute inset-0 z-50 p-4 bg-black/90 rounded-2xl animate-fadeIn flex flex-col items-center justify-center">
                            <p className="text-white font-black uppercase tracking-tighter mb-4 italic">Guía Visual</p>
                            <img src={imgUrl} className="max-w-full max-h-[80%] object-contain rounded-xl border-4 border-white shadow-2xl" alt="Help" />
                            <p className="text-white/50 text-[9px] font-bold uppercase mt-4">Soltá el botón para seguir jugando</p>
                        </div>
                    )}
                </div>
            )}
            <div className="mt-6"><p className="text-[10px] font-black text-amber-500 uppercase tracking-widest">{gameStarted ? 'Deslizá las piezas al hueco vacío' : ''}</p></div>
        </div>
    );
};
