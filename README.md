Here's the entire README in one block for easy copy-pasting:

# EVM-TX-Deployer

A simple EVM transaction deployer script using ethers.js.

## 📌 Requirements
- Node.js (Latest version)  
- npm (Comes with Node.js)  
- Git  

## 🔧 Installation
1. **Clone the repository**  
   ```sh
   git clone https://github.com/Villageppl/EVM-TX-Deployer.git
   cd EVM-TX-Deployer

2. Install dependencies

npm install


3. Configure your settings in config.json
Open config.json and replace the placeholders with your actual values:

{
    "rpcUrl": "YOUR_RPC_URL_HERE",
    "chainId": "YOUR_CHAIN_ID_HERE",
    "gasLimit": 5000000,
    "tokenSymbol": "YOUR_TOKEN_SYMBOL_HERE",
    "txPerWallet": 20
}


4. Add your private key

Save your private key inside privateKey.txt.

Fill in the wallets you want to transfer to in the wallets.txt file....one per line



🚀 Usage

To send transactions, run:

node Transfer.js

To deploy a contract, run:

node contract.js



❗️ Important Notes

Never share your privateKey.txt file or expose your private key publicly.

Make sure to update the rpcUrl, chainId, and tokenSymbol fields in config.json with your own values.



