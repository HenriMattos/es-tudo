// ─── UI.JS — render helpers ──────────────────────────────────────────────────

const UI = (() => {

  // ── Toast ──────────────────────────────────────────────────────────────────
  let toastTimer;
  function toast(msg, duration = 2800) {
    const el = document.getElementById('toast');
    el.textContent = msg;
    el.classList.remove('hidden');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => el.classList.add('hidden'), duration);
  }

  // ── Modal ──────────────────────────────────────────────────────────────────
  function openModal(id) {
    document.getElementById('modal-overlay').classList.remove('hidden');
    document.getElementById(id).classList.remove('hidden');
  }
  function closeModals() {
    document.getElementById('modal-overlay').classList.add('hidden');
    document.querySelectorAll('.modal').forEach(m => m.classList.add('hidden'));
  }

  // ── Color helpers ─────────────────────────────────────────────────────────
  const CAT_COLORS = {
    'Lista de Exercícios': { bg: '#eff6ff', text: '#2563eb', border: '#bfdbfe' },
    'eBook / PDF':         { bg: '#eff6ff', text: '#1d4ed8', border: '#93c5fd' },
    'Mapa Mental':         { bg: '#f0fdf4', text: '#16a34a', border: '#bbf7d0' },
    'Anotações':           { bg: '#faf5ff', text: '#7c3aed', border: '#ddd6fe' },
    'Outros':              { bg: '#f8fafc', text: '#64748b', border: '#e2e8f0' },
  };
  const TAG_COLORS = {
    'Geral':      { bg: '#eff6ff', text: '#2563eb', border: '#bfdbfe', left: '#2563eb' },
    'Artigo':     { bg: '#f0f9ff', text: '#0284c7', border: '#bae6fd', left: '#0284c7' },
    'Ferramenta': { bg: '#f0fdf4', text: '#16a34a', border: '#bbf7d0', left: '#16a34a' },
    'Referência': { bg: '#fffbeb', text: '#d97706', border: '#fde68a', left: '#d97706' },
    'Exercício':  { bg: '#fdf4ff', text: '#a21caf', border: '#f0abfc', left: '#a21caf' },
    'Outros':     { bg: '#f8fafc', text: '#64748b', border: '#e2e8f0', left: '#64748b' },
  };

  function catColor(cat) { return CAT_COLORS[cat] || CAT_COLORS['Outros']; }
  function tagColor(tag) { return TAG_COLORS[tag]  || TAG_COLORS['Geral']; }

  function fileIcon(viewType) {
    return { 'pdf-embed': '📄', 'image': '🖼️', 'link': '🔗' }[viewType] || '📁';
  }

  function fmtDate(ts) {
    if (!ts) return '';
    const d = ts.toDate ? ts.toDate() : new Date(ts);
    return d.toLocaleDateString('pt-BR');
  }

  // ── Render: Material card ─────────────────────────────────────────────────
  function materialCard(m, onDelete, onView) {
    const c = catColor(m.category);
    const div = document.createElement('div');
    div.className = 'mat-card';
    div.innerHTML = `
      <div class="mat-card-top">
        <div class="mat-card-icon">${fileIcon(m.viewType)}</div>
        <div style="flex:1;min-width:0">
          <div class="mat-card-name" title="${esc(m.name)}">${esc(m.name)}</div>
          <span class="mat-card-badge" style="background:${c.bg};color:${c.text};border:1px solid ${c.border}">${esc(m.category)}</span>
        </div>
      </div>
      ${m.desc ? `<div class="mat-card-desc">${esc(m.desc)}</div>` : ''}
      <div class="mat-card-footer">
        <span class="mat-card-date">por ${esc(m.addedByName || '')} · ${fmtDate(m.createdAt)}</span>
        <div class="mat-card-actions">
          ${m.viewType === 'pdf-embed' || m.viewType === 'image'
            ? `<button class="btn-sm btn-view">👁 Ver</button>`
            : `<a href="${esc(m.url)}" target="_blank" rel="noopener"><button class="btn-sm">🔗 Abrir</button></a>`}
          <button class="btn-sm danger btn-del-mat">🗑</button>
        </div>
      </div>`;
    div.querySelector('.btn-del-mat')?.addEventListener('click', () => {
      if (confirm('Remover material?')) onDelete(m.id);
    });
    div.querySelector('.btn-view')?.addEventListener('click', () => onView(m));
    return div;
  }

  // ── Render: Link card ─────────────────────────────────────────────────────
  function linkCard(l, onDelete) {
    const c = tagColor(l.tag);
    const div = document.createElement('div');
    div.className = 'link-card';
    div.style.borderLeftColor = c.left;
    div.innerHTML = `
      <span class="link-card-tag" style="background:${c.bg};color:${c.text};border:1px solid ${c.border}">${esc(l.tag)}</span>
      <div class="link-card-title">${esc(l.title)}</div>
      ${l.desc ? `<div class="link-card-desc">${esc(l.desc)}</div>` : ''}
      <div class="link-card-footer">
        <span class="link-card-date">${fmtDate(l.createdAt)}</span>
        <div style="display:flex;gap:8px">
          <a href="${esc(l.url)}" target="_blank" rel="noopener"><button class="btn-sm">🔗 Abrir</button></a>
          <button class="btn-sm danger btn-del-link">🗑</button>
        </div>
      </div>`;
    div.querySelector('.btn-del-link').addEventListener('click', () => {
      if (confirm('Remover link?')) onDelete(l.id);
    });
    return div;
  }

  // ── Render: Playlist card ─────────────────────────────────────────────────
  function playlistCard(p, onPlay, onEdit, onDelete) {
    const thumb = p.videos?.[0]?.id
      ? `https://img.youtube.com/vi/${p.videos[0].id}/hqdefault.jpg`
      : 'https://via.placeholder.com/480x270/dbeafe/2563eb?text=Playlist';
    const div = document.createElement('div');
    div.className = 'pl-card';
    div.innerHTML = `
      <div class="pl-card-thumb">
        <img src="${thumb}" alt="${esc(p.name)}" loading="lazy" />
        <div class="pl-card-play"><div class="play-icon">▶</div></div>
        <span class="pl-card-count">${p.videos?.length || 0} vídeos</span>
      </div>
      <div class="pl-card-body">
        <div class="pl-card-name">${esc(p.name)}</div>
        ${p.desc ? `<div class="pl-card-desc">${esc(p.desc)}</div>` : ''}
        <div class="pl-card-actions">
          <button class="btn-sm" style="flex:1" data-edit>✏️ Editar</button>
          <button class="btn-sm danger" data-del>🗑</button>
        </div>
      </div>`;
    div.querySelector('.pl-card-thumb').addEventListener('click', () => onPlay(p));
    div.querySelector('[data-edit]').addEventListener('click', () => onEdit(p));
    div.querySelector('[data-del]').addEventListener('click', () => {
      if (confirm('Remover playlist?')) onDelete(p.id);
    });
    return div;
  }

  // ── Render: Queue item ────────────────────────────────────────────────────
  function queueItem(v, idx, activeIdx, onClick) {
    const div = document.createElement('div');
    div.className = 'queue-item' + (idx === activeIdx ? ' active' : '');
    div.innerHTML = `
      <img class="queue-thumb" src="https://img.youtube.com/vi/${v.id}/default.jpg" alt="" loading="lazy" />
      <div>
        <div class="queue-title">${esc(v.title)}</div>
        <div class="queue-num">#${idx + 1}</div>
      </div>`;
    div.addEventListener('click', () => onClick(idx));
    return div;
  }

  // ── Escape HTML ───────────────────────────────────────────────────────────
  function esc(str) {
    return String(str || '')
      .replace(/&/g,'&amp;').replace(/</g,'&lt;')
      .replace(/>/g,'&gt;').replace(/"/g,'&quot;');
  }

  // ── Drive embed URL ───────────────────────────────────────────────────────
  // Converts a Google Drive share link to an embeddable preview URL
  function driveEmbedUrl(url) {
    const match = url.match(/\/d\/([a-zA-Z0-9_-]+)/);
    if (match) return `https://drive.google.com/file/d/${match[1]}/preview`;
    return url;
  }

  return {
    toast, openModal, closeModals,
    materialCard, linkCard, playlistCard, queueItem,
    esc, fmtDate, driveEmbedUrl,
  };
})();
