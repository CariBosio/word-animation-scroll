# 🌍 Word Animation Scroll — World Travel & Editorial Explorer

[![Vercel Deployment](https://img.shields.io/badge/Vercel-Deployed-black?style=for-the-badge&logo=vercel)](https://word-animation-scroll.vercel.app/)
[![React](https://img.shields.io/badge/React-18-61DAFB?style=for-the-badge&logo=react&logoColor=black)](https://react.dev/)
[![Vite](https://img.shields.io/badge/Vite-Bundler-646CFF?style=for-the-badge&logo=vite&logoColor=white)](https://vitejs.dev/)
[![GSAP](https://img.shields.io/badge/GSAP-Animations-88CE02?style=for-the-badge&logo=greensock&logoColor=white)](https://greensock.com/)
[![Google Gemini](https://img.shields.io/badge/Gemini_API-Generative_AI-4285F4?style=for-the-badge&logo=google&logoColor=white)](https://ai.google.dev/)
[![Neon Database](https://img.shields.io/badge/Neon-PostgreSQL-00E599?style=for-the-badge&logo=postgresql&logoColor=black)](https://neon.tech/)

> Una experiencia web interactiva inspirada en el diseño editorial de alta gama. Combina animaciones fluidas basadas en scroll, búsqueda semántica potenciada por Inteligencia Artificial y micro-narrativas de viaje generadas en tiempo real.

🔗 **Demo en producción**: [word-animation-scroll.vercel.app](https://word-animation-scroll.vercel.app/)

---

## ✨ Características Principales

- **Experiencia Inmersiva & Scrollytelling**: Integración de **Lenis Smooth Scroll** con **GSAP (ScrollTrigger & ScrollTo)** para transiciones de frames de alta fidelidad, efectos parallax y cursores personalizados.
- **Búsqueda Semántica con IA (Google Gemini)**: Capacidad de interpretar intenciones de viaje y vibra (ej.: *"playas paradisíacas"*, *"auroras boreales y frío"*) mapeando conceptos a códigos de países ISO en tiempo real.
- **Generación Editorial "La Esencia"**: Micro-reseñas poéticas generadas dinámicamente para cada país mediante LLM, optimizadas con un sistema de caché en memoria por idioma para mitigar límites de cuota (429/503).
- **Internacionalización Completa (i18n)**: Soporte bilingüe dinámico (**Español / Inglés**) con traducción de interfaz, nombres oficiales de países vía estándar ISO y formateo regional de cifras (`Intl.NumberFormat`).
- **Cartografía Interactiva**: Visualización geográfica detallada de cada país con **Leaflet / React Leaflet** y marcadores vectoriales.
- **Base de Datos Serverless en la Nube**: Persistencia y consulta optimizada de más de 240 países y territorios en **Neon PostgreSQL** a través del driver serverless `@neondatabase/serverless`.

---

## 🛠️ Stack Tecnológico

### Frontend
- **Framework**: React 18
- **Tooling & Build**: Vite
- **Animaciones**: GSAP (GreenSock), ScrollTrigger, ScrollToPlugin, `@studio-freight/lenis`
- **Mapas**: Leaflet, React-Leaflet
- **Internacionalización**: Context API, `i18n-iso-countries`
- **Estilos**: Pure Modern CSS (Dark Mode first, tipografías y estética editorial)

### Backend & Arquitectura Serverless
- **Runtime**: Node.js con Express
- **Serverless**: Vercel Serverless Functions (`/api` rewrite routing)
- **Base de Datos**: PostgreSQL Serverless en Neon
- **IA Generativa**: Google Gemini API (`generativelanguage.googleapis.com`)
- **Resiliencia & Caché**: Memoria volátil indexada (`country_lang` y `query_hash`) con fallback graceful ante picos de demanda.

---

## 📁 Estructura del Proyecto

```plaintext
word-animation-scroll/
├── .vscode/                  # Configuración y tareas del editor (tasks.json)
├── api/
│   └── index.js              # Entry point Serverless para Vercel
├── public/
│   ├── frames/               # Secuencia de imágenes/frames para la animación del Hero
│   └── ...                   # Assets estáticos globales (íconos, favicon)
├── src/
│   ├── assets/               # Fuentes y recursos visuales vectoriales
│   ├── components/
│   │   ├── AnimatedCounter/  # Contador animado de métricas numéricas
│   │   ├── CountryDetail/    # Ficha del país, mapa Leaflet y generación de "La Esencia"
│   │   ├── CountryGrid/      # Grilla de países con scroll infinito y filtros
│   │   ├── CustomCursor/     # Cursor reactivo interactivo
│   │   ├── Footer/           # Pie de página editorial
│   │   ├── Hero/             # Sección principal con scrollytelling y canvas/frames
│   │   └── LanguageToggle/   # Selector de idioma de la interfaz (ES / EN)
│   ├── App.css               # Estilos globales y layout de la aplicación
│   ├── App.jsx               # Componente principal, estado global, Lenis y GSAP
│   ├── index.css             # Reseteo base, tokens y tipografías
│   ├── LanguageContext.js    # Definición del contexto de internacionalización (i18n)
│   ├── LanguageProvider.jsx  # Proveedor de estado global para idiomas y traducciones
│   ├── main.jsx              # Punto de entrada de React en el DOM
│   ├── translations.js       # Diccionario bilingüe para textos de la interfaz
│   └── useLanguage.js        # Custom hook para consumir el contexto de idioma
├── .cursorrules              # Reglas y directivas de desarrollo del proyecto
├── .env                      # Variables de entorno locales (ignorado en git)
├── .gitignore                # Reglas de exclusión de Git (protección de credenciales)
├── eslint.config.js          # Configuración de linter ESLint
├── index.html                # Plantilla HTML raíz de Vite
├── package-lock.json         # Árbol de versiones bloqueadas de dependencias
├── package.json              # Dependencias del proyecto y scripts de ejecución
├── README.md                 # Documentación completa del proyecto
├── server.js                 # Servidor Express, endpoints de Neon y Gemini API
├── vercel.json               # Reglas de routing y rewrites para Vercel Functions
└── vite.config.js            # Configuración de Vite con proxy para desarrollo local
```

---

## 🚀 Instalación y Ejecución Local

### Prerrequisitos
- Node.js (v18+)
- Cuenta y base de datos de países creada en [Neon](https://neon.tech/).
- Clave de API de [Google AI Studio](https://aistudio.google.com/).

### 1. Clonar el repositorio
```bash
git clone [https://github.com/CariBosio/word-animation-scroll.git](https://github.com/CariBosio/word-animation-scroll.git)
cd word-animation-scroll
```

### 2. Instalar dependencias
```bash
npm install
```

### 3. Configurar variables de entorno
Crea un archivo `.env` en la raíz del proyecto:
```env
GOOGLE_GENAI_API_KEY=tu_gemini_api_key
DATABASE_URL=postgres://usuario:password@endpoint.neon.tech/neondb?sslmode=require
VITE_NEON_URL=postgres://usuario:password@endpoint.neon.tech/neondb?sslmode=require
PORT=3001
```

### 4. Iniciar en desarrollo
En dos terminales independientes:

```bash
# Terminal 1 - Backend (Express + Neon + Gemini)
node server.js

# Terminal 2 - Frontend (Vite + React + GSAP + Lenis)
npm run dev
```

Visita `http://localhost:5173` en tu navegador.

---

## ☁️ Despliegue en Vercel

El repositorio está preconfigurado para desplegarse como una aplicación híbrida (Frontend estático + Serverless Functions):

1. Importar el repositorio en Vercel.
2. Seleccionar el preset **Vite**.
3. Configurar las **Environment Variables** en el dashboard del proyecto:
   - `GOOGLE_GENAI_API_KEY`
   - `DATABASE_URL`
   - `VITE_NEON_URL`
4. Desplegar. El archivo `vercel.json` reescribirá automáticamente las llamadas `/api/*` hacia `/api/index.js`.

---

## 📄 Licencia

Proyecto desarrollado con fines educativos y de portfolio personal. Todos los derechos reservados.