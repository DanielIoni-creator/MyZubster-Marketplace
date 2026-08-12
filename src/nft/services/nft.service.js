/**
 * 🎨 NFT Service - Gestione NFT
 */

class NFTService {
    constructor() {
        this.nfts = [];
        this.loadNFTs();
    }

    // Carica NFT
    loadNFTs() {
        this.nfts = [
            {
                id: 'nft_1',
                name: '🌿 Salvia Quantica',
                description: 'Salvia Quantica del Giardino del Futuro (2124)',
                price: 100,
                currency: 'MYZ',
                owner: '0x123...',
                image: 'salvia_quantica.png',
                attributes: {
                    era: '2124',
                    rarity: 'legendary',
                    healing: 'quantum',
                },
                createdAt: new Date().toISOString(),
            },
            {
                id: 'nft_2',
                name: '🌺 Rosa Antica',
                description: 'Rosa Gallica del 1500',
                price: 75,
                currency: 'MYZ',
                owner: '0x456...',
                image: 'rosa_antica.png',
                attributes: {
                    era: '1500',
                    rarity: 'rare',
                    healing: 'medicinal',
                },
                createdAt: new Date().toISOString(),
            },
        ];
    }

    // Ottieni tutti gli NFT
    async getAllNFTs() {
        return this.nfts;
    }

    // Ottieni NFT per ID
    async getNFTById(id) {
        return this.nfts.find(nft => nft.id === id);
    }

    // Ottieni NFT per proprietario
    async getNFTsByOwner(owner) {
        return this.nfts.filter(nft => nft.owner === owner);
    }

    // Crea NFT
    async createNFT(nftData) {
        const newNFT = {
            id: `nft_${Date.now()}`,
            ...nftData,
            createdAt: new Date().toISOString(),
        };
        this.nfts.push(newNFT);
        return newNFT;
    }

    // Mint NFT
    async mintNFT(nftData) {
        try {
            // Simula minting
            const nft = await this.createNFT(nftData);
            return {
                success: true,
                nft: nft,
                txHash: `0x${Math.random().toString(36).substr(2, 64)}`,
                timestamp: new Date().toISOString(),
            };
        } catch (error) {
            console.error('❌ Errore minting:', error);
            return {
                success: false,
                error: error.message,
            };
        }
    }

    // Transfer NFT
    async transferNFT(nftId, newOwner) {
        try {
            const nft = this.nfts.find(n => n.id === nftId);
            if (!nft) {
                throw new Error('NFT non trovato');
            }
            nft.owner = newOwner;
            return {
                success: true,
                nft: nft,
                timestamp: new Date().toISOString(),
            };
        } catch (error) {
            console.error('❌ Errore transfer:', error);
            return {
                success: false,
                error: error.message,
            };
        }
    }

    // NFT Gallery
    async getGallery() {
        return this.nfts.map(nft => ({
            id: nft.id,
            name: nft.name,
            image: nft.image,
            price: nft.price,
            rarity: nft.attributes?.rarity || 'common',
        }));
    }

    // NFT Stats
    async getStats() {
        return {
            total: this.nfts.length,
            legendaries: this.nfts.filter(n => n.attributes?.rarity === 'legendary').length,
            rares: this.nfts.filter(n => n.attributes?.rarity === 'rare').length,
            totalValue: this.nfts.reduce((sum, n) => sum + n.price, 0),
        };
    }
}

module.exports = { NFTService };
