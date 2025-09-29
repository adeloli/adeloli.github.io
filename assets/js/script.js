'use strict';

// ---------- Helpers ----------
const $ = (sel, root = document) => root.querySelector(sel);
const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));
const elementToggleFunc = elem => elem && elem.classList.toggle('active');

// ---------- Sidebar ----------
const sidebar = $('[data-sidebar]');
const sidebarBtn = $('[data-sidebar-btn]');
if (sidebar && sidebarBtn) {
  sidebarBtn.addEventListener('click', () => elementToggleFunc(sidebar));
}

// ---------- Filtro de proyectos / Select ----------
const select = $('[data-select]');
const selectItems = $$('[data-select-item]');
const selectValue = $('[data-selecct-value]');
const filterBtn = $$('[data-filter-btn]');
const filterItems = $$('[data-filter-item]');

const filterFunc = selectedValue => {
  filterItems.forEach(item => {
    item.classList.toggle('active', selectedValue === 'todos' || selectedValue === item.dataset.category);
  });
};

// Select dropdown
if (select) {
  select.addEventListener('click', () => elementToggleFunc(select));
  selectItems.forEach(item => {
    item.addEventListener('click', function () {
      const value = this.innerText.toLowerCase();
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
    const value = this.innerText.toLowerCase();
    if (selectValue) selectValue.innerText = this.innerText;
    filterFunc(value);
    if (lastClickedBtn) lastClickedBtn.classList.remove('active');
    this.classList.add('active');
    lastClickedBtn = this;
  });
});

// ---------- Navegación de páginas ----------
const navigationLinks = $$('[data-nav-link]');
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

// ---------- Abrir CV en ventana completa con PDF escalado al 42% ----------
const cvLinks = $$('.download-cv-link');
cvLinks.forEach(link => {
  link.addEventListener('click', e => {
    e.preventDefault();
    const url = link.href;
    const win = window.open('', '_blank', `width=${screen.width},height=${screen.height},top=0,left=0,scrollbars=yes,resizable=yes`);
    if (win) {
      win.document.write(`
        <html>
          <head>
            <title>CV Alberto Delgado</title>
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
                width: 42%;
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

// Limitar la cantidad de caracteres en tiempo real (extra seguro)
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
      this.value = this.value.slice(0, max); // Recorta el exceso si pega o escribe de más
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
  emailjs.sendForm('service_loe1lei', 'template_5iu4wqq', formEmail)
    .then(() => {
      Swal.fire('¡Mensaje enviado!', 'Tu mensaje se ha enviado con éxito.', 'success');
      formEmail.reset();
      submitBtn.classList.add('disabled');
    })
    .catch(err => {
      Swal.fire('Error', 'No fue posible enviar el mensaje.', 'error');
      console.error(err);
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
  const ctx = canvas.getContext("2d");
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789';
  captchaText = '';
  for (let i = 0; i < 5; i++) {
    captchaText += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  ctx.fillStyle = "#f2f2f2";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.font = "25px Arial";
  ctx.fillStyle = "#333";
  ctx.textBaseline = "middle";
  ctx.textAlign = "center";
  ctx.fillText(captchaText, canvas.width / 2, canvas.height / 2);
  for (let i = 0; i < 5; i++) {
    ctx.beginPath();
    ctx.moveTo(Math.random() * canvas.width, Math.random() * canvas.height);
    ctx.lineTo(Math.random() * canvas.width, Math.random() * canvas.height);
    ctx.strokeStyle = "#999";
    ctx.stroke();
  }
}

document.getElementById("refresh-captcha").addEventListener("click", generateCaptcha);

function validateCaptcha() {
  const userInput = document.getElementById("captcha-input").value.trim();
  if (userInput.toLowerCase() !== captchaText.toLowerCase()) {
    Swal.fire("Captcha incorrecto", "Por favor escribe correctamente las letras del captcha.", "error");
    return false;
  }
  return true;
}

generateCaptcha();

// ---------- Hashnode fetch: render cards 2x2 (4 últimos posts) ----------
const blogHost = "adeloli.hashnode.dev";
const postsUL = document.getElementById("hashnode-posts");

function escapeHTML(str) {
  if (!str) return "";
  return str.replace(/[&<>"']/g, m => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[m]));
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
      postsUL.innerHTML = '<li class="blog-item">Cargando posts...</li>';
      const res = await fetch("https://gql.hashnode.com/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query, variables: { host: blogHost } }),
      });
      const json = await res.json();
      const edges = json?.data?.publication?.posts?.edges || [];
      const posts = edges.map(e => e.node).slice(0, 4);
      if (!posts.length) {
        postsUL.innerHTML = '<li class="blog-item"><div class="content-card"><p>No hay artículos publicados todavía.</p></div></li>';
        return;
      }
      postsUL.innerHTML = posts.map(post => {
        const title = escapeHTML(post.title);
        const brief = escapeHTML(post.brief || "");
        const img = post.coverImage && post.coverImage.url ? post.coverImage.url : "";
        const url = post.url || `https://${blogHost}/${post.slug}`;
        return `
          <li class="blog-item">
            <a href="${url}" target="_blank" rel="noopener noreferrer">
              <figure class="blog-img">
                ${img ? `<img src="${img}" alt="${title}" loading="lazy">` : `<div style="width:100%;height:100%;display:flex;align-items:center;justify-content:center;color:var(--muted-text)">No Image</div>`}
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
      postsUL.innerHTML = '<li class="blog-item"><div class="content-card"><p style="color:tomato">Error al cargar posts de Hashnode</p></div></li>';
    }
  }
  loadHashnodeCards();
  // Opcional: recargar cada vez que se muestra la pestaña Blog:
  /*
  const navLinks = document.querySelectorAll('[data-nav-link]');
  navLinks.forEach(link => {
    link.addEventListener('click', () => {
      if ((link.dataset.pageTarget || '').toLowerCase() === 'blog') {
        loadHashnodeCards();
      }
    });
  });
  */
}




