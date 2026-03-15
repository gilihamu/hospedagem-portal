import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { SlidersHorizontal} from 'lucide-react';
import { SearchBar } from '../../../components/shared/SearchBar';
import { PropertyCard } from '../../../components/shared/PropertyCard';
import { PropertyCardSkeleton } from '../../../components/shared/PropertyCardSkeleton';
import { FilterSidebar } from '../../../components/shared/FilterSidebar';
import { EmptyState } from '../../../components/ui/EmptyState';
import { Select } from '../../../components/ui/Select';
import { Button } from '../../../components/ui/Button';
import { Modal } from '../../../components/ui/Modal';
import { useSearchStore } from '../../../store/search.store';
import { useProperties } from '../../../hooks/useProperties';
import { Building2 } from 'lucide-react';
import type { SearchFilters } from '../../../types';

const sortOptions = [
  { value: 'relevance', label: 'Relevância' },
  { value: 'price_asc', label: 'Menor preço' },
  { value: 'price_desc', label: 'Maior preço' },
  { value: 'rating', label: 'Maior avaliação' },
];

export function SearchPage() {
  const [searchParams] = useSearchParams();
  const { filters, setFilters, resetFilters } = useSearchStore();
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);

  // Initialize from URL params
  useEffect(() => {
    const urlFilters: Partial<SearchFilters> = {};
    const city = searchParams.get('city');
    const checkIn = searchParams.get('checkIn');
    const checkOut = searchParams.get('checkOut');
    const guests = searchParams.get('guests');
    const type = searchParams.get('type');
    if (city) urlFilters.city = city;
    if (checkIn) urlFilters.checkIn = checkIn;
    if (checkOut) urlFilters.checkOut = checkOut;
    if (guests) urlFilters.guests = Number(guests);
    if (type) urlFilters.type = type as SearchFilters['type'];
    setFilters(urlFilters);
  }, [searchParams, setFilters]);

  const { data: properties, isLoading } = useProperties(filters);

  return (
    <div className="container-app py-6">
      {/* Top search bar */}
      <div className="mb-6">
        <SearchBar
          variant="compact"
          initialValues={{
            city: filters.city,
            checkIn: filters.checkIn,
            checkOut: filters.checkOut,
            guests: filters.guests,
          }}
        />
      </div>

      <div className="flex items-center justify-between mb-6">
        <p className="text-sm text-neutral-500">
          {isLoading ? 'Buscando...' : (
            <span>
              <span className="font-semibold text-neutral-800">{properties?.length || 0}</span> hospedagens encontradas
              {filters.city && <span> em <span className="font-semibold">{filters.city}</span></span>}
            </span>
          )}
        </p>

        <div className="flex items-center gap-3">
          <Select
            options={sortOptions}
            value={filters.sortBy || 'relevance'}
            onChange={(e) => setFilters({ sortBy: e.target.value as SearchFilters['sortBy'] })}
            className="text-sm h-9 py-0"
          />
          <Button
            variant="outline"
            size="sm"
            onClick={() => setMobileFiltersOpen(true)}
            leftIcon={<SlidersHorizontal className="w-4 h-4" />}
            className="lg:hidden"
          >
            Filtros
          </Button>
        </div>
      </div>

      <div className="flex gap-6">
        {/* Desktop sidebar */}
        <aside className="hidden lg:block w-72 flex-shrink-0">
          <div className="card-base p-5 sticky top-24">
            <FilterSidebar
              filters={filters}
              onChange={(f) => setFilters(f)}
              onReset={resetFilters}
            />
          </div>
        </aside>

        {/* Results */}
        <div className="flex-1 min-w-0">
          {isLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
              {Array.from({ length: 6 }).map((_, i) => <PropertyCardSkeleton key={i} />)}
            </div>
          ) : !properties || properties.length === 0 ? (
            <EmptyState
              icon={Building2}
              title="Nenhuma hospedagem encontrada"
              description="Tente ajustar os filtros ou buscar em outro destino."
              action={{ label: 'Limpar filtros', onClick: resetFilters }}
            />
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
              {properties.map((property) => (
                <PropertyCard key={property.id} property={property} />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Mobile filters modal */}
      <Modal
        isOpen={mobileFiltersOpen}
        onClose={() => setMobileFiltersOpen(false)}
        title="Filtros"
        size="md"
      >
        <FilterSidebar
          filters={filters}
          onChange={(f) => setFilters(f)}
          onReset={() => { resetFilters(); setMobileFiltersOpen(false); }}
          onApply={() => setMobileFiltersOpen(false)}
        />
      </Modal>
    </div>
  );
}
