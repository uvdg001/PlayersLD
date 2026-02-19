
import React, { useState, useEffect } from 'react';
import type { Player, ChatMessage } from '../../types';

interface LDTriviaProps {
    mode: 'CALENDAR' | 'SCOUT' | 'RADIO';
    players: Player[];
    messages: ChatMessage[];
    onFinish: (score: number) => void;
}

const FALLBACK_CHAT_PHRASES = [
    "¿Quién dijo: 'Llevo el hielo'?",
    "¿Quién dijo: 'No llego, estoy en el trabajo'?",
    "¿Quién dijo: 'Voy al arco'?",
    "¿Quién dijo: 'Hoy se gana'?"
];

export const LDTrivia: React.FC<LDTriviaProps> = ({ mode, players, messages, onFinish }) => {
    const [timeLeft, setTimeLeft] = useState(10);
    const [question, setQuestion] = useState<{ text: string, options: string[], correctIndex: number } | null>(null);
    const [isAnswering, setIsAnswering] = useState(false);
    const [feedback, setFeedback] = useState<'RIGHT' | 'WRONG' | null>(null);
    const [selectedIndex, setSelectedIndex] = useState<number | null>(null);

    useEffect(() => {
        generateQuestion();
    }, [mode]);

    useEffect(() => {
        if (timeLeft > 0 && !isAnswering) {
            const timer = setTimeout(() => setTimeLeft(prev => prev - 1), 1000);
            return () => clearTimeout(timer);
        } else if (timeLeft === 0 && !isAnswering) {
            handleAnswer(-1);
        }
    }, [timeLeft, isAnswering]);

    const generateQuestion = () => {
        const validPlayers = players.filter(p => p.nickname !== 'Default' && p.nickname !== 'Jugador 1');
        if (validPlayers.length < 4) return;

        let qText = '', correct = '', options: string[] = [];
        const subject = validPlayers[Math.floor(Math.random() * validPlayers.length)];

        if (mode === 'CALENDAR') {
            const months = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"];
            correct = months[new Date(subject.birthDate).getMonth()];
            qText = `¿En qué mes cumple años ${subject.nickname}?`;
            options = [correct, ...months.filter(m => m !== correct).sort(() => 0.5 - Math.random()).slice(0, 3)];
        } else if (mode === 'SCOUT') {
            correct = subject.nickname;
            qText = `¿Quién juega habitualmente de ${subject.role}?`;
            options = [correct, ...validPlayers.filter(p => p.id !== subject.id).map(p => p.nickname).sort(() => 0.5 - Math.random()).slice(0, 3)];
        } else {
            const usableMsgs = messages.filter(m => m.text && m.text.length > 10);
            if (usableMsgs.length > 0) {
                const msg = usableMsgs[Math.floor(Math.random() * usableMsgs.length)];
                qText = `¿Quién escribió este mensaje?\n"${msg.text?.substring(0, 50)}..."`;
                correct = players.find(p => p.id === msg.senderId)?.nickname || msg.senderName;
            } else {
                qText = FALLBACK_CHAT_PHRASES[Math.floor(Math.random() * FALLBACK_CHAT_PHRASES.length)];
                correct = subject.nickname;
            }
            options = [correct, ...validPlayers.filter(p => p.nickname !== correct).map(p => p.nickname).sort(() => 0.5 - Math.random()).slice(0, 3)];
        }

        options = options.sort(() => 0.5 - Math.random());
        setQuestion({ text: qText, options, correctIndex: options.indexOf(correct) });
        setTimeLeft(10);
        setIsAnswering(false);
        setFeedback(null);
        setSelectedIndex(null);
    };

    const handleAnswer = (index: number) => {
        if (isAnswering) return;
        setIsAnswering(true);
        setSelectedIndex(index);
        
        const isCorrect = index === question?.correctIndex;
        setFeedback(isCorrect ? 'RIGHT' : 'WRONG');
        
        const pointsToAdd = isCorrect ? (timeLeft * 5) + 50 : 0;

        setTimeout(() => {
            onFinish(pointsToAdd);
        }, 1200);
    };

    if (!question) return null;

    return (
        <div className="w-full max-w-md mx-auto animate-zoomIn">
            <div className="w-full bg-gray-800 h-3 rounded-full overflow-hidden mb-6">
                <div 
                    className={`h-full transition-all duration-1000 linear ${timeLeft < 4 ? 'bg-red-500' : 'bg-indigo-500'}`} 
                    style={{ width: `${(timeLeft / 10) * 100}%` }}
                ></div>
            </div>

            <div className="bg-white dark:bg-gray-800 p-8 rounded-[2.5rem] shadow-2xl border-2 border-indigo-500/20 text-center relative overflow-hidden">
                {feedback && (
                    <div className={`absolute inset-0 z-10 flex items-center justify-center backdrop-blur-sm animate-fadeIn ${feedback === 'RIGHT' ? 'bg-green-500/20' : 'bg-red-500/20'}`}>
                        <span className="text-8xl">{feedback === 'RIGHT' ? '✅' : '❌'}</span>
                    </div>
                )}
                
                <p className="text-[10px] font-black text-indigo-500 uppercase tracking-widest mb-2">Pregunta de {mode}</p>
                <h3 className="text-2xl font-black italic uppercase tracking-tighter mb-8 whitespace-pre-wrap text-gray-800 dark:text-white leading-tight">
                    {question.text}
                </h3>
                
                <div className="grid gap-3">
                    {question.options.map((opt, i) => (
                        <button 
                            key={i} 
                            onClick={() => handleAnswer(i)}
                            disabled={isAnswering}
                            className={`py-4 px-6 rounded-2xl font-black uppercase tracking-tighter transition-all active:scale-95 text-sm ${
                                isAnswering && i === question.correctIndex ? 'bg-green-500 text-white' :
                                isAnswering && i === selectedIndex ? 'bg-red-500 text-white' :
                                'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-white hover:bg-indigo-600 hover:text-white'
                            }`}
                        >
                            {opt}
                        </button>
                    ))}
                </div>
            </div>
        </div>
    );
};
