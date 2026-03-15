import { Link } from 'react-router-dom';
import { Building2, Instagram, Twitter, Facebook, Linkedin } from 'lucide-react';
import { ROUTES } from '../../router/routes';

export function Footer() {
  return (
    <footer className="bg-primary-dark text-white">
      <div className="container-app py-12">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-8 mb-10">
          {/* Logo + tagline */}
          <div className="lg:col-span-2">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-8 h-8 bg-accent rounded-lg flex items-center justify-center">
                <Building2 className="w-5 h-5 text-white" />
              </div>
              <span className="font-bold text-xl">HospedaBR</span>
            </div>
            <p className="text-sm text-white/60 max-w-xs">
              A melhor plataforma para encontrar hospedagens em todo o Brasil. Viaje com confiança e conforto.
            </p>
            <div className="flex gap-3 mt-4">
              <a href="#" className="p-2 bg-white/10 rounded-lg hover:bg-white/20 transition-colors">
                <Instagram className="w-4 h-4" />
              </a>
              <a href="#" className="p-2 bg-white/10 rounded-lg hover:bg-white/20 transition-colors">
                <Twitter className="w-4 h-4" />
              </a>
              <a href="#" className="p-2 bg-white/10 rounded-lg hover:bg-white/20 transition-colors">
                <Facebook className="w-4 h-4" />
              </a>
              <a href="#" className="p-2 bg-white/10 rounded-lg hover:bg-white/20 transition-colors">
                <Linkedin className="w-4 h-4" />
              </a>
            </div>
          </div>

          {/* Empresa */}
          <div>
            <h4 className="font-semibold text-sm mb-4">Empresa</h4>
            <ul className="space-y-2.5 text-sm text-white/60">
              <li><a href="#" className="hover:text-white transition-colors">Sobre nós</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Carreiras</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Blog</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Imprensa</a></li>
            </ul>
          </div>

          {/* Suporte */}
          <div>
            <h4 className="font-semibold text-sm mb-4">Suporte</h4>
            <ul className="space-y-2.5 text-sm text-white/60">
              <li><a href="#" className="hover:text-white transition-colors">Central de Ajuda</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Segurança</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Termos de uso</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Privacidade</a></li>
            </ul>
          </div>

          {/* Hospedagens */}
          <div>
            <h4 className="font-semibold text-sm mb-4">Hospedagens</h4>
            <ul className="space-y-2.5 text-sm text-white/60">
              <li><Link to={ROUTES.SEARCH} className="hover:text-white transition-colors">Buscar hospedagens</Link></li>
              <li><Link to={ROUTES.REGISTER} className="hover:text-white transition-colors">Anunciar imóvel</Link></li>
              <li><a href="#" className="hover:text-white transition-colors">Garantias</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Seguros</a></li>
            </ul>
          </div>
        </div>

        <div className="border-t border-white/10 pt-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-xs text-white/40">
            © {new Date().getFullYear()} HospedaBR. Todos os direitos reservados.
          </p>
          <p className="text-xs text-white/40">
            Feito com ❤️ no Brasil
          </p>
        </div>
      </div>
    </footer>
  );
}
