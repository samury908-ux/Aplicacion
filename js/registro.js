// 1. Persistencia en el navegador
class LocalStorageManager {
  static STORAGE_KEY = 'mi_portafolio_digital_v1';

  static save(data) {
    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(data));
    } catch (e) {
      alert('Almacenamiento lleno. Elimina alguna imagen para liberar espacio.');
    }
  }

  static load() {
    const raw = localStorage.getItem(this.STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  }

  static clear() {
    localStorage.removeItem(this.STORAGE_KEY);
  }
}

// 2. Estado global del asistente de 10 pantallas
class AppState {
  constructor() {
    this.totalSteps = 10;
    const saved = LocalStorageManager.load();
    this.currentStep = saved?.currentStep || 1;
    this.data = saved?.data || {
      nombre: '',
      titulo: '',
      email: '',
      telefono: '',
      ubicacion: '',
      linkedin: '',
      github: '',
      resumen: '',
      institucion: '',
      carrera: '',
      periodoEdu: '',
      empresa: '',
      puesto: '',
      periodoExp: '',
      logrosExp: '',
      proyectoNombre: '',
      proyectoDesc: '',
      proyectoLink: '',
      hardSkills: '',
      softSkills: '',
      idiomas: '',
      certificaciones: '',
      documentos: '',
      imagenesDocs: []
    };

    if (!Array.isArray(this.data.imagenesDocs)) {
      this.data.imagenesDocs = [];
    }
  }

  updateField(key, value) {
    this.data[key] = value;
    this.persist();
  }

  addImage(base64String) {
    this.data.imagenesDocs.push(base64String);
    this.persist();
  }

  removeImage(index) {
    this.data.imagenesDocs.splice(index, 1);
    this.persist();
  }

  nextStep() {
    if (this.currentStep < this.totalSteps) {
      this.currentStep++;
      this.persist();
    }
  }

  prevStep() {
    if (this.currentStep > 1) {
      this.currentStep--;
      this.persist();
    }
  }

  reset() {
    LocalStorageManager.clear();
    location.reload();
  }

  persist() {
    LocalStorageManager.save({
      currentStep: this.currentStep,
      data: this.data
    });
  }
}

// 3. Renderizado dinámico de las 10 pantallas
class DOMUI {
  constructor(state) {
    this.state = state;
    this.container = document.getElementById('wizard-content');
    this.stepIndicator = document.getElementById('step-indicator');
    this.progressFill = document.getElementById('progress-fill');
    this.btnPrev = document.getElementById('btn-prev');
    this.btnNext = document.getElementById('btn-next');
    this.btnReset = document.getElementById('btn-reset');

    this.bindEvents();
    this.render();
  }

  bindEvents() {
    this.btnPrev.addEventListener('click', () => {
      this.state.prevStep();
      this.render();
    });

    this.btnNext.addEventListener('click', () => {
      if (this.state.currentStep === this.state.totalSteps) {
        window.print();
      } else {
        this.state.nextStep();
        this.render();
      }
    });

    this.btnReset.addEventListener('click', () => {
      if (confirm('¿Seguro que deseas borrar todo tu progreso?')) {
        this.state.reset();
      }
    });
  }

  createInput(label, key, placeholder = '', type = 'text') {
    const val = this.state.data[key] || '';
    const field = type === 'textarea'
      ? `<textarea data-key="${key}" placeholder="${placeholder}">${val}</textarea>`
      : `<input type="${type}" data-key="${key}" value="${val}" placeholder="${placeholder}">`;

    return `
      <div class="form-group">
        <label>${label}</label>
        ${field}
      </div>
    `;
  }

  compressImage(file, callback) {
    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const MAX_WIDTH = 800;
        let width = img.width;
        let height = img.height;

        if (width > MAX_WIDTH) {
          height *= MAX_WIDTH / width;
          width = MAX_WIDTH;
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);

        const compressedBase64 = canvas.toDataURL('image/jpeg', 0.75);
        callback(compressedBase64);
      };
      img.src = event.target.result;
    };
    reader.readAsDataURL(file);
  }

  attachInputListeners() {
    this.container.querySelectorAll('input:not([type="file"]), textarea').forEach(el => {
      el.addEventListener('input', (e) => {
        this.state.updateField(e.target.dataset.key, e.target.value);
      });
    });

    const fileInput = this.container.querySelector('#doc-images-input');
    if (fileInput) {
      fileInput.addEventListener('change', (e) => {
        const files = Array.from(e.target.files);
        files.forEach(file => {
          if (file.type.startsWith('image/')) {
            this.compressImage(file, (base64) => {
              this.state.addImage(base64);
              this.render();
            });
          }
        });
      });
    }

    this.container.querySelectorAll('.btn-remove-img').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const index = parseInt(e.target.dataset.index, 10);
        this.state.removeImage(index);
        this.render();
      });
    });
  }

  getStepHTML(step) {
    const d = this.state.data;
    switch (step) {
      case 1:
        return `
          <h2 class="step-title">1. Bienvenida e Identidad</h2>
          <p class="step-desc">Comencemos con tu nombre y tu perfil profesional principal.</p>
          ${this.createInput('Nombre completo', 'nombre', 'Ej. Samuel Gallegos')}
          ${this.createInput('Título o especialidad', 'titulo', 'Ej. Desarrollador de Software Junior')}
        `;
      case 2:
        return `
          <h2 class="step-title">2. Datos de Contacto</h2>
          <p class="step-desc">¿Cómo pueden localizarte los reclutadores?</p>
          ${this.createInput('Correo electrónico', 'email', 'correo@ejemplo.com', 'email')}
          ${this.createInput('Teléfono', 'telefono', '+52 844 000 0000', 'tel')}
          ${this.createInput('Ciudad y Estado', 'ubicacion', 'Saltillo, Coahuila')}
        `;
      case 3:
        return `
          <h2 class="step-title">3. Enlaces Profesionales</h2>
          <p class="step-desc">Agrega tus redes de código o portafolio en línea.</p>
          ${this.createInput('GitHub', 'github', 'https://github.com/tu-usuario', 'url')}
          ${this.createInput('LinkedIn / Web', 'linkedin', 'https://linkedin.com/in/tu-perfil', 'url')}
        `;
      case 4:
        return `
          <h2 class="step-title">4. Perfil Profesional</h2>
          <p class="step-desc">Resume en un párrafo tus fortalezas y objetivos.</p>
          ${this.createInput('Resumen profesional', 'resumen', 'Estudiante de desarrollo de sistemas enfocado en...', 'textarea')}
        `;
      case 5:
        return `
          <h2 class="step-title">5. Formación Académica</h2>
          <p class="step-desc">Tu nivel de estudios más reciente o actual.</p>
          ${this.createInput('Institución Educativa', 'institucion', 'Universidad Tecnológica de Coahuila')}
          ${this.createInput('Carrera o Programa', 'carrera', 'TSU en Desarrollo de Software Multiplataforma')}
          ${this.createInput('Periodo', 'periodoEdu', '2025 - Actualidad')}
        `;
      case 6:
        return `
          <h2 class="step-title">6. Experiencia Laboral</h2>
          <p class="step-desc">Incluye empleos, prácticas o servicio social.</p>
          ${this.createInput('Empresa u Organización', 'empresa', 'Nombre de la empresa')}
          ${this.createInput('Puesto', 'puesto', 'Desarrollador Web / Soporte TI')}
          ${this.createInput('Periodo', 'periodoExp', 'Ene 2026 - Jun 2026')}
          ${this.createInput('Responsabilidades y logros', 'logrosExp', 'Describe tus principales aportes...', 'textarea')}
        `;
      case 7:
        return `
          <h2 class="step-title">7. Proyectos Destacados</h2>
          <p class="step-desc">Muestra lo que has construido con código.</p>
          ${this.createInput('Nombre del proyecto', 'proyectoNombre', 'Ej. Plataforma Aula Virtual')}
          ${this.createInput('Descripción y tecnologías', 'proyectoDesc', 'Aplicación web hecha con HTML, CSS, JS y Supabase...', 'textarea')}
          ${this.createInput('Enlace al repositorio o demo', 'proyectoLink', 'https://github.com/...', 'url')}
        `;
      case 8:
        return `
          <h2 class="step-title">8. Habilidades Técnicas y Blandas</h2>
          <p class="step-desc">Separa tus habilidades por comas.</p>
          ${this.createInput('Habilidades Técnicas (Hard Skills)', 'hardSkills', 'Python, C#, HTML, CSS, JavaScript, SQL')}
          ${this.createInput('Habilidades Blandas (Soft Skills)', 'softSkills', 'Trabajo en equipo, resolución de problemas, comunicación')}
        `;
      case 9:
        const thumbsHTML = d.imagenesDocs.map((imgSrc, idx) => `
          <div class="image-card">
            <img src="${imgSrc}" alt="Documento ${idx + 1}">
            <button type="button" class="btn-remove-img" data-index="${idx}" title="Eliminar">×</button>
          </div>
        `).join('');

        return `
          <h2 class="step-title">9. Idiomas, Certificados y Docs</h2>
          <p class="step-desc">Información complementaria para destacar tu CV.</p>
          ${this.createInput('Idiomas', 'idiomas', 'Español (Nativo), Inglés (Intermedio B1)')}
          ${this.createInput('Certificaciones o Cursos', 'certificaciones', 'Curso de Bases de Datos, Git y GitHub')}
          ${this.createInput('Documentos adjuntos / Referencias', 'documentos', 'Constancia de estudios, Carta de recomendación')}
          
          <div class="form-group">
            <label>Adjuntar imágenes (Certificados, constancias, capturas)</label>
            <input type="file" id="doc-images-input" accept="image/*" multiple>
            ${d.imagenesDocs.length > 0 ? `<div class="image-preview-grid">${thumbsHTML}</div>` : ''}
          </div>
        `;
      case 10:
        const cvImagesHTML = d.imagenesDocs.length > 0 ? `
          <div class="cv-section">
            <h3>Evidencias y Documentos Adjuntos</h3>
            <div class="cv-images-grid">
              ${d.imagenesDocs.map((src, i) => `<img src="${src}" alt="Evidencia ${i + 1}">`).join('')}
            </div>
          </div>
        ` : '';

        return `
          <h2 class="step-title no-print">10. Vista Previa y Descarga PDF</h2>
          <p class="step-desc no-print">Revisa tu CV y presiona "Descargar PDF" para guardarlo.</p>
          <div class="cv-preview">
            <h2>${d.nombre || 'Tu Nombre Completo'}</h2>
            <p><strong>${d.titulo || 'Especialidad Profesional'}</strong></p>
            <p>${[d.email, d.telefono, d.ubicacion].filter(Boolean).join(' | ')}</p>
            <p>${[d.github, d.linkedin].filter(Boolean).join(' | ')}</p>

            ${d.resumen ? `<div class="cv-section"><h3>Perfil</h3><p>${d.resumen}</p></div>` : ''}

            ${d.institucion ? `
              <div class="cv-section">
                <h3>Formación Académica</h3>
                <p><strong>${d.carrera}</strong> — ${d.institucion} (${d.periodoEdu})</p>
              </div>` : ''}

            ${d.empresa ? `
              <div class="cv-section">
                <h3>Experiencia</h3>
                <p><strong>${d.puesto}</strong> — ${d.empresa} (${d.periodoExp})</p>
                <p>${d.logrosExp}</p>
              </div>` : ''}

            ${d.proyectoNombre ? `
              <div class="cv-section">
                <h3>Proyectos</h3>
                <p><strong>${d.proyectoNombre}</strong> ${d.proyectoLink ? `(${d.proyectoLink})` : ''}</p>
                <p>${d.proyectoDesc}</p>
              </div>` : ''}

            ${(d.hardSkills || d.softSkills) ? `
              <div class="cv-section">
                <h3>Habilidades</h3>
                ${d.hardSkills ? `<p><strong>Técnicas:</strong> ${d.hardSkills}</p>` : ''}
                ${d.softSkills ? `<p><strong>Blandas:</strong> ${d.softSkills}</p>` : ''}
              </div>` : ''}

            ${(d.idiomas || d.certificaciones || d.documentos) ? `
              <div class="cv-section">
                <h3>Información Adicional</h3>
                ${d.idiomas ? `<p><strong>Idiomas:</strong> ${d.idiomas}</p>` : ''}
                ${d.certificaciones ? `<p><strong>Certificaciones:</strong> ${d.certificaciones}</p>` : ''}
                ${d.documentos ? `<p><strong>Documentos:</strong> ${d.documentos}</p>` : ''}
              </div>` : ''}

            ${cvImagesHTML}
          </div>
        `;
    }
  }

  render() {
    const step = this.state.currentStep;
    const total = this.state.totalSteps;

    this.stepIndicator.textContent = `Paso ${step} de ${total}`;
    this.progressFill.style.width = `${(step / total) * 100}%`;

    this.btnPrev.disabled = step === 1;
    this.btnNext.textContent = step === total ? 'Descargar PDF' : 'Siguiente';

    this.container.innerHTML = this.getStepHTML(step);
    this.attachInputListeners();
  }
}

document.addEventListener('DOMContentLoaded', () => {
  const appState = new AppState();
  new DOMUI(appState);
});