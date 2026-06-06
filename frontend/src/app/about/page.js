import { MapPin, ShieldCheck, Zap, Globe, Users, Heart } from "lucide-react";
import Link from "next/link";
import Navbar from "@/components/Navbar";

export const metadata = {
  title: "About Us | Occupra Premium Property Discovery",
  description: "Learn more about Occupra. We simplify the rental journey by connecting tenants directly with property owners without intermediaries.",
};

export default function AboutPage() {
  const features = [
    { icon: Globe, title: 'Regional Discovery', desc: 'A seamless experience tailored for local rental markets and communities.' },
    { icon: ShieldCheck, title: 'Verified Listings', desc: 'Active property verification to ensure a safe and reliable rental process.' },
    { icon: Zap, title: 'Map Navigation', desc: 'Real-time navigation to your potential future home with integrated mapping.' },
    { icon: Users, title: 'Direct Access', desc: 'No intermediaries. Connect directly with owners for transparent communication.' }
  ];

  return (
    <>
      <Navbar />

      <div className="about-page-wrapper animate-fade-in" style={{ paddingTop: '60px' }}>

        {/* ── HERO SECTION ── */}
        <section className="about-hero">
          <div className="about-hero-bg">
            <img
              src="https://images.unsplash.com/photo-1554995207-c18c20360a59?auto=format&fit=crop&q=80&w=2000"
              alt="Real Estate"
            />
          </div>

          <div className="about-hero-content">
            <div className="about-hero-badge">
              <MapPin size={12} style={{ color: '#818cf8', flexShrink: 0 }} />
              Map-First Marketplace
            </div>

            <div className="about-hero-title-group">
              <h1 className="about-hero-title">
                Finding your next home <br />
                <span style={{ color: '#818cf8' }}>starts on the map.</span>
              </h1>
              <p className="about-hero-subtitle">
                Occupra simplifies the rental journey by connecting tenants directly with property owners.
              </p>
            </div>

            <div className="about-hero-actions">
              <Link href="/" className="btn btn-primary" style={{ padding: '0 40px' }}>
                Explore Map
              </Link>
              <Link
                href="/register"
                className="btn btn-ghost"
                style={{ color: 'white', padding: '0 40px', border: '1px solid rgba(255,255,255,0.2)' }}
              >
                Join Platform
              </Link>
            </div>
          </div>
        </section>

        {/* ── MISSION SECTION ── */}
        <section className="about-mission animate-slide-up">
          <div className="about-mission-inner">

            {/* Left: Text */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <p className="label-base" style={{ margin: 0, color: '#4f46e5' }}>Our Mission</p>
                <h2 style={{ fontSize: 'clamp(1.6rem, 4vw, 2.25rem)', fontWeight: 700, color: '#0f172a', letterSpacing: '-0.01em', lineHeight: 1.25, margin: 0 }}>
                  We believe finding a home should be intuitive and direct.
                </h2>
              </div>
              <p style={{ color: '#475569', lineHeight: 1.7, fontWeight: 500, margin: 0 }}>
                By removing intermediaries and providing real-time geographical context, we empower both tenants and owners to manage transactions with complete transparency and high efficiency.
              </p>

              {/* Stats Row — wraps on mobile */}
              <div className="about-stats-row">
                <div className="about-stat-item">
                  <p style={{ fontSize: '1.75rem', fontWeight: 700, color: '#4f46e5', margin: 0 }}>500+</p>
                  <p style={{ fontSize: '10px', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.1em', margin: 0 }}>Active Listings</p>
                </div>
                <div className="about-stat-item">
                  <p style={{ fontSize: '1.75rem', fontWeight: 700, color: '#10b981', margin: 0 }}>100%</p>
                  <p style={{ fontSize: '10px', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.1em', margin: 0 }}>Verified Owners</p>
                </div>
                <div className="about-stat-item">
                  <p style={{ fontSize: '1.75rem', fontWeight: 700, color: '#0f172a', margin: 0 }}>24/7</p>
                  <p style={{ fontSize: '10px', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.1em', margin: 0 }}>Market Support</p>
                </div>
              </div>
            </div>

            {/* Right: Image */}
            <div className="about-mission-image-wrap">
              <img
                src="https://images.unsplash.com/photo-1560518883-ce09059eeffa?auto=format&fit=crop&q=80&w=1000"
                alt="Direct Connection"
              />
              {/* Floating badge — only rendered on lg+ via CSS */}
              <div className="about-mission-badge">
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                  <div style={{ width: 40, height: 40, background: '#eff6ff', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#4f46e5', border: '1px solid #c7d2fe', flexShrink: 0 }}>
                    <ShieldCheck size={20} />
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column' }}>
                    <span style={{ fontSize: '12px', fontWeight: 700, color: '#0f172a' }}>Security First</span>
                    <span style={{ fontSize: '9px', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Protected</span>
                  </div>
                </div>
              </div>
            </div>

          </div>
        </section>

        {/* ── CORE FEATURES SECTION ── */}
        <section className="about-features">
          <div className="about-features-card">
            {/* Header */}
            <div style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '48px' }}>
              <p className="label-base" style={{ margin: 0, color: '#4f46e5' }}>Platform Features</p>
              <h2 style={{ fontSize: 'clamp(1.5rem, 4vw, 2.25rem)', fontWeight: 700, color: '#0f172a', letterSpacing: '-0.01em', margin: 0 }}>
                Modern tools for property discovery.
              </h2>
            </div>

            {/* Features Grid */}
            <div className="about-features-grid">
              {features.map((f, i) => (
                <div key={i} className="about-feature-card">
                  <div className="about-feature-icon">
                    <f.icon size={18} />
                  </div>
                  <div className="about-feature-text">
                    <h3 style={{ fontSize: '11px', fontWeight: 700, color: '#0f172a', textTransform: 'uppercase', letterSpacing: '0.08em', margin: 0 }}>
                      {f.title}
                    </h3>
                    <p style={{ fontSize: '12px', color: '#64748b', fontWeight: 500, lineHeight: 1.6, margin: 0 }}>
                      {f.desc}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── CTA SECTION ── */}
        <section className="about-cta">
          <div className="about-cta-inner">
            <div className="about-cta-watermark">
              <Heart size={200} />
            </div>

            <div className="about-cta-content">
              <div className="about-cta-text">
                <h2 style={{ fontSize: 'clamp(1.8rem, 6vw, 3rem)', fontWeight: 700, letterSpacing: '-0.02em', margin: 0 }}>
                  Ready to explore?
                </h2>
                <p style={{ color: '#94a3b8', fontSize: '13px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', margin: 0 }}>
                  Join 500+ users discovering homes on the map
                </p>
              </div>

              <div className="about-cta-actions">
                <Link href="/register" className="btn btn-primary" style={{ padding: '0 48px', height: '48px' }}>
                  Get Started
                </Link>
                <Link
                  href="/login"
                  className="btn btn-ghost"
                  style={{ color: 'white', padding: '0 48px', height: '48px', border: '1px solid rgba(255,255,255,0.15)' }}
                >
                  Owner Portal
                </Link>
              </div>
            </div>
          </div>
        </section>

      </div>
    </>
  );
}
