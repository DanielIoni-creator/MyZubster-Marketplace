# MyZubster-Marketplace 🛒

**Marketplace di competenze con pagamenti Monero via MyZubster**

[![Licenza: MIT](https://img.shields.io/badge/Licenza-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Node.js](https://img.shields.io/badge/Node.js-20.x-green.svg)](https://nodejs.org/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-15-blue.svg)](https://www.postgresql.org/)

---

## 📖 Cos'è questo progetto?

Questo è un **fork dimostrativo** di [MyZubster](https://github.com/DanielIoni-creator/MyZubsterAPP) che mostra come integrare il gateway di pagamento in un'applicazione reale: un **marketplace di competenze**.

**Funzionalità:**
- 👤 **Gestione utenti** — registrazione, login, autenticazione JWT
- 🛠️ **Competenze** — pubblica, cerca, filtra
- 💰 **Pagamenti Monero** — via MyZubster core
- 📦 **Gestione ordini** — traccia stato e conferma pagamento
- 👨‍💼 **Dashboard venditore** — profilo, competenze, guadagni

---

## 🧩 Architettura
Marketplace (questo repo) MyZubster (core)
├── models/ ├── Gateway pagamenti
│ ├── User.js ├── Generazione subaddress
│ ├── Skill.js ├── Monitoraggio transazioni
│ └── ServiceOrder.js └── API tasso di cambio
├── routes/
│ ├── users.js
│ ├── skills.js
│ └── orders.js
├── middleware/auth.js
└── server.js
text


---

## 🚀 Avvio rapido

### 1️⃣ Avvia MyZubster (core)

```bash
git clone https://github.com/DanielIoni-creator/MyZubsterAPP.git
cd MyZubsterAPP/backend
docker-compose up -d

2️⃣ Configura e avvia il marketplace
bash

git clone https://github.com/DanielIoni-creator/MyZubster-Marketplace.git
cd MyZubster-Marketplace
cp .env.example .env
# Modifica .env con l'URL e il token di MyZubster
npm install
npm start

L'API sarà disponibile su http://localhost:4000
🔧 Endpoint API
Metodo	Endpoint	Descrizione
POST	/api/users/register	Registra un nuovo utente
POST	/api/users/login	Login e ottieni token JWT
POST	/api/users/become-seller	Diventa venditore
POST	/api/skills	Pubblica una competenza
GET	/api/skills	Elenca tutte le competenze
POST	/api/orders	Crea un ordine (solo acquirente)
GET	/api/orders/my-orders	Lista ordini utente
GET	/api/orders/:id/payment-status	Stato pagamento
🔗 Progetti correlati

    MyZubsterAPP — Core gateway pagamenti → GitHub

    MyZubster-App — App Android → GitHub

📄 Licenza

Licenza MIT

Realizzato con ❤️ per la comunità Monero 🏘️