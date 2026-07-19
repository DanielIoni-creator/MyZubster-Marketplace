// services/nftService.js
const { ThirdwebSDK } = require('@thirdweb-dev/sdk');
const ethers = require('ethers');
const dotenv = require('dotenv');
dotenv.config();

// Configurazione
const NETWORK = process.env.NFT_NETWORK || 'polygon';
const CONTRACT_ADDRESS = process.env.NFT_CONTRACT_ADDRESS;
const ADMIN_PRIVATE_KEY = process.env.NFT_ADMIN_PRIVATE_KEY;

// Inizializza SDK
const getSDK = () => {
  if (!ADMIN_PRIVATE_KEY) {
    throw new Error('NFT_ADMIN_PRIVATE_KEY non configurato');
  }
  const provider = new ethers.providers.JsonRpcProvider(
    process.env.NFT_RPC_URL || 'https://polygon-rpc.com'
  );
  const wallet = new ethers.Wallet(ADMIN_PRIVATE_KEY, provider);
  return new ThirdwebSDK(wallet);
};

// Mint NFT per una competenza completata
const mintSkillNFT = async (userId, skillName, metadata) => {
  try {
    const sdk = getSDK();
    const contract = await sdk.getContract(CONTRACT_ADDRESS);

    // Crea metadati NFT
    const nftMetadata = {
      name: `MyZubster Skill: ${skillName}`,
      description: `Certificato di competenza verificata su MyZubster`,
      image: metadata.image || 'https://myzubster.com/images/skill-default.png',
      attributes: [
        { trait_type: 'User ID', value: userId },
        { trait_type: 'Skill', value: skillName },
        { trait_type: 'Platform', value: 'MyZubster' },
        { trait_type: 'Verified', value: true }
      ]
    };

    // Mint NFT
    const { id } = await contract.erc1155.mint({
      metadata: nftMetadata,
      to: metadata.walletAddress,
      supply: 1
    });

    console.log(`✅ NFT mintato con ID: ${id}`);
    return {
      success: true,
      tokenId: id,
      metadata: nftMetadata
    };
  } catch (error) {
    console.error('❌ Errore mint NFT:', error.message);
    return { success: false, error: error.message };
  }
};

// Verifica se un utente possiede un NFT
const verifyNFTOwnership = async (walletAddress, tokenId) => {
  try {
    const sdk = getSDK();
    const contract = await sdk.getContract(CONTRACT_ADDRESS);
    const balance = await contract.erc1155.balanceOf(walletAddress, tokenId);
    return balance > 0;
  } catch (error) {
    console.error('❌ Errore verifica NFT:', error.message);
    return false;
  }
};

// Ottieni gli NFT di un utente
const getUserNFTs = async (walletAddress) => {
  try {
    const sdk = getSDK();
    const contract = await sdk.getContract(CONTRACT_ADDRESS);
    const nfts = await contract.erc1155.getOwned(walletAddress);
    return nfts;
  } catch (error) {
    console.error('❌ Errore recupero NFT:', error.message);
    return [];
  }
};

module.exports = {
  mintSkillNFT,
  verifyNFTOwnership,
  getUserNFTs
};