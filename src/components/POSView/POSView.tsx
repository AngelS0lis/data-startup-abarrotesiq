import React, { useState, useRef, useEffect, useMemo } from 'react';
import {
  Search,
  Barcode,
  Scale,
  Plus,
  Minus,
  Trash2,
  CheckCircle2,
  AlertTriangle,
  Sparkles,
  ShoppingBag,
  RotateCcw,
  ShieldAlert,
  Lock,
  Filter,
  X
} from 'lucide-react';
import { usePOS } from '../../context/POSContext';
import { Product, ProductCategory, Sale } from '../../types';
import { CATEGORIES } from '../../data/initialData';
import { BulkWeightModal } from './BulkWeightModal';
import { CheckoutModal } from './CheckoutModal';
import { ReceiptModal } from './ReceiptModal';
import { LowStockAlertBanner } from './LowStockAlertBanner';
import { RestockModal } from '../RestockModal';
import { soundEffects } from '../../utils/audio';
import { isProductLowStock } from '../../utils/stockAlerts';

export const POSView: React.FC = () => {
  const {
    products,
    cart,
    addToCart,
    updateCartItemQuantity,
    removeFromCart,
    clearCart,
    cartSubtotal,
    cartTotalCount,
    settings,
    sales,
    setActiveTab
  } = usePOS();

  // Search and scanner input
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<ProductCategory | 'all'>('all');
  const [highlightedIndex, setHighlightedIndex] = useState<number>(0);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Modals state
  const [bulkProduct, setBulkProduct] = useState<Product | null>(null);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState<boolean>(false);
  const [lastCompletedSale, setLastCompletedSale] = useState<Sale | null>(null);
  const [isRestockModalOpen, setIsRestockModalOpen] = useState<boolean>(false);

  // Count products falling below configured threshold
  const lowStockCount = useMemo(() => {
    const threshold = settings.defaultMinStockThreshold ?? 5;
    return products.filter((p) => isProductLowStock(p, threshold)).length;
  }, [products, settings.defaultMinStockThreshold]);

  // Map of categories for quick lookup and search matching
  const categoryMap = useMemo(() => {
    return new Map(CATEGORIES.map((c) => [c.id, c]));
  }, []);

  // Auto-focus search bar on mount
  useEffect(() => {
    searchInputRef.current?.focus();
  }, []);

  // Global POS Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ctrl + B or Cmd + B -> Focus search / barcode scanner
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'b') {
        e.preventDefault();
        searchInputRef.current?.focus();
        searchInputRef.current?.select();
        return;
      }
      // F1 -> Focus search / barcode scanner
      if (e.key === 'F1') {
        e.preventDefault();
        searchInputRef.current?.focus();
        searchInputRef.current?.select();
      }
      // F2 -> Open Checkout
      else if (e.key === 'F2') {
        e.preventDefault();
        if (cart.length > 0 && !isCheckoutOpen && !bulkProduct) {
          setIsCheckoutOpen(true);
        }
      }
      // F4 -> Open Bulk Scale selector for first bulk product or trigger search
      else if (e.key === 'F4') {
        e.preventDefault();
        const firstBulk = products.find((p) => p.isBulk);
        if (firstBulk) {
          setBulkProduct(firstBulk);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [cart.length, isCheckoutOpen, bulkProduct, products]);

  // Matching helper for search query against name, code, or category
  const trimmedSearch = searchQuery.trim().toLowerCase();
  const searchWords = useMemo(() => {
    return trimmedSearch ? trimmedSearch.split(' ').filter(Boolean) : [];
  }, [trimmedSearch]);

  const matchesSearch = (p: Product) => {
    if (searchWords.length === 0) return true;
    const catObj = categoryMap.get(p.category);
    const catName = catObj ? catObj.name.toLowerCase() : '';
    const catId = p.category.toLowerCase();
    const prodName = p.name.toLowerCase();
    const prodCode = p.code.toLowerCase();

    // The product matches if every typed term appears in its name, barcode, or category
    return searchWords.every(
      (term) =>
        prodName.includes(term) ||
        prodCode.includes(term) ||
        catId.includes(term) ||
        catName.includes(term)
    );
  };

  // Filter products for quick shelf
  const shelfProducts = products.filter((p) => {
    if (selectedCategory !== 'all' && p.category !== selectedCategory) {
      return false;
    }
    if (trimmedSearch && !matchesSearch(p)) {
      return false;
    }
    return true;
  });

  // Search results dropdown (matches name, barcode code, or category)
  const searchResults = trimmedSearch
    ? products
        .filter((p) => {
          if (selectedCategory !== 'all' && p.category !== selectedCategory) {
            return false;
          }
          return matchesSearch(p);
        })
        .slice(0, 8)
    : [];

  const handleSearchKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (!trimmedSearch) return;

      // Check exact barcode match first
      const exactBarcode = products.find(
        (p) => p.code.toLowerCase() === trimmedSearch
      );

      if (exactBarcode) {
        if (exactBarcode.isBulk) {
          setBulkProduct(exactBarcode);
        } else {
          addToCart(exactBarcode, 1);
        }
        setSearchQuery('');
        return;
      }

      // Check highlighted from results or first match
      if (searchResults.length > 0) {
        const itemToAdd = searchResults[highlightedIndex] || searchResults[0];
        if (itemToAdd.isBulk) {
          setBulkProduct(itemToAdd);
        } else {
          addToCart(itemToAdd, 1);
        }
        setSearchQuery('');
      } else {
        if (settings.soundEnabled) soundEffects.error();
      }
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      setHighlightedIndex((prev) => (prev + 1) % (searchResults.length || 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setHighlightedIndex((prev) => (prev - 1 + searchResults.length) % (searchResults.length || 1));
    } else if (e.key === 'Escape') {
      setSearchQuery('');
    }
  };

  const handleProductCardClick = (product: Product) => {
    if (product.isBulk) {
      setBulkProduct(product);
    } else {
      addToCart(product, 1);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-3 sm:px-6 py-4">
      {/* Low Stock Alert Notification Banner on POS Load */}
      <LowStockAlertBanner
        onOpenRestockModal={() => setIsRestockModalOpen(true)}
        onGoToInventory={() => setActiveTab('inventario')}
      />

      {/* Search & Barcode Bar */}
      <div className="mb-4 relative">
        <div className="flex flex-col sm:flex-row gap-2">
          {/* Main search box with integrated category filter */}
          <div className="relative flex-1 flex items-stretch bg-white dark:bg-slate-900 border-2 border-slate-300 dark:border-slate-700 rounded-xl shadow-xs focus-within:border-emerald-500 dark:focus-within:border-emerald-400 focus-within:ring-3 focus-within:ring-emerald-500/20 transition-all overflow-hidden">
            {/* Category filter dropdown inside search bar */}
            <div className="relative flex items-center bg-slate-50 dark:bg-slate-800/80 border-r border-slate-200 dark:border-slate-700 px-2 sm:px-3 shrink-0">
              <Filter className="w-3.5 h-3.5 text-slate-400 dark:text-slate-400 mr-1 hidden sm:inline" />
              <select
                id="pos-search-category-filter"
                aria-label="Filtrar por categoría"
                value={selectedCategory}
                onChange={(e) => {
                  setSelectedCategory(e.target.value as ProductCategory | 'all');
                  searchInputRef.current?.focus();
                }}
                className="bg-transparent text-xs font-bold text-slate-700 dark:text-slate-200 focus:outline-hidden cursor-pointer py-2 max-w-[90px] sm:max-w-[140px] md:max-w-[110px] lg:max-w-[170px] truncate"
                title="Filtrar búsqueda por categoría"
              >
                <option value="all" className="dark:bg-slate-900">
                  Todas las categorías
                </option>
                {CATEGORIES.map((cat) => (
                  <option key={cat.id} value={cat.id} className="dark:bg-slate-900">
                    {cat.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Barcode / Name / Category search input */}
            <div className="relative flex-1 flex items-center min-w-0">
              <div className="pl-2.5 sm:pl-3 pr-1 text-slate-400 pointer-events-none shrink-0">
                <Barcode className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
              </div>
              <input
                ref={searchInputRef}
                type="text"
                id="pos-barcode-search-input"
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setHighlightedIndex(0);
                }}
                onKeyDown={handleSearchKeyDown}
                placeholder="Buscar o escanear código... (Enter)"
                className="w-full pl-2 pr-14 sm:pr-24 py-2.5 sm:py-3 bg-transparent text-xs sm:text-sm font-semibold text-slate-900 dark:text-white focus:outline-hidden placeholder:text-slate-400 dark:placeholder:text-slate-500"
              />

              {/* Right indicators & keyboard shortcut badges */}
              <div className="absolute inset-y-0 right-0 pr-2 flex items-center gap-1 shrink-0">
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => {
                      setSearchQuery('');
                      searchInputRef.current?.focus();
                    }}
                    className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded cursor-pointer"
                    title="Limpiar búsqueda"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => {
                    searchInputRef.current?.focus();
                    searchInputRef.current?.select();
                  }}
                  title="Atajo de teclado: Presione Ctrl + B para enfocar la búsqueda"
                  className="hidden sm:inline-flex items-center gap-0.5 text-[10px] font-mono font-bold text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-300 dark:border-emerald-800 px-1.5 py-0.5 rounded shadow-2xs cursor-pointer hover:bg-emerald-100 transition-colors"
                >
                  <kbd className="font-semibold">Ctrl+B</kbd>
                </button>
                <span
                  title="Atajo alternativo: F1"
                  className="hidden lg:inline-flex text-[10px] font-mono font-bold text-slate-400 dark:text-slate-500 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-1.5 py-0.5 rounded"
                >
                  F1
                </span>
              </div>
            </div>
          </div>

          {/* Quick Bulk Scale Button */}
          <button
            type="button"
            id="pos-btn-bulk-scale"
            onClick={() => {
              const bulk = products.find((p) => p.isBulk);
              if (bulk) setBulkProduct(bulk);
            }}
            className="px-3 sm:px-4 py-2.5 sm:py-3 bg-emerald-50 dark:bg-emerald-950/60 hover:bg-emerald-100 dark:hover:bg-emerald-900/60 border-2 border-emerald-300 dark:border-emerald-800/80 rounded-xl text-emerald-800 dark:text-emerald-300 font-bold text-xs sm:text-sm flex items-center justify-center gap-1.5 sm:gap-2 transition-all shadow-xs shrink-0 cursor-pointer whitespace-nowrap"
            title="Venta a granel / báscula (F4)"
          >
            <Scale className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-600 dark:text-emerald-400 shrink-0" />
            <span className="hidden sm:inline">Granel / Báscula</span>
            <kbd className="hidden lg:inline-block text-[10px] font-mono bg-emerald-200/80 dark:bg-emerald-900 px-1 rounded">
              F4
            </kbd>
          </button>

          {/* Quick Restock button if any low stock exists */}
          {lowStockCount > 0 && (
            <button
              type="button"
              id="pos-btn-quick-restock-toolbar"
              onClick={() => setIsRestockModalOpen(true)}
              className="px-3 sm:px-3.5 py-3 bg-amber-50 dark:bg-amber-950/60 hover:bg-amber-100 dark:hover:bg-amber-900/60 border-2 border-amber-300 dark:border-amber-800/80 rounded-xl text-amber-900 dark:text-amber-300 font-bold text-xs sm:text-sm flex items-center justify-center gap-1.5 transition-all shadow-xs shrink-0 cursor-pointer"
              title={`${lowStockCount} artículos con inventario por debajo del mínimo`}
            >
              <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400 animate-pulse" />
              <span className="hidden lg:inline">Resurtir</span>
              <span className="bg-amber-200 dark:bg-amber-800 text-amber-900 dark:text-amber-100 px-1.5 py-0.5 rounded-full text-[10px] font-black">
                {lowStockCount}
              </span>
            </button>
          )}
        </div>

        {/* Live Search Dropdown */}
        {trimmedSearch && searchResults.length > 0 && (
          <div className="absolute left-0 right-0 top-full mt-1.5 z-40 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl shadow-2xl overflow-hidden divide-y divide-slate-100 dark:divide-slate-800">
            {searchResults.map((item, idx) => {
              const catObj = categoryMap.get(item.category);
              return (
                <div
                  key={item.id}
                  onClick={() => {
                    handleProductCardClick(item);
                    setSearchQuery('');
                  }}
                  className={`p-3 flex items-center justify-between cursor-pointer transition-colors ${
                    idx === highlightedIndex
                      ? 'bg-emerald-50/80 dark:bg-emerald-950/80 text-emerald-900 dark:text-emerald-200 font-semibold'
                      : 'hover:bg-slate-50 dark:hover:bg-slate-800/80 text-slate-800 dark:text-slate-200'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    {item.image ? (
                      <img
                        src={item.image}
                        alt={item.name}
                        className="w-7 h-7 rounded-lg object-cover shrink-0 border border-slate-200 dark:border-slate-700"
                      />
                    ) : (
                      <span className="text-xl shrink-0">{item.emoji || '📦'}</span>
                    )}
                    <div>
                      <div className="text-sm font-bold flex items-center gap-2 flex-wrap">
                        <span>{item.name}</span>
                        {catObj && (
                          <span
                            className={`text-[10px] font-bold px-1.5 py-0.2 rounded border ${
                              catObj.badgeClass || 'bg-slate-100 text-slate-700 border-slate-200'
                            }`}
                          >
                            {catObj.name}
                          </span>
                        )}
                        {item.isBulk && (
                          <span className="text-[10px] bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 px-1.5 py-0.2 rounded border border-amber-200 dark:border-amber-800">
                            Granel
                          </span>
                        )}
                      </div>
                      <div className="text-xs text-slate-400 dark:text-slate-400 font-mono">
                        Cód: {item.code} · Stock: {item.stock} {item.unit}
                      </div>
                    </div>
                  </div>

                  <div className="text-right shrink-0 ml-3">
                    <span className="text-base font-black font-mono text-emerald-600 dark:text-emerald-400">
                      ${item.salePrice.toFixed(2)}
                    </span>
                    <span className="text-xs text-slate-400 block">por {item.unit}</span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Main POS 2-Column Grid */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-3.5 lg:gap-5 items-start">
        {/* Left Column: Fast shelf and categories (7 cols) */}
        <div className="md:col-span-7 space-y-3 sm:space-y-4">
          {/* Category Filter Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-1">
            <button
              type="button"
              id="pos-cat-pill-all"
              onClick={() => setSelectedCategory('all')}
              style={{
                backgroundColor: selectedCategory === 'all' ? 'var(--header-bg-color, #0f172a)' : undefined
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                selectedCategory === 'all'
                  ? 'text-white shadow-sm'
                  : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800'
              }`}
            >
              Todos ({products.length})
            </button>
            {CATEGORIES.map((cat) => {
              const isSelected = selectedCategory === cat.id;
              return (
                <button
                  key={cat.id}
                  type="button"
                  id={`pos-cat-pill-${cat.id}`}
                  onClick={() => setSelectedCategory(cat.id)}
                  style={{
                    backgroundColor: isSelected ? 'var(--header-bg-color, #0f172a)' : undefined
                  }}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                    isSelected
                      ? 'text-white shadow-sm'
                      : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800'
                  }`}
                >
                  {cat.name}
                </button>
              );
            })}
          </div>

          {/* Product Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-2 sm:gap-2.5 h-[580px] md:h-[640px] lg:h-[680px] overflow-y-auto custom-scrollbar pr-1">
            {shelfProducts.length === 0 ? (
              <div className="col-span-full py-12 px-4 text-center bg-white dark:bg-slate-900 border border-dashed border-slate-300 dark:border-slate-800 rounded-xl">
                <Search className="w-8 h-8 text-slate-300 dark:text-slate-600 mx-auto mb-2" />
                <p className="text-sm font-bold text-slate-700 dark:text-slate-200">
                  No se encontraron productos
                </p>
                <p className="text-xs text-slate-400 dark:text-slate-400 mt-1 max-w-sm mx-auto">
                  {trimmedSearch
                    ? `No hay coincidencias para "${searchQuery}" en la categoría seleccionada.`
                    : 'No hay productos registrados en esta categoría.'}
                </p>
                {(trimmedSearch || selectedCategory !== 'all') && (
                  <button
                    type="button"
                    onClick={() => {
                      setSearchQuery('');
                      setSelectedCategory('all');
                      searchInputRef.current?.focus();
                    }}
                    className="mt-3 px-3 py-1.5 bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 text-xs font-bold rounded-lg border border-emerald-200 dark:border-emerald-800 hover:bg-emerald-100 transition-colors cursor-pointer"
                  >
                    Restablecer filtros
                  </button>
                )}
              </div>
            ) : (
              shelfProducts.map((product) => {
                const isLowStock = product.stock <= product.minStock;
                return (
                  <button
                    key={product.id}
                    type="button"
                    id={`prod-btn-${product.id}`}
                    onClick={() => handleProductCardClick(product)}
                    className="bg-white dark:bg-slate-900 rounded-xl p-3 border border-slate-200 dark:border-slate-800 hover:border-emerald-500 dark:hover:border-emerald-400 dark:hover:bg-slate-800/80 hover:shadow-md transition-all text-left flex flex-col justify-between group active:scale-98 relative cursor-pointer"
                  >
                    {/* Top: Image/Emoji & badges */}
                    <div className="flex items-start justify-between mb-2">
                      {product.image ? (
                        <img
                          src={product.image}
                          alt={product.name}
                          className="w-10 h-10 rounded-lg object-cover group-hover:scale-105 transition-transform border border-slate-100 dark:border-slate-800 shadow-2xs"
                        />
                      ) : (
                        <span className="text-2xl group-hover:scale-110 transition-transform">
                          {product.emoji || '📦'}
                        </span>
                      )}
                      {product.isBulk ? (
                        <span className="text-[10px] font-bold bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 px-1.5 py-0.5 rounded border border-amber-200 dark:border-amber-800">
                          Granel
                        </span>
                      ) : isLowStock ? (
                        <span className="text-[10px] font-bold bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-300 px-1.5 py-0.5 rounded border border-rose-200 dark:border-rose-800 flex items-center gap-0.5">
                          <AlertTriangle className="w-2.5 h-2.5" />
                          Poco
                        </span>
                      ) : null}
                    </div>

                    {/* Middle: Product Name */}
                    <div className="mb-2">
                      <h3 className="text-xs font-bold text-slate-800 dark:text-slate-100 line-clamp-2 leading-snug">
                        {product.name}
                      </h3>
                      <span className="text-[10px] text-slate-400 dark:text-slate-400 font-mono block mt-0.5">
                        Disp: {product.stock} {product.unit}
                      </span>
                    </div>

                    {/* Bottom: Price tag */}
                    <div className="mt-auto pt-1.5 border-t border-slate-100 dark:border-slate-800 flex items-baseline justify-between">
                      <span className="text-sm sm:text-base font-black font-mono text-emerald-600 dark:text-emerald-400">
                        ${product.salePrice.toFixed(2)}
                      </span>
                      <span className="text-[10px] text-slate-400 font-semibold">
                        /{product.unit}
                      </span>
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* Right Column: Ticket / Cart (5 cols) */}
        <div className="md:col-span-5 bg-white dark:bg-slate-900 border-2 border-slate-300 dark:border-slate-700 rounded-2xl shadow-xl overflow-hidden flex flex-col h-[580px] md:h-[640px] lg:h-[680px]">
          {/* Cart Header */}
          <div
            id="pos-cart-header"
            style={{
              backgroundColor: 'var(--header-bg-color, #0f172a)',
              borderBottomColor: 'var(--header-border-color, rgba(255, 255, 255, 0.12))'
            }}
            className="text-white px-3 sm:px-4 py-3 flex items-center justify-between border-b transition-colors duration-200 shrink-0"
          >
            <div className="flex items-center gap-1.5 sm:gap-2 min-w-0">
              <ShoppingBag className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-400 shrink-0" />
              <h2 className="font-extrabold text-xs sm:text-sm lg:text-base whitespace-nowrap truncate">
                Ticket de Venta
              </h2>
              <span className="bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[10px] sm:text-xs px-1.5 sm:px-2 py-0.2 rounded-full font-mono shrink-0 whitespace-nowrap">
                {cart.length} <span className="hidden sm:inline">{cart.length === 1 ? 'art.' : 'arts.'}</span>
              </span>
            </div>
            {cart.length > 0 && (
              <button
                type="button"
                onClick={clearCart}
                className="text-xs text-rose-300 hover:text-rose-100 hover:bg-rose-950/40 px-2 py-1 rounded transition-colors flex items-center gap-1 shrink-0 ml-1 cursor-pointer"
                title="Limpiar ticket actual"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Vaciar</span>
              </button>
            )}
          </div>

          {/* Cart Items List */}
          <div className="flex-1 overflow-y-auto custom-scrollbar p-2.5 sm:p-3 space-y-2 divide-y divide-slate-100 dark:divide-slate-800">
            {cart.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-slate-400 p-6 text-center space-y-3">
                <div className="w-14 h-14 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-300 dark:text-slate-600">
                  <ShoppingBag className="w-7 h-7" />
                </div>
                <div>
                  <p className="font-bold text-slate-600 dark:text-slate-300 text-sm">El ticket está vacío</p>
                  <p className="text-xs text-slate-400 dark:text-slate-400 mt-1 max-w-[220px]">
                    Escanea un código de barras o haz clic en los productos del mostrador.
                  </p>
                </div>
              </div>
            ) : (
              cart.map((item) => (
                <div key={item.id} className="pt-2 first:pt-0 flex items-center justify-between gap-1.5 sm:gap-2">
                  {/* Info */}
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1 sm:gap-1.5">
                      {item.product.image ? (
                        <img src={item.product.image} alt="" className="w-4 h-4 rounded object-cover shrink-0" />
                      ) : (
                        <span className="text-xs shrink-0">{item.product.emoji || '📦'}</span>
                      )}
                      <span className="font-bold text-xs sm:text-sm text-slate-800 dark:text-slate-100 truncate">
                        {item.product.name}
                      </span>
                      {item.isBulk && (
                        <span className="text-[9px] bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 px-1 rounded font-bold shrink-0">
                          Granel
                        </span>
                      )}
                    </div>
                    <div className="text-[10px] sm:text-[11px] text-slate-500 dark:text-slate-400 font-mono">
                      ${item.unitPrice.toFixed(2)} c/{item.product.unit}
                    </div>
                  </div>

                  {/* Quantity Stepper */}
                  <div className="flex items-center gap-0.5 sm:gap-1 bg-slate-100 dark:bg-slate-800 p-0.5 sm:p-1 rounded-lg shrink-0">
                    <button
                      type="button"
                      onClick={() =>
                        updateCartItemQuantity(
                          item.id,
                          item.isBulk ? Math.max(0.1, item.quantity - 0.25) : item.quantity - 1
                        )
                      }
                      className="w-5 h-5 sm:w-6 sm:h-6 rounded bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-600 flex items-center justify-center font-bold text-xs shadow-xs cursor-pointer"
                    >
                      <Minus className="w-3 h-3" />
                    </button>
                    <span className="w-10 sm:w-12 text-center text-[11px] sm:text-xs font-black font-mono text-slate-800 dark:text-white truncate">
                      {item.quantity}
                    </span>
                    <button
                      type="button"
                      onClick={() =>
                        updateCartItemQuantity(
                          item.id,
                          item.isBulk ? item.quantity + 0.25 : item.quantity + 1
                        )
                      }
                      className="w-5 h-5 sm:w-6 sm:h-6 rounded bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-600 flex items-center justify-center font-bold text-xs shadow-xs cursor-pointer"
                    >
                      <Plus className="w-3 h-3" />
                    </button>
                  </div>

                  {/* Total & Delete */}
                  <div className="text-right flex items-center gap-1 sm:gap-2 shrink-0">
                    <span className="text-xs sm:text-sm font-black font-mono text-slate-900 dark:text-white">
                      ${item.total.toFixed(2)}
                    </span>
                    <button
                      type="button"
                      onClick={() => removeFromCart(item.id)}
                      className="p-1 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 rounded transition-colors cursor-pointer"
                      title="Quitar del ticket"
                    >
                      <Trash2 className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Cart Footer & Checkout Button */}
          <div className="p-3 sm:p-4 bg-slate-50 dark:bg-slate-950/70 border-t border-slate-200 dark:border-slate-800 space-y-2.5 sm:space-y-3">
            {/* Total Display */}
            <div className="flex items-baseline justify-between">
              <div>
                <span className="text-xs uppercase font-bold text-slate-500 dark:text-slate-400 block">Total a Pagar</span>
                <span className="text-xs text-slate-400 dark:text-slate-400 font-mono">
                  {cartTotalCount} unidades en total
                </span>
              </div>
              <div className="text-right">
                <span className="text-2xl sm:text-3xl lg:text-4xl font-black font-mono text-emerald-600 dark:text-emerald-400 tracking-tight">
                  ${cartSubtotal.toFixed(2)}
                </span>
              </div>
            </div>

            {/* High sale warning badge in cart */}
            {cart.length > 0 &&
              (settings.requireHighSaleConfirmation ?? true) &&
              cartSubtotal >= (settings.highSaleThreshold ?? 1000) && (
                <div className="flex items-center gap-2 p-2 bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-800 rounded-xl text-amber-900 dark:text-amber-200 text-xs font-semibold animate-in fade-in">
                  <ShieldAlert className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
                  <span className="truncate">
                    Venta alta (&gt; ${(settings.highSaleThreshold ?? 1000).toLocaleString('es-MX')} MXN): Requerirá confirmación
                  </span>
                </div>
              )}

            {/* Big Checkout Trigger Button */}
            <button
              type="button"
              id="pos-btn-cobrar"
              disabled={cart.length === 0}
              onClick={() => setIsCheckoutOpen(true)}
              className={`w-full py-3 sm:py-3.5 px-3 sm:px-4 rounded-xl font-black text-sm sm:text-base transition-all flex items-center justify-center gap-2 shadow-lg cursor-pointer ${
                cart.length === 0
                  ? 'bg-slate-200 dark:bg-slate-800 text-slate-400 dark:text-slate-600 cursor-not-allowed shadow-none'
                  : (settings.requireHighSaleConfirmation ?? true) &&
                    cartSubtotal >= (settings.highSaleThreshold ?? 1000)
                  ? 'bg-amber-600 hover:bg-amber-700 active:bg-amber-800 text-white shadow-amber-900/30'
                  : 'bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white shadow-emerald-900/30'
              }`}
            >
              <CheckCircle2 className="w-5 h-5" />
              <span>COBRAR (F2)</span>
              <span className="text-xs bg-black/20 px-2 py-0.5 rounded font-mono ml-1">
                ${cartSubtotal.toFixed(2)}
              </span>
            </button>
          </div>
        </div>
      </div>

      {/* Bulk weight modal */}
      {bulkProduct && (
        <BulkWeightModal
          product={bulkProduct}
          onConfirm={(qty, isBulk, money) => {
            addToCart(bulkProduct, qty, isBulk, money);
            setBulkProduct(null);
            searchInputRef.current?.focus();
          }}
          onClose={() => {
            setBulkProduct(null);
            searchInputRef.current?.focus();
          }}
        />
      )}

      {/* Checkout modal */}
      {isCheckoutOpen && (
        <CheckoutModal
          onClose={() => setIsCheckoutOpen(false)}
          onSuccess={(sale) => {
            setIsCheckoutOpen(false);
            setLastCompletedSale(sale);
          }}
        />
      )}

      {/* Receipt Modal */}
      {lastCompletedSale && (
        <ReceiptModal
          sale={lastCompletedSale}
          onClose={() => {
            setLastCompletedSale(null);
            searchInputRef.current?.focus();
          }}
        />
      )}

      {/* Restock Modal */}
      <RestockModal
        isOpen={isRestockModalOpen}
        onClose={() => {
          setIsRestockModalOpen(false);
          searchInputRef.current?.focus();
        }}
        onNavigateToInventory={() => setActiveTab('inventario')}
      />
    </div>
  );
};
