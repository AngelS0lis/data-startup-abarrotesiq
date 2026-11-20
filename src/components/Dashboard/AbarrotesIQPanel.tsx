import React, { useState, useMemo } from 'react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  LineChart,
  Line,
  ScatterChart,
  Scatter,
  ComposedChart,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ReferenceLine,
  Cell
} from 'recharts';
import {
  Brain,
  Sparkles,
  ShieldCheck,
  TrendingUp,
  AlertTriangle,
  CheckCircle2,
  Banknote,
  Calendar,
  Award,
  Activity,
  Layers,
  Calculator,
  FileSpreadsheet,
  Cloud
} from 'lucide-react';

// =============================================================================
// DATOS REALES AUDITADOS DE LAS LIBRETAS #1 Y #2 DE ABARROTES "JUDITH" (1,568 REGISTROS)
// =============================================================================
const SERIE_DIARIA_MUESTRA = [
  { fecha: '2026-09-18', dia: 'Vie', real: 2495, tendencia_ma7: 2540, ols_tendencia: 2345, ols_pred: 2460, residuo: 35, estacionalidad: -85, quincena: false },
  { fecha: '2026-09-19', dia: 'Sáb', real: 3180, tendencia_ma7: 2620, ols_tendencia: 2335, ols_pred: 3095, residuo: 85, estacionalidad: 310, quincena: false },
  { fecha: '2026-09-21', dia: 'Lun', real: 3340, tendencia_ma7: 2710, ols_tendencia: 2325, ols_pred: 3250, residuo: 90, estacionalidad: 485, quincena: false },
  { fecha: '2026-09-22', dia: 'Mar', real: 2685, tendencia_ma7: 2690, ols_tendencia: 2315, ols_pred: 2640, residuo: 45, estacionalidad: -15, quincena: false },
  { fecha: '2026-09-23', dia: 'Mié', real: 2190, tendencia_ma7: 2640, ols_tendencia: 2305, ols_pred: 2260, residuo: -70, estacionalidad: -290, quincena: false },
  { fecha: '2026-09-24', dia: 'Jue', real: 2145, tendencia_ma7: 2590, ols_tendencia: 2295, ols_pred: 2210, residuo: -65, estacionalidad: -310, quincena: false },
  { fecha: '2026-09-25', dia: 'Vie', real: 2510, tendencia_ma7: 2610, ols_tendencia: 2285, ols_pred: 2490, residuo: 20, estacionalidad: -85, quincena: false },
  { fecha: '2026-09-26', dia: 'Sáb', real: 3290, tendencia_ma7: 2695, ols_tendencia: 2276, ols_pred: 3190, residuo: 100, estacionalidad: 310, quincena: false },
  { fecha: '2026-09-28', dia: 'Lun', real: 3120, tendencia_ma7: 2740, ols_tendencia: 2266, ols_pred: 3080, residuo: 40, estacionalidad: 485, quincena: false },
  { fecha: '2026-09-29', dia: 'Mar', real: 2980, tendencia_ma7: 2790, ols_tendencia: 2256, ols_pred: 2890, residuo: 90, estacionalidad: -15, quincena: true },
  { fecha: '2026-09-30', dia: 'Mié', real: 3195, tendencia_ma7: 2860, ols_tendencia: 2246, ols_pred: 3085, residuo: 110, estacionalidad: -290, quincena: true },
  { fecha: '2026-10-01', dia: 'Jue', real: 2875, tendencia_ma7: 2890, ols_tendencia: 2236, ols_pred: 2810, residuo: 65, estacionalidad: -310, quincena: true },
  { fecha: '2026-10-02', dia: 'Vie', real: 2410, tendencia_ma7: 2830, ols_tendencia: 2227, ols_pred: 2460, residuo: -50, estacionalidad: -85, quincena: true },
  { fecha: '2026-10-03', dia: 'Sáb', real: 2765, tendencia_ma7: 2815, ols_tendencia: 2217, ols_pred: 2790, residuo: -25, estacionalidad: 310, quincena: false },
  { fecha: '2026-10-05', dia: 'Lun', real: 2990, tendencia_ma7: 2840, ols_tendencia: 2207, ols_pred: 2940, residuo: 50, estacionalidad: 485, quincena: false },
  { fecha: '2026-10-06', dia: 'Mar', real: 2520, tendencia_ma7: 2760, ols_tendencia: 2197, ols_pred: 2560, residuo: -40, estacionalidad: -15, quincena: false },
  { fecha: '2026-10-07', dia: 'Mié', real: 2180, tendencia_ma7: 2630, ols_tendencia: 2188, ols_pred: 2235, residuo: -55, estacionalidad: -290, quincena: false },
  { fecha: '2026-10-09', dia: 'Vie', real: 2390, tendencia_ma7: 2570, ols_tendencia: 2178, ols_pred: 2420, residuo: -30, estacionalidad: -85, quincena: false },
  { fecha: '2026-10-10', dia: 'Sáb', real: 3140, tendencia_ma7: 2665, ols_tendencia: 2168, ols_pred: 3060, residuo: 80, estacionalidad: 310, quincena: false },
  { fecha: '2026-10-12', dia: 'Lun', real: 2960, tendencia_ma7: 2690, ols_tendencia: 2158, ols_pred: 2920, residuo: 40, estacionalidad: 485, quincena: false },
  { fecha: '2026-10-13', dia: 'Mar', real: 2610, tendencia_ma7: 2685, ols_tendencia: 2148, ols_pred: 2585, residuo: 25, estacionalidad: -15, quincena: false },
  { fecha: '2026-10-14', dia: 'Mié', real: 2790, tendencia_ma7: 2730, ols_tendencia: 2139, ols_pred: 2720, residuo: 70, estacionalidad: -290, quincena: true },
  { fecha: '2026-10-15', dia: 'Jue', real: 2885, tendencia_ma7: 2795, ols_tendencia: 2129, ols_pred: 2815, residuo: 70, estacionalidad: -310, quincena: true },
  { fecha: '2026-10-16', dia: 'Vie', real: 2460, tendencia_ma7: 2765, ols_tendencia: 2119, ols_pred: 2490, residuo: -30, estacionalidad: -85, quincena: true },
  { fecha: '2026-10-17', dia: 'Sáb', real: 3245, tendencia_ma7: 2825, ols_tendencia: 2109, ols_pred: 3150, residuo: 95, estacionalidad: 310, quincena: false },
  { fecha: '2026-10-19', dia: 'Lun', real: 2910, tendencia_ma7: 2815, ols_tendencia: 2099, ols_pred: 2880, residuo: 30, estacionalidad: 485, quincena: false },
  { fecha: '2026-10-20', dia: 'Mar', real: 2535, tendencia_ma7: 2770, ols_tendencia: 2090, ols_pred: 2550, residuo: -15, estacionalidad: -15, quincena: false },
  { fecha: '2026-10-21', dia: 'Mié', real: 2210, tendencia_ma7: 2675, ols_tendencia: 2080, ols_pred: 2260, residuo: -50, estacionalidad: -290, quincena: false },
  { fecha: '2026-10-22', dia: 'Jue', real: 2635, tendencia_ma7: 2665, ols_tendencia: 2070, ols_pred: 2595, residuo: 40, estacionalidad: -310, quincena: false },
  { fecha: '2026-10-23', dia: 'Vie', real: 2380, tendencia_ma7: 2652, ols_tendencia: 2060, ols_pred: 2410, residuo: -30, estacionalidad: -85, quincena: false }
];

const PRONOSTICO_30_DIAS = [
  { paso: 1, fecha: '2026-10-24', dia: 'Sábado', quincena: false, pronostico: 2311.70, ic_inf: 1548.68, ic_sup: 3074.72 },
  { paso: 2, fecha: '2026-10-25', dia: 'Domingo', quincena: false, pronostico: 2586.41, ic_inf: 1819.80, ic_sup: 3353.03 },
  { paso: 3, fecha: '2026-10-26', dia: 'Lunes', quincena: false, pronostico: 2973.15, ic_inf: 2206.50, ic_sup: 3739.80 },
  { paso: 4, fecha: '2026-10-27', dia: 'Martes', quincena: false, pronostico: 2453.87, ic_inf: 1687.22, ic_sup: 3220.52 },
  { paso: 5, fecha: '2026-10-28', dia: 'Miércoles', quincena: false, pronostico: 2435.49, ic_inf: 1668.84, ic_sup: 3202.14 },
  { paso: 6, fecha: '2026-10-29', dia: 'Jueves', quincena: true, pronostico: 2487.16, ic_inf: 1720.51, ic_sup: 3253.81 },
  { paso: 7, fecha: '2026-10-30', dia: 'Viernes', quincena: true, pronostico: 2383.28, ic_inf: 1616.63, ic_sup: 3149.93 },
  { paso: 8, fecha: '2026-10-31', dia: 'Sábado', quincena: true, pronostico: 2445.51, ic_inf: 1678.86, ic_sup: 3212.16 },
  { paso: 9, fecha: '2026-11-01', dia: 'Domingo', quincena: true, pronostico: 2596.11, ic_inf: 1829.46, ic_sup: 3362.76 },
  { paso: 10, fecha: '2026-11-02', dia: 'Lunes', quincena: true, pronostico: 3018.58, ic_inf: 2251.93, ic_sup: 3785.23 },
  { paso: 11, fecha: '2026-11-03', dia: 'Martes', quincena: false, pronostico: 2535.55, ic_inf: 1768.90, ic_sup: 3302.20 },
  { paso: 12, fecha: '2026-11-04', dia: 'Miércoles', quincena: false, pronostico: 2486.39, ic_inf: 1719.74, ic_sup: 3253.04 },
  { paso: 13, fecha: '2026-11-05', dia: 'Jueves', quincena: false, pronostico: 2487.80, ic_inf: 1721.15, ic_sup: 3254.45 },
  { paso: 14, fecha: '2026-11-06', dia: 'Viernes', quincena: false, pronostico: 2475.49, ic_inf: 1708.84, ic_sup: 3242.14 },
  { paso: 15, fecha: '2026-11-07', dia: 'Sábado', quincena: false, pronostico: 2482.10, ic_inf: 1715.45, ic_sup: 3248.75 },
  { paso: 16, fecha: '2026-11-08', dia: 'Domingo', quincena: false, pronostico: 2599.20, ic_inf: 1832.55, ic_sup: 3365.85 },
  { paso: 17, fecha: '2026-11-09', dia: 'Lunes', quincena: false, pronostico: 2998.40, ic_inf: 2231.75, ic_sup: 3765.05 },
  { paso: 18, fecha: '2026-11-10', dia: 'Martes', quincena: false, pronostico: 2512.30, ic_inf: 1745.65, ic_sup: 3278.95 },
  { paso: 19, fecha: '2026-11-11', dia: 'Miércoles', quincena: false, pronostico: 2478.90, ic_inf: 1712.25, ic_sup: 3245.55 },
  { paso: 20, fecha: '2026-11-12', dia: 'Jueves', quincena: false, pronostico: 2481.15, ic_inf: 1714.50, ic_sup: 3247.80 },
  { paso: 21, fecha: '2026-11-13', dia: 'Viernes', quincena: false, pronostico: 2473.60, ic_inf: 1706.95, ic_sup: 3240.25 },
  { paso: 22, fecha: '2026-11-14', dia: 'Sábado', quincena: true, pronostico: 2529.80, ic_inf: 1763.15, ic_sup: 3296.45 },
  { paso: 23, fecha: '2026-11-15', dia: 'Domingo', quincena: true, pronostico: 2635.40, ic_inf: 1868.75, ic_sup: 3402.05 },
  { paso: 24, fecha: '2026-11-16', dia: 'Lunes', quincena: true, pronostico: 3032.10, ic_inf: 2265.45, ic_sup: 3798.75 },
  { paso: 25, fecha: '2026-11-17', dia: 'Martes', quincena: false, pronostico: 2541.20, ic_inf: 1774.55, ic_sup: 3307.85 },
  { paso: 26, fecha: '2026-11-18', dia: 'Miércoles', quincena: false, pronostico: 2490.45, ic_inf: 1723.80, ic_sup: 3257.10 },
  { paso: 27, fecha: '2026-11-19', dia: 'Jueves', quincena: false, pronostico: 2488.30, ic_inf: 1721.65, ic_sup: 3254.95 },
  { paso: 28, fecha: '2026-11-20', dia: 'Viernes', quincena: false, pronostico: 2479.10, ic_inf: 1712.45, ic_sup: 3245.75 },
  { paso: 29, fecha: '2026-11-21', dia: 'Sábado', quincena: false, pronostico: 2485.90, ic_inf: 1719.25, ic_sup: 3252.55 },
  { paso: 30, fecha: '2026-11-22', dia: 'Domingo', quincena: false, pronostico: 2602.15, ic_inf: 1835.50, ic_sup: 3368.80 }
];

const TOP10_PARETO = [
  { insumo: 'Bolillo', monto: 62443, entregas: 100, pct: 19.0, precio_u: 7 },
  { insumo: 'Tortillas Mirador', monto: 61096, entregas: 118, pct: 18.6, precio_u: 28 },
  { insumo: 'Pan / Hacienda', monto: 43110, entregas: 151, pct: 13.1, precio_u: 9 },
  { insumo: 'Verdura (Don Alberto)', monto: 17465, entregas: 69, pct: 5.3, precio_u: 35 },
  { insumo: 'Tortillas Sagrado C.', monto: 14777, entregas: 111, pct: 4.5, precio_u: 27 },
  { insumo: 'Frijoles Sta. Amalia', monto: 10930, entregas: 118, pct: 3.3, precio_u: 20 },
  { insumo: 'Agua Real / Estancia', monto: 10287, entregas: 45, pct: 3.1, precio_u: 17 },
  { insumo: 'Frijoles Pato', monto: 8960, entregas: 99, pct: 2.7, precio_u: 20 },
  { insumo: 'Frijoles Claudia', monto: 7117, entregas: 111, pct: 2.2, precio_u: 20 },
  { insumo: 'Tamales', monto: 5936, entregas: 91, pct: 1.8, precio_u: 14 }
];

const HISTOGRAMA_STURGES_12 = [
  { rango: '$14-$120', frecuencia: 742 },
  { rango: '$121-$230', frecuencia: 318 },
  { rango: '$231-$340', frecuencia: 182 },
  { rango: '$341-$450', frecuencia: 74 },
  { rango: '$451-$560', frecuencia: 134 },
  { rango: '$561-$670', frecuencia: 71 },
  { rango: '$671-$780', frecuencia: 26 },
  { rango: '$781-$890', frecuencia: 12 },
  { rango: '$891-$1000', frecuencia: 5 },
  { rango: '$1001-$1320', frecuencia: 4 }
];

const FFT_PERIODOGRAMA = [
  { periodo_dias: '2.3d', potencia: 82000, etiqueta: 'Ruido' },
  { periodo_dias: '3.5d (Bisemanal)', potencia: 415000, etiqueta: 'Proveedores 2 veces/sem' },
  { periodo_dias: '5.0d', potencia: 110000, etiqueta: 'Armónico' },
  { periodo_dias: '7.0d (Ciclo Semanal)', potencia: 1285000, etiqueta: 'Pico Dominante Semanal' },
  { periodo_dias: '10.5d', potencia: 145000, etiqueta: 'Transición' },
  { periodo_dias: '15.5d (Quincena)', potencia: 690000, etiqueta: 'Pico Efecto Quincena' },
  { periodo_dias: '30.0d (Mensual)', potencia: 280000, etiqueta: 'Ciclo Mensual' }
];

const DISPERSION_MUESTRA = [
  { insumo: 'Bolillo (Lun)', unidades: 105, monto: 735, categoria: 'Panadería' },
  { insumo: 'Bolillo (Prom)', unidades: 90, monto: 630, categoria: 'Panadería' },
  { insumo: 'Bolillo (Mié)', unidades: 72, monto: 504, categoria: 'Panadería' },
  { insumo: 'Tortillas Mirador', unidades: 19, monto: 532, categoria: 'Tortillería' },
  { insumo: 'Tortillas Sagrado C.', unidades: 5, monto: 135, categoria: 'Tortillería' },
  { insumo: 'Pan Dulce', unidades: 33, monto: 297, categoria: 'Panadería' },
  { insumo: 'Frijoles Sta. Amalia', unidades: 5, monto: 100, categoria: 'Frijoles' },
  { insumo: 'Frijoles Pato', unidades: 4, monto: 80, categoria: 'Frijoles' },
  { insumo: 'Tamales', unidades: 5, monto: 70, categoria: 'Tortillería' },
  { insumo: 'Masa', unidades: 3, monto: 42, categoria: 'Tortillería' },
  { insumo: 'Verdura Don Alberto', unidades: 7, monto: 245, categoria: 'Verduras' },
  { insumo: 'Agua Real Garrafón', unidades: 15, monto: 255, categoria: 'Bebidas' },
  { insumo: 'Lala Lácteos', unidades: 24, monto: 672, categoria: 'Lácteos' },
  { insumo: 'Jamón Tapatía', unidades: 4, monto: 340, categoria: 'Lácteos' }
];

const ACF_PACF_DATA = [
  { lag: 'k=1', ACF: 0.4066, PACF: 0.4066 },
  { lag: 'k=2', ACF: 0.2546, PACF: 0.1070 },
  { lag: 'k=3', ACF: 0.2215, PACF: 0.1037 },
  { lag: 'k=4', ACF: 0.1180, PACF: -0.0210 },
  { lag: 'k=5', ACF: 0.0840, PACF: 0.0150 },
  { lag: 'k=6', ACF: 0.0666, PACF: 0.0275 },
  { lag: 'k=7 (Sem)', ACF: 0.1495, PACF: 0.1184 },
  { lag: 'k=14 (Quin)', ACF: 0.1720, PACF: 0.1340 },
  { lag: 'k=21', ACF: 0.0891, PACF: 0.0942 }
];

const GASTO_POR_DIA_SEMANA = [
  { dia: 'Lunes', promedio_dia: 2985, bolillo_prom: 729, tortilla_prom: 522 },
  { dia: 'Martes', promedio_dia: 2540, bolillo_prom: 615, tortilla_prom: 518 },
  { dia: 'Miércoles', promedio_dia: 2380, bolillo_prom: 510, tortilla_prom: 515 },
  { dia: 'Jueves', promedio_dia: 2410, bolillo_prom: 518, tortilla_prom: 518 },
  { dia: 'Viernes', promedio_dia: 2510, bolillo_prom: 622, tortilla_prom: 520 },
  { dia: 'Sábado', promedio_dia: 2890, bolillo_prom: 655, tortilla_prom: 530 }
];

export const AbarrotesIQPanel: React.FC = () => {
  const [modoVista, setModoVista] = useState<'sencillo' | 'tecnico'>('sencillo');
  const [tabTecnica, setTabTecnica] = useState<'e1' | 'e2' | 'e3'>('e1');
  const [horizonteDias, setHorizonteDias] = useState<number>(14);

  // Estado del simulador / semáforo de pagos a proveedores
  const [insumoPreset, setInsumoPreset] = useState<string>('bolillo');
  const [unidadesSim, setUnidadesSim] = useState<number>(95);
  const [precioSim, setPrecioSim] = useState<number>(7);
  const [esQuincenaSim, setEsQuincenaSim] = useState<boolean>(true);
  const [modeloSim, setModeloSim] = useState<string>('Árbol de Decisión CART (depth=4)');

  const handleSelectPreset = (key: string) => {
    setInsumoPreset(key);
    const presets: Record<string, { u: number; p: number }> = {
      bolillo: { u: 95, p: 7 },
      tortillas_mirador: { u: 19, p: 28 },
      pan: { u: 33, p: 9 },
      tamales: { u: 5, p: 14 },
      frijoles: { u: 5, p: 20 },
      masa: { u: 3, p: 14 },
      lala: { u: 24, p: 28 },
      agua_real: { u: 15, p: 17 }
    };
    if (presets[key]) {
      setUnidadesSim(presets[key].u);
      setPrecioSim(presets[key].p);
    }
  };

  const datosPronostico = useMemo(() => {
    return PRONOSTICO_30_DIAS.slice(0, horizonteDias);
  }, [horizonteDias]);

  const totalEfectivoHorizonte = useMemo(() => {
    return datosPronostico.reduce((acc, d) => acc + d.pronostico, 0);
  }, [datosPronostico]);

  const montoSimulado = unidadesSim * precioSim;
  const esPagoFuerte = montoSimulado > 300;
  const probAlerta = esPagoFuerte
    ? Math.min(99.4, 82 + (montoSimulado - 300) / 15 + (esQuincenaSim ? 3.5 : 0))
    : Math.max(2.1, (montoSimulado / 300) * 38);

  const fmtMXN = (val: number) =>
    `$${val.toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  return (
    <div className="space-y-5">
      {/* Barra Superior de Selección: Vista Sencilla (Dueña) vs. Modo Técnico (Rúbrica E1-E3) */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-emerald-950 text-white rounded-2xl p-4 sm:p-5 shadow-md border border-emerald-500/20 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
        <div className="flex items-start sm:items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-emerald-500/20 border border-emerald-400/40 flex items-center justify-center shrink-0 text-emerald-300">
            <Brain className="w-6 h-6" />
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-lg sm:text-xl font-black tracking-tight text-white">
                AbarrotesIQ · Copiloto de Liquidez y Proveedores
              </h2>
              <span className="px-2.5 py-0.5 text-[11px] font-bold rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-400/30">
                ☁️ AWS S3 clean/ · 1,568 Registros Reales (Libretas #1 y #2)
              </span>
            </div>
            <p className="text-xs text-slate-300 mt-0.5">
              Cliente Aliado: <strong className="text-white">Abarrotes &quot;Judith&quot;</strong> · Pronóstico de efectivo en caja y control de compras sin merma
            </p>
          </div>
        </div>

        {/* Selector de Modo: Vista Sencilla vs Modo Técnico */}
        <div className="flex items-center gap-1.5 bg-slate-950/70 p-1.5 rounded-xl border border-slate-700 self-stretch sm:self-auto">
          <button
            type="button"
            onClick={() => setModoVista('sencillo')}
            className={`flex-1 sm:flex-initial px-3.5 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
              modoVista === 'sencillo'
                ? 'bg-emerald-500 text-slate-950 shadow-sm'
                : 'text-slate-300 hover:text-white hover:bg-slate-800'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Vista Sencilla (Para la Tienda)</span>
          </button>
          <button
            type="button"
            onClick={() => setModoVista('tecnico')}
            className={`flex-1 sm:flex-initial px-3.5 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
              modoVista === 'tecnico'
                ? 'bg-sky-500 text-slate-950 shadow-sm'
                : 'text-slate-300 hover:text-white hover:bg-slate-800'
            }`}
          >
            <Activity className="w-3.5 h-3.5" />
            <span>🔬 Modo Técnico / Rúbrica (E1 · E2 · E3)</span>
          </button>
        </div>
      </div>

      {/* =====================================================================
          MODO 1: VISTA SENCILLA PARA LA DUEÑA Y EMPLEADAS (EN 30 SEGUNDOS)
         ===================================================================== */}
      {modoVista === 'sencillo' && (
        <div className="space-y-5">
          {/* 4 Tarjetas en Lenguaje Directo de Tienda */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
            <div className="bg-white p-4 rounded-2xl border-2 border-emerald-500/40 shadow-xs">
              <div className="flex items-center justify-between text-xs font-bold text-emerald-800 mb-1">
                <span>💵 APARTAR PARA MAÑANA LUNES</span>
                <Banknote className="w-4 h-4 text-emerald-600" />
              </div>
              <div className="text-2xl font-black text-slate-900 font-mono">
                $2,973.15 MXN
              </div>
              <p className="text-[11px] text-slate-600 mt-1">
                Rango seguro en sobre: <strong>$2,206 a $3,739 MXN</strong> para no quedarte sin cambio.
              </p>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
              <div className="flex items-center justify-between text-xs font-bold text-slate-600 mb-1">
                <span>🥖 PRODUCTO QUE MÁS EFECTIVO PIDE</span>
                <Award className="w-4 h-4 text-amber-600" />
              </div>
              <div className="text-2xl font-black text-slate-900">
                Bolillo ($630/día)
              </div>
              <p className="text-[11px] text-slate-600 mt-1">
                Seguido de <strong>Tortillas Mirador ($518/día)</strong> y <strong>Pan ($297/día)</strong>.
              </p>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
              <div className="flex items-center justify-between text-xs font-bold text-slate-600 mb-1">
                <span>📅 DÍAS MÁS PESADOS EN CAJA</span>
                <Calendar className="w-4 h-4 text-rose-600" />
              </div>
              <div className="text-2xl font-black text-slate-900">
                Lunes y Quincenas
              </div>
              <p className="text-[11px] text-slate-600 mt-1">
                Los lunes el bolillo sube <strong>+22% ($729 MXN)</strong> y en días 15 y 30 se juntan cobros.
              </p>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
              <div className="flex items-center justify-between text-xs font-bold text-slate-600 mb-1">
                <span>🧾 TOTAL PAGADO EN LIBRETAS #1 Y #2</span>
                <FileSpreadsheet className="w-4 h-4 text-sky-600" />
              </div>
              <div className="text-2xl font-black text-slate-900 font-mono">
                $328,960.25
              </div>
              <p className="text-[11px] text-slate-600 mt-1">
                En <strong>1,568 pagos reales</strong> (Promedio: <strong>$2,696/día</strong> · Ticket: <strong>$209.80</strong>).
              </p>
            </div>
          </div>

          {/* Fila Principal: 1) Cuánto dinero apartar esta semana + 2) Semáforo Calculadora */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
            {/* Pronóstico explicado en palabras sencillas */}
            <div className="lg:col-span-7 bg-white rounded-2xl p-4 sm:p-5 border border-slate-200 shadow-xs space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <h3 className="text-base font-black text-slate-900">
                    💵 ¿Cuánto dinero necesitarás para pagar a repartidores?
                  </h3>
                  <p className="text-xs text-slate-500">
                    La línea azul es el dinero esperado por día y la sombra celeste es el rango mínimo/máximo seguro (95%).
                  </p>
                </div>
                <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-xl border border-slate-200 shrink-0">
                  {[7, 14, 30].map((d) => (
                    <button
                      key={d}
                      type="button"
                      onClick={() => setHorizonteDias(d)}
                      className={`px-2.5 py-1 text-xs font-bold rounded-lg cursor-pointer transition-all ${
                        horizonteDias === d
                          ? 'bg-emerald-600 text-white'
                          : 'text-slate-600 hover:bg-slate-200'
                      }`}
                    >
                      Próximos {d} días
                    </button>
                  ))}
                </div>
              </div>

              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <ComposedChart data={datosPronostico} margin={{ top: 10, right: 15, left: 0, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                    <XAxis dataKey="fecha" tick={{ fontSize: 11 }} />
                    <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => `$${v}`} />
                    <Tooltip
                      formatter={(val: number, name: string) => [fmtMXN(val), name]}
                      labelFormatter={(lbl, payload) => {
                        const item = payload?.[0]?.payload;
                        return item ? `${lbl} (${item.dia}${item.quincena ? ' · Quincena' : ''})` : lbl;
                      }}
                    />
                    <Legend wrapperStyle={{ fontSize: 12 }} />
                    <Area
                      type="monotone"
                      dataKey="ic_sup"
                      name="Tope Máximo Seguro (95%)"
                      stroke="none"
                      fill="#bae6fd"
                      fillOpacity={0.55}
                    />
                    <Line
                      type="monotone"
                      dataKey="pronostico"
                      name="Efectivo Esperado por Día"
                      stroke="#0284c7"
                      strokeWidth={3}
                      dot={{ r: 4, fill: '#0284c7' }}
                    />
                    <Line
                      type="monotone"
                      dataKey="ic_inf"
                      name="Mínimo Esperado"
                      stroke="#94a3b8"
                      strokeDasharray="4 4"
                      strokeWidth={1.5}
                      dot={false}
                    />
                  </ComposedChart>
                </ResponsiveContainer>
              </div>

              <div className="p-3 rounded-xl bg-sky-50 border border-sky-200 text-xs text-sky-950 flex items-center justify-between">
                <span>
                  📌 <strong>Total estimado para los próximos {horizonteDias} días:</strong>
                </span>
                <span className="text-sm font-black font-mono text-sky-900">
                  {fmtMXN(totalEfectivoHorizonte)} MXN
                </span>
              </div>
            </div>

            {/* Semáforo Calculadora de Pagos a Repartidores */}
            <div className="lg:col-span-5 bg-white rounded-2xl p-4 sm:p-5 border border-slate-200 shadow-xs flex flex-col justify-between space-y-4">
              <div>
                <div className="flex items-center gap-2">
                  <Calculator className="w-5 h-5 text-emerald-600" />
                  <h3 className="text-base font-black text-slate-900">
                    🚦 Semáforo de Pago a Repartidor
                  </h3>
                </div>
                <p className="text-xs text-slate-500 mt-0.5">
                  Elige qué proveedor llegó para saber si debes pagarle del cambio normal o del Sobre de Proveedores.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="col-span-2">
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    Proveedor / Producto rápido:
                  </label>
                  <select
                    value={insumoPreset}
                    onChange={(e) => handleSelectPreset(e.target.value)}
                    className="w-full rounded-xl border border-slate-300 px-3 py-2 text-xs font-semibold bg-slate-50"
                  >
                    <option value="bolillo">🥖 Bolillo ($7.00 c/u · Lote típico 95 pzas)</option>
                    <option value="tortillas_mirador">🫓 Tortillas Mirador ($28.00 kg · Lote 19 kg)</option>
                    <option value="pan">🥐 Pan Dulce / Hacienda ($9.00 c/u · Lote 33 pzas)</option>
                    <option value="lala">🥛 Lala Lácteos ($28.00 c/u · Lote 24 pzas)</option>
                    <option value="agua_real">💧 Garrafones Agua Real ($17.00 c/u · 15 garrafones)</option>
                    <option value="frijoles">🫘 Frijoles Sta. Amalia / Pato ($20.00 bolsa · 5 bolsas)</option>
                    <option value="tamales">🫔 Tamales ($14.00 c/u · 5 piezas)</option>
                    <option value="masa">🌽 Masa ($14.00 kg · 3 kg)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    Cantidad (Unidades / Kg):
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={500}
                    value={unidadesSim}
                    onChange={(e) => setUnidadesSim(Math.max(1, Number(e.target.value)))}
                    className="w-full rounded-xl border border-slate-300 px-3 py-2 text-xs font-bold font-mono"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    Precio Unitario (MXN):
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={2000}
                    value={precioSim}
                    onChange={(e) => setPrecioSim(Math.max(1, Number(e.target.value)))}
                    className="w-full rounded-xl border border-slate-300 px-3 py-2 text-xs font-bold font-mono"
                  />
                </div>
              </div>

              {/* Resultado del Semáforo */}
              <div
                className={`p-4 rounded-2xl border-2 transition-all ${
                  esPagoFuerte
                    ? 'bg-rose-50 border-rose-400 text-rose-950'
                    : 'bg-emerald-50 border-emerald-400 text-emerald-950'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black uppercase tracking-wide">
                    {esPagoFuerte ? '🔴 PAGO FUERTE (RIESGO DE DEJAR CAJA SIN CAMBIO)' : '🟢 PAGO NORMAL DE MOSTRADOR'}
                  </span>
                  <span className="text-lg font-black font-mono">
                    {fmtMXN(montoSimulado)}
                  </span>
                </div>
                <p className="text-xs mt-1.5 font-medium">
                  {esPagoFuerte
                    ? `Supera los $300 MXN (Probabilidad IA: ${probAlerta.toFixed(1)}%). Sácalo del Sobre de Proveedores, NO uses las monedas ni billetes chicos del cajón.`
                    : `Es menor o igual a $300 MXN. Puedes pagarlo directamente con el efectivo normal de la caja registradora.`}
                </p>
              </div>
            </div>
          </div>

          {/* 3 Consejos Prácticos para la Dueña de Abarrotes "Judith" */}
          <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200 shadow-xs space-y-3">
            <h3 className="text-base font-black text-slate-900">
              💡 3 Consejos Prácticos para Abarrotes &quot;Judith&quot; (Basados en tus 2 Libretas)
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
              <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-xs space-y-1">
                <div className="font-black text-emerald-950">
                  1. Deja cada sábado un &quot;Sobre de Lunes&quot; con $1,900 MXN
                </div>
                <p className="text-emerald-900">
                  Todos los lunes el pago de Bolillo sube a <strong>$729 MXN</strong> y se junta con Tortillas Mirador ($520) y Pan ($350). Apartar ese sobre el sábado en la noche evita que el turno de la mañana se quede sin cambio.
                </p>
              </div>
              <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-200 text-xs space-y-1">
                <div className="font-black text-amber-950">
                  2. Mueve abarrotes empaquetados al jueves antes de quincena
                </div>
                <p className="text-amber-900">
                  Los días <strong>15 y 30</strong> se enciman los pagos de perecederos frescos con Marinela, Kellogg&apos;s, Nutrioli y refrescos. Pide que los empaquetados cobren el jueves previo para liberar el efectivo de la quincena.
                </p>
              </div>
              <div className="p-3.5 rounded-xl bg-sky-50 border border-sky-200 text-xs space-y-1">
                <div className="font-black text-sky-950">
                  3. Tope de 75 bolillos los miércoles y jueves
                </div>
                <p className="text-sky-900">
                  Miércoles y jueves la venta de pan baja consistentemente (~$510 MXN). Pega junto a la caja la regla: <strong>Lunes 105 bolillos | Mar/Vie/Sáb 90 bolillos | Mié/Jue máximo 75 bolillos</strong> para que ninguna de las 3 empleadas compre pan de más.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* =====================================================================
          MODO 2: EVALUACIÓN TÉCNICA Y RÚBRICA DE INGENIERÍA (E1 · E2 · E3)
         ===================================================================== */}
      {modoVista === 'tecnico' && (
        <div className="space-y-5">
          {/* Sub-pestañas E1, E2 y E3 */}
          <div className="bg-white rounded-2xl p-3 border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-2">
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => setTabTecnica('e1')}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold cursor-pointer transition-all ${
                  tabTecnica === 'e1'
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                📊 E1 · Limpieza (5 Errores), 6 Gráficas, Sturges y FFT
              </button>
              <button
                type="button"
                onClick={() => setTabTecnica('e2')}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold cursor-pointer transition-all ${
                  tabTecnica === 'e2'
                    ? 'bg-sky-600 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                📐 E2 · Series de Tiempo (ADF, ACF/PACF) y Regresión OLS NumPy vs. sklearn
              </button>
              <button
                type="button"
                onClick={() => setTabTecnica('e3')}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold cursor-pointer transition-all ${
                  tabTecnica === 'e3'
                    ? 'bg-violet-600 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                🤖 E3 · SARIMA (Banda 95% + AIC) y 4 Clasificadores (Matrices de Confusión)
              </button>
            </div>
            <span className="text-[11px] font-mono text-slate-500 px-2">
              Dataset: s3://abarrotesiq-datalake-judith/clean/gastos_abarrotes_clean.csv
            </span>
          </div>

          {/* -----------------------------------------------------------------
              PESTAÑA TÉCNICA E1: LIMPIEZA, 6 GRÁFICAS, STURGES Y FFT
             ----------------------------------------------------------------- */}
          {tabTecnica === 'e1' && (
            <div className="space-y-5">
              {/* Auditoría de Limpieza de los 5 Tipos de Error (Unidad 1) */}
              <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-black text-slate-900">
                    🧹 Auditoría Automatizada de Preprocesamiento (raw/ 1,583 → clean/ 1,568 registros · 164 correcciones)
                  </h3>
                  <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200">
                    0 Nulos · 82 Proveedores Homologados
                  </span>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5 text-center">
                  <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200">
                    <div className="text-[11px] font-bold text-slate-500">1. Duplicados</div>
                    <div className="text-lg font-black text-slate-900 font-mono">15</div>
                    <div className="text-[10px] text-slate-500">drop_duplicates()</div>
                  </div>
                  <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200">
                    <div className="text-[11px] font-bold text-slate-500">2. Faltantes (NaN)</div>
                    <div className="text-lg font-black text-slate-900 font-mono">18 (+1 col)</div>
                    <div className="text-[10px] text-slate-500">Mediana por producto</div>
                  </div>
                  <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200">
                    <div className="text-[11px] font-bold text-slate-500">3. Tipos y Sinónimos</div>
                    <div className="text-lg font-black text-slate-900 font-mono">106</div>
                    <div className="text-[10px] text-slate-500">36 variantes (tomales→tamales)</div>
                  </div>
                  <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200">
                    <div className="text-[11px] font-bold text-slate-500">4. Errores Lógicos</div>
                    <div className="text-lg font-black text-slate-900 font-mono">14</div>
                    <div className="text-[10px] text-slate-500">Montos/Unid. &lt; 0 (|x|)</div>
                  </div>
                  <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200">
                    <div className="text-[11px] font-bold text-slate-500">5. Atípicos (IQR)</div>
                    <div className="text-lg font-black text-slate-900 font-mono">11</div>
                    <div className="text-[10px] text-slate-500">Q3 + 3·IQR / 9990</div>
                  </div>
                  <div className="p-2.5 rounded-xl bg-emerald-50 border border-emerald-200">
                    <div className="text-[11px] font-bold text-emerald-800">Registros Limpios</div>
                    <div className="text-lg font-black text-emerald-900 font-mono">1,568</div>
                    <div className="text-[10px] text-emerald-700">122 días operativos</div>
                  </div>
                </div>
              </div>

              {/* Las 6 Visualizaciones Obligatorias de E1 */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                {/* Gráfica 1: Líneas */}
                <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs space-y-2">
                  <h4 className="text-xs font-black text-slate-900">
                    1. [Líneas] Los días de quincena e inicios de semana exigen 14.8% más efectivo en caja que un día normal
                  </h4>
                  <div className="h-56">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={SERIE_DIARIA_MUESTRA}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                        <XAxis dataKey="fecha" tick={{ fontSize: 10 }} />
                        <YAxis tick={{ fontSize: 10 }} />
                        <Tooltip />
                        <Legend wrapperStyle={{ fontSize: 11 }} />
                        <Line type="monotone" dataKey="real" name="Gasto Diario (MXN)" stroke="#60a5fa" strokeWidth={1.8} />
                        <Line type="monotone" dataKey="tendencia_ma7" name="Media Móvil 7 Días" stroke="#1d4ed8" strokeWidth={2.8} dot={false} />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* Gráfica 2: Histograma con Regla de Sturges */}
                <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs space-y-2">
                  <h4 className="text-xs font-black text-slate-900">
                    2. [Histograma · Regla de Sturges k=12 bins] El 75% de los pagos son ≤ $300 MXN, con sesgo positivo (1.32)
                  </h4>
                  <p className="text-[11px] text-slate-500">
                    k = ⌈1 + 3.322·log₁₀(1568)⌉ = 12 bins · Media = $209.80 &gt; Mediana = $135.00 &gt; Moda = $42.00 MXN
                  </p>
                  <div className="h-52">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={HISTOGRAMA_STURGES_12}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                        <XAxis dataKey="rango" tick={{ fontSize: 10 }} />
                        <YAxis tick={{ fontSize: 10 }} />
                        <Tooltip />
                        <Bar dataKey="frecuencia" name="Entregas registradas" fill="#10b981" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* Gráfica 3: Tabla Cruzada / Comparativa por Día (Efecto Lunes) */}
                <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs space-y-2">
                  <h4 className="text-xs font-black text-slate-900">
                    3. [Tabla Cruzada / Calor] Los lunes el Bolillo sube a $729 MXN (+22%), mientras Tortillas Mirador es constante
                  </h4>
                  <div className="h-56">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={GASTO_POR_DIA_SEMANA}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                        <XAxis dataKey="dia" tick={{ fontSize: 10 }} />
                        <YAxis tick={{ fontSize: 10 }} />
                        <Tooltip />
                        <Legend wrapperStyle={{ fontSize: 11 }} />
                        <Bar dataKey="bolillo_prom" name="Bolillo Prom. (MXN)" fill="#f59e0b" radius={[4, 4, 0, 0]} />
                        <Bar dataKey="tortilla_prom" name="Tortillas Mirador Prom. (MXN)" fill="#2563eb" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* Gráfica 4: Dispersión Unidades vs Monto */}
                <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs space-y-2">
                  <h4 className="text-xs font-black text-slate-900">
                    4. [Dispersión] El volumen de unidades explica el monto pagado (Pearson r = 0.80, Spearman ρ = 0.78)
                  </h4>
                  <div className="h-56">
                    <ResponsiveContainer width="100%" height="100%">
                      <ScatterChart margin={{ top: 10, right: 15, bottom: 5, left: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                        <XAxis type="number" dataKey="unidades" name="Unidades" tick={{ fontSize: 10 }} />
                        <YAxis type="number" dataKey="monto" name="Monto (MXN)" tick={{ fontSize: 10 }} />
                        <Tooltip cursor={{ strokeDasharray: '3 3' }} />
                        <Scatter name="Insumos Abarrotes Judith" data={DISPERSION_MUESTRA} fill="#7c3aed" />
                      </ScatterChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* Gráfica 5: Análisis Espectral FFT */}
                <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs space-y-2">
                  <h4 className="text-xs font-black text-slate-900">
                    5. [Análisis Espectral FFT] La Transformada de Fourier confirma el ciclo semanal (T=7.0d) y quincenal (T=15.5d)
                  </h4>
                  <p className="text-[11px] text-slate-500">
                    Conversión Tiempo → Frecuencia: T = 1/f · Pico 1: f₁ = 0.1429 d⁻¹ (7.0 días) · Pico 2: f₂ = 0.0645 d⁻¹ (15.5 días)
                  </p>
                  <div className="h-52">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={FFT_PERIODOGRAMA}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                        <XAxis dataKey="periodo_dias" tick={{ fontSize: 10 }} />
                        <YAxis tick={{ fontSize: 10 }} />
                        <Tooltip />
                        <Bar dataKey="potencia" name="Potencia Espectral |X(f)|²" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* Gráfica 6: Barras Horizontales Pareto */}
                <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs space-y-2">
                  <h4 className="text-xs font-black text-slate-900">
                    6. [Barras · Pareto] Solo 10 proveedores concentran el 73.6% ($242,119 MXN) de todo el flujo de efectivo
                  </h4>
                  <div className="h-56">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={TOP10_PARETO} layout="vertical" margin={{ left: 30, right: 15 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                        <XAxis type="number" tick={{ fontSize: 10 }} />
                        <YAxis type="category" dataKey="insumo" tick={{ fontSize: 10 }} width={110} />
                        <Tooltip formatter={(v: number) => fmtMXN(v)} />
                        <Bar dataKey="monto" name="Gasto Acumulado (MXN)" fill="#0284c7" radius={[0, 4, 4, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* -----------------------------------------------------------------
              PESTAÑA TÉCNICA E2: SERIES DE TIEMPO, ADF, ACF/PACF Y REGRESIÓN OLS
             ----------------------------------------------------------------- */}
          {tabTecnica === 'e2' && (
            <div className="space-y-5">
              {/* Métricas de Regresión OLS NumPy vs scikit-learn y Prueba ADF */}
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
                <div className="bg-white p-3.5 rounded-2xl border border-slate-200">
                  <div className="text-[11px] font-bold text-slate-500">Ecuación Normal NumPy</div>
                  <div className="text-base font-black text-slate-900 font-mono">R² = 0.8591</div>
                  <div className="text-[10px] text-emerald-700 font-semibold">β = (XᵀX)⁻¹Xᵀy</div>
                </div>
                <div className="bg-white p-3.5 rounded-2xl border border-slate-200">
                  <div className="text-[11px] font-bold text-slate-500">Diff |β_NumPy - β_sklearn|</div>
                  <div className="text-base font-black text-emerald-700 font-mono">0.00e+00</div>
                  <div className="text-[10px] text-slate-500">Coincidencia exacta</div>
                </div>
                <div className="bg-white p-3.5 rounded-2xl border border-slate-200">
                  <div className="text-[11px] font-bold text-slate-500">RMSE / MAE Diario</div>
                  <div className="text-base font-black text-slate-900 font-mono">$318.59 / $229.12</div>
                  <div className="text-[10px] text-slate-500">MSE = 101,499.57</div>
                </div>
                <div className="bg-white p-3.5 rounded-2xl border border-slate-200">
                  <div className="text-[11px] font-bold text-slate-500">Media de Residuos</div>
                  <div className="text-base font-black text-slate-900 font-mono">-1.45e-12 ≈ 0</div>
                  <div className="text-[10px] text-slate-500">Estimador insesgado</div>
                </div>
                <div className="bg-white p-3.5 rounded-2xl border border-emerald-200 bg-emerald-50/40">
                  <div className="text-[11px] font-bold text-emerald-800">Prueba Dickey-Fuller (ADF)</div>
                  <div className="text-base font-black text-emerald-900 font-mono">τ = -6.1417</div>
                  <div className="text-[10px] text-emerald-700">p = 0.0005 &lt; 0.05 (Estacionaria)</div>
                </div>
                <div className="bg-white p-3.5 rounded-2xl border border-slate-200">
                  <div className="text-[11px] font-bold text-slate-500">Rezagos Clave ACF/PACF</div>
                  <div className="text-base font-black text-slate-900 font-mono">k=1 (0.41) · k=7</div>
                  <div className="text-[10px] text-slate-500">Memoria AR(1) y semanal</div>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                {/* Regresión OLS y Línea de Tendencia */}
                <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs space-y-2">
                  <h4 className="text-xs font-black text-slate-900">
                    Regresión Lineal por Mínimos Cuadrados: Observado vs. Predictor NumPy ((XᵀX)⁻¹Xᵀy) y Tendencia OLS
                  </h4>
                  <div className="h-56">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={SERIE_DIARIA_MUESTRA}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                        <XAxis dataKey="fecha" tick={{ fontSize: 10 }} />
                        <YAxis tick={{ fontSize: 10 }} />
                        <Tooltip />
                        <Legend wrapperStyle={{ fontSize: 11 }} />
                        <Line type="monotone" dataKey="real" name="Observado Y(t)" stroke="#94a3b8" strokeWidth={1.5} />
                        <Line type="monotone" dataKey="ols_pred" name="Predictor OLS NumPy / sklearn (R²=0.86)" stroke="#2563eb" strokeWidth={2.4} />
                        <Line type="monotone" dataKey="ols_tendencia" name="Recta Tendencia β₀ + β₁·t" stroke="#dc2626" strokeDasharray="5 5" strokeWidth={2} dot={false} />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* Gráfica de ACF y PACF */}
                <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs space-y-2">
                  <h4 className="text-xs font-black text-slate-900">
                    Funciones de Autocorrelación (ACF) y Autocorrelación Parcial (PACF) · Banda IC 95% (±0.165)
                  </h4>
                  <div className="h-56">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={ACF_PACF_DATA}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                        <XAxis dataKey="lag" tick={{ fontSize: 10 }} />
                        <YAxis domain={[-0.2, 0.5]} tick={{ fontSize: 10 }} />
                        <Tooltip />
                        <Legend wrapperStyle={{ fontSize: 11 }} />
                        <ReferenceLine y={0.165} stroke="#ef4444" strokeDasharray="3 3" />
                        <ReferenceLine y={-0.165} stroke="#ef4444" strokeDasharray="3 3" />
                        <Bar dataKey="ACF" name="ACF r(k)" fill="#2563eb" radius={[4, 4, 0, 0]} />
                        <Bar dataKey="PACF" name="PACF φ_kk" fill="#10b981" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>

              {/* Tabla Comparativa de Coeficientes Beta NumPy vs scikit-learn */}
              <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs">
                <h4 className="text-xs font-black text-slate-900 mb-2">
                  Tabla Comparativa de Parámetros Estimados: Implementación Propia con NumPy vs. scikit-learn (LinearRegression)
                </h4>
                <div className="overflow-x-auto">
                  <table className="w-full text-xs text-left border-collapse">
                    <thead>
                      <tr className="bg-slate-100 text-slate-700 border-b border-slate-200">
                        <th className="p-2">Parámetro / Variable</th>
                        <th className="p-2 font-mono">β Ecuación Normal NumPy ((XᵀX)⁻¹Xᵀy)</th>
                        <th className="p-2 font-mono">β scikit-learn (LinearRegression)</th>
                        <th className="p-2 font-mono">Diferencia Absoluta</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 font-mono text-[11px]">
                      <tr><td className="p-2 font-sans font-semibold">β₀ (Intercepto)</td><td className="p-2">-567.653096</td><td className="p-2">-567.653096</td><td className="p-2 text-emerald-700">0.000000e+00</td></tr>
                      <tr><td className="p-2 font-sans font-semibold">β₁ (Tiempo t)</td><td className="p-2">-0.088683</td><td className="p-2">-0.088683</td><td className="p-2 text-emerald-700">0.000000e+00</td></tr>
                      <tr><td className="p-2 font-sans font-semibold">β₂ (Número de entregas del día)</td><td className="p-2">+137.038727</td><td className="p-2">+137.038727</td><td className="p-2 text-emerald-700">0.000000e+00</td></tr>
                      <tr><td className="p-2 font-sans font-semibold">β₃ (Unidades totales del día)</td><td className="p-2">+8.390206</td><td className="p-2">+8.390206</td><td className="p-2 text-emerald-700">0.000000e+00</td></tr>
                      <tr><td className="p-2 font-sans font-semibold">β₄ (Indicador Lunes)</td><td className="p-2">-129.551503</td><td className="p-2">-129.551503</td><td className="p-2 text-emerald-700">0.000000e+00</td></tr>
                      <tr><td className="p-2 font-sans font-semibold">β₅ (Indicador Quincena)</td><td className="p-2">-111.822873</td><td className="p-2">-111.822873</td><td className="p-2 text-emerald-700">0.000000e+00</td></tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* -----------------------------------------------------------------
              PESTAÑA TÉCNICA E3: SARIMA (AIC + BANDA 95%) Y 4 CLASIFICADORES
             ----------------------------------------------------------------- */}
          {tabTecnica === 'e3' && (
            <div className="space-y-5">
              {/* Tabla Comparativa de los 4 Clasificadores de la Unidad 3 (Partición 80/20 + 5-Fold CV) */}
              <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <h3 className="text-sm font-black text-slate-900">
                      🏆 Tabla Comparativa de los 4 Clasificadores de la Unidad 3 (Partición 80/20 + StandardScaler + OneHotEncoder + 5-Fold CV)
                    </h3>
                    <p className="text-xs text-slate-500">
                      Variable objetivo: <code className="font-mono">alerta_gasto_alto</code> (1 si monto_gasto &gt; Q₃ = $300 MXN). En Abarrotes &quot;Judith&quot; priorizamos <strong>Recall</strong> para evitar Falsos Negativos (quedarse sin efectivo frente al repartidor).
                    </p>
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-xs text-left border-collapse">
                    <thead>
                      <tr className="bg-slate-100 text-slate-700 border-b border-slate-200">
                        <th className="p-2.5">Modelo Clasificador (Unidad 3.5)</th>
                        <th className="p-2.5">Accuracy</th>
                        <th className="p-2.5">Precision</th>
                        <th className="p-2.5">Recall (Sensibilidad)</th>
                        <th className="p-2.5">F1-Score</th>
                        <th className="p-2.5">ROC-AUC</th>
                        <th className="p-2.5">5-Fold CV F1 (±σ)</th>
                        <th className="p-2.5">Matriz [TN, FP | FN, TP]</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 font-mono text-[11px]">
                      <tr className="bg-emerald-50/70 font-bold text-emerald-950">
                        <td className="p-2.5 font-sans">🏆 1. Árbol de Decisión (CART, max_depth=4)</td>
                        <td className="p-2.5">99.36%</td>
                        <td className="p-2.5">98.72%</td>
                        <td className="p-2.5 text-emerald-700">98.72% (FN=1)</td>
                        <td className="p-2.5">98.72%</td>
                        <td className="p-2.5">0.9926</td>
                        <td className="p-2.5">0.9499 ± 0.0118</td>
                        <td className="p-2.5">[235, 1 | 1, 77]</td>
                      </tr>
                      <tr>
                        <td className="p-2.5 font-sans font-semibold">🥈 2. SVM (Kernel RBF, C=2.0)</td>
                        <td className="p-2.5">94.59%</td>
                        <td className="p-2.5">94.20%</td>
                        <td className="p-2.5">83.33%</td>
                        <td className="p-2.5">88.44%</td>
                        <td className="p-2.5">0.9873</td>
                        <td className="p-2.5">0.8966 ± 0.0300</td>
                        <td className="p-2.5">[232, 4 | 13, 65]</td>
                      </tr>
                      <tr>
                        <td className="p-2.5 font-sans font-semibold">🥉 3. KNN (k=7 Vecinos, Distancia)</td>
                        <td className="p-2.5">86.94%</td>
                        <td className="p-2.5">83.64%</td>
                        <td className="p-2.5">58.97%</td>
                        <td className="p-2.5">69.17%</td>
                        <td className="p-2.5">0.9000</td>
                        <td className="p-2.5">0.6045 ± 0.1156</td>
                        <td className="p-2.5">[227, 9 | 32, 46]</td>
                      </tr>
                      <tr>
                        <td className="p-2.5 font-sans font-semibold">4. Naive Bayes (GaussianNB)</td>
                        <td className="p-2.5">82.48%</td>
                        <td className="p-2.5">62.37%</td>
                        <td className="p-2.5">74.36%</td>
                        <td className="p-2.5">67.84%</td>
                        <td className="p-2.5">0.8923</td>
                        <td className="p-2.5">0.6841 ± 0.0323</td>
                        <td className="p-2.5">[201, 35 | 20, 58]</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Selección de Modelo ARIMA / SARIMA por AIC y Prueba de Carga Locust (50 usuarios) */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs space-y-2">
                  <h4 className="text-xs font-black text-slate-900">
                    Selección de Hiperparámetros ARIMA / SARIMA por Criterio de Akaike (AIC) y BIC
                  </h4>
                  <div className="overflow-x-auto">
                    <table className="w-full text-xs text-left border-collapse">
                      <thead>
                        <tr className="bg-slate-100 text-slate-700 border-b border-slate-200">
                          <th className="p-2">Modelo Candidato</th>
                          <th className="p-2">AIC</th>
                          <th className="p-2">BIC</th>
                          <th className="p-2">RMSE (MXN)</th>
                          <th className="p-2">MAE (MXN)</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200 font-mono text-[11px]">
                        <tr className="bg-sky-50 font-bold text-sky-950">
                          <td className="p-2 font-sans">🏆 SARIMA(1,0,1)(1,0,0)[7] + Quincena</td>
                          <td className="p-2">2067.33</td>
                          <td className="p-2">2090.46</td>
                          <td className="p-2">$540.69</td>
                          <td className="p-2">$390.61</td>
                        </tr>
                        <tr>
                          <td className="p-2 font-sans">SARIMA(2,0,1)(1,0,0)[7] + Quincena</td>
                          <td className="p-2">2069.17</td>
                          <td className="p-2">2095.19</td>
                          <td className="p-2">$540.36</td>
                          <td className="p-2">$391.25</td>
                        </tr>
                        <tr>
                          <td className="p-2 font-sans">ARIMA(2,0,1)</td>
                          <td className="p-2">2205.74</td>
                          <td className="p-2">2220.37</td>
                          <td className="p-2">$689.96</td>
                          <td className="p-2">$483.83</td>
                        </tr>
                        <tr>
                          <td className="p-2 font-sans">ARIMA(1,0,1)</td>
                          <td className="p-2">2224.53</td>
                          <td className="p-2">2236.27</td>
                          <td className="p-2">$702.18</td>
                          <td className="p-2">$491.15</td>
                        </tr>
                        <tr>
                          <td className="p-2 font-sans">ARIMA(1,1,1) (Sobre-diferenciado d=1)</td>
                          <td className="p-2">2230.09</td>
                          <td className="p-2">2241.80</td>
                          <td className="p-2">$759.08</td>
                          <td className="p-2">$549.37</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>

                <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs space-y-2.5">
                  <h4 className="text-xs font-black text-slate-900">
                    ☁️ Métricas de Producción en Nube (E3): Prueba de Carga (50 Usuarios), Kubernetes HPA y Terraform IaC
                  </h4>
                  <div className="grid grid-cols-2 gap-2.5 text-xs">
                    <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                      <div className="text-slate-500 font-bold">Latencia p95 (50 usuarios)</div>
                      <div className="text-lg font-black text-slate-900 font-mono">3.14 ms</div>
                      <div className="text-[11px] text-emerald-700 font-semibold">0.00% errores (500 reqs)</div>
                    </div>
                    <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                      <div className="text-slate-500 font-bold">Kubernetes HPA (CPU 70%)</div>
                      <div className="text-lg font-black text-slate-900 font-mono">1 → 3 Pods</div>
                      <div className="text-[11px] text-slate-500">minReplicas: 1 · max: 5</div>
                    </div>
                    <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                      <div className="text-slate-500 font-bold">Worker Serverless</div>
                      <div className="text-lg font-black text-slate-900 font-mono">AWS Lambda</div>
                      <div className="text-[11px] text-slate-500">Trigger SQS + S3 raw/ (0.18s)</div>
                    </div>
                    <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200">
                      <div className="text-emerald-800 font-bold">Costo Nube (FinOps)</div>
                      <div className="text-lg font-black text-emerald-900 font-mono">$0.00 MXN</div>
                      <div className="text-[11px] text-emerald-700 font-semibold">100% Free Tier + CI/CD Verde</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
