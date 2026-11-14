-- =============================================================================
-- Esquema Relacional PostgreSQL para AbarrotesIQ (Entregable E2)
-- Base de datos: abarrotesiq_db (Amazon RDS for PostgreSQL / Contenedor PG)
-- =============================================================================

CREATE TABLE IF NOT EXISTS gastos_proveedores_clean (
    id SERIAL PRIMARY KEY,
    fecha DATE NOT NULL,
    tipo_gasto VARCHAR(80) NOT NULL,
    categoria VARCHAR(60) NOT NULL,
    libreta_origen VARCHAR(20) NOT NULL DEFAULT 'Libreta_1',
    turno VARCHAR(20) NOT NULL DEFAULT 'Matutino',
    unidades INTEGER NOT NULL CHECK (unidades > 0),
    precio_unitario NUMERIC(10, 2) NOT NULL CHECK (precio_unitario > 0),
    monto_gasto NUMERIC(10, 2) NOT NULL CHECK (monto_gasto > 0),
    dia_semana_num SMALLINT NOT NULL CHECK (dia_semana_num BETWEEN 0 AND 6),
    dia_semana VARCHAR(20) NOT NULL,
    dia_mes SMALLINT NOT NULL CHECK (dia_mes BETWEEN 1 AND 31),
    mes SMALLINT NOT NULL CHECK (mes BETWEEN 1 AND 12),
    es_quincena BOOLEAN NOT NULL DEFAULT FALSE,
    semana_anio SMALLINT NOT NULL,
    frecuencia_proveedor INTEGER NOT NULL DEFAULT 1,
    alerta_gasto_alto SMALLINT NOT NULL DEFAULT 0 CHECK (alerta_gasto_alto IN (0, 1)),
    creado_en TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Tabla de auditoría de lotes procesados por el Worker desde la cola SQS
CREATE TABLE IF NOT EXISTS auditoria_ingesta (
    lote_id VARCHAR(64) PRIMARY KEY,
    archivo_origen VARCHAR(255) NOT NULL,
    registros_iniciales INTEGER NOT NULL,
    registros_limpios INTEGER NOT NULL,
    total_correcciones INTEGER NOT NULL,
    estado VARCHAR(20) NOT NULL DEFAULT 'COMPLETADO',
    procesado_en TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Índices B-Tree para acelerar consultas por rango de fechas, proveedor y categoría en el Tablero
CREATE INDEX IF NOT EXISTS idx_gastos_fecha ON gastos_proveedores_clean (fecha);
CREATE INDEX IF NOT EXISTS idx_gastos_tipo_gasto ON gastos_proveedores_clean (tipo_gasto);
CREATE INDEX IF NOT EXISTS idx_gastos_categoria ON gastos_proveedores_clean (categoria);
CREATE INDEX IF NOT EXISTS idx_gastos_quincena ON gastos_proveedores_clean (es_quincena, dia_semana_num);
