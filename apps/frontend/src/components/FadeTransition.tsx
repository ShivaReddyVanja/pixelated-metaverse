"use client";

import { useEffect, useState } from "react";

export const FadeTransition = ({
  show,
  children,
  duration = 600,
}: {
  show: boolean;
  children: React.ReactNode;
  duration?: number;
}) => {
  const [shouldRender, setShouldRender] = useState(show);

  useEffect(() => {
    if (show) setShouldRender(true);
  }, [show]);

  const handleEnd = () => {
    if (!show) setShouldRender(false);
  };

  if (!shouldRender) return null;

  return (
    <div
      style={{ animationDuration: `${duration}ms` }}
      onAnimationEnd={handleEnd}
      className={`w-1/4 h-full ${show ? "animate-fade-in" : "animate-fade-out"}`}
    >
      {children}
    </div>
  );
};
