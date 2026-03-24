import { useState } from 'react';
import { X } from 'lucide-react';
import type { SearchFilters, PropertyType } from '../../types';
import { AMENITIES_LIST } from '../../mocks/data';
import { Checkbox } from '../ui/Checkbox';
import { RangeSlider } from '../ui/RangeSlider';
import { Button } from '../ui/Button';
import { StarRating } from './StarRating';

interface FilterSidebarProps {
  filters: SearchFilters;
  onChange: (filters: Partial<SearchFilters>) => void;
  onReset: () => void;
  onApply?: () => void;
  className?: string;
}

const propertyTypes: { value: PropertyType; label: string }[] = [
  { value: 'hotel', label: 'Hotel' },
  { value: 'pousada', label: 'Pousada' },
  { value: 'hostel', label: 'Hostel' },
  { value: 'apartamento', label: 'Apartamento' },
  { value: 'resort', label: 'Resort' },
  { value: 'chalé', label: 'Chalé' },
];

export function FilterSidebar({ filters, onChange, onReset, onApply, className }: FilterSidebarProps) {
  const [priceRange, setPriceRange] = useState<[number, number]>([
    filters.minPrice ?? 0,
    filters.maxPrice ?? 2000,
  ]);

  const handlePriceChange = (value: [number, number]) => {
    setPriceRange(value);
    onChange({ minPrice: value[0], maxPrice: value[1] });
  };

  const handleTypeToggle = (type: PropertyType) => {
    onChange({ type: filters.type === type ? undefined : type });
  };

  const handleAmenityToggle = (amenityId: string) => {
    const current = filters.amenities || [];
    const next = current.includes(amenityId)
      ? current.filter((a) => a !== amenityId)
      : [...current, amenityId];
    onChange({ amenities: next.length > 0 ? next : undefined });
  };

  return (
    <div className={className}>
      <div className="flex items-center justify-between mb-6">
        <h3 className="font-semibold text-neutral-800">Filtros</h3>
        <button
          onClick={onReset}
          className="text-xs text-primary hover:underline flex items-center gap-1"
        >
          <X className="w-3 h-3" />
          Limpar tudo
        </button>
      </div>

      {/* Type */}
      <div className="mb-6">
        <h4 className="text-sm font-semibold text-neutral-700 mb-3">Tipo de hospedagem</h4>
        <div className="space-y-2">
          {propertyTypes.map((t) => (
            <Checkbox
              key={t.value}
              label={t.label}
              checked={filters.type === t.value}
              onChange={() => handleTypeToggle(t.value)}
            />
          ))}
        </div>
      </div>

      {/* Price */}
      <div className="mb-6">
        <h4 className="text-sm font-semibold text-neutral-700 mb-4">Preço por noite</h4>
        <RangeSlider
          min={0}
          max={2000}
          value={priceRange}
          onChange={handlePriceChange}
          step={50}
        />
      </div>

      {/* Rating */}
      <div className="mb-6">
        <h4 className="text-sm font-semibold text-neutral-700 mb-3">Avaliação mínima</h4>
        <div className="space-y-2">
          {[4.5, 4, 3.5, 3].map((r) => (
            <button
              key={r}
              onClick={() => onChange({ minRating: filters.minRating === r ? undefined : r })}
              className={`flex items-center gap-2 w-full p-2 rounded-lg transition-colors ${
                filters.minRating === r ? 'bg-primary/10' : 'hover:bg-neutral-100'
              }`}
            >
              <StarRating rating={r} size="sm" />
              <span className="text-xs text-neutral-600">ou mais</span>
            </button>
          ))}
        </div>
      </div>

      {/* Amenities */}
      <div className="mb-6">
        <h4 className="text-sm font-semibold text-neutral-700 mb-3">Comodidades</h4>
        <div className="space-y-2">
          {AMENITIES_LIST.slice(0, 8).map((a) => (
            <Checkbox
              key={a.id}
              label={a.label}
              checked={(filters.amenities || []).includes(a.id)}
              onChange={() => handleAmenityToggle(a.id)}
            />
          ))}
        </div>
      </div>

      {onApply && (
        <Button onClick={onApply} fullWidth className="mt-2">
          Aplicar filtros
        </Button>
      )}
    </div>
  );
}
