import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { portfolioService, type PortfolioResponse, type PortfolioProperty } from '../../../services/portfolio.service';
import { Spinner } from '../../../components/ui/Spinner';

/* ═══════════════════════════════════════════════════════════════════
   PORTFOLIO PAGE — Public + Authenticated views
   /portfolio/:slug
   ═══════════════════════════════════════════════════════════════════ */

export function PortfolioPage() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const [data, setData] = useState<PortfolioResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedProperty, setSelectedProperty] = useState<PortfolioProperty | null>(null);
  const [imageIndex, setImageIndex] = useState(0);

  // Check auth
  const isLoggedIn = (() => {
    try {
      const auth = localStorage.getItem('hbs_auth');
      return auth ? !!JSON.parse(auth)?.token : false;
    } catch { return false; }
  })();

  useEffect(() => {
    if (!slug) return;
    setLoading(true);
    portfolioService.getPortfolio(slug)
      .then(setData)
      .catch(() => setError('Portfolio não encontrado'))
      .finally(() => setLoading(false));
  }, [slug]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <Spinner size="lg" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 px-4">
        <div className="text-6xl mb-4">🏨</div>
        <h1 className="text-2xl font-bold text-gray-800 mb-2">Portfolio não encontrado</h1>
        <p className="text-gray-500 mb-6">O estabelecimento que você procura não existe ou não está disponível.</p>
        <a href="/" className="bg-blue-600 text-white px-6 py-2.5 rounded-lg font-medium hover:bg-blue-700 transition">
          Voltar ao início
        </a>
      </div>
    );
  }

  const { business, properties } = data;

  const whatsappLink = (phone?: string, propertyName?: string) => {
    if (!phone) return '#';
    const clean = phone.replace(/\D/g, '');
    const msg = encodeURIComponent(
      propertyName
        ? `Olá! Tenho interesse na propriedade "${propertyName}" em ${business.tradeName}. Poderia me dar mais informações?`
        : `Olá! Gostaria de saber mais sobre as hospedagens do ${business.tradeName}.`
    );
    return `https://wa.me/${clean}?text=${msg}`;
  };

  const handleReserve = (property: PortfolioProperty) => {
    if (isLoggedIn) {
      navigate(`/booking/${property.id}`);
    } else {
      navigate(`/login?redirect=/booking/${property.id}`);
    }
  };

  const propertyTypeLabel = (type: string) => {
    const map: Record<string, string> = {
      Hotel: '🏨 Hotel', Pousada: '🏠 Pousada', Resort: '🏖️ Resort',
      Hostel: '🛏️ Hostel', Apartment: '🏢 Apartamento', House: '🏡 Casa',
      Cabin: '🏕️ Cabana', Villa: '🏘️ Villa', Chalet: '🏔️ Chalé',
      Camping: '⛺ Camping', Other: '🏢 Outro',
    };
    return map[type] || `🏢 ${type}`;
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* ═══ HERO COVER ═══ */}
      <div className="relative h-72 md:h-96 overflow-hidden">
        <img
          src={business.coverUrl || 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=1200'}
          alt={business.tradeName}
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent" />
        <div className="absolute bottom-0 left-0 right-0 p-6 md:p-10">
          <div className="max-w-6xl mx-auto">
            <div className="flex items-center gap-4 mb-3">
              {business.logoUrl && (
                <img src={business.logoUrl} alt="Logo" className="w-14 h-14 rounded-full border-2 border-white shadow-lg object-cover" />
              )}
              <div>
                <h1 className="text-3xl md:text-4xl font-bold text-white drop-shadow-lg">
                  {business.tradeName}
                </h1>
                <p className="text-white/80 flex items-center gap-2 mt-1">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  {business.city}, {business.state}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ═══ BUSINESS INFO BAR ═══ */}
      <div className="bg-white border-b shadow-sm">
        <div className="max-w-6xl mx-auto px-4 md:px-6 py-4">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              {business.description && (
                <p className="text-gray-600 text-sm md:text-base max-w-2xl">{business.description}</p>
              )}
              <div className="flex flex-wrap gap-4 mt-2 text-xs text-gray-500">
                <span className="flex items-center gap-1">🕐 Check-in: <strong>{business.checkInTime?.slice(0, 5) || '14:00'}</strong></span>
                <span className="flex items-center gap-1">🕐 Check-out: <strong>{business.checkOutTime?.slice(0, 5) || '12:00'}</strong></span>
                <span className="flex items-center gap-1">🏠 <strong>{data.totalProperties}</strong> acomodações</span>
              </div>
            </div>
            <div className="flex gap-3 flex-shrink-0">
              {business.whatsappNumber && (
                <a
                  href={whatsappLink(business.whatsappNumber)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 bg-green-500 hover:bg-green-600 text-white px-5 py-2.5 rounded-lg font-medium transition shadow-sm"
                >
                  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                  </svg>
                  WhatsApp
                </a>
              )}
              {business.phone && (
                <a
                  href={`tel:${business.phone}`}
                  className="flex items-center gap-2 bg-gray-100 hover:bg-gray-200 text-gray-700 px-5 py-2.5 rounded-lg font-medium transition"
                >
                  📞 Ligar
                </a>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ═══ PROPERTIES GRID ═══ */}
      <div className="max-w-6xl mx-auto px-4 md:px-6 py-8">
        <h2 className="text-2xl font-bold text-gray-800 mb-6">
          Nossas Acomodações
        </h2>

        {properties.length === 0 ? (
          <div className="text-center py-16 text-gray-500">
            <div className="text-5xl mb-4">🏠</div>
            <p className="text-lg">Nenhuma acomodação disponível no momento.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {properties.map((property) => (
              <div
                key={property.id}
                className="bg-white rounded-xl overflow-hidden shadow-sm hover:shadow-lg transition-all duration-300 border border-gray-100 group"
              >
                {/* Image carousel */}
                <div
                  className="relative h-56 overflow-hidden cursor-pointer"
                  onClick={() => { setSelectedProperty(property); setImageIndex(0); }}
                >
                  <img
                    src={property.images[0]?.url || 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=600'}
                    alt={property.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  {property.images.length > 1 && (
                    <div className="absolute bottom-2 right-2 bg-black/60 text-white text-xs px-2 py-1 rounded-full">
                      📷 {property.images.length} fotos
                    </div>
                  )}
                  <div className="absolute top-3 left-3">
                    <span className="bg-white/90 backdrop-blur-sm text-gray-700 text-xs font-medium px-2.5 py-1 rounded-full">
                      {propertyTypeLabel(property.type)}
                    </span>
                  </div>
                  {property.isAvailable && (
                    <div className="absolute top-3 right-3">
                      <span className="bg-green-500 text-white text-xs font-bold px-2.5 py-1 rounded-full">
                        Disponível
                      </span>
                    </div>
                  )}
                </div>

                {/* Content */}
                <div className="p-5">
                  <h3 className="text-lg font-bold text-gray-800 mb-1">{property.name}</h3>
                  <p className="text-sm text-gray-500 flex items-center gap-1 mb-3">
                    📍 {property.address.neighborhood}, {property.address.city} - {property.address.state}
                  </p>
                  <p className="text-sm text-gray-600 line-clamp-2 mb-4">{property.description}</p>

                  {/* Amenities */}
                  {property.amenities.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mb-4">
                      {property.amenities.slice(0, 4).map((amenity) => (
                        <span key={amenity} className="bg-blue-50 text-blue-700 text-xs px-2 py-0.5 rounded-full">
                          {amenity}
                        </span>
                      ))}
                      {property.amenities.length > 4 && (
                        <span className="text-xs text-gray-400">+{property.amenities.length - 4}</span>
                      )}
                    </div>
                  )}

                  {/* Rating + Info */}
                  <div className="flex items-center justify-between text-sm text-gray-500 mb-4">
                    <div className="flex items-center gap-3">
                      {property.rating > 0 && (
                        <span className="flex items-center gap-1 text-amber-500 font-semibold">
                          ⭐ {property.rating.toFixed(1)}
                        </span>
                      )}
                      <span>🛏️ {property.totalRooms} quartos</span>
                    </div>
                    <div className="flex items-center gap-1 text-xs">
                      🕐 {property.checkInTime?.slice(0, 5) || '14:00'} - {property.checkOutTime?.slice(0, 5) || '12:00'}
                    </div>
                  </div>

                  {/* Price */}
                  <div className="flex items-end justify-between border-t pt-4">
                    <div>
                      {property.pricePerNight > 0 ? (
                        <>
                          <span className="text-2xl font-bold text-blue-600">
                            R$ {property.pricePerNight.toFixed(0)}
                          </span>
                          <span className="text-sm text-gray-400"> /noite</span>
                        </>
                      ) : (
                        <span className="text-lg font-semibold text-gray-500">Consulte</span>
                      )}
                    </div>
                    <div className="flex gap-2">
                      {(property.whatsappNumber || business.whatsappNumber) && (
                        <a
                          href={whatsappLink(property.whatsappNumber || business.whatsappNumber, property.name)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-1.5 bg-green-500 hover:bg-green-600 text-white px-3 py-2 rounded-lg text-sm font-medium transition"
                          title="Falar no WhatsApp"
                        >
                          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                          </svg>
                        </a>
                      )}
                      <button
                        onClick={() => handleReserve(property)}
                        className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition"
                      >
                        Reservar
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ═══ LIGHTBOX MODAL ═══ */}
      {selectedProperty && (
        <div
          className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4"
          onClick={() => setSelectedProperty(null)}
        >
          <div className="relative max-w-4xl w-full" onClick={(e) => e.stopPropagation()}>
            {/* Close button */}
            <button
              onClick={() => setSelectedProperty(null)}
              className="absolute -top-12 right-0 text-white/80 hover:text-white text-3xl z-10"
            >
              ✕
            </button>

            {/* Image */}
            <img
              src={selectedProperty.images[imageIndex]?.url || 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=1200'}
              alt={selectedProperty.name}
              className="w-full max-h-[70vh] object-contain rounded-lg"
            />

            {/* Nav arrows */}
            {selectedProperty.images.length > 1 && (
              <>
                <button
                  onClick={() => setImageIndex((i) => (i > 0 ? i - 1 : selectedProperty.images.length - 1))}
                  className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white w-10 h-10 rounded-full flex items-center justify-center text-xl"
                >
                  ‹
                </button>
                <button
                  onClick={() => setImageIndex((i) => (i < selectedProperty.images.length - 1 ? i + 1 : 0))}
                  className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white w-10 h-10 rounded-full flex items-center justify-center text-xl"
                >
                  ›
                </button>
              </>
            )}

            {/* Info bar */}
            <div className="bg-white rounded-b-lg p-5 mt-1 rounded-xl">
              <h3 className="text-xl font-bold text-gray-800">{selectedProperty.name}</h3>
              <p className="text-gray-600 text-sm mt-1">{selectedProperty.description}</p>
              <div className="flex items-center gap-4 mt-4">
                {selectedProperty.pricePerNight > 0 && (
                  <span className="text-2xl font-bold text-blue-600">R$ {selectedProperty.pricePerNight.toFixed(0)}<span className="text-sm text-gray-400">/noite</span></span>
                )}
                <div className="flex gap-2 ml-auto">
                  {(selectedProperty.whatsappNumber || business.whatsappNumber) && (
                    <a
                      href={whatsappLink(selectedProperty.whatsappNumber || business.whatsappNumber, selectedProperty.name)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 bg-green-500 hover:bg-green-600 text-white px-5 py-2.5 rounded-lg font-medium transition"
                    >
                      <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                      </svg>
                      WhatsApp
                    </a>
                  )}
                  <button
                    onClick={() => { setSelectedProperty(null); handleReserve(selectedProperty); }}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2.5 rounded-lg font-medium transition"
                  >
                    Reservar agora
                  </button>
                </div>
              </div>

              {/* Thumbnails */}
              {selectedProperty.images.length > 1 && (
                <div className="flex gap-2 mt-4 overflow-x-auto pb-2">
                  {selectedProperty.images.map((img, idx) => (
                    <img
                      key={img.id || idx}
                      src={img.url}
                      alt={img.alt}
                      onClick={() => setImageIndex(idx)}
                      className={`w-16 h-12 object-cover rounded-md cursor-pointer transition ${
                        idx === imageIndex ? 'ring-2 ring-blue-500 opacity-100' : 'opacity-60 hover:opacity-100'
                      }`}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ═══ FLOATING WHATSAPP BUTTON ═══ */}
      {business.whatsappNumber && (
        <a
          href={whatsappLink(business.whatsappNumber)}
          target="_blank"
          rel="noopener noreferrer"
          className="fixed bottom-6 right-6 z-40 bg-green-500 hover:bg-green-600 text-white w-14 h-14 rounded-full flex items-center justify-center shadow-lg hover:shadow-xl transition-all hover:scale-110"
          title="Falar no WhatsApp"
        >
          <svg className="w-7 h-7" viewBox="0 0 24 24" fill="currentColor">
            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
          </svg>
        </a>
      )}

      {/* ═══ FOOTER ═══ */}
      <footer className="bg-gray-800 text-gray-400 py-8 mt-12">
        <div className="max-w-6xl mx-auto px-4 md:px-6 text-center">
          <p className="text-lg font-semibold text-white mb-2">{business.tradeName}</p>
          <p className="text-sm">{business.city}, {business.state}</p>
          {business.email && <p className="text-sm mt-1">📧 {business.email}</p>}
          {business.website && (
            <p className="text-sm mt-1">
              🌐 <a href={business.website} target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:text-blue-300">{business.website}</a>
            </p>
          )}
          <div className="mt-4 pt-4 border-t border-gray-700 text-xs text-gray-500">
            Powered by <a href="/" className="text-blue-400 hover:text-blue-300">HospedaBR</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
