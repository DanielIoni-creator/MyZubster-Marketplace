Marketplace (this repo) MyZubster (core)
├── models/ ├── Payment gateway
│ ├── User.js ├── Subaddress generation
│ ├── Skill.js ├── Transaction monitoring
│ └── ServiceOrder.js └── Exchange rate API
├── routes/
│ ├── users.js
│ ├── skills.js
│ └── orders.js
├── middleware/auth.js
└── server.js
text


---

## 🚀 Quick Start

### 1️⃣ Start MyZubster (core)

```bash
git clone https://github.com/DanielIoni-creator/MyZubsterAPP.git
cd MyZubsterAPP/backend
docker-compose up -d

2️⃣ Configure and start the marketplace
bash

git clone https://github.com/DanielIoni-creator/MyZubster-Marketplace.git
cd MyZubster-Marketplace
cp .env.example .env
# Edit .env with your MyZubster API URL and token
npm install
npm start

The API will be available at http://localhost:4000
🔧 API Endpoints
Method	Endpoint	Description
POST	/api/users/register	Register a new user
POST	/api/users/login	Login and get JWT token
POST	/api/users/become-seller	Become a seller
POST	/api/skills	Publish a skill
GET	/api/skills	List all skills
POST	/api/orders	Create an order (buyer only)
GET	/api/orders/my-orders	List user orders
GET	/api/orders/:id/payment-status	Check payment status
🔗 Related Projects

    MyZubsterAPP — Core payment gateway → GitHub

    MyZubster-App — Android app for this marketplace → GitHub

📄 License

MIT License

Built with ❤️ for the Monero community 🏘️