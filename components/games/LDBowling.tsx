
import React, { useState, useEffect, useRef } from 'react';
import type { Player, MyTeam } from '../../types.ts';

interface LDBowlingProps {
    players: Player[];
    myTeam: MyTeam | null;
    onFinish: (score: number) => void;
    muted?: boolean;
}

interface Pin {
    id: number;
    worldX: number; // -100 a 100 (centro pista es 0)
    worldZ: number; // 0 (cerca) a 1000 (lejos)
    r: number;
    img: HTMLImageElement | null;
    active: boolean;
    vz: number;
    vx: number;
    vy: number;
    rotX: number;
    rotY: number;
    opacity: number;
}

export const LDBowling: React.FC<LDBowlingProps> = ({ players, myTeam, onFinish, muted }) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [gameState, setGameState] = useState<'START' | 'TUTORIAL' | 'PLAYING' | 'END'>('START');
    const [score, setScore] = useState(0);
    const [currentFrame, setCurrentFrame] = useState(1);
    const [ballInFrame, setBallInFrame] = useState(1);
    const [strikeMsg, setStrikeMsg] = useState<string | null>(null);
    const [isDragging, setIsDragging] = useState(false);
    
    const pinsRef = useRef<Pin[]>([]);
    const ballRef = useRef({ 
        x: 0, z: 100, r: 25, 
        vx: 0, vz: 0, 
        spin: 0, // El efecto de la bola
        dragStartX: 0, dragStartY: 0,
        currentDragX: 0, currentDragY: 0 
    });

    const stateRef = useRef<'aim' | 'roll' | 'reset' | 'wait'>('aim');
    const requestRef = useRef<number>(0);
    const teamImgRef = useRef<HTMLImageElement | null>(null);

    // Configuración de cámara 3D
    const VIEW_WIDTH = 400;
    const VIEW_HEIGHT = 650;
    const HORIZON = 250;
    const FOCAL_LENGTH = 300;

    useEffect(() => {
        if (myTeam?.shieldUrl) {
            const img = new Image();
            img.src = myTeam.shieldUrl;
            teamImgRef.current = img;
        }
    }, [myTeam]);

    const playSound = (freq: number, dur: number, vol: number = 0.1) => {
        if (muted) return;
        try {
            const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
            const osc = ctx.createOscillator();
            const g = ctx.createGain();
            osc.frequency.value = freq;
            osc.connect(g); g.connect(ctx.destination);
            osc.start();
            g.gain.setValueAtTime(vol, ctx.currentTime);
            g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + dur);
            osc.stop(ctx.currentTime + dur);
        } catch (e) {}
    };

    const project = (x: number, z: number, r: number) => {
        const scale = FOCAL_LENGTH / (FOCAL_LENGTH + z);
        return {
            x: (VIEW_WIDTH / 2) + (x * scale),
            y: HORIZON + (z * scale * 0.4), // Factor 0.4 para aplanar la pista
            size: r * scale
        };
    };

    const spawnPins = () => {
        const startZ = 900;
        const spacingX = 45;
        const spacingZ = 40;
        const shuffled = [...players].sort(() => 0.5 - Math.random());
        
        const newPins: Pin[] = [];
        let count = 0;
        // Formación triangular: 4 filas
        for (let row = 4; row >= 1; row--) {
            for (let col = 0; col < row; col++) {
                const xPos = ((col - (row - 1) / 2) * spacingX);
                const zPos = startZ + (4 - row) * spacingZ;
                const img = new Image();
                img.src = shuffled[count % shuffled.length].photoUrl;
                newPins.push({
                    id: count,
                    worldX: xPos, worldZ: zPos,
                    r: 20, img, active: true, 
                    vx: 0, vz: 0, vy: 0, 
                    rotX: 0, rotY: 0, opacity: 1
                });
                count++;
            }
        }
        pinsRef.current = newPins;
    };

    const update = () => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d')!;

        // --- DIBUJAR FONDO ---
        ctx.fillStyle = '#020617';
        ctx.fillRect(0, 0, VIEW_WIDTH, VIEW_HEIGHT);
        
        // Pista con perspectiva
        ctx.fillStyle = '#1e293b';
        const pLeftNear = project(-150, 0, 0);
        const pRightNear = project(150, 0, 0);
        const pLeftFar = project(-100, 1000, 0);
        const pRightFar = project(100, 1000, 0);

        ctx.beginPath();
        ctx.moveTo(pLeftNear.x, pLeftNear.y);
        ctx.lineTo(pRightNear.x, pRightNear.y);
        ctx.lineTo(pRightFar.x, pRightFar.y);
        ctx.lineTo(pLeftFar.x, pLeftFar.y);
        ctx.fill();

        // Líneas de la pista (Oil pattern)
        ctx.strokeStyle = '#334155';
        for(let z=0; z<=1000; z+=100) {
            const p1 = project(-120, z, 0);
            const p2 = project(120, z, 0);
            ctx.beginPath(); ctx.moveTo(p1.x, p1.y); ctx.lineTo(p2.x, p2.y); ctx.stroke();
        }

        // --- LÓGICA DE TIRO ---
        const ball = ballRef.current;
        if (stateRef.current === 'roll') {
            // Aplicar efecto de curva (Spin)
            ball.vx += ball.spin * 0.05;
            ball.z += ball.vz;
            ball.x += ball.vx;

            // Colisiones con pinos
            pinsRef.current.forEach(p => {
                if (p.active) {
                    const dx = p.worldX - ball.x;
                    const dz = p.worldZ - ball.z;
                    const dist = Math.sqrt(dx*dx + dz*dz);
                    if (dist < ball.r + p.r) {
                        p.active = false;
                        // Transferencia de momentum
                        p.vx = dx * 0.5 + ball.vx * 0.8;
                        p.vz = dz * 0.5 + ball.vz * 0.8;
                        p.vy = -Math.random() * 10; // Salto
                        playSound(200 + Math.random()*300, 0.2, 0.15);
                        setScore(s => s + 50);
                    }
                }
            });

            // Colisiones entre pinos
            pinsRef.current.forEach((p1, i) => {
                if (!p1.active && p1.opacity > 0.5) {
                    pinsRef.current.forEach((p2, j) => {
                        if (i !== j && p2.active) {
                            const dx = p2.worldX - p1.worldX;
                            const dz = p2.worldZ - p1.worldZ;
                            const dist = Math.sqrt(dx*dx + dz*dz);
                            if (dist < p1.r + p2.r + 5) {
                                p2.active = false;
                                p2.vx = dx * 0.6 + p1.vx * 0.4;
                                p2.vz = dz * 0.6 + p1.vz * 0.4;
                                p2.vy = -Math.random() * 5;
                                setScore(s => s + 50);
                            }
                        }
                    });
                }
            });

            if (ball.z > 1100 || ball.x < -200 || ball.x > 200) {
                handleBallEnd();
            }
        }

        // --- DIBUJAR PINOS (Ordenados por Z) ---
        [...pinsRef.current].sort((a, b) => b.worldZ - a.worldZ).forEach(p => {
            if (!p.active) {
                p.worldX += p.vx; p.worldZ += p.vz; p.vy += 0.8; // Gravedad
                const floorY = HORIZON + (p.worldZ * (FOCAL_LENGTH / (FOCAL_LENGTH + p.worldZ)) * 0.4);
                if (p.vy > 0 && project(p.worldX, p.worldZ, 0).y > floorY) p.vy *= -0.3; // Rebote
                p.opacity -= 0.015;
            }
            if (p.opacity <= 0) return;

            const proj = project(p.worldX, p.worldZ, p.r);
            const drawY = proj.y + (p.active ? 0 : p.vy);

            ctx.save();
            ctx.translate(proj.x, drawY);
            ctx.globalAlpha = p.opacity;
            
            // Cuerpo del pino 3D (elipse con degradado)
            const grad = ctx.createRadialGradient(-proj.size*0.3, -proj.size*0.5, 2, 0, 0, proj.size);
            grad.addColorStop(0, '#fff');
            grad.addColorStop(1, '#94a3b8');
            ctx.fillStyle = grad;
            ctx.beginPath();
            ctx.ellipse(0, 0, proj.size, proj.size * 1.6, 0, 0, Math.PI * 2);
            ctx.fill();
            
            // Foto del jugador
            ctx.beginPath(); ctx.arc(0, -proj.size*0.4, proj.size * 0.7, 0, Math.PI * 2); ctx.clip();
            if (p.img?.complete) ctx.drawImage(p.img, -proj.size * 0.7, -proj.size * 1.1, proj.size * 1.4, proj.size * 1.4);
            ctx.restore();
        });

        // --- DIBUJAR BOLA ---
        if (stateRef.current === 'aim' || stateRef.current === 'roll') {
            if (isDragging && stateRef.current === 'aim') {
                // Guía de trayectoria con curva
                const dx = (ball.dragStartX - ball.currentDragX) * 1.2;
                const dz = (ball.dragStartY - ball.currentDragY) * 6;
                const spin = (ball.dragStartX - ball.currentDragX) * -0.2;
                
                ctx.beginPath();
                ctx.setLineDash([5, 5]);
                ctx.strokeStyle = '#22c55e88';
                let tx = ball.x, tz = ball.z, tvx = dx * 0.15, tvz = dz * 0.15;
                ctx.moveTo(project(tx, tz, 0).x, project(tx, tz, 0).y);
                for(let i=0; i<20; i++) {
                    tvx += spin * 0.05;
                    tx += tvx; tz += tvz;
                    const p = project(tx, tz, 0);
                    ctx.lineTo(p.x, p.y);
                }
                ctx.stroke();
                ctx.setLineDash([]);
            }

            const ballProj = project(ball.x, ball.z, ball.r);
            ctx.save();
            ctx.translate(ballProj.x, ballProj.y);
            const ballGrad = ctx.createRadialGradient(-ballProj.size*0.3, -ballProj.size*0.3, 2, 0, 0, ballProj.size);
            ballGrad.addColorStop(0, '#818cf8');
            ballGrad.addColorStop(1, '#312e81');
            ctx.fillStyle = ballGrad;
            ctx.beginPath(); ctx.arc(0, 0, ballProj.size, 0, Math.PI * 2); ctx.fill();
            
            if (teamImgRef.current?.complete) {
                ctx.save(); ctx.beginPath(); ctx.arc(0, 0, ballProj.size * 0.7, 0, Math.PI * 2); ctx.clip();
                ctx.rotate(ball.z * 0.05); // Rotación visual
                ctx.drawImage(teamImgRef.current, -ballProj.size*0.7, -ballProj.size*0.7, ballProj.size*1.4, ballProj.size*1.4);
                ctx.restore();
            }
            ctx.restore();
        }

        requestRef.current = requestAnimationFrame(update);
    };

    const handleBallEnd = () => {
        stateRef.current = 'wait';
        const remaining = pinsRef.current.filter(p => p.active).length;
        
        if (remaining === 0) {
            const type = ballInFrame === 1 ? 'STRIKE' : 'SPARE';
            setStrikeMsg(type);
            setScore(s => s + (type === 'STRIKE' ? 1000 : 500));
            playSound(800, 0.6);
            setTimeout(() => { setStrikeMsg(null); nextFrame(); }, 2000);
        } else if (ballInFrame === 1) {
            setBallInFrame(2);
            resetBallPos();
            stateRef.current = 'aim';
        } else {
            nextFrame();
        }
    };

    const nextFrame = () => {
        if (currentFrame >= 10) {
            setGameState('END');
        } else {
            setCurrentFrame(f => f + 1);
            setBallInFrame(1);
            spawnPins();
            resetBallPos();
            stateRef.current = 'aim';
        }
    };

    const resetBallPos = () => {
        ballRef.current.x = 0; ballRef.current.z = 100;
        ballRef.current.vx = 0; ballRef.current.vz = 0;
        ballRef.current.spin = 0;
    };

    const onPointerDown = (e: any) => {
        if (stateRef.current !== 'aim') return;
        const rect = canvasRef.current!.getBoundingClientRect();
        const x = (e.touches ? e.touches[0].clientX : e.clientX) - rect.left;
        const y = (e.touches ? e.touches[0].clientY : e.clientY) - rect.top;
        
        const ballProj = project(ballRef.current.x, ballRef.current.z, ballRef.current.r);
        if (Math.hypot(x - ballProj.x, y - ballProj.y) < 60) {
            setIsDragging(true);
            ballRef.current.dragStartX = x;
            ballRef.current.dragStartY = y;
            ballRef.current.currentDragX = x;
            ballRef.current.currentDragY = y;
        }
    };

    const onPointerMove = (e: any) => {
        if (!isDragging) return;
        const rect = canvasRef.current!.getBoundingClientRect();
        ballRef.current.currentDragX = (e.touches ? e.touches[0].clientX : e.clientX) - rect.left;
        ballRef.current.currentDragY = (e.touches ? e.touches[0].clientY : e.clientY) - rect.top;
    };

    const onPointerUp = () => {
        if (!isDragging) return;
        setIsDragging(false);
        
        const dx = (ballRef.current.dragStartX - ballRef.current.currentDragX) * 1.2;
        const dy = (ballRef.current.dragStartY - ballRef.current.currentDragY) * 6;
        
        if (Math.abs(dy) > 30) {
            ballRef.current.vx = dx * 0.15;
            ballRef.current.vz = dy * 0.15;
            // El "spin" depende de qué tan cruzado fue el tiro
            ballRef.current.spin = (ballRef.current.dragStartX - ballRef.current.currentDragX) * -0.25;
            stateRef.current = 'roll';
            playSound(400, 0.15, 0.2);
        }
    };

    useEffect(() => {
        if (gameState === 'PLAYING') {
            const canvas = canvasRef.current;
            if (canvas) {
                canvas.width = VIEW_WIDTH; canvas.height = VIEW_HEIGHT;
                spawnPins();
                requestRef.current = requestAnimationFrame(update);
            }
        }
        return () => cancelAnimationFrame(requestRef.current);
    }, [gameState]);

    return (
        <div className="flex flex-col items-center justify-center p-4 bg-slate-950 rounded-[3rem] border-4 border-slate-800 shadow-2xl relative overflow-hidden min-h-[700px] select-none touch-none">
            
            {gameState === 'START' && (
                <div className="z-10 text-center animate-fadeIn p-8">
                    <div className="text-8xl mb-6">🎳</div>
                    <h2 className="text-5xl font-black italic uppercase tracking-tighter text-white mb-2">3D BOWLING LD</h2>
                    <p className="text-indigo-400 font-bold uppercase tracking-widest text-xs mb-10">Física de Efecto Profesional</p>
                    <button onClick={() => setGameState('TUTORIAL')} className="px-12 py-5 bg-white text-slate-950 font-black rounded-3xl text-2xl shadow-xl hover:scale-105 active:scale-95 transition-all uppercase italic">Calentar Brazo</button>
                </div>
            )}

            {gameState === 'TUTORIAL' && (
                <div className="z-20 absolute inset-0 bg-slate-900/95 flex flex-col items-center justify-center p-8 text-center animate-fadeIn">
                    <h3 className="text-3xl font-black text-white mb-8 italic uppercase">SISTEMA DE EFECTO</h3>
                    <div className="grid gap-6 max-w-xs mb-12">
                        <div className="flex items-center gap-4 text-left">
                            <span className="text-4xl">🏹</span>
                            <p className="text-sm font-bold text-slate-300">1. Arrastra la bola hacia atrás y hacia los costados.</p>
                        </div>
                        <div className="flex items-center gap-4 text-left">
                            <span className="text-4xl">🌀</span>
                            <p className="text-sm font-bold text-slate-300">2. Cuanto más lateral sea el arrastre, más curva tomará.</p>
                        </div>
                        <div className="flex items-center gap-4 text-left">
                            <span className="text-4xl">🎳</span>
                            <p className="text-sm font-bold text-slate-300">3. Apunta al "Pocket" (entre los pinos) para hacer Strike.</p>
                        </div>
                    </div>
                    <button onClick={() => setGameState('PLAYING')} className="px-12 py-5 bg-indigo-600 text-white font-black rounded-3xl text-xl shadow-xl hover:bg-indigo-700 transition-all uppercase italic">¡Lo tengo!</button>
                </div>
            )}

            {gameState === 'PLAYING' && (
                <div className="relative flex flex-col items-center animate-fadeIn">
                    <div className="absolute top-0 left-0 right-0 flex justify-between px-4 py-2 pointer-events-none z-20">
                        <div className="bg-black/60 p-2 rounded-xl border border-white/10 text-center min-w-[70px] backdrop-blur-md">
                            <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Frame</p>
                            <p className="text-lg font-black text-white">{currentFrame}/10</p>
                        </div>
                        <div className="bg-black/60 p-2 rounded-xl border border-white/10 text-center min-w-[100px] backdrop-blur-md">
                            <p className="text-[8px] font-black text-yellow-400 uppercase tracking-widest">Créditos</p>
                            <p className="text-lg font-black text-white">{score}</p>
                        </div>
                    </div>
                    
                    <canvas 
                        ref={canvasRef} 
                        onMouseDown={onPointerDown} onMouseMove={onPointerMove} onMouseUp={onPointerUp}
                        onTouchStart={onPointerDown} onTouchMove={onPointerMove} onTouchEnd={onPointerUp}
                        className="bg-slate-900 rounded-2xl shadow-2xl border-b-8 border-slate-800 cursor-crosshair" 
                    />
                    
                    <div className="mt-4 flex flex-col items-center gap-2">
                        <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] animate-pulse">
                            {stateRef.current === 'aim' ? (isDragging ? '¡LANZA CON EFECTO!' : 'ESTIRA LA BOLA HACIA ATRÁS') : 'EN MOVIMIENTO...'}
                        </p>
                        <button onClick={() => { if(window.confirm('¿Reiniciar?')) setGameState('START'); }} className="px-4 py-2 bg-slate-800 text-[9px] font-black text-slate-400 rounded-lg uppercase">Reiniciar Partida</button>
                    </div>

                    {strikeMsg && (
                        <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-30 animate-zoomIn">
                            <h2 className="text-8xl font-black italic uppercase tracking-tighter drop-shadow-[0_10px_30px_rgba(255,255,255,0.4)] text-white">
                                ¡{strikeMsg}!
                            </h2>
                        </div>
                    )}
                </div>
            )}

            {gameState === 'END' && (
                <div className="z-10 text-center animate-zoomIn p-8">
                    <div className="text-7xl mb-4">👑</div>
                    <h2 className="text-5xl font-black italic uppercase tracking-tighter text-white mb-2">PROFESIONAL</h2>
                    <p className="text-yellow-400 font-black mb-10 text-3xl">TOTAL: {score} CRÉDITOS</p>
                    <div className="flex flex-col gap-3">
                        <button onClick={() => setGameState('START')} className="px-12 py-5 bg-white text-slate-950 font-black rounded-3xl text-xl shadow-xl hover:scale-105 transition-all uppercase italic">Nuevo Torneo</button>
                        <button onClick={() => onFinish(score)} className="px-12 py-4 bg-slate-800 text-white font-black rounded-3xl text-sm shadow-xl hover:bg-slate-700 transition-all uppercase italic tracking-widest">Salir y Guardar</button>
                    </div>
                </div>
            )}
        </div>
    );
};
