import React, { useEffect, useRef } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import "./Hero.css";
import { useLanguage } from "../../LanguageContext";

/**
 * Hero Component
 * Manages the high-performance frame-by-frame canvas animation 
 * synchronized with page scroll using GSAP ScrollTrigger.
 */
const Hero = ({ isReady }) => {
  const canvasRef = useRef(null);
  const sectionRef = useRef(null);
  const frameCount = 88;

  // Obtenemos las funciones de traducción
  const { t } = useLanguage();

  // Helper to generate frame paths
  const currentFrame = (index) =>
    `/frames/frame_${(index + 1).toString().padStart(4, "0")}.jpg`;

  useEffect(() => {
    if (!isReady) return;

    const canvas = canvasRef.current;
    const context = canvas.getContext("2d");
    const images = [];
    const sequence = { frame: 0 };

    // 1. Preload images to ensure smooth scrubbing
    for (let i = 0; i < frameCount; i++) {
      const img = new Image();
      img.src = currentFrame(i);
      images.push(img);
    }

    // 2. Responsive Canvas Rendering Logic
    const render = () => {
      const img = images[sequence.frame];
      if (!img || !img.complete) return;

      const ratio = window.devicePixelRatio || 1;
      const scale = Math.max(
        window.innerWidth / img.width,
        window.innerHeight / img.height
      );

      canvas.width = window.innerWidth * ratio;
      canvas.height = window.innerHeight * ratio;
      context.scale(ratio, ratio);
      context.clearRect(0, 0, window.innerWidth, window.innerHeight);
      
      // Center and cover image within canvas
      context.drawImage(
        img,
        window.innerWidth / 2 - (img.width / 2) * scale,
        window.innerHeight / 2 - (img.height / 2) * scale,
        img.width * scale,
        img.height * scale
      );
    };

    images[0].onload = render;

    // 3. GSAP Timeline with ScrollTrigger
    const tl = gsap.timeline({
      scrollTrigger: {
        trigger: sectionRef.current,
        start: "top top",
        end: "bottom bottom",
        scrub: 2, // Smooth follow-through
      },
    });

    // Frame sequence animation
    tl.to(sequence, {
      frame: frameCount - 1,
      snap: "frame",
      ease: "none",
      duration: 10,
      onUpdate: render,
    }, 0);

    // Text animations
    tl.fromTo(".title-main", 
      { opacity: 0, y: 40, scale: 0.9 },
      { opacity: 1, y: 0, scale: 1, duration: 2, ease: "power3.out", immediateRender: false }, 
      1.5
    );

    tl.fromTo(".title-sub",
      { opacity: 0, y: 20 },
      { opacity: 1, y: 0, duration: 2, ease: "power2.out", immediateRender: false },
      2.5
    );

    // Exit animations and transition to white background
    tl.to(".title-sub", { opacity: 0, y: -20, duration: 1, ease: "power2.in" }, 6.5)
      .to(".title-main", {
        scale: 60,
        opacity: 0,
        duration: 4,
        ease: "power2.inOut",
        overwrite: "auto",
      }, 7);

    tl.to(canvas, { opacity: 0, scale: 1.5, duration: 3, ease: "power2.in" }, 7);

    // Reveal Grid Section during the last part of Hero scroll
    tl.fromTo(".grid-reveal-section", 
      { opacity: 0, y: 100 },
      { opacity: 1, y: 0, duration: 2, ease: "power2.out", immediateRender: false }, 
      8
    );

    tl.to(".hero-container", { backgroundColor: "#ffffff", duration: 2 }, 7);

    window.addEventListener("resize", render);

    // Cleanup: Kill ScrollTriggers and listeners to prevent memory leaks
    return () => {
      window.removeEventListener("resize", render);
      if (tl.scrollTrigger) tl.scrollTrigger.kill();
      tl.kill();
    };
  }, [isReady]);

  return (
    <div ref={sectionRef} className="hero-container">
      <div className="hero-fixed-wrapper">
        <canvas ref={canvasRef} className="hero-canvas" />
        <div className="hero-overlay">
          <h1 className="hero-main-title">
            <span className="title-main">{t("heroTitle")}</span>
            <span className="title-sub">{t("heroSubtitle")}</span>
          </h1>
          <div className="scroll-indicator-container">
            <span className="scroll-text">{t("heroScroll")}</span>
            <div className="scroll-line" />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Hero;