# MyZubster-Marketplace 🛒

**Marché de compétences avec paiements Monero via MyZubster**

[![Licence: MIT](https://img.shields.io/badge/Licence-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Node.js](https://img.shields.io/badge/Node.js-20.x-green.svg)](https://nodejs.org/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-15-blue.svg)](https://www.postgresql.org/)

---

## 📖 Qu'est-ce que c'est ?

Ceci est un **fork de démonstration** de [MyZubster](https://github.com/DanielIoni-creator/MyZubsterAPP) montrant comment intégrer la passerelle de paiement dans une application réelle : un **marché de compétences**.

**Fonctionnalités :**
- 👤 **Gestion des utilisateurs** — inscription, connexion, authentification JWT
- 🛠️ **Compétences** — publier, rechercher, filtrer
- 💰 **Paiements Monero** — via MyZubster core
- 📦 **Gestion des commandes** — suivi et confirmation
- 👨‍💼 **Tableau de bord vendeur** — profil, compétences, gains

---

## 🧩 Architecture
Marketplace (ce repo) MyZubster (core)
├── models/ ├── Passerelle de paiement
│ ├── User.js ├── Génération de sous-adresses
│ ├── Skill.js ├── Surveillance des transactions
│ └── ServiceOrder.js └── API de taux de change
├── routes/
│ ├── users.js
│ ├── skills.js
│ └── orders.js
├── middleware/auth.js
└── server.js
text


---

## 🚀 Démarrage rapide

### 1️⃣ Démarre MyZubster (core)

```bash
git clone https://github.com/DanielIoni-creator/MyZubsterAPP.git
cd MyZubsterAPP/backend
docker-compose up -d

2️⃣ Configure et démarre le marketplace
bash

git clone https://github.com/DanielIoni-creator/MyZubster-Marketplace.git
cd MyZubster-Marketplace
cp .env.example .env
# Modifie .env avec l'URL et le token de MyZubster
npm install
npm start

L'API sera disponible sur http://localhost:4000
🔧 Endpoints API
Méthode	Endpoint	Description
POST	/api/users/register	Inscrire un nouvel utilisateur
POST	/api/users/login	Connexion et obtenir un token JWT
POST	/api/users/become-seller	Devenir vendeur
POST	/api/skills	Publier une compétence
GET	/api/skills	Lister toutes les compétences
POST	/api/orders	Créer une commande (acheteur uniquement)
GET	/api/orders/my-orders	Lister les commandes de l'utilisateur
GET	/api/orders/:id/payment-status	Statut du paiement
🔗 Projets associés

    MyZubsterAPP — Passerelle de paiement core → GitHub

    MyZubster-App — App Android → GitHub

📄 Licence

Licence MIT

Construit avec ❤️ pour la communauté Monero 🏘️