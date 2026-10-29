import { Product, Sale, Customer, CashShift } from '../types';

export interface DriveSpreadsheetFile {
  id: string;
  name: string;
  modifiedTime?: string;
  webViewLink?: string;
}

/**
 * List spreadsheets from user's Google Drive
 */
export async function listUserSpreadsheets(accessToken: string): Promise<DriveSpreadsheetFile[]> {
  const query = encodeURIComponent("mimeType='application/vnd.google-apps.spreadsheet' and trashed=false");
  const url = `https://www.googleapis.com/drive/v3/files?q=${query}&fields=files(id,name,modifiedTime,webViewLink)&orderBy=modifiedTime desc&pageSize=20`;

  const response = await fetch(url, {
    headers: {
      Authorization: `Bearer ${accessToken}`
    }
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err?.error?.message || 'Error al listar hojas de cálculo en Google Drive');
  }

  const data = await response.json();
  return data.files || [];
}

/**
 * Creates a dedicated Google Spreadsheet for the grocery store with pre-formatted sheets
 */
export async function createPOSSpreadsheet(
  accessToken: string,
  storeName: string
): Promise<{ id: string; url: string }> {
  const dateStr = new Date().toLocaleDateString('es-MX');
  const title = `[Abarrotes] ${storeName} - ${dateStr}`;

  const payload = {
    properties: {
      title
    },
    sheets: [
      {
        properties: {
          title: 'Inventario',
          gridProperties: { rowCount: 500, columnCount: 10 }
        }
      },
      {
        properties: {
          title: 'Ventas',
          gridProperties: { rowCount: 1000, columnCount: 10 }
        }
      },
      {
        properties: {
          title: 'Fiados',
          gridProperties: { rowCount: 200, columnCount: 8 }
        }
      },
      {
        properties: {
          title: 'Cortes_Caja',
          gridProperties: { rowCount: 200, columnCount: 8 }
        }
      }
    ]
  };

  const response = await fetch('https://sheets.googleapis.com/v4/spreadsheets', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(payload)
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err?.error?.message || 'Error al crear la hoja de cálculo en Google Sheets');
  }

  const data = await response.json();
  const spreadsheetId = data.spreadsheetId;
  const webViewLink = `https://docs.google.com/spreadsheets/d/${spreadsheetId}/edit`;

  return {
    id: spreadsheetId,
    url: webViewLink
  };
}

/**
 * Helper to ensure a sheet tab exists in the spreadsheet
 */
async function ensureSheetTab(accessToken: string, spreadsheetId: string, sheetTitle: string) {
  const getUrl = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}?fields=sheets.properties.title`;
  const res = await fetch(getUrl, {
    headers: { Authorization: `Bearer ${accessToken}` }
  });

  if (res.ok) {
    const data = await res.json();
    const existingTitles = (data.sheets || []).map((s: any) => s.properties?.title);
    if (!existingTitles.includes(sheetTitle)) {
      // Add sheet
      await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}:batchUpdate`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          requests: [
            {
              addSheet: {
                properties: {
                  title: sheetTitle
                }
              }
            }
          ]
        })
      });
    }
  }
}

/**
 * Export Inventory to Google Sheets
 */
export async function exportInventoryToSheet(
  accessToken: string,
  spreadsheetId: string,
  products: Product[]
): Promise<void> {
  await ensureSheetTab(accessToken, spreadsheetId, 'Inventario');

  const headers = [
    'Código de Barras',
    'Nombre del Producto',
    'Categoría',
    'Precio Costo ($)',
    'Precio Venta ($)',
    'Stock Actual',
    'Unidad',
    'Margen Utilidad %',
    'Alerta Stock Bajo'
  ];

  const rows = products.map((p) => {
    const margin =
      p.costPrice > 0 ? (((p.salePrice - p.costPrice) / p.costPrice) * 100).toFixed(1) + '%' : '0%';
    const lowStockAlert = p.stock <= p.minStock ? '¡STOCK BAJO!' : 'OK';

    return [
      p.code,
      p.name,
      p.category,
      p.costPrice,
      p.salePrice,
      p.stock,
      p.unit,
      margin,
      lowStockAlert
    ];
  });

  const values = [headers, ...rows];

  // Clear previous values first to avoid dangling lines
  await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/Inventario!A1:I:clear`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      }
    }
  );

  const url = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/Inventario!A1?valueInputOption=USER_ENTERED`;
  const response = await fetch(url, {
    method: 'PUT',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ values })
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err?.error?.message || 'Error al exportar inventario a Google Sheets');
  }
}

/**
 * Export Sales History to Google Sheets
 */
export async function exportSalesToSheet(
  accessToken: string,
  spreadsheetId: string,
  sales: Sale[]
): Promise<void> {
  await ensureSheetTab(accessToken, spreadsheetId, 'Ventas');

  const headers = [
    'Folio #',
    'Fecha y Hora',
    'Método de Pago',
    'Cliente / Cuenta',
    'Total ($)',
    'Ganancia Estimada ($)',
    'Artículos Comprados'
  ];

  const rows = sales.map((s) => {
    const cost = s.items.reduce((acc, i) => acc + i.product.costPrice * i.quantity, 0);
    const profit = s.total - cost;
    const itemsSummary = s.items
      .map((i) => `${i.quantity} ${i.product.unit === 'kg' ? 'kg' : 'pza'} de ${i.product.name}`)
      .join('; ');

    return [
      s.folio,
      s.date,
      s.paymentMethod.toUpperCase(),
      s.customerName || 'Público General',
      s.total,
      profit.toFixed(2),
      itemsSummary
    ];
  });

  const values = [headers, ...rows];

  await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/Ventas!A1:G:clear`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      }
    }
  );

  const url = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/Ventas!A1?valueInputOption=USER_ENTERED`;
  const response = await fetch(url, {
    method: 'PUT',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ values })
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err?.error?.message || 'Error al exportar ventas a Google Sheets');
  }
}

/**
 * Append new sales rows to 'Ventas' sheet in Google Sheets without clearing existing rows
 */
export async function appendSalesToSheet(
  accessToken: string,
  spreadsheetId: string,
  salesToAppend: Sale[]
): Promise<void> {
  if (salesToAppend.length === 0) return;
  await ensureSheetTab(accessToken, spreadsheetId, 'Ventas');

  const rows = salesToAppend.map((s) => {
    const cost = s.items.reduce((acc, i) => acc + i.product.costPrice * i.quantity, 0);
    const profit = s.total - cost;
    const itemsSummary = s.items
      .map((i) => `${i.quantity} ${i.product.unit === 'kg' ? 'kg' : 'pza'} de ${i.product.name}`)
      .join('; ');

    return [
      s.folio,
      s.date,
      s.paymentMethod.toUpperCase(),
      s.customerName || 'Público General',
      s.total,
      profit.toFixed(2),
      itemsSummary
    ];
  });

  const url = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/Ventas!A1:append?valueInputOption=USER_ENTERED&insertDataOption=INSERT_ROWS`;
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ values: rows })
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err?.error?.message || 'Error al anexar ventas a Google Sheets');
  }
}

/**
 * Export Fiados (Customer Credit) to Google Sheets
 */
export async function exportCustomersToSheet(
  accessToken: string,
  spreadsheetId: string,
  customers: Customer[]
): Promise<void> {
  await ensureSheetTab(accessToken, spreadsheetId, 'Fiados');

  const headers = [
    'Nombre del Cliente',
    'Teléfono',
    'Saldo Deudor ($)',
    'Límite de Crédito ($)',
    'Dirección',
    'Notas / Referencias',
    'Estado'
  ];

  const rows = customers.map((c) => [
    c.name,
    c.phone,
    c.balance,
    c.creditLimit,
    c.address,
    c.notes,
    c.balance > 0 ? 'CON ADEUDO' : 'AL CORRIENTE'
  ]);

  const values = [headers, ...rows];

  await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/Fiados!A1:G:clear`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      }
    }
  );

  const url = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/Fiados!A1?valueInputOption=USER_ENTERED`;
  const response = await fetch(url, {
    method: 'PUT',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ values })
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err?.error?.message || 'Error al exportar fiados a Google Sheets');
  }
}

/**
 * Export Cash Register Shifts to Google Sheets
 */
export async function exportShiftToSheet(
  accessToken: string,
  spreadsheetId: string,
  shift: CashShift
): Promise<void> {
  await ensureSheetTab(accessToken, spreadsheetId, 'Cortes_Caja');

  const headers = [
    'Fecha de Apertura',
    'Estado del Turno',
    'Fondo Inicial ($)',
    'Dinero Contado ($)',
    'Diferencia ($)',
    'Movimientos / Gastos Registrados'
  ];

  const movementsSummary = shift.movements
    .map((m) => `[${m.time}] ${m.type === 'entrada' ? '+' : '-'}$${m.amount} (${m.reason})`)
    .join('; ');

  const counted = shift.countedCash ?? shift.initialCash;
  const diff = shift.countedCash !== undefined ? shift.countedCash - shift.initialCash : 0;

  const values = [
    headers,
    [
      shift.openedAt,
      shift.status.toUpperCase(),
      shift.initialCash,
      counted,
      diff,
      movementsSummary || 'Sin movimientos'
    ]
  ];

  const url = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/Cortes_Caja!A1?valueInputOption=USER_ENTERED`;
  const response = await fetch(url, {
    method: 'PUT',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ values })
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err?.error?.message || 'Error al exportar corte a Google Sheets');
  }
}

/**
 * Import Inventory from Google Sheets
 */
export async function importInventoryFromSheet(
  accessToken: string,
  spreadsheetId: string
): Promise<Partial<Product>[]> {
  const url = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/Inventario!A2:G`;
  const response = await fetch(url, {
    headers: {
      Authorization: `Bearer ${accessToken}`
    }
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err?.error?.message || 'Error al leer la hoja Inventario en Google Sheets');
  }

  const data = await response.json();
  const rows: string[][] = data.values || [];

  const parsedProducts: Partial<Product>[] = [];

  rows.forEach((row, idx) => {
    if (!row || row.length < 2) return;
    const barcode = (row[0] || '').trim();
    const name = (row[1] || '').trim();
    if (!name) return;

    const rawCat = (row[2] || 'despensa').toLowerCase().trim();
    const validCategories = [
      'lacteos',
      'bebidas',
      'botanas',
      'despensa',
      'frutas_verduras',
      'panaderia',
      'limpieza',
      'varios'
    ];
    const category = validCategories.includes(rawCat) ? (rawCat as any) : 'despensa';

    const costPrice = parseFloat(row[3]) || 0;
    const salePrice = parseFloat(row[4]) || 0;
    const stock = parseFloat(row[5]) || 0;
    const unit = (row[6] || 'pza').toLowerCase().includes('kg') ? 'kg' : 'pza';

    parsedProducts.push({
      code: barcode || `GEN-${Date.now()}-${idx}`,
      name,
      category,
      costPrice,
      salePrice,
      stock,
      unit: unit as 'pza' | 'kg'
    });
  });

  return parsedProducts;
}
