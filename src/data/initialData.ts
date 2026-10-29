import { CategoryInfo, Customer, Product, Sale, StoreSettings, CashShift, User } from '../types';

export const CATEGORIES: CategoryInfo[] = [
  { id: 'lacteos', name: 'Lácteos y Huevos', icon: 'Egg', badgeClass: 'bg-amber-100 text-amber-800 border-amber-300' },
  { id: 'bebidas', name: 'Bebidas y Refrescos', icon: 'CupSoda', badgeClass: 'bg-blue-100 text-blue-800 border-blue-300' },
  { id: 'botanas', name: 'Botanas y Dulces', icon: 'Candy', badgeClass: 'bg-rose-100 text-rose-800 border-rose-300' },
  { id: 'despensa', name: 'Despensa y Abarrotes', icon: 'Package', badgeClass: 'bg-emerald-100 text-emerald-800 border-emerald-300' },
  { id: 'frutas_verduras', name: 'Frutas y Verduras (Granel)', icon: 'Apple', badgeClass: 'bg-green-100 text-green-800 border-green-300' },
  { id: 'panaderia', name: 'Panadería y Tortillería', icon: 'Wheat', badgeClass: 'bg-yellow-100 text-yellow-800 border-yellow-300' },
  { id: 'limpieza', name: 'Limpieza y Hogar', icon: 'Sparkles', badgeClass: 'bg-cyan-100 text-cyan-800 border-cyan-300' },
  { id: 'varios', name: 'Varios y Mostrador', icon: 'Store', badgeClass: 'bg-purple-100 text-purple-800 border-purple-300' }
];

export const INITIAL_PRODUCTS: Product[] = [
  {
    id: 'prod-01',
    code: '750100010001',
    name: 'Coca-Cola 600ml No Retornable',
    category: 'bebidas',
    costPrice: 15.50,
    salePrice: 19.00,
    stock: 48,
    minStock: 12,
    unit: 'pza',
    emoji: '🥤',
    isQuickAccess: true
  },
  {
    id: 'prod-02',
    code: 'HUEVO-KG',
    name: 'Huevo Blanco San Juan (Granel)',
    category: 'lacteos',
    costPrice: 38.00,
    salePrice: 48.00,
    stock: 25.5,
    minStock: 5.0,
    unit: 'kg',
    isBulk: true,
    emoji: '🥚',
    isQuickAccess: true
  },
  {
    id: 'prod-03',
    code: 'BOLILLO',
    name: 'Bolillo / Telera Calientito',
    category: 'panaderia',
    costPrice: 2.20,
    salePrice: 3.50,
    stock: 80,
    minStock: 20,
    unit: 'pza',
    emoji: '🥖',
    isQuickAccess: true
  },
  {
    id: 'prod-04',
    code: 'TORTILLA-KG',
    name: 'Tortilla de Maíz Nixtamal (kg)',
    category: 'panaderia',
    costPrice: 18.00,
    salePrice: 24.00,
    stock: 35.0,
    minStock: 8.0,
    unit: 'kg',
    isBulk: true,
    emoji: '🫓',
    isQuickAccess: true
  },
  {
    id: 'prod-05',
    code: '750102051211',
    name: 'Leche Lala Entera 1 Litro',
    category: 'lacteos',
    costPrice: 24.00,
    salePrice: 29.50,
    stock: 24,
    minStock: 6,
    unit: 'pza',
    emoji: '🥛',
    isQuickAccess: true
  },
  {
    id: 'prod-06',
    code: '750101112345',
    name: 'Sabritas Sal Original 45g',
    category: 'botanas',
    costPrice: 15.00,
    salePrice: 19.00,
    stock: 18,
    minStock: 5,
    unit: 'pza',
    emoji: '🥔',
    isQuickAccess: true
  },
  {
    id: 'prod-07',
    code: '750101118899',
    name: 'Doritos Nacho 58g',
    category: 'botanas',
    costPrice: 15.00,
    salePrice: 19.00,
    stock: 3,
    minStock: 6,
    unit: 'pza',
    emoji: '🧀',
    isQuickAccess: true
  },
  {
    id: 'prod-08',
    code: 'JITO-KG',
    name: 'Jitomate Saladette Maduro (Granel)',
    category: 'frutas_verduras',
    costPrice: 22.00,
    salePrice: 32.00,
    stock: 18.2,
    minStock: 4.0,
    unit: 'kg',
    isBulk: true,
    emoji: '🍅',
    isQuickAccess: true
  },
  {
    id: 'prod-09',
    code: 'CEBO-KG',
    name: 'Cebolla Blanca Limpia (Granel)',
    category: 'frutas_verduras',
    costPrice: 20.00,
    salePrice: 28.00,
    stock: 14.5,
    minStock: 3.0,
    unit: 'kg',
    isBulk: true,
    emoji: '🧅'
  },
  {
    id: 'prod-10',
    code: 'AGUACATE-KG',
    name: 'Aguacate Hass de Michoacán (Granel)',
    category: 'frutas_verduras',
    costPrice: 55.00,
    salePrice: 75.00,
    stock: 9.8,
    minStock: 2.5,
    unit: 'kg',
    isBulk: true,
    emoji: '🥑'
  },
  {
    id: 'prod-11',
    code: 'PLATANO-KG',
    name: 'Plátano Tabasco Dulce (Granel)',
    category: 'frutas_verduras',
    costPrice: 16.00,
    salePrice: 24.00,
    stock: 12.0,
    minStock: 3.0,
    unit: 'kg',
    isBulk: true,
    emoji: '🍌'
  },
  {
    id: 'prod-12',
    code: 'LIMON-KG',
    name: 'Limón con Semilla / Colima (Granel)',
    category: 'frutas_verduras',
    costPrice: 25.00,
    salePrice: 36.00,
    stock: 11.4,
    minStock: 3.0,
    unit: 'kg',
    isBulk: true,
    emoji: '🍋'
  },
  {
    id: 'prod-13',
    code: '750100012500',
    name: 'Coca-Cola 2.5L Retornable',
    category: 'bebidas',
    costPrice: 28.00,
    salePrice: 34.00,
    stock: 15,
    minStock: 4,
    unit: 'pza',
    emoji: '🍾'
  },
  {
    id: 'prod-14',
    code: '750105530101',
    name: 'Agua Purificada Ciel 1 Litro',
    category: 'bebidas',
    costPrice: 8.50,
    salePrice: 12.00,
    stock: 28,
    minStock: 8,
    unit: 'pza',
    emoji: '💧'
  },
  {
    id: 'prod-15',
    code: '750100800321',
    name: 'Frijoles Negros Refritos La Sierra 430g',
    category: 'despensa',
    costPrice: 14.50,
    salePrice: 18.50,
    stock: 22,
    minStock: 5,
    unit: 'pza',
    emoji: '🥫'
  },
  {
    id: 'prod-16',
    code: '750103290001',
    name: 'Atún Dolores en Agua 140g',
    category: 'despensa',
    costPrice: 17.00,
    salePrice: 22.00,
    stock: 30,
    minStock: 8,
    unit: 'pza',
    emoji: '🐟'
  },
  {
    id: 'prod-17',
    code: '750102540023',
    name: 'Aceite Comestible Nutrioli 850ml',
    category: 'despensa',
    costPrice: 38.00,
    salePrice: 46.00,
    stock: 14,
    minStock: 4,
    unit: 'pza',
    emoji: '🌻'
  },
  {
    id: 'prod-18',
    code: '750101830012',
    name: 'Arroz Verde Valle Super Extra 1kg',
    category: 'despensa',
    costPrice: 26.00,
    salePrice: 32.50,
    stock: 16,
    minStock: 4,
    unit: 'pza',
    emoji: '🍚'
  },
  {
    id: 'prod-19',
    code: '750100510101',
    name: 'Harina de Maíz Nixtamalizado Maseca 1kg',
    category: 'despensa',
    costPrice: 18.00,
    salePrice: 22.50,
    stock: 20,
    minStock: 5,
    unit: 'pza',
    emoji: '🌽'
  },
  {
    id: 'prod-20',
    code: '750100061200',
    name: 'Mayonesa McCormick con Jugo de Limón 390g',
    category: 'despensa',
    costPrice: 34.00,
    salePrice: 42.00,
    stock: 12,
    minStock: 3,
    unit: 'pza',
    emoji: '🥪'
  },
  {
    id: 'prod-21',
    code: '750105861111',
    name: 'Café Soluble Nescafé Clásico 120g',
    category: 'despensa',
    costPrice: 62.00,
    salePrice: 76.00,
    stock: 8,
    minStock: 3,
    unit: 'pza',
    emoji: '☕'
  },
  {
    id: 'prod-22',
    code: 'AZUCAR-KG',
    name: 'Azúcar Estándar Caña (Granel)',
    category: 'despensa',
    costPrice: 24.00,
    salePrice: 30.00,
    stock: 30.0,
    minStock: 6.0,
    unit: 'kg',
    isBulk: true,
    emoji: '🍬'
  },
  {
    id: 'prod-23',
    code: '750100010999',
    name: 'Sopa Pasta La Moderna Munición 200g',
    category: 'despensa',
    costPrice: 7.50,
    salePrice: 10.50,
    stock: 35,
    minStock: 8,
    unit: 'pza',
    emoji: '🥣'
  },
  {
    id: 'prod-24',
    code: '750100088812',
    name: 'Galletas Marías Gamesa Rollo 170g',
    category: 'botanas',
    costPrice: 14.00,
    salePrice: 18.00,
    stock: 25,
    minStock: 6,
    unit: 'pza',
    emoji: '🍪'
  },
  {
    id: 'prod-25',
    code: '750100088820',
    name: 'Galletas Chokis Gamesa 76g',
    category: 'botanas',
    costPrice: 16.50,
    salePrice: 21.00,
    stock: 19,
    minStock: 4,
    unit: 'pza',
    emoji: '🍫'
  },
  {
    id: 'prod-26',
    code: '750101900111',
    name: 'Mazapán de la Rosa Original 28g',
    category: 'botanas',
    costPrice: 5.50,
    salePrice: 8.00,
    stock: 45,
    minStock: 10,
    unit: 'pza',
    emoji: '🥜',
    isQuickAccess: true
  },
  {
    id: 'prod-27',
    code: '750101700200',
    name: 'Sopa Instantánea Maruchan Pollo 64g',
    category: 'despensa',
    costPrice: 13.50,
    salePrice: 17.50,
    stock: 24,
    minStock: 6,
    unit: 'pza',
    emoji: '🍜',
    isQuickAccess: true
  },
  {
    id: 'prod-28',
    code: 'PAN-DULCE',
    name: 'Pan Dulce Tradicional (Concha / Cuerno)',
    category: 'panaderia',
    costPrice: 8.00,
    salePrice: 12.00,
    stock: 30,
    minStock: 5,
    unit: 'pza',
    emoji: '🥐',
    isQuickAccess: true
  },
  {
    id: 'prod-29',
    code: '750102580100',
    name: 'Blanqueador Cloralex El Rendidor 950ml',
    category: 'limpieza',
    costPrice: 16.00,
    salePrice: 21.00,
    stock: 2,
    minStock: 4,
    unit: 'pza',
    emoji: '🧴'
  },
  {
    id: 'prod-30',
    code: '750102580200',
    name: 'Limpiador Multiusos Fabuloso Lavanda 1L',
    category: 'limpieza',
    costPrice: 19.50,
    salePrice: 25.00,
    stock: 12,
    minStock: 4,
    unit: 'pza',
    emoji: '💜'
  },
  {
    id: 'prod-31',
    code: '750102580300',
    name: 'Detergente Polvo Roma 1 Kilogramo',
    category: 'limpieza',
    costPrice: 32.00,
    salePrice: 40.00,
    stock: 15,
    minStock: 4,
    unit: 'pza',
    emoji: '🧼'
  },
  {
    id: 'prod-32',
    code: '750102580400',
    name: 'Jabón de Lavandería Zote Rosa 400g',
    category: 'limpieza',
    costPrice: 19.00,
    salePrice: 24.50,
    stock: 20,
    minStock: 5,
    unit: 'pza',
    emoji: '🧼'
  },
  {
    id: 'prod-33',
    code: '750102580500',
    name: 'Papel Higiénico Pétalo Rendimax 4 Rollos',
    category: 'limpieza',
    costPrice: 27.00,
    salePrice: 34.00,
    stock: 18,
    minStock: 5,
    unit: 'paq',
    emoji: '🧻'
  },
  {
    id: 'prod-34',
    code: 'JAMON-KG',
    name: 'Jamón de Pavo Fud Clásico (Granel)',
    category: 'lacteos',
    costPrice: 95.00,
    salePrice: 135.00,
    stock: 4.8,
    minStock: 1.0,
    unit: 'kg',
    isBulk: true,
    emoji: '🥩'
  },
  {
    id: 'prod-35',
    code: 'PANELA-KG',
    name: 'Queso Panela Fresco Cremería (Granel)',
    category: 'lacteos',
    costPrice: 110.00,
    salePrice: 155.00,
    stock: 3.5,
    minStock: 1.0,
    unit: 'kg',
    isBulk: true,
    emoji: '🧀'
  }
];

export const INITIAL_CUSTOMERS: Customer[] = [
  {
    id: 'cust-1',
    name: 'Don Juan (Vecino Depto 201)',
    phone: '55 1234 5678',
    address: 'Edificio Los Pinos Depto 201',
    notes: 'Paga cada quincena puntualmente',
    balance: 185.00,
    creditLimit: 600.00,
    history: [
      { id: 'mov-1', date: '2026-09-18 18:30', type: 'cargo', amount: 120.00, note: 'Coca-cola, pan dulce y jamón', folio: 1001 },
      { id: 'mov-2', date: '2026-09-19 14:15', type: 'cargo', amount: 65.00, note: 'Huevo y tortillas', folio: 1003 }
    ]
  },
  {
    id: 'cust-2',
    name: 'Doña Carmen (Taller Mecánico)',
    phone: '55 9876 5432',
    address: 'Av. Hidalgo #45 (Taller Hermanos Gómez)',
    notes: 'Consume refrescos y botanas para los mecánicos',
    balance: 420.00,
    creditLimit: 1200.00,
    history: [
      { id: 'mov-3', date: '2026-09-17 12:00', type: 'cargo', amount: 350.00, note: 'Refrescos varios y botanas', folio: 998 },
      { id: 'mov-4', date: '2026-09-18 09:30', type: 'cargo', amount: 270.00, note: 'Agua Ciel y galletas', folio: 1000 },
      { id: 'mov-5', date: '2026-09-19 16:00', type: 'abono', amount: 200.00, note: 'Abono en efectivo' }
    ]
  },
  {
    id: 'cust-3',
    name: 'Profesor Morales',
    phone: '55 4567 8901',
    address: 'Calle Juárez #12',
    notes: 'Cuenta al corriente',
    balance: 0.00,
    creditLimit: 500.00,
    history: []
  }
];

export const INITIAL_SETTINGS: StoreSettings = {
  storeName: 'Abarrotes "La Providencia"',
  storeSlogan: 'Frutas, Verduras, Cremería y Abarrotes en General',
  phone: '(55) 5555-1234',
  address: 'Calle Reforma #104, Col. Centro',
  ticketFooter: '¡Gracias por su compra en la tiendita de la esquina! Vuelva pronto.',
  soundEnabled: true,
  autoPrintReceipt: true,
  ticketPaperWidth: '80mm',
  showBarcodeOnTicket: true,
  showQrOnTicket: true,
  contactUrl: 'https://wa.me/525555551234?text=Hola%20Abarrotes%20La%20Providencia',
  requireHighSaleConfirmation: true,
  highSaleThreshold: 1000.00,
  lowStockAlertEnabled: true,
  defaultMinStockThreshold: 5,
  primaryColor: 'emerald',
  headerBgColor: 'slate-900',
  kioskMode: false
};

export const INITIAL_CASH_SHIFT: CashShift = {
  id: 'shift-today',
  openedAt: new Date().toISOString().slice(0, 10) + ' 07:30',
  initialCash: 500.00,
  movements: [
    { id: 'mov-init-1', time: '10:15', type: 'salida', amount: 150.00, reason: 'Pago a repartidor de Pan Dulce Bimbo' },
    { id: 'mov-init-2', time: '11:40', type: 'entrada', amount: 200.00, reason: 'Abono Doña Carmen (Taller)' }
  ],
  status: 'open'
};

const getPastDateStr = (daysAgo: number, timeStr: string) => {
  const d = new Date();
  d.setDate(d.getDate() - daysAgo);
  return `${d.toISOString().slice(0, 10)} ${timeStr}`;
};

export const INITIAL_SALES: Sale[] = [
  // 6 days ago
  {
    id: 'sale-980',
    folio: 980,
    date: getPastDateStr(6, '09:15'),
    items: [
      { id: 'ci-980-1', product: INITIAL_PRODUCTS[0], quantity: 4, unitPrice: 19.00, total: 76.00 }, // Coca
      { id: 'ci-980-2', product: INITIAL_PRODUCTS[2], quantity: 6, unitPrice: 3.50, total: 21.00 },  // Bolillo
      { id: 'ci-980-3', product: INITIAL_PRODUCTS[5], quantity: 2, unitPrice: 20.00, total: 40.00 }  // Sabritas
    ],
    subtotal: 137.00,
    discount: 0,
    total: 137.00,
    paymentMethod: 'efectivo',
    amountPaid: 200.00,
    change: 63.00,
    cashier: 'Don Pedro'
  },
  {
    id: 'sale-981',
    folio: 981,
    date: getPastDateStr(6, '14:30'),
    items: [
      { id: 'ci-981-1', product: INITIAL_PRODUCTS[1], quantity: 2.0, unitPrice: 48.00, total: 96.00, isBulk: true }, // Huevo
      { id: 'ci-981-2', product: INITIAL_PRODUCTS[8], quantity: 1.5, unitPrice: 28.00, total: 42.00, isBulk: true }, // Cebolla
      { id: 'ci-981-3', product: INITIAL_PRODUCTS[4], quantity: 2, unitPrice: 29.50, total: 59.00 }                  // Leche Lala
    ],
    subtotal: 197.00,
    discount: 0,
    total: 197.00,
    paymentMethod: 'tarjeta',
    amountPaid: 197.00,
    change: 0,
    cashier: 'Don Pedro'
  },
  {
    id: 'sale-982',
    folio: 982,
    date: getPastDateStr(6, '18:50'),
    items: [
      { id: 'ci-982-1', product: INITIAL_PRODUCTS[10], quantity: 1, unitPrice: 42.00, total: 42.00 }, // Aceite
      { id: 'ci-982-2', product: INITIAL_PRODUCTS[11], quantity: 2, unitPrice: 38.00, total: 76.00 }, // Frijol
      { id: 'ci-982-3', product: INITIAL_PRODUCTS[0], quantity: 3, unitPrice: 19.00, total: 57.00 }   // Coca
    ],
    subtotal: 175.00,
    discount: 0,
    total: 175.00,
    paymentMethod: 'efectivo',
    amountPaid: 200.00,
    change: 25.00,
    cashier: 'Don Pedro'
  },

  // 5 days ago
  {
    id: 'sale-985',
    folio: 985,
    date: getPastDateStr(5, '10:10'),
    items: [
      { id: 'ci-985-1', product: INITIAL_PRODUCTS[0], quantity: 5, unitPrice: 19.00, total: 95.00 },
      { id: 'ci-985-2', product: INITIAL_PRODUCTS[5], quantity: 3, unitPrice: 20.00, total: 60.00 },
      { id: 'ci-985-3', product: INITIAL_PRODUCTS[6], quantity: 2, unitPrice: 18.00, total: 36.00 }
    ],
    subtotal: 191.00,
    discount: 0,
    total: 191.00,
    paymentMethod: 'efectivo',
    amountPaid: 200.00,
    change: 9.00,
    cashier: 'Don Pedro'
  },
  {
    id: 'sale-986',
    folio: 986,
    date: getPastDateStr(5, '13:40'),
    items: [
      { id: 'ci-986-1', product: INITIAL_PRODUCTS[1], quantity: 2.5, unitPrice: 48.00, total: 120.00, isBulk: true },
      { id: 'ci-986-2', product: INITIAL_PRODUCTS[3], quantity: 2.0, unitPrice: 24.00, total: 48.00, isBulk: true },
      { id: 'ci-986-3', product: INITIAL_PRODUCTS[7], quantity: 1.0, unitPrice: 32.00, total: 32.00, isBulk: true },
      { id: 'ci-986-4', product: INITIAL_PRODUCTS[12], quantity: 1, unitPrice: 32.00, total: 32.00 }
    ],
    subtotal: 232.00,
    discount: 0,
    total: 232.00,
    paymentMethod: 'transferencia',
    amountPaid: 232.00,
    change: 0,
    cashier: 'Don Pedro'
  },
  {
    id: 'sale-987',
    folio: 987,
    date: getPastDateStr(5, '17:25'),
    items: [
      { id: 'ci-987-1', product: INITIAL_PRODUCTS[13], quantity: 1, unitPrice: 26.00, total: 26.00 },
      { id: 'ci-987-2', product: INITIAL_PRODUCTS[14], quantity: 1, unitPrice: 38.00, total: 38.00 },
      { id: 'ci-987-3', product: INITIAL_PRODUCTS[4], quantity: 2, unitPrice: 29.50, total: 59.00 }
    ],
    subtotal: 123.00,
    discount: 0,
    total: 123.00,
    paymentMethod: 'efectivo',
    amountPaid: 150.00,
    change: 27.00,
    cashier: 'Don Pedro'
  },

  // 4 days ago
  {
    id: 'sale-990',
    folio: 990,
    date: getPastDateStr(4, '08:30'),
    items: [
      { id: 'ci-990-1', product: INITIAL_PRODUCTS[2], quantity: 8, unitPrice: 3.50, total: 28.00 },
      { id: 'ci-990-2', product: INITIAL_PRODUCTS[4], quantity: 3, unitPrice: 29.50, total: 88.50 },
      { id: 'ci-990-3', product: INITIAL_PRODUCTS[0], quantity: 2, unitPrice: 19.00, total: 38.00 }
    ],
    subtotal: 154.50,
    discount: 0,
    total: 154.50,
    paymentMethod: 'efectivo',
    amountPaid: 200.00,
    change: 45.50,
    cashier: 'Don Pedro'
  },
  {
    id: 'sale-991',
    folio: 991,
    date: getPastDateStr(4, '12:15'),
    items: [
      { id: 'ci-991-1', product: INITIAL_PRODUCTS[10], quantity: 2, unitPrice: 42.00, total: 84.00 },
      { id: 'ci-991-2', product: INITIAL_PRODUCTS[11], quantity: 2, unitPrice: 38.00, total: 76.00 },
      { id: 'ci-991-3', product: INITIAL_PRODUCTS[1], quantity: 1.5, unitPrice: 48.00, total: 72.00, isBulk: true }
    ],
    subtotal: 232.00,
    discount: 0,
    total: 232.00,
    paymentMethod: 'tarjeta',
    amountPaid: 232.00,
    change: 0,
    cashier: 'Don Pedro'
  },
  {
    id: 'sale-992',
    folio: 992,
    date: getPastDateStr(4, '19:40'),
    items: [
      { id: 'ci-992-1', product: INITIAL_PRODUCTS[0], quantity: 4, unitPrice: 19.00, total: 76.00 },
      { id: 'ci-992-2', product: INITIAL_PRODUCTS[5], quantity: 4, unitPrice: 20.00, total: 80.00 }
    ],
    subtotal: 156.00,
    discount: 0,
    total: 156.00,
    paymentMethod: 'efectivo',
    amountPaid: 200.00,
    change: 44.00,
    cashier: 'Don Pedro'
  },

  // 3 days ago
  {
    id: 'sale-993',
    folio: 993,
    date: getPastDateStr(3, '11:00'),
    items: [
      { id: 'ci-993-1', product: INITIAL_PRODUCTS[0], quantity: 6, unitPrice: 19.00, total: 114.00 },
      { id: 'ci-993-2', product: INITIAL_PRODUCTS[1], quantity: 3.0, unitPrice: 48.00, total: 144.00, isBulk: true },
      { id: 'ci-993-3', product: INITIAL_PRODUCTS[3], quantity: 2.0, unitPrice: 24.00, total: 48.00, isBulk: true }
    ],
    subtotal: 306.00,
    discount: 0,
    total: 306.00,
    paymentMethod: 'efectivo',
    amountPaid: 500.00,
    change: 194.00,
    cashier: 'Don Pedro'
  },
  {
    id: 'sale-994',
    folio: 994,
    date: getPastDateStr(3, '15:20'),
    items: [
      { id: 'ci-994-1', product: INITIAL_PRODUCTS[4], quantity: 4, unitPrice: 29.50, total: 118.00 },
      { id: 'ci-994-2', product: INITIAL_PRODUCTS[2], quantity: 10, unitPrice: 3.50, total: 35.00 },
      { id: 'ci-994-3', product: INITIAL_PRODUCTS[7], quantity: 1.5, unitPrice: 32.00, total: 48.00, isBulk: true }
    ],
    subtotal: 201.00,
    discount: 0,
    total: 201.00,
    paymentMethod: 'efectivo',
    amountPaid: 250.00,
    change: 49.00,
    cashier: 'Don Pedro'
  },
  {
    id: 'sale-995',
    folio: 995,
    date: getPastDateStr(3, '18:10'),
    items: [
      { id: 'ci-995-1', product: INITIAL_PRODUCTS[5], quantity: 5, unitPrice: 20.00, total: 100.00 },
      { id: 'ci-995-2', product: INITIAL_PRODUCTS[0], quantity: 4, unitPrice: 19.00, total: 76.00 }
    ],
    subtotal: 176.00,
    discount: 0,
    total: 176.00,
    paymentMethod: 'fiado',
    customerId: 'cust-01',
    customerName: 'Doña Carmen (Taller Mecánico)',
    amountPaid: 0,
    change: 0,
    cashier: 'Don Pedro'
  },

  // 2 days ago
  {
    id: 'sale-996',
    folio: 996,
    date: getPastDateStr(2, '09:40'),
    items: [
      { id: 'ci-996-1', product: INITIAL_PRODUCTS[1], quantity: 2.0, unitPrice: 48.00, total: 96.00, isBulk: true },
      { id: 'ci-996-2', product: INITIAL_PRODUCTS[4], quantity: 2, unitPrice: 29.50, total: 59.00 },
      { id: 'ci-996-3', product: INITIAL_PRODUCTS[2], quantity: 6, unitPrice: 3.50, total: 21.00 }
    ],
    subtotal: 176.00,
    discount: 0,
    total: 176.00,
    paymentMethod: 'efectivo',
    amountPaid: 200.00,
    change: 24.00,
    cashier: 'Don Pedro'
  },
  {
    id: 'sale-997',
    folio: 997,
    date: getPastDateStr(2, '14:15'),
    items: [
      { id: 'ci-997-1', product: INITIAL_PRODUCTS[0], quantity: 5, unitPrice: 19.00, total: 95.00 },
      { id: 'ci-997-2', product: INITIAL_PRODUCTS[10], quantity: 1, unitPrice: 42.00, total: 42.00 },
      { id: 'ci-997-3', product: INITIAL_PRODUCTS[11], quantity: 2, unitPrice: 38.00, total: 76.00 },
      { id: 'ci-997-4', product: INITIAL_PRODUCTS[8], quantity: 1.0, unitPrice: 28.00, total: 28.00, isBulk: true }
    ],
    subtotal: 241.00,
    discount: 0,
    total: 241.00,
    paymentMethod: 'tarjeta',
    amountPaid: 241.00,
    change: 0,
    cashier: 'Don Pedro'
  },
  {
    id: 'sale-998',
    folio: 998,
    date: getPastDateStr(2, '20:05'),
    items: [
      { id: 'ci-998-1', product: INITIAL_PRODUCTS[5], quantity: 4, unitPrice: 20.00, total: 80.00 },
      { id: 'ci-998-2', product: INITIAL_PRODUCTS[6], quantity: 3, unitPrice: 18.00, total: 54.00 },
      { id: 'ci-998-3', product: INITIAL_PRODUCTS[0], quantity: 2, unitPrice: 19.00, total: 38.00 }
    ],
    subtotal: 172.00,
    discount: 0,
    total: 172.00,
    paymentMethod: 'efectivo',
    amountPaid: 200.00,
    change: 28.00,
    cashier: 'Don Pedro'
  },

  // Yesterday (1 day ago)
  {
    id: 'sale-999',
    folio: 999,
    date: getPastDateStr(1, '08:15'),
    items: [
      { id: 'ci-999-1', product: INITIAL_PRODUCTS[2], quantity: 12, unitPrice: 3.50, total: 42.00 },
      { id: 'ci-999-2', product: INITIAL_PRODUCTS[4], quantity: 3, unitPrice: 29.50, total: 88.50 },
      { id: 'ci-999-3', product: INITIAL_PRODUCTS[0], quantity: 3, unitPrice: 19.00, total: 57.00 }
    ],
    subtotal: 187.50,
    discount: 0,
    total: 187.50,
    paymentMethod: 'efectivo',
    amountPaid: 200.00,
    change: 12.50,
    cashier: 'Don Pedro'
  },
  {
    id: 'sale-1000',
    folio: 1000,
    date: getPastDateStr(1, '13:30'),
    items: [
      { id: 'ci-1000-1', product: INITIAL_PRODUCTS[1], quantity: 3.0, unitPrice: 48.00, total: 144.00, isBulk: true },
      { id: 'ci-1000-2', product: INITIAL_PRODUCTS[3], quantity: 2.0, unitPrice: 24.00, total: 48.00, isBulk: true },
      { id: 'ci-1000-3', product: INITIAL_PRODUCTS[7], quantity: 2.0, unitPrice: 32.00, total: 64.00, isBulk: true },
      { id: 'ci-1000-4', product: INITIAL_PRODUCTS[10], quantity: 1, unitPrice: 42.00, total: 42.00 }
    ],
    subtotal: 298.00,
    discount: 0,
    total: 298.00,
    paymentMethod: 'tarjeta',
    amountPaid: 298.00,
    change: 0,
    cashier: 'Don Pedro'
  },
  {
    id: 'sale-1000b',
    folio: 1000,
    date: getPastDateStr(1, '18:45'),
    items: [
      { id: 'ci-1000b-1', product: INITIAL_PRODUCTS[0], quantity: 5, unitPrice: 19.00, total: 95.00 },
      { id: 'ci-1000b-2', product: INITIAL_PRODUCTS[5], quantity: 4, unitPrice: 20.00, total: 80.00 },
      { id: 'ci-1000b-3', product: INITIAL_PRODUCTS[12], quantity: 2, unitPrice: 32.00, total: 64.00 }
    ],
    subtotal: 239.00,
    discount: 0,
    total: 239.00,
    paymentMethod: 'efectivo',
    amountPaid: 300.00,
    change: 61.00,
    cashier: 'Don Pedro'
  },

  // Today
  {
    id: 'sale-1001',
    folio: 1001,
    date: getPastDateStr(0, '08:45'),
    items: [
      {
        id: 'ci-1',
        product: INITIAL_PRODUCTS[0], // Coca 600ml
        quantity: 3,
        unitPrice: 19.00,
        total: 57.00
      },
      {
        id: 'ci-2',
        product: INITIAL_PRODUCTS[2], // Bolillo
        quantity: 6,
        unitPrice: 3.50,
        total: 21.00
      },
      {
        id: 'ci-3',
        product: INITIAL_PRODUCTS[4], // Leche Lala
        quantity: 2,
        unitPrice: 29.50,
        total: 59.00
      }
    ],
    subtotal: 137.00,
    discount: 0,
    total: 137.00,
    paymentMethod: 'efectivo',
    amountPaid: 200.00,
    change: 63.00,
    cashier: 'Don Pedro'
  },
  {
    id: 'sale-1002',
    folio: 1002,
    date: getPastDateStr(0, '11:20'),
    items: [
      {
        id: 'ci-4',
        product: INITIAL_PRODUCTS[1], // Huevo
        quantity: 1.5,
        unitPrice: 48.00,
        total: 72.00,
        isBulk: true
      },
      {
        id: 'ci-5',
        product: INITIAL_PRODUCTS[3], // Tortilla
        quantity: 1.5,
        unitPrice: 24.00,
        total: 36.00,
        isBulk: true
      },
      {
        id: 'ci-6',
        product: INITIAL_PRODUCTS[7], // Jitomate
        quantity: 1.0,
        unitPrice: 32.00,
        total: 32.00,
        isBulk: true
      },
      {
        id: 'ci-7',
        product: INITIAL_PRODUCTS[0], // Coca
        quantity: 2,
        unitPrice: 19.00,
        total: 38.00
      }
    ],
    subtotal: 178.00,
    discount: 0,
    total: 178.00,
    paymentMethod: 'efectivo',
    amountPaid: 200.00,
    change: 22.00,
    cashier: 'Don Pedro'
  },
  {
    id: 'sale-1003',
    folio: 1003,
    date: getPastDateStr(0, '14:50'),
    items: [
      {
        id: 'ci-8',
        product: INITIAL_PRODUCTS[5], // Sabritas
        quantity: 3,
        unitPrice: 20.00,
        total: 60.00
      },
      {
        id: 'ci-9',
        product: INITIAL_PRODUCTS[0], // Coca 600ml
        quantity: 2,
        unitPrice: 19.00,
        total: 38.00
      },
      {
        id: 'ci-10',
        product: INITIAL_PRODUCTS[6], // Galletas Emperador
        quantity: 2,
        unitPrice: 18.00,
        total: 36.00
      }
    ],
    subtotal: 134.00,
    discount: 0,
    total: 134.00,
    paymentMethod: 'tarjeta',
    amountPaid: 134.00,
    change: 0,
    cashier: 'Don Pedro'
  }
];

export const INITIAL_USERS: User[] = [
  {
    id: 'user-admin-01',
    username: 'admin',
    name: 'Don Pancho',
    role: 'admin',
    pin: '1234',
    emoji: '👨‍💼',
    phone: '55 1234 5678',
    createdAt: '2025-01-01 08:00',
    lastLogin: '2026-09-20 08:30'
  },
  {
    id: 'user-cashier-02',
    username: 'maria',
    name: 'María Gómez',
    role: 'cashier',
    pin: '2222',
    emoji: '👩‍💼',
    phone: '55 9876 5432',
    createdAt: '2025-02-15 09:00',
    lastLogin: '2026-09-19 14:00'
  },
  {
    id: 'user-cashier-03',
    username: 'carlos',
    name: 'Carlos Ruiz',
    role: 'cashier',
    pin: '3333',
    emoji: '🧑‍💼',
    phone: '55 4567 8901',
    createdAt: '2025-03-10 12:00',
    lastLogin: '2026-09-18 19:15'
  }
];
