let currenciesList = null;
let selectedCurrency = null;

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

const flagMap = {
  USD: "US", EUR: "EU", GBP: "GB", JPY: "JP", CNY: "CN", RUB: "RU", KZT: "KZ", BYN: "BY", CHF: "CH",
  AUD: "AU", AZN: "AZ", AMD: "AM", BGN: "BG", BRL: "BR", HUF: "HU", VND: "VN", HKD: "HK", GEL: "GE",
  DKK: "DK", AED: "AE", EGP: "EG", INR: "IN", IDR: "ID", CAD: "CA", QAR: "QA", KGS: "KG", MDL: "MD",
  NZD: "NZ", NOK: "NO", PLN: "PL", RON: "RO", SGD: "SG", TJS: "TJ", THB: "TH", TRY: "TR",
  TMT: "TM", UZS: "UZ", UAH: "UA", CZK: "CZ", SEK: "SE", RSD: "RS", ZAR: "ZA", KRW: "KR"
};
function getFlagUrl(code) {
  if (flagMap[code]) return `https://cdn.jsdelivr.net/npm/country-flag-icons/3x2/${flagMap[code]}.svg`;
  if (code === "XDR") return "https://upload.wikimedia.org/wikipedia/commons/5/5c/UN_Flag.png";
  return "https://cdn.jsdelivr.net/npm/country-flag-icons/3x2/UN.svg";
}

async function fetchCurrencies() {
  try {
    refreshBtn.disabled = true;
    refreshBtn.textContent = 'Загрузка...';
    hideError();
    const url = 'https://www.cbr-xml-daily.ru/daily_json.js?t=' + Date.now();
    const response = await fetch(url);
    if (!response.ok) throw new Error('Ошибка загрузки данных');
    const data = await response.json();
    currenciesList = data.Valute;
    renderCurrencies();
  } catch (e) {
    showError('Не удалось загрузить курсы валют. Проверьте интернет.');
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

function createTrendElement(cur) {
  const current = cur.Value / cur.Nominal;
  const previous = cur.Previous / cur.Nominal;
  const diff = current - previous;
  const trendEl = document.createElement('span');
  trendEl.classList.add('trend');
  if (diff > 0) {
    trendEl.classList.add('up');
    trendEl.textContent = `↑ +${diff.toFixed(4)}`;
  } else if (diff < 0) {
    trendEl.classList.add('down');
    trendEl.textContent = `↓ ${diff.toFixed(4)}`;
  } else {
    trendEl.classList.add('equal');
    trendEl.textContent = '→ 0.0000';
  }
  return trendEl;
}

function renderCurrencies() {
  currenciesContainer.innerHTML = '';
  let codes = currenciesList ? Object.keys(currenciesList).sort() : [];
  codes.unshift('RUB');
  const filter = (searchInput && searchInput.value || '').trim().toLowerCase();
  codes.forEach(code => {
    let cur;
    if (code === 'RUB') {
      cur = { Name: 'Российский рубль', CharCode: 'RUB', Value: 1, Previous: 1, Nominal: 1 };
    } else {
      cur = currenciesList[code];
    }
    if (!cur) return;
    if (filter && !(cur.Name.toLowerCase().includes(filter) || code.toLowerCase().includes(filter))) return;

    const card = document.createElement('div');
    card.className = 'currency-card';

    const flag = document.createElement('img');
    flag.className = 'flag';
    flag.alt = code;
    flag.src = getFlagUrl(code);

    const title = document.createElement('h3');
    title.textContent = `${cur.Name} (${cur.CharCode})`;

    const desc = document.createElement('div');
    desc.className = 'currency-desc';
    desc.textContent = cur.Nominal === 1 ? '' : `за ${cur.Nominal} ${cur.CharCode}`;

    const rateDiv = document.createElement('div');
    rateDiv.className = 'currency-rate';
    const nominalValue = (cur.Value / cur.Nominal).toFixed(4);
    rateDiv.textContent = nominalValue;

    const trendEl = createTrendElement(cur);
    rateDiv.appendChild(trendEl);

    card.appendChild(flag);
    card.appendChild(title);
    if (desc.textContent) card.appendChild(desc);
    card.appendChild(rateDiv);

    card.onclick = () => {
      selectedCurrency = {
        code: cur.CharCode,
        name: cur.Name,
        rate: cur.Value / cur.Nominal,
        nominal: cur.Nominal
      };
      openConverter();
    };

    currenciesContainer.appendChild(card);
  });
}

function openConverter() {
  modalTitle.textContent = `Конвертация ${selectedCurrency.name} (${selectedCurrency.code}) → RUB`;
  inputAmount.value = '';
  convertedAmount.textContent = '0';
  converterModal.classList.remove('hidden');
  inputAmount.focus();
}

function closeConverter() {
  converterModal.classList.add('hidden');
  selectedCurrency = null;
}

function handleInput() {
  const val = parseFloat(inputAmount.value);
  if (!selectedCurrency) return;
  if (isNaN(val) || val < 0) {
    convertedAmount.textContent = '0';
    return;
  }
  let result = 0;
  if (selectedCurrency.code === 'RUB') {
    result = val;
  } else {
    result = val * selectedCurrency.rate;
  }
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
refreshBtn.addEventListener('click', fetchCurrencies);
if (converterModal) {
  converterModal.addEventListener('click', (e) => {
    if (e.target === converterModal) closeConverter();
  });
}
if (searchInput) searchInput.addEventListener('input', renderCurrencies);
if (copyBtn) copyBtn.addEventListener('click', handleCopy);

fetchCurrencies();
setInterval(fetchCurrencies, 10 * 60 * 1000);
