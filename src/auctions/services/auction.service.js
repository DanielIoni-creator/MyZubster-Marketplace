/**
 * 🔨 Auction Service - Sistema Aste
 */

class AuctionService {
    constructor() {
        this.auctions = [];
        this.bids = [];
        this.initAuctions();
    }

    // Inizializza aste
    initAuctions() {
        this.auctions = [
            {
                id: 'auc_1',
                productId: 'prod_1',
                productName: '🌿 Salvia Quantica',
                seller: 'Pytho',
                startingPrice: 50,
                currentPrice: 75,
                minBid: 5,
                endTime: new Date(Date.now() + 86400000).toISOString(),
                status: 'active',
                bids: 12,
                createdAt: new Date().toISOString()
            },
            {
                id: 'auc_2',
                productId: 'prod_2',
                productName: '🌺 Rosa Antica',
                seller: 'GreenMaster',
                startingPrice: 30,
                currentPrice: 45,
                minBid: 3,
                endTime: new Date(Date.now() + 172800000).toISOString(),
                status: 'active',
                bids: 8,
                createdAt: new Date().toISOString()
            }
        ];

        this.bids = [
            {
                id: 'bid_1',
                auctionId: 'auc_1',
                bidder: 'User1',
                amount: 75,
                timestamp: new Date().toISOString()
            },
            {
                id: 'bid_2',
                auctionId: 'auc_1',
                bidder: 'User2',
                amount: 70,
                timestamp: new Date(Date.now() - 3600000).toISOString()
            }
        ];
    }

    // Crea asta
    async createAuction(auctionData) {
        try {
            const auction = {
                id: `auc_${Date.now()}`,
                ...auctionData,
                currentPrice: auctionData.startingPrice,
                status: 'active',
                bids: 0,
                createdAt: new Date().toISOString()
            };
            this.auctions.push(auction);
            return {
                success: true,
                auction: auction,
                message: '🔨 Asta creata con successo!'
            };
        } catch (error) {
            console.error('❌ Errore creazione asta:', error);
            return { success: false, error: error.message };
        }
    }

    // Ottieni tutte le aste
    async getAuctions() {
        try {
            const active = this.auctions.filter(a => a.status === 'active');
            const ended = this.auctions.filter(a => a.status === 'ended');
            return {
                success: true,
                active: active,
                ended: ended,
                total: this.auctions.length
            };
        } catch (error) {
            console.error('❌ Errore getAuctions:', error);
            return { success: false, error: error.message };
        }
    }

    // Ottieni asta per ID
    async getAuctionById(id) {
        try {
            const auction = this.auctions.find(a => a.id === id);
            if (!auction) {
                throw new Error('Asta non trovata');
            }
            const bids = this.bids.filter(b => b.auctionId === id);
            return {
                success: true,
                auction: auction,
                bids: bids,
                bidCount: bids.length
            };
        } catch (error) {
            console.error('❌ Errore getAuctionById:', error);
            return { success: false, error: error.message };
        }
    }

    // Fai un'offerta
    async placeBid(auctionId, bidder, amount) {
        try {
            const auction = this.auctions.find(a => a.id === auctionId);
            if (!auction) {
                throw new Error('Asta non trovata');
            }

            if (auction.status !== 'active') {
                throw new Error('Asta non attiva');
            }

            if (amount < auction.currentPrice + auction.minBid) {
                throw new Error(`Offerta minima: ${auction.currentPrice + auction.minBid} MYZ`);
            }

            const bid = {
                id: `bid_${Date.now()}`,
                auctionId: auctionId,
                bidder: bidder,
                amount: amount,
                timestamp: new Date().toISOString()
            };

            this.bids.push(bid);
            auction.currentPrice = amount;
            auction.bids += 1;

            return {
                success: true,
                bid: bid,
                auction: auction,
                message: '✅ Offerta piazzata con successo!'
            };
        } catch (error) {
            console.error('❌ Errore placeBid:', error);
            return { success: false, error: error.message };
        }
    }

    // Termina asta
    async endAuction(auctionId) {
        try {
            const auction = this.auctions.find(a => a.id === auctionId);
            if (!auction) {
                throw new Error('Asta non trovata');
            }

            if (auction.status !== 'active') {
                throw new Error('Asta già terminata');
            }

            auction.status = 'ended';
            auction.endTime = new Date().toISOString();

            // Trova il vincitore
            const bids = this.bids.filter(b => b.auctionId === auctionId);
            const winner = bids.length > 0 ? bids.reduce((a, b) => a.amount > b.amount ? a : b) : null;

            return {
                success: true,
                auction: auction,
                winner: winner,
                message: '🏆 Asta terminata con successo!'
            };
        } catch (error) {
            console.error('❌ Errore endAuction:', error);
            return { success: false, error: error.message };
        }
    }

    // Ottieni statistiche aste
    async getStats() {
        try {
            const total = this.auctions.length;
            const active = this.auctions.filter(a => a.status === 'active').length;
            const ended = this.auctions.filter(a => a.status === 'ended').length;
            const totalBids = this.bids.length;
            const totalValue = this.auctions.reduce((sum, a) => sum + a.currentPrice, 0);

            return {
                success: true,
                stats: {
                    total: total,
                    active: active,
                    ended: ended,
                    totalBids: totalBids,
                    totalValue: totalValue,
                    averageBids: total > 0 ? Math.round(totalBids / total) : 0
                }
            };
        } catch (error) {
            console.error('❌ Errore getStats:', error);
            return { success: false, error: error.message };
        }
    }

    // Timer automatico per aste
    startTimer() {
        setInterval(() => {
            const now = new Date();
            this.auctions.forEach(auction => {
                if (auction.status === 'active' && new Date(auction.endTime) < now) {
                    this.endAuction(auction.id);
                }
            });
        }, 60000); // Controlla ogni minuto
    }
}

// Avvia timer
const auctionService = new AuctionService();
auctionService.startTimer();

module.exports = { AuctionService };
