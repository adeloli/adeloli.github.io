'use strict';

// ---------- Helpers ----------
const $ = (sel, root = document) => root.querySelector(sel);
const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));
const elementToggleFunc = elem => elem && elem.classList.toggle('active');

// ---------- Sidebar Toggle (Mobile/Tablet) ----------
const sidebar = $('[data-sidebar]');
const sidebarBtn = $('[data-sidebar-btn]');

if (sidebar && sidebarBtn) {
  sidebarBtn.addEventListener('click', () => {
    elementToggleFunc(sidebar);
    sidebarBtn.classList.toggle('active');
  });
}

// Cerrar sidebar al hacer click en un link de navegación (mobile)
const navigationLinks = $$('[data-nav-link]');
navigationLinks.forEach(link => {
  link.addEventListener('click', () => {
    // Cerrar sidebar en pantallas pequeñas
    if (window.innerWidth < 1024) {
      sidebar?.classList.remove('active');
      sidebarBtn?.classList.remove('active');
    }
  });
});

// Cerrar sidebar al cambiar tamaño de ventana
window.addEventListener('resize', () => {
  if (window.innerWidth >= 1024) {
    sidebar?.classList.remove('active');
    sidebarBtn?.classList.remove('active');
  }
});

// ---------- Filtro de proyectos / Select ----------
const select = $('[data-select]');
const selectItems = $$('[data-select-item]');
const selectValue = $('[data-selecct-value]');
const filterBtn = $$('[data-filter-btn]');
const filterItems = $$('[data-filter-item]');

const filterFunc = selectedValue => {
  filterItems.forEach(item => {
    const category = item.dataset.category.toLowerCase().trim();
    const value = selectedValue.toLowerCase().trim();
    item.classList.toggle('active', value === 'todos' || value === category);
  });
};

// Select dropdown
if (select) {
  select.addEventListener('click', () => elementToggleFunc(select));
  selectItems.forEach(item => {
    item.addEventListener('click', function () {
      const value = this.innerText.toLowerCase().trim();
      if (selectValue) selectValue.innerText = this.innerText;
      elementToggleFunc(select);
      filterFunc(value);
    });
  });
}

// Botones de filtro
let lastClickedBtn = filterBtn[0] || null;
filterBtn.forEach(btn => {
  btn.addEventListener('click', function () {
    const value = this.innerText.toLowerCase().trim();
    if (selectValue) selectValue.innerText = this.innerText;
    filterFunc(value);
    if (lastClickedBtn) lastClickedBtn.classList.remove('active');
    this.classList.add('active');
    lastClickedBtn = this;
  });
});

// Inicializar con "Todos" activo
if (filterBtn.length > 0 && !lastClickedBtn) {
  filterBtn[0].classList.add('active');
  lastClickedBtn = filterBtn[0];
}

// ---------- Navegación de páginas ----------
const pages = $$('[data-page]');

const showPage = page => {
  pages.forEach(p => p.classList.toggle('active', p.dataset.page === page));
  navigationLinks.forEach(l => l.classList.toggle('active', l.dataset.pageTarget === page));
  sessionStorage.setItem('activePage', page);
  window.scrollTo(0, 0);
};

document.addEventListener('DOMContentLoaded', () => {
  const activePage = sessionStorage.getItem('activePage') || 'about';
  showPage(activePage);
});

navigationLinks.forEach(link => {
  link.addEventListener('click', () => {
    const target = link.dataset.pageTarget || (link.innerText || '').trim().toLowerCase();
    showPage(target);
  });
});

// ---------- Descargar CV en nueva ventana ----------
const cvLinks = $$('.download-cv-link');
cvLinks.forEach(link => {
  link.addEventListener('click', e => {
    e.preventDefault();
    const url = link.href;
    const isSmallScreen = window.innerWidth < 768;
    const scale = isSmallScreen ? 60 : 42;
    
    const win = window.open('', '_blank', `width=${screen.width},height=${screen.height},top=0,left=0,scrollbars=yes,resizable=yes`);
    if (win) {
      win.document.write(`
        <html>
          <head>
            <title>CV Alberto Delgado</title>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <style>
              html, body {
                margin: 0;
                padding: 0;
                width: 100%;
                height: 100%;
                overflow: hidden;
                display: flex;
                justify-content: center;
                align-items: center;
                background: #333;
              }
              iframe {
                width: ${scale}%;
                height: 100%;
                border: none;
              }
            </style>
          </head>
          <body>
            <iframe src="${url}" allowfullscreen></iframe>
          </body>
        </html>
      `);
      win.document.close();
    }
  });
});

// ---------- EmailJS Form ----------
emailjs.init('fPK5gftXiExxUbtzB');

const formEmail = document.querySelector('[data-form]');
const submitBtn = formEmail.querySelector('[data-form-btn]');
const inputs = formEmail.querySelectorAll('[data-form-input]');

// Límites de caracteres
const LIMITS = {
  from_name: 50,
  email: 100,
  mensaje: 500
};

inputs.forEach(input => {
  input.addEventListener('input', function() {
    const name = input.name;
    const max = LIMITS[name];
    if (max && this.value.length > max) {
      this.value = this.value.slice(0, max);
    }
  });
});

const NAME_MIN = 3;
const NAME_MAX = 50;
const MESSAGE_MIN = 10;
const MESSAGE_MAX = 500;

function validateForm() {
  const nombre = formEmail.querySelector('[name="from_name"]').value.trim();
  const email = formEmail.querySelector('[name="email"]').value.trim();
  const mensaje = formEmail.querySelector('[name="mensaje"]').value.trim();

  if (!nombre || !email || !mensaje) {
    Swal.fire('Campos incompletos', 'Por favor completa todos los campos.', 'error');
    return false;
  }
  if (!/\S+@\S+\.\S+/.test(email)) {
    Swal.fire('Email inválido', 'Ingresa un correo válido.', 'error');
    return false;
  }
  if (nombre.length < NAME_MIN || nombre.length > NAME_MAX) {
    Swal.fire('Nombre inválido', `El nombre debe tener entre ${NAME_MIN} y ${NAME_MAX} caracteres.`, 'error');
    return false;
  }
  if (mensaje.length < MESSAGE_MIN || mensaje.length > MESSAGE_MAX) {
    Swal.fire('Mensaje inválido', `El mensaje debe tener entre ${MESSAGE_MIN} y ${MESSAGE_MAX} caracteres.`, 'error');
    return false;
  }
  if (!validateCaptcha()) {
    return false;
  }
  return true;
}

function sendEmailSafe() {
  submitBtn.disabled = true;
  submitBtn.textContent = 'Enviando...';
  
  emailjs.sendForm('service_loe1lei', 'template_5iu4wqq', formEmail)
    .then(() => {
      Swal.fire('¡Mensaje enviado!', 'Tu mensaje se ha enviado con éxito.', 'success');
      formEmail.reset();
      submitBtn.classList.add('disabled');
      generateCaptcha();
      checkInputs();
    })
    .catch(err => {
      Swal.fire('Error', 'No fue posible enviar el mensaje. Intenta de nuevo.', 'error');
      console.error(err);
    })
    .finally(() => {
      submitBtn.disabled = false;
      submitBtn.innerHTML = '<ion-icon name="paper-plane"></ion-icon><span>Envía el mensaje</span>';
    });
}

formEmail.addEventListener('submit', function(e) {
  e.preventDefault();
  if (validateForm()) {
    sendEmailSafe();
  }
});

function checkInputs() {
  const allFilled = Array.from(inputs).every(i => i.value.trim() !== '');
  if (allFilled) {
    submitBtn.classList.remove('disabled');
  } else {
    submitBtn.classList.add('disabled');
  }
}

checkInputs();
inputs.forEach(input => input.addEventListener('input', checkInputs));

inputs.forEach(input => {
  if (input.tagName.toLowerCase() === 'input') {
    input.addEventListener('keydown', function(e) {
      if (e.key === 'Enter') {
        e.preventDefault();
        return false;
      }
    });
  }
});

// ---------- Captcha ----------
let captchaText = "";

function generateCaptcha() {
  const canvas = document.getElementById("captcha");
  if (!canvas) return;
  
  const ctx = canvas.getContext("2d");
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789';
  captchaText = '';
  
  for (let i = 0; i < 5; i++) {
    captchaText += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  
  // Fondo
  ctx.fillStyle = "#f2f2f2";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  
  // Texto
  ctx.font = "25px Arial";
  ctx.fillStyle = "#333";
  ctx.textBaseline = "middle";
  ctx.textAlign = "center";
  ctx.fillText(captchaText, canvas.width / 2, canvas.height / 2);
  
  // Líneas de distracción
  for (let i = 0; i < 5; i++) {
    ctx.beginPath();
    ctx.moveTo(Math.random() * canvas.width, Math.random() * canvas.height);
    ctx.lineTo(Math.random() * canvas.width, Math.random() * canvas.height);
    ctx.strokeStyle = "#999";
    ctx.stroke();
  }
  
  // Limpiar input
  document.getElementById("captcha-input").value = '';
}

const refreshBtn = document.getElementById("refresh-captcha");
if (refreshBtn) {
  refreshBtn.addEventListener("click", generateCaptcha);
}

function validateCaptcha() {
  const userInput = document.getElementById("captcha-input").value.trim();
  if (userInput.toLowerCase() !== captchaText.toLowerCase()) {
    Swal.fire("Captcha incorrecto", "Por favor escribe correctamente las letras del captcha.", "error");
    return false;
  }
  return true;
}

// Inicializar captcha cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', () => {
  generateCaptcha();
});

// ---------- Hashnode Blog Posts ----------
const blogHost = "adeloli.hashnode.dev";
const postsUL = document.getElementById("hashnode-posts");

function escapeHTML(str) {
  if (!str) return "";
  return str.replace(/[&<>"']/g, m => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;"
  }[m]));
}

if (postsUL) {
  async function loadHashnodeCards() {
    const query = `
      query Publication($host: String!) {
        publication(host: $host) {
          posts(first: 6) {
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
      postsUL.innerHTML = '<li class="blog-item"><div style="padding:20px;text-align:center;">Cargando posts...</div></li>';
      
      const res = await fetch("https://gql.hashnode.com/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query, variables: { host: blogHost } }),
      });
      
      const json = await res.json();
      const edges = json?.data?.publication?.posts?.edges || [];
      const posts = edges.map(e => e.node).slice(0, 4);
      
      if (!posts.length) {
        postsUL.innerHTML = '<li class="blog-item"><div style="padding:20px;text-align:center;color:var(--muted-text)">No hay artículos publicados todavía.</div></li>';
        return;
      }
      
      postsUL.innerHTML = posts.map(post => {
        const title = escapeHTML(post.title);
        const brief = escapeHTML(post.brief || "");
        const img = post.coverImage?.url || "";
        const url = post.url || `https://${blogHost}/${post.slug}`;
        
        return `
          <li class="blog-item">
            <a href="${url}" target="_blank" rel="noopener noreferrer">
              <figure class="blog-img">
                ${img ? `<img src="${img}" alt="${title}" loading="lazy" decoding="async">` : `<div style="width:100%;height:100%;display:flex;align-items:center;justify-content:center;color:var(--muted-text);background:var(--jet)">Sin imagen</div>`}
              </figure>
              <div class="blog-content">
                <h3 class="blog-title">${title}</h3>
                <p class="blog-excerpt">${brief}</p>
              </div>
            </a>
          </li>
        `;
      }).join("");
    } catch (err) {
      console.error("Error fetching Hashnode posts:", err);
      postsUL.innerHTML = '<li class="blog-item"><div style="padding:20px;text-align:center;color:#ff6b6b">Error al cargar posts de Hashnode</div></li>';
    }
  }
  
  loadHashnodeCards();
}
