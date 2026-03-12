'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { CARS } from '@/lib/cars';

const TABS = ['Overview','My Bookings','Favourites','Reviews','Promo & Rewards','Settings'];

const MOCK_BOOKINGS = [
  { id:'BK001', car:'Tesla Model 3', image:'https://images.unsplash.com/photo-1560958089-b8a1929cea89?w=200&q=70', pickup:'14 Mar 2026', return:'17 Mar 2026', amount:507, status:'upcoming', days:3 },
  { id:'BK002', car:'Toyota Camry', image:'https://images.unsplash.com/photo-1621007947382-bb3c3994e3fb?w=200&q=70', pickup:'01 Feb 2026', return:'03 Feb 2026', amount:218, status:'completed', days:2 },
  { id:'BK003', car:'BMW X5', image:'https://images.unsplash.com/photo-1555215695-3004980ad54e?w=200&q=70', pickup:'15 Jan 2026', return:'20 Jan 2026', amount:1195, status:'completed', days:5 },
];

export default function AccountPage() {
  const { user, logout, updateUser, toggleFavourite } = useAuth();
  const router = useRouter();
  const [tab, setTab] = useState('Overview');
  const [editMode, setEditMode] = useState(false);
  const [editName, setEditName] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [promoCode, setPromoCode] = useState('');
  const [promoMsg, setPromoMsg] = useState('');

  useEffect(() => {
    if (!user) router.push('/login?redirect=/account');
    else { setEditName(user.name); setEditPhone(user.phone||''); }
  }, [user, router]);

  if (!user) return null;

const favCars = CARS.filter(c => user.favourites?.includes(String(c.id)));
  const applyPromo = () => {
    if (promoCode.toUpperCase() === 'WELCOME20') {
      updateUser({ promoCredits: (user.promoCredits || 0) + 20 });
      setPromoMsg('🎉 $20 credit added! Code: WELCOME20');
    } else if (promoCode.toUpperCase() === 'GLIDEGO50') {
      updateUser({ promoCredits: (user.promoCredits || 0) + 50 });
      setPromoMsg('🎉 $50 credit added! Code: GLIDEGO50');
    } else {
      setPromoMsg('❌ Invalid promo code. Try WELCOME20 or GLIDEGO50');
    }
    setPromoCode('');
  };

  return (
    <div style={{fontFamily:"'Inter',-apple-system,sans-serif",minHeight:'100vh',background:'#f8fafc'}}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700;800&family=Inter:wght@300;400;500;600;700&display=swap');
        *{box-sizing:border-box;margin:0;padding:0;}
        .playfair{font-family:'Playfair Display',serif;}
        .tab-btn{padding:10px 18px;border:none;background:transparent;font-size:14px;font-weight:500;cursor:pointer;color:#64748b;border-bottom:2px solid transparent;transition:all 0.2s;white-space:nowrap;}
        .tab-btn.active{color:#0f172a;border-bottom-color:#1d4ed8;font-weight:700;}
        .card{background:white;border-radius:16px;border:1px solid #f1f5f9;box-shadow:0 1px 4px rgba(0,0,0,0.04);}
        .inp{width:100%;border:1.5px solid #e2e8f0;border-radius:10px;padding:11px 14px;font-size:14px;color:#0f172a;outline:none;background:white;transition:border-color 0.2s;}
        .inp:focus{border-color:#1d4ed8;}
        .save-btn{background:linear-gradient(135deg,#1d4ed8,#059669);color:white;border:none;border-radius:10px;padding:11px 24px;font-size:14px;font-weight:700;cursor:pointer;transition:all 0.3s;}
        .save-btn:hover{transform:translateY(-1px);box-shadow:0 6px 20px rgba(29,78,216,0.3);}
        label{font-size:11px;font-weight:700;color:#94a3b8;letter-spacing:0.08em;display:block;margin-bottom:6px;}
      `}</style>

      {/* Nav */}
      <nav style={{background:'white',borderBottom:'1px solid #f1f5f9',padding:'14px 24px',display:'flex',alignItems:'center',justifyContent:'space-between',position:'sticky',top:0,zIndex:50}}>
        <Link href="/" style={{textDecoration:'none'}}>
          <Image src="/logo.png" alt="GlideGo" width={110} height={25} style={{objectFit:'contain'}} />
        </Link>
        <div style={{display:'flex',alignItems:'center',gap:16}}>
          <Link href="/#fleet" style={{fontSize:14,color:'#64748b',textDecoration:'none',fontWeight:500}}>Browse Cars</Link>
          <Link href="/host/dashboard" style={{fontSize:14,color:'#64748b',textDecoration:'none',fontWeight:500}}>Host Portal</Link>
          <button onClick={logout} style={{background:'#fef2f2',border:'1px solid #fecaca',borderRadius:8,padding:'8px 16px',fontSize:13,fontWeight:600,color:'#dc2626',cursor:'pointer'}}>Sign Out</button>
        </div>
      </nav>

      {/* Profile Hero */}
      <div style={{background:'linear-gradient(135deg,#0a0f1e,#0c1a3a)',padding:'40px 24px'}}>
        <div style={{maxWidth:1000,margin:'0 auto',display:'flex',alignItems:'center',gap:24,flexWrap:'wrap'}}>
          <div style={{width:80,height:80,borderRadius:'50%',background:'linear-gradient(135deg,#1d4ed8,#059669)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:28,fontWeight:800,color:'white',flexShrink:0,border:'3px solid rgba(255,255,255,0.1)'}}>
            {user.name.split(' ').map(n=>n[0]).join('')}
          </div>
          <div style={{flex:1}}>
            <div style={{display:'flex',alignItems:'center',gap:12,flexWrap:'wrap'}}>
              <h1 className="playfair" style={{fontSize:28,fontWeight:800,color:'white'}}>{user.name}</h1>
              {user.verified && <span style={{background:'rgba(52,211,153,0.15)',color:'#34d399',fontSize:11,fontWeight:700,padding:'4px 12px',borderRadius:20,border:'1px solid rgba(52,211,153,0.3)'}}>✓ Verified</span>}
            </div>
            <div style={{display:'flex',gap:20,marginTop:8,flexWrap:'wrap'}}>
              {[{icon:'📅',val:`Member since ${user.joinedDate||'2024'}`},{icon:'🚗',val:`${user.trips||0} trips`},{icon:'⭐',val:`${user.rating||'No'} rating`},{icon:'💰',val:`$${user.promoCredits||0} credits`}].map(s=>(
                <div key={s.val} style={{display:'flex',alignItems:'center',gap:6,fontSize:13,color:'rgba(255,255,255,0.55)'}}>
                  <span>{s.icon}</span>{s.val}
                </div>
              ))}
            </div>
          </div>
          <Link href="/#fleet" style={{background:'linear-gradient(135deg,#1d4ed8,#059669)',color:'white',textDecoration:'none',padding:'12px 24px',borderRadius:12,fontSize:14,fontWeight:700}}>
            🚗 Book a Car
          </Link>
        </div>
      </div>

      {/* Tabs */}
      <div style={{background:'white',borderBottom:'1px solid #f1f5f9',overflowX:'auto'}}>
        <div style={{maxWidth:1000,margin:'0 auto',display:'flex',padding:'0 24px'}}>
          {TABS.map(t=>(
            <button key={t} onClick={()=>setTab(t)} className={`tab-btn${tab===t?' active':''}`}>{t}</button>
          ))}
        </div>
      </div>

      <div style={{maxWidth:1000,margin:'0 auto',padding:'28px 24px'}}>

        {/* ── OVERVIEW ── */}
        {tab==='Overview' && (
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:20}}>
            {[
              {icon:'🚗',label:'Upcoming Trips',val:MOCK_BOOKINGS.filter(b=>b.status==='upcoming').length,color:'#1d4ed8',bg:'#eff6ff',link:'My Bookings'},
              {icon:'✅',label:'Completed Trips',val:MOCK_BOOKINGS.filter(b=>b.status==='completed').length,color:'#059669',bg:'#f0fdf4',link:'My Bookings'},
              {icon:'❤️',label:'Saved Cars',val:favCars.length,color:'#dc2626',bg:'#fef2f2',link:'Favourites'},
              {icon:'💰',label:'Promo Credits',val:`$${user.promoCredits||0}`,color:'#d97706',bg:'#fffbeb',link:'Promo & Rewards'},
            ].map(s=>(
              <div key={s.label} className="card" style={{padding:24,cursor:'pointer'}} onClick={()=>setTab(s.link)}>
                <div style={{display:'flex',alignItems:'center',gap:16}}>
                  <div style={{width:52,height:52,borderRadius:14,background:s.bg,display:'flex',alignItems:'center',justifyContent:'center',fontSize:24}}>{s.icon}</div>
                  <div>
                    <div className="playfair" style={{fontSize:28,fontWeight:800,color:'#0f172a'}}>{s.val}</div>
                    <div style={{fontSize:13,color:'#64748b'}}>{s.label}</div>
                  </div>
                </div>
              </div>
            ))}

            {/* Licence Status */}
            <div className="card" style={{padding:24,gridColumn:'1/-1'}}>
              <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',flexWrap:'wrap',gap:12}}>
                <div style={{display:'flex',alignItems:'center',gap:14}}>
                  <div style={{width:52,height:52,borderRadius:14,background:user.licenceUploaded?'#f0fdf4':'#fffbeb',display:'flex',alignItems:'center',justifyContent:'center',fontSize:24}}>🪪</div>
                  <div>
                    <div style={{fontSize:15,fontWeight:700,color:'#0f172a'}}>Driver's Licence</div>
                    <div style={{fontSize:13,color:'#64748b',marginTop:2}}>{user.licenceUploaded?'Verified ✅ — You can book any vehicle':'Upload required before your first booking'}</div>
                  </div>
                </div>
                {!user.licenceUploaded && (
                  <button onClick={()=>setTab('Settings')} style={{background:'linear-gradient(135deg,#1d4ed8,#059669)',color:'white',border:'none',borderRadius:10,padding:'10px 20px',fontSize:13,fontWeight:700,cursor:'pointer'}}>
                    Upload Now →
                  </button>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ── MY BOOKINGS ── */}
        {tab==='My Bookings' && (
          <div style={{display:'flex',flexDirection:'column',gap:16}}>
            {MOCK_BOOKINGS.map(b=>(
              <div key={b.id} className="card" style={{display:'flex',alignItems:'center',gap:20,padding:20,flexWrap:'wrap'}}>
                <img src={b.image} alt={b.car} style={{width:100,height:70,objectFit:'cover',borderRadius:10,flexShrink:0}} onError={e=>{(e.target as HTMLImageElement).style.display='none'}} />
                <div style={{flex:1,minWidth:200}}>
                  <div style={{display:'flex',alignItems:'center',gap:10,marginBottom:6,flexWrap:'wrap'}}>
                    <h3 style={{fontSize:16,fontWeight:700,color:'#0f172a'}}>{b.car}</h3>
                    <span style={{fontSize:11,fontWeight:700,padding:'3px 10px',borderRadius:20,background:b.status==='upcoming'?'#eff6ff':b.status==='completed'?'#f0fdf4':'#fef2f2',color:b.status==='upcoming'?'#1d4ed8':b.status==='completed'?'#15803d':'#dc2626'}}>
                      {b.status}
                    </span>
                  </div>
                  <div style={{fontSize:13,color:'#64748b'}}>📅 {b.pickup} → {b.return} · {b.days} days</div>
                </div>
                <div style={{textAlign:'right'}}>
                  <div style={{fontSize:20,fontWeight:800,color:'#0f172a',marginBottom:8}}>${b.amount}</div>
                  <div style={{display:'flex',gap:8}}>
                    {b.status==='completed' && <button style={{background:'#f8fafc',border:'1px solid #e2e8f0',borderRadius:8,padding:'7px 14px',fontSize:12,fontWeight:600,color:'#374151',cursor:'pointer'}}>Leave Review</button>}
                    {b.status==='upcoming' && <button style={{background:'#fef2f2',border:'1px solid #fecaca',borderRadius:8,padding:'7px 14px',fontSize:12,fontWeight:600,color:'#dc2626',cursor:'pointer'}}>Cancel</button>}
                    <Link href={`/booking/${b.id}`} style={{background:'#eff6ff',border:'1px solid #bfdbfe',borderRadius:8,padding:'7px 14px',fontSize:12,fontWeight:600,color:'#1d4ed8',textDecoration:'none'}}>Details</Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ── FAVOURITES ── */}
        {tab==='Favourites' && (
          <div>
            {favCars.length===0 ? (
              <div style={{textAlign:'center',padding:'60px 24px',color:'#94a3b8'}}>
                <div style={{fontSize:48,marginBottom:16}}>❤️</div>
                <div style={{fontSize:18,fontWeight:700,color:'#0f172a',marginBottom:8}}>No saved cars yet</div>
                <div style={{fontSize:14,marginBottom:20}}>Tap the heart icon on any car to save it here</div>
                <Link href="/#fleet" style={{background:'linear-gradient(135deg,#1d4ed8,#059669)',color:'white',textDecoration:'none',padding:'12px 28px',borderRadius:12,fontSize:14,fontWeight:700}}>Browse Cars</Link>
              </div>
            ) : (
              <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:20}}>
                {favCars.map(car=>(
                  <div key={car.id} className="card" style={{overflow:'hidden'}}>
                    <div style={{position:'relative',height:160,overflow:'hidden'}}>
                      <img src={car.image} alt={car.name} style={{width:'100%',height:'100%',objectFit:'cover'}} />
                      <button onClick={()=>toggleFavourite(String(car.id))} style={{position:'absolute',top:10,right:10,width:34,height:34,borderRadius:'50%',background:'rgba(0,0,0,0.5)',border:'none',cursor:'pointer',fontSize:16,display:'flex',alignItems:'center',justifyContent:'center'}}>❤️</button>
                    </div>
                    <div style={{padding:16}}>
                      <div style={{fontSize:15,fontWeight:700,color:'#0f172a',marginBottom:4}}>{car.name}</div>
                      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}>
                        <div style={{fontSize:12,color:'#94a3b8'}}>⭐ {car.rating} · {car.trips} trips</div>
                        <div style={{fontSize:16,fontWeight:800,color:'#0f172a'}}>${car.price}/day</div>
                      </div>
                      <Link href={`/cars/${car.id}`} style={{display:'block',marginTop:12,textAlign:'center',background:'linear-gradient(135deg,#1d4ed8,#059669)',color:'white',textDecoration:'none',padding:'9px',borderRadius:9,fontSize:13,fontWeight:700}}>Book Now</Link>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── PROMO & REWARDS ── */}
        {tab==='Promo & Rewards' && (
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:20}}>
            <div className="card" style={{padding:24}}>
              <h3 style={{fontSize:17,fontWeight:700,color:'#0f172a',marginBottom:6}}>💰 Your Credits</h3>
              <div className="playfair" style={{fontSize:48,fontWeight:800,color:'#059669',margin:'20px 0'}}>${user.promoCredits||0}</div>
              <div style={{fontSize:13,color:'#64748b',marginBottom:20}}>Applied automatically at checkout</div>
              <div style={{display:'flex',gap:10}}>
                <input className="inp" value={promoCode} onChange={e=>setPromoCode(e.target.value.toUpperCase())} placeholder="Enter promo code" style={{flex:1}} onKeyDown={e=>e.key==='Enter'&&applyPromo()} />
                <button onClick={applyPromo} className="save-btn" style={{whiteSpace:'nowrap'}}>Apply</button>
              </div>
              {promoMsg && <div style={{marginTop:12,fontSize:13,color:promoMsg.includes('❌')?'#dc2626':'#059669',fontWeight:600}}>{promoMsg}</div>}
              <div style={{marginTop:12,fontSize:11,color:'#94a3b8'}}>Try: WELCOME20 · GLIDEGO50</div>
            </div>

            <div className="card" style={{padding:24}}>
              <h3 style={{fontSize:17,fontWeight:700,color:'#0f172a',marginBottom:16}}>🎁 Referral Program</h3>
              <p style={{fontSize:13,color:'#64748b',lineHeight:1.7,marginBottom:16}}>Refer a friend and both get <strong style={{color:'#059669'}}>$25 credit</strong>!</p>
              <div style={{background:'#f8fafc',border:'1px dashed #e2e8f0',borderRadius:10,padding:'12px 16px',marginBottom:16}}>
                <div style={{fontSize:11,color:'#94a3b8',marginBottom:4}}>YOUR REFERRAL CODE</div>
                <div style={{fontSize:18,fontWeight:800,color:'#1d4ed8',letterSpacing:'0.1em'}}>{`GLIDE${user.id.slice(-4).toUpperCase()}`}</div>
              </div>
              <button style={{width:'100%',background:'#f8fafc',border:'1.5px solid #e2e8f0',borderRadius:10,padding:11,fontSize:13,fontWeight:700,color:'#374151',cursor:'pointer'}} onClick={()=>navigator.clipboard?.writeText(`GLIDE${user.id.slice(-4).toUpperCase()}`)}>
                📋 Copy Code
              </button>
            </div>

            <div className="card" style={{padding:24,gridColumn:'1/-1'}}>
              <h3 style={{fontSize:17,fontWeight:700,color:'#0f172a',marginBottom:16}}>🏆 Rewards Tiers</h3>
              <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:12}}>
                {[
                  {name:'Explorer',trips:'0-5',perk:'5% discount',color:'#64748b',bg:'#f8fafc'},
                  {name:'Cruiser',trips:'6-15',perk:'10% discount',color:'#059669',bg:'#f0fdf4'},
                  {name:'Road King',trips:'16-30',perk:'15% + priority',color:'#1d4ed8',bg:'#eff6ff'},
                  {name:'Elite',trips:'31+',perk:'20% + free extras',color:'#d97706',bg:'#fffbeb'},
                ].map(tier=>(
                  <div key={tier.name} style={{textAlign:'center',background:tier.bg,borderRadius:12,padding:'16px 12px',border:`1px solid ${tier.color}20`}}>
                    <div style={{fontSize:24,marginBottom:8}}>🏅</div>
                    <div style={{fontSize:14,fontWeight:800,color:tier.color}}>{tier.name}</div>
                    <div style={{fontSize:11,color:'#64748b',margin:'4px 0'}}>{tier.trips} trips</div>
                    <div style={{fontSize:11,fontWeight:600,color:tier.color}}>{tier.perk}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ── SETTINGS ── */}
        {tab==='Settings' && (
          <div style={{display:'flex',flexDirection:'column',gap:20}}>
            {/* Profile Edit */}
            <div className="card" style={{padding:24}}>
              <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:20}}>
                <h3 style={{fontSize:17,fontWeight:700,color:'#0f172a'}}>Personal Information</h3>
                <button onClick={()=>setEditMode(!editMode)} style={{background:'#f8fafc',border:'1px solid #e2e8f0',borderRadius:8,padding:'7px 16px',fontSize:13,fontWeight:600,color:'#374151',cursor:'pointer'}}>
                  {editMode?'Cancel':'Edit'}
                </button>
              </div>
              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:16}}>
                <div>
                  <label>FULL NAME</label>
                  {editMode?<input className="inp" value={editName} onChange={e=>setEditName(e.target.value)} />:<div style={{fontSize:15,fontWeight:600,color:'#0f172a',padding:'11px 14px',background:'#f8fafc',borderRadius:10}}>{user.name}</div>}
                </div>
                <div>
                  <label>EMAIL ADDRESS</label>
                  <div style={{fontSize:15,color:'#64748b',padding:'11px 14px',background:'#f8fafc',borderRadius:10}}>{user.email}</div>
                </div>
                <div>
                  <label>PHONE NUMBER</label>
                  {editMode?<input className="inp" value={editPhone} onChange={e=>setEditPhone(e.target.value)} placeholder="+61 4xx xxx xxx" />:<div style={{fontSize:15,fontWeight:600,color:'#0f172a',padding:'11px 14px',background:'#f8fafc',borderRadius:10}}>{user.phone||'Not set'}</div>}
                </div>
                <div>
                  <label>ACCOUNT TYPE</label>
                  <div style={{fontSize:15,fontWeight:600,color:'#1d4ed8',padding:'11px 14px',background:'#eff6ff',borderRadius:10,textTransform:'capitalize'}}>{user.role}</div>
                </div>
              </div>
              {editMode && (
                <button onClick={()=>{updateUser({name:editName,phone:editPhone});setEditMode(false);}} className="save-btn" style={{marginTop:16}}>
                  Save Changes
                </button>
              )}
            </div>

            {/* Licence Upload */}
            <div className="card" style={{padding:24}}>
              <h3 style={{fontSize:17,fontWeight:700,color:'#0f172a',marginBottom:6}}>🪪 Driver's Licence</h3>
              <p style={{fontSize:13,color:'#64748b',marginBottom:20}}>Required before your first booking. Accepted: Australian licence, International Driving Permit.</p>
              {user.licenceUploaded ? (
                <div style={{display:'flex',alignItems:'center',gap:12,padding:'14px',background:'#f0fdf4',borderRadius:12,border:'1px solid #bbf7d0'}}>
                  <span style={{fontSize:24}}>✅</span>
                  <div>
                    <div style={{fontSize:14,fontWeight:700,color:'#15803d'}}>Licence Verified</div>
                    <div style={{fontSize:12,color:'#166534'}}>You're approved to book any vehicle</div>
                  </div>
                </div>
              ) : (
                <div style={{border:'2px dashed #e2e8f0',borderRadius:12,padding:'28px',textAlign:'center',cursor:'pointer',background:'#f8fafc'}} onClick={()=>updateUser({licenceUploaded:true})}>
                  <div style={{fontSize:36,marginBottom:10}}>📄</div>
                  <div style={{fontSize:14,fontWeight:700,color:'#0f172a',marginBottom:6}}>Upload Your Licence</div>
                  <div style={{fontSize:12,color:'#64748b',marginBottom:14}}>Front and back · JPG or PNG · Max 10MB</div>
                  <div style={{display:'inline-block',background:'linear-gradient(135deg,#1d4ed8,#059669)',color:'white',padding:'10px 24px',borderRadius:10,fontSize:13,fontWeight:700}}>Choose File</div>
                </div>
              )}
            </div>

            {/* Notifications */}
            <div className="card" style={{padding:24}}>
              <h3 style={{fontSize:17,fontWeight:700,color:'#0f172a',marginBottom:16}}>🔔 Notifications</h3>
              {[
                {label:'Booking confirmations',desc:'When a booking is confirmed or changed',on:true},
                {label:'Trip reminders',desc:'24 hours before your pickup',on:true},
                {label:'Promo offers',desc:'Discounts and special deals',on:false},
                {label:'Host messages',desc:'When a host sends you a message',on:true},
              ].map(n=>(
                <div key={n.label} style={{display:'flex',alignItems:'center',justifyContent:'space-between',padding:'12px 0',borderBottom:'1px solid #f8fafc'}}>
                  <div>
                    <div style={{fontSize:14,fontWeight:600,color:'#0f172a'}}>{n.label}</div>
                    <div style={{fontSize:12,color:'#94a3b8',marginTop:2}}>{n.desc}</div>
                  </div>
                  <div style={{width:44,height:24,borderRadius:12,background:n.on?'linear-gradient(135deg,#1d4ed8,#059669)':'#e2e8f0',cursor:'pointer',position:'relative',flexShrink:0}}>
                    <div style={{position:'absolute',width:18,height:18,borderRadius:'50%',background:'white',top:3,left:n.on?'23px':'3px',transition:'left 0.2s',boxShadow:'0 1px 4px rgba(0,0,0,0.2)'}} />
                  </div>
                </div>
              ))}
            </div>

            {/* Danger Zone */}
            <div className="card" style={{padding:24,border:'1px solid #fecaca'}}>
              <h3 style={{fontSize:17,fontWeight:700,color:'#dc2626',marginBottom:16}}>⚠️ Account Actions</h3>
              <div style={{display:'flex',gap:12}}>
                <button onClick={logout} style={{background:'#fef2f2',border:'1px solid #fecaca',borderRadius:10,padding:'11px 20px',fontSize:13,fontWeight:700,color:'#dc2626',cursor:'pointer'}}>Sign Out</button>
                <button style={{background:'transparent',border:'1px solid #e2e8f0',borderRadius:10,padding:'11px 20px',fontSize:13,fontWeight:700,color:'#94a3b8',cursor:'pointer'}}>Delete Account</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
