
import React, { useState, useEffect, useCallback } from 'react';
import type { StandingsPhoto } from '../../types.ts';
import { useToast } from '../../hooks/useToast.ts';

interface StandingsPhotosPageProps {
    photos: StandingsPhoto[];
    onAddPhoto: (url: string) => void;
    onDeletePhoto: (id: string) => void;
    isAdmin: boolean;
}

export const StandingsPhotosPage: React.FC<StandingsPhotosPageProps> = ({ photos, onAddPhoto, onDeletePhoto, isAdmin }) => {
    const toast = useToast();
    const [selectedPhoto, setSelectedPhoto] = useState<StandingsPhoto | null>(null);
    const [isPasting, setIsPasting] = useState(false);

    const compressImage = (blob: Blob): Promise<string> => {
        return new Promise((resolve) => {
            const reader = new FileReader();
            reader.readAsDataURL(blob);
            reader.onload = (event) => {
                const img = new Image();
                img.src = event.target?.result as string;
                img.onload = () => {
                    const canvas = document.createElement('canvas');
                    let width = img.width;
                    let height = img.height;
                    const MAX_SIZE = 1200; // Calidad media-alta para tablas de posiciones

                    if (width > height) {
                        if (width > MAX_SIZE) {
                            height *= MAX_SIZE / width;
                            width = MAX_SIZE;
                        }
                    } else {
                        if (height > MAX_SIZE) {
                            width *= MAX_SIZE / height;
                            height = MAX_SIZE;
                        }
                    }
                    canvas.width = width;
                    canvas.height = height;
                    const ctx = canvas.getContext('2d');
                    ctx?.drawImage(img, 0, 0, width, height);
                    resolve(canvas.toDataURL('image/jpeg', 0.85));
                };
            };
        });
    };

    const handlePaste = useCallback(async (event: ClipboardEvent) => {
        const items = event.clipboardData?.items;
        if (!items) return;

        for (let i = 0; i < items.length; i++) {
            if (items[i].type.indexOf('image') !== -1) {
                const blob = items[i].getAsFile();
                if (blob) {
                    setIsPasting(true);
                    toast.info("Subiendo recorte...");
                    try {
                        const base64 = await compressImage(blob);
                        onAddPhoto(base64);
                        toast.success("Tabla actualizada");
                    } catch (e) {
                        toast.error("Error al procesar el recorte");
                    } finally {
                        setIsPasting(false);
                    }
                }
            }
        }
    }, [onAddPhoto, toast]);

    useEffect(() => {
        window.addEventListener('paste', handlePaste);
        return () => window.removeEventListener('paste', handlePaste);
    }, [handlePaste]);

    const sortedPhotos = [...photos].sort((a, b) => b.timestamp - a.timestamp);

    return (
        <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-xl p-6 md:p-8 animate-fadeIn border-t-8 border-indigo-500 min-h-[70vh]">
            <header className="mb-8 text-center">
                <h2 className="text-4xl font-black italic uppercase tracking-tighter text-gray-800 dark:text-white">TABLA DE POSICIONES</h2>
                <p className="text-gray-500 font-bold text-xs uppercase tracking-widest mt-1">Recortes del torneo actual</p>
                
                <div className="mt-6 p-4 bg-indigo-50 dark:bg-indigo-900/20 rounded-2xl border-2 border-dashed border-indigo-200 dark:border-indigo-800">
                    <p className="text-sm font-bold text-indigo-700 dark:text-indigo-400">
                        {isPasting ? "⌛ PROCESANDO..." : "💡 TIP: Saca captura y pega (Ctrl+V) aquí directamente"}
                    </p>
                </div>
            </header>

            {sortedPhotos.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 opacity-50 grayscale">
                    <div className="text-8xl mb-4">📸</div>
                    <p className="font-bold text-xl uppercase tracking-tighter">Sin recortes todavía</p>
                    <p className="text-sm">El admin debe pegar el primer recorte del torneo.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {sortedPhotos.map((photo) => (
                        <div key={photo.id} className="group relative bg-gray-100 dark:bg-gray-900 rounded-2xl overflow-hidden shadow-lg border border-gray-200 dark:border-gray-700 transition-all hover:scale-[1.01]">
                            <img 
                                src={photo.url} 
                                alt="Posiciones" 
                                className="w-full h-auto cursor-pointer"
                                onClick={() => setSelectedPhoto(photo)}
                            />
                            <div className="p-3 flex justify-between items-center bg-white/80 dark:bg-black/50 backdrop-blur-md">
                                <div>
                                    <p className="text-[10px] font-black text-gray-500 uppercase">Subido por: {photo.uploadedBy}</p>
                                    <p className="text-[10px] font-medium text-gray-400">{new Date(photo.timestamp).toLocaleDateString()} - {new Date(photo.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</p>
                                </div>
                                {isAdmin && (
                                    <button 
                                        onClick={() => { if(window.confirm("¿Borrar este recorte?")) onDeletePhoto(photo.id); }}
                                        className="p-2 bg-red-100 text-red-600 rounded-lg hover:bg-red-600 hover:text-white transition-all"
                                    >
                                        🗑️
                                    </button>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Lightbox / Full Screen View */}
            {selectedPhoto && (
                <div className="fixed inset-0 z-[100] bg-black/95 flex flex-col p-4 animate-fadeIn" onClick={() => setSelectedPhoto(null)}>
                    <div className="flex justify-end p-4">
                        <button className="text-white text-4xl font-black">&times;</button>
                    </div>
                    <div className="flex-1 flex items-center justify-center overflow-hidden">
                        <img 
                            src={selectedPhoto.url} 
                            className="max-w-full max-h-full object-contain shadow-2xl rounded-lg" 
                            onClick={e => e.stopPropagation()}
                            alt="Posiciones"
                        />
                    </div>
                    <div className="text-center p-6 text-white/50 text-xs font-bold uppercase tracking-widest">
                        Toca en cualquier lado para cerrar
                    </div>
                </div>
            )}
        </div>
    );
};
