// ─── DB.JS — Firestore CRUD ──────────────────────────────────────────────────
// Estrutura das coleções:
//   /materials/{id}  — materiais (links de nuvem)
//   /links/{id}      — mural de links
//   /playlists/{id}  — playlists do YouTube
//
// Todos são compartilhados entre os membros do grupo.
// O campo "addedBy" guarda uid do usuário que criou.

const DB = (() => {

  const COL = {
    materials: 'materials',
    links:     'links',
    playlists: 'playlists',
  };

  const ts = () => firebase.firestore.FieldValue.serverTimestamp();

  // ── MATERIALS ──────────────────────────────────────────────────────────────

  async function addMaterial(data, user) {
    return db.collection(COL.materials).add({
      ...data,
      addedBy:     user.uid,
      addedByName: user.displayName || user.email,
      createdAt:   ts(),
    });
  }

  function watchMaterials(callback) {
    return db.collection(COL.materials)
      .orderBy('createdAt', 'desc')
      .onSnapshot(snap => {
        const items = snap.docs.map(d => ({ id: d.id, ...d.data() }));
        callback(items);
      });
  }

  async function deleteMaterial(id) {
    return db.collection(COL.materials).doc(id).delete();
  }

  // ── LINKS ──────────────────────────────────────────────────────────────────

  async function addLink(data, user) {
    return db.collection(COL.links).add({
      ...data,
      addedBy:     user.uid,
      addedByName: user.displayName || user.email,
      createdAt:   ts(),
    });
  }

  function watchLinks(callback) {
    return db.collection(COL.links)
      .orderBy('createdAt', 'desc')
      .onSnapshot(snap => {
        const items = snap.docs.map(d => ({ id: d.id, ...d.data() }));
        callback(items);
      });
  }

  async function deleteLink(id) {
    return db.collection(COL.links).doc(id).delete();
  }

  // ── PLAYLISTS ──────────────────────────────────────────────────────────────

  async function addPlaylist(data, user) {
    return db.collection(COL.playlists).add({
      ...data,
      addedBy:     user.uid,
      addedByName: user.displayName || user.email,
      createdAt:   ts(),
    });
  }

  async function updatePlaylist(id, data) {
    return db.collection(COL.playlists).doc(id).update({
      ...data,
      updatedAt: ts(),
    });
  }

  function watchPlaylists(callback) {
    return db.collection(COL.playlists)
      .orderBy('createdAt', 'desc')
      .onSnapshot(snap => {
        const items = snap.docs.map(d => ({ id: d.id, ...d.data() }));
        callback(items);
      });
  }

  async function deletePlaylist(id) {
    return db.collection(COL.playlists).doc(id).delete();
  }

  return {
    addMaterial, watchMaterials, deleteMaterial,
    addLink,     watchLinks,     deleteLink,
    addPlaylist, updatePlaylist, watchPlaylists, deletePlaylist,
  };
})();
