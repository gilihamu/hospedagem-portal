import { Link } from 'react-router-dom';
import { MapPin, Star, Heart } from 'lucide-react';
import { useState } from 'react';
import type { Property } from '../../types';
import { Badge } from '../ui/Badge';
import { cn } from '../../utils/cn';
import { formatCurrency } from '../../utils/formatters';
import { propertyRoute } from '../../router/routes';

const typeLabels: Record<string, string> = {
  hotel: 'Hotel',
  pousada: 'Pousada',
  hostel: 'Hostel',
  apartamento: 'Apartamento',
  resort: 'Resort',
  'chalé': 'Chalé',
};

interface PropertyCardProps {
  property: Property;
  className?: string;
}

export function PropertyCard({ property, className }: PropertyCardProps) {
  const [liked, setLiked] = useState(false);
  const primaryImage = property.images.find((i) => i.isPrimary) || property.images[0];

  return (
    <div
      className={cn(
        'card-base overflow-hidden group cursor-pointer transition-all duration-200 hover:shadow-card-hover hover:-translate-y-1',
        className
      )}
    >
      {/* Image */}
      <div className="relative aspect-video overflow-hidden bg-neutral-200">
        {primaryImage && (
          <img
            src={primaryImage.url}
            alt={primaryImage.alt}
            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
            loading="lazy"
          />
        )}
        {/* Type badge */}
        <div className="absolute top-3 left-3">
          <Badge variant="default" className="bg-white/90 backdrop-blur-sm text-neutral-700 shadow-sm">
            {typeLabels[property.type] || property.type}
          </Badge>
        </div>
        {/* Heart */}
        <button
          onClick={(e) => { e.preventDefault(); setLiked((l) => !l); }}
          className="absolute top-3 right-3 p-1.5 bg-white/90 backdrop-blur-sm rounded-full shadow-sm transition-transform hover:scale-110"
        >
          <Heart
            className={cn('w-4 h-4 transition-colors', liked ? 'fill-error text-error' : 'text-neutral-500')}
          />
        </button>
      </div>

      {/* Content */}
      <Link to={propertyRoute(property.id)} className="block p-4">
        <div className="flex items-start justify-between gap-2 mb-1">
          <h3 className="font-semibold text-neutral-900 text-sm leading-tight truncate">{property.name}</h3>
        </div>
        <div className="flex items-center gap-1 text-neutral-500 text-xs mb-3">
          <MapPin className="w-3 h-3 flex-shrink-0" />
          <span className="truncate">{property.address.city}, {property.address.state}</span>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1">
            <Star className="w-3.5 h-3.5 fill-accent text-accent" />
            <span className="text-sm font-semibold text-neutral-800">{property.rating.toFixed(1)}</span>
            <span className="text-xs text-neutral-400">({property.totalReviews})</span>
          </div>
          <div className="text-right">
            <span className="text-base font-bold text-primary">{formatCurrency(property.pricePerNight)}</span>
            <span className="text-xs text-neutral-400"> /noite</span>
          </div>
        </div>

        <p className="mt-3 text-xs text-primary font-medium hover:underline">Ver detalhes →</p>
      </Link>
    </div>
  );
}
