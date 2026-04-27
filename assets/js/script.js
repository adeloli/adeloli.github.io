'use strict';

// ============================================================
// HELPERS
// ============================================================
const $ = (sel, root = document) => root.querySelector(sel);
const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));
const elementToggleFunc = elem => elem && elem.classList.toggle('active');

// Escapa HTML para prevenir XSS al insertar contenido dinámico
function escapeHTML(str) {
  if (!str) return '';
  return str.replace(/[&<>"'`/]/g, m => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;',
    '"': '&quot;', "'": '&#39;', '`': '&#96;', '/': '&#x2F;'
  }[m]));
}

// Valida que una URL sea https y pertenezca a un host permitido
const ALLOWED_IMG_HOSTS = [
  'cdn.hashnode.com', 'res.hashnode.com', 'media.graphassets.com',
  'images.hashnode.com', 'raw.githubusercontent.com'
];
function isSafeImageUrl(url) {
  try {
    const u = new URL(url);
    return u.protocol === 'https:' && ALLOWED_IMG_HOSTS.some(h => u.hostname === h || u.hostname.endsWith('.' + h));
  } catch { return false; }
}

// ============================================================
// EMAIL OBFUSCADO — reconstruido por JS para evitar scrapers
// ============================================================
document.addEventListener('DOMContentLoaded', () => {
  const parts = ['albertodelgaoli', '@', 'gmail', '.', 'com'];
  const email = parts.join('');
  const emailLink = document.getElementById('email-link');
  const emailDisplay = document.getElementById('email-display');
  if (emailLink && emailDisplay) {
    emailDisplay.textContent = email;
    emailLink.href = 'mailto:' + email;
  }
});

// ============================================================
// SIDEBAR
// ============================================================
const sidebar = $('[data-sidebar]');
const sidebarBtn = $('[data-sidebar-btn]');
if (sidebar && sidebarBtn) {
  sidebarBtn.addEventListener('click', () => {
    elementToggleFunc(sidebar);
    const expanded = sidebar.classList.contains('active');
    sidebarBtn.setAttribute('aria-expanded', String(expanded));
  });
}

// ============================================================
// FILTRO DE PROYECTOS
// ============================================================
const select = $('[data-select]');
const selectItems = $$('[data-select-item]');
const selectValue = $('[data-selecct-value]');
const filterBtn = $$('[data-filter-btn]');
const filterItems = $$('[data-filter-item]');

const filterFunc = selectedValue => {
  const val = selectedValue.trim().toLowerCase();
  filterItems.forEach(item => {
    item.classList.toggle('active', val === 'todos' || val === (item.dataset.category || '').trim().toLowerCase());
  });
};

if (select) {
  select.addEventListener('click', () => {
    const expanded = select.getAttribute('aria-expanded') === 'true';
    select.setAttribute('aria-expanded', String(!expanded));
    elementToggleFunc(select);
  });
  selectItems.forEach(item => {
    item.addEventListener('click', function () {
      const value = this.innerText.trim().toLowerCase();
      if (selectValue) selectValue.innerText = this.innerText.trim();
      select.setAttribute('aria-expanded', 'false');
      elementToggleFunc(select);
      filterFunc(value);
    });
  });
}

let lastClickedBtn = filterBtn[0] || null;
filterBtn.forEach(btn => {
  btn.addEventListener('click', function () {
    const value = this.innerText.trim().toLowerCase();
    if (selectValue) selectValue.innerText = this.innerText.trim();
    filterFunc(value);
    if (lastClickedBtn) lastClickedBtn.classList.remove('active');
    this.classList.add('active');
    lastClickedBtn = this;
  });
});

// ============================================================
// NAVEGACIÓN DE PÁGINAS
// ============================================================
const navigationLinks = $$('[data-nav-link]');
const pages = $$('[data-page]');

// Whitelist de páginas permitidas para evitar open redirect / manipulación DOM
const VALID_PAGES = new Set(['about', 'projects', 'blog', 'writeups', 'contact']);

const showPage = page => {
  if (!VALID_PAGES.has(page)) page = 'about'; // fallback seguro
  pages.forEach(p => p.classList.toggle('active', p.dataset.page === page));
  navigationLinks.forEach(l => {
    const isActive = l.dataset.pageTarget === page;
    l.classList.toggle('active', isActive);
    if (l.hasAttribute('aria-pressed')) l.setAttribute('aria-pressed', String(isActive));
  });
  // sessionStorage solo guarda páginas de la whitelist
  sessionStorage.setItem('activePage', page);
  window.scrollTo(0, 0);
};

document.addEventListener('DOMContentLoaded', () => {
  const stored = sessionStorage.getItem('activePage') || 'about';
  // Sanitizamos lo leído de sessionStorage
  const safePage = VALID_PAGES.has(stored) ? stored : 'about';
  showPage(safePage);
});

navigationLinks.forEach(link => {
  link.addEventListener('click', () => {
    const target = (link.dataset.pageTarget || '').trim().toLowerCase();
    showPage(target);
  });
});

// ============================================================
// DESCARGA / VISUALIZACIÓN DEL CV
// Abrimos el PDF directamente en nueva pestaña (sin document.write)
// document.write() es un vector XSS cuando la URL proviene de atributos
// ============================================================
const cvLinks = $$('.download-cv-link');
cvLinks.forEach(link => {
  link.addEventListener('click', e => {
    e.preventDefault();
    const rawUrl = link.getAttribute('href');
    // Solo abrimos rutas relativas internas al sitio (.pdf)
    if (rawUrl && /^\.?\/[^<>"]+\.pdf$/i.test(rawUrl)) {
      window.open(rawUrl, '_blank', 'noopener,noreferrer');
    }
  });
});

// ============================================================
// EMAILJS — Formulario de contacto
// ============================================================

// Rate limiting del lado cliente: máximo 3 envíos por sesión
const SEND_LIMIT = 3;
let sendCount = Number(sessionStorage.getItem('sendCount') || '0');

const formEmail = $('[data-form]');
if (formEmail) {
  // Esperamos a que EmailJS cargue (está en defer)
  window.addEventListener('load', () => {
    if (typeof emailjs !== 'undefined') {
      emailjs.init('fPK5gftXiExxUbtzB');
    }
  });

  const submitBtn = formEmail.querySelector('[data-form-btn]');
  const inputs = formEmail.querySelectorAll('[data-form-input]');

  // Límites de caracteres
  const LIMITS = { from_name: 50, email: 100, mensaje: 500 };

  inputs.forEach(input => {
    input.addEventListener('input', function () {
      const max = LIMITS[this.name];
      if (max && this.value.length > max) this.value = this.value.slice(0, max);
    });
  });

  // Validación robusta con regex más estricto para email
  const EMAIL_REGEX = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)+$/;
  // Bloquea payloads de inyección comunes
  const INJECTION_REGEX = /<[^>]*>|javascript:|data:|vbscript:|on\w+\s*=/i;

  function validateForm() {
    const nombre = (formEmail.querySelector('[name="from_name"]')?.value || '').trim();
    const email  = (formEmail.querySelector('[name="email"]')?.value || '').trim();
    const mensaje = (formEmail.querySelector('[name="mensaje"]')?.value || '').trim();

    if (!nombre || !email || !mensaje) {
      Swal.fire('Campos incompletos', 'Por favor completa todos los campos.', 'error');
      return false;
    }
    if (INJECTION_REGEX.test(nombre) || INJECTION_REGEX.test(email) || INJECTION_REGEX.test(mensaje)) {
      Swal.fire('Contenido no permitido', 'El formulario contiene caracteres no válidos.', 'error');
      return false;
    }
    if (!EMAIL_REGEX.test(email)) {
      Swal.fire('Email inválido', 'Ingresa un correo electrónico válido.', 'error');
      return false;
    }
    if (nombre.length < 3 || nombre.length > 50) {
      Swal.fire('Nombre inválido', 'El nombre debe tener entre 3 y 50 caracteres.', 'error');
      return false;
    }
    if (mensaje.length < 10 || mensaje.length > 500) {
      Swal.fire('Mensaje inválido', 'El mensaje debe tener entre 10 y 500 caracteres.', 'error');
      return false;
    }
    if (!validateCaptcha()) return false;
    return true;
  }

  function sendEmailSafe() {
    // Rate limit
    if (sendCount >= SEND_LIMIT) {
      const msg = document.getElementById('rate-limit-msg');
      if (msg) {
        msg.textContent = 'Has alcanzado el límite de envíos por sesión. Inténtalo más tarde.';
        msg.style.display = 'block';
      }
      Swal.fire('Límite alcanzado', 'Has enviado demasiados mensajes en esta sesión.', 'warning');
      return;
    }

    if (typeof emailjs === 'undefined') {
      Swal.fire('Error', 'El servicio de correo no está disponible.', 'error');
      return;
    }

    submitBtn.disabled = true;
    submitBtn.classList.add('disabled');

    emailjs.sendForm('service_loe1lei', 'template_5iu4wqq', formEmail)
      .then(() => {
        sendCount++;
        sessionStorage.setItem('sendCount', String(sendCount));
        Swal.fire('¡Mensaje enviado!', 'Tu mensaje se ha enviado con éxito.', 'success');
        formEmail.reset();
        generateCaptcha();
        document.getElementById('captcha-input').value = '';
        checkInputs();
      })
      .catch(err => {
        Swal.fire('Error', 'No fue posible enviar el mensaje. Inténtalo de nuevo.', 'error');
        console.error('EmailJS error:', err);
        submitBtn.disabled = false;
        submitBtn.classList.remove('disabled');
      });
  }

  formEmail.addEventListener('submit', function (e) {
    e.preventDefault();
    if (validateForm()) sendEmailSafe();
  });

  function checkInputs() {
    const allFilled = Array.from(inputs).every(i => i.value.trim() !== '');
    const ok = allFilled && sendCount < SEND_LIMIT;
    submitBtn.disabled = !ok;
    submitBtn.setAttribute('aria-disabled', String(!ok));
    submitBtn.classList.toggle('disabled', !ok);
  }

  checkInputs();
  inputs.forEach(input => input.addEventListener('input', checkInputs));

  // Evitar Enter en campos de texto (no en textarea)
  inputs.forEach(input => {
    if (input.tagName.toLowerCase() === 'input') {
      input.addEventListener('keydown', e => {
        if (e.key === 'Enter') e.preventDefault();
      });
    }
  });
}

// ============================================================
// CAPTCHA (canvas)
// ============================================================
let captchaText = '';

function generateCaptcha() {
  const canvas = document.getElementById('captcha');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789';
  captchaText = '';
  for (let i = 0; i < 6; i++) {
    captchaText += chars.charAt(Math.floor(Math.random() * chars.length));
  }

  // Fondo
  ctx.fillStyle = '#1e1e2e';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Líneas de ruido
  for (let i = 0; i < 8; i++) {
    ctx.beginPath();
    ctx.moveTo(Math.random() * canvas.width, Math.random() * canvas.height);
    ctx.lineTo(Math.random() * canvas.width, Math.random() * canvas.height);
    ctx.strokeStyle = `hsl(${Math.random() * 360}, 40%, 60%)`;
    ctx.lineWidth = 1;
    ctx.stroke();
  }

  // Texto con rotación aleatoria por carácter
  ctx.textBaseline = 'middle';
  const charWidth = canvas.width / (captchaText.length + 1);
  for (let i = 0; i < captchaText.length; i++) {
    ctx.save();
    const x = charWidth * (i + 0.9);
    const y = canvas.height / 2 + (Math.random() * 10 - 5);
    ctx.translate(x, y);
    ctx.rotate((Math.random() - 0.5) * 0.5);
    ctx.font = `bold ${20 + Math.random() * 8}px monospace`;
    ctx.fillStyle = `hsl(${Math.random() * 360}, 80%, 75%)`;
    ctx.fillText(captchaText[i], 0, 0);
    ctx.restore();
  }

  // Puntos de ruido
  for (let i = 0; i < 40; i++) {
    ctx.beginPath();
    ctx.arc(Math.random() * canvas.width, Math.random() * canvas.height, 1, 0, Math.PI * 2);
    ctx.fillStyle = '#888';
    ctx.fill();
  }
}

const refreshBtn = document.getElementById('refresh-captcha');
if (refreshBtn) {
  refreshBtn.addEventListener('click', () => {
    generateCaptcha();
    const ci = document.getElementById('captcha-input');
    if (ci) ci.value = '';
  });
}

function validateCaptcha() {
  const userInput = (document.getElementById('captcha-input')?.value || '').trim();
  if (userInput.toLowerCase() !== captchaText.toLowerCase()) {
    Swal.fire('Captcha incorrecto', 'Por favor escribe correctamente las letras del captcha.', 'error');
    generateCaptcha();
    const ci = document.getElementById('captcha-input');
    if (ci) ci.value = '';
    return false;
  }
  return true;
}

generateCaptcha();

// ============================================================
// HASHNODE BLOG — últimos 4 posts
// ============================================================
const HASHNODE_HOST = 'adeloli.hashnode.dev';
const MAX_POSTS = 4;
const postsUL = document.getElementById('hashnode-posts');

if (postsUL) {
  async function loadHashnodeCards() {
    const query = `
      query Publication($host: String!) {
        publication(host: $host) {
          posts(first: ${MAX_POSTS}) {
            edges {
              node {
                title
                brief
                slug
                url
                publishedAt
                coverImage { url }
              }
            }
          }
        }
      }
    `;

    try {
      postsUL.innerHTML = '<li class="blog-item">Cargando posts...</li>';

      const res = await fetch('https://gql.hashnode.com/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query, variables: { host: HASHNODE_HOST } }),
        signal: AbortSignal.timeout(10000) // timeout de 10 s
      });

      if (!res.ok) throw new Error(`HTTP ${res.status}`);

      const json = await res.json();

      // Nunca confiamos en datos externos sin validarlos
      if (json.errors) throw new Error('GraphQL error: ' + JSON.stringify(json.errors));

      const edges = Array.isArray(json?.data?.publication?.posts?.edges)
        ? json.data.publication.posts.edges : [];
      const posts = edges.slice(0, MAX_POSTS).map(e => e.node).filter(Boolean);

      if (!posts.length) {
        postsUL.innerHTML = '<li class="blog-item"><div class="content-card"><p>No hay artículos publicados todavía.</p></div></li>';
        return;
      }

      postsUL.innerHTML = posts.map(post => {
        const title  = escapeHTML(post.title || 'Sin título');
        const brief  = escapeHTML(post.brief  || '');
        // Validamos que la URL del post sea https y del dominio hashnode
        const rawUrl = typeof post.url === 'string' ? post.url : `https://${HASHNODE_HOST}/${escapeHTML(post.slug || '')}`;
        let safeUrl;
        try {
          const u = new URL(rawUrl);
          safeUrl = (u.protocol === 'https:' && u.hostname.endsWith('hashnode.dev')) ? rawUrl : '#';
        } catch { safeUrl = '#'; }

        const imgUrl = post.coverImage?.url;
        const safeImg = imgUrl && isSafeImageUrl(imgUrl) ? imgUrl : '';

        return `
          <li class="blog-item">
            <a href="${safeUrl}" target="_blank" rel="noopener noreferrer">
              <figure class="blog-img">
                ${safeImg
                  ? `<img src="${safeImg}" alt="${title}" loading="lazy">`
                  : `<div style="width:100%;height:100%;display:flex;align-items:center;justify-content:center;color:var(--muted-text,#888)">Sin imagen</div>`
                }
              </figure>
              <div class="blog-content">
                <h3 class="blog-title">${title}</h3>
                <p class="blog-excerpt">${brief}</p>
              </div>
            </a>
          </li>
        `;
      }).join('');

    } catch (err) {
      console.error('Error fetching Hashnode posts:', err);
      postsUL.innerHTML = '<li class="blog-item"><div class="content-card"><p>Error al cargar los posts. Inténtalo de nuevo más tarde.</p></div></li>';
    }
  }

  loadHashnodeCards();

  // Recargar posts cada vez que el usuario visita la pestaña Blog
  navigationLinks.forEach(link => {
    link.addEventListener('click', () => {
      if ((link.dataset.pageTarget || '').toLowerCase() === 'blog') {
        loadHashnodeCards();
      }
    });
  });
}

// ============================================================
// WRITE-UPS (desactivado — descomentar cuando esté listo)
// Carga automática desde GitHub API al directorio Write-Ups
// ============================================================
/*
const GITHUB_USER = 'adeloli';
const GITHUB_REPO = 'Write-Ups';
const GITHUB_API  = `https://api.github.com/repos/${GITHUB_USER}/${GITHUB_REPO}/contents`;
const wrUpList    = document.getElementById('writeups-list');

async function loadWriteUps() {
  if (!wrUpList) return;
  try {
    wrUpList.innerHTML = '<li><p>Cargando write-ups...</p></li>';
    const res = await fetch(GITHUB_API, {
      headers: { Accept: 'application/vnd.github.v3+json' },
      signal: AbortSignal.timeout(10000)
    });
    if (!res.ok) throw new Error(`GitHub API ${res.status}`);
    const items = await res.json();
    const dirs  = items.filter(i => i.type === 'dir');
    if (!dirs.length) {
      wrUpList.innerHTML = '<li><p>No hay write-ups disponibles todavía.</p></li>';
      return;
    }
    wrUpList.innerHTML = dirs.map(dir => {
      const name = escapeHTML(dir.name);
      const url  = escapeHTML(dir.html_url);
      // Imagen por categoría
      const imgMap = {
        'DockerLabs':    './assets/images/writeups/dockerlabs.webp',
        'TheHackerLabs': './assets/images/writeups/hackerlabs.webp',
        'BugBountyLabs': './assets/images/writeups/bugbountylabs.webp',
      };
      const img = imgMap[dir.name] || '';
      return `
        <li class="project-item active" data-filter-item data-category="write-ups">
          <a href="${url}" target="_blank" rel="noopener noreferrer">
            <figure class="project-img">
              <div class="project-item-icon-box"><ion-icon name="eye-outline"></ion-icon></div>
              ${img ? `<img src="${img}" alt="${name}" loading="lazy" decoding="async">` : ''}
            </figure>
            <h3 class="project-title">${name}</h3>
            <p class="project-category">Write-Ups</p>
          </a>
        </li>
      `;
    }).join('');
  } catch (err) {
    console.error('Error cargando write-ups:', err);
    wrUpList.innerHTML = '<li><p>Error al cargar los write-ups. Inténtalo más tarde.</p></li>';
  }
}

// Cargar al visitar la pestaña
navigationLinks.forEach(link => {
  link.addEventListener('click', () => {
    if ((link.dataset.pageTarget || '').toLowerCase() === 'writeups') loadWriteUps();
  });
});
*/
