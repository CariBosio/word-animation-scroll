import React, { useState, useEffect, useRef } from "react";
import { gsap } from "gsap";
import "./AnimatedCounter.css";

const AnimatedCounter = ({ value }) => {
  const [displayValue, setDisplayValue] = useState(value);
  const countRef = useRef({ val: value });

  useEffect(() => {
    // Animate value change with GSAP
    const tween = gsap.to(countRef.current, {
      val: value,
      duration: 1,
      ease: "power3.out",
      onUpdate: () => setDisplayValue(Math.round(countRef.current.val)),
    });

    return () => tween.kill(); // Cleanup to prevent memory leaks
  }, [value]);

  return <span className="animated-counter">{displayValue}</span>;
};

export default AnimatedCounter;