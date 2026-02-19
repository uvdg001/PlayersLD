import React, { createContext, useState, useContext, ReactNode } from 'react';
import { translations } from '../constants.ts';

type Language = 'es' | 'en' | 'pt';

interface LanguageContextType {
    language: Language;
    setLanguage: (lang: Language) => void;
    t: typeof translations['es'];
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [language, setLanguage] = useState<Language>(() => {
        return (localStorage.getItem('appLanguage') as Language) || 'es';
    });

    const changeLanguage = (lang: Language) => {
        setLanguage(lang);
        localStorage.setItem('appLanguage', lang);
    };

    return (
        <LanguageContext.Provider value={{ language, setLanguage: changeLanguage, t: translations[language] }}>
            {children}
        </LanguageContext.Provider>
    );
};

export const useLanguage = () => {
    const context = useContext(LanguageContext);
    if (!context) {
        throw new Error('useLanguage must be used within a LanguageProvider');
    }
    return context;
};