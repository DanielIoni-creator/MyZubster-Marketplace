# 🤖 AgricoloBot - Robot Software per Orti Urbani

## Descrizione
AgricoloBot è un robot software per MyZubster che monitora gli orti urbani utilizzando sensori Arduino e fornisce report automatici agli agricoltori.

## Funzionalità
- 📡 Lettura dati da sensori (pH, EC, temperatura, umidità)
- 📊 Analisi dello stato del suolo
- 📈 Generazione di report automatici
- 💰 Integrazione con sistema di escrow (pagamenti in MYZ)
- 🔔 Alert e raccomandazioni per gli agricoltori

## Endpoint API
- POST /api/robot/agricolo/assign - Assegna un lavoro
- POST /api/robot/agricolo/execute - Esegue il monitoraggio
- POST /api/robot/agricolo/deliver - Consegna il report
- GET /api/robot/agricolo/status/:id - Stato del lavoro
- GET /api/robot/agricolo/health - Health check

## Installazione
```bash
npm install
npm start
```

## Variabili d'ambiente
- ROBOT_PORT - Porta del robot (default: 5001)
- MONGODB_URI - URI MongoDB
- GATEWAY_URL - URL del gateway MyZubster
- ROBOT_WALLET - Wallet del robot per i pagamenti
- PLATFORM_WALLET - Wallet della piattaforma

## Bounty
- Ricompensa: 200 MYZ + 1% lifetime
- Bonus fedeltà: +10% sulle prime 3 bounty completate

## Link utili
- GitHub: https://github.com/MyZubster-Ecosystem
- Bounty page: https://myzubsterapp.onrender.com/bounty
