/**
 * content.js — Se ejecuta en páginas del portal inmobiliario
 * Extrae datos reales del DOM (basado en análisis del HTML real)
 */

function isPropertyPage() {
  return /\/inmueble\/\d+\//.test(window.location.pathname);
}

// Extrae la foto de portada en alta resolución (WEB_DETAIL, webp si disponible)
function extractCoverPhoto() {
  // Intentar desde el JSON embebido — primera foto del array
  try {
    const scripts = document.querySelectorAll("script");
    for (const script of scripts) {
      const text = script.textContent || "";
      const match = text.match(/picturesWithoutPlans\s*[:=]\s*(\[[\s\S]*?\])/);
      if (match) {
        const arr = JSON.parse(match[1]);
        if (arr.length > 0) {
          const pic = arr[0];
          // Alta resolución: WEB_DETAIL (sin sufijo -M-L), preferir webp
          const url = pic.imageDataServiceWebp || pic.imageDataService;
          if (url) return url;
        }
        break;
      }
    }
  } catch (e) {
    // Silencioso — intentamos fallback por DOM
  }

  // Fallback: primera imagen del bloque hero
  const source = document.querySelector(".main-image picture source[type='image/webp']");
  if (source) return source.getAttribute("srcset");

  const img = document.querySelector(".main-image picture img");
  if (img) return img.src;

  return null;
}

function getPropertyData() {
  if (!isPropertyPage()) return null;

  // --- Precio ---
  const priceEl =
    document.querySelector("strong.price") ||
    document.querySelector(".info-data-price");
  const price = priceEl ? priceEl.innerText.trim() : null;

  // --- Título ---
  const titleEl =
    document.querySelector("h1 span.main-info__title-main") ||
    document.querySelector("h1");
  const title = titleEl ? titleEl.innerText.trim() : null;

  // --- Dirección ---
  const addressEl = document.querySelector("span.main-info__title-minor");
  const address = addressEl ? addressEl.innerText.trim() : null;

  // --- Detalles rápidos (m², hab, etc.) ---
  const detailSpans = document.querySelectorAll("div.info-features span");
  const details = Array.from(detailSpans)
    .map((el) => el.innerText.trim())
    .filter(Boolean);

  // --- Características completas ---
  const featureItems = document.querySelectorAll("div.details-property_features li");
  const features = Array.from(featureItems)
    .map((el) => el.innerText.trim())
    .filter(Boolean);

  // --- Descripción completa ---
  const descEl = document.querySelector("div.adCommentsLanguage");
  const description = descEl ? descEl.innerText.trim() : null;

  // --- Foto de portada (alta resolución) ---
  const coverPhoto = extractCoverPhoto();

  return {
    url: window.location.href,
    title,
    price,
    address,
    details,
    features,
    description,
    coverPhoto,
    savedAt: new Date().toISOString(),
  };
}

chrome.runtime.onMessage.addListener((request, _sender, sendResponse) => {
  if (request.type === "GET_PROPERTY") {
    const data = getPropertyData();
    sendResponse({ success: !!data, data });
  }

  if (request.type === "IS_PROPERTY_PAGE") {
    sendResponse({ isProperty: isPropertyPage() });
  }

  return true;
});
