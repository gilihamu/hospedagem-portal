import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { MapPin, Star, Users, BedDouble, Bath, ChevronRight, MessageSquare, ShieldCheck } from 'lucide-react';
import { useProperty } from '../../../hooks/useProperties';
import { ImageGallery } from '../../../components/shared/ImageGallery';
import { AmenityList } from '../../../components/shared/AmenityList';
import { BookingWidget } from '../../../components/shared/BookingWidget';
import { StarRating } from '../../../components/shared/StarRating';
import { Avatar } from '../../../components/ui/Avatar';
import { Badge } from '../../../components/ui/Badge';
import { Spinner } from '../../../components/ui/Spinner';
import { Button } from '../../../components/ui/Button';
import { ROUTES } from '../../../router/routes';
import { formatDate, truncate } from '../../../utils/formatters';
import { mockUsers } from '../../../mocks/data';
import type { PropertyReview } from '../../../types';

const typeLabels: Record<string, string> = {
  hotel: 'Hotel', pousada: 'Pousada', hostel: 'Hostel',
  apartamento: 'Apartamento', resort: 'Resort', 'chalé': 'Chalé',
};

// Mock reviews
function getMockReviews(propertyId: string): PropertyReview[] {
  return [
    {
      id: `rev1-${propertyId}`,
      propertyId,
      userId: 'u4',
      userName: 'João Silva',
      userAvatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=joao',
      rating: 5,
      comment: 'Excelente hospedagem! Tudo como descrito, equipe muito atenciosa. Voltarei com certeza.',
      createdAt: '2026-01-15T00:00:00Z',
    },
    {
      id: `rev2-${propertyId}`,
      propertyId,
      userId: 'u5',
      userName: 'Maria Santos',
      userAvatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=maria',
      rating: 4,
      comment: 'Muito bom! Localização perfeita e ótimo custo-benefício. Recomendo para quem busca conforto.',
      createdAt: '2026-02-10T00:00:00Z',
    },
    {
      id: `rev3-${propertyId}`,
      propertyId,
      userId: 'u4',
      userName: 'Carlos Fernandes',
      userAvatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=carlosf',
      rating: 5,
      comment: 'Superou minhas expectativas. Café da manhã delicioso e quartos impecáveis.',
      createdAt: '2026-02-28T00:00:00Z',
    },
  ];
}

export function PropertyDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { data: property, isLoading } = useProperty(id || '');
  const [showFullDesc, setShowFullDesc] = useState(false);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Spinner size="lg" />
      </div>
    );
  }

  if (!property) {
    return (
      <div className="container-app py-16 text-center">
        <h2 className="text-2xl font-bold text-neutral-800 mb-4">Propriedade não encontrada</h2>
        <Link to={ROUTES.SEARCH}><Button>Voltar à busca</Button></Link>
      </div>
    );
  }

  const owner = mockUsers.find((u) => u.id === property.ownerId);
  const reviews = getMockReviews(property.id);

  return (
    <div className="container-app py-6">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-1.5 text-sm text-neutral-500 mb-4">
        <Link to={ROUTES.HOME} className="hover:text-primary">Início</Link>
        <ChevronRight className="w-3.5 h-3.5" />
        <Link to={ROUTES.SEARCH} className="hover:text-primary">Buscar</Link>
        <ChevronRight className="w-3.5 h-3.5" />
        <span className="text-neutral-800 font-medium truncate max-w-48">{property.name}</span>
      </nav>

      {/* Gallery */}
      <ImageGallery images={property.images} propertyName={property.name} />

      <div className="mt-8 grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left - Details */}
        <div className="lg:col-span-2 space-y-8">
          {/* Header */}
          <div>
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <Badge variant="primary">{typeLabels[property.type] || property.type}</Badge>
                </div>
                <h1 className="text-2xl sm:text-3xl font-bold text-neutral-900">{property.name}</h1>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-4 mt-3 text-sm text-neutral-600">
              <div className="flex items-center gap-1">
                <MapPin className="w-4 h-4 text-neutral-400" />
                {property.address.city}, {property.address.state}
              </div>
              <div className="flex items-center gap-1">
                <Star className="w-4 h-4 fill-accent text-accent" />
                <span className="font-semibold text-neutral-800">{property.rating.toFixed(1)}</span>
                <span className="text-neutral-400">({property.totalReviews} avaliações)</span>
              </div>
            </div>

            <div className="flex flex-wrap gap-4 mt-4 text-sm text-neutral-600">
              <span className="flex items-center gap-1.5"><Users className="w-4 h-4 text-primary" /> {property.maxGuests} hóspedes</span>
              <span className="flex items-center gap-1.5"><BedDouble className="w-4 h-4 text-primary" /> {property.bedrooms} quarto{property.bedrooms > 1 ? 's' : ''}</span>
              <span className="flex items-center gap-1.5"><Bath className="w-4 h-4 text-primary" /> {property.bathrooms} banheiro{property.bathrooms > 1 ? 's' : ''}</span>
            </div>
          </div>

          {/* Description */}
          <div>
            <h2 className="text-lg font-bold text-neutral-800 mb-3">Sobre a hospedagem</h2>
            <p className="text-neutral-600 leading-relaxed text-sm">
              {showFullDesc ? property.description : truncate(property.description, 200)}
            </p>
            {property.description.length > 200 && (
              <button
                onClick={() => setShowFullDesc((s) => !s)}
                className="text-sm text-primary font-medium hover:underline mt-2"
              >
                {showFullDesc ? 'Ver menos' : 'Ver mais'}
              </button>
            )}
          </div>

          {/* Amenities */}
          <div>
            <h2 className="text-lg font-bold text-neutral-800 mb-4">Comodidades</h2>
            <AmenityList amenities={property.amenities} />
          </div>

          {/* Host */}
          {owner && (
            <div className="card-base p-5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <Avatar src={owner.avatar} name={owner.name} size="lg" />
                  <div>
                    <h3 className="font-semibold text-neutral-800">{owner.name}</h3>
                    <p className="text-sm text-neutral-500">Anfitrião desde {formatDate(owner.createdAt)}</p>
                    {owner.verified && (
                      <div className="flex items-center gap-1 mt-1 text-xs text-success">
                        <ShieldCheck className="w-3.5 h-3.5" />
                        Identidade verificada
                      </div>
                    )}
                  </div>
                </div>
                <Link to={ROUTES.MESSAGES}>
                  <Button variant="outline" size="sm" leftIcon={<MessageSquare className="w-4 h-4" />}>
                    Mensagem
                  </Button>
                </Link>
              </div>
              {owner.bio && <p className="text-sm text-neutral-600 mt-4 leading-relaxed">{owner.bio}</p>}
            </div>
          )}

          {/* Reviews */}
          <div>
            <div className="flex items-center gap-3 mb-6">
              <h2 className="text-lg font-bold text-neutral-800">Avaliações</h2>
              <div className="flex items-center gap-2">
                <span className="text-3xl font-extrabold text-neutral-900">{property.rating.toFixed(1)}</span>
                <div>
                  <StarRating rating={property.rating} size="sm" />
                  <p className="text-xs text-neutral-400 mt-0.5">{property.totalReviews} avaliações</p>
                </div>
              </div>
            </div>

            <div className="space-y-5">
              {reviews.map((review) => (
                <div key={review.id} className="border-b border-surface-border pb-5 last:border-0">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <Avatar src={review.userAvatar} name={review.userName} size="sm" />
                      <div>
                        <p className="text-sm font-semibold text-neutral-800">{review.userName}</p>
                        <p className="text-xs text-neutral-400">{formatDate(review.createdAt)}</p>
                      </div>
                    </div>
                    <StarRating rating={review.rating} size="sm" />
                  </div>
                  <p className="text-sm text-neutral-600 leading-relaxed">{review.comment}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right - Booking Widget */}
        <div className="lg:col-span-1">
          <BookingWidget property={property} />
        </div>
      </div>
    </div>
  );
}
