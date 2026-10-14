import React, { useEffect } from "react";
import { gsap } from "gsap";
import SearchBar from "./SearchBar";
import "./CountryGrid.css";
import { useLanguage } from "../../LanguageContext";

/**
 * CountryGrid Component
 * Renders a responsive Bento Grid of countries with infinite scroll functionality.
 * Includes interactive GSAP animations for the footer status message.
 */
const CountryGrid = ({
  countriesToDisplay,
  filteredCountries,
  searchTerm,
  setSearchTerm,
  continent,
  setContinent,
  sortBy,
  setSortBy,
  loading,
  observerRef,
  resetFilters,
  firstMatch,
  formatPopulation,
  scrollToCountry,
  scrollToGridTop,
  onCountryClick,
  isAiLoading,
  aiNotification,
}) => {
 const { t, getLocalizedCountryName } = useLanguage();

  /**
   * Entrance animation for the "End of the World" message chars.
   * Triggered by ScrollTrigger when the footer enters the viewport.
   */
  useEffect(() => {
    const chars = document.querySelectorAll(".is-epic .char");
    if (countriesToDisplay.length === 0 || chars.length === 0) return;

    gsap.fromTo(
      chars,
      { opacity: 0, y: 100, rotateX: -90, filter: "blur(10px)" },
      {
        opacity: 0.8,
        y: 0,
        rotateX: 0,
        filter: "blur(0px)",
        stagger: 0.03,
        duration: 1.2,
        ease: "power4.out",
        onComplete: () => {
          gsap.set(chars, { clearProps: "transform" });
        },
        scrollTrigger: {
          trigger: ".end-message",
          start: "top 95%",
          toggleActions: "play none none reset",
        },
      },
    );
  }, [countriesToDisplay.length, searchTerm, continent]);

  /**
   * Magnetic magnification effect on hover for the footer characters.
   */
  const handleMouseMove = (e) => {
    const chars = document.querySelectorAll(".is-epic .char");
    if (chars.length === 0) return;

    const mouseX = e.clientX;
    const mouseY = e.clientY;

    chars.forEach((char) => {
      const rect = char.getBoundingClientRect();
      const charX = rect.left + rect.width / 2;
      const charY = rect.top + rect.height / 2;
      const dist = Math.sqrt(
        Math.pow(mouseX - charX, 2) + Math.pow(mouseY - charY, 2),
      );
      const radius = 150;

      if (dist < radius) {
        const power = Math.pow((radius - dist) / radius, 2);
        gsap.to(char, {
          scale: 1 + power * 1.5,
          y: power * -20,
          color: "#ff4d4d",
          opacity: 1,
          duration: 0.4,
          ease: "power2.out",
          overwrite: true,
        });
      } else {
        gsap.to(char, {
          scale: 1,
          y: 0,
          color: "#000",
          opacity: 0.8,
          duration: 0.4,
          overwrite: true,
        });
      }
    });
  };

  /**
   * Resets character styles when mouse leaves the text area.
   */
  const handleMouseLeave = () => {
    const chars = document.querySelectorAll(".is-epic .char");
    if (chars.length === 0) return;

    gsap.to(chars, {
      scale: 1,
      y: 0,
      color: "#000",
      opacity: 0.8,
      duration: 0.6,
      ease: "power3.out",
    });
  };

  const handleEnter = () => {
    window.dispatchEvent(new CustomEvent("mouseenterCard"));
  };

  const handleLeave = () => {
    window.dispatchEvent(new CustomEvent("mouseleaveCard"));
  };

  return (
    <section className="grid-reveal-section">
      <div className="grid-content-wrapper">
        {/* 🔔 BLOQUE DE NOTIFICACIÓN ESTÉTICA SI GEMINI ESTÁ CAÍDO */}
        {aiNotification && (
          <div
            className="ai-quota-notification"
            style={{
              background: "rgba(255, 193, 7, 0.15)",
              border: "1px solid #ffc107",
              color: "#d99100",
              padding: "12px 20px",
              borderRadius: "8px",
              marginBottom: "20px",
              fontSize: "0.95rem",
              textAlign: "center",
              fontWeight: "500",
              animation: "fadeIn 0.3s ease-in-out",
            }}
          >
            ⚠️ {aiNotification}
          </div>
        )}
        <SearchBar
          searchTerm={searchTerm}
          setSearchTerm={setSearchTerm}
          continent={continent}
          setContinent={setContinent}
          sortBy={sortBy}
          setSortBy={setSortBy}
          totalFound={filteredCountries.length}
          firstMatch={firstMatch}
          scrollToCountry={scrollToCountry}
          resetFilters={resetFilters}
          scrollToGridTop={scrollToGridTop}
          isAiLoading={isAiLoading}
        />

        <div className="bento-grid">
          {loading && countriesToDisplay.length === 0
            ? /* Skeleton Loading State */
              Array.from({ length: 12 }).map((_, i) => (
                <div
                  key={`skeleton-${i}`}
                  className={`bento-item skeleton ${[0, 6, 11].includes(i % 12) ? "large" : "small"}`}
                >
                  <div className="skeleton-flag" />
                  <div className="skeleton-content" />
                </div>
              ))
            : /* Data Rendering State */
              countriesToDisplay.map((country, i) => {
                const isLarge = [0, 6, 11, 17, 22, 28, 33, 39].includes(i % 40);
                const displayImage =
                  country.manual_image_url || country.image_url;

                const staggerIndex = i < 20 ? i : i % 20;
                const delay = i < 20 ? i * 0.05 : staggerIndex * 0.05;

                const dynamicBg =
                  isLarge && displayImage
                    ? `linear-gradient(to bottom, rgba(255,255,255,0), rgba(255,255,255,1)), url(${displayImage})`
                    : `linear-gradient(rgba(255,255,255,0.85), rgba(255,255,255,0.85)), url(${country.flag})`;

                const localizedCountryName = getLocalizedCountryName
                  ? getLocalizedCountryName(country.id_code, country.name)
                  : country.name;

                return (
                  <div
                    key={country.id}
                    id={`country-${country.id}`}
                    className={`bento-item ${isLarge ? "large" : "small"}`}
                    onMouseEnter={handleEnter}
                    onMouseLeave={handleLeave}
                    onClick={() => onCountryClick(country.id)}
                    style={{
                      backgroundImage: dynamicBg,
                      backgroundPosition: isLarge
                        ? `center ${country.image_focus_y || "center"}`
                        : "center",
                      backgroundSize: "cover",
                      animationDelay: `${delay}s`,
                      animationIterationCount: 1,
                      animationFillMode: "both",
                    }}
                  >
                    <div className="bento-flag-container">
                      <img
                        src={country.flag}
                        alt={`${country.name} flag`}
                        className="bento-flag-img"
                        loading="lazy"
                      />
                    </div>
                    <div className="bento-info">
                      <h3 className="bento-country-name">
                        {localizedCountryName}
                      </h3>
                      <p className="bento-country-sub">
                        {t(
                          country.continent.toLowerCase().replace(/\s+/g, ""),
                        ) || country.continent}{" "}
                        •{" "}
                        <strong>{formatPopulation(country.population)}</strong>
                      </p>
                    </div>
                  </div>
                );
              })}
        </div>

        {/* Sentinel element for Infinite Scroll */}
        <div ref={observerRef} className="scroll-observer-sensor" />

        <div className="grid-footer-status">
          {countriesToDisplay.length < filteredCountries.length ? (
            <p className="status-discovering">{t("discoveringMore")}</p>
          ) : (
            <div className="status-final">
              {/* 🧠 ESTADO 1: Mientras la IA está procesando la frase de forma asíncrona */}
              {isAiLoading ? (
                <div
                  className="ai-loading-status-box"
                  style={{
                    animation: "pulse 1.5s infinite ease-in-out",
                    textAlign: "center",
                    padding: "20px",
                    color: "#666",
                    fontSize: "1.05rem",
                    fontStyle: "italic",
                    letterSpacing: "0.5px",
                  }}
                >
                  {t("oracleStatus")}{" "}
                  <span style={{ color: "#ff4d4d", fontWeight: "600" }}>
                    {searchTerm.trim().length > 40
                      ? `${searchTerm.trim().substring(0, 40)}...`
                      : searchTerm.trim()}
                  </span>
                  ...
                </div>
              ) : searchTerm &&
                filteredCountries.length === 0 &&
                !aiNotification ? (
                /* ❌ ESTADO 2: Si terminó de buscar y realmente no coincide nada */
                <div className="no-results-box">
                  <p>{t("noResultsTitle")}</p>
                  <button
                    onClick={resetFilters}
                    className="bento-details-btn dark"
                  >
                    {t("exploreAllBtn")}
                  </button>
                </div>
              ) : (
                /* 🏁 ESTADO 3: El renderizado clásico de resultados finalizados */
                <p
                  className={`end-message ${searchTerm || continent !== "All" ? "is-filter" : "is-epic"}`}
                  onMouseMove={
                    searchTerm || continent !== "All" ? null : handleMouseMove
                  }
                  onMouseLeave={handleMouseLeave}
                >
                  {searchTerm || continent !== "All"
                    ? t("endOfResults")
                    : t("endOfWorld")
                        .split("")
                        .map((char, index) => (
                          <span key={index} className="char">
                            {char === " " ? "\u00A0" : char}
                          </span>
                        ))}
                </p>
              )}
            </div>
          )}
        </div>
      </div>
    </section>
  );
};

export default CountryGrid;
