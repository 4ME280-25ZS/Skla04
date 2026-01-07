// Supabase konfigurace
const SUPABASE_URL = 'https://zsesnowhztvizghcqgqf.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpzZXNub3doenR2aXpnaGNxZ3FmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njc3Nzg4MTQsImV4cCI6MjA4MzM1NDgxNH0.8VHcuCFq9wia3FMwl7vMQcnF9Z0jg_ZMlsaR34ttCj8';

let supabaseClient;
let realtimeChannel = null;

if (window.supabase && window.supabase.createClient) {
  supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
  console.log('✓ Supabase client vytvořen');
} else {
  console.error('❌ Supabase knihovna není dostupná');
}

// DOM elementy
const giftsList = document.getElementById('giftsList');
const modal = document.getElementById('modal');
const nameInput = document.getElementById('nameInput');
const confirmBtn = document.getElementById('confirmBtn');
const cancelBtn = document.getElementById('cancelBtn');
const loading = document.getElementById('loading');
const modalGiftName = document.getElementById('modalGiftName');

let currentGiftId = null;
let gifts = [];

// Načti gify ze Supabase
async function loadGifts() {
  try {
    console.log('Načítám gify...');
    loading.style.display = 'block';
    giftsList.innerHTML = '';

    const { data, error } = await supabaseClient
      .from('gifts')
      .select('*')
      .order('created_at', { ascending: true });

    if (error) {
      console.error('Supabase error:', error);
      throw error;
    }

    console.log('Darů načteno:', data?.length || 0);
    gifts = data || [];
    
    if (gifts.length === 0) {
      loading.innerHTML = '❌ Žádné gify v databázi. Přidej je do Supabase.';
      return;
    }
    
    renderGifts();
    loading.style.display = 'none';

    // Nastav real-time listener
    subscribeToGifts();
  } catch (err) {
    console.error('Chyba při načítání darů:', err);
    loading.innerHTML = `❌ Chyba: ${err.message || 'Zkus znovu později'}`;
  }
}

// Vykresli seznam darů
function renderGifts() {
  giftsList.innerHTML = '';

  gifts.forEach(gift => {
    const isReserved = gift.reserved_by !== null;
    
    const giftEl = document.createElement('div');
    giftEl.className = 'gift-item';
    giftEl.innerHTML = `
      <div class="gift-info">
        <span class="gift-name">${escapeHtml(gift.name)}</span>
        <span class="gift-status ${isReserved ? 'reserved' : ''}">
          ${isReserved ? `✓ Koupi: ${escapeHtml(gift.reserved_by)}` : 'Dostupné'}
        </span>
      </div>
      <div class="gift-buttons">
        ${isReserved 
          ? `<button class="btn btn-secondary btn-small" onclick="cancelReservation(${gift.id})">Zrušit</button>` 
          : `<button class="btn btn-reserve" onclick="openModal(${gift.id}, '${escapeHtml(gift.name).replace(/'/g, "\\'")}')" >Rezervovat</button>`
        }
      </div>
    `;
    
    giftsList.appendChild(giftEl);
  });
}

// Otevři modal
function openModal(giftId, giftName) {
  currentGiftId = giftId;
  modalGiftName.textContent = `"${giftName}"`;
  nameInput.value = '';
  nameInput.focus();
  modal.classList.add('active');
}

// Zavři modal
function closeModal() {
  modal.classList.remove('active');
  currentGiftId = null;
}

// Potvrď rezervaci
async function confirmReservation() {
  const name = nameInput.value.trim();

  if (!name) {
    alert('Prosím, vyplň své jméno');
    return;
  }

  if (!currentGiftId) return;

  try {
    confirmBtn.disabled = true;
    confirmBtn.textContent = 'Ukládám...';

    const { error } = await supabaseClient
      .from('gifts')
      .update({ reserved_by: name })
      .eq('id', currentGiftId);

    if (error) throw error;

    closeModal();
    console.log('✓ Dar rezervován');
    
    // Načti svěží data a vykresl
    await loadGifts();
    
  } catch (err) {
    console.error('Chyba při rezervaci:', err);
    alert('❌ Chyba při rezervaci. Zkus znovu.');
  } finally {
    confirmBtn.disabled = false;
    confirmBtn.textContent = 'Potvrdit';
  }
}

// Real-time updates
function subscribeToGifts() {
  if (!supabaseClient || realtimeChannel) return;
  
  console.log('📡 Nastaveuju real-time listener...');
  realtimeChannel = supabaseClient
    .channel('gifts-updates', {
      config: { broadcast: { self: true } }
    })
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'gifts' },
      (payload) => {
        console.log('🔄 Real-time update:', payload);
        loadGifts();
      }
    )
    .subscribe((status) => {
      console.log('📡 Real-time status:', status);
    });
}

// Utility pro escape HTML
function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

// Zrušit rezervaci
async function cancelReservation(giftId) {
  if (!confirm('Opravdu chceš zrušit tuto rezervaci?')) return;

  try {
    const { error } = await supabaseClient
      .from('gifts')
      .update({ reserved_by: null })
      .eq('id', giftId);

    if (error) throw error;

    console.log('✓ Rezervace zrušena');
    
    // Načti svěží data a vykresl
    await loadGifts();
    
  } catch (err) {
    console.error('Chyba při zrušení:', err);
    alert('❌ Chyba při zrušení. Zkus znovu.');
  }
}

// Event listenery
cancelBtn.addEventListener('click', closeModal);
confirmBtn.addEventListener('click', confirmReservation);

nameInput.addEventListener('keypress', (e) => {
  if (e.key === 'Enter') confirmReservation();
});

// Zavři modal kliknutím mimo
modal.addEventListener('click', (e) => {
  if (e.target === modal) closeModal();
});

// Načti gify na startu
loadGifts();
