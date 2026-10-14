// src/components/CustomCursor/CustomCursor.jsx
import React, { useEffect, useRef, useState } from "react";
import { gsap } from "gsap";
import { useLanguage } from "../../LanguageContext";
import "./CustomCursor.css";

const CustomCursor = () => {
  const { t } = useLanguage();
  const cursorRef = useRef(null);
  const [isHovering, setIsHovering] = useState(false);
  const [isExpanding, setIsExpanding] = useState(false);

  useEffect(() => {
    const moveCursor = (e) => {
      if (isExpanding) return; // Si se está expandiendo, no lo movemos más
      gsap.to(cursorRef.current, {
        x: e.clientX,
        y: e.clientY,
        duration: 0.1,
        ease: "power2.out"
      });
    };

    // Eventos de la transición "épica"
    const handleStartTransition = () => setIsExpanding(true);
    const handleEndTransition = () => {
      // Pequeño delay para que el achique sea elegante
      setTimeout(() => setIsExpanding(false), 300);
    };

    const handleMouseEnter = () => setIsHovering(true);
    const handleMouseLeave = () => setIsHovering(false);

    window.addEventListener("mousemove", moveCursor);
    window.addEventListener("mouseenterCard", handleMouseEnter);
    window.addEventListener("mouseleaveCard", handleMouseLeave);
    window.addEventListener("startCountryTransition", handleStartTransition);
    window.addEventListener("endCountryTransition", handleEndTransition);

    return () => {
      window.removeEventListener("mousemove", moveCursor);
      window.removeEventListener("mouseenterCard", handleMouseEnter);
      window.removeEventListener("mouseleaveCard", handleMouseLeave);
      window.removeEventListener("startCountryTransition", handleStartTransition);
      window.removeEventListener("endCountryTransition", handleEndTransition);
    };
  }, [isExpanding]);

  return (
    <div 
      ref={cursorRef} 
      className={`custom-cursor 
        ${isHovering ? "active" : ""} 
        ${isExpanding ? "expanding" : ""}`}
    >
    <div className="cursor-label">
  <svg viewBox="0 0 100 100">
    <path 
      id="circlePath" 
      d="M 50, 50 m -40, 0 a 40,40 0 1,1 80,0 a 40,40 0 1,1 -80,0" 
      fill="transparent" 
    />
    <text>
      <textPath 
        xlinkHref="#circlePath"
        textLength="245"
        lengthAdjust="spacing"
      >
        {t("details")} • {t("details")} •{" "}
      </textPath>
    </text>
  </svg>
</div>
      <div className="cursor-dot" />
    </div>
  );
};

export default CustomCursor;