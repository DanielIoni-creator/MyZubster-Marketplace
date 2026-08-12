/**
 * ⭐ Review Service - Sistema Recensioni
 */

class ReviewService {
    constructor() {
        this.reviews = [];
        this.loadReviews();
    }

    // Carica recensioni
    loadReviews() {
        this.reviews = [
            {
                id: 'rev_1',
                productId: 'prod_1',
                userId: 'user_1',
                userName: 'Pytho',
                rating: 5,
                comment: '🌿 Pianta straordinaria! Ha superato ogni aspettativa.',
                images: ['image1.jpg'],
                verified: true,
                helpful: 12,
                createdAt: new Date().toISOString()
            },
            {
                id: 'rev_2',
                productId: 'prod_1',
                userId: 'user_2',
                userName: 'GreenMaster',
                rating: 4,
                comment: '🌱 Ottima qualità, consegna veloce.',
                images: [],
                verified: true,
                helpful: 5,
                createdAt: new Date(Date.now() - 86400000).toISOString()
            }
        ];
    }

    // Crea recensione
    async createReview(reviewData) {
        try {
            const review = {
                id: `rev_${Date.now()}`,
                ...reviewData,
                verified: true,
                helpful: 0,
                createdAt: new Date().toISOString()
            };
            this.reviews.push(review);
            return {
                success: true,
                review: review,
                message: '⭐ Recensione aggiunta con successo!'
            };
        } catch (error) {
            console.error('❌ Errore creazione recensione:', error);
            return { success: false, error: error.message };
        }
    }

    // Ottieni recensioni per prodotto
    async getReviewsByProduct(productId) {
        try {
            const reviews = this.reviews.filter(r => r.productId === productId);
            const stats = this.getStats(reviews);
            
            return {
                success: true,
                reviews: reviews,
                stats: stats,
                total: reviews.length
            };
        } catch (error) {
            console.error('❌ Errore:', error);
            return { success: false, error: error.message };
        }
    }

    // Ottieni recensioni per utente
    async getReviewsByUser(userId) {
        try {
            const reviews = this.reviews.filter(r => r.userId === userId);
            return {
                success: true,
                reviews: reviews,
                total: reviews.length
            };
        } catch (error) {
            console.error('❌ Errore:', error);
            return { success: false, error: error.message };
        }
    }

    // Ottieni statistiche
    getStats(reviews) {
        if (!reviews || reviews.length === 0) {
            return {
                average: 0,
                total: 0,
                distribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 }
            };
        }

        const total = reviews.length;
        const sum = reviews.reduce((acc, r) => acc + r.rating, 0);
        const average = sum / total;

        const distribution = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
        reviews.forEach(r => {
            distribution[r.rating] = (distribution[r.rating] || 0) + 1;
        });

        return {
            average: Math.round(average * 10) / 10,
            total: total,
            distribution: distribution
        };
    }

    // Mark recensione come utile
    async markHelpful(reviewId) {
        try {
            const review = this.reviews.find(r => r.id === reviewId);
            if (!review) {
                throw new Error('Recensione non trovata');
            }
            review.helpful += 1;
            return {
                success: true,
                helpful: review.helpful,
                message: '✅ Recensione segnata come utile'
            };
        } catch (error) {
            console.error('❌ Errore:', error);
            return { success: false, error: error.message };
        }
    }

    // Segnala recensione
    async reportReview(reviewId, reason) {
        try {
            const review = this.reviews.find(r => r.id === reviewId);
            if (!review) {
                throw new Error('Recensione non trovata');
            }
            // In produzione, salva la segnalazione
            return {
                success: true,
                message: '📝 Recensione segnalata. Verrà esaminata.',
                reason: reason
            };
        } catch (error) {
            console.error('❌ Errore:', error);
            return { success: false, error: error.message };
        }
    }

    // Ottieni rating seller
    async getSellerRating(sellerId) {
        try {
            // In produzione, calcola il rating del seller basato sulle recensioni
            return {
                success: true,
                rating: 4.5,
                total: 25,
                topReview: 'Ottimo venditore!'
            };
        } catch (error) {
            console.error('❌ Errore:', error);
            return { success: false, error: error.message };
        }
    }
}

module.exports = { ReviewService };
