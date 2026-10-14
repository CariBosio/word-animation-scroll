import React, { useEffect, useState, useRef } from "react";
import { gsap } from "gsap";
import { MapContainer, TileLayer, Marker, useMap } from "react-leaflet";
import L from "leaflet";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import "./CountryDetail.css";
import { useLanguage } from "../../LanguageContext";

gsap.registerPlugin(ScrollTrigger);

const customSvgIcon = L.divIcon({
  className: "custom-icon-container",
  html: `
    <svg width="30" height="42" viewBox="0 0 384 512" xmlns="http://www.w3.org/2000/svg">
      <path 
        fill="#0442a1" 
        stroke="#ffffff" 
        stroke-width="20"
        d="M172.268 501.67C26.97 291.031 0 269.413 0 192 0 85.961 85.961 0 192 0s192 85.961 192 192c0 77.413-26.97 99.031-172.268 309.67-9.535 13.774-29.93 13.773-39.464 0zM192 272c44.183 0 80-35.817 80-80s-35.817-80-80-80-80 35.817-80 80 35.817 80 80 80z"
      />
    </svg>
  `,
  iconSize: [30, 42],
  iconAnchor: [15, 42],
});

const CountryDetail = ({ country, onClose, onNeighborClick, countryNames }) => {
  const { lang, t, getLocalizedCountryName } = useLanguage();

  const [aiEssence, setAiEssence] = useState("");
  const [displayedText, setDisplayedText] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [coords, setCoords] = useState([-34.6, -58.4]);
  const [tooltipText, setTooltipText] = useState("");
  const tooltipRef = useRef(null);

  const detailRef = useRef(null);
  const heroImgRef = useRef(null);

  const localizedName = getLocalizedCountryName
    ? getLocalizedCountryName(country.id_code, country.name)
    : country.name;

  // --- 1. DATA LOGIC FROM NEON AND AI ---
  useEffect(() => {
    window.dispatchEvent(new CustomEvent("mouseleaveCard"));
    window.scrollTo(0, 0);

    if (country.latitude && country.longitude) {
      setCoords([Number(country.latitude), Number(country.longitude)]);
    }

    const fetchAiEssence = async () => {
      setAiEssence("");
      setIsTyping(true);

      try {
        const res = await fetch(
          `/api/country-essence/${encodeURIComponent(country.name)}?lang=${lang}`,
        );
        const data = await res.json();
        setAiEssence(data.essence);
      } catch (err) {
        console.error("❌ Frontend: Error al conectar con el server:", err);
        setAiEssence(
          lang === "es"
            ? `Explora el espíritu único de ${localizedName}.`
            : `Explore the unique spirit of ${country.name}.`,
        );
      }
    };

    fetchAiEssence();

    // Entrance Animation GSAP
    const tl = gsap.timeline({ defaults: { ease: "power3.out" } });
    tl.fromTo(
      ".detail-hero-img",
      { scale: 1.2, filter: "blur(10px)" },
      { scale: 1, filter: "blur(0px)", duration: 1.5 },
    )
      .fromTo(
        ".detail-country-title",
        { y: 50, opacity: 0 },
        { y: 0, opacity: 1, duration: 1 },
        "-=1",
      )
      .fromTo(
        ".infobox-row",
        { opacity: 0, x: -20 },
        { opacity: 1, x: 0, duration: 0.8, stagger: 0.1 },
        "-=0.8",
      )
      .fromTo(
        ".detail-main-content",
        { opacity: 0, y: 30 },
        { opacity: 1, y: 0, duration: 1 },
        "-=0.5",
      );

    return () => tl.kill();
  }, [country, lang]);

  // --- 2. WRITING EFFECT ---
  useEffect(() => {
    if (!aiEssence) return;
    let index = 0;
    setIsTyping(true);
    const interval = setInterval(() => {
      setDisplayedText(aiEssence.slice(0, index + 1));
      index++;
      if (index >= aiEssence.length) {
        clearInterval(interval);
        setIsTyping(false);
      }
    }, 25);
    return () => clearInterval(interval);
  }, [aiEssence]);

  // --- 3. GSAP PARALLAX EFFECT ---
  useEffect(() => {
    if (!heroImgRef.current || !detailRef.current) return;

    const parallaxInstance = ScrollTrigger.create({
      trigger: detailRef.current,
      start: "top top",
      end: "bottom top",
      scrub: true,
      animation: gsap.fromTo(
        heroImgRef.current,
        {
          yPercent: 0,
          scale: 1,
        },
        {
          yPercent: 20,
          scale: 1.3,
          ease: "none",
        },
      ),
    });

    return () => {
      if (parallaxInstance) parallaxInstance.kill();
    };
  }, [country]);

  const bordersArray = country.borders
    ? country.borders.split(",").filter(Boolean)
    : [];

  const handleNeighborClick = (borderCode) => {
    window.scrollTo({ top: 0, behavior: "smooth" });
    onNeighborClick(borderCode);
  };

  function RecenterMap({ coords }) {
    const map = useMap();
    map.setView(coords, 4);
    return null;
  }

  useEffect(() => {
    const moveTooltip = (e) => {
      if (!tooltipRef.current) return;

      gsap.to(tooltipRef.current, {
        x: e.clientX + 15,
        y: e.clientY + 15,
        duration: 0.3,
        ease: "power3.out",
      });
    };

    if (tooltipText) {
      window.addEventListener("mousemove", moveTooltip);
      gsap.to(tooltipRef.current, { opacity: 1, scale: 1, duration: 0.2 });
    } else {
      window.removeEventListener("mousemove", moveTooltip);
      gsap.to(tooltipRef.current, { opacity: 0, scale: 0.8, duration: 0.2 });
    }

    return () => window.removeEventListener("mousemove", moveTooltip);
  }, [tooltipText]);

  return (
    <div ref={detailRef} className="country-detail-overlay">
      <header className="detail-hero-section">
        <img
          ref={heroImgRef}
          src={country.manual_image_url || country.flag}
          alt={localizedName}
          className="detail-hero-img"
          style={{
            objectPosition: `center ${country.image_focus_y || "center"}`,
          }}
        />
        <div className="detail-location-name">
          <svg width="12" height="12" viewBox="0 0 384 512" fill="currentColor">
            <path d="M215.7 499.2C267 435 384 279.4 384 192C384 86 298 0 192 0S0 86 0 192c0 87.4 117 243 168.3 307.2c12.3 15.3 35.1 15.3 47.4 0zM192 128a64 64 0 1 1 0 128 64 64 0 1 1 0-128z" />
          </svg>
          {country.featured_location || localizedName}
        </div>
        <div className="detail-hero-gradient" />
        <button onClick={onClose} className="detail-close-btn">
          {t("close")}
        </button>
      </header>

      <div className="detail-editorial-layout">
        <aside className="detail-sidebar-identity">
          <div className="detail-sticky-container">
            <h1 className="detail-country-title">{localizedName}</h1>
            <p className="detail-country-continent">
              {t(country.continent.toLowerCase().replace(/\s+/g, "")) || country.continent}
            </p>
            <div className="infobox-container">
              <div className="infobox-row">
                <span>{t("code")}</span>
                <span>{country.id_code}</span>
              </div>
              <div className="infobox-row">
                <span>{t("capital")}</span>
                <span>{country.capital || "N/A"}</span>
              </div>
              <div className="infobox-row">
                <span>{t("languages")}</span>
                <span>{country.languages || "N/A"}</span>
              </div>
              <div className="infobox-row">
                <span>{t("currency")}</span>
                <span>{country.currency || "N/A"}</span>
              </div>
              <div className="infobox-row">
                <span>{t("area")}</span>
                <span>
                  {country.area
                    ? `${new Intl.NumberFormat(lang === "es" ? "es-AR" : "en-US").format(country.area)} km²`
                    : "N/A"}
                </span>
              </div>
              <div className="infobox-row">
                <span>{t("population")}</span>
                <span>
                  {Number(country.population).toLocaleString(
                    lang === "es" ? "es-AR" : "en-US",
                  )}
                </span>
              </div>
            </div>
          </div>
        </aside>

        <main className="detail-main-content">
          <section className="detail-content-section">
            <h2>{t("theEssence")}</h2>
            <p
              className={`detail-editorial-text ${isTyping ? "is-typing" : ""}`}
            >
              {displayedText}
            </p>
          </section>

          <section className="detail-content-section">
            <h2>{t("geography")}</h2>
            <div
              className="map-container-luxury"
              style={{ height: "350px", width: "100%", position: "relative" }}
            >
              {coords ? (
                <MapContainer
                  center={coords}
                  zoom={4}
                  scrollWheelZoom={false}
                  style={{ height: "100%", width: "100%", borderRadius: "8px" }}
                >
                  <TileLayer
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                  />

                  <Marker position={coords} icon={customSvgIcon} />
                  <RecenterMap coords={coords} />
                </MapContainer>
              ) : (
                <div className="map-loading">
                  {t("locating")} {localizedName}...
                </div>
              )}
            </div>
          </section>

          <section className="detail-content-section">
            <h2>{t("neighbors")}</h2>
            <div className="detail-neighbors-grid">
              {bordersArray.length > 0 ? (
                bordersArray.map((border) => {
                  const borderName = getLocalizedCountryName
                    ? getLocalizedCountryName(border, countryNames?.[border] || border)
                    : countryNames?.[border] || border;

                  return (
                    <button
                      key={border}
                      className="neighbor-link-btn"
                      onClick={() => handleNeighborClick(border)}
                      onMouseEnter={() => setTooltipText(borderName)}
                      onMouseLeave={() => setTooltipText("")}
                    >
                      {border}
                    </button>
                  );
                })
              ) : (
                <p className="no-neighbors-text">{t("noNeighbors")}</p>
              )}
            </div>
          </section>
        </main>
      </div>
      <div ref={tooltipRef} className="custom-tooltip">
        {tooltipText}
      </div>
    </div>
  );
};

export default CountryDetail;