const { ethers } = require("ethers");
const fs = require("fs");
const readline = require("readline");

// Load private key from file
const PRIVATE_KEY_PATH = "privateKey.txt";
if (!fs.existsSync(PRIVATE_KEY_PATH)) {
    console.error(`❌ ERROR: ${PRIVATE_KEY_PATH} not found. Create it and add your private key.`);
    process.exit(1);
}
const PRIVATE_KEY = fs.readFileSync(PRIVATE_KEY_PATH, "utf8").trim();

// Load config file
const CONFIG_PATH = "config.json";
if (!fs.existsSync(CONFIG_PATH)) {
    console.error(`❌ ERROR: ${CONFIG_PATH} not found. Create it and add network details.`);
    process.exit(1);
}
const config = JSON.parse(fs.readFileSync(CONFIG_PATH, "utf8"));
const RPC_URL = config.rpcUrl || "https://default.rpc"; // Fallback RPC
const CHAIN_ID = parseInt(config.chainId) || 1; // Default to Ethereum Mainnet
const GAS_LIMIT = config.gasLimit || 21000; // Default gas limit
const TOKEN_SYMBOL = config.tokenSymbol || "ETH"; // Default token symbol
const TX_COUNT = config.txPerWallet || 1; // Default: 1 transaction per wallet

// Initialize provider with network details
const provider = new ethers.JsonRpcProvider(RPC_URL, { chainId: CHAIN_ID, name: "custom-network" });

// Initialize wallet
let wallet;
try {
    wallet = new ethers.Wallet(PRIVATE_KEY, provider);
} catch (error) {
    console.error("❌ ERROR: Invalid private key.", error.message);
    process.exit(1);
}

// Read recipient addresses from wallets.txt
const RECIPIENTS_PATH = "wallets.txt";
if (!fs.existsSync(RECIPIENTS_PATH)) {
    console.error(`❌ ERROR: ${RECIPIENTS_PATH} not found. Create it and add recipient addresses.`);
    process.exit(1);
}
const recipients = fs
    .readFileSync(RECIPIENTS_PATH, "utf8")
    .split("\n")
    .map(addr => addr.trim())
    .filter(addr => addr && ethers.isAddress(addr));

// Function to get dynamic gas fees
async function getGasFees() {
    try {
        const feeData = await provider.getFeeData();
        return {
            maxFeePerGas: feeData.maxFeePerGas ? ethers.toBigInt(feeData.maxFeePerGas) * 2n : undefined, // Double max fee
            maxPriorityFeePerGas: feeData.maxPriorityFeePerGas ? ethers.toBigInt(feeData.maxPriorityFeePerGas) : undefined
        };
    } catch (error) {
        console.error("❌ ERROR: Failed to fetch gas fees.", error.message);
        return { maxFeePerGas: undefined, maxPriorityFeePerGas: undefined };
    }
}

// Function to send multiple transactions per wallet
async function sendBatchTransactions(amount) {
    const { maxFeePerGas, maxPriorityFeePerGas } = await getGasFees();

    for (let recipient of recipients) {
        console.log(`\n🔄 Sending ${TX_COUNT} transactions to ${recipient}...`);
        
        for (let i = 1; i <= TX_COUNT; i++) {
            try {
                const tx = await wallet.sendTransaction({
                    to: recipient,
                    value: ethers.parseEther(amount),
                    gasLimit: GAS_LIMIT,
                    maxFeePerGas,
                    maxPriorityFeePerGas
                });
                console.log(`✅ Tx ${i}/${TX_COUNT}: Sent ${amount} ${TOKEN_SYMBOL} to ${recipient} | TX Hash: ${tx.hash}`);
                await tx.wait();

                // Optional: Delay between transactions to avoid RPC rate limits
                await new Promise(resolve => setTimeout(resolve, 2000)); // 2 sec delay
            } catch (error) {
                console.error(`❌ Tx ${i}/${TX_COUNT} Failed:`, error.message);
                break; // Stop further transactions if one fails
            }
        }
    }
}

// Ask user for the amount to send
const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

rl.question(`Enter amount to send per transaction (${TOKEN_SYMBOL}): `, async (amount) => {
    rl.close();
    await sendBatchTransactions(amount);
});
