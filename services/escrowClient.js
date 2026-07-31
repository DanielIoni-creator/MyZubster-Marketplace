// services/escrowClient.js
// Communicates with MyZubsterGateway for escrow operations: create, release, dispute, refund

const axios = require('axios');

const GATEWAY_URL = process.env.GATEWAY_URL || 'http://localhost:3001';
const GATEWAY_TIMEOUT = parseInt(process.env.GATEWAY_TIMEOUT || '10000', 10);

const escrowClient = {
  /**
   * Create an escrow transaction between buyer and seller.
   * @param {Object} params
   * @param {number} params.orderId - Marketplace order ID
   * @param {number} params.buyerId - Buyer user ID
   * @param {number} params.sellerId - Seller user ID
   * @param {number} params.amount - Amount to escrow
   * @param {string} [params.currency='USD'] - Currency
   * @returns {Promise<{escrowId: string, status: string, txHash: string|null}>}
   */
  async createEscrow({ orderId, buyerId, sellerId, amount, currency = 'USD' }) {
    if (!orderId || !buyerId || !sellerId || !amount) {
      throw new Error('Missing required parameters: orderId, buyerId, sellerId, amount');
    }
    if (amount <= 0) {
      throw new Error('Amount must be positive');
    }

    const response = await axios.post(`${GATEWAY_URL}/api/escrow`, {
      orderId,
      buyerId,
      sellerId,
      amount,
      currency,
    }, {
      timeout: GATEWAY_TIMEOUT,
      headers: { 'Content-Type': 'application/json' },
    });

    if (!response.data || !response.data.escrowId) {
      throw new Error('Gateway did not return an escrowId');
    }

    return {
      escrowId: response.data.escrowId,
      status: response.data.status || 'pending',
      txHash: response.data.txHash || null,
    };
  },

  /**
   * Release escrow funds to the seller.
   * @param {string} escrowId
   * @returns {Promise<{status: string, txHash: string|null}>}
   */
  async releaseEscrow(escrowId) {
    if (!escrowId) throw new Error('escrowId is required');

    const response = await axios.post(`${GATEWAY_URL}/api/escrow/${escrowId}/release`, {}, {
      timeout: GATEWAY_TIMEOUT,
      headers: { 'Content-Type': 'application/json' },
    });

    return {
      status: response.data.status || 'released',
      txHash: response.data.txHash || null,
    };
  },

  /**
   * Dispute an escrow (buyer requests refund, seller contests).
   * @param {string} escrowId
   * @param {string} reason
   * @returns {Promise<{status: string}>}
   */
  async disputeEscrow(escrowId, reason) {
    if (!escrowId) throw new Error('escrowId is required');

    const response = await axios.post(`${GATEWAY_URL}/api/escrow/${escrowId}/dispute`, {
      reason: reason || 'No reason provided',
    }, {
      timeout: GATEWAY_TIMEOUT,
      headers: { 'Content-Type': 'application/json' },
    });

    return {
      status: response.data.status || 'disputed',
    };
  },

  /**
   * Get escrow status from the gateway.
   * @param {string} escrowId
   * @returns {Promise<{escrowId: string, status: string, amount: number, confirmations: number}>}
   */
  async getEscrowStatus(escrowId) {
    if (!escrowId) throw new Error('escrowId is required');

    const response = await axios.get(`${GATEWAY_URL}/api/escrow/${escrowId}`, {
      timeout: GATEWAY_TIMEOUT,
    });

    return {
      escrowId: response.data.escrowId,
      status: response.data.status || 'unknown',
      amount: response.data.amount || 0,
      confirmations: response.data.confirmations || 0,
    };
  },

  /**
   * Refund escrow back to buyer.
   * @param {string} escrowId
   * @param {string} reason
   * @returns {Promise<{status: string, txHash: string|null}>}
   */
  async refundEscrow(escrowId, reason) {
    if (!escrowId) throw new Error('escrowId is required');

    const response = await axios.post(`${GATEWAY_URL}/api/escrow/${escrowId}/refund`, {
      reason: reason || 'Seller cancelled',
    }, {
      timeout: GATEWAY_TIMEOUT,
      headers: { 'Content-Type': 'application/json' },
    });

    return {
      status: response.data.status || 'refunded',
      txHash: response.data.txHash || null,
    };
  },

  /**
   * Check if the gateway is reachable.
   * @returns {Promise<boolean>}
   */
  async healthCheck() {
    try {
      const response = await axios.get(`${GATEWAY_URL}/api/health`, {
        timeout: 5000,
      });
      return response.status === 200;
    } catch {
      return false;
    }
  },
};

module.exports = escrowClient;
