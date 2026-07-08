
import React, { useState } from 'react';

interface HelpItem {
    t: string; // Title
    d: string; // Description
    stepsList?: string[]; // Step by step
    example?: string; // Concrete example
    icon?: string;
    warning?: string; // Warning message
}

interface HelpSection {
    title: string;
    items: HelpItem[];
    adminOnly?: boolean;
    technical?: boolean;
}

export const HelpPage: React.FC<{isAdmin: boolean, onWipeFixture?: () => void, onInstallApp?: () => void}> = ({isAdmin, onWipeFixture, onInstallApp}) => {
    const [expandedIndex, setExpandedIndex] = useState<string | null>(null);

    const toggleExpand = (index: string) => {
        setExpandedIndex(expandedIndex === index ? null : index);
    };

    const handleWipeClick = () => {
        const confirm1 = window.confirm("⚠️ ZONA DE PELIGRO ⚠️\n\n¿Estás seguro de que quieres BORRAR TODO EL FIXTURE?\n\nSe eliminarán:\n- Todos los partidos\n- Torneos\n- Canchas\n- Rivales\n- Estadísticas e Historial\n\nLos jugadores se mantendrán.");
        if (confirm1) {
            const confirm2 = window.confirm("Última advertencia. Esta acción NO se puede deshacer. ¿Proceder?");
            if (confirm2 && onWipeFixture) {
                onWipeFixture();
            }
        }
    };

    const helpData: HelpSection[] = [
        {
            title: "🔐 Acceso y PINs",
            items: [
                {
                    t: "¿Cómo entro si me pide PIN?",
                    d: "El sistema de seguridad para evitar que otros usen tu usuario.",
                    icon: "🔑",
                    stepsList: [
                        "Toca tu nombre en la lista.",
                        "Escribe tu código de 4 números.",
                        "Si nunca lo cambiaste, el código por defecto es '0000'."
                    ],
                    warning: "Si olvidaste tu PIN, pídele al Administrador que te lo resetee desde la sección 'Plantilla'."
                },
                {
                    t: "Cambiar mi Foto y PIN",
                    d: "Personaliza tu perfil.",
                    icon: "👤",
                    stepsList: [
                        "Arriba a la derecha, toca tu foto pequeña (o el círculo gris).",
                        "Elige 'Editar Perfil'.",
                        "Para la FOTO: Toca 'Subir Imagen' y elige una de tu galería.",
                        "Para el PIN: Borra el número actual y escribe 4 números nuevos que recuerdes.",
                        "Toca 'Guardar' al final."
                    ]
                },
                {
                    t: "Asignar PIN a un Jugador (Solo Admin)",
                    d: "Cómo ponerle contraseña a un compañero.",
                    icon: "🛡️",
                    stepsList: [
                        "Ve al menú 'Plantilla'.",
                        "Busca al jugador y toca el lápiz (✏️) para editar.",
                        "En el campo 'PIN', escribe el número que quieras (ej: 1234).",
                        "Guarda los cambios.",
                        "Avísale al jugador su nuevo PIN."
                    ]
                }
            ]
        },
        {
            title: "⚽ Partidos y Convocatoria",
            items: [
                {
                    t: "Confirmar si juego",
                    d: "El semáforo de asistencia.",
                    icon: "🚦",
                    stepsList: [
                        "Ve a la pantalla principal ('Partido').",
                        "Busca tu tarjeta.",
                        "✅ VERDE: Vas seguro.",
                        "❓ AMARILLO: Estás en duda (cuenta como que NO hasta que confirmes).",
                        "❌ ROJO: No vas (libera cupo)."
                    ]
                },
                {
                    t: "Logística (Ropa y Agua)",
                    d: "¿A quién le toca llevar las cosas?",
                    icon: "👕",
                    stepsList: [
                        "Ve a la sección 'Utilería'.",
                        "El sistema muestra quién debe lavar las camisetas, llevar agua, pelotas y botiquín.",
                        "El Admin asigna esto basándose en el historial (quien lo hizo menos veces).",
                        "Si te toca, aparecerá tu nombre en la tarjeta correspondiente."
                    ]
                }
            ]
        },
        {
            title: "⭐ Votación",
            items: [
                {
                    t: "¿Cómo calificar?",
                    d: "Para poder calificar, se deben cumplir estas condiciones:",
                    icon: "🗳️",
                    stepsList: [
                        "El partido debe haber terminado y estar en estado 'FINALIZADO'.",
                        "El Administrador debe 'Abrir la Votación' para ese partido.",
                        "Debes haber jugado ese partido (estado 'Confirmado' en la convocatoria).",
                        "La votación para ese partido no debe haber expirado (dura 14 días)."
                    ]
                }
            ]
        },
        {
            title: "🍻 3er Tiempo y Gastos",
            items: [
                {
                    t: "Cargar Consumo",
                    d: "Registrar lo que se comió y bebió.",
                    icon: "🍕",
                    stepsList: [
                        "Ve a la pestaña '3er Tiempo'.",
                        "Elige el partido que terminó.",
                        "Usa los botones '+' y '-' para agregar Cervezas, Pizzas, Hielo, etc.",
                        "El sistema calcula el gasto total automáticamente."
                    ]
                },
                {
                    t: "Estadísticas de Vicios",
                    d: "Comparativa Fútbol vs Joda.",
                    icon: "📈",
                    stepsList: [
                        "En la sección 'Estadísticas', baja hasta 'Economía & Vicios'.",
                        "Verás una barra comparativa del dinero gastado en Cancha vs Alcohol/Comida.",
                        "También verás el ranking de lo más consumido en el año."
                    ]
                }
            ]
        },
        {
            title: "👑 Administración Avanzada",
            adminOnly: true,
            items: [
                {
                    t: "Crear un Torneo y Fechas",
                    d: "Lo primero que debes hacer.",
                    icon: "🏆",
                    stepsList: [
                        "Ve a 'Torneos' -> 'Crear Torneo' (ej: Apertura 2025).",
                        "Luego, toca '+ Agregar Fecha' dentro de ese torneo.",
                        "Elige Día, Hora, Cancha y Rival (si el rival no existe, créalo en la pestaña 'Rivales')."
                    ]
                },
                {
                    t: "Cerrar Partido (Cargar Datos)",
                    d: "El paso más importante post-partido.",
                    icon: "📝",
                    stepsList: [
                        "En la tarjeta del partido (Home), toca el botón negro '🛠️ Cargar Datos / Admin'.",
                        "1. PESTAÑA ASISTENCIA: Confirma quiénes vinieron realmente.",
                        "2. PESTAÑA DATOS: Carga los goles de cada uno (Jugada, Cabeza, Penal).",
                        "3. PAGO: Pon cuánto pagó cada uno. Si pones el total, saldrá verde. Si pones 0, saldrá rojo.",
                        "Al guardar, el resultado del partido se calcula solo sumando los goles."
                    ]
                },
                {
                    t: "Administrar Votación",
                    d: "Abrir o cerrar la urna.",
                    icon: "🔓",
                    stepsList: [
                        "En la tarjeta del partido, abajo verás 'Administrar Votación'.",
                        "Toca 'Abrir Votación' para que los jugadores puedan entrar a calificar.",
                        "Toca 'Cerrar Votación' para bloquearla y calcular los promedios finales."
                    ]
                },
                {
                    t: "Nombrar Sub-Admins",
                    d: "Dar poder a ayudantes.",
                    icon: "🛡️",
                    stepsList: [
                        "Ve a 'Plantilla'.",
                        "Toca el escudo (🛡️) junto al nombre de un jugador.",
                        "Se pondrá verde. Ahora ese jugador puede crear partidos y cargar datos.",
                        "Máximo 2 sub-admins."
                    ]
                }
            ]
        },
        {
            title: "🚀 Configuración de Nuevo Equipo",
            items: [
                {
                    t: "1. Toma de Mando (Primer Ingreso)",
                    d: "Pasos iniciales para el dueño del equipo.",
                    icon: "🏗️",
                    stepsList: [
                        "Abre la app e ingresa el nombre de tu equipo (ej: Quilmes West).",
                        "En la lista de jugadores verás uno llamado 'CAPITÁN'. Ese eres tú.",
                        "Entra con el PIN de fábrica: 0000.",
                        "Ve a tu perfil (arriba a la derecha) y elige 'Editar Perfil'.",
                        "Cambia tu Apodo y pon un PIN secreto para que nadie más entre como admin."
                    ],
                    warning: "Cambia el PIN '0000' de inmediato para asegurar tu equipo."
                },
                {
                    t: "2. Personalización del Club",
                    d: "Escudo y colores oficiales.",
                    icon: "🛡️",
                    stepsList: [
                        "Busca en el menú la sección 'Mi Equipo'.",
                        "Toca en 'Editar'.",
                        "Sube el escudo de tu club y elige los colores que identifican a tu equipo.",
                        "Guarda los cambios para que la app se vea profesional."
                    ]
                },
                {
                    t: "3. Carga de la Plantilla",
                    d: "Cómo traer a tus compañeros.",
                    icon: "📋",
                    stepsList: [
                        "Ve al menú 'Plantilla'.",
                        "Usa el botón verde '+ AGREGAR JUGADOR' para crear a cada compañero.",
                        "Diles que su PIN inicial es '0000' y que cada uno debe cambiarlo en su perfil.",
                        "Puedes asignar roles (Arquero, Defensa, etc.) para que la app sea más precisa."
                    ]
                },
                {
                    t: "4. Tu Primer Partido",
                    d: "Activando el calendario.",
                    icon: "🏟️",
                    stepsList: [
                        "Carga primero a tus 'Rivales' y tus 'Canchas' habituales en sus pestañas.",
                        "Ve a 'Torneos' y crea tu primer campeonato (ej: Clausura 2025).",
                        "Dentro del torneo toca '+ Agregar Fecha' para crear el partido de la semana.",
                        "¡Listo! Al volver al inicio, tus jugadores ya podrán empezar a confirmar."
                    ]
                }
            ]
        }
    ];

    return (
        <div className="max-w-4xl mx-auto pb-12 space-y-8 px-2 md:px-0">
            <div className="text-center py-8 bg-white dark:bg-gray-800 rounded-xl shadow-sm mb-6 border-b-4 border-indigo-500">
                <h1 className="text-4xl font-extrabold text-gray-800 dark:text-gray-100 mb-2">Centro de Ayuda</h1>
                <p className="text-gray-500 dark:text-gray-400">Guía completa de uso y administración.</p>
            </div>

            {/* SECCIÓN DE INSTALACIÓN */}
            <div className="bg-indigo-600 rounded-3xl p-6 text-white shadow-xl mb-8 relative overflow-hidden">
                <div className="relative z-10">
                    <h3 className="text-xl font-black uppercase italic tracking-tighter mb-2">📲 Instalar App en tu Celular</h3>
                    <p className="text-sm opacity-90 mb-6">Ten a mano la App como si fuera de la tienda (Play Store/App Store) con acceso directo y pantalla completa.</p>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="bg-white/10 p-4 rounded-2xl border border-white/20">
                            <p className="font-bold text-xs uppercase mb-2">Opción 1: Automática</p>
                            <button 
                                onClick={onInstallApp}
                                className="w-full py-3 bg-white text-indigo-600 font-black rounded-xl shadow-lg hover:bg-gray-100 transition-all active:scale-95 text-xs uppercase tracking-widest"
                            >
                                Descargar Aplicación
                            </button>
                            <p className="text-[10px] mt-2 opacity-70">* Disponible en Android y Chrome.</p>
                        </div>
                        
                        <div className="bg-white/10 p-4 rounded-2xl border border-white/20">
                            <p className="font-bold text-xs uppercase mb-2">Opción 2: Manual (iPhone/iOS)</p>
                            <div className="flex flex-col gap-2 text-[11px] font-medium italic">
                                <p>1. Toca el icono de compartir ( <span className="text-lg">⎋</span> o <span className="text-lg">⎙</span> ) abajo.</p>
                                <p>2. Busca y toca en: "Añadir a pantalla de inicio".</p>
                                <p>3. ¡Listo! Ya tienes el acceso directo.</p>
                            </div>
                        </div>
                    </div>
                </div>
                <div className="absolute -bottom-4 -right-4 text-8xl opacity-10 rotate-12">📱</div>
            </div>
            
            {isAdmin && onWipeFixture && (
                <div className="bg-red-50 dark:bg-red-900/20 border-2 border-red-500 p-6 rounded-xl animate-pulse-slow">
                    <h3 className="text-xl font-black text-red-600 dark:text-red-400 mb-2">⚠️ ZONA DE PELIGRO</h3>
                    <p className="text-gray-700 dark:text-gray-300 mb-4">
                        Acciones destructivas para reiniciar torneos o limpiar la base de datos.
                    </p>
                    <button 
                        onClick={handleWipeClick}
                        className="px-6 py-3 bg-red-600 hover:bg-red-700 text-white font-bold rounded-lg shadow-lg flex items-center gap-2 transition-transform hover:scale-105"
                    >
                        🗑️ Borrar Fixture y Estadísticas (Reset)
                    </button>
                </div>
            )}
            
            {helpData.map((section, sectionIdx) => {
                if (section.adminOnly && !isAdmin) return null;

                return (
                    <section key={sectionIdx} className="animate-fadeIn">
                        <div className="flex items-center gap-3 mb-4 px-2">
                            <h2 className={`text-2xl font-bold ${section.technical ? 'text-red-600 dark:text-red-400' : 'text-gray-800 dark:text-white'} border-b-2 ${section.technical ? 'border-red-500' : 'border-indigo-500'} pb-1 inline-block`}>
                                {section.title}
                            </h2>
                            {section.adminOnly && <span className="text-[10px] bg-black text-white px-2 py-1 rounded uppercase tracking-wider font-bold">Admin</span>}
                        </div>
                        
                        <div className="space-y-4">
                            {section.items.map((item, itemIdx) => {
                                const uniqueId = `${sectionIdx}-${itemIdx}`;
                                const isExpanded = expandedIndex === uniqueId;

                                return (
                                    <div 
                                        key={itemIdx}
                                        className={`bg-white dark:bg-gray-700 rounded-xl overflow-hidden transition-all duration-300 shadow-md border border-gray-100 dark:border-gray-600 ${isExpanded ? 'ring-2 ring-indigo-500 transform scale-[1.01]' : 'hover:bg-gray-50 dark:hover:bg-gray-600'}`}
                                    >
                                        <div 
                                            className="p-5 flex justify-between items-center cursor-pointer"
                                            onClick={() => toggleExpand(uniqueId)}
                                        >
                                            <div className="flex items-center gap-4">
                                                <div className={`flex-shrink-0 w-12 h-12 rounded-full flex items-center justify-center text-2xl shadow-sm ${isExpanded ? 'bg-indigo-600 text-white' : 'bg-indigo-50 text-indigo-600 dark:bg-gray-800'}`}>
                                                    {item.icon || "❓"}
                                                </div>
                                                <div>
                                                    <h3 className="font-bold text-lg text-gray-800 dark:text-gray-100 leading-tight">{item.t}</h3>
                                                    <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">{item.d}</p>
                                                </div>
                                            </div>
                                            <div className={`transform transition-transform duration-300 text-indigo-500 text-2xl ${isExpanded ? 'rotate-180' : ''}`}>
                                                ▼
                                            </div>
                                        </div>
                                        
                                        {isExpanded && (
                                            <div className="bg-gray-50 dark:bg-gray-800/50 p-6 border-t border-gray-100 dark:border-gray-600">
                                                {item.stepsList && item.stepsList.length > 0 && (
                                                    <div className="mb-4">
                                                        <h4 className="font-bold text-indigo-600 dark:text-indigo-400 mb-3 uppercase text-xs tracking-wider flex items-center gap-2">
                                                            <span>📋</span> Paso a Paso
                                                        </h4>
                                                        <ul className="space-y-3">
                                                            {item.stepsList.map((step, idx) => (
                                                                <li key={idx} className="flex items-start gap-3 text-gray-700 dark:text-gray-300 text-sm md:text-base">
                                                                    <span className="flex-shrink-0 w-6 h-6 rounded-full bg-indigo-100 dark:bg-indigo-900 text-indigo-700 dark:text-indigo-300 flex items-center justify-center text-xs font-bold mt-0.5">
                                                                        {idx + 1}
                                                                    </span>
                                                                    <span>{step}</span>
                                                                </li>
                                                            ))}
                                                        </ul>
                                                    </div>
                                                )}
                                                {item.warning && (
                                                    <div className="bg-red-50 dark:bg-red-900/20 p-4 rounded-lg border-l-4 border-red-500 mt-4">
                                                        <h4 className="font-bold text-red-700 dark:text-red-400 mb-1 uppercase text-xs tracking-wider">⚠️ Atención</h4>
                                                        <p className="text-gray-800 dark:text-gray-200 text-sm">{item.warning}</p>
                                                    </div>
                                                )}
                                                {item.example && (
                                                    <div className="bg-yellow-50 dark:bg-yellow-900/20 p-4 rounded-lg border-l-4 border-yellow-400 mt-4">
                                                        <h4 className="font-bold text-yellow-700 dark:text-yellow-500 mb-1 uppercase text-xs tracking-wider">💡 Ejemplo</h4>
                                                        <p className="text-gray-800 dark:text-gray-200 italic text-sm">"{item.example}"</p>
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    </section>
                );
            })}
        </div>
    );
};
