# MyZubster-Marketplace 🛒

**Marketplace de competencias con pagos Monero vía MyZubster**

[![Licencia: MIT](https://img.shields.io/badge/Licencia-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Node.js](https://img.shields.io/badge/Node.js-20.x-green.svg)](https://nodejs.org/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-15-blue.svg)](https://www.postgresql.org/)

---

## 📖 ¿Qué es esto?

Este es un **fork de demostración** de [MyZubster](https://github.com/DanielIoni-creator/MyZubsterAPP) que muestra cómo integrar la pasarela de pago en una aplicación real: un **marketplace de competencias**.

**Características:**
- 👤 **Gestión de usuarios** — registro, login, autenticación JWT
- 🛠️ **Competencias** — publicar, buscar, filtrar
- 💰 **Pagos Monero** — vía MyZubster core
- 📦 **Gestión de pedidos** — seguimiento y confirmación
- 👨‍💼 **Panel de vendedor** — perfil, competencias, ganancias

---

## 🧩 Arquitectura
Marketplace (este repo) MyZubster (core)
├── models/ ├── Pasarela de pagos
│ ├── User.js ├── Generación de subdirecciones
│ ├── Skill.js ├── Monitoreo de transacciones
│ └── ServiceOrder.js └── API de tasa de cambio
├── routes/
│ ├── users.js
│ ├── skills.js
│ └── orders.js
├── middleware/auth.js
└── server.js
text


---

## 🚀 Inicio rápido

### 1️⃣ Inicia MyZubster (core)

```bash
git clone https://github.com/DanielIoni-creator/MyZubsterAPP.git
cd MyZubsterAPP/backend
docker-compose up -d

2️⃣ Configura e inicia el marketplace
bash

git clone https://github.com/DanielIoni-creator/MyZubster-Marketplace.git
cd MyZubster-Marketplace
cp .env.example .env
# Edita .env con la URL y el token de MyZubster
npm install
npm start

La API estará disponible en http://localhost:4000
🔧 Endpoints API
Método	Endpoint	Descripción
POST	/api/users/register	Registrar un nuevo usuario
POST	/api/users/login	Login y obtener token JWT
POST	/api/users/become-seller	Convertirse en vendedor
POST	/api/skills	Publicar una competencia
GET	/api/skills	Listar todas las competencias
POST	/api/orders	Crear un pedido (solo comprador)
GET	/api/orders/my-orders	Listar pedidos del usuario
GET	/api/orders/:id/payment-status	Estado del pago
🔗 Proyectos relacionados

    MyZubsterAPP — Pasarela de pagos core → GitHub

    MyZubster-App — App Android → GitHub

📄 Licencia

Licencia MIT

Hecho con ❤️ para la comunidad Monero 🏘️