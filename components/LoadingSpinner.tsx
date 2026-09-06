
import React from 'react';

export const LoadingSpinner = () => {
  // Define animation path values for smooth looping
  // Blue wave animates its peak between y=5 and y=20 (viewBox coordinates)
  const bluePathValues = [
    "M0,30 Q15,5 30,30 T60,30 T90,30 T120,30",   // Max peak up
    "M0,30 Q15,20 30,30 T60,30 T90,30 T120,30",  // Min peak up
    "M0,30 Q15,5 30,30 T60,30 T90,30 T120,30"    // Back to Max peak up
  ].join(';');

  // Yellow wave animates its peak between y=55 and y=40 (viewBox coordinates)
  const yellowPathValues = [
    "M0,30 Q15,55 30,30 T60,30 T90,30 T120,30",  // Max peak down
    "M0,30 Q15,40 30,30 T60,30 T90,30 T120,30",  // Min peak down
    "M0,30 Q15,55 30,30 T60,30 T90,30 T120,30"   // Back to Max peak down
  ].join(';');

  return (
    <div 
      className="flex flex-col items-center justify-center my-10" 
      aria-label="Audio processing animation" 
      role="status"
    >
      <svg
        width="100" 
        height="50"
        viewBox="0 0 120 60" // Internal coordinate system
        xmlns="http://www.w3.org/2000/svg"
        className="mb-4"
        aria-hidden="true" // Decorative SVG, info provided by text
      >
        {/* Blue Wave */}
        <path
          stroke="#0ea5e9" // Tailwind sky-500
          strokeWidth="4"
          fill="none"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <animate 
            attributeName="d" 
            dur="1.4s"
            repeatCount="indefinite"
            values={bluePathValues}
            calcMode="spline"
            keyTimes="0; 0.5; 1"
            keySplines="0.42 0 0.58 1; 0.42 0 0.58 1" // Ease-in-out timing
          />
        </path>
        
        {/* Yellow Wave */}
        <path
          stroke="#facc15" // Tailwind yellow-400
          strokeWidth="4"
          fill="none"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <animate 
            attributeName="d" 
            dur="1.4s"
            begin="0.2s" // Start slightly later for an "intertwined" feel
            repeatCount="indefinite"
            values={yellowPathValues}
            calcMode="spline"
            keyTimes="0; 0.5; 1"
            keySplines="0.42 0 0.58 1; 0.42 0 0.58 1" // Ease-in-out timing
          />
        </path>
      </svg>
      <p className="mt-2 text-lg text-slate-300">Transcribing audio, please wait...</p>
    </div>
  );
};
