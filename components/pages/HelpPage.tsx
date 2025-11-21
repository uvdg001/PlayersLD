import React from 'react';

const HelpSection: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
    <div className="mb-8">
        <h2 className="text-2xl font-bold text-indigo-600 dark:text-indigo-400 mb-4 pb-2 border-b-2 border-indigo-200 dark:border-indigo-800">{title}</h2>
        <div className="space-y-4 text-gray-700 dark:text-gray-300">
            {children}
        </div>
    </div>
);

const Feature: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
     <div className="bg-gray-100 dark:bg-gray-700/50 p-4 rounded-lg">
        <h3 className="font-semibold text-lg text-gray-800 dark:text-gray-100">{title}</h3>
        <p className="mt-1 text-sm">{children}</p>
    </div>
);

export const HelpPage: React.FC<{isAdmin: boolean}> = ({isAdmin}) => {
    return (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 md:p-8">
            <h1 className="text-3xl font-bold text-center text-gray-800 dark:text-gray-100 mb-8">Guía de Uso de la App</h1>

            {isAdmin && (
                 <HelpSection title="🚀 Configuración Inicial (Paso a Paso para Admins)">
                    <p>¡Bienvenido, admin! Sigue estos pasos para dejar la app lista para todo el equipo:</p>
                    <Feature title="1. Configura tu Equipo">
                        Ve a la sección <strong>"Mi Equipo"</strong>. Asigna un nombre, sube el escudo y elige los colores que identifican al equipo. ¡Esta es la identidad de PLAYERS LD!
                    </Feature>
                     <Feature title="2. Carga la Plantilla de Jugadores">
                        Haz clic en <strong>"Plantilla"</strong> en la barra de navegación. Agrega a cada uno de los jugadores con sus datos: nombre, apodo, rol, nivel de habilidad y un PIN de 4 dígitos que usarán para ingresar.
                    </Feature>
                     <Feature title="3. Registra Canchas y Rivales">
                        Visita las secciones <strong>"Canchas"</strong> y <strong>"Rivales"</strong> para añadir los lugares donde juegan habitualmente y los equipos que enfrentan. Esto te ahorrará tiempo al crear partidos.
                    </Feature>
                     <Feature title="4. Crea el Primer Torneo">
                       En la sección <strong>"Torneos"</strong>, crea tu primera competición, por ejemplo, "Torneo Apertura 2025".
                    </Feature>
                     <Feature title="5. Programa la Primera Fecha">
                        Dentro del torneo que creaste, haz clic en <strong>"+ Agregar Fecha"</strong>. Completa los datos del partido: selecciona la cancha, el rival, la fecha, hora y el costo.
                    </Feature>
                     <Feature title="6. ¡A Jugar!">
                        ¡Todo listo! Ahora los jugadores pueden entrar a la app, ver el partido en la página principal y confirmar su asistencia.
                    </Feature>
                </HelpSection>
            )}

            <HelpSection title="Gestión de Poder (Roles)">
                 <p>La aplicación maneja una jerarquía inteligente para delegar responsabilidades sin perder el control.</p>
                <Feature title="👑 Administrador Principal (Dueño)">
                    Es el usuario con ID 9 (o el configurado inicialmente). Tiene acceso total y permanente. Es el único que puede nombrar o revocar Sub-Administradores.
                </Feature>
                <Feature title="⭐ Sub-Administradores (Temporales)">
                    <p className="mb-2">El Admin Principal puede nombrar hasta <strong>2 colaboradores</strong> desde la sección "Mi Equipo".</p>
                    <ul className="list-disc list-inside text-sm pl-2 space-y-1">
                        <li><strong>Duración:</strong> El poder dura exactamente <strong>7 días</strong>.</li>
                        <li><strong>Renovación:</strong> El sistema revocará automáticamente los permisos al finalizar la semana. El Admin debe volver a nombrarlos manualmente si desea renovarles el cargo ("se renovará o no").</li>
                        <li><strong>Poderes:</strong> Tienen acceso a gestionar partidos, pagos, torneos y plantilla (igual que el admin), pero NO pueden nombrar otros administradores.</li>
                    </ul>
                </Feature>
            </HelpSection>

            <HelpSection title="Para Jugadores">
                <p>Como jugador, tienes acceso a todas las funciones para mantenerte al día con el equipo y los partidos.</p>
                <Feature title="Página Principal (Partido)">
                    Aquí verás toda la información del próximo partido: fecha, hora, lugar y costo. Tu principal tarea es indicar tu asistencia usando los botones ✅ (Confirmo), ❓ (En duda) o ❌ (No voy). También puedes ver quiénes más confirmaron y chatear con el equipo.
                </Feature>
                <Feature title="Calificaciones (después del partido)">
                    Si el administrador abre las calificaciones, podrás puntuar de 1 a 5 estrellas el desempeño de tus compañeros. ¡Sé honesto pero justo!
                </Feature>
                <Feature title="Chat del Partido">
                    Usa el botón verde de "Chat!" para conversar con tus compañeros sobre el partido actual. Puedes reaccionar a mensajes y personalizar el fondo del chat.
                </Feature>
                 <Feature title="Fixture, Estadísticas y Tesorería">
                    Navega por las distintas secciones para ver el calendario de partidos del torneo, tus estadísticas personales y el estado de las finanzas del equipo.
                </Feature>
            </HelpSection>

            <HelpSection title="Para el Administrador">
                 <p>El administrador tiene permisos adicionales para gestionar todos los aspectos de la aplicación. Para acceder a estas funciones, primero debes seleccionar tu perfil de jugador.</p>
                <Feature title="Gestión de Plantilla">
                    En el menú de navegación, haz clic en "Plantilla" para agregar, editar o eliminar jugadores del equipo.
                </Feature>
                <Feature title="Gestión de Partidos">
                    Puedes editar los detalles del partido directamente en la página principal, como el costo de la cancha, el resultado final y las estadísticas individuales de cada jugador (goles, tarjetas, etc.).
                </Feature>
                 <Feature title="Administración de Torneos, Canchas y Rivales">
                    En sus respectivas secciones, puedes crear, editar y eliminar torneos, canchas y rivales.
                </Feature>
                <Feature title="Abrir/Cerrar Calificaciones">
                    En la tarjeta del partido, encontrarás un panel de "Administración del Partido" que te permite abrir las calificaciones para que los jugadores puedan votarse entre sí, y cerrarlas cuando lo consideres oportuno.
                </Feature>
                 <Feature title="Modo Admin (Omitir PIN)">
                    En la pantalla de selección de usuario, en la esquina inferior derecha, encontrarás un interruptor para activar el <strong>"Modo Admin"</strong>. Esto te permite ingresar a cualquier perfil sin necesidad de saber su PIN, ideal para ayudar a otros jugadores a confirmar su asistencia si no pueden hacerlo ellos mismos.
                </Feature>
            </HelpSection>
        </div>
    );
};