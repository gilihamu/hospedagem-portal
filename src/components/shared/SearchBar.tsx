import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, MapPin, Calendar, Users } from 'lucide-react';
import { Button } from '../ui/Button';
import { cn } from '../../utils/cn';
import { ROUTES } from '../../router/routes';
import { format } from 'date-fns';

interface SearchBarProps {
  className?: string;
  initialValues?: {
    city?: string;
    checkIn?: string;
    checkOut?: string;
    guests?: number;
  };
  variant?: 'hero' | 'compact';
}

export function SearchBar({ className, initialValues, variant = 'hero' }: SearchBarProps) {
  const [city, setCity] = useState(initialValues?.city || '');
  const [checkIn, setCheckIn] = useState(initialValues?.checkIn || '');
  const [checkOut, setCheckOut] = useState(initialValues?.checkOut || '');
  const [guests, setGuests] = useState(initialValues?.guests || 1);
  const navigate = useNavigate();

  const handleSearch = () => {
    const params = new URLSearchParams();
    if (city) params.set('city', city);
    if (checkIn) params.set('checkIn', checkIn);
    if (checkOut) params.set('checkOut', checkOut);
    if (guests > 1) params.set('guests', String(guests));
    navigate(`${ROUTES.SEARCH}?${params.toString()}`);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleSearch();
  };

  if (variant === 'compact') {
    return (
      <div className={cn('flex items-center gap-2 bg-white rounded-xl border border-surface-border shadow-card p-2', className)}>
        <div className="flex items-center gap-2 flex-1 px-2">
          <MapPin className="w-4 h-4 text-neutral-400 flex-shrink-0" />
          <input
            type="text"
            value={city}
            onChange={(e) => setCity(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Destino..."
            className="flex-1 text-sm outline-none placeholder-neutral-400"
          />
        </div>
        <Button size="sm" onClick={handleSearch} leftIcon={<Search className="w-4 h-4" />}>
          Buscar
        </Button>
      </div>
    );
  }

  return (
    <div className={cn('w-full', className)}>
      <div className="bg-white rounded-2xl shadow-xl p-2 flex flex-col sm:flex-row gap-2">
        {/* Destination */}
        <div className="flex-1 flex items-center gap-2 px-4 py-2 rounded-xl hover:bg-surface-muted transition-colors border border-transparent hover:border-surface-border">
          <MapPin className="w-5 h-5 text-primary flex-shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold text-neutral-500 mb-0.5">Destino</p>
            <input
              type="text"
              value={city}
              onChange={(e) => setCity(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Destino, cidade..."
              className="w-full text-sm text-neutral-800 outline-none placeholder-neutral-400 bg-transparent"
            />
          </div>
        </div>

        <div className="hidden sm:block w-px bg-surface-border self-stretch" />

        {/* Check-in */}
        <div className="flex-1 flex items-center gap-2 px-4 py-2 rounded-xl hover:bg-surface-muted transition-colors border border-transparent hover:border-surface-border">
          <Calendar className="w-5 h-5 text-primary flex-shrink-0" />
          <div className="flex-1">
            <p className="text-xs font-semibold text-neutral-500 mb-0.5">Check-in</p>
            <input
              type="date"
              value={checkIn}
              onChange={(e) => setCheckIn(e.target.value)}
              min={format(new Date(), 'yyyy-MM-dd')}
              className="w-full text-sm text-neutral-800 outline-none bg-transparent cursor-pointer"
            />
          </div>
        </div>

        <div className="hidden sm:block w-px bg-surface-border self-stretch" />

        {/* Check-out */}
        <div className="flex-1 flex items-center gap-2 px-4 py-2 rounded-xl hover:bg-surface-muted transition-colors border border-transparent hover:border-surface-border">
          <Calendar className="w-5 h-5 text-primary flex-shrink-0" />
          <div className="flex-1">
            <p className="text-xs font-semibold text-neutral-500 mb-0.5">Check-out</p>
            <input
              type="date"
              value={checkOut}
              onChange={(e) => setCheckOut(e.target.value)}
              min={checkIn || format(new Date(), 'yyyy-MM-dd')}
              className="w-full text-sm text-neutral-800 outline-none bg-transparent cursor-pointer"
            />
          </div>
        </div>

        <div className="hidden sm:block w-px bg-surface-border self-stretch" />

        {/* Guests */}
        <div className="flex items-center gap-2 px-4 py-2 rounded-xl hover:bg-surface-muted transition-colors border border-transparent hover:border-surface-border">
          <Users className="w-5 h-5 text-primary flex-shrink-0" />
          <div>
            <p className="text-xs font-semibold text-neutral-500 mb-0.5">Hóspedes</p>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setGuests((g) => Math.max(1, g - 1))}
                className="w-5 h-5 rounded-full border border-neutral-300 flex items-center justify-center text-xs hover:border-primary hover:text-primary transition-colors"
              >
                -
              </button>
              <span className="text-sm font-medium text-neutral-800 w-4 text-center">{guests}</span>
              <button
                type="button"
                onClick={() => setGuests((g) => g + 1)}
                className="w-5 h-5 rounded-full border border-neutral-300 flex items-center justify-center text-xs hover:border-primary hover:text-primary transition-colors"
              >
                +
              </button>
            </div>
          </div>
        </div>

        {/* Search button */}
        <Button
          onClick={handleSearch}
          size="lg"
          className="rounded-xl sm:w-auto"
          leftIcon={<Search className="w-5 h-5" />}
        >
          Buscar
        </Button>
      </div>
    </div>
  );
}
