
import React, { useState, useEffect, useCallback } from 'react';
import { getMotivationalQuote } from '../services/geminiService';

export const MotivationalQuote: React.FC = () => {
    const [quote, setQuote] = useState<string>('');
    const [loading, setLoading] = useState<boolean>(true);

    const fetchQuote = useCallback(async () => {
        setLoading(true);
        const newQuote = await getMotivationalQuote();
        setQuote(newQuote);
        setLoading(false);
    }, []);

    useEffect(() => {
        fetchQuote();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    return (
        <div className="bg-gradient-to-r from-green-500 to-blue-500 text-white p-6 rounded-lg shadow-xl text-center">
            <h3 className="text-lg font-semibold mb-2">Frase del Día</h3>
            {loading ? (
                <div className="animate-pulse h-6 bg-white/30 rounded-md w-3/4 mx-auto"></div>
            ) : (
                <p className="text-xl italic">"{quote}"</p>
            )}
             <button
                onClick={fetchQuote}
                disabled={loading}
                className="mt-4 px-4 py-2 bg-white/20 hover:bg-white/30 rounded-full text-sm font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center mx-auto"
            >
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={`w-5 h-5 mr-2 ${loading ? 'animate-spin' : ''}`}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0 3.181 3.183a8.25 8.25 0 0 0 11.667 0l3.181-3.183m-4.991-2.691v4.992m0 0h-4.992m4.992 0-3.181-3.183a8.25 8.25 0 0 0-11.667 0l-3.181 3.183" />
                </svg>
                {loading ? 'Generando...' : 'Nueva Frase'}
            </button>
        </div>
    );
};
