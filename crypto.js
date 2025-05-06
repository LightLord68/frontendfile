let cryptoList = [];
let selectedCrypto = null;

const currenciesContainer = document.getElementById('currencies');
const converterModal = document.getElementById('converterModal');
const closeModalBtn = document.getElementById('closeModalBtn');
const modalTitle = document.getElementById('modalTitle');
const inputAmount = document.getElementById('inputAmount');
const convertedAmount = document.getElementById('convertedAmount');
const errorMessage = document.getElementById('errorMessage');
const refreshBtn = document.getElementById('refreshBtn');
const searchInput = document.getElementById('searchInput');
const copyBtn = document.getElementById('copyBtn');

async function fetchCrypto() {
  try {
    refreshBtn.disabled = true;
    refreshBtn.textContent = 'Загрузка...';
    hideError();
    const res = await fetch('https://api.coingecko.com/api/v3/coins/markets?vs_currency=rub&order=market_cap_desc&per_page=50&page=1&sparkline=false&price_change_percentage=24h');
    if (!res.ok) throw new Error('Ошибка загрузки данных');
    cryptoList = await res.json();
    renderCryptos();
  } catch (e) {
    showError('Не удалось загрузить курсы криптовалют. Проверьте интернет.');
  } finally {
    refreshBtn.disabled = false;
    refreshBtn.textContent = '🔄 Обновить';
  }
}

function showError(text) {
  errorMessage.textContent = text;
  errorMessage.classList.remove('hidden');
}
function hideError() {
  errorMessage.classList.add('hidden');
}

function createTrendElement(change) {
  const trendEl = document.createElement('span');
  trendEl.classList.add('trend');
  if (change > 0) {
    trendEl.classList.add('up');
    trendEl.textContent = `↑ +${change.toFixed(2)}%`;
  } else if (change < 0) {
    trendEl.classList.add('down');
    trendEl.textContent = `↓ ${change.toFixed(2)}%`;
  } else {
    trendEl.classList.add('equal');
    trendEl.textContent = '→ 0.00%';
  }
  return trendEl;
}

function renderCryptos() {
  currenciesContainer.innerHTML = '';
  const filter = (searchInput.value || '').trim().toLowerCase();
  cryptoList.forEach(coin => {
    if (filter && !(
      coin.name.toLowerCase().includes(filter) ||
      coin.symbol.toLowerCase().includes(filter)
    )) return;

    const card = document.createElement('div');
    card.className = 'currency-card';

    const img = document.createElement('img');
    img.className = 'flag';
    img.src = coin.image;
    img.alt = coin.symbol.toUpperCase();
    card.appendChild(img);

    const title = document.createElement('h3');
    title.textContent = `${coin.name} (${coin.symbol.toUpperCase()})`;
    card.appendChild(title);

    const rateDiv = document.createElement('div');
    rateDiv.className = 'currency-rate';
    rateDiv.textContent = coin.current_price.toFixed(2);

    const trendEl = createTrendElement(coin.price_change_percentage_24h);
    rateDiv.appendChild(trendEl);
    card.appendChild(rateDiv);

    card.onclick = () => {
      selectedCrypto = {
        code: coin.symbol.toUpperCase(),
        name: coin.name,
        rate: coin.current_price
      };
      openConverter();
    };

    currenciesContainer.appendChild(card);
  });
}

function openConverter() {
  modalTitle.textContent = `Конвертация ${selectedCrypto.name} (${selectedCrypto.code}) → RUB`;
  inputAmount.value = '';
  convertedAmount.textContent = '0';
  converterModal.classList.remove('hidden');
  inputAmount.focus();
}

function closeConverter() {
  converterModal.classList.add('hidden');
  selectedCrypto = null;
}

function handleInput() {
  const val = parseFloat(inputAmount.value);
  if (!selectedCrypto) return;
  if (isNaN(val) || val < 0) {
    convertedAmount.textContent = '0';
    return;
  }
  const result = val * selectedCrypto.rate;
  convertedAmount.textContent = result.toFixed(2);
}

function handleCopy() {
  navigator.clipboard.writeText(convertedAmount.textContent)
    .then(() => {
      copyBtn.textContent = '✅';
      setTimeout(() => { copyBtn.textContent = '📋'; }, 1000);
    });
}

closeModalBtn.addEventListener('click', closeConverter);
inputAmount.addEventListener('input', handleInput);
refreshBtn.addEventListener('click', fetchCrypto);
converterModal.addEventListener('click', (e) => {
  if (e.target === converterModal) closeConverter();
});
searchInput.addEventListener('input', renderCryptos);
copyBtn.addEventListener('click', handleCopy);

fetchCrypto();
