// terms.ts — Terms of Use page interaction
export {};
const checkbox    = document.querySelector<HTMLInputElement>('#consent-check')!;
const consentBox  = document.querySelector<HTMLElement>('#consent-box')!;
const continueBtn = document.querySelector<HTMLButtonElement>('#continue-btn')!;

function syncButton(): void {
  const checked = checkbox.checked;
  continueBtn.disabled = !checked;
  continueBtn.setAttribute('aria-disabled', checked ? 'false' : 'true');
  consentBox.classList.toggle('checked', checked);
  consentBox.textContent = checked ? '✓' : '';
}

// Sync on change
checkbox.addEventListener('change', syncButton);

// Allow clicking the visual box via keyboard on the label
consentBox.addEventListener('keydown', (e) => {
  if (e.key === 'Enter' || e.key === ' ') {
    e.preventDefault();
    checkbox.checked = !checkbox.checked;
    syncButton();
  }
});

// Navigate to upload on continue
continueBtn.addEventListener('click', () => {
  if (!checkbox.checked) return;
  window.location.href = './app.html';
});

// Init state
syncButton();
