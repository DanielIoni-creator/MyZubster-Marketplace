/**
 * 🛒 Marketplace Service - Servizio Marketplace Decentralizzato
 */

class MarketplaceService {
    constructor() {
        this.products = [];
        this.orders = [];
        this.transactions = [];
        this.initData();
    }

    // Inizializza dati
    initData() {
        this.products = [
            {
                id: 'prod_1',
                name: '🌿 Salvia Quantica',
                description: 'Salvia del Giardino del Futuro (2124). Pianta curativa evoluta con proprietà quantiche.',
                price: 25,
                currency: 'MYZ',
                category: 'plants',
                species: 'Salvia Quantica',
                era: 2124,
                seller: 'Pytho',
                stock: 10,
                rating: 4.8,
                reviews: 15,
                images: ['salvia.jpg'],
                createdAt: new Date().toISOString()
            },
            {
                id: 'prod_2',
                name: '🌺 Rosa Antica',
                description: 'Rosa Gallica del 1500. Pianta medicinale utilizzata nell\'antica Roma.',
                price: 15,
                currency: 'MYZ',
                category: 'plants',
                species: 'Rosa Gallica',
                era: 1500,
                seller: 'GreenMaster',
                stock: 8,
                rating: 4.9,
                reviews: 12,
                images: ['rosa.jpg'],
                createdAt: new Date().toISOString()
            },
            {
                id: 'prod_3',
                name: '🌱 Semi di Lavanda',
                description: 'Semi di Lavandula Angustifolia. Pianta aromatica e medicinale.',
                price: 5,
                currency: 'MYZ',
                category: 'seeds',
                species: 'Lavandula Angustifolia',
                era: 1500,
                seller: 'GreenMaster',
                stock: 25,
                rating: 4.5,
                reviews: 8,
                images: ['lavanda.jpg'],
                createdAt: new Date().toISOString()
            }
        ];

        this.orders = [];
        this.transactions = [];
    }

    // Ottieni tutti i prodotti
    async getProducts(filters = {}) {
        try {
            let products = [...this.products];

            if (filters.category) {
                products = products.filter(p => p.category === filters.category);
            }
            if (filters.species) {
                products = products.filter(p => p.species?.includes(filters.species));
            }
            if (filters.era) {
                products = products.filter(p => p.era == filters.era);
            }
            if (filters.minPrice) {
                products = products.filter(p => p.price >= parseFloat(filters.minPrice));
            }
            if (filters.maxPrice) {
                products = products.filter(p => p.price <= parseFloat(filters.maxPrice));
            }
            if (filters.search) {
                const search = filters.search.toLowerCase();
                products = products.filter(p => 
                    p.name.toLowerCase().includes(search) ||
                    p.description.toLowerCase().includes(search)
                );
            }

            return {
                success: true,
                products: products,
                total: products.length
            };
        } catch (error) {
            console.error('❌ Errore getProducts:', error);
            return { success: false, error: error.message };
        }
    }

    // Ottieni prodotto per ID
    async getProductById(id) {
        try {
            const product = this.products.find(p => p.id === id);
            if (!product) {
                throw new Error('Prodotto non trovato');
            }
            return {
                success: true,
                product: product
            };
        } catch (error) {
            console.error('❌ Errore getProductById:', error);
            return { success: false, error: error.message };
        }
    }

    // Crea prodotto
    async createProduct(productData) {
        try {
            const product = {
                id: `prod_${Date.now()}`,
                ...productData,
                rating: 0,
                reviews: 0,
                createdAt: new Date().toISOString()
            };
            this.products.push(product);
            return {
                success: true,
                product: product,
                message: '✅ Prodotto creato con successo!'
            };
        } catch (error) {
            console.error('❌ Errore createProduct:', error);
            return { success: false, error: error.message };
        }
    }

    // Crea ordine
    async createOrder(orderData) {
        try {
            const { products, buyerId, shippingAddress } = orderData;
            
            // Verifica disponibilità
            let total = 0;
            const orderItems = [];
            
            for (const item of products) {
                const product = this.products.find(p => p.id === item.productId);
                if (!product) {
                    throw new Error(`Prodotto ${item.productId} non trovato`);
                }
                if (product.stock < item.quantity) {
                    throw new Error(`Quantità insufficiente per ${product.name}`);
                }
                
                total += product.price * item.quantity;
                orderItems.push({
                    productId: product.id,
                    name: product.name,
                    price: product.price,
                    quantity: item.quantity,
                    seller: product.seller
                });
                
                // Aggiorna stock
                product.stock -= item.quantity;
            }

            const order = {
                id: `order_${Date.now()}`,
                buyerId: buyerId,
                products: orderItems,
                total: total,
                currency: 'MYZ',
                status: 'pending',
                shippingAddress: shippingAddress,
                createdAt: new Date().toISOString()
            };

            this.orders.push(order);
            
            // Crea transazione
            const transaction = {
                id: `tx_${Date.now()}`,
                orderId: order.id,
                amount: total,
                currency: 'MYZ',
                type: 'purchase',
                status: 'pending',
                createdAt: new Date().toISOString()
            };
            this.transactions.push(transaction);

            return {
                success: true,
                order: order,
                transaction: transaction,
                message: '✅ Ordine creato con successo!'
            };
        } catch (error) {
            console.error('❌ Errore createOrder:', error);
            return { success: false, error: error.message };
        }
    }

    // Ottieni ordini utente
    async getOrders(userId) {
        try {
            const orders = this.orders.filter(o => o.buyerId === userId);
            return {
                success: true,
                orders: orders,
                total: orders.length
            };
        } catch (error) {
            console.error('❌ Errore getOrders:', error);
            return { success: false, error: error.message };
        }
    }

    // Aggiorna ordine
    async updateOrder(orderId, status) {
        try {
            const order = this.orders.find(o => o.id === orderId);
            if (!order) {
                throw new Error('Ordine non trovato');
            }
            
            order.status = status;
            order.updatedAt = new Date().toISOString();

            // Aggiorna anche la transazione
            const transaction = this.transactions.find(t => t.orderId === orderId);
            if (transaction) {
                transaction.status = status === 'delivered' ? 'completed' : status;
                transaction.updatedAt = new Date().toISOString();
            }

            return {
                success: true,
                order: order,
                message: `✅ Ordine aggiornato a: ${status}`
            };
        } catch (error) {
            console.error('❌ Errore updateOrder:', error);
            return { success: false, error: error.message };
        }
    }

    // Ottieni statistiche
    async getStats() {
        try {
            const totalProducts = this.products.length;
            const totalOrders = this.orders.length;
            const totalRevenue = this.orders
                .filter(o => o.status === 'delivered' || o.status === 'paid')
                .reduce((sum, o) => sum + o.total, 0);
            
            const completedOrders = this.orders.filter(o => o.status === 'delivered').length;
            const pendingOrders = this.orders.filter(o => o.status === 'pending').length;

            return {
                success: true,
                stats: {
                    totalProducts: totalProducts,
                    totalOrders: totalOrders,
                    totalRevenue: totalRevenue,
                    completedOrders: completedOrders,
                    pendingOrders: pendingOrders,
                    completionRate: totalOrders > 0 ? (completedOrders / totalOrders * 100).toFixed(1) : 0
                }
            };
        } catch (error) {
            console.error('❌ Errore getStats:', error);
            return { success: false, error: error.message };
        }
    }
}

export const marketplaceService = new MarketplaceService();
