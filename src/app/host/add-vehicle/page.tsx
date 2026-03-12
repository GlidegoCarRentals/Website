'use client';
import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';

const STEPS = ['Basic Info', 'Features', 'Photos', 'Pricing', 'Availability'];
const CATEGORIES = ['Economy','Compact','SUV','Luxury','Sports','Van','Electric','Ute'];
const FUELS = ['Petrol','Diesel','Electric','Hybrid','Plug-in Hybrid'];
const TRANSMISSIONS = ['Automatic','Manual'];
const FEATURES_LIST = [
  'Apple CarPlay','Android Auto','Bluetooth','Backup Camera','360° Camera',
  'GPS Navigation','Wireless Charging','Heated Seats','Ventilated Seats',
  'Sunroof / Moonroof','Panoramic Roof','Adaptive Cruise Control',
  'Lane Keep Assist','Blind Spot Warning','Parking Sensors','Auto Parking',
  'All-Wheel Drive','4WD / Off-Road','Tow Package','Child Seat Anchor',
  'Premium Audio','USB Ports','Ambient Lighting','Heads-Up Display',
  'Keyless Entry','Push Start','Fast Charging (EV)','Autopilot / Driver Assist',
];
const LOCATIONS = ['Melbourne Airport (MEL)','Melbourne CBD','Tullamarine','Southbank','St Kilda','Richmond','Docklands','Dandenong','Frankston','Geelong'];

export default function AddVehiclePage() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({
    make:'', model:'', year:'2024', category:'SUV', fuel:'Petrol', transmission:'Automatic',
    seats:'5', color:'', rego:'', description:'',
    features:[] as string[],
    photos:[] as string[],
    pricePerDay:'', weeklyDiscount:'10', monthlyDiscount:'20',
    location:'Melbourne Airport (MEL)', minDays:'1', minAge:'21', maxDistance:'',
    instantBook:true, deliveryAvailable:false, deliveryFee:'0',
    bondAmount:'500',
  });

  const update = (k: string, v: any) => setForm(f => ({...f,[k]:v}));
  const toggleFeature = (f: string) => update('features', form.features.includes(f) ? form.features.filter(x=>x!==f) : [...form.features,f]);

  const stepValid = () => {
    if (step===0) return form.make && form.model && form.year && form.category;
    if (step===1) return true;
    if (step===2) return true;
    if (step===3) return form.pricePerDay;
    return true;
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    await new Promise(r=>setTimeout(r,1500));
    alert('✅ Vehicle listed successfully! It will appear in the fleet after review.');
    router.push('/host/vehicles');
  };

  return (
    <div style={{fontFamily:"'Inter',-apple-system,sans-serif",minHeight:'100vh',background:'#f8fafc'}}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700;800&family=Inter:wght@300;400;500;600;700&display=swap');
        *{box-sizing:border-box;margin:0;padding:0;}
        .playfair{font-family:'Playfair Display',serif;}
        .inp{width:100%;border:1.5px solid #e2e8f0;border-radius:10px;padding:11px 14px;font-size:14px;color:#0f172a;outline:none;background:white;transition:border-color 0.2s;appearance:none;}
        .inp:focus{border-color:#1d4ed8;}
        .feat-btn{padding:8px 14px;border-radius:8px;font-size:12px;font-weight:600;cursor:pointer;border:1.5px solid #e2e8f0;background:white;color:#64748b;transition:all 0.2s;}
        .feat-btn.on{background:#eff6ff;border-color:#bfdbfe;color:#1d4ed8;}
        .next-btn{background:linear-gradient(135deg,#1d4ed8,#059669);color:white;border:none;border-radius:12px;padding:14px 32px;font-size:15px;font-weight:700;cursor:pointer;transition:all 0.3s;}
        .next-btn:hover{transform:translateY(-1px);box-shadow:0 8px 24px rgba(29,78,216,0.35);}
        .next-btn:disabled{opacity:0.5;transform:none;cursor:not-allowed;}
        .back-btn{background:#f8fafc;color:#64748b;border:1.5px solid #e2e8f0;border-radius:12px;padding:14px 24px;font-size:15px;font-weight:600;cursor:pointer;}
        .toggle{width:44px;height:24px;border-radius:12px;border:none;cursor:pointer;position:relative;transition:background 0.2s;flex-shrink:0;}
        .toggle-dot{position:absolute;width:18px;height:18px;border-radius:50%;background:white;top:3px;transition:left 0.2s;box-shadow:0 1px 4px rgba(0,0,0,0.2);}
        label{font-size:12px;font-weight:700;color:#64748b;letter-spacing:0.08em;display:block;margin-bottom:7px;}
        .photo-upload{border:2px dashed #e2e8f0;border-radius:14px;padding:32px;text-align:center;cursor:pointer;transition:all 0.2s;background:white;}
        .photo-upload:hover{border-color:#1d4ed8;background:#f8fafc;}
        select option{background:white;}
        .step-dot{width:32px;height:32px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:12px;font-weight:800;transition:all 0.3s;flex-shrink:0;}
      `}</style>

      {/* Header */}
      <div style={{background:'#0a0f1e',padding:'16px 32px',display:'flex',alignItems:'center',justifyContent:'space-between'}}>
        <Link href="/host/dashboard" style={{textDecoration:'none'}}>
          <Image src="/logo.png" alt="GlideGo" width={100} height={23} style={{objectFit:'contain',filter:'brightness(1.2)'}} />
        </Link>
        <div style={{color:'white',fontSize:14,fontWeight:600}}>List Your Vehicle</div>
        <Link href="/host/dashboard" style={{color:'rgba(255,255,255,0.5)',textDecoration:'none',fontSize:13}}>← Dashboard</Link>
      </div>

      {/* Progress */}
      <div style={{background:'white',borderBottom:'1px solid #f1f5f9',padding:'20px 32px'}}>
        <div style={{maxWidth:800,margin:'0 auto',display:'flex',alignItems:'center',justifyContent:'space-between'}}>
          {STEPS.map((s,i)=>(
            <div key={s} style={{display:'flex',alignItems:'center',gap:8,flex:i<STEPS.length-1?1:'auto'}}>
              <div className="step-dot" style={{background:i===step?'linear-gradient(135deg,#1d4ed8,#059669)':i<step?'#059669':'#f1f5f9',color:i<=step?'white':'#94a3b8'}}>
                {i<step?'✓':i+1}
              </div>
              <span style={{fontSize:12,fontWeight:600,color:i===step?'#0f172a':i<step?'#059669':'#94a3b8',whiteSpace:'nowrap'}}>{s}</span>
              {i<STEPS.length-1 && <div style={{flex:1,height:2,background:i<step?'#059669':'#f1f5f9',margin:'0 8px',borderRadius:1}} />}
            </div>
          ))}
        </div>
      </div>

      <div style={{maxWidth:800,margin:'0 auto',padding:'40px 24px'}}>

        {/* ─── STEP 0: Basic Info ─── */}
        {step===0 && (
          <div>
            <h2 className="playfair" style={{fontSize:28,fontWeight:800,color:'#0f172a',marginBottom:8}}>Basic Vehicle Info</h2>
            <p style={{fontSize:14,color:'#64748b',marginBottom:28}}>Tell us about your vehicle</p>
            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:18}}>
              {[{k:'make',l:'MAKE / BRAND',ph:'e.g. Toyota'},{k:'model',l:'MODEL',ph:'e.g. Camry'},{k:'color',l:'COLOR',ph:'e.g. White'},{k:'rego',l:'REGISTRATION PLATE',ph:'e.g. ABC123'}].map(f=>(
                <div key={f.k}>
                  <label>{f.l}</label>
                  <input className="inp" value={(form as any)[f.k]} onChange={e=>update(f.k,e.target.value)} placeholder={f.ph} />
                </div>
              ))}
              <div>
                <label>YEAR</label>
                <select className="inp" value={form.year} onChange={e=>update('year',e.target.value)}>
                  {Array.from({length:15},(_,i)=>2024-i).map(y=><option key={y} value={y}>{y}</option>)}
                </select>
              </div>
              <div>
                <label>CATEGORY</label>
                <select className="inp" value={form.category} onChange={e=>update('category',e.target.value)}>
                  {CATEGORIES.map(c=><option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <label>FUEL TYPE</label>
                <select className="inp" value={form.fuel} onChange={e=>update('fuel',e.target.value)}>
                  {FUELS.map(f=><option key={f} value={f}>{f}</option>)}
                </select>
              </div>
              <div>
                <label>TRANSMISSION</label>
                <select className="inp" value={form.transmission} onChange={e=>update('transmission',e.target.value)}>
                  {TRANSMISSIONS.map(t=><option key={t} value={t}>{t}</option>)}
                </select>
              </div>
              <div>
                <label>SEATS</label>
                <select className="inp" value={form.seats} onChange={e=>update('seats',e.target.value)}>
                  {[2,4,5,6,7,8,9].map(n=><option key={n} value={n}>{n} seats</option>)}
                </select>
              </div>
              <div>
                <label>PICKUP LOCATION</label>
                <select className="inp" value={form.location} onChange={e=>update('location',e.target.value)}>
                  {LOCATIONS.map(l=><option key={l} value={l}>{l}</option>)}
                </select>
              </div>
            </div>
            <div style={{marginTop:18}}>
              <label>VEHICLE DESCRIPTION</label>
              <textarea className="inp" value={form.description} onChange={e=>update('description',e.target.value)}
                placeholder="Tell guests what makes your car special — cleaning routine, unique features, local tips, etc. Min 100 words recommended."
                rows={4} style={{resize:'vertical'}} />
              <div style={{fontSize:11,color:'#94a3b8',marginTop:4}}>
                {form.description.split(' ').filter(Boolean).length} words · Aim for 100+ for better search ranking
              </div>
            </div>
          </div>
        )}

        {/* ─── STEP 1: Features ─── */}
        {step===1 && (
          <div>
            <h2 className="playfair" style={{fontSize:28,fontWeight:800,color:'#0f172a',marginBottom:8}}>Features & Amenities</h2>
            <p style={{fontSize:14,color:'#64748b',marginBottom:24}}>Select all features your vehicle has. Guests filter by these — more features = more bookings.</p>
            <div style={{display:'flex',flexWrap:'wrap',gap:10}}>
              {FEATURES_LIST.map(f=>(
                <button key={f} onClick={()=>toggleFeature(f)} className={`feat-btn${form.features.includes(f)?' on':''}`}>
                  {form.features.includes(f)?'✓ ':''}{f}
                </button>
              ))}
            </div>
            <div style={{marginTop:20,padding:'14px 18px',background:'#f0fdf4',borderRadius:12,border:'1px solid #bbf7d0',fontSize:13,color:'#166534'}}>
              ✅ {form.features.length} features selected · Guests can filter by: Apple CarPlay, AWD, Heated Seats and more
            </div>
          </div>
        )}

        {/* ─── STEP 2: Photos ─── */}
        {step===2 && (
          <div>
            <h2 className="playfair" style={{fontSize:28,fontWeight:800,color:'#0f172a',marginBottom:8}}>Upload Photos</h2>
            <p style={{fontSize:14,color:'#64748b',marginBottom:24}}>Up to 20 photos. Listings with 10+ quality photos get 40% more bookings.</p>
            <div className="photo-upload" onClick={()=>{}}>
              <div style={{fontSize:48,marginBottom:16}}>📷</div>
              <div style={{fontSize:16,fontWeight:700,color:'#0f172a',marginBottom:8}}>Drop photos here or click to upload</div>
              <div style={{fontSize:13,color:'#64748b',marginBottom:16}}>JPG, PNG up to 10MB each · Recommended: exterior front, back, sides, interior, dashboard</div>
              <div style={{display:'inline-block',background:'linear-gradient(135deg,#1d4ed8,#059669)',color:'white',padding:'10px 24px',borderRadius:10,fontSize:14,fontWeight:600}}>Choose Photos</div>
            </div>
            <div style={{marginTop:20}}>
              <div style={{fontSize:13,fontWeight:700,color:'#0f172a',marginBottom:12}}>📋 Photo checklist for maximum bookings:</div>
              {['Front exterior (daytime, clear background)','Rear exterior','Driver & passenger sides','Interior front seats','Interior rear seats','Dashboard & infotainment','Boot / cargo space','Any special features (sunroof, charging port, etc.)'].map(tip=>(
                <div key={tip} style={{display:'flex',alignItems:'center',gap:8,fontSize:13,color:'#64748b',padding:'5px 0'}}>
                  <span style={{color:'#059669'}}>☐</span> {tip}
                </div>
              ))}
            </div>
            <div style={{marginTop:20,padding:'14px 18px',background:'#fffbeb',borderRadius:12,border:'1px solid #fde68a',fontSize:13,color:'#92400e'}}>
              💡 <strong>Pro tip:</strong> GlideGo offers FREE professional photography in Melbourne. Contact us after listing!
            </div>
          </div>
        )}

        {/* ─── STEP 3: Pricing ─── */}
        {step===3 && (
          <div>
            <h2 className="playfair" style={{fontSize:28,fontWeight:800,color:'#0f172a',marginBottom:8}}>Set Your Pricing</h2>
            <p style={{fontSize:14,color:'#64748b',marginBottom:28}}>Competitive pricing gets more bookings. You can change this anytime.</p>
            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:18,marginBottom:24}}>
              <div>
                <label>DAILY PRICE (AUD)</label>
                <div style={{position:'relative'}}>
                  <span style={{position:'absolute',left:14,top:'50%',transform:'translateY(-50%)',color:'#0f172a',fontWeight:700}}>$</span>
                  <input className="inp" style={{paddingLeft:28}} type="number" value={form.pricePerDay} onChange={e=>update('pricePerDay',e.target.value)} placeholder="89" min={20} />
                </div>
                <div style={{fontSize:11,color:'#94a3b8',marginTop:4}}>Suggested: $59–$229/day based on your category</div>
              </div>
              <div>
                <label>BOND AMOUNT (AUD)</label>
                <div style={{position:'relative'}}>
                  <span style={{position:'absolute',left:14,top:'50%',transform:'translateY(-50%)',color:'#0f172a',fontWeight:700}}>$</span>
                  <input className="inp" style={{paddingLeft:28}} type="number" value={form.bondAmount} onChange={e=>update('bondAmount',e.target.value)} placeholder="500" />
                </div>
                <div style={{fontSize:11,color:'#94a3b8',marginTop:4}}>Pre-authorised, released after successful return</div>
              </div>
              <div>
                <label>WEEKLY DISCOUNT (%)</label>
                <div style={{position:'relative'}}>
                  <input className="inp" style={{paddingRight:28}} type="number" value={form.weeklyDiscount} onChange={e=>update('weeklyDiscount',e.target.value)} placeholder="10" min={0} max={50} />
                  <span style={{position:'absolute',right:14,top:'50%',transform:'translateY(-50%)',color:'#64748b'}}>%</span>
                </div>
              </div>
              <div>
                <label>MONTHLY DISCOUNT (%)</label>
                <div style={{position:'relative'}}>
                  <input className="inp" style={{paddingRight:28}} type="number" value={form.monthlyDiscount} onChange={e=>update('monthlyDiscount',e.target.value)} placeholder="20" min={0} max={50} />
                  <span style={{position:'absolute',right:14,top:'50%',transform:'translateY(-50%)',color:'#64748b'}}>%</span>
                </div>
              </div>
            </div>

            {/* Price preview */}
            {form.pricePerDay && (
              <div style={{background:'linear-gradient(135deg,#eff6ff,#f0fdf4)',border:'1px solid #bfdbfe',borderRadius:14,padding:20,marginBottom:24}}>
                <div style={{fontSize:14,fontWeight:700,color:'#0f172a',marginBottom:12}}>💰 Estimated earnings:</div>
                <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:16}}>
                  {[{label:'Per Day',earn:Number(form.pricePerDay)*0.8},{label:'Per Week',earn:Number(form.pricePerDay)*7*(1-Number(form.weeklyDiscount)/100)*0.8},{label:'Per Month',earn:Number(form.pricePerDay)*30*(1-Number(form.monthlyDiscount)/100)*0.8}].map(e=>(
                    <div key={e.label} style={{textAlign:'center',background:'white',borderRadius:10,padding:'14px'}}>
                      <div style={{fontSize:20,fontWeight:800,color:'#059669'}}>${Math.round(e.earn).toLocaleString()}</div>
                      <div style={{fontSize:11,color:'#64748b',marginTop:2}}>{e.label} (after 20% fee)</div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div style={{background:'white',borderRadius:14,border:'1px solid #f1f5f9',padding:20}}>
              <div style={{fontSize:14,fontWeight:700,color:'#0f172a',marginBottom:14}}>Trip Settings</div>
              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:16,marginBottom:16}}>
                <div>
                  <label>MINIMUM RENTAL DAYS</label>
                  <select className="inp" value={form.minDays} onChange={e=>update('minDays',e.target.value)}>
                    {[1,2,3,5,7].map(d=><option key={d} value={d}>{d} day{d>1?'s':''}</option>)}
                  </select>
                </div>
                <div>
                  <label>MINIMUM DRIVER AGE</label>
                  <select className="inp" value={form.minAge} onChange={e=>update('minAge',e.target.value)}>
                    {[18,21,23,25].map(a=><option key={a} value={a}>{a} years</option>)}
                  </select>
                </div>
              </div>
              {[
                {k:'instantBook',label:'Instant Book',desc:'Guests can book without waiting for your approval (recommended)'},
                {k:'deliveryAvailable',label:'Offer Delivery',desc:'You deliver the car to guests — adds to search ranking'},
              ].map(t=>(
                <div key={t.k} style={{display:'flex',alignItems:'center',justifyContent:'space-between',padding:'12px 0',borderTop:'1px solid #f8fafc'}}>
                  <div>
                    <div style={{fontSize:14,fontWeight:600,color:'#0f172a'}}>{t.label}</div>
                    <div style={{fontSize:12,color:'#64748b',marginTop:2}}>{t.desc}</div>
                  </div>
                  <button className="toggle" onClick={()=>update(t.k,!(form as any)[t.k])} style={{background:(form as any)[t.k]?'linear-gradient(135deg,#1d4ed8,#059669)':'#e2e8f0'}}>
                    <div className="toggle-dot" style={{left:(form as any)[t.k]?'23px':'3px'}} />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ─── STEP 4: Availability ─── */}
        {step===4 && (
          <div>
            <h2 className="playfair" style={{fontSize:28,fontWeight:800,color:'#0f172a',marginBottom:8}}>Availability Calendar</h2>
            <p style={{fontSize:14,color:'#64748b',marginBottom:24}}>Block dates when your car isn't available. You can update this anytime from your dashboard.</p>
            <div style={{background:'white',borderRadius:16,border:'1px solid #f1f5f9',padding:24,marginBottom:24}}>
              <div style={{display:'grid',gridTemplateColumns:'repeat(7,1fr)',gap:4,marginBottom:16}}>
                {['Sun','Mon','Tue','Wed','Thu','Fri','Sat'].map(d=>(
                  <div key={d} style={{textAlign:'center',fontSize:11,fontWeight:700,color:'#94a3b8',padding:'8px 0'}}>{d}</div>
                ))}
                {Array.from({length:35},(_,i)=>{
                  const day = i-2;
                  const isBlocked = [5,6,12,13,19,20].includes(i);
                  const isToday = i===10;
                  return (
                    <div key={i} style={{textAlign:'center',padding:'8px 4px',borderRadius:8,fontSize:13,fontWeight:500,cursor:day>0&&day<=31?'pointer':'default',background:isBlocked?'#fef2f2':isToday?'linear-gradient(135deg,#1d4ed8,#059669)':'transparent',color:isBlocked?'#dc2626':isToday?'white':day>0&&day<=31?'#0f172a':'#e2e8f0',border:isToday?'none':'1px solid transparent'}}>
                      {day>0&&day<=31?day:''}
                    </div>
                  );
                })}
              </div>
              <div style={{display:'flex',gap:16,fontSize:12,color:'#64748b'}}>
                <div style={{display:'flex',alignItems:'center',gap:6}}><div style={{width:14,height:14,borderRadius:4,background:'#fef2f2',border:'1px solid #fecaca'}} /> Blocked</div>
                <div style={{display:'flex',alignItems:'center',gap:6}}><div style={{width:14,height:14,borderRadius:4,background:'linear-gradient(135deg,#1d4ed8,#059669)'}} /> Today</div>
                <div style={{display:'flex',alignItems:'center',gap:6}}><div style={{width:14,height:14,borderRadius:4,background:'white',border:'1px solid #e2e8f0'}} /> Available</div>
              </div>
            </div>

            <div style={{background:'#f0fdf4',borderRadius:14,border:'1px solid #bbf7d0',padding:20}}>
              <div style={{fontSize:15,fontWeight:700,color:'#0f172a',marginBottom:12}}>🎉 You're all set!</div>
              <div style={{display:'flex',flexDirection:'column',gap:8}}>
                {[
                  `${form.make} ${form.model} ${form.year}`,
                  `Located at: ${form.location}`,
                  `$${form.pricePerDay}/day · ${form.features.length} features listed`,
                  form.instantBook?'✅ Instant Book enabled':'⏳ Manual approval',
                ].map((item,i)=>(
                  <div key={i} style={{fontSize:13,color:'#166534',display:'flex',alignItems:'center',gap:8}}>
                    <span style={{color:'#059669'}}>●</span> {item}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Navigation buttons */}
        <div style={{display:'flex',justifyContent:'space-between',marginTop:36}}>
          <button onClick={()=>setStep(s=>Math.max(0,s-1))} className="back-btn" style={{display:step===0?'none':'block'}}>
            ← Back
          </button>
          {step<STEPS.length-1 ? (
            <button onClick={()=>setStep(s=>s+1)} className="next-btn" disabled={!stepValid()} style={{marginLeft:'auto'}}>
              Continue →
            </button>
          ) : (
            <button onClick={handleSubmit} className="next-btn" disabled={submitting} style={{marginLeft:'auto'}}>
              {submitting?'Publishing...':'🚀 Publish Listing'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
