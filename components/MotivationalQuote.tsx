import React, { useState, useEffect } from 'react';
import { generateMotivationalQuote } from '../services/geminiService.ts';

export const MotivationalQuote: React.FC = () => {
    const [quote, setQuote] = useState<string>("Buscando inspiración...");
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchQuote = async () => {
            try {
                const text = await generateMotivationalQuote();
                setQuote(text);
            } catch (error) {
                setQuote("Hoy es un buen día para ganar.");
            } finally {
                setLoading(false);
            }
        };
        fetchQuote();
    }, []);

    return (
        <div className="bg-gradient-to-r from-indigo-500 to-purple-600 rounded-lg shadow-lg p-6 text-white mb-6 transform hover:scale-[1.02] transition-transform duration-300">
            <h3 className="text-sm font-bold uppercase tracking-wider mb-2 opacity-80 flex items-center gap-2">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
                Motivación del Día
            </h3>
            {loading ? (
                <div className="h-16 flex items-center justify-center">
                    <div className="animate-pulse bg-white/20 h-4 w-3/4 rounded"></div>
                </div>
            ) : (
                <p className="text-lg md:text-xl font-medium italic leading-relaxed">
                    "{quote}"
                </p>
            )}
        </div>
    );
};