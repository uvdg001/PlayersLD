# 📋 MEMORIA DE CONTINUIDAD - PROYECTO PLAYERS LD

## 🎯 Objetivo Actual
**Profesionalizar la V1 actual.** Se abandona la idea de crear una V2 desde cero. En su lugar, vamos a refactorizar y embellecer la versión original para que sea escalable, limpia y con diseño Premium.

---

## 🏗️ Estrategia de Trabajo (Sandbox Seguro)
1. **NO TOCAR LA RAÍZ:** Los archivos de la carpeta raíz (donde vive la app en producción) son sagrados. No se modifican para evitar que la gente que usa la app note errores.
2. **LABORATORIO `/v2`:** Usaremos la carpeta `/v2` como nuestro campo de pruebas. Ahí clonaremos la lógica de la V1 y aplicaremos las mejoras.
3. **PREVIEW SEGURO:** Seguiremos usando el link de "V2 Premium" para probar los avances en el celular sin afectar a los usuarios reales.

---

## 💎 Requerimientos de Diseño y Datos
- **Diseño Premium:** Estética de alto impacto, bordes ultra-redondeados (`rounded-[2.5rem]`), tipografía pesada y sombras suaves.
- **Integridad Total de Datos:** La V1 mejorada DEBE incluir todos los campos actuales:
  - Número de Camiseta (#)
  - Posición y Pierna Hábil
  - Fecha de Nacimiento / Edad
  - DNI y Teléfono
  - Estadísticas históricas (Goles, Asistencias, etc.)
- **Reglas de Oro:**
  - ❌ **PROHIBIDO:** Mezclar Azul con Amarillo.
  - ✅ **USAR:** Paleta Indigo, Emerald y Slate.
  - 📱 **Mobile First:** Etiquetas cortas e iconos para evitar desbordamientos en celulares.

---

## 🚀 Próximos Pasos (Próxima Sesión)
1. **Trasplante de Lógica:** Copiar los servicios y la estructura de datos de la V1 a la carpeta `/v2`.
2. **Modularización:** Empezar a "desarmar" el `App.tsx` gigante de la V1 para crear páginas independientes en `/v2/src/pages` (Fixture, Plantilla, Tesorería, etc.).
3. **Implementación de Standby:** Agregar la función de "Bloqueo/Standby" en la nueva Plantilla modularizada.

---

## 💡 Comandos Recordatorios
- `cd v2` -> Entrar al laboratorio.
- `npm run build; firebase hosting:channel:deploy v2-premium` -> Subir avances al link de prueba.
