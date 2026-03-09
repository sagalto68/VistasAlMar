const APPS_SCRIPT_URL='https://script.google.com/macros/s/AKfycbzZobrGU0xXfpYL3p43gJHFAUnfFF3FpU5ZiaVxMpwCtfNPhoOFcayNdQhRfeorfio-7g/exec';
const CONFIG={ADDRESS_PUBLIC:'Passatge Bolívar, 7, EDIFICIO CANNES, 17250, Platja d\'Aro',ADDRESS_FULL:'Passatge Bolívar, 7, (EDIFICIO CANNES), 12-1, 17250, Platja d\'Aro'};
let MN=['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic'];
let bookedRanges=[],dailyPrices={},limpiezaCost=80,calY=new Date().getFullYear(),calM=new Date().getMonth(),selStart=null,selEnd=null;
let pricesReady=false,bookingsReady=false;

// FIX: Formato yyyy/MM/dd para coincidir con el backend (Apps Script)
function ds(d){
  const y=d.getFullYear();
  const m=String(d.getMonth()+1).padStart(2,'0');
  const day=String(d.getDate()).padStart(2,'0');
  return y+'/'+m+'/'+day;
}

// FIX: Acepta tanto yyyy-MM-dd como yyyy/MM/dd
function sd(s){const p=s.split(/[-\/]/);return new Date(p[0],p[1]-1,p[2])}

function toggleMenu(){document.getElementById('mobileMenu').classList.toggle('active')}

function jsonp(u,cb){
  const s=document.createElement('script');
  const n='cb'+Date.now()+Math.random().toString(36).substr(2,5);
  window[n]=function(data){cb(data);delete window[n]};
  s.src=u+'&callback='+n;
  s.onerror=function(){console.error('JSONP error:',u)};
  document.body.appendChild(s);
}

function tryRenderCal(){
  if(pricesReady && bookingsReady){
    var l=document.getElementById('calLoading');
    if(l) l.classList.add('hide');
    renderCal();
  }
}

function loadBookings(){
  fetch(APPS_SCRIPT_URL+'?action=getBookings')
    .then(function(r){return r.json()})
    .then(function(d){
      if(d.bookings){
        bookedRanges=d.bookings;
        console.log('Bookings loaded:',bookedRanges.length);
      } else {
        console.warn('No bookings data:',d);
      }
      bookingsReady=true;
      tryRenderCal();
    })
    .catch(function(err){
      console.error('Error getBookings:',err);
      bookingsReady=true;
      tryRenderCal();
    });
}

function loadPricing(){
  fetch(APPS_SCRIPT_URL+'?action=getPricing')
    .then(function(r){return r.json()})
    .then(function(d){
      if(d.dailyPrices){
        // Normalizamos las claves de fechas a formato yyyy/MM/dd
        const normalized={};
        Object.keys(d.dailyPrices).forEach(function(k){
          const dt=sd(k);
          normalized[ds(dt)]=d.dailyPrices[k];
        });
        dailyPrices=normalized;
        limpiezaCost=d.limpieza||80;
        console.log('Pricing loaded:',Object.keys(dailyPrices).length,'days');
        const ap=Object.values(dailyPrices).filter(function(p){return p>0});
        if(ap.length) document.getElementById('hlPrice').textContent='Desde '+Math.min.apply(null,ap)+'€/noche';
      } else {
        console.warn('No pricing data:',d);
      }
      pricesReady=true;
      tryRenderCal();
    })
    .catch(function(err){
      console.error('Error getPricing:',err);
      pricesReady=true;
      tryRenderCal();
    });
}

function calculatePrice(ci,co){
  let mn=0;const dias=[];
  let d=new Date(sd(ci));const end=new Date(sd(co));
  while(d<end){
    const dk=ds(d);
    const pr=dailyPrices[dk]||0;
    mn+=pr;
    dias.push({fecha:dk,precio:pr});
    d.setDate(d.getDate()+1);
  }
  const n=dias.length;
  if(n===0) return null;
  const mt=mn+limpiezaCost;
  const precioMedioNoche=Math.round(mn/n);
  const des=dias.map(function(d){return d.fecha.substring(5)+':'+d.precio+'€'}).join(' + ')+' + limpieza:'+limpiezaCost+'€ = '+mt+'€';
  return {nights:n,montoNoches:mn,limpieza:limpiezaCost,montoTotal:mt,precioMedioNoche:precioMedioNoche,desglose:des};
}

function updatePrice(){
  if(!selStart||!selEnd) return;
  const p=calculatePrice(selStart,selEnd);
  if(!p||p.nights<2){
    document.getElementById('pp-nights').textContent='⚠️ Mínimo 2 noches';
    document.getElementById('pp-rate').textContent='—';
    document.getElementById('pp-season').textContent='—';
    document.getElementById('pp-total').textContent='—';
    document.getElementById('pricePreview').classList.add('show');
    document.getElementById('bookingSummary').style.display='none';
    document.getElementById('noDateWarning').style.display='block';
    document.getElementById('noDateWarning').innerHTML='<span style="color:rgba(255,200,100,0.9);font-size:0.85rem">⚠️ Mínimo 2 noches</span>';
    return;
  }
  const fmt=function(s){return sd(s).toLocaleDateString('es-ES',{day:'2-digit',month:'short',year:'numeric'})};
  document.getElementById('pp-nights').textContent=p.nights+' noches';
  document.getElementById('pp-rate').textContent='Precio medio: '+p.precioMedioNoche+'€/noche';
  document.getElementById('pp-season').textContent='Incluye limpieza (80€)';
  document.getElementById('pp-total').textContent=p.montoTotal+'€';
  document.getElementById('pricePreview').classList.add('show');
  document.getElementById('sum-checkin').textContent=fmt(selStart);
  document.getElementById('sum-checkout').textContent=fmt(selEnd);
  document.getElementById('sum-nights').textContent=p.nights+' noches';
  document.getElementById('sum-rate').textContent='Promedio: '+p.precioMedioNoche+'€/noche';
  document.getElementById('sum-total').textContent=p.montoTotal+'€';
  document.getElementById('f-amount').value=p.montoTotal+'';
  
  const eb=document.getElementById('sum-breakdown');
  if(eb) eb.remove();
  const bd=document.createElement('div');
  bd.id='sum-breakdown';
  bd.style.cssText='border-top:1px solid rgba(74,179,214,0.15);padding-top:0.6rem;margin-top:0.3rem;font-size:0.78rem;color:rgba(255,255,255,0.45)';
  bd.innerHTML='<div style="display:flex;justify-content:space-between;margin-bottom:2px"><span>'+p.nights+' noches</span><span>'+p.montoNoches+'€</span></div><div style="display:flex;justify-content:space-between"><span>🧹 Gastos limpieza</span><span>+'+p.limpieza+'€</span></div>';
  const tr=document.getElementById('sum-total').parentElement;
  tr.parentElement.insertBefore(bd,tr);
  document.getElementById('bookingSummary').style.display='block';
  document.getElementById('noDateWarning').style.display='none';
}

function renderCal(){
  const d=new Date(calY,calM,1);
  document.getElementById('calLabel').textContent=MN[calM]+' '+calY;
  const g=document.getElementById('calGrid');
  g.innerHTML='';

  // Days header
  const hdr = document.querySelector('.cal-days-hdr');
  if (hdr) {
    const daySpans = hdr.querySelectorAll('span');
    translations.days.forEach((day, i) => {
      if (daySpans[i]) daySpans[i].textContent = day;
    });
  }

  const today=new Date();today.setHours(0,0,0,0);
  const fw=(d.getDay()+6)%7;
  for(let i=0;i<fw;i++){
    const e=document.createElement('div');
    e.className='cal-day other';
    g.appendChild(e);
  }
  const dm=new Date(calY,calM+1,0).getDate();
  for(let i=1;i<=dm;i++){
    const dayDate=new Date(calY,calM,i);dayDate.setHours(0,0,0,0);
    const cd=ds(dayDate);
    const e=document.createElement('div');
    e.className='cal-day';
    const bkd=bookedRanges.some(function(b){return cd>=b.checkin&&cd<b.checkout});
    const precio=(bkd)?0:(dailyPrices[cd]||0);
    e.innerHTML='<span class="day-num">'+i+'</span><span class="day-price">'+(precio>0?precio+'€':'')+'</span>';
    if(bkd) e.classList.add('booked');
    if(dayDate<today) e.classList.add('past');
    if(cd===selStart||cd===selEnd) e.classList.add('selected');
    if(selStart&&selEnd&&cd>selStart&&cd<selEnd) e.classList.add('in-range');
    e.onclick=(function(date){return function(){selDate(date)}})(cd);
    g.appendChild(e);
  }
}

function selDate(d){
  if(!selStart||selEnd){
    selStart=d;selEnd=null;
  } else {
    if(d<=selStart){selStart=d;selEnd=null}
    else {
      selEnd=d;
      document.getElementById('f-checkin').value=sd(selStart).toLocaleDateString('es-ES');
      document.getElementById('f-checkout').value=sd(selEnd).toLocaleDateString('es-ES');
      updatePrice();
    }
  }
  renderCal();
}

function submitBooking(){
  const nm=document.getElementById('f-name').value.trim();
  const em=document.getElementById('f-email').value.trim();
  const ci=selStart,co=selEnd;
  if(!nm||!em||!ci||!co){alert('Por favor completa todos los campos');return}
  const p=calculatePrice(ci,co);
  if(!p||p.nights<2){alert('Selecciona al menos 2 noches.');return}
  const btn=document.getElementById('btnSubmit');
  btn.disabled=true;btn.textContent='Enviando...';
  const lb=document.getElementById('loadingBar');
  lb.style.width='50%';
  const payload={
    action:'createBooking',nombre:nm,email:em,
    checkin:ci,checkout:co,
    personas:document.getElementById('f-guests').value,
    telefono:document.getElementById('f-phone').value,
    montoTotal:p.montoTotal,desglose:p.desglose,
    mensaje:document.getElementById('f-msg').value
  };
  fetch(APPS_SCRIPT_URL,{method:'POST',body:JSON.stringify(payload),headers:{'Content-Type':'text/plain'}})
    .then(function(r){return r.json()})
    .then(function(d){
      lb.style.width='100%';
      if(d.success){
        document.getElementById('bookingFormWrap').style.display='none';
        document.getElementById('formSuccess').classList.add('show');
        loadBookings();
      } else {
        alert('Error al enviar: '+(d.error||'Desconocido'));
        btn.disabled=false;btn.textContent='Enviar solicitud →';
      }
    })
    .catch(function(e){
      alert('Error de red: '+e.message);
      btn.disabled=false;btn.textContent='Enviar solicitud →';
    });
}

// Dynamic gallery loader
const galleryPhotos = [
  {file: 'hero.jpg', titleKey: 'gallery.photos.hero'},
  {file: 'beach.jpg', titleKey: 'gallery.photos.beach'},
  {file: 'dining.jpg', titleKey: 'gallery.photos.dining'},
  {file: 'kitchen.jpg', titleKey: 'gallery.photos.kitchen'},
  {file: 'living.jpg', titleKey: 'gallery.photos.living'},
  {file: 'bedroom.jpg', titleKey: 'gallery.photos.bedroom'},
  {file: 'bath.jpg', titleKey: 'gallery.photos.bath'}
];

function loadGallery() {
  const grid = document.getElementById('galleryGrid');
  if (!grid) return;
  
  galleryPhotos.forEach(function(photo, idx) {
    const item = document.createElement('div');
    item.className = 'gal-item reveal';
    item.style.animationDelay = (idx * 0.1) + 's';
    item.onclick = function(){ openLbox('fotos/' + photo.file) };
    
    const bg = document.createElement('div');
    bg.className = 'gal-bg';
    bg.style.backgroundImage = 'url(fotos/' + photo.file + ')';
    
    const ov = document.createElement('div');
    ov.className = 'gal-ov';
    const titleKeys = photo.titleKey.split('.');
    let title = translations;
    for (const k of titleKeys) {
      title = title && title[k];
    }
    ov.innerHTML = '<span>' + (title || photo.titleKey) + '</span>';
    
    item.appendChild(bg);
    item.appendChild(ov);
    grid.appendChild(item);
  });
}

function openLbox(imgSrc){
  document.getElementById('lboxImg').src=imgSrc;
  document.getElementById('lbox').classList.add('show');
}
function openLboxVar(v,t){
  const cs=getComputedStyle(document.documentElement).getPropertyValue(v);
  const u=cs.match(/url\((['"]?)([^'"]+)\1\)/);
  if(u){
    document.getElementById('lboxImg').src=u[2];
    document.getElementById('lbox').classList.add('show');
  }
}
function closeLbox(){document.getElementById('lbox').classList.remove('show')}

// Admin panel (secret usado en URL y en llamadas API)
var ADMIN_SECRET = 'Sergio0505!';

function loadAdminStats() {
  fetch(APPS_SCRIPT_URL+'?action=getStats&secret='+encodeURIComponent(ADMIN_SECRET))
    .then(function(r){return r.json()})
    .then(function(d){
      document.getElementById('st-today').textContent=d.visitsToday||0;
      document.getElementById('st-month').textContent=d.visitsMonth||0;
      document.getElementById('st-total').textContent=d.totalVisits||0;
      document.getElementById('st-bookings').textContent=d.totalBookings||0;
      document.getElementById('st-pending').textContent=d.pendingBookings||0;
      document.getElementById('st-revenue').textContent=(d.revenue||0)+'€';
    })
    .catch(function(err){ console.error('Error getStats:',err); });
}

function loadAdminPending() {
  var wrap = document.getElementById('adminPendingWrap');
  var listEl = document.getElementById('adminPendingList');
  if (!wrap || !listEl) return;
  listEl.innerHTML = '<p class="empty">Actualizando...</p>';
  fetch(APPS_SCRIPT_URL+'?action=getPendingBookings&secret='+encodeURIComponent(ADMIN_SECRET))
    .then(function(r){return r.json()})
    .then(function(d){
      var pending = (d && d.pending) ? d.pending : [];
      if (pending.length === 0) {
        listEl.innerHTML = '<p class="empty">No hay reservas pendientes.</p>';
      } else {
        listEl.innerHTML = pending.map(function(p){
          var id = (p.id||'').replace(/"/g,'&quot;');
          var nombre = (p.nombre||'—').replace(/</g,'&lt;');
          var checkin = (p.checkin||'—').replace(/</g,'&lt;');
          var checkout = (p.checkout||'—').replace(/</g,'&lt;');
          var total = (p.total!=null) ? p.total : '—';
          var confirmUrl = APPS_SCRIPT_URL+'?action=confirmBooking&id='+encodeURIComponent(p.id)+'&secret='+encodeURIComponent(ADMIN_SECRET);
          var cancelUrl = APPS_SCRIPT_URL+'?action=cancelBooking&id='+encodeURIComponent(p.id)+'&secret='+encodeURIComponent(ADMIN_SECRET)+'&reason=';
          return '<div class="pending-item" data-id="'+id+'">'+
            '<span class="p-id">'+nombre+'</span>'+
            '<div class="p-dates">'+checkin+' → '+checkout+' · '+total+'€</div>'+
            '<div class="p-actions">'+
            '<button type="button" class="btn-confirm" data-url="'+confirmUrl.replace(/"/g,'&quot;')+'">Confirmar</button>'+
            '<button type="button" class="btn-cancel" data-url="'+cancelUrl.replace(/"/g,'&quot;')+'">Cancelar</button>'+
            '</div></div>';
        }).join('');
        listEl.querySelectorAll('.btn-confirm').forEach(function(btn){
          btn.onclick=function(){
            var url = btn.getAttribute('data-url');
            if (!url) return;
            btn.disabled=true;
            var item = btn.closest('.pending-item');
            if (item) item.remove();
            fetch(url).then(function(){ loadAdminPending(); loadAdminStats(); }).finally(function(){ btn.disabled=false; });
          };
        });
        listEl.querySelectorAll('.btn-cancel').forEach(function(btn){
          btn.onclick=function(){
            var url = btn.getAttribute('data-url');
            if (!url) return;
            var reason = prompt('Motivo de cancelación (opcional):')||'';
            url = url + encodeURIComponent(reason);
            btn.disabled=true;
            var item = btn.closest('.pending-item');
            if (item) item.remove();
            fetch(url).then(function(){ loadAdminPending(); loadAdminStats(); }).finally(function(){ btn.disabled=false; });
          };
        });
      }
    })
    .catch(function(err){
      console.error('Error getPendingBookings:',err);
      listEl.innerHTML = '<p class="empty">Error al cargar pendientes.</p>';
    });
}

function initAdminPanel() {
  if (!window.location.search.includes('panel=1')) return;
  var password = prompt('Introduce la contraseña de admin:');
  if (password !== ADMIN_SECRET) {
    alert('Contraseña incorrecta.');
    return;
  }
  document.getElementById('adminPanel').classList.add('show');
  loadAdminStats();
  loadAdminPending();
  var rb=document.getElementById('adminRefreshBtn');
  if (rb) {
    rb.onclick=function(){
      loadAdminStats();
      loadAdminPending();
    };
  }
}

// Track visit (solo en entorno web, no en file:// para evitar bloqueos del navegador)
function trackVisit() {
  if (location.protocol === 'http:' || location.protocol === 'https:') {
    try {
      const ref=document.referrer||'directo';
      const dev=/Mobi|Android/i.test(navigator.userAgent)?'mobile':'desktop';
      fetch(APPS_SCRIPT_URL+'?action=trackVisit&ref='+encodeURIComponent(ref)+'&dev='+dev)
        .catch(function(){});
    } catch(e){}
  }
}

// Inicializar al cargar la página
document.addEventListener('DOMContentLoaded', function() {
  loadBookings();
  loadPricing();
  loadGallery();
  initAdminPanel();
  trackVisit();

  document.getElementById('calPrev').onclick=function(){calM--;if(calM<0){calM=11;calY--}renderCal()};
  document.getElementById('calNext').onclick=function(){calM++;if(calM>11){calM=0;calY++}renderCal()};

  // i18n
  initI18n();
});

// i18n
let currentLang = 'es';
let translations = {};

function initI18n() {
  const browserLang = navigator.language.split('-')[0];
  const supported = ['es', 'ca', 'fr', 'en'];
  currentLang = supported.includes(browserLang) ? browserLang : 'es';
  loadTranslations(currentLang);
  document.getElementById('langSelect').value = currentLang;
  document.getElementById('langSelect').addEventListener('change', function(e) {
    loadTranslations(e.target.value);
  });
}

function loadTranslations(lang) {
  fetch('locales/' + lang + '.json')
    .then(r => r.json())
    .then(data => {
      translations = data;
      currentLang = lang;
      applyTranslations();
      updateDynamicElements();
      document.documentElement.lang = lang;
    })
    .catch(err => console.error('Error loading translations:', err));
}

function applyTranslations() {
  document.querySelectorAll('[data-i18n]').forEach(el => {
    const key = el.getAttribute('data-i18n');
    const keys = key.split('.');
    let value = translations;
    for (const k of keys) {
      value = value && value[k];
    }
    if (value) {
      el.innerText = value;
    }
  });
  document.querySelectorAll('[data-i18n-html]').forEach(el => {
    const key = el.getAttribute('data-i18n-html');
    const keys = key.split('.');
    let value = translations;
    for (const k of keys) {
      value = value && value[k];
    }
    if (value) {
      el.innerHTML = value;
    }
  });
  
  // Update placeholders
  document.querySelectorAll('[data-i18n]').forEach(el => {
    if (el.placeholder) {
      const key = el.getAttribute('data-i18n');
      const keys = key.split('.');
      let value = translations;
      for (const k of keys) {
        value = value && value[k];
      }
      if (value && typeof value === 'string') {
        el.placeholder = value;
      }
    }
  });
  
  // Update language selector labels
  document.querySelectorAll('#langSelect option').forEach(opt => {
    const label = opt.getAttribute('data-label');
    if (label) {
      const keys = label.split('.');
      let value = translations;
      for (const k of keys) {
        value = value && value[k];
      }
      if (value) {
        opt.textContent = value;
      }
    }
  });
  
  // Translate activities content
  updateActivitiesContent();
  // Translate restaurants content
  updateRestaurantsContent();
}

function updateDynamicElements() {
  // Update guests options
  const guestsSelect = document.getElementById('f-guests');
  guestsSelect.innerHTML = '';
  translations.guestsOptions.forEach((opt, i) => {
    const option = document.createElement('option');
    option.value = (i + 1) + ' persona' + (i === 0 ? '' : 's');
    option.textContent = opt;
    if (i === 1) option.selected = true;
    guestsSelect.appendChild(option);
  });

  // Update days and months
  MN = translations.months;
  // Update calendar if rendered
  if (document.getElementById('calGrid').children.length > 0) {
    renderCal();
  }
}

function updateActivitiesContent() {
  const activities = translations.activities;
  if (!activities || !activities.beaches) return;
  
  const sections = [
    { data_key: 'beaches', selector: '.act-card:has(h3:contains("Playas"))' },
    { data_key: 'ronda', selector: '.act-card:has(h3:contains("Camí"))' },
    { data_key: 'heritage', selector: '.act-card:has(h3:contains("Patrimonio"))' },
    { data_key: 'waterSports', selector: '.act-card:has(h3:contains("Deportes"))' },
    { data_key: 'museums', selector: '.act-card:has(h3:contains("Museos"))' },
    { data_key: 'shopping', selector: '.act-card:has(h3:contains("Compras"))' }
  ];
  
  // Translate by finding cards with the matching h3 titles
  document.querySelectorAll('.act-card').forEach((card, idx) => {
    const titleEl = card.querySelector('h3');
    const actKeys = ['beaches', 'ronda', 'heritage', 'waterSports', 'museums', 'shopping'];
    if (actKeys[idx]) {
      const actKey = actKeys[idx];
      const content = activities[actKey];
      if (content && content.desc) {
        const p = card.querySelector('p');
        if (p) p.textContent = content.desc;
      }
      if (content && content.link) {
        const a = card.querySelector('a');
        if (a) a.textContent = content.link;
      }
    }
  });
}

function updateRestaurantsContent() {
  const rests = translations.restaurants;
  if (!rests || !rests.cards) return;
  
  document.querySelectorAll('.rest-card').forEach((card, idx) => {
    if (rests.cards[idx]) {
      const rest = rests.cards[idx];
      const type = card.querySelector('.rest-type');
      const name = card.querySelector('h3');
      const desc = card.querySelector('.rest-desc');
      
      if (type) type.textContent = rest.type;
      if (name) name.textContent = rest.name;
      if (desc) desc.textContent = rest.desc;
    }
  });
}

function updateDynamicElements() {
  // Update guests options
  const guestsSelect = document.getElementById('f-guests');
  guestsSelect.innerHTML = '';
  translations.guestsOptions.forEach((opt, i) => {
    const option = document.createElement('option');
    option.value = (i + 1) + ' persona' + (i === 0 ? '' : 's');
    option.textContent = opt;
    if (i === 1) option.selected = true;
    guestsSelect.appendChild(option);
  });

  // Update days and months
  MN = translations.months;
  // Update calendar if rendered
  if (document.getElementById('calGrid').children.length > 0) {
    renderCal();
  }
}

