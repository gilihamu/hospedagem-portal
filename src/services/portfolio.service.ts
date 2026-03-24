import { api } from '../lib/api';

const USE_API = !!import.meta.env.VITE_API_URL;

export interface PortfolioBusinessInfo {
  id: string;
  name: string;
  tradeName: string;
  logoUrl?: string;
  coverUrl?: string;
  description?: string;
  whatsappNumber?: string;
  phone?: string;
  email?: string;
  website?: string;
  city: string;
  state: string;
  checkInTime: string;
  checkOutTime: string;
}

export interface PortfolioAddress {
  city: string;
  state: string;
  neighborhood: string;
}

export interface PortfolioImage {
  id: string;
  url: string;
  alt: string;
  isPrimary: boolean;
}

export interface PortfolioProperty {
  id: string;
  name: string;
  slug: string;
  type: string;
  description: string;
  address: PortfolioAddress;
  images: PortfolioImage[];
  amenities: string[];
  pricePerNight: number;
  maxGuests: number;
  bedrooms: number;
  bathrooms: number;
  rating: number;
  totalReviews: number;
  whatsappNumber?: string;
  checkInTime?: string;
  checkOutTime?: string;
  totalRooms: number;
  isAvailable: boolean;
}

export interface PortfolioResponse {
  business: PortfolioBusinessInfo;
  properties: PortfolioProperty[];
  totalProperties: number;
}

// Mock data for offline/dev
const mockPortfolio: PortfolioResponse = {
  business: {
    id: 'a0a00001-0000-0000-0000-000000000001',
    name: 'Praia do Sol Hospedagens Ltda',
    tradeName: 'Pousada Praia do Sol',
    logoUrl: undefined,
    coverUrl: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=1200',
    description: 'Hospedagens à beira-mar em Florianópolis. Quartos com vista para a Lagoa da Conceição, café colonial e muito charme.',
    whatsappNumber: '+5548991234567',
    phone: '+5548991234567',
    email: 'contato@praiadosol.com.br',
    website: 'https://www.praiadosol.com.br',
    city: 'Florianópolis',
    state: 'SC',
    checkInTime: '14:00',
    checkOutTime: '12:00',
  },
  properties: [
    {
      id: 'c0c00001-0000-0000-0000-000000000001',
      name: 'Pousada Praia do Sol',
      slug: 'pousada-praia-do-sol',
      type: 'Pousada',
      description: 'Charmosa pousada pé na areia na Lagoa da Conceição. Quartos com varanda e vista para a lagoa, café da manhã colonial incluso.',
      address: { city: 'Florianópolis', state: 'SC', neighborhood: 'Lagoa da Conceição' },
      images: [{ id: '1', url: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800', alt: 'Pousada', isPrimary: true }],
      amenities: ['Wi-Fi', 'Piscina', 'Estacionamento', 'Café da manhã'],
      pricePerNight: 280,
      maxGuests: 12,
      bedrooms: 18,
      bathrooms: 12,
      rating: 4.5,
      totalReviews: 0,
      whatsappNumber: '+5548991234567',
      checkInTime: '14:00',
      checkOutTime: '11:00',
      totalRooms: 12,
      isAvailable: true,
    },
    {
      id: 'c0c00001-0000-0000-0000-000000000003',
      name: 'Chalé Vida na Roça',
      slug: 'chale-vida-na-roca',
      type: 'Chalet',
      description: 'Chalé rústico cercado pela Mata Atlântica. Lareira, ofurô ao ar livre, trilhas e café orgânico da fazenda.',
      address: { city: 'Florianópolis', state: 'SC', neighborhood: 'Rio Vermelho' },
      images: [{ id: '2', url: 'https://images.unsplash.com/photo-1449158743715-0a90ebb6d2d8?w=800', alt: 'Chalé', isPrimary: true }],
      amenities: ['Lareira', 'Ofurô', 'Trilhas', 'Café orgânico'],
      pricePerNight: 350,
      maxGuests: 4,
      bedrooms: 6,
      bathrooms: 4,
      rating: 4.7,
      totalReviews: 0,
      whatsappNumber: '+5548992345678',
      checkInTime: '16:00',
      checkOutTime: '11:00',
      totalRooms: 4,
      isAvailable: true,
    },
  ],
  totalProperties: 2,
};

export const portfolioService = {
  async getPortfolio(slug: string): Promise<PortfolioResponse> {
    if (USE_API) {
      try {
        return await api.get<PortfolioResponse>(`/portfolio/${slug}`);
      } catch {
        // fallback to mock
      }
    }
    // Simulate API delay
    await new Promise((r) => setTimeout(r, 500));
    return mockPortfolio;
  },
};
