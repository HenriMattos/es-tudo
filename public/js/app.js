// ─── APP.JS — main controller ────────────────────────────────────────────────

const App = (() => {

  let currentUser  = null;
  let unsubscribers = [];

  // ── State ─────────────────────────────────────────────────────────────────
  const state = {
    materials: [],
    links: [],
    playlists: [],
    matFilter: 'Todos',
    matSearch: '',
    editingPlaylist: null,
    pendingPlaylistVideos: [],   // videos staged in the playlist modal
    playerPlaylist: null,
    playerIndex: 0,
  };

  // ── Screen switching ──────────────────────────────────────────────────────
  function showApp() {
    document.getElementById('auth-screen').classList.remove('active');
    document.getElementById('app-screen').classList.add('active');
  }
  function showAuth() {
    document.getElementById('auth-screen').classList.add('active');
    document.getElementById('app-screen').classList.remove('active');
    unsubscribers.forEach(u => u());
    unsubscribers = [];
  }

  // ── Tab switching ─────────────────────────────────────────────────────────
  function switchTab(tabId) {
    document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
    document.querySelectorAll('.nav-btn, .bnav-btn').forEach(b => {
      b.classList.toggle('active', b.dataset.tab === tabId);
    });
    document.getElementById(`tab-${tabId}`).classList.add('active');
    // Hide player if switching away from playlists
    if (tabId !== 'playlists') closePlayer();
  }

  // ── Stats bar ─────────────────────────────────────────────────────────────
  function updateStats() {
    document.getElementById('stat-materials').textContent = state.materials.length;
    document.getElementById('stat-links').textContent     = state.links.length;
    document.getElementById('stat-playlists').textContent = state.playlists.length;
    document.getElementById('stat-videos').textContent    =
      state.playlists.reduce((s, p) => s + (p.videos?.length || 0), 0);
  }

  // ── MATERIALS ─────────────────────────────────────────────────────────────
  function renderMaterials() {
    const grid = document.getElementById('materials-grid');
    grid.innerHTML = '';
    const filtered = state.materials.filter(m => {
      const catOk = state.matFilter === 'Todos' || m.category === state.matFilter;
      const q = state.matSearch.toLowerCase();
      const searchOk = !q || m.name.toLowerCase().includes(q) || (m.desc || '').toLowerCase().includes(q);
      return catOk && searchOk;
    });
    if (!filtered.length) {
      grid.innerHTML = '<div class="empty-state"><span>📭</span><p>Nenhum material encontrado</p></div>';
      return;
    }
    filtered.forEach(m => {
      grid.appendChild(UI.materialCard(m,
        id => DB.deleteMaterial(id).then(() => UI.toast('Material removido')),
        m  => openViewModal(m)
      ));
    });
  }

  function openViewModal(m) {
    document.getElementById('view-title').textContent = m.name;
    const iframe = document.getElementById('view-iframe');
    iframe.src = m.viewType === 'pdf-embed' ? UI.driveEmbedUrl(m.url) : m.url;
    UI.openModal('modal-view');
  }

  function bindMaterials() {
    // Search
    document.getElementById('mat-search').addEventListener('input', e => {
      state.matSearch = e.target.value;
      renderMaterials();
    });
    // Filters
    document.getElementById('mat-filters').addEventListener('click', e => {
      if (!e.target.classList.contains('chip')) return;
      document.querySelectorAll('#mat-filters .chip').forEach(c => c.classList.remove('active'));
      e.target.classList.add('active');
      state.matFilter = e.target.dataset.cat;
      renderMaterials();
    });
    // Add button
    document.getElementById('btn-add-material').addEventListener('click', () => {
      clearMatModal();
      UI.openModal('modal-material');
    });
    // Save material
    document.getElementById('btn-save-material').addEventListener('click', saveMaterial);
  }

  function clearMatModal() {
    ['mat-name','mat-url','mat-desc'].forEach(id => document.getElementById(id).value = '');
    document.getElementById('mat-error').classList.add('hidden');
  }

  async function saveMaterial() {
    const name     = document.getElementById('mat-name').value.trim();
    const url      = document.getElementById('mat-url').value.trim();
    const category = document.getElementById('mat-category').value;
    const viewType = document.getElementById('mat-view-type').value;
    const desc     = document.getElementById('mat-desc').value.trim();
    const errEl    = document.getElementById('mat-error');

    if (!name) { errEl.textContent = 'Informe o nome.'; errEl.classList.remove('hidden'); return; }
    if (!url)  { errEl.textContent = 'Informe o link.'; errEl.classList.remove('hidden'); return; }

    const btn = document.getElementById('btn-save-material');
    btn.disabled = true; btn.textContent = 'Salvando...';
    try {
      await DB.addMaterial({ name, url, category, viewType, desc }, currentUser);
      UI.closeModals();
      UI.toast('✅ Material adicionado!');
    } catch {
      errEl.textContent = 'Erro ao salvar. Tente novamente.';
      errEl.classList.remove('hidden');
    } finally {
      btn.disabled = false; btn.textContent = 'Salvar';
    }
  }

  // ── LINKS ─────────────────────────────────────────────────────────────────
  function renderLinks() {
    const grid = document.getElementById('links-grid');
    grid.innerHTML = '';
    if (!state.links.length) {
      grid.innerHTML = '<div class="empty-state"><span>📋</span><p>Mural vazio — adicione o primeiro link</p></div>';
      return;
    }
    state.links.forEach(l => {
      grid.appendChild(UI.linkCard(l, id => DB.deleteLink(id).then(() => UI.toast('Link removido'))));
    });
  }

  function bindLinks() {
    document.getElementById('btn-add-link').addEventListener('click', () => {
      ['link-title','link-url','link-desc'].forEach(id => document.getElementById(id).value = '');
      document.getElementById('link-error').classList.add('hidden');
      UI.openModal('modal-link');
    });
    document.getElementById('btn-save-link').addEventListener('click', saveLink);
  }

  async function saveLink() {
    const title = document.getElementById('link-title').value.trim();
    const url   = document.getElementById('link-url').value.trim();
    const tag   = document.getElementById('link-tag').value;
    const desc  = document.getElementById('link-desc').value.trim();
    const errEl = document.getElementById('link-error');

    if (!title) { errEl.textContent = 'Informe o título.'; errEl.classList.remove('hidden'); return; }
    if (!url)   { errEl.textContent = 'Informe a URL.';    errEl.classList.remove('hidden'); return; }

    const href = url.startsWith('http') ? url : 'https://' + url;
    const btn  = document.getElementById('btn-save-link');
    btn.disabled = true; btn.textContent = 'Salvando...';
    try {
      await DB.addLink({ title, url: href, tag, desc }, currentUser);
      UI.closeModals();
      UI.toast('✅ Link adicionado!');
    } catch {
      errEl.textContent = 'Erro ao salvar.'; errEl.classList.remove('hidden');
    } finally {
      btn.disabled = false; btn.textContent = 'Adicionar';
    }
  }

  // ── PLAYLISTS ─────────────────────────────────────────────────────────────
  function renderPlaylists() {
    const grid = document.getElementById('playlists-grid');
    grid.innerHTML = '';
    if (!state.playlists.length) {
      grid.innerHTML = '<div class="empty-state"><span>🎬</span><p>Nenhuma playlist ainda</p></div>';
      return;
    }
    state.playlists.forEach(p => {
      grid.appendChild(UI.playlistCard(p,
        pl => openPlayer(pl),
        pl => openPlaylistModal(pl),
        id => DB.deletePlaylist(id).then(() => UI.toast('Playlist removida'))
      ));
    });
  }

  function bindPlaylists() {
    document.getElementById('btn-add-playlist').addEventListener('click', () => openPlaylistModal(null));
    document.getElementById('btn-back-playlists').addEventListener('click', closePlayer);
    document.getElementById('btn-add-video').addEventListener('click', addVideoToModal);
    document.getElementById('btn-save-playlist').addEventListener('click', savePlaylist);
  }

  function openPlaylistModal(existing) {
    state.editingPlaylist = existing || null;
    state.pendingPlaylistVideos = existing ? [...(existing.videos || [])] : [];
    document.getElementById('playlist-modal-title').textContent = existing ? '✏️ Editar Playlist' : '🎬 Nova Playlist';
    document.getElementById('pl-name').value = existing?.name  || '';
    document.getElementById('pl-desc').value = existing?.desc  || '';
    document.getElementById('pl-vid-url').value   = '';
    document.getElementById('pl-vid-title').value = '';
    document.getElementById('pl-error').classList.add('hidden');
    document.getElementById('pl-vid-error').classList.add('hidden');
    renderPendingVideos();
    UI.openModal('modal-playlist');
  }

  function extractYTId(url) {
    const m = url.match(/(?:youtu\.be\/|v=|embed\/)([a-zA-Z0-9_-]{11})/);
    return m ? m[1] : null;
  }

  function addVideoToModal() {
    const url   = document.getElementById('pl-vid-url').value.trim();
    const title = document.getElementById('pl-vid-title').value.trim();
    const errEl = document.getElementById('pl-vid-error');
    errEl.classList.add('hidden');
    const id = extractYTId(url);
    if (!id) { errEl.textContent = 'URL do YouTube inválida.'; errEl.classList.remove('hidden'); return; }
    if (state.pendingPlaylistVideos.find(v => v.id === id)) {
      errEl.textContent = 'Vídeo já adicionado.'; errEl.classList.remove('hidden'); return;
    }
    state.pendingPlaylistVideos.push({ id, title: title || `Vídeo ${state.pendingPlaylistVideos.length + 1}`, url });
    document.getElementById('pl-vid-url').value   = '';
    document.getElementById('pl-vid-title').value = '';
    renderPendingVideos();
  }

  function renderPendingVideos() {
    const list = document.getElementById('pl-video-list');
    list.innerHTML = '';
    state.pendingPlaylistVideos.forEach((v, i) => {
      const div = document.createElement('div');
      div.className = 'vid-item';
      div.innerHTML = `
        <img src="https://img.youtube.com/vi/${v.id}/default.jpg" alt="" />
        <span class="vid-item-title">${UI.esc(v.title)}</span>
        <button class="vid-item-remove" data-idx="${i}">×</button>`;
      div.querySelector('.vid-item-remove').addEventListener('click', () => {
        state.pendingPlaylistVideos.splice(i, 1);
        renderPendingVideos();
      });
      list.appendChild(div);
    });
  }

  async function savePlaylist() {
    const name  = document.getElementById('pl-name').value.trim();
    const desc  = document.getElementById('pl-desc').value.trim();
    const errEl = document.getElementById('pl-error');
    errEl.classList.add('hidden');

    if (!name) { errEl.textContent = 'Informe o nome da playlist.'; errEl.classList.remove('hidden'); return; }
    if (!state.pendingPlaylistVideos.length) {
      errEl.textContent = 'Adicione ao menos um vídeo.'; errEl.classList.remove('hidden'); return;
    }

    const btn = document.getElementById('btn-save-playlist');
    btn.disabled = true; btn.textContent = 'Salvando...';
    try {
      if (state.editingPlaylist) {
        await DB.updatePlaylist(state.editingPlaylist.id, { name, desc, videos: state.pendingPlaylistVideos });
        UI.toast('✅ Playlist atualizada!');
      } else {
        await DB.addPlaylist({ name, desc, videos: state.pendingPlaylistVideos }, currentUser);
        UI.toast('✅ Playlist criada!');
      }
      UI.closeModals();
    } catch {
      errEl.textContent = 'Erro ao salvar.'; errEl.classList.remove('hidden');
    } finally {
      btn.disabled = false; btn.textContent = 'Salvar Playlist';
    }
  }

  // ── PLAYER ────────────────────────────────────────────────────────────────
  function openPlayer(playlist) {
    state.playerPlaylist = playlist;
    state.playerIndex    = 0;
    document.getElementById('playlists-grid').classList.add('hidden');
    document.getElementById('playlist-toolbar').classList.add('hidden');
    document.getElementById('player-view').classList.remove('hidden');
    renderPlayer();
  }

  function closePlayer() {
    const iframe = document.getElementById('yt-player');
    iframe.src = '';
    document.getElementById('playlists-grid').classList.remove('hidden');
    document.getElementById('playlist-toolbar').classList.remove('hidden');
    document.getElementById('player-view').classList.add('hidden');
    state.playerPlaylist = null;
  }

  function renderPlayer() {
    const p  = state.playerPlaylist;
    const vi = state.playerIndex;
    const v  = p.videos[vi];
    document.getElementById('yt-player').src =
      `https://www.youtube.com/embed/${v.id}?autoplay=1&rel=0`;
    document.getElementById('player-video-title').textContent    = v.title;
    document.getElementById('player-playlist-info').textContent  =
      `${p.name} · Vídeo ${vi + 1} de ${p.videos.length}`;
    // Queue
    const queue = document.getElementById('player-queue');
    queue.innerHTML = '<div class="queue-label">Fila de reprodução</div>';
    p.videos.forEach((vid, idx) => {
      queue.appendChild(UI.queueItem(vid, idx, vi, i => {
        state.playerIndex = i;
        renderPlayer();
      }));
    });
    // Scroll active item into view
    setTimeout(() => {
      const active = queue.querySelector('.queue-item.active');
      if (active) active.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
    }, 100);
  }

  // ── Modal close bindings ──────────────────────────────────────────────────
  function bindModals() {
    document.querySelectorAll('.modal-close, .modal-close-btn').forEach(btn => {
      btn.addEventListener('click', UI.closeModals);
    });
    document.getElementById('modal-overlay').addEventListener('click', e => {
      if (e.target === e.currentTarget) UI.closeModals();
    });
  }

  // ── Init ──────────────────────────────────────────────────────────────────
  function init() {
    Auth.init();

    Auth.observe(
      // onLogin
      user => {
        currentUser = user;
        showApp();
        // Subscribe to live Firestore updates
        unsubscribers.push(
          DB.watchMaterials(items => {
            state.materials = items;
            renderMaterials();
            updateStats();
          }),
          DB.watchLinks(items => {
            state.links = items;
            renderLinks();
            updateStats();
          }),
          DB.watchPlaylists(items => {
            state.playlists = items;
            renderPlaylists();
            updateStats();
          })
        );
      },
      // onLogout
      () => {
        currentUser = null;
        showAuth();
      }
    );

    // Tab navigation
    document.querySelectorAll('.nav-btn, .bnav-btn').forEach(btn => {
      btn.addEventListener('click', () => switchTab(btn.dataset.tab));
    });

    bindModals();
    bindMaterials();
    bindLinks();
    bindPlaylists();
  }

  return { init };
})();

document.addEventListener('DOMContentLoaded', () => App.init());
