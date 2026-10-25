import React from 'react';

export const LoadingSpinner: React.FC = () => {
  const bluePathValues = [
    'M0,30 Q15,5 30,30 T60,30 T90,30 T120,30',
    'M0,30 Q15,20 30,30 T60,30 T90,30 T120,30',
    'M0,30 Q15,5 30,30 T60,30 T90,30 T120,30',
  ].join(';');

  const amberPathValues = [
    'M0,30 Q15,55 30,30 T60,30 T90,30 T120,30',
    'M0,30 Q15,40 30,30 T60,30 T90,30 T120,30',
    'M0,30 Q15,55 30,30 T60,30 T90,30 T120,30',
  ].join(';');

  return (
    <div
      className="flex flex-col items-center justify-center my-4"
      aria-label="Audio processing animation"
      role="status"
    >
      <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800 shadow-inner">
        <svg
          width="110"
          height="54"
          viewBox="0 0 120 60"
          xmlns="http://www.w3.org/2000/svg"
          aria-hidden="true"
        >
          {/* Sky Wave */}
          <path
            stroke="#38bdf8"
            strokeWidth="4"
            fill="none"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <animate
              attributeName="d"
              dur="1.3s"
              repeatCount="indefinite"
              values={bluePathValues}
              calcMode="spline"
              keyTimes="0; 0.5; 1"
              keySplines="0.42 0 0.58 1; 0.42 0 0.58 1"
            />
          </path>

          {/* Amber Wave */}
          <path
            stroke="#fbbf24"
            strokeWidth="4"
            fill="none"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <animate
              attributeName="d"
              dur="1.3s"
              begin="0.2s"
              repeatCount="indefinite"
              values={amberPathValues}
              calcMode="spline"
              keyTimes="0; 0.5; 1"
              keySplines="0.42 0 0.58 1; 0.42 0 0.58 1"
            />
          </path>
        </svg>
      </div>
    </div>
  );
};
