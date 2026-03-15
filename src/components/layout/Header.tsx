import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Building2, Bell, ChevronDown, Menu, X, LogOut, User, LayoutDashboard, Shield } from 'lucide-react';
import { useAuthStore } from '../../store/auth.store';
import { authService } from '../../services/auth.service';
import { Avatar } from '../ui/Avatar';
import { Button } from '../ui/Button';
import { cn } from '../../utils/cn';
import { ROUTES } from '../../router/routes';

export function Header() {
  const { user, isAuthenticated, logout } = useAuthStore();
  const navigate = useNavigate();
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 10);
    window.addEventListener('scroll', handler);
    return () => window.removeEventListener('scroll', handler);
  }, []);

  const handleLogout = () => {
    authService.logout();
    logout();
    navigate(ROUTES.HOME);
    setUserMenuOpen(false);
  };

  const getDashboardLink = () => {
    if (user?.role === 'admin') return ROUTES.ADMIN;
    return ROUTES.DASHBOARD;
  };

  return (
    <header
      className={cn(
        'sticky top-0 z-40 w-full bg-white transition-shadow duration-200',
        scrolled ? 'shadow-card-md' : 'shadow-none border-b border-surface-border'
      )}
    >
      <div className="container-app h-16 flex items-center justify-between gap-4">
        {/* Logo */}
        <Link to={ROUTES.HOME} className="flex items-center gap-2 flex-shrink-0">
          <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
            <Building2 className="w-5 h-5 text-white" />
          </div>
          <span className="font-bold text-xl text-primary">HospedaBR</span>
        </Link>

        {/* Desktop Nav */}
        <nav className="hidden md:flex items-center gap-6">
          <Link to={ROUTES.SEARCH} className="text-sm font-medium text-neutral-600 hover:text-primary transition-colors">
            Buscar
          </Link>
          <Link to="#como-funciona" className="text-sm font-medium text-neutral-600 hover:text-primary transition-colors">
            Como funciona
          </Link>
          <Link to="#anunciar" className="text-sm font-medium text-neutral-600 hover:text-primary transition-colors">
            Seja um Anunciante
          </Link>
        </nav>

        {/* Right Actions */}
        <div className="flex items-center gap-2">
          {isAuthenticated && user ? (
            <>
              <Link
                to={ROUTES.MESSAGES}
                className="p-2 rounded-lg text-neutral-500 hover:text-primary hover:bg-primary/5 transition-colors relative"
              >
                <Bell className="w-5 h-5" />
              </Link>

              <div className="relative">
                <button
                  onClick={() => setUserMenuOpen((o) => !o)}
                  className="flex items-center gap-2 p-1.5 rounded-xl hover:bg-neutral-100 transition-colors"
                >
                  <Avatar src={user.avatar} name={user.name || user.email} size="sm" />
                  <span className="hidden sm:block text-sm font-medium text-neutral-700 max-w-24 truncate">
                    {(user.name || user.email)?.split(' ')[0]}
                  </span>
                  <ChevronDown className="w-4 h-4 text-neutral-400 hidden sm:block" />
                </button>

                {userMenuOpen && (
                  <div className="absolute right-0 mt-2 w-52 bg-white border border-surface-border rounded-xl shadow-card-md py-1 animate-fade-in">
                    <div className="px-4 py-3 border-b border-surface-border">
                      <p className="text-sm font-semibold text-neutral-800">{user.name || user.email}</p>
                      <p className="text-xs text-neutral-500 truncate">{user.email}</p>
                    </div>
                    <Link
                      to={getDashboardLink()}
                      onClick={() => setUserMenuOpen(false)}
                      className="flex items-center gap-2 px-4 py-2.5 text-sm text-neutral-700 hover:bg-surface-muted transition-colors"
                    >
                      {user.role === 'admin' ? <Shield className="w-4 h-4" /> : <LayoutDashboard className="w-4 h-4" />}
                      {user.role === 'admin' ? 'Painel Admin' : 'Meu Painel'}
                    </Link>
                    <Link
                      to={ROUTES.DASHBOARD_PROFILE}
                      onClick={() => setUserMenuOpen(false)}
                      className="flex items-center gap-2 px-4 py-2.5 text-sm text-neutral-700 hover:bg-surface-muted transition-colors"
                    >
                      <User className="w-4 h-4" />
                      Meu Perfil
                    </Link>
                    <button
                      onClick={handleLogout}
                      className="flex items-center gap-2 w-full px-4 py-2.5 text-sm text-error hover:bg-error-light transition-colors"
                    >
                      <LogOut className="w-4 h-4" />
                      Sair
                    </button>
                  </div>
                )}
              </div>
            </>
          ) : (
            <>
              <Link to={ROUTES.LOGIN} className="hidden sm:block">
                <Button variant="outline" size="sm">Entrar</Button>
              </Link>
              <Link to={ROUTES.REGISTER}>
                <Button size="sm">Cadastrar</Button>
              </Link>
            </>
          )}

          {/* Mobile menu */}
          <button
            className="md:hidden p-2 rounded-lg text-neutral-500 hover:bg-neutral-100"
            onClick={() => setMobileOpen((o) => !o)}
          >
            {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Nav */}
      {mobileOpen && (
        <div className="md:hidden border-t border-surface-border bg-white animate-slide-down">
          <nav className="container-app py-4 flex flex-col gap-2">
            <Link
              to={ROUTES.SEARCH}
              onClick={() => setMobileOpen(false)}
              className="py-2 text-sm font-medium text-neutral-600 hover:text-primary"
            >
              Buscar
            </Link>
            <Link
              to="#como-funciona"
              onClick={() => setMobileOpen(false)}
              className="py-2 text-sm font-medium text-neutral-600 hover:text-primary"
            >
              Como funciona
            </Link>
            {!isAuthenticated && (
              <Link to={ROUTES.LOGIN} onClick={() => setMobileOpen(false)} className="mt-2">
                <Button variant="outline" fullWidth>Entrar</Button>
              </Link>
            )}
          </nav>
        </div>
      )}
    </header>
  );
}
