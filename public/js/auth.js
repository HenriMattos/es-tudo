// ─── AUTH.JS ─────────────────────────────────────────────────────────────────

const Auth = (() => {

  // ── Helpers ────────────────────────────────────────────────────────────────

  function showForm(id) {
    document.querySelectorAll('.auth-form').forEach(f => f.classList.remove('active'));
    document.getElementById(id).classList.add('active');
  }

  function setError(elId, msg) {
    const el = document.getElementById(elId);
    el.textContent = msg;
    el.classList.remove('hidden');
  }

  function clearError(elId) {
    const el = document.getElementById(elId);
    el.textContent = '';
    el.classList.add('hidden');
  }

  function setLoading(btn, loading) {
    btn.disabled = loading;
    btn.innerHTML = loading
      ? '<span class="spinner"></span>'
      : btn.dataset.label;
  }

  function saveLabel(btn) {
    btn.dataset.label = btn.innerHTML;
  }

  // ── Google Provider ────────────────────────────────────────────────────────

  const googleProvider = new firebase.auth.GoogleAuthProvider();

  // ── Event bindings ─────────────────────────────────────────────────────────

  function init() {

    // Form navigation
    document.getElementById('go-register').addEventListener('click', e => { e.preventDefault(); showForm('form-register'); });
    document.getElementById('go-login').addEventListener('click',    e => { e.preventDefault(); showForm('form-login'); });
    document.getElementById('go-login2').addEventListener('click',   e => { e.preventDefault(); showForm('form-login'); });
    document.getElementById('go-forgot').addEventListener('click',   e => { e.preventDefault(); showForm('form-forgot'); });

    // Login
    const btnLogin = document.getElementById('btn-login');
    saveLabel(btnLogin);
    btnLogin.addEventListener('click', async () => {
      clearError('login-error');
      const email    = document.getElementById('login-email').value.trim();
      const password = document.getElementById('login-password').value;
      if (!email || !password) return setError('login-error', 'Preencha email e senha.');
      setLoading(btnLogin, true);
      try {
        await auth.signInWithEmailAndPassword(email, password);
      } catch (err) {
        setError('login-error', friendlyError(err.code));
      } finally {
        setLoading(btnLogin, false);
      }
    });

    // Google login
    document.getElementById('btn-google-login').addEventListener('click', async () => {
      try {
        await auth.signInWithPopup(googleProvider);
      } catch (err) {
        setError('login-error', friendlyError(err.code));
      }
    });

    // Register
    const btnReg = document.getElementById('btn-register');
    saveLabel(btnReg);
    btnReg.addEventListener('click', async () => {
      clearError('reg-error');
      const name     = document.getElementById('reg-name').value.trim();
      const email    = document.getElementById('reg-email').value.trim();
      const password = document.getElementById('reg-password').value;
      const code     = document.getElementById('reg-code').value.trim();

      if (!name)     return setError('reg-error', 'Informe seu nome.');
      if (!email)    return setError('reg-error', 'Informe seu email.');
      if (password.length < 6) return setError('reg-error', 'Senha deve ter no mínimo 6 caracteres.');
      if (code !== GROUP_INVITE_CODE) return setError('reg-error', 'Código do grupo inválido.');

      setLoading(btnReg, true);
      try {
        const cred = await auth.createUserWithEmailAndPassword(email, password);
        await cred.user.updateProfile({ displayName: name });
        // Save extra user info to Firestore
        await db.collection('users').doc(cred.user.uid).set({
          name, email, createdAt: firebase.firestore.FieldValue.serverTimestamp()
        });
      } catch (err) {
        setError('reg-error', friendlyError(err.code));
      } finally {
        setLoading(btnReg, false);
      }
    });

    // Forgot password
    const btnForgot = document.getElementById('btn-forgot');
    saveLabel(btnForgot);
    btnForgot.addEventListener('click', async () => {
      clearError('forgot-error');
      document.getElementById('forgot-msg').classList.add('hidden');
      const email = document.getElementById('forgot-email').value.trim();
      if (!email) return setError('forgot-error', 'Informe seu email.');
      setLoading(btnForgot, true);
      try {
        await auth.sendPasswordResetEmail(email);
        const msg = document.getElementById('forgot-msg');
        msg.textContent = '✅ Email enviado! Verifique sua caixa de entrada.';
        msg.classList.remove('hidden');
      } catch (err) {
        setError('forgot-error', friendlyError(err.code));
      } finally {
        setLoading(btnForgot, false);
      }
    });

    // Logout
    document.getElementById('btn-logout').addEventListener('click', () => {
      auth.signOut();
    });

    // User avatar dropdown
    document.getElementById('user-avatar-btn').addEventListener('click', e => {
      e.stopPropagation();
      document.getElementById('user-dropdown').classList.toggle('hidden');
    });
    document.addEventListener('click', () => {
      document.getElementById('user-dropdown').classList.add('hidden');
    });
  }

  // ── Auth state observer ────────────────────────────────────────────────────

  function observe(onLogin, onLogout) {
    auth.onAuthStateChanged(user => {
      if (user) {
        // Update UI with user info
        const initials = (user.displayName || user.email || '?')
          .split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase();
        document.getElementById('user-initials').textContent = initials;
        document.getElementById('dropdown-name').textContent  = user.displayName || 'Usuário';
        document.getElementById('dropdown-email').textContent = user.email;
        const photoEl = document.getElementById('user-photo');
        if (user.photoURL) {
          photoEl.src = user.photoURL;
          photoEl.style.display = 'block';
          document.getElementById('user-initials').style.display = 'none';
        }
        onLogin(user);
      } else {
        onLogout();
      }
    });
  }

  // ── Friendly error messages ────────────────────────────────────────────────

  function friendlyError(code) {
    const map = {
      'auth/user-not-found':      'Email não encontrado.',
      'auth/wrong-password':      'Senha incorreta.',
      'auth/invalid-credential':  'Email ou senha inválidos.',
      'auth/email-already-in-use':'Este email já está em uso.',
      'auth/weak-password':       'Senha muito fraca (mínimo 6 caracteres).',
      'auth/invalid-email':       'Email inválido.',
      'auth/too-many-requests':   'Muitas tentativas. Tente novamente mais tarde.',
      'auth/popup-closed-by-user':'Login cancelado.',
      'auth/network-request-failed': 'Sem conexão. Verifique sua internet.',
    };
    return map[code] || 'Erro inesperado. Tente novamente.';
  }

  return { init, observe };
})();
