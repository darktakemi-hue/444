import React, { useEffect, useState, useRef } from 'react';
import { Location, Trip, TripStatus } from '../types';
import { Navigation, MapPin, Eye, Car } from 'lucide-react';

interface MapSimulationProps {
  activeTrip: Trip | null;
  onReachPickup: () => void;
  onReachDropoff: () => void;
}

export const MapSimulation: React.FC<MapSimulationProps> = ({
  activeTrip,
  onReachPickup,
  onReachDropoff,
}) => {
  const [carPos, setCarPos] = useState<{ x: number; y: number }>({ x: 50, y: 50 });
  const [driverStart, setDriverStart] = useState<{ x: number; y: number }>({ x: 30, y: 30 });
  const [radarPulse, setRadarPulse] = useState(1);
  const animationRef = useRef<number | null>(null);
  const startTimeRef = useRef<number | null>(null);

  // Generate streets grid for background
  const streetLines = [];
  for (let i = 10; i < 100; i += 15) {
    streetLines.push({ type: 'h', pos: i });
    streetLines.push({ type: 'v', pos: i });
  }

  // Animation effect for pulse radar when searching
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (activeTrip?.status === 'SEARCHING') {
      interval = setInterval(() => {
        setRadarPulse((prev) => (prev >= 2.5 ? 1 : prev + 0.15));
      }, 100);
    }
    return () => clearInterval(interval);
  }, [activeTrip?.status]);

  // Set initial driver position when a trip is requested or accepted
  useEffect(() => {
    if (activeTrip) {
      if (activeTrip.status === 'ACCEPTED') {
        // Driver starts at a random point on the grid, distinct from pickup
        const randomX = Math.max(15, Math.min(85, activeTrip.pickup.x + (Math.random() > 0.5 ? 20 : -20)));
        const randomY = Math.max(15, Math.min(85, activeTrip.pickup.y + (Math.random() > 0.5 ? 20 : -20)));
        setDriverStart({ x: randomX, y: randomY });
        setCarPos({ x: randomX, y: randomY });
      } else if (activeTrip.status === 'ARRIVING') {
        // Animate from driver start to pickup
        animateCar(driverStart, activeTrip.pickup, 5000, onReachPickup);
      } else if (activeTrip.status === 'IN_TRIP') {
        // Animate from pickup to dropoff
        animateCar(activeTrip.pickup, activeTrip.dropoff, 7000, onReachDropoff);
      }
    } else {
      // Default idle car position on Avenida Julius Nyerere
      setCarPos({ x: 50, y: 50 });
    }

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [activeTrip?.status, activeTrip?.id]);

  // Create grid-aligned path (turns) instead of straight diagonal lines
  const getGridPath = (start: { x: number; y: number }, end: { x: number; y: number }) => {
    // Street path goes horizontally first, then vertically
    return [
      start,
      { x: end.x, y: start.y }, // Turn point
      end
    ];
  };

  const interpolatePath = (path: { x: number; y: number }[], progress: number) => {
    if (path.length < 2) return path[0] || { x: 50, y: 50 };
    
    // Simple 2-segment path interpolation (progress from 0 to 1)
    const segmentCount = path.length - 1;
    const segmentIndex = Math.min(
      Math.floor(progress * segmentCount),
      segmentCount - 1
    );
    
    const segmentProgress = (progress * segmentCount) - segmentIndex;
    const p1 = path[segmentIndex];
    const p2 = path[segmentIndex + 1];
    
    return {
      x: p1.x + (p2.x - p1.x) * segmentProgress,
      y: p1.y + (p2.y - p1.y) * segmentProgress,
    };
  };

  const animateCar = (
    start: { x: number; y: number },
    end: { x: number; y: number },
    durationMs: number,
    onComplete: () => void
  ) => {
    if (animationRef.current) cancelAnimationFrame(animationRef.current);
    
    const path = getGridPath(start, end);
    startTimeRef.current = null;

    const step = (timestamp: number) => {
      if (!startTimeRef.current) startTimeRef.current = timestamp;
      const elapsed = timestamp - startTimeRef.current;
      const progress = Math.min(elapsed / durationMs, 1);

      const currentPos = interpolatePath(path, progress);
      setCarPos(currentPos);

      if (progress < 1) {
        animationRef.current = requestAnimationFrame(step);
      } else {
        onComplete();
      }
    };

    animationRef.current = requestAnimationFrame(step);
  };

  // Determine angle of movement for car rotation
  const getCarRotation = () => {
    if (!activeTrip) return 0;
    if (activeTrip.status === 'ARRIVING') {
      const path = getGridPath(driverStart, activeTrip.pickup);
      return calculateRotation(carPos, path[2]);
    } else if (activeTrip.status === 'IN_TRIP') {
      const path = getGridPath(activeTrip.pickup, activeTrip.dropoff);
      return calculateRotation(carPos, path[2]);
    }
    return 45; // Default idle angle
  };

  const calculateRotation = (current: { x: number; y: number }, target: { x: number; y: number }) => {
    const dx = target.x - current.x;
    const dy = target.y - current.y;
    if (Math.abs(dx) > Math.abs(dy)) {
      return dx > 0 ? 90 : 270; // Moving horizontally
    } else {
      return dy > 0 ? 180 : 0; // Moving vertically
    }
  };

  return (
    <div className="relative w-full aspect-square md:aspect-[4/3] bg-[#0A0A0A] rounded-3xl overflow-hidden border border-elegant-border-high shadow-2xl">
      {/* Background Map Grid */}
      <svg className="w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
        <defs>
          <radialGradient id="mapGlow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#141414" />
            <stop offset="100%" stopColor="#050505" />
          </radialGradient>
          <pattern id="gridPattern" width="10" height="10" patternUnits="userSpaceOnUse">
            <path d="M 10 0 L 0 0 0 10" fill="none" stroke="rgba(255, 255, 255, 0.08)" strokeWidth="0.15" opacity="0.3" />
          </pattern>
        </defs>

        {/* Map Base */}
        <rect width="100%" height="100%" fill="url(#mapGlow)" />
        <rect width="100%" height="100%" fill="url(#gridPattern)" />

        {/* Baía de Maputo (Oceano Índico) coast on the right/bottom-right */}
        <path d="M 82 0 Q 78 30 88 60 T 78 100 L 100 100 L 100 0 Z" fill="#1e40af" opacity="0.18" />
        <text x="89" y="35" fill="#3b82f6" fontSize="1.8" fontFamily="monospace" opacity="0.5" transform="rotate(90, 89, 35)" letterSpacing="0.1">BAÍA DE MAPUTO</text>

        {/* City Districts / Green Areas */}
        <circle cx="55" cy="65" r="14" fill="#10b981" opacity="0.06" /> {/* Jardim Tunduru */}
        <text x="56" y="66" fill="#10b981" fontSize="1.3" opacity="0.4">Jardim Tunduru</text>
        
        <circle cx="25" cy="35" r="8" fill="#ffffff" opacity="0.03" /> {/* Polana Cimento */}
        <text x="21" y="34" fill="#ffffff" fontSize="1.3" opacity="0.3">Polana Cimento</text>
        
        <rect x="15" y="50" width="10" height="10" fill="#10b981" opacity="0.04" rx="2" />

        {/* Main Streets/Avenues (Slightly wider, brighter lines) */}
        {/* Av. Julius Nyerere (Horizontal) */}
        <line x1="5" y1="50" x2="80" y2="50" stroke="rgba(255, 255, 255, 0.15)" strokeWidth="1.2" opacity="0.4" />
        <text x="45" y="48" fill="#ffffff" fontSize="1.8" fontFamily="monospace" opacity="0.4" letterSpacing="0.1">AV. JULIUS NYERERE</text>

        {/* Av. Eduardo Mondlane (Vertical-ish) */}
        <line x1="38" y1="10" x2="38" y2="90" stroke="rgba(255, 255, 255, 0.15)" strokeWidth="1.2" opacity="0.4" />
        <text x="39" y="80" fill="#ffffff" fontSize="1.8" fontFamily="monospace" opacity="0.4" transform="rotate(90, 39, 80)" letterSpacing="0.1">AV. EDUARDO MONDLANE</text>

        {/* Minor Streets Grid */}
        {streetLines.map((line, idx) => (
          line.type === 'h' ? (
            <line key={`h-${idx}`} x1="0" y1={line.pos} x2="80" y2={line.pos} stroke="rgba(255, 255, 255, 0.03)" strokeWidth="0.4" />
          ) : (
            <line key={`v-${idx}`} x1={line.pos} y1="0" x2={line.pos} y2="100" stroke="rgba(255, 255, 255, 0.03)" strokeWidth="0.4" opacity={line.pos < 80 ? 1 : 0} />
          )
        ))}

        {/* Active Route Draw */}
        {activeTrip && (activeTrip.status === 'ARRIVING' || activeTrip.status === 'IN_TRIP') && (
          <>
            {/* Draw complete path lines */}
            <path
              d={`M ${activeTrip.pickup.x} ${activeTrip.pickup.y} 
                  H ${activeTrip.dropoff.x} 
                  V ${activeTrip.dropoff.y}`}
              fill="none"
              stroke="#10b981"
              strokeWidth="1.2"
              strokeDasharray="2 2"
              opacity={activeTrip.status === 'IN_TRIP' ? 1 : 0.4}
            />
            {activeTrip.status === 'ARRIVING' && (
              <path
                d={`M ${driverStart.x} ${driverStart.y} 
                    H ${activeTrip.pickup.x} 
                    V ${activeTrip.pickup.y}`}
                fill="none"
                stroke="#6366f1"
                strokeWidth="1.2"
                strokeDasharray="2 2"
              />
            )}
          </>
        )}

        {/* Landmark Pins */}
        <g opacity="0.55">
          <circle cx="50" cy="50" r="1.5" fill="#38bdf8" />
          <circle cx="45" cy="80" r="1.5" fill="#38bdf8" />
          <circle cx="55" cy="65" r="1.5" fill="#10b981" />
          <circle cx="25" cy="35" r="1.5" fill="#38bdf8" />
          <circle cx="20" cy="55" r="1.5" fill="#38bdf8" />
          <circle cx="65" cy="25" r="1.5" fill="#38bdf8" />
          <circle cx="30" cy="60" r="1.5" fill="#38bdf8" />
          <circle cx="38" cy="65" r="1.5" fill="#38bdf8" />
          <circle cx="90" cy="15" r="1.5" fill="#f43f5e" />
        </g>

        {/* Searching Radar Pulse */}
        {activeTrip?.status === 'SEARCHING' && (
          <g>
            <circle
              cx={activeTrip.pickup.x}
              cy={activeTrip.pickup.y}
              r={6 * radarPulse}
              fill="none"
              stroke="#10b981"
              strokeWidth="0.5"
              opacity={Math.max(0, 1 - (radarPulse - 1) / 1.5)}
            />
            <circle
              cx={activeTrip.pickup.x}
              cy={activeTrip.pickup.y}
              r="2"
              fill="#10b981"
            />
          </g>
        )}

        {/* Pickup Pin */}
        {activeTrip && (
          <g transform={`translate(${activeTrip.pickup.x}, ${activeTrip.pickup.y})`}>
            <circle cx="0" cy="0" r="3" fill="#10b981" fillOpacity="0.2" className="animate-ping" />
            <circle cx="0" cy="0" r="1.8" fill="#10b981" />
            <circle cx="0" cy="0" r="0.8" fill="#ffffff" />
          </g>
        )}

        {/* Dropoff Pin */}
        {activeTrip && (activeTrip.status === 'SEARCHING' || activeTrip.status === 'ACCEPTED' || activeTrip.status === 'ARRIVING' || activeTrip.status === 'IN_TRIP') && (
          <g transform={`translate(${activeTrip.dropoff.x}, ${activeTrip.dropoff.y})`}>
            <circle cx="0" cy="0" r="3" fill="#f43f5e" fillOpacity="0.2" />
            <circle cx="0" cy="0" r="1.8" fill="#f43f5e" />
            <polygon points="-0.8,-0.8 0.8,-0.8 0,1" fill="#ffffff" />
          </g>
        )}

        {/* Simulated Car */}
        <g transform={`translate(${carPos.x}, ${carPos.y}) rotate(${getCarRotation()})`}>
          {/* Outer glow */}
          <circle cx="0" cy="0" r="4.5" fill={activeTrip?.status === 'IN_TRIP' ? '#10b981' : '#6366f1'} fillOpacity="0.25" />
          
          {/* Vehicle SVG Body */}
          <g transform="scale(0.09) translate(-25, -25)">
            <rect x="15" y="5" width="20" height="40" rx="6" fill={activeTrip?.status === 'IN_TRIP' ? '#10b981' : '#4f46e5'} stroke="#ffffff" strokeWidth="2" />
            {/* Windshield */}
            <rect x="18" y="12" width="14" height="8" rx="2" fill="#e2e8f0" />
            {/* Rear window */}
            <rect x="18" y="32" width="14" height="6" rx="2" fill="#e2e8f0" />
            {/* Headlights */}
            <circle cx="19" cy="4" r="2" fill="#fbbf24" />
            <circle cx="31" cy="4" r="2" fill="#fbbf24" />
          </g>
        </g>
      </svg>

      {/* Map Overlay Badge */}
      <div className="absolute top-4 left-4 flex gap-2">
        <span className="flex items-center gap-1.5 px-3 py-1.5 bg-elegant-card/95 backdrop-blur text-xs font-semibold text-slate-200 rounded-full border border-elegant-border-high shadow-lg">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
          Simulação de GPS Ativa
        </span>
        {activeTrip && (
          <span className={`flex items-center gap-1 px-3 py-1.5 bg-elegant-card/95 backdrop-blur text-xs font-bold rounded-full border shadow-lg ${
            activeTrip.status === 'ARRIVING' ? 'text-indigo-400 border-indigo-800/40' : 
            activeTrip.status === 'IN_TRIP' ? 'text-emerald-400 border-emerald-800/40' : 
            'text-slate-400 border-elegant-border'
          }`}>
            {activeTrip.status === 'SEARCHING' && 'Buscando Motorista...'}
            {activeTrip.status === 'ACCEPTED' && 'Corrida Aceita'}
            {activeTrip.status === 'ARRIVING' && 'Motorista a Caminho'}
            {activeTrip.status === 'IN_TRIP' && 'Viagem em Andamento'}
            {activeTrip.status === 'COMPLETED' && 'Viagem Concluída'}
          </span>
        )}
      </div>

      {/* Map Legend */}
      <div className="absolute bottom-4 right-4 p-2.5 bg-elegant-card/95 backdrop-blur rounded-xl border border-elegant-border-high shadow-md text-[10px] text-slate-400 space-y-1">
        <div className="flex items-center gap-1.5">
          <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 flex items-center justify-center text-white text-[6px] font-bold">P</div>
          <span>Embarque (Passageiro)</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-2.5 h-2.5 rounded-full bg-rose-500 flex items-center justify-center text-white text-[6px] font-bold">D</div>
          <span>Destino</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3.5 h-2.5 rounded bg-indigo-600 border border-white/20"></div>
          <span>Carro (Motorista Parceiro)</span>
        </div>
      </div>
    </div>
  );
};
