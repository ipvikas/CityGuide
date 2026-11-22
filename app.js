// Know about the City (plain JavaScript, no libraries, no API keys)
const $ = function (id) { return document.getElementById(id); };
const esc = function (s) { return String(s).replace(/[&<>"]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]; }); };

// ---------- Saved settings (language, units, recent cities) ----------
function load(key, fallback) { try { return JSON.parse(localStorage.getItem(key)) || fallback; } catch (e) { return fallback; } }
function save(key, value) { try { localStorage.setItem(key, JSON.stringify(value)); } catch (e) {} }
const prefs = Object.assign({ lang: "en", temp: "C", wind: "kmh", pressure: "hpa" }, load("kw_prefs", {}));
let recent = load("kw_recent", []);
let cities = [];            // first city = main view; the rest are for comparing (max 4)
let runId = 0, clockTimer, rateTimer, currencyInfo = null;

// ---------- Translations ----------
// English is the default. A missing phrase falls back to English.
const TEXT = {
  en: { title: "What to wear", heavy: "Heavy coat, hat and gloves", warm: "Warm jacket", light: "Light jacket or sweater", tshirt: "T-shirt weather", shorts: "Shorts, sunscreen and water", umbrella: "Umbrella", boots: "Waterproof boots", windbreaker: "Windbreaker" },
  hi: { title: "क्या पहनें", heavy: "भारी कोट, टोपी और दस्ताने", warm: "गर्म जैकेट", light: "हल्की जैकेट या स्वेटर", tshirt: "टी-शर्ट का मौसम", shorts: "शॉर्ट्स, सनस्क्रीन और पानी", umbrella: "छाता", boots: "वाटरप्रूफ बूट", windbreaker: "विंडचीटर" },
  es: { title: "Qué ponerse", heavy: "Abrigo grueso, gorro y guantes", warm: "Chaqueta de abrigo", light: "Chaqueta ligera o suéter", tshirt: "Tiempo de camiseta", shorts: "Pantalones cortos, protector solar y agua", umbrella: "Paraguas", boots: "Botas impermeables", windbreaker: "Cortavientos" },
  fr: { title: "Que porter", heavy: "Manteau épais, bonnet et gants", warm: "Veste chaude", light: "Veste légère ou pull", tshirt: "Temps de t-shirt", shorts: "Short, crème solaire et eau", umbrella: "Parapluie", boots: "Bottes imperméables", windbreaker: "Coupe-vent" },
  de: { title: "Was anziehen", heavy: "Dicker Mantel, Mütze und Handschuhe", warm: "Warme Jacke", light: "Leichte Jacke oder Pullover", tshirt: "T-Shirt-Wetter", shorts: "Shorts, Sonnencreme und Wasser", umbrella: "Regenschirm", boots: "Wasserdichte Stiefel", windbreaker: "Windjacke" },
  pt: { title: "O que vestir", heavy: "Casaco grosso, gorro e luvas", warm: "Jaqueta quente", light: "Jaqueta leve ou suéter", tshirt: "Clima de camiseta", shorts: "Bermuda, protetor solar e água", umbrella: "Guarda-chuva", boots: "Botas impermeáveis", windbreaker: "Corta-vento" }
};
Object.assign(TEXT.en, { appName: "Know about the City", tagline: "City Guide - Vikas", language: "Language", placeholder: "Type a city, e.g. London", search: "Search", searching: "Searching...", addCity: "Add city to compare", loading: "Loading weather...", temp: "Temperature", wind: "Wind", pressure: "Pressure", humidity: "Humidity", rain: "Chance of rain", feels: "Feels like", low: "Low", high: "High", forecast: "7-day forecast", compare: "Compare cities", remove: "Remove", now: "Now", sky: "Sky", localTime: "Local time", currency: "Currency", places: "Places to visit", checked: "checked", w_clear: "Clear sky", w_mostlyClear: "Mostly clear", w_partlyCloudy: "Partly cloudy", w_cloudy: "Cloudy", w_fog: "Foggy", w_drizzle: "Drizzle", w_rain: "Rainy", w_snow: "Snowy", w_showers: "Rain showers", w_thunder: "Thunderstorm", w_dusty: "Dusty", w_windy: "Windy", aStorm: "Thunderstorm warning: stay indoors if you can.", aWind: "Strong wind warning.", aHeat: "Extreme heat: drink plenty of water.", eEmpty: "Please type a city name first.", eNotFound: "We couldn't find \"{n}\". Check the spelling or try a nearby big city.", eNetwork: "We couldn't get the weather. Check your internet connection and try again.", eCurrency: "Currency details aren't available right now.", ePlaces: "We couldn't find places to visit right now.", eMax: "You can compare up to 4 cities." });
Object.assign(TEXT.es, { appName: "Conoce la Ciudad", tagline: "City Guide - Vikas", language: "Idioma", placeholder: "Escribe una ciudad, p. ej. Londres", search: "Buscar", searching: "Buscando...", addCity: "Añadir ciudad para comparar", loading: "Cargando el tiempo...", temp: "Temperatura", wind: "Viento", pressure: "Presión", humidity: "Humedad", rain: "Prob. de lluvia", feels: "Sensación", low: "Mín.", high: "Máx.", forecast: "Pronóstico de 7 días", compare: "Comparar ciudades", remove: "Quitar", now: "Ahora", sky: "Cielo", localTime: "Hora local", currency: "Moneda", places: "Lugares para visitar", checked: "actualizado", w_clear: "Despejado", w_mostlyClear: "Mayormente despejado", w_partlyCloudy: "Parcialmente nublado", w_cloudy: "Nublado", w_fog: "Niebla", w_drizzle: "Llovizna", w_rain: "Lluvia", w_snow: "Nieve", w_showers: "Chubascos", w_thunder: "Tormenta", w_dusty: "Polvoriento", w_windy: "Ventoso", aStorm: "Alerta de tormenta: quédate en interiores si puedes.", aWind: "Alerta de viento fuerte.", aHeat: "Calor extremo: bebe mucha agua.", eEmpty: "Escribe primero el nombre de una ciudad.", eNotFound: "No encontramos \"{n}\". Revisa la ortografía o prueba una ciudad grande cercana.", eNetwork: "No pudimos obtener el tiempo. Revisa tu conexión a internet e inténtalo de nuevo.", eCurrency: "Los datos de moneda no están disponibles ahora.", ePlaces: "No encontramos lugares para visitar ahora.", eMax: "Puedes comparar hasta 4 ciudades." });
Object.assign(TEXT.fr, { appName: "Connaître la ville", tagline: "City Guide - Vikas", language: "Langue", placeholder: "Saisissez une ville, ex. Londres", search: "Rechercher", searching: "Recherche...", addCity: "Ajouter une ville à comparer", loading: "Chargement de la météo...", temp: "Température", wind: "Vent", pressure: "Pression", humidity: "Humidité", rain: "Risque de pluie", feels: "Ressenti", low: "Min.", high: "Max.", forecast: "Prévisions sur 7 jours", compare: "Comparer les villes", remove: "Retirer", now: "Maintenant", sky: "Ciel", localTime: "Heure locale", currency: "Devise", places: "Lieux à visiter", checked: "vérifié", w_clear: "Dégagé", w_mostlyClear: "Plutôt dégagé", w_partlyCloudy: "Partiellement nuageux", w_cloudy: "Nuageux", w_fog: "Brouillard", w_drizzle: "Bruine", w_rain: "Pluie", w_snow: "Neige", w_showers: "Averses", w_thunder: "Orage", w_dusty: "Poussiéreux", w_windy: "Venteux", aStorm: "Alerte orage : restez à l'intérieur si possible.", aWind: "Alerte vent fort.", aHeat: "Chaleur extrême : buvez beaucoup d'eau.", eEmpty: "Saisissez d'abord le nom d'une ville.", eNotFound: "Impossible de trouver « {n} ». Vérifiez l'orthographe ou essayez une grande ville proche.", eNetwork: "Impossible d'obtenir la météo. Vérifiez votre connexion internet et réessayez.", eCurrency: "Les informations sur la devise sont indisponibles pour le moment.", ePlaces: "Aucun lieu à visiter trouvé pour le moment.", eMax: "Vous pouvez comparer jusqu'à 4 villes." });
Object.assign(TEXT.hi, { appName: "शहर को जानें", tagline: "City Guide - Vikas", language: "भाषा", placeholder: "शहर लिखें, जैसे London", search: "खोजें", searching: "खोज रहे हैं...", addCity: "तुलना के लिए शहर जोड़ें", loading: "मौसम लोड हो रहा है...", temp: "तापमान", wind: "हवा", pressure: "दबाव", humidity: "नमी", rain: "बारिश की संभावना", feels: "महसूस होता है", low: "न्यूनतम", high: "अधिकतम", forecast: "7 दिन का पूर्वानुमान", compare: "शहरों की तुलना", remove: "हटाएं", now: "अभी", sky: "आसमान", localTime: "स्थानीय समय", currency: "मुद्रा", places: "घूमने की जगहें", checked: "जांचा गया", w_clear: "साफ आसमान", w_mostlyClear: "ज़्यादातर साफ", w_partlyCloudy: "आंशिक बादल", w_cloudy: "बादल", w_fog: "कोहरा", w_drizzle: "बूंदाबांदी", w_rain: "बारिश", w_snow: "बर्फबारी", w_showers: "बौछारें", w_thunder: "आंधी-तूफान", w_dusty: "धूल भरा", w_windy: "तेज़ हवा", aStorm: "आंधी-तूफान की चेतावनी: हो सके तो घर के अंदर रहें।", aWind: "तेज़ हवा की चेतावनी।", aHeat: "भीषण गर्मी: खूब पानी पिएं।", eEmpty: "कृपया पहले शहर का नाम लिखें।", eNotFound: "\"{n}\" नहीं मिला। वर्तनी जांचें या पास का बड़ा शहर आज़माएं।", eNetwork: "मौसम नहीं मिल सका। इंटरनेट जांचें और फिर कोशिश करें।", eCurrency: "मुद्रा की जानकारी अभी उपलब्ध नहीं है।", ePlaces: "अभी घूमने की जगहें नहीं मिल सकीं।", eMax: "आप अधिकतम 4 शहरों की तुलना कर सकते हैं।" });

function L(key) { return (TEXT[prefs.lang] || {})[key] || TEXT.en[key] || key; }

// ---------- Unit conversion (the API always gives °C, km/h and hPa) ----------
function T(c) { return prefs.temp === "F" ? Math.round(c * 9 / 5 + 32) + "°F" : Math.round(c) + "°C"; }
function W(kmh) {
  if (prefs.wind === "ms") return (kmh / 3.6).toFixed(1) + " m/s";
  if (prefs.wind === "mph") return Math.round(kmh / 1.609344) + " mph";
  return Math.round(kmh) + " km/h";
}
function P(hpa) {
  if (prefs.pressure === "atm") return (hpa / 1013.25).toFixed(3) + " atm";
  return Math.round(hpa) + (prefs.pressure === "mbar" ? " mbar" : " hPa");
}

// ---------- Weather codes -> description key + emoji (every code gets an icon) ----------
function describe(code) {
  if (code === 0) return { key: "clear", emoji: "☀️" };
  if (code === 1) return { key: "mostlyClear", emoji: "🌤️" };
  if (code === 2) return { key: "partlyCloudy", emoji: "⛅" };
  if (code === 45 || code === 48) return { key: "fog", emoji: "🌫️" };
  if (code >= 51 && code <= 57) return { key: "drizzle", emoji: "🌦️" };
  if (code >= 61 && code <= 67) return { key: "rain", emoji: "🌧️" };
  if ((code >= 71 && code <= 77) || code === 85 || code === 86) return { key: "snow", emoji: "🌨️" };
  if (code >= 80 && code <= 82) return { key: "showers", emoji: "🌦️" };
  if (code >= 95) return { key: "thunder", emoji: "⛈️" };
  return { key: "cloudy", emoji: "☁️" }; // code 3 and anything unexpected
}
function isRainCode(code) { return (code >= 51 && code <= 67) || (code >= 80 && code <= 82) || code >= 95; }
function isSnowCode(code) { return (code >= 71 && code <= 77) || code === 85 || code === 86; }

// Sky used for the label, emoji and page background
function getSky(e) {
  const d = describe(e.code);
  if (e.raining) return { bg: "rainy", key: d.key, emoji: d.emoji };
  if (e.snowing) return { bg: "snowy", key: d.key, emoji: d.emoji };
  if (e.dust >= 100) return { bg: "dusty", key: "dusty", emoji: "🏜️" };
  if (d.key === "fog") return { bg: "foggy", key: d.key, emoji: d.emoji };
  if (e.wind >= 30) return { bg: "windy", key: "windy", emoji: "💨" };
  if (d.key === "cloudy" || d.key === "partlyCloudy") return { bg: "cloudy", key: d.key, emoji: d.emoji };
  return { bg: "clear", key: d.key, emoji: d.emoji };
}

// ---------- Outfit rules (see "Outfit rules" in PRD.md) ----------
function getOutfitAdvice(e) {
  const advice = [];
  const t = Math.round(e.feels);
  if (t <= 0) advice.push("🧥 " + L("heavy"));
  else if (t <= 10) advice.push("🧥 " + L("warm"));
  else if (t <= 18) advice.push("🧶 " + L("light"));
  else if (t <= 26) advice.push("👕 " + L("tshirt"));
  else advice.push("🩳 " + L("shorts"));
  if (e.snowing) advice.push("🥾 " + L("boots"));
  else if (e.raining || e.rainChance >= 50) advice.push("☔ " + L("umbrella"));
  if (e.wind >= 30) advice.push("💨 " + L("windbreaker"));
  return advice;
}

// Weather alerts
function getAlerts(e) {
  const a = [];
  if (e.code >= 95) a.push("⛈️ " + L("aStorm"));
  if (e.wind >= 60) a.push("🌬️ " + L("aWind"));
  if (e.feels >= 38) a.push("🥵 " + L("aHeat"));
  return a;
}

// ---------- Open-Meteo ----------
async function getJson(url) {
  const response = await fetch(url);
  if (!response.ok) throw new Error("request failed");
  return response.json();
}

async function getDust(lat, lon) {
  try {
    const data = await getJson("https://air-quality-api.open-meteo.com/v1/air-quality?current=dust&latitude=" + lat + "&longitude=" + lon);
    return data.current.dust || 0;
  } catch (e) { return 0; }
}

// Find a city and get everything we need about it. Returns null if the city doesn't exist.
async function loadCity(name) {
  const geo = await getJson("https://geocoding-api.open-meteo.com/v1/search?count=1&language=" + prefs.lang + "&name=" + encodeURIComponent(name));
  if (!geo.results || geo.results.length === 0) return null;
  const c = geo.results[0];
  const results = await Promise.all([
    getJson("https://api.open-meteo.com/v1/forecast?latitude=" + c.latitude + "&longitude=" + c.longitude +
      "&current=temperature_2m,apparent_temperature,relative_humidity_2m,weather_code,wind_speed_10m,surface_pressure,precipitation,snowfall" +
      "&daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max" +
      "&wind_speed_unit=kmh&forecast_days=7&timezone=auto"),
    getDust(c.latitude, c.longitude)
  ]);
  const w = results[0], n = w.current, d = w.daily;
  const snowing = isSnowCode(n.weather_code) || n.snowfall > 0;
  return {
    name: c.name, country: c.country || "", cc: c.country_code, lat: c.latitude, lon: c.longitude,
    tz: w.timezone, abbr: w.timezone_abbreviation,
    code: n.weather_code, temp: n.temperature_2m, feels: n.apparent_temperature,
    humidity: n.relative_humidity_2m, wind: n.wind_speed_10m, pressure: n.surface_pressure,
    rainChance: d.precipitation_probability_max[0] || 0, low: d.temperature_2m_min[0], high: d.temperature_2m_max[0],
    snowing: snowing, raining: isRainCode(n.weather_code) || (n.precipitation > 0 && !snowing), dust: results[1],
    days: d.time.map(function (t, i) { return { date: t, code: d.weather_code[i], low: d.temperature_2m_min[i], high: d.temperature_2m_max[i] }; })
  };
}

// ---------- Drawing the page ----------
function showMessage(text, keepResult) {
  $("message").textContent = text;
  $("message").hidden = false;
  if (!keepResult) $("result").hidden = true;
}

function renderAll() {
  if (cities.length === 0) return;
  const e = cities[0], sky = getSky(e);
  document.body.className = "bg-" + sky.bg;

  $("city-name").textContent = e.name + (e.country ? ", " + e.country : "");
  $("weather-emoji").textContent = sky.emoji;
  $("weather-description").textContent = L("w_" + sky.key);
  $("temperature").textContent = T(e.temp);
  $("feels-like").textContent = L("feels") + " " + T(e.feels) + " · " + L("low") + " " + T(e.low) + " / " + L("high") + " " + T(e.high);

  $("alerts").innerHTML = getAlerts(e).map(function (a) { return "<li>" + esc(a) + "</li>"; }).join("");
  $("details").innerHTML = [["humidity", e.humidity + "%"], ["wind", W(e.wind)], ["pressure", P(e.pressure)], ["rain", e.rainChance + "%"]]
    .map(function (r) { return "<div><span>" + esc(L(r[0])) + "</span><strong>" + esc(r[1]) + "</strong></div>"; }).join("");

  $("outfit-title").textContent = L("title");
  $("outfit-list").innerHTML = getOutfitAdvice(e).map(function (a) { return "<li>" + esc(a) + "</li>"; }).join("");

  // 7-day forecast: day, date, emoji, condition, high and low
  $("forecast-list").innerHTML = e.days.map(function (day) {
    const s = describe(day.code), date = new Date(day.date + "T12:00:00Z"), name = L("w_" + s.key);
    const weekday = new Intl.DateTimeFormat(prefs.lang, { weekday: "short", timeZone: "UTC" }).format(date);
    const md = new Intl.DateTimeFormat(prefs.lang, { month: "short", day: "numeric", timeZone: "UTC" }).format(date);
    return '<li class="day"><b>' + esc(weekday) + "</b><small>" + esc(md) + '</small><span class="e" role="img" aria-label="' + esc(name) + '">' +
      s.emoji + '</span><span class="cond">' + esc(name) + '</span><span class="hi">' + T(day.high) + '</span><span class="lo">' + T(day.low) + "</span></li>";
  }).join("");

  renderCompare();
  renderCurrency();
  $("message").hidden = true;
  $("result").hidden = false;
}

// Side-by-side comparison table (shown when 2+ cities are added)
function renderCompare() {
  $("compare").hidden = cities.length < 2;
  if (cities.length < 2) return;
  const head = cities.map(function (e, i) {
    return "<th>" + esc(e.name) + '<button type="button" data-remove="' + i + '">' + esc(L("remove")) + "</button></th>";
  }).join("");
  const rows = [
    ["now", function (e) { return T(e.temp); }],
    ["sky", function (e) { const s = getSky(e); return s.emoji + " " + L("w_" + s.key); }],
    ["low", function (e) { return T(e.low); }],
    ["high", function (e) { return T(e.high); }],
    ["humidity", function (e) { return e.humidity + "%"; }],
    ["wind", function (e) { return W(e.wind); }],
    ["pressure", function (e) { return P(e.pressure); }]
  ].map(function (r) {
    return "<tr><td>" + esc(L(r[0])) + "</td>" + cities.map(function (e) { return "<td>" + esc(r[1](e)) + "</td>"; }).join("") + "</tr>";
  }).join("");
  $("compare-table").innerHTML = "<table><thead><tr><th></th>" + head + "</tr></thead><tbody>" + rows + "</tbody></table>";
}

function renderCurrency() {
  const c = currencyInfo;
  $("currency").textContent = !c ? L("loading") : c.error ? L("eCurrency") :
    c.code + " (" + c.symbol + ") – " + c.name + ". 1 USD = " + c.symbol + c.rate + " (" + L("checked") + " " + c.time + ")";
}

function renderRecent() {
  $("recent").innerHTML = recent.map(function (n) { return '<button type="button">' + esc(n) + "</button>"; }).join("");
}

// Translate every fixed label on the page
function applyStatic() {
  document.documentElement.lang = prefs.lang;
  document.title = L("appName");
  document.querySelectorAll("[data-i18n]").forEach(function (el) { el.textContent = L(el.dataset.i18n); });
  $("city-input").placeholder = L("placeholder");
  renderRecent();
}

// ---------- Live local time, e.g. "4:30 PM IST – India Standard Time" ----------
function zoneName(date, tz, style) {
  return new Intl.DateTimeFormat(prefs.lang, { timeZone: tz, timeZoneName: style }).formatToParts(date)
    .find(function (p) { return p.type === "timeZoneName"; }).value;
}
function startClock(tz, apiAbbr) {
  clearInterval(clockTimer);
  function tick() {
    const now = new Date();
    const time = new Intl.DateTimeFormat(prefs.lang, { timeZone: tz, hour: "numeric", minute: "2-digit" }).format(now);
    const short = /^[A-Z]{2,5}$/.test(apiAbbr) ? apiAbbr : zoneName(now, tz, "short");
    $("local-time").textContent = time + " " + short + " – " + zoneName(now, tz, "long");
  }
  tick();
  clockTimer = setInterval(tick, 1000);
}

// ---------- Local currency + USD rate (refreshes every 30 minutes) ----------
async function loadCurrency(cc, id) {
  clearInterval(rateTimer);
  currencyInfo = null;
  renderCurrency();
  try {
    let data = await getJson("https://restcountries.com/v3.1/alpha/" + cc + "?fields=currencies");
    if (Array.isArray(data)) data = data[0];
    const code = Object.keys(data.currencies)[0];
    async function refresh() {
      const rates = (await getJson("https://open.er-api.com/v6/latest/USD")).rates;
      if (id !== runId) return;
      currencyInfo = {
        code: code, symbol: data.currencies[code].symbol || "", name: data.currencies[code].name,
        rate: rates[code].toLocaleString(prefs.lang, { maximumFractionDigits: rates[code] < 1 ? 4 : 2 }),
        time: new Date().toLocaleTimeString(prefs.lang, { hour: "numeric", minute: "2-digit" })
      };
      renderCurrency();
    }
    await refresh();
    rateTimer = setInterval(function () { refresh().catch(function () {}); }, 30 * 60 * 1000);
  } catch (e) {
    if (id === runId) { currencyInfo = { error: true }; renderCurrency(); }
  }
}

// ---------- Up to 5 places to visit (Wikipedia in the chosen language) ----------
async function loadPlaces(lat, lon, id) {
  $("places-list").innerHTML = "";
  try {
    const api = "https://" + prefs.lang + ".wikipedia.org/w/api.php?format=json&origin=*&action=query&";
    const nearby = await getJson(api + "generator=geosearch&ggslimit=50&ggsradius=10000&ggscoord=" + lat + "%7C" + lon + "&prop=pageviews%7Cdescription&pvipdays=30");
    const pages = Object.values(nearby.query.pages);
    const reads = function (p) { return Object.values(p.pageviews || {}).reduce(function (a, b) { return a + (b || 0); }, 0); };
    const sight = /museum|castle|palace|temple|church|cathedral|park|tower|bridge|monument|square|fort|garden|market|gallery|mosque|beach|lake|zoo|memorial|theatre|landmark|historic|shrine|gate|statue|basilica|abbey|mausoleum|waterfall|viewpoint|opera|museo|castillo|palacio|templo|iglesia|catedral|parque|torre|puente|plaza|jardín|mercado|musée|château|palais|église|cathédrale|tour|pont|place|jardin|marché|मंदिर|किला|महल|संग्रहालय|उद्यान|स्मारक|मस्जिद|झील|बाज़ार/i;
    const byReads = function (a, b) { return reads(b) - reads(a); };
    const top = pages.filter(function (p) { return sight.test(p.description || ""); }).sort(byReads)
      .concat(pages.filter(function (p) { return !sight.test(p.description || ""); }).sort(byReads)).slice(0, 5);
    if (top.length === 0) throw new Error("none");
    const info = await getJson(api + "prop=extracts&exintro=1&explaintext=1&exsentences=2&exlimit=max&pageids=" +
      encodeURIComponent(top.map(function (p) { return p.pageid; }).join("|")));
    if (id !== runId) return;
    top.forEach(function (p) {
      let text = ((info.query.pages[p.pageid] || {}).extract || p.description || "").replace(/\s+/g, " ");
      if (text.length > 220) text = text.slice(0, 217) + "...";
      const li = document.createElement("li");
      const title = document.createElement("strong");
      title.textContent = p.title;
      const desc = document.createElement("span");
      desc.textContent = text;
      li.appendChild(title);
      li.appendChild(desc);
      $("places-list").appendChild(li);
    });
  } catch (e) {
    if (id === runId) $("places-list").innerHTML = "<li>" + esc(L("ePlaces")) + "</li>";
  }
}

// Time, currency and places belong to the main (first) city
function loadExtras(e) {
  const id = ++runId;
  startClock(e.tz, e.abbr);
  loadCurrency(e.cc, id);
  loadPlaces(e.lat, e.lon, id);
}

// ---------- Search / add city ----------
function setBusy(busy) {
  $("loading").hidden = !busy;
  $("search-button").disabled = busy;
  $("search-button").textContent = L(busy ? "searching" : "search");
}

async function run(name, add) {
  name = name.trim();
  if (name === "") return showMessage(L("eEmpty"), cities.length > 0);
  const comparing = add && cities.length > 0;
  if (comparing && cities.length >= 4) return showMessage(L("eMax"), true);

  setBusy(true);
  try {
    const e = await loadCity(name);
    if (e === null) return showMessage(L("eNotFound").replace("{n}", name), comparing);
    if (comparing) { cities.push(e); } else { cities = [e]; }
    recent = [e.name].concat(recent.filter(function (n) { return n !== e.name; })).slice(0, 5);
    save("kw_recent", recent);
    renderRecent();
    renderAll();
    if (!comparing) loadExtras(e);
  } catch (err) {
    showMessage(L("eNetwork"), comparing);
  } finally {
    setBusy(false);
  }
}

// ---------- Wiring up the buttons ----------
$("search-form").addEventListener("submit", function (ev) { ev.preventDefault(); run($("city-input").value, false); });
$("recent").addEventListener("click", function (ev) {
  if (ev.target.tagName === "BUTTON") { $("city-input").value = ev.target.textContent; run(ev.target.textContent, false); }
});
$("compare-table").addEventListener("click", function (ev) {
  const i = ev.target.dataset.remove;
  if (i === undefined) return;
  cities.splice(Number(i), 1);
  if (cities.length === 0) { $("result").hidden = true; return; }
  renderAll();
  if (Number(i) === 0) loadExtras(cities[0]); // the main city changed
});

$("lang-select").addEventListener("change", function () {
  prefs.lang = $("lang-select").value;
  save("kw_prefs", prefs);
  applyStatic();
  renderAll();
  if (cities.length) loadPlaces(cities[0].lat, cities[0].lon, runId); // places come in the new language
});
[["unit-temp", "temp"], ["unit-wind", "wind"], ["unit-pressure", "pressure"]].forEach(function (pair) {
  $(pair[0]).value = prefs[pair[1]];
  $(pair[0]).addEventListener("change", function () {
    prefs[pair[1]] = $(pair[0]).value;
    save("kw_prefs", prefs);
    renderAll();
  });
});

$("lang-select").value = TEXT[prefs.lang] ? prefs.lang : "en";
applyStatic();
