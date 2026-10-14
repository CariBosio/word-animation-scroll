import React from "react";
import "./SearchBar.css";
import AnimatedCounter from "../AnimatedCounter/AnimatedCounter";
import { useLanguage } from "../../LanguageContext";

/**
 * SearchBar Component
 * Handles searching, filtering by continent, and sorting logic.
 * Remains sticky during scroll to provide constant access to controls.
 */

const SearchBar = ({
  searchTerm,
  setSearchTerm,
  continent,
  setContinent,
  sortBy,
  setSortBy,
  totalFound,
  firstMatch,
  scrollToCountry,
  resetFilters,
  scrollToGridTop,
  isAiLoading,
}) => {
  // Handles input changes and ensures the user sees the results from the top
  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
    scrollToGridTop();
  };

  const { t } = useLanguage();

  return (
    <div className="sticky-search-container">
      {/* 1. Main Search Input Area */}
      <div className="search-input-wrapper">
        {/* Preview of the flag if a match is found while typing */}
        {firstMatch &&
          firstMatch.name
            .toLowerCase()
            .startsWith(searchTerm.toLowerCase().trim()) && (
            <div className="match-flag-preview">
              <img src={firstMatch.flag} alt={firstMatch.name} />
            </div>
          )}
        <input
          type="text"
          className={`search-input ${
            firstMatch &&
            firstMatch.name
              .toLowerCase()
              .startsWith(searchTerm.toLowerCase().trim())
              ? "has-match"
              : ""
          }`}
          placeholder={
            isAiLoading ? t("oracleAnalyzing") : t("searchPlaceholder")
          }
          value={searchTerm}
          onKeyDown={(e) => {
            // Solo navega si realmente coincide con el nombre directo escrito
            const isDirectMatch =
              firstMatch &&
              firstMatch.name
                .toLowerCase()
                .startsWith(searchTerm.toLowerCase().trim());
            if (e.key === "Enter" && isDirectMatch)
              scrollToCountry(firstMatch.id);
          }}
          onChange={handleSearchChange}
        />
        {searchTerm && (
          <button
            className="clear-search-btn"
            aria-label={t("clearSearch") || "Clear"}
            onClick={() => {
              setSearchTerm("");
              scrollToGridTop();
            }}
          >
            ✕
          </button>
        )}
      </div>

      {/* 2. Filters and Counters Toolbar */}
      <div className="filter-toolbar">
        {/* Dynamic results counter */}
        <div
          className={`results-counter ${totalFound === 0 ? "no-results" : ""}`}
        >
          <AnimatedCounter value={totalFound} />{" "}
          {totalFound === 1 ? t("countryFound") : t("countriesFound")}
        </div>

        <div className="select-filters-group">
          <select
            value={continent}
            onChange={(e) => {
              setContinent(e.target.value);
              scrollToGridTop();
            }}
            className="filter-select"
          >
            <option value="All">{t("allContinents")}</option>
            <option value="Africa">{t("africa")}</option>
            <option value="Americas">{t("americas")}</option>
            <option value="Asia">{t("asia")}</option>
            <option value="Europe">{t("europe")}</option>
            <option value="Oceania">{t("oceania")}</option>
          </select>

          <select
            value={sortBy}
            onChange={(e) => {
              setSortBy(e.target.value);
              scrollToGridTop();
            }}
            className="filter-select"
          >
            <option value="name-asc">{t("sortNameAsc")}</option>
            <option value="name-desc">{t("sortNameDesc")}</option>
            <option value="pop-desc">{t("sortPopDesc")}</option>
            <option value="pop-asc">{t("sortPopAsc")}</option>
          </select>
        </div>

        {(continent !== "All" ||
          sortBy !== "name-asc" ||
          searchTerm !== "") && (
          <button onClick={resetFilters} className="reset-filters-btn">
            {t("resetFilters")}
          </button>
        )}
      </div>
    </div>
  );
};

export default SearchBar;
