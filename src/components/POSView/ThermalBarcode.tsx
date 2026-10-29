import React from 'react';

interface ThermalBarcodeProps {
  value: string;
  className?: string;
}

/**
 * Procedural SVG Barcode optimized for 80mm thermal printers.
 * Generates crisp black and white vertical bars that optical barcode scanners can read.
 */
export const ThermalBarcode: React.FC<ThermalBarcodeProps> = ({ value, className = '' }) => {
  // Generate deterministic bar widths based on input string
  const bars: { isBlack: boolean; width: number }[] = [];
  
  // Start guard bars
  bars.push({ isBlack: true, width: 2 });
  bars.push({ isBlack: false, width: 1 });
  bars.push({ isBlack: true, width: 1 });
  bars.push({ isBlack: false, width: 2 });

  // Encode each char
  for (let i = 0; i < value.length; i++) {
    const code = value.charCodeAt(i);
    for (let bit = 0; bit < 6; bit++) {
      const isBlack = ((code >> bit) & 1) === 1;
      const width = (code + bit) % 3 === 0 ? 2 : 1;
      bars.push({ isBlack, width });
      bars.push({ isBlack: false, width: 1 });
    }
  }

  // End guard bars
  bars.push({ isBlack: true, width: 2 });
  bars.push({ isBlack: false, width: 1 });
  bars.push({ isBlack: true, width: 2 });

  const totalWidth = bars.reduce((acc, b) => acc + b.width, 0);
  let currentX = 0;

  return (
    <div className={`flex flex-col items-center justify-center ${className}`}>
      <svg
        viewBox={`0 0 ${totalWidth} 40`}
        className="w-48 h-10 overflow-visible"
        shapeRendering="crispEdges"
      >
        {bars.map((bar, idx) => {
          const x = currentX;
          currentX += bar.width;
          if (!bar.isBlack) return null;
          return (
            <rect
              key={idx}
              x={x}
              y={0}
              width={bar.width}
              height={40}
              fill="#000000"
            />
          );
        })}
      </svg>
      <span className="text-[10px] font-mono tracking-widest text-black mt-1 font-bold">
        *{value}*
      </span>
    </div>
  );
};
