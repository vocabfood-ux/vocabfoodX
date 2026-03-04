/* Global UI + Pricing Logic for VocabFood */
const MENU_ITEMS = [
  { id: 'paneer_tikka', name: 'Paneer Tikka', price: 140, category: 'Starters' },
  { id: 'veg_kebab', name: 'Hara Bhara Kebab', price: 110, category: 'Starters' },
  { id: 'chaat_counter', name: 'Live Chaat Counter', price: 160, category: 'Starters' },
  { id: 'dal_makhani', name: 'Dal Makhani', price: 120, category: 'Main' },
  { id: 'shahi_paneer', name: 'Shahi Paneer', price: 150, category: 'Main' },
  { id: 'mix_veg', name: 'Mix Veg Curry', price: 100, category: 'Main' },
  { id: 'naan', name: 'Butter Naan', price: 45, category: 'Breads' },
  { id: 'tandoori_roti', name: 'Tandoori Roti', price: 30, category: 'Breads' },
  { id: 'jeera_rice', name: 'Jeera Rice', price: 90, category: 'Rice' },
  { id: 'veg_biryani', name: 'Veg Biryani', price: 130, category: 'Rice' },
  { id: 'gulab_jamun', name: 'Gulab Jamun', price: 60, category: 'Desserts' },
  { id: 'rasmalai', name: 'Rasmalai', price: 85, category: 'Desserts' }
];

function currency(num) {
  return `₹${Math.round(num).toLocaleString('en-IN')}`;
}

function setupNav() {
  const toggle = document.querySelector('.nav-toggle');
  const links = document.querySelector('.nav-links');
  if (!toggle || !links) return;

  toggle.addEventListener('click', () => {
    links.classList.toggle('open');
  });
}

function renderMenu(container) {
  if (!container) return;
  const grouped = MENU_ITEMS.reduce((acc, item) => {
    acc[item.category] ??= [];
    acc[item.category].push(item);
    return acc;
  }, {});

  container.innerHTML = Object.entries(grouped)
    .map(([category, items]) => `
      <section class="menu-section">
        <h3>${category}</h3>
        <div class="menu-items">
          ${items
            .map(
              (item) => `
            <label class="menu-item" for="${item.id}">
              <span>${item.name} (${currency(item.price)})</span>
              <input type="checkbox" id="${item.id}" name="menuItems" value="${item.id}" data-price="${item.price}" data-name="${item.name}">
            </label>`
            )
            .join('')}
        </div>
      </section>`
    )
    .join('');
}

function getTierBasePrice(headcount) {
  if (headcount >= 400) return 150;
  if (headcount >= 201) return 160;
  if (headcount >= 101) return 170;
  if (headcount >= 51) return 180;
  return 190;
}

function getMultiStepBookingState(form) {
  const formData = new FormData(form);
  const headcount = Number(formData.get('headcount') || 0);
  
  // ✅ FIXED: Capture selected menu items
  const selectedMenu = [...form.querySelectorAll('input[name="menuItems"]:checked')].map(input => input.value);
  
  const addOns = [...form.querySelectorAll('input[name="addons"]:checked')].map((input) => ({
    key: input.value,
    label: input.dataset.label,
    price: Number(input.dataset.price) || 0
  }));

  // ✅ FIXED: Capture distance if input exists
  const distanceKm = Number(formData.get('distanceKm') || 0);

  const basePerPlate = getTierBasePrice(headcount);
  const addOnPerPlate = addOns.reduce((sum, addOn) => sum + addOn.price, 0);
  const finalPerPlate = basePerPlate + addOnPerPlate;
  const finalTotal = finalPerPlate * headcount;

  return {
    eventType: formData.get('eventType') || 'Corporate Event',
    date: formData.get('date') || '',
    time: formData.get('time') || '',
    location: formData.get('location') || '',
    headcount,
    distanceKm, // ✅ ADDED
    selectedMenu, // ✅ ADDED
    addOns,
    basePerPlate,
    addOnPerPlate,
    finalPerPlate,
    finalTotal,
    name: formData.get('name') || '',
    phone: formData.get('phone') || '',
    email: formData.get('email') || '',
    instructions: formData.get('instructions') || ''
  };
}

function setupBookingPage() {
  const form = document.querySelector('#bookingForm');
  const step1 = document.querySelector('#bookingStep1');
  const step2 = document.querySelector('#bookingStep2');
  const step3 = document.querySelector('#bookingStep3');
  const summaryBox = document.querySelector('#priceSummary');
  const reviewSummary = document.querySelector('#reviewSummary');

  if (!form || !step1 || !step2 || !step3 || !summaryBox || !reviewSummary) return;

  const showStep = (stepNumber) => {
    step1.hidden = stepNumber !== 1;
    step2.hidden = stepNumber !== 2;
    step3.hidden = stepNumber !== 3;
  };

  const renderPricing = () => {
    const state = getMultiStepBookingState(form);
    summaryBox.innerHTML = `
      <div class="price-row"><span>Base price per plate</span><span>${currency(state.basePerPlate)}</span></div>
      <div class="price-row"><span>Add-on cost per plate</span><span>${currency(state.addOnPerPlate)}</span></div>
      <div class="price-row"><span>Final per plate price</span><span>${currency(state.finalPerPlate)}</span></div>
      <div class="price-row"><span>Total guest count</span><span>${state.headcount || 0}</span></div>
      <div class="price-row total"><span>Final total amount</span><span>${currency(state.finalTotal)}</span></div>`;
  };

  const renderReview = () => {
    const state = getMultiStepBookingState(form);
    const addOnNames = state.addOns.map((item) => item.label).join(', ') || 'No add-ons selected';
    
    // ✅ ADDED: Show selected menu items in review
    const selectedMenuNames = state.selectedMenu
      .map((id) => MENU_ITEMS.find((i) => i.id === id)?.name || id.replaceAll('_', ' '))
      .filter(Boolean)
      .join(', ') || 'None selected';

    reviewSummary.innerHTML = `
      <h3>Booking Review</h3>
      <p><strong>Event Type:</strong> ${state.eventType}</p>
      <p><strong>Event Date:</strong> ${state.date || '-'}</p>
      <p><strong>Event Time:</strong> ${state.time || '-'}</p>
      <p><strong>Event Location:</strong> ${state.location || '-'}</p>
      <p><strong>Distance:</strong> ${state.distanceKm || 0} km</p>
      <p><strong>Guest Count:</strong> ${state.headcount || 0}</p>
      <p><strong>Selected Menu:</strong> ${selectedMenuNames}</p>
      <p><strong>Selected Add-ons:</strong> ${addOnNames}</p>
      <p><strong>Base Price / Plate:</strong> ${currency(state.basePerPlate)}</p>
      <p><strong>Add-ons / Plate:</strong> ${currency(state.addOnPerPlate)}</p>
      <p><strong>Final Price / Plate:</strong> ${currency(state.finalPerPlate)}</p>
      <p><strong>Total Cost:</strong> ${currency(state.finalTotal)}</p>`;
  };

  const validateStep1 = () => {
    const requiredIds = ['eventType', 'date', 'time', 'location', 'headcount'];
    for (const id of requiredIds) {
      const el = document.getElementById(id);
      if (!el || !el.checkValidity()) {
        el?.reportValidity();
        return false;
      }
    }
    return true;
  };

  form.addEventListener('input', () => {
    renderPricing();
    if (!step3.hidden) renderReview();
  });

  document.querySelector('#nextToStep2')?.addEventListener('click', () => {
    if (!validateStep1()) return;
    renderPricing();
    showStep(2);
  });

  document.querySelector('#backToStep1')?.addEventListener('click', () => showStep(1));

  document.querySelector('#nextToStep3')?.addEventListener('click', () => {
    renderReview();
    showStep(3);
  });

  document.querySelector('#backToStep2')?.addEventListener('click', () => showStep(2));

  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    const state = getMultiStepBookingState(form);
    const submitBtn = form.querySelector('button[type="submit"]');

    const payload = {
      eventType: state.eventType,
      date: state.date,
      time: state.time,
      location: state.location,
      guests: state.headcount,
      perPlatePrice: state.finalPerPlate,
      totalAmount: state.finalTotal,
      name: state.name,
      phone: state.phone,
      email: state.email,
      addOns: state.addOns.map((item) => item.label).join(", ")
    };

    try {
      if (submitBtn) submitBtn.disabled = true;

      const response = await fetch('https://script.google.com/macros/s/AKfycbzYKVnmtJ4QsHRRrhlzRZVePc1Yrx_1tlzYPbnP-rd-L2IyCaToV3SMorrbAr6CE2FmqQ/exec', {
        method: 'POST',
        body: new URLSearchParams(payload),
        redirect: 'follow'
      });

      const result = await response.text();

      if (result.trim() !== "success") {
        throw new Error("Server did not return success");
      }

      // ✅ FIXED: Store booking data in localStorage for summary page
      const breakdown = {
        base: state.basePerPlate * state.headcount,
        menuCost: 0, // Add logic if menu items have separate pricing
        subtotal: state.finalTotal,
        discount: 0, // Add discount logic if needed
        surcharge: 0, // Add surcharge logic if needed
        distanceCharge: state.distanceKm * 10, // Example: ₹10 per km
        total: state.finalTotal + (state.distanceKm * 10)
      };
      
      localStorage.setItem('vocabfoodBooking', JSON.stringify({ state, breakdown }));

      alert("Booking request submitted successfully!");
      form.reset();
      renderPricing();
      reviewSummary.innerHTML = '';
      showStep(1);

    } catch (error) {
      console.error("Booking submission error:", error);
      alert("Unable to submit booking request right now. Please try again.");
    } finally {
      if (submitBtn) submitBtn.disabled = false;
    }
  });

  renderPricing();
  showStep(1);
}

function setupSummaryPage() {
  const summaryRoot = document.querySelector('#orderSummaryRoot');
  if (!summaryRoot) return;

  const stored = localStorage.getItem('vocabfoodBooking');
  if (!stored) {
    summaryRoot.innerHTML = '<p>No booking found. Please complete the booking form first.</p>';
    return;
  }

  try {
    const { state, breakdown } = JSON.parse(stored);
    
    // ✅ FIXED: Defensive checks for missing data
    if (!state || !breakdown) {
      summaryRoot.innerHTML = '<p>Invalid booking data. Please complete the booking again.</p>';
      return;
    }

    const selectedMenuNames = (state.selectedMenu || [])
      .map((id) => MENU_ITEMS.find((i) => i.id === id)?.name || id.replaceAll('_', ' '))
      .filter(Boolean)
      .join(', ') || 'None selected';

    summaryRoot.innerHTML = `
      <div class="card">
        <h3>Booking Details</h3>
        <p><strong>Name:</strong> ${state.name || '-'}</p>
        <p><strong>Phone:</strong> ${state.phone || '-'}</p>
        <p><strong>Email:</strong> ${state.email || '-'}</p>
        <p><strong>Event:</strong> ${state.eventType || '-'} on ${state.date || '-'} at ${state.time || '-'}</p>
        <p><strong>Location:</strong> ${state.location || '-'} (${state.distanceKm || 0} km)</p>
        <p><strong>Headcount:</strong> ${state.headcount || 0}</p>
        <p><strong>Menu:</strong> ${selectedMenuNames}</p>
      </div>
      <div class="card">
        <h3>Cost Breakdown</h3>
        <ul class="cost-list">
          <li>Base Cost: ${currency(breakdown.base || 0)}</li>
          <li>Menu Cost: ${currency(breakdown.menuCost || 0)}</li>
          <li>Subtotal: ${currency(breakdown.subtotal || 0)}</li>
          <li>Discount: -${currency(breakdown.discount || 0)}</li>
          <li>Event Surcharge: ${currency(breakdown.surcharge || 0)}</li>
          <li>Distance Charge: ${currency(breakdown.distanceCharge || 0)}</li>
          <li><strong>Total: ${currency(breakdown.total || 0)}</strong></li>
        </ul>
        <button class="btn" id="confirmOrderBtn" type="button">Confirm Order</button>
        <p class="notice" id="confirmMsg"></p>
      </div>`;

    document.querySelector('#confirmOrderBtn')?.addEventListener('click', () => {
      const msg = document.querySelector('#confirmMsg');
      if (msg) msg.textContent = 'Order confirmed! Our team will contact you shortly.';
    });
  } catch (error) {
    console.error("Error loading summary:", error);
    summaryRoot.innerHTML = '<p>Error loading booking details. Please try again.</p>';
  }
}

function setupStandaloneMenuPage() {
  const menuRoot = document.querySelector('#menuRoot');
  if (!menuRoot) return;
  renderMenu(menuRoot);
}

document.addEventListener('DOMContentLoaded', () => {
  setupNav();
  setupBookingPage();
  setupSummaryPage();
  setupStandaloneMenuPage();
});
