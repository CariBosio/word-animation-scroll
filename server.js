import "dotenv/config";
import express from "express";
import cors from "cors";
import pg from "pg";
import process from "node:process";
import { neon } from "@neondatabase/serverless";

const { Pool } = pg;

const sql = neon(process.env.VITE_NEON_URL || process.env.DATABASE_URL);

// --- GEMINI CONFIGURATION ---
const app = express();
app.use(cors());
app.use(express.json());

// --- 🧠 ROUTE: AI EDITORIAL TEXT GENERATION ---
const essenceCache = {};
app.get("/api/country-essence/:name", async (req, res) => {
  const countryName = req.params.name;
  const lang = req.query.lang || "en"; // 👈 1. Leemos el parámetro de idioma del frontend

  // 👈 2. La clave de caché debe incluir el idioma ("Afghanistan_es", "Afghanistan_en")
  const cacheKey = `${countryName}_${lang}`;

  // 1. Check if data exists in cache to save API quota
  if (essenceCache[cacheKey]) {
    return res.json({ essence: essenceCache[cacheKey] });
  }

  const apiKey = process.env.GOOGLE_GENAI_API_KEY;
  const url = `https://generativelanguage.googleapis.com/v1/models/gemini-2.5-flash:generateContent?key=${apiKey}`;

  // 👈 3. Forzar explícitamente el idioma en el prompt
  const targetLanguage = lang === "es" ? "Spanish (Español)" : "English";
  const promptText = `Write a poetic, atmospheric, luxury travel magazine paragraph capturing the soul and essence of ${countryName}.
Write it strictly in ${targetLanguage}.
Maximum 45 words. Do not use quotes, bold text, or markdown, just the plain text paragraph.`;

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              {
                text: promptText,
              },
            ],
          },
        ],
      }),
    });

    const data = await response.json();

    if (data.candidates && data.candidates[0].content.parts[0].text) {
      const aiText = data.candidates[0].content.parts[0].text.trim();

      // 2. Store response in cache con su clave compuesta
      essenceCache[cacheKey] = aiText;

      res.json({ essence: aiText });
    } else if (data.error && data.error.code === 429) {
      // 3. Graceful handling of API rate limit errors en el idioma adecuado
      res.status(429).json({
        essence:
          lang === "es"
            ? `El oráculo está descansando un momento. Explora la belleza de ${countryName} y vuelve a intentarlo en unos segundos.`
            : `The oracle is resting for a moment. Explore the beauty of ${countryName} and try again in a few seconds.`,
      });
    } else {
      throw new Error("Unexpected structure");
    }
  } catch (error) {
    console.error("💥 Gemini route failure:", error);
    res.json({
      essence:
        lang === "es"
          ? `Descubre la magia y el encanto inigualable de ${countryName}.`
          : `Experience the unique spirit of ${countryName}.`,
    });
  }
});

// --- 🧠 ROUTE: SEMANTIC SEARCH WITH MEMORY CACHE (Anti-429 & Ultra Fast) ---
const semanticCache = {}; // 🎯 Memoria volátil para guardar búsquedas repetidas

app.post("/api/semantic-search", async (req, res) => {
  const { query } = req.body;

  if (!query) return res.json({ matches: [] });

  // Normalizamos la frase (en minúsculas y sin espacios raros) para usarla como clave de caché
  const cacheKey = query.toLowerCase().trim();

  // 🚀 SI YA SE BUSCÓ ANTES: Respondemos al instante (0ms) sin tocar la API de Google
  if (semanticCache[cacheKey]) {
    console.log(`⚡ [CACHED MATCH] Instant response for: "${query}"`);
    return res.json({ matches: semanticCache[cacheKey] });
  }

  const apiKey = process.env.GOOGLE_GENAI_API_KEY;
  const url = `https://generativelanguage.googleapis.com/v1/models/gemini-2.5-flash:generateContent?key=${apiKey}`;

  try {
    const dbCountries = await sql`SELECT id_code, name, continent FROM countries`;

    const simplifiedCountries = dbCountries.map(c => ({
      id_code: c.id_code,
      name: c.name,
      continent: c.continent
    }));

    const prompt = `
      You are an expert travel psychologist. Analyze this request: "${query}".
      Based ONLY on this list: ${JSON.stringify(simplifiedCountries)}
      Select up to 12 countries that best match the vibe, climate, or activities implied.
      Return ONLY a valid JSON string array of 3-letter country codes, like this: ["ARG", "ESP", "FRA"].
      No markdown, no text explanations.
    `;

    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }]
      })
    });

    // 🛡️ CONTROL DE CUOTA EXCEDIDA (429): Fallback elegante
  // 🛡️ ESCUDO PROTECTOR PARA LA CAPA GRATUITA (429 y 503)
    if (response.status === 429 || response.status === 503) {
      console.warn(`⚠️ Gemini API ocupada (Status: ${response.status}). Enviando señal de reset.`);
      
      // Enviamos el código 200 pero avisando que el servicio está caído momentáneamente
      return res.json({ 
        matches: [], 
        isAiUnavailable: true 
      });
    }

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`❌ Gemini API Error (${response.status}):`, errorText);
      return res.json({ matches: [] });
    }

    const data = await response.json();
    let aiText = data.candidates[0].content.parts[0].text.trim();
    
    const jsonMatch = aiText.match(/\[[\s\S]*?\]/);
    if (jsonMatch) {
      aiText = jsonMatch[0];
    }
    
    const matchedCodes = JSON.parse(aiText);
    const cleanCodes = Array.isArray(matchedCodes) ? matchedCodes.map(code => code.toUpperCase()) : [];
    
    // 🎯 GUARDAMOS EN CACHÉ: La próxima vez esta misma frase vuela
    semanticCache[cacheKey] = cleanCodes;

    console.log(`🎯 AI Match Success for "${query}":`, cleanCodes);
    res.json({ matches: cleanCodes });
  } catch (error) {
    console.error("💥 Semantic Search Failure:", error.message);
    res.json({ matches: [] });
  }
});

// --- 🌍 ROUTE: MAIN COUNTRIES DATA GRID ---
app.get("/api/countries", async (req, res) => {
  try {
    const countries = await sql`
      SELECT * FROM countries ORDER BY name ASC
    `;
    res.json(countries);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// --- 📦 ROUTE: FULL DATABASE DATA IMPORT FROM SAFE BACKUP ---
app.get("/api/import-countries", async (req, res) => {
  try {
    // Verified static clone of RestCountries v3.1 containing all required payload fields
    const backupUrl =
      "https://gist.githubusercontent.com/ejirocodes/f682b045d23a42f14e232d72ba4ac5e3/raw/bd9f896daba8e6d8cb1ae4e60c31d139568b3cc2/countries.json";

    const response = await fetch(backupUrl);
    if (!response.ok) {
      throw new Error(`Connection error: ${response.status}`);
    }
    const text = await response.text();
    const data = new Function(`return ${text}`)();

    if (!Array.isArray(data))
      return res.status(500).json({ error: "Invalid data structure" });

    for (const c of data) {
      const name = c.translations?.spa?.common || c.name?.common || "Unknown";
      const continent = c.continents?.[0] || c.region || "Other";
      const flag = c.flags?.png || c.flags?.svg || "";
      const id = c.cca3 ? c.cca3.toUpperCase() : "";
      const population = c.population ? parseInt(c.population, 10) : 0;
      const capital = c.capital?.[0] || "N/A";
      const languages = c.languages
        ? Object.values(c.languages).join(", ")
        : "N/A";
      const currency = c.currencies
        ? Object.values(c.currencies)
            .map((m) => `${m.name || "Currency"} (${m.symbol || ""})`)
            .join(", ")
        : "N/A";
      const area = c.area ? Math.round(c.area) : 0;
      const lat = c.latlng?.[0] || 0;
      const lng = c.latlng?.[1] || 0;
      const borders = c.borders ? c.borders.join(",") : "";

      // Surgical database upsert safely preserving user-curated assets
      await sql`
        INSERT INTO countries (id_code, name, continent, flag, population, capital, languages, currency, area, latitude, longitude, borders)
        VALUES (${id}, ${name}, ${continent}, ${flag}, ${population}, ${capital}, ${languages}, ${currency}, ${area}, ${lat}, ${lng}, ${borders})
        ON CONFLICT (id_code)
        DO UPDATE SET 
          population = EXCLUDED.population,
          capital = EXCLUDED.capital,
          languages = EXCLUDED.languages,
          currency = EXCLUDED.currency,
          area = EXCLUDED.area,
          latitude = EXCLUDED.latitude,
          longitude = EXCLUDED.longitude,
          borders = EXCLUDED.borders
      `;
    }
    res.json({
      message: "Import completed successfully from the secure backup source",
    });
  } catch (error) {
    console.error("❌ Import process failure:", error);
    res
      .status(500)
      .json({ error: "Internal server error during data processing" });
  }
});

const PORT = 3001;

// 1. Initial health-check verifying environment credentials on boot
console.log("🔌 Verifying Neon credentials...");
console.log(
  "VITE_NEON_URL:",
  process.env.VITE_NEON_URL ? "✅ Detected" : "❌ Not found",
);
console.log(
  "DATABASE_URL:",
  process.env.DATABASE_URL ? "✅ Detected" : "❌ Not found",
);
console.log(
  "GOOGLE_GENAI_API_KEY:",
  process.env.GOOGLE_GENAI_API_KEY ? "✅ Detected" : "❌ Not found",
);

// 2. Initialize Express application only in local development
if (!process.env.VERCEL) {
  try {
    const server = app.listen(PORT, () => {
      console.log(
        `🚀 Robust server with AI features running on http://localhost:${PORT}`,
      );
    });

    server.on("error", (err) => {
      console.error(
        "❌ Critical Express server failure on port startup:",
        err.message,
      );
    });
  } catch (error) {
    console.error(
      "❌ Failed to initialize Express server daemon:",
      error.message,
    );
  }
}

// 3. FAIL-SAFE OVERLAYS: Global process catchers to prevent runtime silent crashes
process.on("unhandledRejection", (reason) => {
  console.error("💥 Unhandled asynchronous promise rejection caught:", reason);
});

process.on("uncaughtException", (err) => {
  console.error(
    "💥 Unexpected critical exception on main execution thread:",
    err.message,
  );
});

export default app;