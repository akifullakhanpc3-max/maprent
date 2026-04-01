import { MapPin, ShieldCheck, Zap, Globe, Users, Heart, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function About() {
  const features = [
    { icon: Globe, title: 'Regional Discovery', desc: 'A seamless experience tailored for local rental markets and communities.' },
    { icon: ShieldCheck, title: 'Verified Listings', desc: 'Active property verification to ensure a safe and reliable rental process.' },
    { icon: Zap, title: 'Map Navigation', desc: 'Real-time navigation to your potential future home with integrated mapping.' },
    { icon: Users, title: 'Direct Access', desc: 'No intermediaries. Connect directly with owners for transparent communication.' }
  ];

  return (
    <div className="flex-col gap-0 animate-fade-in">
      {/* HERO SECTION */}
      <section className="relative h-[60vh] flex-center overflow-hidden !bg-slate-900">
        <div className="absolute inset-0 opacity-20">
           <img 
             src="https://images.unsplash.com/photo-1554995207-c18c20360a59?auto=format&fit=crop&q=80&w=2000" 
             className="w-full h-full object-cover" 
             alt="Real Estate" 
           />
        </div>

        <div className="relative z-10 text-center px-6 max-w-4xl flex-col items-center gap-8">
            <div className="status-pill !bg-white/10 !text-white !border-white/10 text-[10px] px-4 py-1.5 uppercase font-bold tracking-widest flex items-center gap-2">
              <MapPin size={12} className="text-indigo-400" /> Map-First Marketplace
            </div>
            <div className="flex-col gap-4">
              <h1 className="text-5xl md:text-7xl font-bold text-white tracking-tight">
                Finding your next home <br/><span className="text-indigo-400">starts on the map.</span>
              </h1>
              <p className="text-slate-400 text-sm md:text-lg font-medium leading-relaxed max-w-2xl mx-auto uppercase tracking-wide">
                MapRent simplifies the rental journey by connecting tenants directly with property owners.
              </p>
            </div>
            <div className="flex items-center gap-4 mt-4">
               <Link to="/" className="btn btn-primary !px-10">
                  Explore Map
               </Link>
               <Link to="/register" className="btn btn-ghost !text-white hover:!bg-white/10 !px-10">
                  Join Platform
               </Link>
            </div>
        </div>
      </section>

      {/* MISSION STATEMENT */}
      <section className="max-w-7xl mx-auto w-full py-24 px-8 grid grid-cols-1 md:grid-cols-2 gap-16 items-center">
         <div className="flex-col gap-8 animate-slide-up">
            <div className="flex-col gap-2">
              <p className="label-base !m-0 !text-indigo-600">Our Mission</p>
              <h2 className="text-3xl md:text-4xl font-bold text-slate-900 tracking-tight">We believe finding a home should be intuitive and direct.</h2>
            </div>
            <p className="text-slate-600 leading-relaxed font-medium">
              By removing intermediaries and providing real-time geographical context, we empower both tenants and owners to manage transactions with complete transparency and high efficiency.
            </p>
            <div className="flex items-center gap-10 pt-4">
               <div className="flex-col gap-1">
                  <p className="text-3xl font-bold text-indigo-600">500+</p>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Active Listings</p>
               </div>
               <div className="flex-col gap-1">
                  <p className="text-3xl font-bold text-emerald-600">100%</p>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Verified Owners</p>
               </div>
               <div className="flex-col gap-1">
                  <p className="text-3xl font-bold text-slate-900">24/7</p>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Market Support</p>
               </div>
            </div>
         </div>
         <div className="relative animate-slide-up" style={{ animationDelay: '100ms' }}>
            <img 
              src="https://images.unsplash.com/photo-1560518883-ce09059eeffa?auto=format&fit=crop&q=80&w=1000" 
              className="rounded-xl shadow-md border border-slate-100 object-cover aspect-[4/3] w-full" 
              alt="Direct Connection" 
            />
            <div className="absolute -bottom-6 -left-6 bg-white p-5 rounded-xl shadow-lg border border-slate-100 hidden lg:block">
               <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-indigo-50 rounded-lg flex-center text-indigo-600 border border-indigo-100">
                     <ShieldCheck size={20} />
                  </div>
                  <div className="flex-col">
                     <span className="text-xs font-bold text-slate-900">Security First</span>
                     <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest leading-none">Protected</span>
                  </div>
               </div>
            </div>
         </div>
      </section>

      {/* CORE FEATURES */}
      <section className="bg-slate-50 py-24 px-8 border-y border-slate-100">
         <div className="max-w-7xl mx-auto w-full flex-col gap-16">
            <div className="text-center flex-col gap-2">
               <p className="label-base !m-0 !text-indigo-600">Platform Features</p>
               <h2 className="text-3xl md:text-4xl font-bold text-slate-900 tracking-tight">Modern tools for property discovery.</h2>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
               {features.map((f, i) => (
                  <div key={i} className="console-card !p-8 flex-col gap-6 group hover:border-indigo-400 transition-colors">
                     <div className="w-10 h-10 bg-slate-900 rounded-lg flex-center text-white group-hover:bg-indigo-600 transition-colors shadow-sm">
                        <f.icon size={18} />
                     </div>
                     <div className="flex-col gap-2">
                        <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">{f.title}</h3>
                        <p className="text-[11px] text-slate-500 font-medium leading-relaxed">{f.desc}</p>
                     </div>
                  </div>
               ))}
            </div>
         </div>
      </section>

      {/* CTA */}
      <section className="py-24 px-8">
         <div className="max-w-7xl mx-auto w-full bg-slate-900 p-12 md:p-20 rounded-2xl text-white shadow-xl relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-8 opacity-5">
               <Heart size={240} className="text-white -rotate-12 transition-transform duration-700 group-hover:scale-110" />
            </div>
            <div className="relative z-10 flex-col items-center text-center gap-10">
               <div className="flex-col gap-3">
                 <h2 className="text-4xl md:text-5xl font-bold tracking-tight">Ready to explore?</h2>
                 <p className="text-slate-400 text-sm font-bold uppercase tracking-widest">Join 500+ users discovering homes on the map</p>
               </div>
               <div className="flex items-center gap-4">
                  <Link to="/register" className="btn btn-primary !px-12 !h-12">
                    Get Started
                  </Link>
                  <Link to="/login" className="btn btn-ghost !text-white hover:!bg-white/10 !px-12 !h-12">
                    Owner Portal
                  </Link>
               </div>
            </div>
         </div>
      </section>
    </div>
  );
}
