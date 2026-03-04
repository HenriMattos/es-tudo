# 🚀 Guia de Setup — És Tudo

## Estrutura do projeto

```
estudo/
├── index.html          ← Página principal
├── manifest.json       ← PWA manifest
├── sw.js               ← Service Worker (offline)
├── css/
│   └── style.css
├── js/
│   ├── config.js       ← ⚠️ Aqui você coloca as credenciais do Firebase
│   ├── auth.js         ← Login, cadastro, recuperação de senha
│   ├── db.js           ← Leitura/escrita no Firestore
│   ├── ui.js           ← Componentes visuais
│   └── app.js          ← Lógica principal
└── icons/
    ├── icon-192.png    ← Ícone PWA (crie ou coloque aqui)
    └── icon-512.png
```

---

## PASSO 1 — Criar projeto no Firebase (gratuito)

1. Acesse https://console.firebase.google.com
2. Clique em **"Adicionar projeto"** → dê um nome (ex: `estudotudo`)
3. Desative o Google Analytics se quiser (opcional)
4. Aguarde a criação

---

## PASSO 2 — Ativar Authentication

1. No menu lateral: **Build → Authentication**
2. Clique **"Começar"**
3. Ative:
   - **Email/Senha**
   - **Google** (para login com Google)
4. Em **"Settings → Domínios autorizados"**, adicione seu domínio depois do deploy

---

## PASSO 3 — Criar o Firestore

1. **Build → Firestore Database**
2. Clique **"Criar banco de dados"**
3. Escolha **"Iniciar no modo de produção"**
4. Escolha a região mais próxima (ex: `southamerica-east1` para Brasil)

### Regras de segurança do Firestore

Vá em **Firestore → Regras** e cole:

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Somente usuários autenticados lêem e escrevem
    match /{document=**} {
      allow read, write: if request.auth != null;
    }
  }
}
```

---

## PASSO 4 — Obter as credenciais e configurar

1. No console Firebase: **Configurações do projeto** (ícone de engrenagem)
2. Role até **"Seus apps"** → clique **"</ > Web"**
3. Dê um apelido (ex: `web`) e registre
4. Copie o objeto `firebaseConfig`
5. Abra `js/config.js` e substitua os valores:

```js
const FIREBASE_CONFIG = {
  apiKey:            "AIzaSy...",
  authDomain:        "estudotudo.firebaseapp.com",
  projectId:         "estudotudo",
  storageBucket:     "estudotudo.appspot.com",
  messagingSenderId: "123456789",
  appId:             "1:123456789:web:abc123"
};
```

6. Mude também o código de convite do grupo se quiser:
```js
const GROUP_INVITE_CODE = "estudos2025";  // mude para qualquer código secreto
```

---

## PASSO 5 — Criar os ícones PWA

Crie (ou baixe) dois ícones PNG para a pasta `icons/`:
- `icon-192.png` — 192×192 px
- `icon-512.png` — 512×512 px

Sugestão rápida: use https://favicon.io ou https://realfavicongenerator.net

---

## PASSO 6 — Deploy (hospedar online)

### Opção A — Firebase Hosting (recomendado, gratuito)

```bash
npm install -g firebase-tools
firebase login
firebase init hosting
# Escolha o projeto, pasta pública = "." (raiz), SPA = não
firebase deploy
```

### Opção B — Vercel (gratuito, mais simples)

1. Faça push do projeto para um repositório GitHub
2. Acesse https://vercel.com → importe o repositório
3. Clique Deploy — pronto!

### Opção C — Netlify (gratuito)

1. Arraste a pasta do projeto em https://app.netlify.com/drop
2. Pronto, URL gerada na hora!

---

## PASSO 7 — Instalar como app (PWA)

**Android (Chrome):**
- Acesse o site no Chrome
- Menu (⋮) → "Adicionar à tela inicial"

**iOS (Safari):**
- Acesse o site no Safari
- Botão de compartilhar → "Adicionar à Tela Inicial"

---

## Como adicionar materiais

O site **não faz upload direto** — ele funciona como um catálogo de links.
Fluxo recomendado:

1. Faça upload do arquivo no Google Drive / OneDrive / Dropbox
2. Gere o link de compartilhamento ("Qualquer pessoa com o link pode ver")
3. No site, clique em **"+ Adicionar Material"**
4. Cole o link e escolha o tipo de visualização:
   - **"Embutir PDF (Google Drive)"** → mostra o PDF dentro do site
   - **"Abrir em nova aba"** → link direto

### Dica para Google Drive — link de preview embutido

O site converte automaticamente links do Drive para preview embutido.
Basta colar o link de compartilhamento normal e escolher "Embutir PDF".

---

## Tecnologias utilizadas

| Camada       | Tecnologia                     |
|--------------|-------------------------------|
| Frontend     | HTML + CSS + JS (vanilla)     |
| Auth         | Firebase Authentication       |
| Banco        | Firestore (NoSQL, tempo real) |
| Storage      | Google Drive / OneDrive / etc |
| PWA          | Service Worker + manifest.json|
| Vídeos       | YouTube embed                 |

---

## Dúvidas frequentes

**Posso adicionar mais membros?**
Sim — qualquer pessoa com o código de convite (`GROUP_INVITE_CODE`) pode criar conta.

**Os dados são compartilhados entre membros?**
Sim. Tudo que qualquer membro adicionar aparece para todos em tempo real.

**E se o Firebase gratuito acabar?**
O plano Spark (gratuito) do Firebase inclui:
- 1 GB de Firestore
- 50k leituras/dia
- 20k escritas/dia
- Authentication ilimitado
Para um grupo de estudos isso é mais do que suficiente. Os arquivos ficam no Drive, que não consome quota do Firebase.
