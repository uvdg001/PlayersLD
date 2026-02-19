
import React, { useState, useEffect, useRef } from 'react';
import type { Player, MyTeam } from '../../types.ts';

interface LDMagicLinesProps {
    players: Player[];
    myTeam: MyTeam | null;
    onFinish: (score: number) => void;
    muted?: boolean;
}

interface Point { x: number; y: number; }
interface Line { points: Point[]; }

export const LDMagicLines: React.FC<LDMagicLinesProps> = ({ players, myTeam, onFinish, muted }) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [gameState, setGameState] = useState<'START' | 'TUTORIAL' | 'PLAYING' | 'SUCCESS'>('START');
    const [score, setScore] = useState(0);
    const [isPhysicsEnabled, setIsPhysicsEnabled] = useState(false);
    const [currentLevel, setCurrentLevel] = useState(1);
    const [showHelp, setShowHelp] = useState(false);
    
    const ballRef = useRef({ x: 50, y: 80, vx: 0, vy: 0, r: 24, startX: 50, startY: 80 });
    const linesRef = useRef<Line[]>([]);
    const currentLineRef = useRef<Point[]>([]);
    const targetRef = useRef({ x: 300, y: 550, w: 80, h: 80 });
    const obstaclesRef = useRef<{ x: number, y: number, r: number }[]>([]);
    const requestRef = useRef<number>(0);
    const activePlayerImgRef = useRef<HTMLImageElement | null>(null);

    const playSound = (freq: number, dur: number, vol: number = 0.1) => {
        if (muted) return;
        try {
            const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
            const osc = ctx.createOscillator();
            const g = ctx.createGain();
            osc.frequency.value = freq;
            osc.connect(g);
            g.connect(ctx.destination);
            osc.start();
            g.gain.setValueAtTime(vol, ctx.currentTime);
            g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + dur);
            osc.stop(ctx.currentTime + dur);
        } catch (e) {}
    };

    const initLevel = (resetScore = false) => {
        if (resetScore) {
            setScore(0);
            setCurrentLevel(1);
        }
        linesRef.current = [];
        currentLineRef.current = [];
        setIsPhysicsEnabled(false);
        
        // Pelota aleatoria
        const img = new Image();
        if (Math.random() > 0.5 && myTeam?.shieldUrl) {
            img.src = myTeam.shieldUrl;
        } else {
            const player = players[Math.floor(Math.random() * players.length)];
            img.src = player.photoUrl;
        }
        activePlayerImgRef.current = img;

        // Configuración de mapa
        const startX = 50 + Math.random() * 300;
        ballRef.current = { x: startX, y: 80, vx: 0, vy: 0, r: 24, startX, startY: 80 };
        targetRef.current = { 
            x: 50 + Math.random() * 250, 
            y: 500 + Math.random() * 80, 
            w: 90, h: 90 
        };

        obstaclesRef.current = [];
        const numObs = Math.min(currentLevel - 1, 6);
        for (let i = 0; i < numObs; i++) {
            obstaclesRef.current.push({
                x: 50 + Math.random() * 300,
                y: 150 + Math.random() * 300,
                r: 15 + Math.random() * 25
            });
        }
    };

    const stopPhysics = () => {
        setIsPhysicsEnabled(false);
        ballRef.current.x = ballRef.current.startX;
        ballRef.current.y = ballRef.current.startY;
        ballRef.current.vx = 0;
        ballRef.current.vy = 0;
    };

    const update = () => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d')!;

        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = '#0f172a';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        // Rejilla
        ctx.strokeStyle = '#1e293b'; ctx.lineWidth = 1;
        for(let i=0; i<canvas.width; i+=40) { ctx.beginPath(); ctx.moveTo(i, 0); ctx.lineTo(i, canvas.height); ctx.stroke(); }
        for(let i=0; i<canvas.height; i+=40) { ctx.beginPath(); ctx.moveTo(0, i); ctx.lineTo(canvas.width, i); ctx.stroke(); }

        // Objetivo
        ctx.fillStyle = '#22c55e22'; ctx.strokeStyle = '#22c55e'; ctx.lineWidth = 3;
        ctx.setLineDash([5, 5]);
        ctx.strokeRect(targetRef.current.x, targetRef.current.y, targetRef.current.w, targetRef.current.h);
        ctx.fillRect(targetRef.current.x, targetRef.current.y, targetRef.current.w, targetRef.current.h);
        ctx.setLineDash([]);
        ctx.fillStyle = '#22c55e'; ctx.font = 'bold 14px Inter';
        ctx.fillText('ARCO', targetRef.current.x + 25, targetRef.current.y + 50);

        // Líneas
        ctx.lineCap = 'round'; ctx.lineJoin = 'round'; ctx.shadowBlur = 8;
        ctx.shadowColor = '#6366f1'; ctx.strokeStyle = '#818cf8'; ctx.lineWidth = 6;
        linesRef.current.forEach(line => {
            if (line.points.length < 2) return;
            ctx.beginPath(); ctx.moveTo(line.points[0].x, line.points[0].y);
            line.points.forEach(p => ctx.lineTo(p.x, p.y)); ctx.stroke();
        });
        if (currentLineRef.current.length > 1) {
            ctx.strokeStyle = '#f472b6'; ctx.beginPath(); ctx.moveTo(currentLineRef.current[0].x, currentLineRef.current[0].y);
            currentLineRef.current.forEach(p => ctx.lineTo(p.x, p.y)); ctx.stroke();
        }
        ctx.shadowBlur = 0;

        // Obstáculos
        ctx.fillStyle = '#334155';
        obstaclesRef.current.forEach(obs => {
            ctx.beginPath(); ctx.arc(obs.x, obs.y, obs.r, 0, Math.PI * 2); ctx.fill();
            ctx.strokeStyle = '#475569'; ctx.stroke();
        });

        // Física
        if (isPhysicsEnabled) {
            const ball = ballRef.current;
            ball.vy += 0.3; // Gravedad
            ball.x += ball.vx; ball.y += ball.vy;
            ball.vx *= 0.99; ball.vy *= 0.99;

            if (ball.x < ball.r) { ball.x = ball.r; ball.vx *= -0.5; }
            if (ball.x > canvas.width - ball.r) { ball.x = canvas.width - ball.r; ball.vx *= -0.5; }
            if (ball.y > canvas.height + 50) { stopPhysics(); playSound(100, 0.2); }

            // Colisión líneas
            linesRef.current.forEach(line => {
                for (let i = 0; i < line.points.length - 1; i++) {
                    const p1 = line.points[i]; const p2 = line.points[i+1];
                    const dx = p2.x - p1.x; const dy = p2.y - p1.y;
                    const l2 = dx*dx + dy*dy;
                    let t = ((ball.x - p1.x) * dx + (ball.y - p1.y) * dy) / l2;
                    t = Math.max(0, Math.min(1, t));
                    const cx = p1.x + t * dx; const cy = p1.y + t * dy;
                    const ddx = ball.x - cx; const ddy = ball.y - cy;
                    const dist = Math.sqrt(ddx*ddx + ddy*ddy);
                    if (dist < ball.r) {
                        const angle = Math.atan2(ddy, ddx);
                        ball.x = cx + Math.cos(angle) * ball.r;
                        ball.y = cy + Math.sin(angle) * ball.r;
                        const nx = Math.cos(angle); const ny = Math.sin(angle);
                        const dot = ball.vx * nx + ball.vy * ny;
                        ball.vx = (ball.vx - 2 * dot * nx) * 0.6;
                        ball.vy = (ball.vy - 2 * dot * ny) * 0.6;
                        if (Math.abs(ball.vy) > 1) playSound(400 + Math.random()*100, 0.05, 0.02);
                    }
                }
            });

            // Colisión obstáculos
            obstaclesRef.current.forEach(obs => {
                const dx = ball.x - obs.x; const dy = ball.y - obs.y;
                const dist = Math.sqrt(dx*dx + dy*dy);
                if (dist < ball.r + obs.r) {
                    const angle = Math.atan2(dy, dx);
                    ball.x = obs.x + Math.cos(angle) * (ball.r + obs.r);
                    ball.y = obs.y + Math.sin(angle) * (ball.r + obs.r);
                    const nx = Math.cos(angle); const ny = Math.sin(angle);
                    const dot = ball.vx * nx + ball.vy * ny;
                    ball.vx = (ball.vx - 2 * dot * nx) * 0.5;
                    ball.vy = (ball.vy - 2 * dot * ny) * 0.5;
                }
            });

            // Victoria
            if (ball.x > targetRef.current.x && ball.x < targetRef.current.x + targetRef.current.w &&
                ball.y > targetRef.current.y && ball.y < targetRef.current.y + targetRef.current.h) {
                setIsPhysicsEnabled(false);
                setGameState('SUCCESS');
                playSound(880, 0.5, 0.2);
            }
        }

        // Pelota
        ctx.save();
        ctx.translate(ballRef.current.x, ballRef.current.y);
        ctx.beginPath(); ctx.arc(0, 0, ballRef.current.r, 0, Math.PI * 2); ctx.clip();
        if (activePlayerImgRef.current?.complete) {
            ctx.drawImage(activePlayerImgRef.current, -ballRef.current.r, -ballRef.current.r, ballRef.current.r * 2, ballRef.current.r * 2);
        } else { ctx.fillStyle = '#6366f1'; ctx.fill(); }
        ctx.restore();
        ctx.strokeStyle = isPhysicsEnabled ? '#fff' : '#475569';
        ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(ballRef.current.x, ballRef.current.y, ballRef.current.r, 0, Math.PI * 2); ctx.stroke();
        
        if (!isPhysicsEnabled && gameState === 'PLAYING') {
            ctx.fillStyle = '#fff'; ctx.font = 'bold 10px Inter';
            ctx.fillText('PELOTA', ballRef.current.x - 20, ballRef.current.y - 35);
        }

        requestRef.current = requestAnimationFrame(update);
    };

    const handleTouchStart = (e: any) => {
        if (isPhysicsEnabled || gameState !== 'PLAYING') return;
        const rect = canvasRef.current!.getBoundingClientRect();
        const x = (e.touches ? e.touches[0].clientX : e.clientX) - rect.left;
        const y = (e.touches ? e.touches[0].clientY : e.clientY) - rect.top;
        currentLineRef.current = [{ x, y }];
    };

    const handleTouchMove = (e: any) => {
        if (isPhysicsEnabled || currentLineRef.current.length === 0) return;
        const rect = canvasRef.current!.getBoundingClientRect();
        const x = (e.touches ? e.touches[0].clientX : e.clientX) - rect.left;
        const y = (e.touches ? e.touches[0].clientY : e.clientY) - rect.top;
        const last = currentLineRef.current[currentLineRef.current.length - 1];
        if (Math.hypot(x - last.x, y - last.y) > 5) currentLineRef.current.push({ x, y });
    };

    const handleTouchEnd = () => {
        if (currentLineRef.current.length > 1) {
            linesRef.current.push({ points: [...currentLineRef.current] });
            playSound(300, 0.1, 0.05);
        }
        currentLineRef.current = [];
    };

    useEffect(() => {
        if (gameState === 'PLAYING' || gameState === 'SUCCESS') {
            const canvas = canvasRef.current;
            if (canvas) {
                canvas.width = 400; canvas.height = 650;
                if (gameState === 'PLAYING' && !isPhysicsEnabled) initLevel();
                requestRef.current = requestAnimationFrame(update);
            }
        }
        return () => cancelAnimationFrame(requestRef.current);
    }, [gameState]);

    return (
        <div className="flex flex-col items-center justify-center p-4 bg-slate-950 rounded-[3rem] border-4 border-slate-800 shadow-2xl relative overflow-hidden min-h-[750px]">
            <div className="absolute inset-0 opacity-20 pointer-events-none bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')]"></div>
            
            {gameState === 'START' && (
                <div className="z-10 text-center animate-fadeIn p-8">
                    <div className="text-8xl mb-6">🪄</div>
                    <h2 className="text-5xl font-black italic uppercase tracking-tighter text-white mb-2">MAGIC LINES</h2>
                    <p className="text-indigo-400 font-bold uppercase tracking-widest text-xs mb-10">Puzzle de Física Creativa</p>
                    <button onClick={() => setGameState('TUTORIAL')} className="px-12 py-5 bg-white text-slate-950 font-black rounded-3xl text-2xl shadow-xl hover:scale-105 active:scale-95 transition-all uppercase italic">¿Cómo jugar?</button>
                </div>
            )}

            {gameState === 'TUTORIAL' && (
                <div className="z-20 absolute inset-0 bg-slate-900/95 flex flex-col items-center justify-center p-8 text-center animate-fadeIn">
                    <h3 className="text-3xl font-black text-white mb-8 italic uppercase">INSTRUCCIONES</h3>
                    <div className="grid gap-6 max-w-xs mb-12">
                        <div className="flex items-center gap-4 text-left">
                            <span className="text-4xl">✍️</span>
                            <p className="text-sm font-bold text-slate-300">1. Dibuja rampas o puentes en la pantalla con el dedo.</p>
                        </div>
                        <div className="flex items-center gap-4 text-left">
                            <span className="text-4xl">🚀</span>
                            <p className="text-sm font-bold text-slate-300">2. Presiona "SOLTAR" para que la pelota caiga.</p>
                        </div>
                        <div className="flex items-center gap-4 text-left">
                            <span className="text-4xl">🥅</span>
                            <p className="text-sm font-bold text-slate-300">3. Si la pelota entra al área de "ARCO", ganas.</p>
                        </div>
                    </div>
                    <button onClick={() => setGameState('PLAYING')} className="px-12 py-5 bg-indigo-600 text-white font-black rounded-3xl text-xl shadow-xl hover:bg-indigo-700 transition-all uppercase italic">¡Entendido!</button>
                </div>
            )}

            {gameState === 'PLAYING' && (
                <div className="relative flex flex-col items-center animate-fadeIn">
                    <div className="absolute top-0 left-0 right-0 flex justify-between px-4 py-2 pointer-events-none z-20">
                        <div className="bg-black/60 p-2 rounded-xl border border-white/10 text-center min-w-[70px] backdrop-blur-md">
                            <p className="text-[8px] font-black text-slate-400 uppercase">Nivel</p>
                            <p className="text-lg font-black text-white">{currentLevel}</p>
                        </div>
                        <div className="bg-black/60 p-2 rounded-xl border border-white/10 text-center min-w-[100px] backdrop-blur-md">
                            <p className="text-[8px] font-black text-yellow-400 uppercase">Créditos</p>
                            <p className="text-lg font-black text-white">{score}</p>
                        </div>
                    </div>
                    
                    <canvas ref={canvasRef} onMouseDown={handleTouchStart} onMouseMove={handleTouchMove} onMouseUp={handleTouchEnd} onTouchStart={handleTouchStart} onTouchMove={handleTouchMove} onTouchEnd={handleTouchEnd} className="bg-slate-900 rounded-2xl shadow-2xl border-b-8 border-slate-800 cursor-crosshair touch-none" />
                    
                    <div className="mt-4 flex flex-wrap justify-center gap-2 w-full max-w-[400px]">
                        <button onClick={() => isPhysicsEnabled ? stopPhysics() : setIsPhysicsEnabled(true)} className={`flex-1 min-w-[120px] px-4 py-3 rounded-2xl font-black uppercase text-[10px] transition-all shadow-lg active:scale-95 ${isPhysicsEnabled ? 'bg-orange-600 text-white animate-pulse' : 'bg-green-600 text-white hover:bg-green-500'}`}>
                            {isPhysicsEnabled ? '🛑 DETENER' : '🚀 SOLTAR PELOTA'}
                        </button>
                        <button onClick={() => initLevel()} className="flex-1 min-w-[120px] px-4 py-3 bg-indigo-600 text-white rounded-2xl font-black uppercase text-[10px] shadow-lg hover:bg-indigo-700 active:scale-95 transition-all">🧹 LIMPIAR PISTA</button>
                        <button onClick={() => setShowHelp(true)} className="w-12 bg-slate-800 text-white rounded-2xl font-black text-xs shadow-lg hover:bg-slate-700 active:scale-95 transition-all">?</button>
                        <button onClick={() => { if(window.confirm('¿Terminar entrenamiento?')) onFinish(score); }} className="flex-1 min-w-[80px] px-4 py-3 bg-red-600 text-white rounded-2xl font-black uppercase text-[10px] shadow-lg hover:bg-red-700 active:scale-95 transition-all">🚪 SALIR</button>
                    </div>

                    <p className="text-[9px] font-black text-slate-500 uppercase tracking-[0.2em] mt-4">
                        {isPhysicsEnabled ? 'La gravedad está activa' : 'Dibuja el camino con el dedo'}
                    </p>
                </div>
            )}

            {gameState === 'SUCCESS' && (
                <div className="z-10 text-center animate-zoomIn p-8">
                    <div className="text-7xl mb-4">🏆</div>
                    <h2 className="text-4xl font-black italic uppercase tracking-tighter text-white mb-2">¡OBJETIVO LOGRADO!</h2>
                    <p className="text-green-400 font-black mb-8 text-xl">+100 CRÉDITOS</p>
                    <div className="flex flex-col gap-3">
                        <button onClick={() => { setScore(s => s + 100); setCurrentLevel(l => l + 1); setGameState('PLAYING'); }} className="px-12 py-5 bg-white text-slate-950 font-black rounded-3xl text-xl shadow-xl hover:scale-105 transition-all uppercase italic">Siguiente Nivel</button>
                        <button onClick={() => { onFinish(score + 100); }} className="px-12 py-4 bg-slate-800 text-white font-black rounded-3xl text-sm shadow-xl hover:bg-slate-700 transition-all uppercase italic tracking-widest">Retirarse y Guardar</button>
                    </div>
                </div>
            )}

            {showHelp && (
                <div className="absolute inset-0 z-50 bg-slate-900/90 backdrop-blur-md flex flex-col items-center justify-center p-8 animate-fadeIn">
                    <div className="bg-slate-800 p-8 rounded-3xl border-2 border-indigo-500 max-w-sm text-center">
                        <h4 className="text-xl font-black text-white mb-4 uppercase">¿Cómo ganar?</h4>
                        <p className="text-slate-300 text-sm mb-6 leading-relaxed">
                            Debes dibujar una pista que lleve a la pelota desde arriba hasta el área de **ARCO** abajo. <br/><br/>
                            Si la pelota cae fuera de la pista, se reseteará automáticamente. ¡Usa los obstáculos grises como apoyo!
                        </p>
                        <button onClick={() => setShowHelp(false)} className="w-full py-4 bg-indigo-600 text-white font-black rounded-2xl uppercase text-xs">Continuar Juego</button>
                    </div>
                </div>
            )}
        </div>
    );
};
