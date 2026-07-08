import React from 'react';
import ReactDOM from 'react-dom/client';

const MockScreen: React.FC<{ children: React.ReactNode, title?: string }> = ({ children, title }) => (
    <div className="w-full max-w-[280px] aspect-[9/16] bg-white dark:bg-gray-900 rounded-[2.5rem] border-[6px] border-gray-800 shadow-2xl overflow-hidden relative flex flex-col mx-auto mb-6 transform hover:rotate-1 transition-transform">
        <div className="h-6 bg-gray-800 w-1/3 mx-auto rounded-b-xl mb-2"></div>
        {title && <p className="text-[8px] font-black text-center uppercase tracking-widest text-gray-400 mb-2">{title}</p>}
        <div className="flex-1 p-4 overflow-hidden">
            {children}
        </div>
    </div>
);

const ManualApp: React.FC = () => {
    return (
        <div className="min-h-screen font-sans scroll-smooth bg-gray-900 text-white selection:bg-indigo-500">
            {/* HERO */}
            <section className="h-screen flex flex-col items-center justify-center p-6 text-center bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')]">
                <div className="w-20 h-20 bg-indigo-600 rounded-3xl flex items-center justify-center text-4xl mb-6 shadow-2xl animate-bounce">⚽</div>
                <h1 className="text-6xl md:text-8xl font-black italic uppercase tracking-tighter mb-4">
                    GUÍA <span className="text-indigo-500">RÁPIDA</span>
                </h1>
                <p className="text-gray-400 font-bold uppercase tracking-[0.3em] text-xs mb-10">Manual Oficial Players LD</p>
                <div className="flex flex-col gap-4">
                    <a href="#paso1" className="px-12 py-5 bg-indigo-600 text-white font-black rounded-2xl uppercase italic tracking-tighter shadow-xl hover:bg-indigo-700 transition-all">Empezar Tutorial</a>
                    <a href="/index.html" className="text-indigo-400 font-black uppercase text-[10px] tracking-widest hover:underline">Saltar e ir a la App</a>
                </div>
            </section>

            {/* PASO 1 */}
            <section id="paso1" className="py-24 px-6 border-t border-white/5">
                <div className="max-w-4xl mx-auto flex flex-col md:flex-row items-center gap-12">
                    <div className="flex-1 order-2 md:order-1">
                        <MockScreen title="Acceso de Equipo">
                            <div className="flex flex-col items-center justify-center h-full gap-4">
                                <div className="w-10 h-10 bg-indigo-100 rounded-full flex items-center justify-center text-xl">⚽</div>
                                <div className="w-full h-8 bg-gray-100 rounded-lg border-2 border-indigo-500 flex items-center justify-center text-xs font-black text-indigo-600">UTN</div>
                                <div className="w-full py-2 bg-indigo-600 rounded-lg text-[8px] font-black text-center">ENTRAR</div>
                            </div>
                        </MockScreen>
                    </div>
                    <div className="flex-1 order-1 md:order-2">
                        <span className="text-indigo-500 font-black text-5xl italic">01.</span>
                        <h2 className="text-4xl font-black uppercase italic tracking-tighter mt-2 mb-4">Entrar al Predio</h2>
                        <p className="text-gray-400 leading-relaxed font-medium">Escribe el nombre de tu equipo tal cual te lo pasó el DT. No importa si usas mayúsculas o minúsculas. <br/><br/><strong>Ejemplo:</strong> UTN, Branca, LosLeones.</p>
                    </div>
                </div>
            </section>

            {/* PASO 2 */}
            <section className="py-24 px-6 bg-black/20">
                <div className="max-w-4xl mx-auto flex flex-col md:flex-row items-center gap-12">
                    <div className="flex-1">
                        <span className="text-indigo-500 font-black text-5xl italic">02.</span>
                        <h2 className="text-4xl font-black uppercase italic tracking-tighter mt-2 mb-4">Buscá tu Camiseta</h2>
                        <p className="text-gray-400 leading-relaxed font-medium">Verás el listado de todos los jugadores del club con sus fotos. Buscá tu cara o tu apodo y tocalo para identificarte.</p>
                    </div>
                    <div className="flex-1">
                        <MockScreen title="¿Quién juega?">
                            <div className="grid grid-cols-3 gap-2">
                                {[1,2,3,4,5,6].map(i => (
                                    <div key={i} className="flex flex-col items-center gap-1 opacity-40">
                                        <div className={`w-10 h-10 rounded-full bg-gray-200 ${i===2 ? 'border-2 border-indigo-500 opacity-100 scale-110' : ''}`}></div>
                                        <div className="w-8 h-1 bg-gray-200 rounded"></div>
                                    </div>
                                ))}
                            </div>
                        </MockScreen>
                    </div>
                </div>
            </section>

            {/* PASO 3 */}
            <section className="py-24 px-6 border-t border-white/5">
                <div className="max-w-4xl mx-auto flex flex-col md:flex-row items-center gap-12">
                    <div className="flex-1 order-2 md:order-1">
                        <MockScreen title="Seguridad PIN">
                            <div className="flex flex-col items-center justify-center h-full">
                                <div className="flex gap-2 mb-6">
                                    {[1,2,3,4].map(i => <div key={i} className="w-3 h-3 rounded-full bg-indigo-500"></div>)}
                                </div>
                                <div className="grid grid-cols-3 gap-2 w-full px-4">
                                    {[1,2,3,4,5,6,7,8,9].map(i => <div key={i} className="aspect-square bg-gray-100 dark:bg-gray-800 rounded-lg flex items-center justify-center text-[8px] font-bold">{i}</div>)}
                                </div>
                            </div>
                        </MockScreen>
                    </div>
                    <div className="flex-1 order-1 md:order-2">
                        <span className="text-indigo-500 font-black text-5xl italic">03.</span>
                        <h2 className="text-4xl font-black uppercase italic tracking-tighter mt-2 mb-4">La Llave Maestra</h2>
                        <p className="text-gray-400 leading-relaxed font-medium">Para que nadie se haga pasar por vos, necesitás un PIN de 4 dígitos. <br/><br/>Si es tu primera vez, el código es <span className="text-white font-black">0000</span>. ¡Cambiálo apenas entres en tu perfil!</p>
                    </div>
                </div>
            </section>

            {/* PASO 4 */}
            <section className="py-24 px-6 bg-indigo-600 text-white">
                <div className="max-w-4xl mx-auto text-center">
                    <h2 className="text-5xl font-black uppercase italic tracking-tighter mb-8">¡Ya estás adentro!</h2>
                    <div className="grid md:grid-cols-3 gap-8">
                        <div className="bg-white/10 p-6 rounded-3xl backdrop-blur-md">
                            <div className="text-3xl mb-4">✅</div>
                            <h4 className="font-black uppercase mb-2">Confirmá</h4>
                            <p className="text-xs opacity-80 uppercase font-bold">Marcá tu asistencia en la pantalla principal para que el DT te cuente.</p>
                        </div>
                        <div className="bg-white/10 p-6 rounded-3xl backdrop-blur-md">
                            <div className="text-3xl mb-4">⭐</div>
                            <h4 className="font-black uppercase mb-2">Votá</h4>
                            <p className="text-xs opacity-80 uppercase font-bold">Después del partido, calificá a tus compañeros en "La Urna". Es obligatorio.</p>
                        </div>
                        <div className="bg-white/10 p-6 rounded-3xl backdrop-blur-md">
                            <div className="text-3xl mb-4">💬</div>
                            <h4 className="font-black uppercase mb-2">Chat</h4>
                            <p className="text-xs opacity-80 uppercase font-bold">Hablamos, nos reímos y mandamos sonidos ruidosos en el chat del equipo.</p>
                        </div>
                    </div>
                </div>
            </section>

            {/* FOOTER */}
            <footer className="py-20 text-center border-t border-white/5 bg-black">
                <p className="text-gray-500 font-black uppercase text-[10px] tracking-widest mb-6">¿Dudas? Consultá la sección AYUDA dentro de la app</p>
                <a href="/index.html" className="inline-block px-16 py-6 bg-white text-indigo-900 font-black rounded-3xl uppercase italic tracking-tighter text-2xl shadow-2xl hover:scale-105 transition-all">ENTRAR A JUGAR ⚡</a>
            </footer>

            <style dangerouslySetInnerHTML={{ __html: `
                @keyframes fadeIn {
                    from { opacity: 0; transform: translateY(20px); }
                    to { opacity: 1; transform: translateY(0); }
                }
                .animate-fadeIn {
                    animation: fadeIn 0.8s ease-out forwards;
                }
                html { scroll-behavior: smooth; }
            `}} />
        </div>
    );
};

ReactDOM.createRoot(document.getElementById('manual-root')!).render(
    <React.StrictMode>
        <ManualApp />
    </React.StrictMode>
);