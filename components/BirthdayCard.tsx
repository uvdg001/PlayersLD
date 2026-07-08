import React from 'react';
import { motion } from 'motion/react';
import type { Player } from '../types.ts';

interface BirthdayCardProps {
    players: Player[];
}

export const BirthdayCard: React.FC<BirthdayCardProps> = ({ players }) => {
    if (players.length === 0) {
        return null;
    }

    return (
        <motion.div 
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="relative overflow-hidden bg-gradient-to-br from-yellow-400 via-red-500 to-pink-500 text-white p-8 rounded-[2.5rem] shadow-2xl text-center animate-hue-rotate border-4 border-white/30"
        >
            {/* Decoración de fondo (Confetti flotante) */}
            <div className="absolute inset-0 pointer-events-none overflow-hidden">
                {[...Array(6)].map((_, i) => (
                    <div 
                        key={i} 
                        className="absolute animate-floating text-2xl opacity-40"
                        style={{ 
                            top: `${Math.random() * 80}%`, 
                            left: `${Math.random() * 90}%`,
                            animationDelay: `${i * 0.5}s`
                        }}
                    >
                        {['🎉', '🎂', '⚽', '✨', '🎈'][i % 5]}
                    </div>
                ))}
            </div>

            <div className="relative z-10">
                <motion.h3 
                    animate={{ scale: [1, 1.1, 1] }}
                    transition={{ repeat: Infinity, duration: 2 }}
                    className="text-4xl font-black italic uppercase tracking-tighter mb-4 drop-shadow-lg"
                >
                    🚀 ¡FELIZ CUMPLE! 🚀
                </motion.h3>
                
                <p className="text-lg font-bold uppercase tracking-widest opacity-90 mb-6 bg-white/20 py-1 px-4 rounded-full inline-block">
                    Homenaje especial del equipo
                </p>

                <div className="flex flex-wrap justify-center items-center gap-8 mt-4">
                    {players.map(player => (
                        <motion.div 
                            key={player.id} 
                            whileHover={{ scale: 1.1, rotate: 5 }}
                            className="flex flex-col items-center group"
                        >
                            <div className="relative">
                                {player.photoUrl ? (
                                    <img 
                                        src={player.photoUrl} 
                                        alt={player.nickname} 
                                        className="w-24 h-24 rounded-full object-cover border-4 border-white shadow-xl group-hover:border-yellow-300 transition-colors" 
                                    />
                                ) : (
                                    <div className="w-24 h-24 rounded-full bg-white/30 flex items-center justify-center text-white border-4 border-white">
                                        <span className="text-4xl">👤</span>
                                    </div>
                                )}
                                <div className="absolute -bottom-2 -right-2 bg-yellow-400 text-black p-2 rounded-full text-xl shadow-lg border-2 border-white">🎂</div>
                            </div>
                            <p className="font-black text-2xl mt-4 uppercase italic tracking-tighter drop-shadow-md">
                                {player.nickname}
                            </p>
                            {player.jerseyNumber && (
                                <span className="bg-black/20 px-3 py-1 rounded-lg text-sm font-black mt-1">
                                    #{player.jerseyNumber}
                                </span>
                            )}
                        </motion.div>
                    ))}
                </div>
            </div>
        </motion.div>
    );
};
