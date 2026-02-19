
import React, { useState, useCallback } from 'react';
import type { Player } from '../../types';

interface LDSequenceProps {
    players: Player[];
    onFinish: (score: number) => void;
    muted?: boolean;
}

type GameState = 'IDLE' | 'SHOWING' | 'INPUTTING' | 'GAMEOVER';
type Difficulty = 'EASY' | 'MEDIUM' | 'HARD';

const DIFF_CONFIG = {
    EASY: { count: 4, bonus: 1, label: 'Amateur', color: 'bg-green-600', desc: '4 Jugadores' },
    MEDIUM: { count: 6, bonus: 2, label: 'Profesional', color: 'bg-blue-600', desc: '6 Jugadores' },
    HARD: { count: 8, bonus: 4, label: 'Crack', color: 'bg-red-600', desc: '8 Jugadores' }
};

const BUTTON_COLORS = ['border-red-500', 'border-green-500', 'border-yellow-400', 'border-white', 'border-orange-500', 'border-cyan-400', 'border-purple-500', 'border-blue-600'];
const LIGHT_COLORS = ['bg-red-500/40', 'bg-green-500/40', 'bg-yellow-400/40', 'bg-white/40', 'bg-orange-500/40', 'bg-cyan-400/40', 'bg-purple-500/40', 'bg-blue-600/40'];

export const LDSequence: React.FC<LDSequenceProps> = ({ players, onFinish, muted }) => {
    const [gamePlayers, setGamePlayers] = useState<Player[]>([]);
    const [sequence, setSequence] = useState<number[]>([]);
    const [userSequence, setUserSequence] = useState<number[]>([]);
    const [gameState, setGameState] = useState<GameState>('IDLE');
    const [activeIndex, setActiveIndex] = useState<number | null>(null);
    const [score, setScore] = useState(0);
    const [difficulty, setDifficulty] = useState<Difficulty | null>(null);

    const playSound = (freq: number, dur: number, type: OscillatorType = 'sine') => {
        if (muted) return;
        try {
            const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.type = type;
            osc.frequency.setValueAtTime(freq, ctx.currentTime);
            gain.gain.setValueAtTime(0.1, ctx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + dur);
            osc.connect(gain);
            gain.connect(ctx.destination);
            osc.start();
            osc.stop(ctx.currentTime + dur);
        } catch (e) {}
    };

    const playSequence = useCallback(async (currentSeq: number[]) => {
        setGameState('SHOWING');
        const waitTime = difficulty === 'HARD' ? 200 : 400;
        const flashTime = difficulty === 'HARD' ? 300 : 500;
        for (let i = 0; i < currentSeq.length; i++) {
            await new Promise(r => setTimeout(r, waitTime));
            setActiveIndex(currentSeq[i]);
            playSound(400 + (currentSeq[i] * 80), 0.2);
            await new Promise(r => setTimeout(r, flashTime));
            setActiveIndex(null);
        }
        setGameState('INPUTTING');
        setUserSequence([]);
    }, [difficulty, muted]);

    const startNewRound = useCallback(() => {
        const pCount = difficulty ? DIFF_CONFIG[difficulty].count : 4;
        const nextMove = Math.floor(Math.random() * pCount);
        const newSeq = [...sequence, nextMove];
        setSequence(newSeq);
        playSequence(newSeq);
    }, [sequence, playSequence, difficulty]);

    const handleStart = (diff: Difficulty) => {
        setDifficulty(diff);
        setScore(0);
        setSequence([]);
        setUserSequence([]);
        const pCount = DIFF_CONFIG[diff].count;
        const shuffled = [...players].sort(() => 0.5 - Math.random());
        setGamePlayers(shuffled.slice(0, pCount));
        const initialMove = Math.floor(Math.random() * pCount);
        setSequence([initialMove]);
        setGameState('SHOWING');
        setTimeout(() => playSequence([initialMove]), 500);
    };

    const handlePlayerClick = (index: number) => {
        if (gameState !== 'INPUTTING') return;
        setActiveIndex(index);
        playSound(400 + (index * 80), 0.1);
        setTimeout(() => setActiveIndex(null), 120);
        const newUserSeq = [...userSequence, index];
        setUserSequence(newUserSeq);
        if (index !== sequence[newUserSeq.length - 1]) {
            playSound(150, 0.4, 'sawtooth');
            setGameState('GAMEOVER');
            onFinish(score);
            return;
        }
        if (newUserSeq.length === sequence.length) {
            playSound(800, 0.15);
            const multiplier = difficulty ? DIFF_CONFIG[difficulty].bonus : 1;
            setScore(prev => prev + (sequence.length * 10 * multiplier));
            setTimeout(() => startNewRound(), 800);
        }
    };

    return (
        <div className="w-full max-w-md mx-auto bg-gray-950 rounded-[3rem] p-6 shadow-2xl border-4 border-cyan-800 text-center relative overflow-hidden min-h-[580px]">
            <div className="absolute inset-0 opacity-10 pointer-events-none bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')]"></div>
            <div className="relative z-10 flex justify-between items-center mb-6">
                <div className="bg-black/60 p-3 rounded-2xl border border-white/10 shadow-xl"><p className="text-[10px] font-black text-cyan-400 uppercase">Créditos</p><p className="text-2xl font-black text-white">{score}</p></div>
                <div className="bg-black/60 p-3 rounded-2xl border border-white/10 shadow-xl"><p className="text-[10px] font-black text-yellow-400 uppercase">Ronda</p><p className="text-2xl font-black text-white">{sequence.length}</p></div>
            </div>
            {gameState === 'IDLE' ? (
                <div className="h-[420px] flex flex-col items-center justify-center space-y-6">
                    <div className="text-7xl animate-pulse">🧠</div>
                    <h3 className="text-4xl font-black italic uppercase tracking-tighter text-white">SECUENCIA LD</h3>
                    <p className="text-cyan-400 text-xs font-black uppercase tracking-[0.3em] bg-cyan-900/30 px-4 py-1 rounded-full">Seleccionar Nivel</p>
                    <div className="grid grid-cols-1 gap-3 w-full px-4">
                        {(Object.keys(DIFF_CONFIG) as Difficulty[]).map(k => (
                            <button key={k} onClick={() => handleStart(k)} className={`${DIFF_CONFIG[k].color} py-5 rounded-[1.5rem] font-black uppercase italic shadow-xl hover:scale-105 active:scale-95 transition-all text-white border-b-4 border-black/20`}>
                                {DIFF_CONFIG[k].label}
                                <span className="block text-[9px] opacity-70 not-italic">{DIFF_CONFIG[k].desc} • x{DIFF_CONFIG[k].bonus} Puntos</span>
                            </button>
                        ))}
                    </div>
                </div>
            ) : gameState === 'GAMEOVER' ? (
                <div className="h-[420px] flex flex-col items-center justify-center space-y-6 animate-fadeIn">
                    <div className="text-7xl">❌</div><h3 className="text-4xl font-black italic uppercase tracking-tighter text-red-500">¡TE EQUIVOCASTE!</h3>
                    <button onClick={() => setGameState('IDLE')} className="px-10 py-5 bg-white text-gray-900 font-black rounded-2xl text-xl shadow-xl hover:scale-105 active:scale-95 transition-all uppercase">Reintentar</button>
                </div>
            ) : (
                <div className={`grid ${gamePlayers.length <= 4 ? 'grid-cols-2' : 'grid-cols-3'} gap-3 h-[380px] content-center animate-zoomIn`}>
                    {gamePlayers.map((player, idx) => (
                        <button key={player.id} onClick={() => handlePlayerClick(idx)} disabled={gameState === 'SHOWING'} className={`relative rounded-2xl overflow-hidden border-4 transition-all transform ${activeIndex === idx ? 'border-white scale-105 shadow-[0_0_25px_rgba(255,255,255,0.8)] z-20 brightness-125' : `${BUTTON_COLORS[idx]} scale-100 brightness-75`} aspect-square`}>
                            <img src={player.photoUrl} alt="" className="w-full h-full object-cover" />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent"></div>
                            <p className="absolute bottom-1 left-0 right-0 text-[8px] font-black text-white uppercase truncate px-1">{player.nickname}</p>
                            {activeIndex === idx && <div className={`absolute inset-0 ${LIGHT_COLORS[idx]} animate-pulse`}></div>}
                        </button>
                    ))}
                </div>
            )}
            <div className="mt-6"><p className={`text-sm font-black uppercase tracking-widest ${gameState === 'SHOWING' ? 'text-yellow-400 animate-pulse' : gameState === 'INPUTTING' ? 'text-green-400 animate-bounce' : 'text-gray-500'}`}>{gameState === 'SHOWING' ? '👀 MIRÁ BIEN...' : gameState === 'INPUTTING' ? '👉 TU TURNO' : ''}</p></div>
        </div>
    );
};
