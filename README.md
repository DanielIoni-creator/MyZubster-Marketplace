> **Part of the [MyZubster ecosystem](https://github.com/MyZubster-Ecosystem)**

> **Part of the [MyZubster ecosystem](https://github.com/MyZubster-Ecosystem)**

> **Part of the [MyZubster ecosystem](https://github.com/MyZubster-Ecosystem)**

> **Part of the [MyZubster ecosystem](https://github.com/MyZubster-Ecosystem/myzubster)**
[![License](https://img.shields.io/github/license/MyZubster-Ecosystem/MyZubster-Marketplace](LICENSE)) 
[![CI](https://github.com/MyZubster-Ecosystem/MyZubster-Marketplace/actions/workflows/ci.yml/badge.svg)](https://github.com/MyZubster-Ecosystem/MyZubster-Marketplace/actions/workflows/ci.yml)
[![GitHub stars](https://img.shields.io/github/stars/MyZubster-Ecosystem/MyZubster-Marketplace](https://github.com/MyZubster-Ecosystem/MyZubster-Marketplace/stargazers)) 
[![GitHub issues](https://img.shields.io/github/issues/MyZubster-Ecosystem/MyZubster-Marketplace](https://github.com/MyZubster-Ecosystem/MyZubster-Marketplace/issues)) 
[![GitHub last commit](https://img.shields.io/github/last-commit/MyZubster-Ecosystem/MyZubster-Marketplace](https://github.com/MyZubster-Ecosystem/MyZubster-Marketplace/commits/main)) 
[![Node.js](https://img.shields.io/badge/Node.js-18.x-green)](https://nodejs.org/)

# 🛒 MyZubster – Skills Marketplace Backend

**MyZubster-Marketplace** is the RESTful API backend for the skills marketplace. It handles users, skills, orders, commissions, and webhook integration with the Monero payment gateway.

---

## 🎯 What It Does

- User authentication & role management (JWT)
- Skill listing and management (CRUD)
- Order creation and lifecycle management
- Automated order updates via webhooks
- Commission system for marketplace owners
- Integration with MyZubster-Gateway for Monero payments

---

## 🏗️ Tech Stack

- **Node.js** + **Express**
- **Sequelize** ORM
- **SQLite** / **PostgreSQL**
- **JWT** authentication
- **PM2** for production

---

## 🔄 Payment Flow
Buyer creates order → Marketplace requests subaddress from Gateway

Gateway generates unique Monero address

Buyer sends Monero to that address

Gateway detects payment (every 60s)

Webhook sent to Marketplace with payment details

Order status updated to "completed"

Commission applied → seller receives payout

---

## 📡 API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/users/register` | Register |
| `POST` | `/api/users/login` | Login (returns JWT) |
| `POST` | `/api/users/become-seller` | Become seller |
| `POST` | `/api/skills` | Create skill (seller) |
| `GET` | `/api/skills` | List skills |
| `POST` | `/api/orders` | Create order |
| `GET` | `/api/orders/my-orders` | List user orders |
| `GET` | `/api/orders/:id/payment-status` | Check payment status |
| `POST` | `/api/webhook/order-update` | Webhook receiver (internal) |

---

### Pagination

`GET /api/skills` supports offset-based pagination.

Query parameters:

| Parameter | Default | Maximum | Description |
| --- | ---: | ---: | --- |
| `limit` | `20` | `100` | Number of skills to return |
| `offset` | `0` | — | Number of skills to skip |

Example:

```http
GET /api/skills?limit=10&offset=20
Example response:

{
  "data": [
    {
      "id": 21,
      "title": "Example skill"
    }
  ],
  "pagination": {
    "total": 53,
    "limit": 10,
    "offset": 20,
    "pages": 6
  }
}

Invalid pagination values, such as limit=0 or offset=-1, return an HTTP 400 response.


## 🚀 Quick Start

```bash
# Clone
git clone https://github.com/MyZubster-Ecosystem/MyZubster-Marketplace.git
cd MyZubster-Marketplace

# Install & configure
npm install
cp .env.example .env
nano .env

# Run
node server.js
.env Example
env

PORT=4000
DATABASE_URL=sqlite:./database.sqlite
JWT_SECRET=your_jwt_secret
MYZUBSTER_API_URL=http://localhost:3000/api
MYZUBSTER_API_TOKEN=your_admin_token
WEBHOOK_SECRET=your_webhook_secret
COMMISSION_PERCENTAGE=2.0

📁 Structure
text

MyZubster-Marketplace/
├── server.js
├── models/          # User, Skill, Order
├── routes/          # auth, users, skills, orders, webhook
├── middleware/      # JWT auth, admin check
└── .env.example

🔗 Related Projects

    MyZubster-Gateway – Monero payment gateway

    MyZubster-App – Mobile app

📄 License

MIT License
👨‍💻 Author

Daniel Ioni – Self‑Taught Developer & Monero Advocate
Based in Rimini, Italy. Founder of "Monero Italia" (Facebook group).
GitHub


Follow the development of MyZubster and connect with me on social media:

- 📖 **Blog & Articles**: [DEV.to - Daniel Ioni](https://dev.to/danielioni)
- 🐦 **X (Twitter)**: [@myzubster](https://x.com/myzubster)
- 💼 **LinkedIn**: [Daniel Ioni](https://www.linkedin.com/in/daniel-ioni-62b2b9423/)
- 🐙 **GitHub**: [MyZubster-Ecosystem](https://github.com/MyZubster-Ecosystem)
- 🎵 **TikTok**: [@h4x0r_23](https://www.tiktok.com/@h4x0r_23)
**Stay updated on the journey!** 🚀


## 🤝 Contributi

Contributi sono benvenuti! Dai un'occhiata alle [issue aperte]([Issues](https://github.com/MyZubster-Ecosystem/MyZubster-Marketplace/issues)) e alla [roadmap]([Roadmap](https://github.com/users/MyZubster-Ecosystem/projects/1)).

## 🌐 Ecosystem Hub

**MyZubster Ecosystem**: https://github.com/MyZubster-Ecosystem

## 🌐 Ecosystem Hub

**MyZubster Ecosystem**: https://github.com/MyZubster-Ecosystem

## 🌐 Ecosystem Hub

**MyZubster Ecosystem**: https://github.com/MyZubster-Ecosystem
