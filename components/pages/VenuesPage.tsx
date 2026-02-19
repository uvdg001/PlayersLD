import React, { useState } from 'react';
import type { Venue } from '../../types.ts';
import { VenueForm } from '../forms/VenueForm.tsx';

interface VenuesPageProps {
    venues: Venue[];
    onAddVenue: (newVenue: Omit<Venue, 'id'>) => void;
    onUpdateVenue: (venue: Venue) => void;
    onDeleteVenue: (venueId: number) => void;
    isAdmin: boolean;
}

export const VenuesPage: React.FC<VenuesPageProps> = ({ venues, onAddVenue, onUpdateVenue, onDeleteVenue, isAdmin }) => {
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [editingVenue, setEditingVenue] = useState<Venue | null>(null);

    const handleEdit = (venue: Venue) => {
        setEditingVenue(venue);
        setIsFormOpen(true);
    };

    const handleAddNew = () => {
        setEditingVenue(null);
        setIsFormOpen(true);
    };
    
    const handleSave = (data: Venue | Omit<Venue, 'id'>) => {
        if ('id' in data) {
            onUpdateVenue(data);
        } else {
            onAddVenue(data);
        }
        setIsFormOpen(false);
    };

    const handleSecureDelete = (venue: Venue) => {
        const confirmation = window.prompt(`⚠️ ¿Seguro que quieres eliminar esta cancha?\n\nPara confirmar, escribe: ELIMINAR`);
        if (confirmation === "ELIMINAR") {
            onDeleteVenue(venue.id);
        } else if (confirmation !== null) {
            alert("Acción cancelada. Debes escribir 'ELIMINAR'.");
        }
    };

    // Helper INTELIGENTE para manejar mapas
    const getSafeMapLink = (input: string) => {
        if (!input) return '';
        const cleanInput = input.trim();

        // 1. Si ya es un link completo seguro
        if (cleanInput.startsWith('http://') || cleanInput.startsWith('https://')) {
            return cleanInput;
        }

        // 2. Si parece un link corto de Google Maps o un dominio web (www, goo.gl, maps.app)
        if (cleanInput.includes('goo.gl') || cleanInput.startsWith('www.') || cleanInput.includes('maps.app') || cleanInput.includes('.com')) {
            return `https://${cleanInput}`;
        }

        // 3. Si no es nada de lo anterior, ASUMIMOS QUE ES UNA DIRECCIÓN FÍSICA (Calle, Av, etc)
        // Y generamos una búsqueda automática en Google Maps.
        return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(cleanInput)}`;
    };

    return (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100">Canchas</h2>
                {isAdmin && (
                    <button
                        onClick={handleAddNew}
                        className="px-4 py-2 bg-green-600 text-white font-semibold rounded-lg shadow-md hover:bg-green-700 transition-colors"
                    >
                        Agregar Cancha
                    </button>
                )}
            </div>

            {isFormOpen && (
                <div className="mb-6 p-4 border rounded-lg dark:border-gray-700">
                    <VenueForm
                        venue={editingVenue}
                        onSave={handleSave}
                        onCancel={() => setIsFormOpen(false)}
                    />
                </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {venues.map(venue => (
                    <div key={venue.id} className="flex items-start justify-between p-3 bg-gray-100 dark:bg-gray-700 rounded-lg">
                        <div className="flex items-start space-x-4">
                            {venue.photoUrl ? (
                                <img src={venue.photoUrl} alt={venue.name} className="w-24 h-24 rounded-md object-cover" />
                            ) : (
                                <div className="w-24 h-24 rounded-md bg-gray-300 dark:bg-gray-600 flex items-center justify-center">
                                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-10 h-10 text-gray-500">
                                      <path strokeLinecap="round" strokeLinejoin="round" d="m2.25 15.75 5.159-5.159a2.25 2.25 0 0 1 3.182 0l5.159 5.159m-1.5-1.5 1.409-1.409a2.25 2.25 0 0 1 3.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 0 0 1.5-1.5V6a1.5 1.5 0 0 0-1.5-1.5H3.75A1.5 1.5 0 0 0 2.25 6v12a1.5 1.5 0 0 0 1.5 1.5Zm10.5-11.25h.008v.008h-.008V8.25Zm.158 0a.225.225 0 1 1-.45 0 .225.225 0 0 1 .45 0Z" />
                                    </svg>
                                </div>
                            )}
                            <div>
                                <p className="font-bold text-gray-800 dark:text-gray-200">{venue.name}</p>
                                <p className="text-sm text-gray-600 dark:text-gray-400">{venue.address}</p>
                                {venue.mapLink && (
                                    <a 
                                        href={getSafeMapLink(venue.mapLink)} 
                                        target="_blank" 
                                        rel="noopener noreferrer" 
                                        className="text-sm text-blue-500 hover:underline flex items-center gap-1 mt-1"
                                    >
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                                        Ver en mapa / Buscar
                                    </a>
                                )}
                            </div>
                        </div>
                        <div className="flex flex-col space-y-2">
                            <button onClick={() => handleEdit(venue)} className="p-2 text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path d="M17.414 2.586a2 2 0 00-2.828 0L7 10.172V13h2.828l7.586-7.586a2 2 0 000-2.828z" /><path fillRule="evenodd" d="M2 6a2 2 0 012-2h4a1 1 0 010 2H4v10h10v-4a1 1 0 112 0v4a2 2 0 01-2 2H4a2 2 0 01-2-2V6z" clipRule="evenodd" /></svg>
                            </button>
                            <button onClick={() => handleSecureDelete(venue)} className="p-2 text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" /></svg>
                            </button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};