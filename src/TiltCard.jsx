import { useRef, useEffect } from 'react';

// Wraps children in a card that tilts in 3D toward the cursor, with a glare
// highlight tracking the pointer. Inert on touch devices and reduced motion.
export default function TiltCard({ children, className = '', maxTilt = 8 }) {
  const ref = useRef(null);
  const enabledRef = useRef(false);

  useEffect(() => {
    enabledRef.current =
      window.matchMedia('(hover: hover) and (pointer: fine)').matches &&
      !window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  }, []);

  const handleMove = (e) => {
    if (!enabledRef.current || !ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    const px = (e.clientX - rect.left) / rect.width;
    const py = (e.clientY - rect.top) / rect.height;
    ref.current.style.setProperty('--rx', `${(0.5 - py) * maxTilt}deg`);
    ref.current.style.setProperty('--ry', `${(px - 0.5) * maxTilt}deg`);
    ref.current.style.setProperty('--gx', `${px * 100}%`);
    ref.current.style.setProperty('--gy', `${py * 100}%`);
    ref.current.style.setProperty('--glare', '1');
  };

  const handleLeave = () => {
    if (!ref.current) return;
    ref.current.style.setProperty('--rx', '0deg');
    ref.current.style.setProperty('--ry', '0deg');
    ref.current.style.setProperty('--glare', '0');
  };

  return (
    <div
      ref={ref}
      className={`tilt-card ${className}`}
      onMouseMove={handleMove}
      onMouseLeave={handleLeave}
    >
      <div className="tilt-card-glare" aria-hidden="true" />
      {children}
    </div>
  );
}
