import { Link } from 'react-router-dom';
import { ShieldCheck, Lock, Headphones, Star, Building2, BedDouble, Users } from 'lucide-react';
import { SearchBar } from '../../../components/shared/SearchBar';
import { PropertyCard } from '../../../components/shared/PropertyCard';
import { PropertyCardSkeleton } from '../../../components/shared/PropertyCardSkeleton';
import { StarRating } from '../../../components/shared/StarRating';
import { Button } from '../../../components/ui/Button';
import { Avatar } from '../../../components/ui/Avatar';
import { useFeaturedProperties } from '../../../hooks/useProperties';
import { ROUTES } from '../../../router/routes';
import { cn } from '../../../utils/cn';

const cities = [
  { name: 'Rio de Janeiro', state: 'RJ', count: 248, gradient: 'from-blue-900 to-blue-600' },
  { name: 'São Paulo', state: 'SP', count: 312, gradient: 'from-neutral-900 to-neutral-600' },
  { name: 'Florianópolis', state: 'SC', count: 156, gradient: 'from-teal-900 to-teal-600' },
  { name: 'Salvador', state: 'BA', count: 98, gradient: 'from-orange-900 to-orange-600' },
  { name: 'Gramado', state: 'RS', count: 67, gradient: 'from-green-900 to-green-700' },
  { name: 'Búzios', state: 'RJ', count: 45, gradient: 'from-sky-900 to-sky-600' },
  { name: 'Fortaleza', state: 'CE', count: 134, gradient: 'from-amber-900 to-amber-600' },
  { name: 'Bonito', state: 'MS', count: 38, gradient: 'from-emerald-900 to-emerald-600' },
];

const propertyTypeCards = [
  { type: 'hotel', label: 'Hotéis', icon: Building2, count: '120+' },
  { type: 'pousada', label: 'Pousadas', icon: BedDouble, count: '85+' },
  { type: 'hostel', label: 'Hostels', icon: Users, count: '40+' },
  { type: 'apartamento', label: 'Apartamentos', icon: Building2, count: '65+' },
];

const testimonials = [
  {
    id: 1,
    name: 'Fernanda Oliveira',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=fernanda',
    rating: 5,
    comment: 'Experiência incrível! Encontrei a pousada perfeita em Florianópolis através do HospedaBR. O processo de reserva foi muito simples.',
    location: 'São Paulo, SP',
  },
  {
    id: 2,
    name: 'Ricardo Almeida',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=ricardo',
    rating: 5,
    comment: 'Plataforma excelente! Os filtros de busca me ajudaram a encontrar exatamente o que eu precisava dentro do meu orçamento.',
    location: 'Belo Horizonte, MG',
  },
  {
    id: 3,
    name: 'Camila Santos',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=camila',
    rating: 4,
    comment: 'Muito satisfeita com o suporte. Tive um problema com a reserva e a equipe resolveu rapidamente. Recomendo!',
    location: 'Porto Alegre, RS',
  },
];

export function HomePage() {
  const { data: featured, isLoading: featuredLoading } = useFeaturedProperties();

  return (
    <div>
      {/* Hero */}
      <section className="relative min-h-[85vh] flex flex-col items-center justify-center bg-gradient-to-br from-primary-dark via-primary to-primary-light overflow-hidden">
        {/* Background pattern */}
        <div
          className="absolute inset-0 opacity-10"
          style={{
            backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)',
            backgroundSize: '40px 40px',
          }}
        />

        <div className="relative z-10 container-app text-center py-20">
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-white mb-4 leading-tight">
            Encontre a hospedagem
            <br />
            <span className="text-accent">perfeita</span> no Brasil
          </h1>
          <p className="text-white/70 text-lg sm:text-xl mb-10 max-w-xl mx-auto">
            Mais de 800 propriedades verificadas em todo o país. Reserve com segurança e confiança.
          </p>

          <div className="max-w-3xl mx-auto">
            <SearchBar />
          </div>

          <div className="flex flex-wrap justify-center gap-6 mt-10">
            {['800+ Propriedades', '15.000+ Viajantes', '4.8★ Avaliação média'].map((stat) => (
              <div key={stat} className="text-white/80 text-sm font-medium">
                ✓ {stat}
              </div>
            ))}
          </div>
        </div>

        {/* Wave separator */}
        <div className="absolute bottom-0 left-0 right-0">
          <svg viewBox="0 0 1440 80" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M0 80L60 74.7C120 69.3 240 58.7 360 53.3C480 48 600 48 720 53.3C840 58.7 960 69.3 1080 69.3C1200 69.3 1320 58.7 1380 53.3L1440 48V80H1380C1320 80 1200 80 1080 80C960 80 840 80 720 80C600 80 480 80 360 80C240 80 120 80 60 80H0Z" fill="rgb(248,249,250)" />
          </svg>
        </div>
      </section>

      {/* Featured Properties */}
      <section className="py-16 container-app">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-2xl sm:text-3xl font-bold text-neutral-900">Hospedagens em Destaque</h2>
            <p className="text-neutral-500 mt-1">As melhores opções, selecionadas para você</p>
          </div>
          <Link to={ROUTES.SEARCH}>
            <Button variant="outline" size="sm">Ver todas</Button>
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {featuredLoading
            ? Array.from({ length: 6 }).map((_, i) => <PropertyCardSkeleton key={i} />)
            : featured?.map((property) => (
                <PropertyCard key={property.id} property={property} />
              ))}
        </div>
      </section>

      {/* City Grid */}
      <section className="py-16 bg-white">
        <div className="container-app">
          <h2 className="text-2xl sm:text-3xl font-bold text-neutral-900 mb-2">
            Explore os destinos mais procurados
          </h2>
          <p className="text-neutral-500 mb-8">Descubra o Brasil com o HospedaBR</p>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
            {cities.map((city) => (
              <Link
                key={city.name}
                to={`${ROUTES.SEARCH}?city=${encodeURIComponent(city.name)}`}
                className={cn(
                  'relative rounded-2xl overflow-hidden h-28 sm:h-36 flex flex-col items-center justify-center text-center p-4 group transition-transform hover:scale-[1.02] bg-gradient-to-br',
                  city.gradient
                )}
              >
                <h3 className="font-bold text-white text-sm sm:text-base leading-tight">{city.name}</h3>
                <p className="text-white/70 text-xs mt-0.5">{city.count} hospedagens</p>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Property Types */}
      <section className="py-16 container-app">
        <h2 className="text-2xl sm:text-3xl font-bold text-neutral-900 mb-2">Tipos de hospedagem</h2>
        <p className="text-neutral-500 mb-8">Encontre o estilo perfeito para sua viagem</p>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {propertyTypeCards.map((card) => (
            <Link
              key={card.type}
              to={`${ROUTES.SEARCH}?type=${card.type}`}
              className="card-base p-6 text-center hover:shadow-card-hover hover:-translate-y-1 transition-all duration-200 group"
            >
              <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center mx-auto mb-3 group-hover:bg-primary/20 transition-colors">
                <card.icon className="w-6 h-6 text-primary" />
              </div>
              <h3 className="font-semibold text-neutral-800">{card.label}</h3>
              <p className="text-sm text-neutral-400 mt-0.5">{card.count} opções</p>
            </Link>
          ))}
        </div>
      </section>

      {/* Why Us */}
      <section className="py-16 bg-white">
        <div className="container-app">
          <h2 className="text-2xl sm:text-3xl font-bold text-neutral-900 mb-2 text-center">
            Por que escolher o HospedaBR?
          </h2>
          <p className="text-neutral-500 text-center mb-12">Segurança e conforto em cada reserva</p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-success-light rounded-2xl flex items-center justify-center mx-auto mb-4">
                <ShieldCheck className="w-8 h-8 text-success" />
              </div>
              <h3 className="font-bold text-neutral-800 mb-2">Propriedades Verificadas</h3>
              <p className="text-sm text-neutral-500">Todas as hospedagens passam por um rigoroso processo de verificação antes de aparecer na plataforma.</p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Lock className="w-8 h-8 text-primary" />
              </div>
              <h3 className="font-bold text-neutral-800 mb-2">Pagamento Seguro</h3>
              <p className="text-sm text-neutral-500">Suas informações financeiras são protegidas com a mais alta tecnologia de segurança disponível.</p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-accent/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Headphones className="w-8 h-8 text-accent" />
              </div>
              <h3 className="font-bold text-neutral-800 mb-2">Suporte 24/7</h3>
              <p className="text-sm text-neutral-500">Nossa equipe está sempre disponível para ajudar você antes, durante e após sua estadia.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-16 bg-surface-muted">
        <div className="container-app">
          <h2 className="text-2xl sm:text-3xl font-bold text-neutral-900 mb-2 text-center">
            O que nossos viajantes dizem
          </h2>
          <p className="text-neutral-500 text-center mb-10">Mais de 15.000 avaliações positivas</p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {testimonials.map((t) => (
              <div key={t.id} className="card-base p-6">
                <div className="flex items-center gap-3 mb-4">
                  <Avatar src={t.avatar} name={t.name} size="md" />
                  <div>
                    <p className="font-semibold text-neutral-800 text-sm">{t.name}</p>
                    <p className="text-xs text-neutral-400">{t.location}</p>
                  </div>
                </div>
                <StarRating rating={t.rating} size="sm" className="mb-3" />
                <p className="text-sm text-neutral-600 leading-relaxed">{t.comment}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 bg-primary-dark">
        <div className="container-app text-center">
          <div className="inline-flex items-center gap-2 bg-white/10 text-white/80 text-sm px-4 py-1.5 rounded-full mb-6">
            <Star className="w-4 h-4 text-accent" />
            Junte-se a mais de 2.000 anfitriões
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-white mb-4">
            Anuncie sua hospedagem
          </h2>
          <p className="text-white/70 text-lg mb-8 max-w-lg mx-auto">
            Transforme seu imóvel em renda. Cadastre-se gratuitamente e alcance milhares de viajantes.
          </p>
          <Link to={ROUTES.REGISTER}>
            <Button variant="accent" size="lg">
              Começar agora
            </Button>
          </Link>
        </div>
      </section>
    </div>
  );
}
