// Medication list: rendering and the add form (replaces window.prompt).
// Dependencies are injected so the module has no hidden globals.
export function initMeds({ getState, persist, toast, esc }) {
  const list = document.getElementById('medications');
  const form = document.getElementById('medForm');
  const openBtn = document.getElementById('addMedication');
  const nameInput = document.getElementById('medName');
  const doseInput = document.getElementById('medDose');
  const scheduleInput = document.getElementById('medSchedule');
  const error = document.getElementById('medError');

  function render() {
    const arr = getState().medications || [];
    list.innerHTML = arr.length
      ? arr.map((m, i) => `<div class="med-row"><div><b>${esc(m.name)}</b><small>${esc([m.dose, m.schedule].filter(Boolean).join(' · '))}</small></div><button class="link" data-remove-med="${i}" aria-label="Remove ${esc(m.name)}">Remove</button></div>`).join('')
      : '<div class="empty">No medications listed yet.</div>';
    list.querySelectorAll('[data-remove-med]').forEach(b => b.onclick = () => {
      getState().medications.splice(Number(b.dataset.removeMed), 1);
      persist();
    });
  }

  function close(returnFocus) {
    form.hidden = true;
    form.reset();
    error.textContent = '';
    openBtn.setAttribute('aria-expanded', 'false');
    if (returnFocus) openBtn.focus();
  }

  openBtn.setAttribute('aria-expanded', 'false');
  openBtn.setAttribute('aria-controls', 'medForm');
  openBtn.addEventListener('click', () => {
    form.hidden = false;
    openBtn.setAttribute('aria-expanded', 'true');
    nameInput.focus();
  });
  document.getElementById('medCancel').addEventListener('click', () => close(true));
  form.addEventListener('keydown', e => { if (e.key === 'Escape') close(true); });
  form.addEventListener('submit', e => {
    e.preventDefault();
    const name = nameInput.value.trim();
    if (!name) {
      error.textContent = 'Enter the medication name.';
      nameInput.focus();
      return;
    }
    getState().medications.push({ name, dose: doseInput.value.trim(), schedule: scheduleInput.value.trim() });
    if (persist()) toast('Medication added.');
    close(true);
  });

  return { render };
}
