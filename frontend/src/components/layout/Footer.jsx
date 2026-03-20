import React from 'react';
import { Link } from 'react-router-dom';
import { Mic, Github, Twitter, Linkedin } from 'lucide-react';

const FOOTER_LINKS = {
  Product: [
    { label: 'Features', to: '/#features' },
    { label: 'Pricing', to: '/#pricing' },
    { label: 'Live Demo', to: '/#demo' },
    { label: 'How It Works', to: '/#how-it-works' },
  ],
  Company: [
    { label: 'About', to: '/about' },
    { label: 'Blog', to: '/blog' },
    { label: 'Careers', to: '/careers' },
    { label: 'Contact', to: '/contact' },
  ],
  Legal: [
    { label: 'Privacy Policy', to: '/privacy' },
    { label: 'Terms of Service', to: '/terms' },
    { label: 'DPDPA Compliance', to: '/compliance' },
    { label: 'Security', to: '/security' },
  ],
};

export default function Footer() {
  return (
    <footer className="border-t border-primary/8 bg-background/50 backdrop-blur-sm">
      <div className="max-w-7xl mx-auto px-6 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-10">
          {/* Brand column */}
          <div className="lg:col-span-2">
            <Link to="/" className="flex items-center gap-2.5 mb-6 group">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#10b981] via-[#3b82f6] to-[#8b5cf6] flex items-center justify-center shadow-[0_0_15px_rgba(59,130,246,0.3)] group-hover:shadow-[0_0_25px_rgba(59,130,246,0.5)] transition-all">
                <Mic size={20} className="text-white drop-shadow-sm" />
              </div>
              <span className="font-syne font-bold text-xl text-white/90 group-hover:text-white transition-colors">
                CallPulse <span className="text-[#a855f7]">AI</span>
              </span>
            </Link>
            <p className="text-text-muted text-sm max-w-xs leading-relaxed mb-6">
              Every Conversation. Scored. Coached. Improved. AI-powered voice quality analytics for India's BPO industry.
            </p>
            <div className="flex items-center gap-4">
              {[Twitter, Linkedin, Github].map((Icon, i) => (
                <a
                  key={i}
                  href="#"
                  className="w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-white/40 hover:text-[#00d4ff] hover:border-[#00d4ff]/30 hover:bg-[#00d4ff]/5 transition-all"
                >
                  <Icon size={18} />
                </a>
              ))}
            </div>
          </div>

          {/* Link columns */}
          {Object.entries(FOOTER_LINKS).map(([section, links]) => (
            <div key={section}>
              <h4 className="text-text-primary font-syne font-semibold text-sm mb-4">{section}</h4>
              <ul className="space-y-2.5">
                {links.map((l) => (
                  <li key={l.label}>
                    <Link
                      to={l.to}
                      className="text-text-muted text-sm hover:text-primary transition-colors"
                    >
                      {l.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="border-t border-white/5 mt-12 pt-8 flex flex-col sm:flex-row justify-between items-center gap-4">
          <p className="text-text-muted text-xs">
            {new Date().getFullYear()} CallPulse AI. All rights reserved. Built for India's BPO industry.
          </p>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-success pulse-dot inline-block" />
            <span className="text-success text-xs">All systems operational</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
