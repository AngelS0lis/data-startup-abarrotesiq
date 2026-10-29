import React, { useEffect, useState } from 'react';
import QRCode from 'qrcode';

interface ThermalQRCodeProps {
  value: string;
  size?: number;
  className?: string;
  label?: string;
  sublabel?: string;
}

/**
 * High-contrast QR Code component optimized specifically for thermal roll printing.
 * Uses pure black and white blocks with pixelated image-rendering and quiet zone
 * so standard optical smartphone cameras and scanners can instantly read it on thermal paper.
 */
export const ThermalQRCode: React.FC<ThermalQRCodeProps> = ({
  value,
  size = 110,
  className = '',
  label = 'ESCANEA PARA ATENCIÓN O PEDIDOS',
  sublabel
}) => {
  const [dataUrl, setDataUrl] = useState<string>('');

  useEffect(() => {
    let isMounted = true;
    if (!value) return;

    QRCode.toDataURL(value, {
      width: size * 2, // 2x resolution for ultra-sharp thermal print
      margin: 1,
      errorCorrectionLevel: 'M',
      color: {
        dark: '#000000',
        light: '#ffffff'
      }
    })
      .then((url) => {
        if (isMounted) {
          setDataUrl(url);
        }
      })
      .catch((err) => {
        console.error('Error al generar código QR para ticket térmico:', err);
      });

    return () => {
      isMounted = false;
    };
  }, [value, size]);

  if (!value) return null;

  return (
    <div className={`ticket-qr-section flex flex-col items-center justify-center text-center ${className}`}>
      <div className="ticket-qr-box inline-block bg-white p-1 border border-black/20 print:border-none">
        {dataUrl ? (
          <img
            src={dataUrl}
            alt="Código QR de contacto"
            width={size}
            height={size}
            className="ticket-qr-image block mx-auto"
            style={{
              imageRendering: 'pixelated'
            }}
          />
        ) : (
          <div
            style={{ width: size, height: size }}
            className="flex items-center justify-center bg-slate-100 text-[9px] text-slate-400 font-mono"
          >
            Generando QR...
          </div>
        )}
      </div>

      {label && (
        <div className="ticket-qr-caption font-bold text-[9.5px] uppercase mt-1.5 tracking-tight leading-tight text-black">
          {label}
        </div>
      )}

      {sublabel && (
        <div className="ticket-qr-subtext text-[8.5px] text-slate-700 print:text-black mt-0.5 max-w-[240px] break-all leading-tight font-mono">
          {sublabel}
        </div>
      )}
    </div>
  );
};
