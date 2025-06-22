// Crypto Wallet Configuration
// Update YOUR_INFURA_KEY with your actual Infura API key from https://infura.io

export const CONFIG = {
  // Ethereum Configuration
  ethereum: {
    rpcUrl: 'https://mainnet.infura.io/v3/YOUR_INFURA_KEY',
    chainId: 1,
    explorerUrl: 'https://etherscan.io',
  },

  // Bitcoin Configuration
  bitcoin: {
    rpcUrl: 'https://blockstream.info/api',
    network: 'mainnet',
    explorerUrl: 'https://blockstream.info',
  },

  // Solana Configuration
  solana: {
    rpcUrl: 'https://api.mainnet-beta.solana.com',
    chainId: 101,
    explorerUrl: 'https://explorer.solana.com',
  },

  // Exchange Rate API (Optional)
  exchange: {
    apiKey: 'your_api_key_here',
    baseUrl: 'https://api.coingecko.com/api/v3',
  },

  // Firebase Configuration (Optional)
  firebase: {
    apiKey: 'your_firebase_api_key',
    authDomain: 'your_project.firebaseapp.com',
    projectId: 'your_project_id',
    storageBucket: 'your_project.appspot.com',
    messagingSenderId: 'your_sender_id',
    appId: 'your_app_id',
  },

  // App Configuration
  app: {
    environment: 'development',
    debugMode: true,
    enableAnalytics: false,
  },
}; 