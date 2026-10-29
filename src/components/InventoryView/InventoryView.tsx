import React, { useState, useRef } from 'react';
import {
  Plus,
  Search,
  AlertTriangle,
  Boxes,
  Edit2,
  Trash2,
  TrendingUp,
  PackageCheck,
  CircleDollarSign,
  X,
  Check,
  RefreshCw,
  FileSpreadsheet,
  Upload,
  Image as ImageIcon,
  Link as LinkIcon
} from 'lucide-react';
import { usePOS } from '../../context/POSContext';
import { Product, ProductCategory } from '../../types';
import { CATEGORIES } from '../../data/initialData';

interface InventoryViewProps {
  onOpenGoogleSheets?: () => void;
}

export const InventoryView: React.FC<InventoryViewProps> = ({ onOpenGoogleSheets }) => {
  const { products, addProduct, updateProduct, deleteProduct, adjustStock } = usePOS();

  const [search, setSearch] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<ProductCategory | 'all'>('all');
  const [filterLowStockOnly, setFilterLowStockOnly] = useState<boolean>(false);

  // Edit / New modal state
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  // Stock quick adjustment prompt state
  const [adjustingProductId, setAdjustingProductId] = useState<string | null>(null);
  const [adjustQtyInput, setAdjustQtyInput] = useState<string>('10');

  // Form fields
  const [code, setCode] = useState<string>('');
  const [name, setName] = useState<string>('');
  const [category, setCategory] = useState<ProductCategory>('despensa');
  const [costPrice, setCostPrice] = useState<string>('15.00');
  const [salePrice, setSalePrice] = useState<string>('20.00');
  const [stock, setStock] = useState<string>('20');
  const [minStock, setMinStock] = useState<string>('5');
  const [unit, setUnit] = useState<'pza' | 'kg' | 'paq' | 'litro'>('pza');
  const [isBulk, setIsBulk] = useState<boolean>(false);
  const [iconType, setIconType] = useState<'image' | 'emoji'>('image');
  const [emoji, setEmoji] = useState<string>('📦');
  const [image, setImage] = useState<string>('');
  const [imageUrlInput, setImageUrlInput] = useState<string>('');
  const [showUrlInput, setShowUrlInput] = useState<boolean>(false);
  const [isDraggingImage, setIsDraggingImage] = useState<boolean>(false);
  const [isQuickAccess, setIsQuickAccess] = useState<boolean>(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageFile = (file: File) => {
    if (!file.type.startsWith('image/')) {
      alert('Por favor selecciona un archivo de imagen válido (JPG, PNG, WebP).');
      return;
    }
    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result as string;
      if (result) {
        setImage(result);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleDropImage = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDraggingImage(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleImageFile(e.dataTransfer.files[0]);
    }
  };

  // Calculations for summary metrics
  const totalItemsCount = products.length;
  const inventoryCostValue = products.reduce((acc, p) => acc + p.costPrice * p.stock, 0);
  const inventorySaleValue = products.reduce((acc, p) => acc + p.salePrice * p.stock, 0);
  const potentialProfit = inventorySaleValue - inventoryCostValue;
  const lowStockCount = products.filter((p) => p.stock <= p.minStock).length;

  // Filter products
  const filteredProducts = products.filter((p) => {
    if (selectedCategory !== 'all' && p.category !== selectedCategory) return false;
    if (filterLowStockOnly && p.stock > p.minStock) return false;
    if (search.trim()) {
      const q = search.toLowerCase();
      return p.name.toLowerCase().includes(q) || p.code.toLowerCase().includes(q);
    }
    return true;
  });

  const openNewProductModal = () => {
    setEditingProduct(null);
    setCode(`7501${Math.floor(10000000 + Math.random() * 90000000)}`);
    setName('');
    setCategory('despensa');
    setCostPrice('15.00');
    setSalePrice('20.00');
    setStock('20');
    setMinStock('5');
    setUnit('pza');
    setIsBulk(false);
    setIconType('image');
    setEmoji('📦');
    setImage('');
    setImageUrlInput('');
    setShowUrlInput(false);
    setIsQuickAccess(false);
    setIsModalOpen(true);
  };

  const openEditProductModal = (p: Product) => {
    setEditingProduct(p);
    setCode(p.code);
    setName(p.name);
    setCategory(p.category);
    setCostPrice(p.costPrice.toString());
    setSalePrice(p.salePrice.toString());
    setStock(p.stock.toString());
    setMinStock(p.minStock.toString());
    setUnit(p.unit);
    setIsBulk(Boolean(p.isBulk));
    setIconType(p.image ? 'image' : 'emoji');
    setEmoji(p.emoji || '📦');
    setImage(p.image || '');
    setImageUrlInput('');
    setShowUrlInput(false);
    setIsQuickAccess(Boolean(p.isQuickAccess));
    setIsModalOpen(true);
  };

  const handleSaveProduct = (e: React.FormEvent) => {
    e.preventDefault();
    const parsedCost = parseFloat(costPrice) || 0;
    const parsedSale = parseFloat(salePrice) || 0;
    const parsedStock = parseFloat(stock) || 0;
    const parsedMinStock = parseFloat(minStock) || 0;

    if (!name.trim() || !code.trim()) return;

    const finalImage = iconType === 'image' ? (image.trim() || undefined) : undefined;
    const finalEmoji = emoji.trim() || '📦';

    if (editingProduct) {
      updateProduct({
        ...editingProduct,
        code: code.trim(),
        name: name.trim(),
        category,
        costPrice: parsedCost,
        salePrice: parsedSale,
        stock: parsedStock,
        minStock: parsedMinStock,
        unit,
        isBulk,
        emoji: finalEmoji,
        image: finalImage,
        isQuickAccess
      });
    } else {
      addProduct({
        code: code.trim(),
        name: name.trim(),
        category,
        costPrice: parsedCost,
        salePrice: parsedSale,
        stock: parsedStock,
        minStock: parsedMinStock,
        unit,
        isBulk,
        emoji: finalEmoji,
        image: finalImage,
        isQuickAccess
      });
    }
    setIsModalOpen(false);
  };

  // Live margin preview
  const numCost = parseFloat(costPrice) || 0;
  const numSale = parseFloat(salePrice) || 0;
  const profitMarginPercent = numSale > 0 ? ((numSale - numCost) / numSale) * 100 : 0;

  return (
    <div className="max-w-7xl mx-auto px-3 sm:px-6 py-5 space-y-5">
      {/* Top Stat Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center gap-2 text-slate-500 mb-1">
            <Boxes className="w-4 h-4 text-emerald-600" />
            <span className="text-xs font-bold uppercase tracking-wider">Productos Registrados</span>
          </div>
          <span className="text-2xl font-black font-mono text-slate-900">{totalItemsCount}</span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center gap-2 text-slate-500 mb-1">
            <CircleDollarSign className="w-4 h-4 text-blue-600" />
            <span className="text-xs font-bold uppercase tracking-wider">Valor Inventario (Venta)</span>
          </div>
          <span className="text-2xl font-black font-mono text-slate-900">
            ${inventorySaleValue.toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center gap-2 text-slate-500 mb-1">
            <TrendingUp className="w-4 h-4 text-teal-600" />
            <span className="text-xs font-bold uppercase tracking-wider">Ganancia Proyectada</span>
          </div>
          <span className="text-2xl font-black font-mono text-emerald-600">
            ${potentialProfit.toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </span>
        </div>

        <div
          onClick={() => setFilterLowStockOnly(!filterLowStockOnly)}
          className={`p-4 rounded-2xl border shadow-xs cursor-pointer transition-all ${
            filterLowStockOnly
              ? 'bg-rose-50 border-rose-400 ring-2 ring-rose-400/20'
              : 'bg-white border-slate-200 hover:border-rose-300'
          }`}
        >
          <div className="flex items-center justify-between mb-1">
            <div className="flex items-center gap-2 text-rose-700">
              <AlertTriangle className="w-4 h-4" />
              <span className="text-xs font-bold uppercase tracking-wider">Stock Bajo / Crítico</span>
            </div>
            <span className="text-[10px] font-bold text-rose-600 underline">
              {filterLowStockOnly ? 'Ver todos' : 'Filtrar'}
            </span>
          </div>
          <span className="text-2xl font-black font-mono text-rose-600">{lowStockCount}</span>
        </div>
      </div>

      {/* Action and Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            id="inventory-search-input"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por nombre, código de barras o clave..."
            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-300 rounded-xl text-sm focus:border-emerald-500 focus:bg-white focus:outline-hidden"
          />
        </div>

        {/* Category Pill Filters */}
        <div className="flex items-center gap-2">
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value as ProductCategory | 'all')}
            className="py-2 px-3 bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold text-slate-700 focus:outline-hidden"
          >
            <option value="all">Todas las categorías</option>
            {CATEGORIES.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>

          {/* Google Sheets sync button */}
          {onOpenGoogleSheets && (
            <button
              type="button"
              onClick={onOpenGoogleSheets}
              className="py-2 px-3 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 font-bold text-xs sm:text-sm rounded-xl flex items-center gap-1.5 transition-colors shrink-0 shadow-xs"
              title="Sincronizar inventario con Google Sheets"
            >
              <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
              <span className="hidden md:inline">Google Sheets</span>
            </button>
          )}

          {/* Add product button */}
          <button
            type="button"
            id="btn-add-product"
            onClick={openNewProductModal}
            className="py-2 px-4 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs sm:text-sm rounded-xl flex items-center gap-2 transition-colors shadow-sm shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span>Nuevo Producto</span>
          </button>
        </div>
      </div>

      {/* Products Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs sm:text-sm">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider text-[11px]">
                <th className="py-3 px-4">Producto</th>
                <th className="py-3 px-3">Código</th>
                <th className="py-3 px-3">Categoría</th>
                <th className="py-3 px-3 text-right">Costo</th>
                <th className="py-3 px-3 text-right">Venta</th>
                <th className="py-3 px-3 text-right">Margen</th>
                <th className="py-3 px-4 text-center">Stock Actual</th>
                <th className="py-3 px-4 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredProducts.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400">
                    No se encontraron productos que coincidan con la búsqueda.
                  </td>
                </tr>
              ) : (
                filteredProducts.map((prod) => {
                  const isLow = prod.stock <= prod.minStock;
                  const marginPct =
                    prod.salePrice > 0
                      ? ((prod.salePrice - prod.costPrice) / prod.salePrice) * 100
                      : 0;

                  return (
                    <tr key={prod.id} className="hover:bg-slate-50/80 transition-colors">
                      {/* Product Name */}
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2.5">
                          {prod.image ? (
                            <img
                              src={prod.image}
                              alt={prod.name}
                              className="w-9 h-9 rounded-lg object-cover border border-slate-200 shrink-0 shadow-2xs"
                            />
                          ) : (
                            <span className="text-xl shrink-0">{prod.emoji || '📦'}</span>
                          )}
                          <div>
                            <span className="font-bold text-slate-900 block leading-tight">
                              {prod.name}
                            </span>
                            <div className="flex items-center gap-1.5 mt-0.5">
                              {prod.isBulk && (
                                <span className="text-[10px] bg-amber-100 text-amber-800 px-1.5 py-0.2 rounded font-semibold">
                                  Granel
                                </span>
                              )}
                              {prod.isQuickAccess && (
                                <span className="text-[10px] bg-blue-100 text-blue-800 px-1.5 py-0.2 rounded font-semibold">
                                  Favorito
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Code */}
                      <td className="py-3 px-3 font-mono text-xs text-slate-500">
                        {prod.code}
                      </td>

                      {/* Category */}
                      <td className="py-3 px-3 text-slate-600 font-medium capitalize">
                        {CATEGORIES.find((c) => c.id === prod.category)?.name || prod.category}
                      </td>

                      {/* Cost */}
                      <td className="py-3 px-3 text-right font-mono text-slate-600">
                        ${prod.costPrice.toFixed(2)}
                      </td>

                      {/* Sale Price */}
                      <td className="py-3 px-3 text-right font-mono font-bold text-slate-900">
                        ${prod.salePrice.toFixed(2)}
                      </td>

                      {/* Margin % */}
                      <td className="py-3 px-3 text-right font-mono text-xs font-bold text-emerald-700">
                        {marginPct.toFixed(1)}%
                      </td>

                      {/* Stock */}
                      <td className="py-3 px-4 text-center">
                        <div className="inline-flex items-center gap-1.5">
                          <span
                            className={`px-2.5 py-1 rounded-full text-xs font-black font-mono border ${
                              isLow
                                ? 'bg-rose-100 text-rose-700 border-rose-300'
                                : 'bg-emerald-50 text-emerald-800 border-emerald-200'
                            }`}
                          >
                            {prod.stock} {prod.unit}
                          </span>
                        </div>
                      </td>

                      {/* Actions */}
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1">
                          {/* Quick Add Stock */}
                          <button
                            type="button"
                            onClick={() => {
                              setAdjustingProductId(prod.id);
                              setAdjustQtyInput('10');
                            }}
                            className="p-1.5 text-emerald-700 hover:bg-emerald-50 rounded-lg transition-colors"
                            title="Resurtir inventario"
                          >
                            <PackageCheck className="w-4 h-4" />
                          </button>

                          {/* Edit */}
                          <button
                            type="button"
                            onClick={() => openEditProductModal(prod)}
                            className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                            title="Editar producto"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>

                          {/* Delete */}
                          <button
                            type="button"
                            onClick={() => {
                              if (confirm(`¿Eliminar ${prod.name}?`)) {
                                deleteProduct(prod.id);
                              }
                            }}
                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                            title="Eliminar producto"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Quick Resurtir Stock Modal */}
      {adjustingProductId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-xs w-full p-5 space-y-4">
            <h3 className="font-bold text-base text-slate-900">Resurtir Existencias</h3>
            <p className="text-xs text-slate-500">
              Ingresa la cantidad que llegó del proveedor para sumarla al stock actual:
            </p>
            <div className="flex gap-2">
              <input
                type="number"
                step="1"
                autoFocus
                value={adjustQtyInput}
                onChange={(e) => setAdjustQtyInput(e.target.value)}
                className="w-full text-xl font-bold font-mono py-2 px-3 border border-slate-300 rounded-xl"
              />
            </div>
            <div className="grid grid-cols-3 gap-1.5">
              {[5, 10, 24].map((num) => (
                <button
                  key={num}
                  type="button"
                  onClick={() => setAdjustQtyInput(num.toString())}
                  className="py-1 text-xs font-semibold bg-slate-100 hover:bg-slate-200 rounded-lg"
                >
                  +{num}
                </button>
              ))}
            </div>
            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => setAdjustingProductId(null)}
                className="flex-1 py-2 rounded-xl border border-slate-300 text-xs font-bold text-slate-700"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={() => {
                  const qty = parseFloat(adjustQtyInput) || 0;
                  if (qty !== 0) adjustStock(adjustingProductId, qty);
                  setAdjustingProductId(null);
                }}
                className="flex-1 py-2 bg-emerald-600 text-white rounded-xl text-xs font-bold hover:bg-emerald-700"
              >
                Guardar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add / Edit Product Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-xl w-full overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div
              style={{ backgroundColor: 'var(--header-bg-color, #0f172a)' }}
              className="text-white px-5 py-4 flex items-center justify-between transition-colors duration-200"
            >
              <h2 className="font-extrabold text-base">
                {editingProduct ? 'Editar Producto' : 'Registrar Nuevo Producto'}
              </h2>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="text-slate-300 hover:text-white p-1 rounded-lg hover:bg-white/10 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveProduct} className="p-5 space-y-4 max-h-[80vh] overflow-y-auto">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Code */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Código de Barras / Clave:
                  </label>
                  <input
                    type="text"
                    required
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm font-mono focus:border-emerald-500 focus:bg-white focus:outline-hidden"
                    placeholder="750100010001"
                  />
                </div>

                {/* Category */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Categoría:</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value as ProductCategory)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm focus:border-emerald-500 focus:bg-white focus:outline-hidden"
                  >
                    {CATEGORIES.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Name */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Nombre del Producto:
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm focus:border-emerald-500 focus:bg-white focus:outline-hidden"
                  placeholder="ej. Galletas Marías Gamesa 170g"
                />
              </div>

              {/* Prices & Margins */}
              <div className="grid grid-cols-3 gap-3 bg-slate-50 p-3 rounded-xl border border-slate-200">
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 mb-1">
                    Precio Costo ($):
                  </label>
                  <input
                    type="number"
                    step="0.5"
                    min="0"
                    required
                    value={costPrice}
                    onChange={(e) => setCostPrice(e.target.value)}
                    className="w-full p-2 bg-white border border-slate-300 rounded-lg text-sm font-mono"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 mb-1">
                    Precio Venta ($):
                  </label>
                  <input
                    type="number"
                    step="0.5"
                    min="0"
                    required
                    value={salePrice}
                    onChange={(e) => setSalePrice(e.target.value)}
                    className="w-full p-2 bg-white border border-slate-300 rounded-lg text-sm font-mono font-bold text-emerald-700"
                  />
                </div>
                <div>
                  <span className="block text-[11px] font-bold text-slate-600 mb-1">
                    Margen Utilidad:
                  </span>
                  <div className="p-2 bg-emerald-100/60 rounded-lg text-sm font-mono font-black text-emerald-800 text-center">
                    {profitMarginPercent.toFixed(1)}%
                  </div>
                </div>
              </div>

              {/* Stocks and Units */}
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Stock Actual:
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    required
                    value={stock}
                    onChange={(e) => setStock(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Stock Mínimo (Alerta):
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    required
                    value={minStock}
                    onChange={(e) => setMinStock(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Unidad:</label>
                  <select
                    value={unit}
                    onChange={(e) => setUnit(e.target.value as 'pza' | 'kg' | 'paq' | 'litro')}
                    className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm"
                  >
                    <option value="pza">Pieza (pza)</option>
                    <option value="kg">Kilo (kg)</option>
                    <option value="paq">Paquete (paq)</option>
                    <option value="litro">Litro (l)</option>
                  </select>
                </div>
              </div>

              {/* Identificador Visual: Pestañas Imagen o Emoji libre */}
              <div className="space-y-2.5 pt-2 border-t border-slate-100">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-bold text-slate-700">
                    Icono o Imagen del Producto:
                  </label>
                  {/* Selector de tipo (Imagen o Emoji) */}
                  <div className="inline-flex rounded-lg bg-slate-100 p-0.5 border border-slate-200">
                    <button
                      type="button"
                      onClick={() => setIconType('image')}
                      className={`px-2.5 py-1 text-xs font-bold rounded-md transition-all flex items-center gap-1.5 cursor-pointer ${
                        iconType === 'image'
                          ? 'bg-white text-emerald-700 shadow-2xs'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      <ImageIcon className="w-3.5 h-3.5" />
                      <span>Subir Foto</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setIconType('emoji');
                        if (!emoji) setEmoji('📦');
                      }}
                      className={`px-2.5 py-1 text-xs font-bold rounded-md transition-all flex items-center gap-1.5 cursor-pointer ${
                        iconType === 'emoji'
                          ? 'bg-white text-emerald-700 shadow-2xs'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      <span className="text-xs">😀</span>
                      <span>Usar Emoji</span>
                    </button>
                  </div>
                </div>

                {iconType === 'image' ? (
                  <div className="space-y-2">
                    {image ? (
                      <div className="flex items-center gap-3.5 p-3 bg-slate-50 border border-slate-200 rounded-xl">
                        <img
                          src={image}
                          alt="Vista previa"
                          className="w-16 h-16 object-cover rounded-xl border border-slate-200 shadow-2xs shrink-0"
                        />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <p className="text-xs font-bold text-slate-800">
                              Foto asignada
                            </p>
                            <button
                              type="button"
                              onClick={() => {
                                setImage('');
                                setImageUrlInput('');
                              }}
                              className="text-xs text-rose-600 hover:text-rose-700 font-semibold flex items-center gap-1 cursor-pointer"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                              <span>Quitar</span>
                            </button>
                          </div>
                          <p className="text-[11px] text-slate-500 mt-0.5">
                            Se mostrará en mostrador, tarjetas de cobro y catálogo.
                          </p>
                          <div className="flex items-center gap-2 mt-2">
                            <button
                              type="button"
                              onClick={() => fileInputRef.current?.click()}
                              className="px-2.5 py-1 text-xs font-bold bg-white hover:bg-slate-100 border border-slate-300 rounded-lg text-slate-700 cursor-pointer transition-colors shadow-2xs"
                            >
                              Cambiar foto
                            </button>
                            <button
                              type="button"
                              onClick={() => setShowUrlInput(!showUrlInput)}
                              className="px-2.5 py-1 text-xs font-bold text-emerald-700 hover:bg-emerald-50 rounded-lg transition-colors cursor-pointer"
                            >
                              {showUrlInput ? 'Cerrar URL' : 'Usar URL web'}
                            </button>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        <div
                          onDragOver={(e) => {
                            e.preventDefault();
                            setIsDraggingImage(true);
                          }}
                          onDragLeave={() => setIsDraggingImage(false)}
                          onDrop={handleDropImage}
                          onClick={() => fileInputRef.current?.click()}
                          className={`border-2 border-dashed rounded-xl p-3.5 flex items-center justify-between gap-3 cursor-pointer transition-all ${
                            isDraggingImage
                              ? 'border-emerald-500 bg-emerald-50/70 scale-[1.01]'
                              : 'border-slate-300 hover:border-emerald-500 hover:bg-slate-50'
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
                              <Upload className="w-5 h-5" />
                            </div>
                            <div>
                              <p className="text-xs font-bold text-slate-800">
                                Subir foto del producto
                              </p>
                              <p className="text-[11px] text-slate-500">
                                Arrastra una imagen aquí o haz clic para seleccionarla
                              </p>
                            </div>
                          </div>

                          {emoji && (
                            <div className="text-right shrink-0 bg-slate-100/90 px-2.5 py-1 rounded-lg border border-slate-200">
                              <span className="text-[10px] text-slate-500 block">Emoji actual:</span>
                              <span className="text-lg leading-none">{emoji}</span>
                            </div>
                          )}
                        </div>

                        <div className="flex items-center justify-between text-xs text-slate-500">
                          <button
                            type="button"
                            onClick={() => setShowUrlInput(!showUrlInput)}
                            className="text-emerald-600 hover:text-emerald-700 font-semibold flex items-center gap-1 cursor-pointer"
                          >
                            <LinkIcon className="w-3.5 h-3.5" />
                            <span>{showUrlInput ? 'Ocultar enlace web' : 'O pegar enlace de internet (URL)'}</span>
                          </button>
                        </div>

                        {showUrlInput && (
                          <div className="flex gap-2">
                            <input
                              type="url"
                              placeholder="https://ejemplo.com/foto-producto.jpg"
                              value={imageUrlInput}
                              onChange={(e) => setImageUrlInput(e.target.value)}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                  e.preventDefault();
                                  if (imageUrlInput.trim()) {
                                    setImage(imageUrlInput.trim());
                                    setShowUrlInput(false);
                                  }
                                }
                              }}
                              className="flex-1 p-2 text-xs bg-slate-50 border border-slate-300 rounded-xl"
                            />
                            <button
                              type="button"
                              onClick={() => {
                                if (imageUrlInput.trim()) {
                                  setImage(imageUrlInput.trim());
                                  setShowUrlInput(false);
                                }
                              }}
                              className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl cursor-pointer shrink-0"
                            >
                              Usar URL
                            </button>
                          </div>
                        )}
                      </div>
                    )}

                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) handleImageFile(file);
                        e.target.value = '';
                      }}
                    />
                  </div>
                ) : (
                  /* Modo Emoji: Input libre para cualquier emoji sin lista cerrada */
                  <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
                    <div className="flex items-center gap-3">
                      <div className="w-14 h-14 rounded-xl bg-white border border-slate-300 flex items-center justify-center text-3xl shadow-2xs shrink-0">
                        {emoji || '📦'}
                      </div>
                      <div className="flex-1">
                        <label htmlFor="input-product-emoji" className="block text-xs font-bold text-slate-700 mb-1">
                          Escribe o pega cualquier emoji:
                        </label>
                        <div className="flex items-center gap-2">
                          <input
                            id="input-product-emoji"
                            type="text"
                            value={emoji}
                            onChange={(e) => {
                              const val = e.target.value;
                              setEmoji(val);
                            }}
                            placeholder="Ej. 🍎, 🧀, 🧃..."
                            className="flex-1 p-2 text-base bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 font-sans"
                          />
                          {emoji && emoji !== '📦' && (
                            <button
                              type="button"
                              onClick={() => setEmoji('📦')}
                              className="px-2.5 py-2 text-xs text-slate-600 hover:text-slate-800 bg-white border border-slate-300 rounded-xl font-medium cursor-pointer"
                              title="Restablecer emoji por defecto"
                            >
                              Por defecto
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                    <p className="text-[11px] text-slate-500">
                      Puedes insertar cualquier emoji desde el teclado de tu celular, o presionando <kbd className="px-1 py-0.5 bg-slate-200 rounded text-[10px] font-mono text-slate-700">Win + .</kbd> (Windows) o <kbd className="px-1 py-0.5 bg-slate-200 rounded text-[10px] font-mono text-slate-700">Cmd + Ctrl + Espacio</kbd> (Mac).
                    </p>
                  </div>
                )}
              </div>

              {/* Switches */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 items-center pt-2 border-t border-slate-100">
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="chk-bulk"
                    checked={isBulk}
                    onChange={(e) => setIsBulk(e.target.checked)}
                    className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500"
                  />
                  <label htmlFor="chk-bulk" className="text-xs font-bold text-slate-700">
                    Venta a Granel / Peso
                  </label>
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="chk-quick"
                    checked={isQuickAccess}
                    onChange={(e) => setIsQuickAccess(e.target.checked)}
                    className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500"
                  />
                  <label htmlFor="chk-quick" className="text-xs font-bold text-slate-700">
                    Botón rápido de mostrador
                  </label>
                </div>
              </div>

              <div className="flex gap-3 pt-4 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 py-2.5 rounded-xl border border-slate-300 font-bold text-slate-700 text-sm"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-sm flex items-center justify-center gap-2 shadow-sm"
                >
                  <Check className="w-4 h-4" />
                  <span>{editingProduct ? 'Guardar Cambios' : 'Registrar Producto'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
