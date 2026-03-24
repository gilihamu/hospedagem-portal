import { Wifi, Waves, Car, Wind, Coffee, Dumbbell, Sparkles, UtensilsCrossed, GlassWater, Umbrella, PawPrint, WashingMachine, BellRing, Tv, Lock, ArrowUpDown } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { cn } from '../../utils/cn';

const iconMap: Record<string, LucideIcon> = {
  wifi: Wifi,
  pool: Waves,
  parking: Car,
  ac: Wind,
  breakfast: Coffee,
  gym: Dumbbell,
  spa: Sparkles,
  restaurant: UtensilsCrossed,
  bar: GlassWater,
  beach_access: Umbrella,
  pet_friendly: PawPrint,
  laundry: WashingMachine,
  room_service: BellRing,
  tv: Tv,
  safe: Lock,
  elevator: ArrowUpDown,
};

const labelMap: Record<string, string> = {
  wifi: 'Wi-Fi',
  pool: 'Piscina',
  parking: 'Estacionamento',
  ac: 'Ar-condicionado',
  breakfast: 'Café da manhã',
  gym: 'Academia',
  spa: 'Spa',
  restaurant: 'Restaurante',
  bar: 'Bar',
  beach_access: 'Acesso à praia',
  pet_friendly: 'Pet friendly',
  laundry: 'Lavanderia',
  room_service: 'Room service',
  tv: 'TV a cabo',
  safe: 'Cofre',
  elevator: 'Elevador',
};

interface AmenityListProps {
  amenities: string[];
  max?: number;
  className?: string;
}

export function AmenityList({ amenities, max, className }: AmenityListProps) {
  const displayed = max ? amenities.slice(0, max) : amenities;
  const remaining = max && amenities.length > max ? amenities.length - max : 0;

  return (
    <div className={cn('grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3', className)}>
      {displayed.map((id) => {
        const Icon = iconMap[id];
        const label = labelMap[id] || id;
        return (
          <div key={id} className="flex items-center gap-2 p-2.5 bg-surface-muted rounded-lg text-sm text-neutral-700">
            {Icon && <Icon className="w-4 h-4 text-primary flex-shrink-0" />}
            <span className="truncate">{label}</span>
          </div>
        );
      })}
      {remaining > 0 && (
        <div className="flex items-center gap-2 p-2.5 bg-surface-muted rounded-lg text-sm text-neutral-500">
          +{remaining} mais
        </div>
      )}
    </div>
  );
}
