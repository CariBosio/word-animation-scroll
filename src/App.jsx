import React, { useLayoutEffect, useEffect, useRef, useState } from "react";
import Lenis from "@studio-freight/lenis";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { ScrollToPlugin } from "gsap/ScrollToPlugin";

/* Components & Styles */
import "./App.css";
import "leaflet/dist/leaflet.css";
import CustomCursor from "./components/CustomCursor/CustomCursor";
import Hero from "./components/Hero/Hero";
import CountryGrid from "./components/CountryGrid/CountryGrid";
import Footer from "./components/Footer/Footer";
import CountryDetail from "./components/CountryDetail/CountryDetail";
import { LanguageProvider } from "./LanguageProvider";
import LanguageToggle from "./components/LanguageToggle/LanguageToggle";

gsap.registerPlugin(ScrollTrigger, ScrollToPlugin);

/**
 * Main Application Component
 * Manages global state, smooth scrolling (Lenis), data fetching,
 * and navigation logic between the main grid and country details.
 */

function App() {
  /* Global State */
  const [allCountries, setAllCountries] = useState([]);
  const [countryNames, setCountryNames] = useState({});
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [isReady, setIsReady] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [continent, setContinent] = useState("All");
  const [sortBy, setSortBy] = useState("name-asc");
  const [selectedCountryId, setSelectedCountryId] = useState(null);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [semanticMatches, setSemanticMatches] = useState([]);
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [aiNotification, setAiNotification] = useState("");

  /* Refs */
  const observerRef = useRef(null);
  const scrollPositionRef = useRef(0);

  /* Constants */
  const itemsPerPage = 20;

  /**
   * Initialize Lenis Smooth Scroll and sync with GSAP
   */
  useEffect(() => {
    const lenis = new Lenis({
      duration: 1.2,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      orientation: "vertical",
      gestureOrientation: "vertical",
      smoothWheel: true,
    });

    function raf(time) {
      lenis.raf(time);
      requestAnimationFrame(raf);
    }

    requestAnimationFrame(raf);

    // 🎯 VITAL: Synchronize Lenis with ScrollTrigger
    lenis.on("scroll", ScrollTrigger.update);

    gsap.ticker.add((time) => {
      lenis.raf(time * 1000);
    });

    return () => {
      lenis.destroy();
    };
  }, []);

  // 2. Add the trigger function to handle the semantic request:
  const handleSemanticSearch = async (text) => {
    if (!text.trim() || text.length < 4) {
      setSemanticMatches([]);
      return;
    }

    setIsAiLoading(true);
    setAiNotification(""); // Limpiamos avisos previos

    try {
      const response = await fetch("/api/semantic-search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: text }),
      });

      if (!response.ok) {
        setSemanticMatches([]);
        return;
      }

      const data = await response.json();

      // 🎯 IF THE BACKEND WARNED THAT GEMINI IS SATURATED:
      if (data.isAiUnavailable) {
        setSemanticMatches([]);
        setAiNotification(
          "The Gemini oracle is in high demand globally right now. Showing all countries while you rest!",
        );

        setTimeout(() => setAiNotification(""), 5000);
        return;
      }

      setSemanticMatches(data.matches || []);
    } catch (error) {
      console.error("AI Filtering error:", error);
      setSemanticMatches([]);
    } finally {
      setIsAiLoading(false);
    }
  };

  // 3. Update your useEffect tracking the searchTerm to trigger the AI filter:
  useEffect(() => {
    if (!searchTerm.trim()) {
      setSemanticMatches([]);
      setIsAiLoading(false);
      return;
    }

    const delayDebounceFn = setTimeout(() => {
      handleSemanticSearch(searchTerm);
    }, 600);

    return () => clearTimeout(delayDebounceFn);
  }, [searchTerm]);

  /**
   * Filtering and Sorting Logic
   */
  const filteredCountries = allCountries
    .filter((country) => {
      const matchesContinent =
        continent === "All" ||
        country.continent === continent ||
        (continent === "Americas" &&
          (country.continent === "North America" ||
            country.continent === "South America"));

      if (!searchTerm) return matchesContinent;

      const matchesName = country.name
        .toLowerCase()
        .includes(searchTerm.toLowerCase());

      const matchesSemantic = semanticMatches.includes(country.id_code);

      return matchesContinent && (matchesName || matchesSemantic);
    })
    .sort((a, b) => {
      if (sortBy === "name-asc") return a.name.localeCompare(b.name);
      if (sortBy === "name-desc") return b.name.localeCompare(a.name);
      if (sortBy === "pop-desc")
        return b.population - a.population || a.name.localeCompare(b.name);
      if (sortBy === "pop-asc")
        return a.population - b.population || a.name.localeCompare(b.name);
      return 0;
    });

  const countriesToDisplay = filteredCountries.slice(0, page * itemsPerPage);

  /**
   * App entry point
   */
  useLayoutEffect(() => {
    if ("scrollRestoration" in window.history) {
      window.history.scrollRestoration = "manual";
    }
    document.body.style.overflow = "hidden";
    window.scrollTo(0, 0);

    const handleInitialReset = () => {
      window.scrollTo(0, 0);
      setTimeout(() => {
        window.scrollTo(0, 0);
        document.body.style.overflow = "";
        ScrollTrigger.refresh();
        setIsReady(true);
      }, 100);
    };

    handleInitialReset();
    return () => {
      document.body.style.overflow = "";
    };
  }, []);

  /**
   * Data Fetching: Retrieves and formats global country data
   */
  useEffect(() => {
    const fetchCountries = async () => {
      setLoading(true);
      try {
        const response = await fetch("/api/countries");
        const data = await response.json();

        const formatted = data.map((c) => ({
          id: c.id,
          id_code: c.id_code,
          name: c.name,
          continent: c.continent,
          flag: c.flag,
          population: Number(c.population) || 0,
          manual_image_url: c.manual_image_url,
          image_focus_y: c.image_focus_y,
          featured_location: c.featured_location,
          capital: c.capital,
          languages: c.languages,
          currency: c.currency,
          area: Number(c.area) || 0,
          latitude: c.latitude,
          longitude: c.longitude,
          borders: c.borders,
        }));

        setAllCountries(formatted);

        const mapping = data.reduce((acc, c) => {
          acc[c.id_code] = c.name;
          return acc;
        }, {});

        setCountryNames(mapping);
      } catch (error) {
        console.error("World Data Fetch Error:", error);
      } finally {
        setLoading(false);
      }
    };
    if (isReady) fetchCountries();
  }, [isReady]);

  /**
   * Infinite Scroll
   */
  useEffect(() => {
    if (loading || countriesToDisplay.length >= filteredCountries.length)
      return;

    if (selectedCountryId) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !loading) {
          setPage((prev) => prev + 1);
        }
      },
      {
        rootMargin: "400px",
        threshold: 0.1,
      },
    );

    const currentRef = observerRef.current;
    if (currentRef) {
      observer.observe(currentRef);
    }

    return () => {
      if (currentRef) observer.unobserve(currentRef);
    };
  }, [
    loading,
    countriesToDisplay.length,
    filteredCountries.length,
    selectedCountryId,
  ]);

  /**
   * Navigation Handlers
   */
  const handleSelectCountry = (countryId) => {
    if (isTransitioning) return;

    scrollPositionRef.current = window.scrollY;

    setIsTransitioning(true);
    window.dispatchEvent(new CustomEvent("startCountryTransition"));

    setTimeout(() => {
      setSelectedCountryId(countryId);
      window.scrollTo(0, 0);

      setTimeout(() => {
        window.dispatchEvent(new CustomEvent("endCountryTransition"));
        setIsTransitioning(false);
      }, 150);
    }, 800);
  };

  const formatPopulation = (num) => {
    if (!num) return "N/A";
    if (num >= 1000000)
      return (num / 1000000).toFixed(1).replace(/\.0$/, "") + "M";
    if (num >= 1000) return (num / 1000).toFixed(1).replace(/\.0$/, "") + "K";
    return num;
  };

  const scrollToCountry = (countryId) => {
    const element = document.getElementById(`country-${countryId}`);
    if (element) {
      gsap.to(window, {
        duration: 1.5,
        scrollTo: { y: element, offsetY: 120 },
        ease: "power4.inOut",
      });
    }
  };

  const scrollToGridTop = () => {
    const gridSection = document.querySelector(".grid-reveal-section");
    if (gridSection) {
      gsap.to(window, {
        duration: 1.2,
        scrollTo: { y: gridSection, offsetY: 20 },
        ease: "power3.inOut",
      });
    }
  };

  const resetFilters = () => {
    setSearchTerm("");
    setContinent("All");
    setSortBy("name-asc");
    setPage(1);
    setSemanticMatches([]);
    scrollToGridTop();
  };

  const handleCloseDetail = () => {
    setIsTransitioning(true);
    window.dispatchEvent(new CustomEvent("startCountryTransition"));

    setTimeout(() => {
      setSelectedCountryId(null);
      window.dispatchEvent(new CustomEvent("mouseleaveCard"));

      requestAnimationFrame(() => {
        gsap.set(window, { scrollTo: scrollPositionRef.current });
        ScrollTrigger.refresh();
      });

      setTimeout(() => {
        window.dispatchEvent(new CustomEvent("endCountryTransition"));
        setIsTransitioning(false);
      }, 150);
    }, 800);
  };

  const handleNeighborSelect = (borderCode) => {
    const neighborCountry = allCountries.find((c) => c.id_code === borderCode);

    if (neighborCountry) {
      handleSelectCountry(neighborCountry.id);
    } else {
      console.warn(
        "Neighboring country not found in local database:",
        borderCode,
      );
    }
  };

  const firstMatch =
    searchTerm && filteredCountries.length > 0 ? filteredCountries[0] : null;

  return (
    <LanguageProvider>
      <div className="app-container" style={{ opacity: isReady ? 1 : 0 }}>
        <CustomCursor />

        <LanguageToggle />

        {selectedCountryId ? (
          <CountryDetail
            country={allCountries.find((c) => c.id === selectedCountryId)}
            onClose={handleCloseDetail}
            onNeighborClick={handleNeighborSelect}
            countryNames={countryNames}
          />
        ) : (
          <>
            <Hero isReady={isReady} />
            <CountryGrid
              countriesToDisplay={countriesToDisplay}
              filteredCountries={filteredCountries}
              searchTerm={searchTerm}
              setSearchTerm={setSearchTerm}
              continent={continent}
              setContinent={setContinent}
              sortBy={sortBy}
              setSortBy={setSortBy}
              loading={loading}
              observerRef={observerRef}
              resetFilters={resetFilters}
              firstMatch={firstMatch}
              formatPopulation={formatPopulation}
              scrollToCountry={scrollToCountry}
              scrollToGridTop={scrollToGridTop}
              onCountryClick={handleSelectCountry}
              isAiLoading={isAiLoading}
            />
          </>
        )}

        <Footer />
      </div>
    </LanguageProvider>
  );
}

export default App;