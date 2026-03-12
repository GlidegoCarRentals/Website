'use client';
import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { CARS } from '@/lib/cars';
import { useAuth } from '@/lib/auth-context';

const LOCATIONS = ['Melbourne Airport (MEL)','Melbourne CBD','Tullamarine','Southbank','St Kilda','Richmond','Docklands','Dandenong','Frankston','Geelong'];
const CATEGORIES = ['All','Economy','Compact','SUV','Luxury','Sports','Van'];

export default function HomePage() {
  const [pickup, setPickup] = useState('Melbourne Airport (MEL)');
  const [returnLoc, setReturnLoc] = useState('Melbourne Airport (MEL)');
  const [pickupDate, setPickupDate] = useState('');
  const [returnDate, setReturnDate] = useState('');
  const [category, setCategory] = useState('All');
  const [transmission, setTransmission] = useState('Any');
  const [maxPrice, setMaxPrice] = useState(400);
  const [scrollY, setScrollY] = useState(0);
  const [imgErrors, setImgErrors] = useState<Record<number,boolean>>({});

  useEffect(() => {
    const fn = () => setScrollY(window.scrollY);
    window.addEventListener('scroll', fn, {passive:true});
    return () => window.removeEventListener('scroll', fn);
  }, []);

  const filtered = CARS.filter(c => {
    if (category !== 'All' && c.category !== category) return false;
    if (transmission !== 'Any' && c.transmission !== transmission) return false;
    if (c.price > maxPrice) return false;
    return true;
  });

  const { user, logout } = useAuth();
  const [profileOpen, setProfileOpen] = useState(false);
  const profileDropRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const close = (e: MouseEvent) => {
      if (profileDropRef.current && !profileDropRef.current.contains(e.target as Node)) setProfileOpen(false);
    };
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, []);

  const navScrolled = scrollY > 60;

  return (
    <div style={{fontFamily:"'Inter',-apple-system,BlinkMacSystemFont,sans-serif",backgroundColor:'#f1f5f9',color:'#0f172a',overflowX:'hidden'}}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700;800;900&family=Inter:wght@300;400;500;600;700&display=swap');
        *{box-sizing:border-box;margin:0;padding:0;}
        .playfair{font-family:'Playfair Display',Georgia,serif;}
        
        /* HERO */
        .hero{
          position:relative; min-height:100vh;
          background:linear-gradient(135deg,#020817 0%,#0c1a3a 40%,#042a1a 75%,#010d08 100%);
          overflow:hidden;
        }
        .hero-overlay{
          position:absolute;inset:0;
          background:
            radial-gradient(ellipse 80% 60% at 0% 50%, rgba(37,99,235,0.18) 0%, transparent 55%),
            radial-gradient(ellipse 60% 70% at 100% 40%, rgba(5,150,105,0.15) 0%, transparent 55%),
            radial-gradient(ellipse 50% 40% at 50% 100%, rgba(16,185,129,0.08) 0%, transparent 50%);
          pointer-events:none;
        }
        .hero-grid{
          position:absolute;inset:0;
          background-image:linear-gradient(rgba(255,255,255,0.025) 1px, transparent 1px),
                           linear-gradient(90deg,rgba(255,255,255,0.025) 1px,transparent 1px);
          background-size:60px 60px;
          pointer-events:none;
        }

        /* NAV */
        .nav{position:fixed;top:0;left:0;right:0;z-index:100;transition:all 0.4s ease;padding:16px 0;}
        .nav-scrolled{background:rgba(2,8,23,0.92)!important;backdrop-filter:blur(24px)!important;border-bottom:1px solid rgba(255,255,255,0.06)!important;padding:10px 0!important;}

        /* BOOKING FORM */
        .booking-form{
          background:white;border-radius:20px;overflow:hidden;
          box-shadow:0 32px 80px rgba(0,0,0,0.35),0 0 0 1px rgba(255,255,255,0.08);
        }
        .form-header{background:linear-gradient(135deg,#1d4ed8,#059669);padding:22px 28px;}
        .form-input{
          width:100%;border:1.5px solid #e2e8f0;border-radius:10px;
          padding:11px 14px;font-size:14px;color:#0f172a;outline:none;
          transition:border-color 0.2s;background:white;appearance:none;cursor:pointer;
        }
        .form-input:focus{border-color:#1d4ed8;}
        .search-btn{
          width:100%;background:linear-gradient(135deg,#1d4ed8,#059669);
          color:white;border:none;border-radius:12px;padding:15px;
          font-size:15px;font-weight:700;cursor:pointer;
          transition:all 0.3s;letter-spacing:0.01em;
        }
        .search-btn:hover{transform:translateY(-1px);box-shadow:0 8px 24px rgba(29,78,216,0.4);}

        /* FEATURE CARDS */
        .feature-card{
          background:#111827;border-radius:16px;padding:28px;
          border:1px solid rgba(255,255,255,0.06);
          transition:all 0.3s ease;
        }
        .feature-card:hover{transform:translateY(-4px);border-color:rgba(255,255,255,0.1);background:#131d2e;}
        .feat-icon{
          width:46px;height:46px;border-radius:12px;
          display:flex;align-items:center;justify-content:center;
          font-size:20px;margin-bottom:18px;
        }

        /* CAR CARDS */
        .car-card{
          background:white;border-radius:16px;overflow:hidden;
          box-shadow:0 1px 4px rgba(0,0,0,0.06),0 0 0 1px rgba(0,0,0,0.04);
          transition:all 0.3s cubic-bezier(0.4,0,0.2,1);cursor:pointer;
        }
        .car-card:hover{transform:translateY(-6px);box-shadow:0 20px 48px rgba(0,0,0,0.12);}
        .car-img{width:100%;height:200px;object-fit:cover;transition:transform 0.5s ease;display:block;}
        .car-card:hover .car-img{transform:scale(1.05);}
        .car-img-wrap{overflow:hidden;position:relative;height:200px;background:#e2e8f0;}

        /* FILTER */
        .filter-btn{
          padding:8px 18px;border-radius:50px;font-size:13px;font-weight:600;
          cursor:pointer;border:1.5px solid #e2e8f0;background:white;color:#64748b;
          transition:all 0.2s;
        }
        .filter-btn.active{background:#0f172a;color:white;border-color:#0f172a;}
        .filter-btn:hover:not(.active){background:#f8fafc;border-color:#cbd5e1;}
        .trans-btn{
          padding:7px 16px;border-radius:8px;font-size:13px;font-weight:600;
          cursor:pointer;border:1.5px solid #e2e8f0;background:white;color:#64748b;
          transition:all 0.2s;
        }
        .trans-btn.active{background:#0f172a;color:white;border-color:#0f172a;}

        /* BOOK BTN */
        .book-now-btn{
          background:linear-gradient(135deg,#1d4ed8,#059669);color:white;
          border:none;border-radius:10px;padding:11px 22px;
          font-size:14px;font-weight:700;cursor:pointer;
          transition:all 0.25s;white-space:nowrap;
        }
        .book-now-btn:hover{transform:translateY(-1px);box-shadow:0 6px 20px rgba(29,78,216,0.35);}
        .unavail-btn{
          background:#f1f5f9;color:#94a3b8;border:none;border-radius:10px;
          padding:11px 22px;font-size:14px;font-weight:700;cursor:not-allowed;
        }

        /* CTA */
        .cta-section{
          background:linear-gradient(135deg,#1d4ed8 0%,#0891b2 40%,#059669 100%);
          position:relative;overflow:hidden;
        }
        .cta-section::before{
          content:'';position:absolute;inset:0;
          background-image:radial-gradient(rgba(255,255,255,0.06) 1.5px,transparent 1.5px);
          background-size:28px 28px;pointer-events:none;
        }
        .cta-btn-white{
          background:white;color:#1d4ed8;border:none;border-radius:50px;
          padding:16px 32px;font-size:15px;font-weight:700;cursor:pointer;
          transition:all 0.3s;box-shadow:0 4px 20px rgba(0,0,0,0.15);
        }
        .cta-btn-white:hover{transform:translateY(-2px);box-shadow:0 8px 32px rgba(0,0,0,0.2);}
        .cta-btn-outline{
          background:transparent;color:white;border:2px solid rgba(255,255,255,0.4);
          border-radius:50px;padding:16px 32px;font-size:15px;font-weight:600;
          cursor:pointer;transition:all 0.3s;
        }
        .cta-btn-outline:hover{border-color:white;background:rgba(255,255,255,0.1);}

        /* MISC */
        .badge{display:inline-block;padding:4px 10px;border-radius:6px;font-size:11px;font-weight:700;letter-spacing:0.03em;}
        select option{background:white;color:#0f172a;}
        input[type=range]{accent-color:#1d4ed8;}
        input[type=date]::-webkit-calendar-picker-indicator{opacity:0.5;cursor:pointer;}

        @media(max-width:768px){
          .hero-grid-layout{grid-template-columns:1fr!important;}
          .fleet-grid{grid-template-columns:1fr 1fr!important;}
          .feat-grid{grid-template-columns:1fr 1fr!important;}
        }
        @media(max-width:480px){
          .fleet-grid{grid-template-columns:1fr!important;}
          .feat-grid{grid-template-columns:1fr!important;}
        }
      `}</style>

      {/* ═══════════════ NAV ═══════════════ */}
      <nav className={`nav${navScrolled?' nav-scrolled':''}`}>
        <div style={{maxWidth:1280,margin:'0 auto',padding:'0 24px',display:'flex',alignItems:'center',justifyContent:'space-between',gap:16}}>
          <Link href="/" style={{textDecoration:'none',flexShrink:0}}>
            <Image src="/logo.png" alt="GlideGo" width={120} height={27} style={{objectFit:'contain',filter:'brightness(1.2)'}} />
          </Link>
          <div style={{display:'flex',alignItems:'center',gap:24}}>
            {[['#fleet','Browse Cars'],['#how-it-works','How It Works'],['#why-glidego','Why GlideGo']].map(([href,label])=>(
              <a key={href} href={href} style={{fontSize:14,color:'rgba(255,255,255,0.7)',textDecoration:'none',fontWeight:500,transition:'color 0.2s'}}
                onMouseEnter={e=>(e.currentTarget.style.color='white')}
                onMouseLeave={e=>(e.currentTarget.style.color='rgba(255,255,255,0.7)')}>
                {label}
              </a>
            ))}
            <Link href="/fleet" style={{fontSize:14,color:'rgba(255,255,255,0.7)',textDecoration:'none',fontWeight:500}}
              onMouseEnter={e=>(e.currentTarget.style.color='white')}
              onMouseLeave={e=>(e.currentTarget.style.color='rgba(255,255,255,0.7)')}>
              All Vehicles
            </Link>
          </div>
          <div style={{display:'flex',alignItems:'center',gap:10,flexShrink:0}}>
            {user ? (
              <>
                {user.role==='host' && (
                  <Link href="/host/dashboard" style={{fontSize:13,fontWeight:700,color:'#34d399',textDecoration:'none',padding:'8px 14px',border:'1px solid rgba(52,211,153,0.3)',borderRadius:9}}>
                    Host Portal
                  </Link>
                )}
                <div style={{position:'relative'}} ref={profileDropRef}>
                  <button onClick={()=>setProfileOpen(!profileOpen)} style={{display:'flex',alignItems:'center',gap:8,background:'rgba(255,255,255,0.08)',border:'1px solid rgba(255,255,255,0.12)',borderRadius:40,padding:'6px 14px 6px 6px',cursor:'pointer'}}>
                    <div style={{width:28,height:28,borderRadius:'50%',background:'linear-gradient(135deg,#1d4ed8,#059669)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:11,fontWeight:800,color:'white',flexShrink:0}}>
                      {user.name.split(' ').map((n:string)=>n[0]).join('')}
                    </div>
                    <span style={{fontSize:13,fontWeight:600,color:'white'}}>{user.name.split(' ')[0]}</span>
                    <span style={{color:'rgba(255,255,255,0.5)',fontSize:10}}>▾</span>
                  </button>
                  {profileOpen && (
                    <div style={{position:'absolute',top:'calc(100% + 10px)',right:0,background:'#0f1b35',border:'1px solid rgba(255,255,255,0.08)',borderRadius:16,padding:8,minWidth:200,boxShadow:'0 20px 60px rgba(0,0,0,0.5)',zIndex:200}}>
                      <div style={{padding:'10px 14px 12px',borderBottom:'1px solid rgba(255,255,255,0.06)',marginBottom:6}}>
                        <div style={{fontSize:13,fontWeight:700,color:'white'}}>{user.name}</div>
                        <div style={{fontSize:11,color:'#64748b',marginTop:2}}>{user.email}</div>
                      </div>
                      {[{href:'/account/profile',icon:'👤',label:'My Account'},{href:'/account/profile',icon:'📅',label:'My Bookings'},{href:'/account/profile',icon:'❤️',label:'Favourites'},{href:'/account/profile',icon:'💰',label:'Promo & Credits'}].map(item=>(
                        <Link key={item.label} href={item.href} onClick={()=>setProfileOpen(false)} style={{display:'flex',alignItems:'center',gap:10,padding:'10px 14px',borderRadius:10,fontSize:13,fontWeight:500,textDecoration:'none',color:'rgba(255,255,255,0.75)'}}
                          onMouseEnter={e=>(e.currentTarget.style.background='rgba(255,255,255,0.06)')}
                          onMouseLeave={e=>(e.currentTarget.style.background='transparent')}>
                          <span>{item.icon}</span>{item.label}
                        </Link>
                      ))}
                      {user.role==='host' && (
                        <Link href="/host/dashboard" onClick={()=>setProfileOpen(false)} style={{display:'flex',alignItems:'center',gap:10,padding:'10px 14px',borderRadius:10,fontSize:13,fontWeight:500,textDecoration:'none',color:'#34d399'}}
                          onMouseEnter={e=>(e.currentTarget.style.background='rgba(52,211,153,0.06)')}
                          onMouseLeave={e=>(e.currentTarget.style.background='transparent')}>
                          🏠 Host Dashboard
                        </Link>
                      )}
                      <div style={{borderTop:'1px solid rgba(255,255,255,0.06)',marginTop:6,paddingTop:6}}>
                        <button onClick={()=>{logout();setProfileOpen(false);}} style={{display:'flex',alignItems:'center',gap:10,padding:'10px 14px',borderRadius:10,fontSize:13,color:'#ef4444',background:'none',border:'none',cursor:'pointer',width:'100%'}}
                          onMouseEnter={e=>(e.currentTarget.style.background='rgba(239,68,68,0.06)')}
                          onMouseLeave={e=>(e.currentTarget.style.background='transparent')}>
                          🚪 Sign Out
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <>
                <Link href="/login" style={{fontSize:14,fontWeight:600,color:'rgba(255,255,255,0.8)',textDecoration:'none',padding:'8px 16px',borderRadius:10,border:'1px solid rgba(255,255,255,0.15)'}}>
                  Sign In
                </Link>
                <Link href="/login?mode=signup" style={{background:'linear-gradient(135deg,#1d4ed8,#059669)',color:'white',fontSize:14,fontWeight:700,padding:'10px 20px',borderRadius:10,textDecoration:'none',boxShadow:'0 4px 14px rgba(29,78,216,0.35)'}}>
                  Get Started
                </Link>
              </>
            )}
          </div>
        </div>
      </nav>

      {/* ═══════════════ HERO ═══════════════ */}
      <section className="hero">
        <div className="hero-overlay" />
        <div className="hero-grid" />

        <div style={{maxWidth:1280,margin:'0 auto',padding:'120px 24px 80px',position:'relative',zIndex:1}}>
          <div className="hero-grid-layout" style={{display:'grid',gridTemplateColumns:'1fr 480px',gap:56,alignItems:'center'}}>
            {/* LEFT */}
            <div>
              <div style={{display:'inline-flex',alignItems:'center',gap:8,background:'rgba(255,255,255,0.06)',backdropFilter:'blur(12px)',border:'1px solid rgba(255,255,255,0.1)',borderRadius:50,padding:'8px 18px',fontSize:13,color:'rgba(255,255,255,0.8)',marginBottom:28,fontWeight:500}}>
                <span style={{width:8,height:8,borderRadius:'50%',background:'#10b981',display:'inline-block',boxShadow:'0 0 10px #10b981'}} />
                Melbourne's #1 Rated — 4.9★ · 1,200+ Reviews
              </div>

              <h1 className="playfair" style={{fontSize:'clamp(44px,5.5vw,78px)',lineHeight:1.02,color:'white',fontWeight:900,marginBottom:22,letterSpacing:'-0.02em'}}>
                Book Your Car<br/>
                in <span style={{background:'linear-gradient(135deg,#38bdf8,#34d399)',WebkitBackgroundClip:'text',WebkitTextFillColor:'transparent',backgroundClip:'text'}}>Melbourne</span><br/>
                Instantly
              </h1>

              <p style={{fontSize:17,color:'rgba(255,255,255,0.55)',lineHeight:1.8,marginBottom:36,maxWidth:500}}>
                500+ vehicles. 70+ pickup locations. Zero hidden fees. From the airport to every suburb — we've got you covered.
              </p>

              <div style={{display:'flex',flexWrap:'wrap',gap:14,marginBottom:56}}>
                {[
                  {icon:'🔄',label:'Free Cancellation'},
                  {icon:'⏰',label:'24/7 Support'},
                  {icon:'💳',label:'No Hidden Fees'},
                ].map(f=>(
                  <div key={f.label} style={{display:'flex',alignItems:'center',gap:8,background:'rgba(255,255,255,0.06)',border:'1px solid rgba(255,255,255,0.1)',borderRadius:50,padding:'8px 18px',fontSize:13,color:'rgba(255,255,255,0.75)',fontWeight:500}}>
                    <span>{f.icon}</span>{f.label}
                  </div>
                ))}
              </div>

              {/* Stats row */}
              <div style={{display:'flex',gap:40,borderTop:'1px solid rgba(255,255,255,0.08)',paddingTop:32}}>
                {[{val:'500+',label:'VEHICLES'},{val:'70+',label:'LOCATIONS'},{val:'50k+',label:'HAPPY DRIVERS'}].map(s=>(
                  <div key={s.label}>
                    <div className="playfair" style={{fontSize:32,fontWeight:900,background:'linear-gradient(135deg,#38bdf8,#34d399)',WebkitBackgroundClip:'text',WebkitTextFillColor:'transparent',backgroundClip:'text',lineHeight:1}}>{s.val}</div>
                    <div style={{fontSize:11,color:'rgba(255,255,255,0.35)',fontWeight:700,letterSpacing:'0.12em',marginTop:4}}>{s.label}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* BOOKING FORM */}
            <div className="booking-form">
              <div className="form-header">
                <div className="playfair" style={{fontSize:22,fontWeight:700,color:'white',marginBottom:4}}>Find Your Car</div>
                <div style={{color:'rgba(255,255,255,0.8)',fontSize:13}}>Instant booking · No credit card fees</div>
              </div>
              <div style={{padding:'24px 28px',display:'flex',flexDirection:'column',gap:16}}>
                {[{label:'PICKUP LOCATION',val:pickup,set:setPickup},{label:'RETURN LOCATION',val:returnLoc,set:setReturnLoc}].map(f=>(
                  <div key={f.label}>
                    <label style={{fontSize:11,fontWeight:700,color:'#94a3b8',letterSpacing:'0.1em',display:'block',marginBottom:7}}>{f.label}</label>
                    <div style={{position:'relative'}}>
                      <span style={{position:'absolute',left:12,top:'50%',transform:'translateY(-50%)',fontSize:14,pointerEvents:'none'}}>📍</span>
                      <select value={f.val} onChange={e=>f.set(e.target.value)} className="form-input" style={{paddingLeft:34}}>
                        {LOCATIONS.map(l=><option key={l} value={l}>{l}</option>)}
                      </select>
                      <span style={{position:'absolute',right:12,top:'50%',transform:'translateY(-50%)',pointerEvents:'none',color:'#94a3b8',fontSize:12}}>▾</span>
                    </div>
                  </div>
                ))}
                <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12}}>
                  {[{label:'PICKUP DATE',val:pickupDate,set:setPickupDate},{label:'RETURN DATE',val:returnDate,set:setReturnDate}].map(f=>(
                    <div key={f.label}>
                      <label style={{fontSize:11,fontWeight:700,color:'#94a3b8',letterSpacing:'0.1em',display:'block',marginBottom:7}}>{f.label}</label>
                      <div style={{position:'relative'}}>
                        <span style={{position:'absolute',left:10,top:'50%',transform:'translateY(-50%)',fontSize:13,pointerEvents:'none'}}>📅</span>
                        <input type="date" value={f.val} onChange={e=>f.set(e.target.value)} className="form-input" style={{paddingLeft:32}}/>
                      </div>
                    </div>
                  ))}
                </div>
                <button className="search-btn" onClick={()=>document.getElementById('fleet')?.scrollIntoView({behavior:'smooth'})}>
                  Search Available Cars →
                </button>
                <div style={{display:'flex',justifyContent:'center',gap:4,flexWrap:'wrap'}}>
                  {['Free cancellation','·','No credit card surcharge','·','Instant confirmation'].map((t,i)=>(
                    <span key={i} style={{fontSize:11,color:'#94a3b8'}}>{t}</span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════════ WHY GLIDEGO — DARK ═══════════════ */}
      <section style={{background:'#060d1e',padding:'80px 24px'}}>
        <div style={{maxWidth:1280,margin:'0 auto'}}>
          <div style={{textAlign:'center',marginBottom:52}}>
            <div style={{fontSize:11,fontWeight:700,color:'#34d399',letterSpacing:'0.15em',marginBottom:14}}>WHY CHOOSE GLIDEGO</div>
            <h2 className="playfair" style={{fontSize:'clamp(28px,4vw,48px)',color:'white',fontWeight:800,marginBottom:14}}>Driving Made Simple</h2>
            <p style={{color:'rgba(255,255,255,0.45)',fontSize:15,maxWidth:500,margin:'0 auto'}}>We've removed every friction point so you can focus on the drive.</p>
          </div>
          <div className="feat-grid" style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:18}}>
            {[
              {icon:'⏱️',color:'#2563eb',bg:'#1e3a8a',title:'Instant Booking',desc:'Reserve your car in under 2 minutes. No lengthy forms.'},
              {icon:'🛡️',color:'#059669',bg:'#064e3b',title:'Free Cancellation',desc:'Cancel up to 24 hours before pickup at zero cost.'},
              {icon:'📍',color:'#2563eb',bg:'#1e3a8a',title:'70+ Melbourne Locations',desc:'Pick up from the airport, CBD, or any suburb across Melbourne.'},
              {icon:'💳',color:'#059669',bg:'#064e3b',title:'No Hidden Fees',desc:'The price you see is exactly what you pay. All taxes included.'},
              {icon:'🎧',color:'#2563eb',bg:'#1e3a8a',title:'24/7 Roadside Assist',desc:'Breakdown support available any time, day or night.'},
              {icon:'⭐',color:'#059669',bg:'#064e3b',title:'Top-Rated Fleet',desc:'Every car professionally cleaned and inspected before your trip.'},
            ].map(f=>(
              <div key={f.title} className="feature-card">
                <div className="feat-icon" style={{background:f.bg,color:f.color}}>{f.icon}</div>
                <h3 style={{fontSize:16,fontWeight:700,color:'white',marginBottom:8}}>{f.title}</h3>
                <p style={{fontSize:13,color:'rgba(255,255,255,0.45)',lineHeight:1.7}}>{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════ FLEET — LIGHT ═══════════════ */}
      <section id="fleet" style={{background:'#f8fafc',padding:'80px 24px'}}>
        <div style={{maxWidth:1280,margin:'0 auto'}}>
          {/* Header */}
          <div style={{display:'flex',alignItems:'flex-end',justifyContent:'space-between',marginBottom:32,flexWrap:'wrap',gap:16}}>
            <div>
              <h2 className="playfair" style={{fontSize:'clamp(28px,4vw,46px)',fontWeight:800,color:'#0f172a',lineHeight:1.1}}>
                Choose Your<br/>
                <span style={{background:'linear-gradient(135deg,#1d4ed8,#059669)',WebkitBackgroundClip:'text',WebkitTextFillColor:'transparent',backgroundClip:'text'}}>Perfect Ride</span>
              </h2>
            </div>
            <div style={{background:'#1d4ed8',borderRadius:12,padding:'10px 20px',textAlign:'right'}}>
              <div style={{fontSize:28,fontWeight:800,color:'white',lineHeight:1}}>{filtered.length}</div>
              <div style={{fontSize:12,color:'rgba(255,255,255,0.75)',fontWeight:500}}>vehicles available</div>
            </div>
          </div>

          {/* Filters */}
          <div style={{background:'white',borderRadius:16,padding:'20px 24px',marginBottom:32,boxShadow:'0 1px 4px rgba(0,0,0,0.06)',border:'1px solid #f0f0f0'}}>
            <div style={{display:'flex',flexWrap:'wrap',gap:8,marginBottom:16}}>
              {CATEGORIES.map(cat=>(
                <button key={cat} onClick={()=>setCategory(cat)} className={`filter-btn${category===cat?' active':''}`}>{cat}</button>
              ))}
            </div>
            <div style={{display:'flex',flexWrap:'wrap',alignItems:'center',gap:20}}>
              <div style={{display:'flex',alignItems:'center',gap:8}}>
                <span style={{fontSize:12,fontWeight:700,color:'#64748b',letterSpacing:'0.08em'}}>TRANSMISSION:</span>
                {['Any','Automatic','Manual'].map(t=>(
                  <button key={t} onClick={()=>setTransmission(t)} className={`trans-btn${transmission===t?' active':''}`}>{t}</button>
                ))}
              </div>
              <div style={{display:'flex',alignItems:'center',gap:12}}>
                <span style={{fontSize:12,fontWeight:700,color:'#64748b',letterSpacing:'0.08em'}}>MAX:</span>
                <span style={{fontSize:13,fontWeight:700,color:'#1d4ed8'}}>${maxPrice}/DAY</span>
                <input type="range" min={50} max={400} step={10} value={maxPrice} onChange={e=>setMaxPrice(Number(e.target.value))}
                  style={{width:120}}/>
              </div>
            </div>
          </div>

          {/* Car Grid */}
          <div className="fleet-grid" style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:22}}>
            {filtered.map(car=>(
              <Link key={car.id} href={`/cars/${car.id}`} style={{textDecoration:'none',color:'inherit'}}>
                <div className="car-card" style={{opacity:car.available?1:0.7}}>
                  <div className="car-img-wrap">
                    {!imgErrors[car.id] ? (
                      <img
                        src={car.image}
                        alt={car.name}
                        className="car-img"
                        onError={()=>setImgErrors(prev=>({...prev,[car.id]:true}))}
                      />
                    ) : (
                      <div style={{height:'100%',display:'flex',alignItems:'center',justifyContent:'center',background:'linear-gradient(135deg,#e0f2fe,#dcfce7)',fontSize:64}}>
                        {car.category==='SUV'?'🚙':car.fuel==='Electric'?'⚡':car.category==='Van'?'🛻':'🚗'}
                      </div>
                    )}
                    {!car.available && (
                      <div style={{position:'absolute',inset:0,background:'rgba(0,0,0,0.45)',display:'flex',alignItems:'center',justifyContent:'center'}}>
                        <span style={{background:'rgba(255,255,255,0.95)',color:'#0f172a',fontWeight:700,fontSize:13,padding:'8px 18px',borderRadius:50,letterSpacing:'0.05em'}}>UNAVAILABLE</span>
                      </div>
                    )}
                    {/* Badges */}
                    <div style={{position:'absolute',bottom:12,left:12,display:'flex',gap:6,alignItems:'center'}}>
                      <span style={{background:'rgba(0,0,0,0.75)',backdropFilter:'blur(8px)',color:'white',fontSize:11,fontWeight:700,padding:'4px 10px',borderRadius:6,letterSpacing:'0.05em'}}>{car.badge.toUpperCase()}</span>
                    </div>
                    <div style={{position:'absolute',bottom:12,right:12}}>
                      <span style={{background:car.fuelColor,color:'white',fontSize:11,fontWeight:700,padding:'4px 10px',borderRadius:6,letterSpacing:'0.03em'}}>{car.fuelBadge}</span>
                    </div>
                    {car.available && (
                      <div style={{position:'absolute',top:12,right:12,background:'rgba(0,0,0,0.65)',backdropFilter:'blur(8px)',borderRadius:8,padding:'4px 8px',display:'flex',alignItems:'center',gap:4}}>
                        <span style={{color:'#fbbf24',fontSize:12}}>★</span>
                        <span style={{color:'white',fontSize:12,fontWeight:600}}>{car.rating}</span>
                        <span style={{color:'rgba(255,255,255,0.6)',fontSize:11}}>({car.trips})</span>
                      </div>
                    )}
                  </div>

                  <div style={{padding:'16px 18px'}}>
                    <h3 style={{fontSize:16,fontWeight:700,color:'#0f172a',marginBottom:3}}>{car.name}</h3>
                    <div style={{fontSize:12,color:'#94a3b8',marginBottom:12}}>{car.year} Model</div>

                    <div style={{display:'flex',gap:14,marginBottom:12,borderBottom:'1px solid #f1f5f9',paddingBottom:12}}>
                      {[{icon:'👥',val:`${car.seats} Seats`},{icon:'⚡',val:car.transmission},{icon:'⛽',val:car.fuel}].map(s=>(
                        <div key={s.val} style={{display:'flex',flexDirection:'column',alignItems:'center',gap:3}}>
                          <span style={{fontSize:16}}>{s.icon}</span>
                          <span style={{fontSize:11,color:'#64748b',fontWeight:500}}>{s.val}</span>
                        </div>
                      ))}
                    </div>

                    <div style={{display:'flex',flexWrap:'wrap',gap:6,marginBottom:14}}>
                      {car.features.slice(0,3).map(f=>(
                        <span key={f} style={{display:'flex',alignItems:'center',gap:4,fontSize:11,color:'#475569',background:'#f8fafc',border:'1px solid #e2e8f0',borderRadius:6,padding:'3px 8px'}}>
                          <span style={{color:'#1d4ed8',fontSize:10}}>✓</span>{f}
                        </span>
                      ))}
                    </div>

                    <div style={{display:'flex',alignItems:'center',justifyContent:'space-between'}}>
                      <div>
                        <span style={{fontSize:22,fontWeight:800,color:'#0f172a'}}>${car.price}</span>
                        <span style={{fontSize:12,color:'#94a3b8',marginLeft:2}}>per day</span>
                      </div>
                      {car.available ? (
                        <button className="book-now-btn">Book Now</button>
                      ) : (
                        <button className="unavail-btn">Unavailable</button>
                      )}
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════ HOW IT WORKS ═══════════════ */}
      <section id="how-it-works" style={{background:'white',padding:'80px 24px'}}>
        <div style={{maxWidth:1280,margin:'0 auto'}}>
          <div style={{textAlign:'center',marginBottom:52}}>
            <div style={{fontSize:11,fontWeight:700,color:'#1d4ed8',letterSpacing:'0.15em',marginBottom:14}}>SIMPLE PROCESS</div>
            <h2 className="playfair" style={{fontSize:'clamp(28px,4vw,44px)',fontWeight:800,color:'#0f172a',marginBottom:14}}>Book in 3 Easy Steps</h2>
            <p style={{color:'#64748b',fontSize:15}}>From search to keys in under 2 minutes</p>
          </div>
          <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:28,position:'relative'}} className="feat-grid">
            {[
              {step:'01',icon:'🔍',title:'Search',desc:'Choose your pickup location, dates and browse our 500+ premium vehicles.'},
              {step:'02',icon:'🚗',title:'Choose',desc:'Select your car and view full details — specs, features, reviews and pricing.'},
              {step:'03',icon:'💳',title:'Pay Securely',desc:'Book instantly with Stripe\'s secure payment. No card surcharges, ever.'},
              {step:'04',icon:'🗝️',title:'Drive Away',desc:'Pick up at your location, keys ready, fuel full. Enjoy the open road!'},
            ].map((s,i)=>(
              <div key={s.step} style={{textAlign:'center',padding:'32px 24px',background:'#f8fafc',borderRadius:18,position:'relative',border:'1px solid #f0f4f8',transition:'all 0.3s ease'}}
                onMouseEnter={e=>{(e.currentTarget as HTMLElement).style.transform='translateY(-4px)';(e.currentTarget as HTMLElement).style.boxShadow='0 12px 32px rgba(0,0,0,0.08)';}}
                onMouseLeave={e=>{(e.currentTarget as HTMLElement).style.transform='';(e.currentTarget as HTMLElement).style.boxShadow='';}}>
                <div style={{fontSize:11,fontWeight:800,color:'#1d4ed8',letterSpacing:'0.15em',marginBottom:14}}>{s.step}</div>
                <div style={{fontSize:40,marginBottom:16}}>{s.icon}</div>
                <h3 style={{fontSize:17,fontWeight:700,color:'#0f172a',marginBottom:8}}>{s.title}</h3>
                <p style={{fontSize:13,color:'#64748b',lineHeight:1.7}}>{s.desc}</p>
                {i < 3 && <div style={{position:'absolute',right:-14,top:'50%',transform:'translateY(-50%)',fontSize:18,color:'#cbd5e1',zIndex:1}}>→</div>}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════ CTA — GRADIENT ═══════════════ */}
      <section className="cta-section" style={{padding:'80px 24px'}}>
        <div style={{maxWidth:900,margin:'0 auto',textAlign:'center',position:'relative',zIndex:1}}>
          <div style={{display:'inline-block',background:'rgba(255,255,255,0.12)',backdropFilter:'blur(10px)',border:'1px solid rgba(255,255,255,0.2)',borderRadius:50,padding:'7px 18px',fontSize:12,color:'rgba(255,255,255,0.9)',fontWeight:600,letterSpacing:'0.1em',marginBottom:24}}>
            READY TO HIT THE ROAD?
          </div>
          <h2 className="playfair" style={{fontSize:'clamp(30px,5vw,56px)',color:'white',fontWeight:900,lineHeight:1.1,marginBottom:18}}>
            Your Next Adventure<br/>Starts Right Here
          </h2>
          <p style={{color:'rgba(255,255,255,0.75)',fontSize:16,marginBottom:40,lineHeight:1.7}}>
            Join 50,000+ happy customers. Book in 2 minutes — free cancellation,<br/>no hidden fees, instant confirmation.
          </p>
          <div style={{display:'flex',gap:16,justifyContent:'center',flexWrap:'wrap',marginBottom:40}}>
            <button className="cta-btn-white" onClick={()=>document.getElementById('fleet')?.scrollIntoView({behavior:'smooth'})}>
              Browse Our Fleet →
            </button>
            <button className="cta-btn-outline">
              📞 (03) 9600 1234
            </button>
          </div>
          <div style={{borderTop:'1px solid rgba(255,255,255,0.15)',paddingTop:32,display:'flex',justifyContent:'center',flexWrap:'wrap',gap:28}}>
            {['Free Cancellation','No Credit Card Surcharge','Roadside Assistance Included','Clean & Inspected'].map(f=>(
              <div key={f} style={{display:'flex',alignItems:'center',gap:8,fontSize:13,color:'rgba(255,255,255,0.85)',fontWeight:500}}>
                <span style={{color:'#34d399',fontSize:14}}>✓</span>{f}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════ FOOTER ═══════════════ */}
      <footer id="contact" style={{background:'#060d1e',color:'white',padding:'64px 24px 32px'}}>
        <div style={{maxWidth:1280,margin:'0 auto'}}>
          <div style={{display:'grid',gridTemplateColumns:'2.5fr 1fr 1fr 1fr',gap:48,marginBottom:52}} className="footer-grid">
            <style>{`.footer-grid{grid-template-columns:2.5fr 1fr 1fr 1fr;}@media(max-width:768px){.footer-grid{grid-template-columns:1fr 1fr;}}`}</style>
            <div>
              <Image src="/logo.png" alt="GlideGo" width={130} height={29} style={{objectFit:'contain',filter:'brightness(1.1)',marginBottom:16}} />
              <p style={{color:'rgba(255,255,255,0.4)',fontSize:13,lineHeight:1.8,maxWidth:280,marginBottom:24}}>
                Melbourne's most trusted car rental. Quality vehicles, transparent pricing, and 24/7 roadside assistance.
              </p>
              <div style={{display:'flex',flexDirection:'column',gap:10}}>
                {[{icon:'📍',text:'Level 2, 390 Collins Street, Melbourne VIC 3000'},{icon:'📞',text:'(03) 9600 1234'},{icon:'✉️',text:'hello@glidego.com.au'}].map(c=>(
                  <div key={c.text} style={{display:'flex',alignItems:'flex-start',gap:10,fontSize:13,color:'rgba(255,255,255,0.4)'}}>
                    <span style={{color:'#34d399',marginTop:1}}>{c.icon}</span>{c.text}
                  </div>
                ))}
              </div>
            </div>
            {[
              {title:'COMPANY',links:['About Us','Careers','Press','Blog']},
              {title:'SERVICES',links:['Car Rentals','Long-Term Hire','Corporate','Airport Transfers']},
              {title:'SUPPORT',links:['FAQ','Contact Us','Insurance','Terms & Conditions']},
            ].map(col=>(
              <div key={col.title}>
                <h4 style={{fontSize:11,fontWeight:700,color:'rgba(255,255,255,0.3)',letterSpacing:'0.15em',marginBottom:20}}>{col.title}</h4>
                <div style={{display:'flex',flexDirection:'column',gap:12}}>
                  {col.links.map(link=>(
                    <a key={link} href="#" style={{fontSize:13,color:'rgba(255,255,255,0.5)',textDecoration:'none',transition:'color 0.2s'}}
                      onMouseEnter={e=>(e.currentTarget.style.color='white')}
                      onMouseLeave={e=>(e.currentTarget.style.color='rgba(255,255,255,0.5)')}>
                      {link}
                    </a>
                  ))}
                </div>
              </div>
            ))}
          </div>
          <div style={{borderTop:'1px solid rgba(255,255,255,0.06)',paddingTop:28,display:'flex',justifyContent:'space-between',flexWrap:'wrap',gap:16}}>
            <p style={{color:'rgba(255,255,255,0.2)',fontSize:12}}>© 2026 GlideGo Car Rentals Pty Ltd. All rights reserved. ABN 12 345 678 901</p>
            <div style={{display:'flex',gap:24}}>
              {['Privacy Policy','Terms of Use','Cookie Policy'].map(l=>(
                <a key={l} href="#" style={{color:'rgba(255,255,255,0.2)',fontSize:12,textDecoration:'none'}}
                  onMouseEnter={e=>(e.currentTarget.style.color='rgba(255,255,255,0.5)')}
                  onMouseLeave={e=>(e.currentTarget.style.color='rgba(255,255,255,0.2)')}>
                  {l}
                </a>
              ))}
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
