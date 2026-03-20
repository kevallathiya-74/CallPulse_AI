import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import {
  LayoutDashboard, Upload, Users, FileText, LogOut, Settings,
  Mic, Menu, X, Zap,
} from 'lucide-react';
import { useAuth } from '@clerk/react';
import useUiStore from '../../store/uiStore';
import Button from '../ui/Button';
import { useReportService } from '../../services/reportService';
import { QUERY_KEYS } from '../../constants/queryKeys';

const NAV_LINKS = [
  { to: '/', label: 'Home' },
  { to: '/#features', label: 'Features' },
  { to: '/#demo', label: 'Demo' },
  { to: '/#pricing', label: 'Pricing' },
];

const APP_LINKS = [
  { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/upload', label: 'Upload Call', icon: Upload },
  { to: '/agents', label: 'Agents', icon: Users },
  { to: '/settings', label: 'Settings', icon: Settings },
];

export default function Navbar() {
  const { isSignedIn, signOut } = useAuth();
  const mobileMenuOpen = useUiStore(s => s.mobileMenuOpen);
  const toggleMobileMenu = useUiStore(s => s.toggleMobileMenu);
  const closeMobileMenu = useUiStore(s => s.closeMobileMenu);
  const [scrolled, setScrolled] = useState(false);
  const [activeSection, setActiveSection] = useState('');
  const location = useLocation();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const reportService = useReportService();
  const isApp = isSignedIn;

  const prefetchDashboard = () => {
    queryClient.prefetchQuery({
      queryKey: [QUERY_KEYS.DASHBOARD_SUMMARY],
      queryFn: () => reportService.getDashboardSummary(),
    });
  };

  useEffect(() => {
    closeMobileMenu();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.pathname]);

  useEffect(() => {
    const onScroll = () => {
      setScrolled(window.scrollY > 20);

      // Real-time scroll spy for active navigation tab
      if (location.pathname === '/') {
        // Correct order matching page layout: Home -> Features -> HowItWorks -> Demo -> Pricing
        const sections = ['pricing', 'demo', 'features']; // Reverse order to catch bottom-most visible first
        let current = '';
        
        // Use a more dynamic threshold (top of viewport + small offset)
        const scrollOffset = 150; 
        
        for (const section of sections) {
          const el = document.getElementById(section);
          if (el) {
            const rect = el.getBoundingClientRect();
            // If the section top is above the offset, it's considered active
            if (rect.top <= scrollOffset) {
              current = section;
              break;
            }
          }
        }
        setActiveSection(current);
      }
    };

    window.addEventListener('scroll', onScroll, { passive: true });
    // Trigger once on mount to set initial state
    setTimeout(onScroll, 100);
    return () => window.removeEventListener('scroll', onScroll);
  }, [location.pathname]);

  const handleLogout = async () => {
    try {
      await signOut();
    } catch {
      // ignore
    }
    navigate('/sign-in');
  };

  return (
    <>
      <nav
        className={[
          'fixed top-0 left-0 right-0 z-50 transition-all duration-300',
          scrolled || mobileMenuOpen
            ? 'bg-background/95 backdrop-blur-[14px] border-b border-primary/10 shadow-[0_1px_30px_rgba(0,212,255,0.05)]'
            : 'bg-transparent',
        ].join(' ')}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-20">
            {/* Left: Logo */}
            <div className="flex-1 flex items-center justify-start">
              <Link 
                to="/" 
                className="flex items-center gap-2.5 group" 
                onClick={() => {
                  closeMobileMenu();
                  if (location.pathname === '/') window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
              >
                <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[#10b981] via-[#3b82f6] to-[#8b5cf6] flex items-center justify-center shadow-[0_0_15px_rgba(59,130,246,0.5)] group-hover:shadow-[0_0_25px_rgba(59,130,246,0.7)] transition-all shrink-0">
                  <Mic size={18} className="text-white drop-shadow-sm" />
                </div>
                <span className="font-syne font-800 text-lg sm:text-lg tracking-wide text-white/90 group-hover:text-white transition-colors">
                  CallPulse <span className="text-[#a855f7]">AI</span>
                </span>
              </Link>
            </div>

            {/* Center: Desktop Nav Links */}
            <div className="hidden lg:flex flex-1 items-center justify-center gap-1.5">
              {(!isApp ? NAV_LINKS : APP_LINKS).map((l) => {
                const isHashLink = l.to.startsWith('/#');
                const hashSection = isHashLink ? l.to.substring(2) : '';
                let isActive = false;
                
                if (isApp) {
                  isActive = location.pathname === l.to;
                } else {
                  if (location.pathname === '/') {
                    isActive = isHashLink ? activeSection === hashSection : activeSection === '';
                  } else {
                    isActive = location.pathname === l.to;
                  }
                }

                const baseClass = "px-5 py-2.5 text-sm font-semibold transition-all duration-300 rounded-full select-none flex items-center gap-2";
                const activeClass = isActive 
                  ? "text-[#00d4ff] bg-[#00d4ff]/[0.08]" 
                  : "text-white/60 hover:text-white hover:bg-white/5";
                const linkClasses = `${baseClass} ${activeClass}`;

                const handleClick = () => {
                  if (l.to === '/' && location.pathname === '/') {
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }
                };
                
                const Icon = l.icon;

                return isHashLink ? (
                  <a key={l.to} href={l.to} className={linkClasses}>
                    {Icon && <Icon size={16} />}
                    {l.label}
                  </a>
                ) : (
                  <Link
                    key={l.to}
                    to={l.to}
                    className={linkClasses}
                    onClick={handleClick}
                    onMouseEnter={l.to === '/dashboard' ? prefetchDashboard : undefined}
                  >
                    {Icon && <Icon size={16} />}
                    {l.label}
                  </Link>
                );
              })}
            </div>

            {/* Right: Actions */}
            <div className="hidden lg:flex flex-1 items-center justify-end gap-3.5">
              {!isApp ? (
                <>
                  <Link to="/login">
                    <button className="px-6 py-2.5 rounded-full border border-[#00d4ff]/30 text-[#00d4ff] text-sm font-semibold hover:bg-[#00d4ff]/10 hover:border-[#00d4ff]/50 transition-all duration-300">
                      Sign In
                    </button>
                  </Link>
                  <Link to="/register">
                    <button className="px-6 py-2.5 rounded-full bg-gradient-to-r from-[#00d4ff] to-[#7f00ff] text-white text-sm font-semibold flex items-center gap-2 hover:shadow-[0_0_20px_rgba(0,212,255,0.4)] hover:scale-105 active:scale-95 transition-all duration-300">
                      <Zap size={14} className="fill-white/40 text-white" /> 
                      Get Started
                    </button>
                  </Link>
                </>
              ) : (
                <button
                  onClick={handleLogout}
                  className="flex items-center gap-2 px-5 py-2 rounded-full border border-red-500/20 text-red-400 text-sm font-semibold hover:bg-red-500/10 hover:border-red-500/40 transition-all cursor-pointer"
                >
                  <LogOut size={16} />
                  Sign Out
                </button>
              )}
            </div>

            {/* Mobile menu button */}
            <button
              onClick={toggleMobileMenu}
              className="md:hidden w-10 h-10 flex items-center justify-center text-text-muted hover:text-primary transition-colors rounded-[14px] bg-white/5"
              aria-label={mobileMenuOpen ? 'Close menu' : 'Open menu'}
            >
              {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </div>
      </nav>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-40 pt-16">
          <div
            className="absolute inset-0 bg-background/95 backdrop-blur-[14px]"
            onClick={closeMobileMenu}
          />
          <div className="relative z-10 p-6 flex flex-col gap-4">
            {(!isApp ? NAV_LINKS : APP_LINKS).map((l) => {
              const Icon = l.icon;
              
              let isActive = false;
              if (isApp) {
                isActive = location.pathname === l.to;
              } else {
                const isHashLink = l.to.startsWith('/#');
                const hashSection = isHashLink ? l.to.substring(2) : '';
                
                if (location.pathname === '/') {
                  isActive = isHashLink ? activeSection === hashSection : activeSection === '';
                } else {
                  isActive = location.pathname === l.to;
                }
              }

              const baseMobileClass = "flex items-center gap-3 p-4 glass-card transition-all text-base font-medium ";
              const activeMobileClass = isActive 
                ? "text-primary border-primary/30 bg-primary/5 drop-shadow-[0_0_8px_rgba(0,212,255,0.4)]" 
                : "text-white/80 hover:text-white hover:border-white/20";
                
              return l.to.startsWith('/#') && !isApp ? (
                <a
                  key={l.to}
                  href={l.to}
                  onClick={closeMobileMenu}
                  className={baseMobileClass + activeMobileClass}
                >
                  {Icon && <Icon size={18} />}
                  {l.label}
                </a>
              ) : (
                <Link
                  key={l.to}
                  to={l.to}
                  onClick={() => {
                    closeMobileMenu();
                    if (l.to === '/' && location.pathname === '/') {
                      window.scrollTo({ top: 0, behavior: 'smooth' });
                    }
                  }}
                  className={baseMobileClass + activeMobileClass}
                >
                  {Icon && <Icon size={18} />}
                  {l.label}
                </Link>
              );
            })}
            {!isApp ? (
              <div className="flex flex-col gap-3 mt-2">
                <Link to="/login" onClick={closeMobileMenu}>
                  <Button variant="secondary" className="w-full">Sign In</Button>
                </Link>
                <Link to="/register" onClick={closeMobileMenu}>
                  <Button className="w-full" icon={<Zap size={16} />}>Get Started Free</Button>
                </Link>
              </div>
            ) : (
              <button
                onClick={() => { handleLogout(); closeMobileMenu(); }}
                className="flex items-center gap-3 p-4 glass-card text-error hover:border-error/30 transition-all text-base font-medium"
              >
                <LogOut size={18} />
                Sign Out
              </button>
            )}
          </div>
        </div>
      )}
    </>
  );
}
