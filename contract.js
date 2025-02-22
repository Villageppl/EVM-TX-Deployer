const { ethers } = require("ethers");
const fs = require("fs");
const readline = require("readline");

// Load private key
const PRIVATE_KEY = fs.readFileSync("privateKey.txt", "utf8").trim();

// Load network details from config.json
const config = JSON.parse(fs.readFileSync("config.json", "utf8"));
const RPC_URL = config.rpcUrl;
const CHAIN_ID = parseInt(config.chainId); // Convert to number
const GAS_LIMIT = config.gasLimit;

// Initialize provider and wallet
const provider = new ethers.JsonRpcProvider(RPC_URL, { chainId: CHAIN_ID, name: "custom-network" });
const wallet = new ethers.Wallet(PRIVATE_KEY, provider);

// ERC-20 Smart Contract Template
const ERC20_CONTRACT = `
pragma solidity ^0.8.0;
contract CustomToken {
    string public name;
    string public symbol;
    uint8 public decimals = 18;
    uint256 public totalSupply;
    mapping(address => uint256) public balanceOf;
    mapping(address => mapping(address => uint256)) public allowance;
    
    event Transfer(address indexed from, address indexed to, uint256 value);
    event Approval(address indexed owner, address indexed spender, uint256 value);

    constructor(string memory _name, string memory _symbol, uint256 _totalSupply) {
        name = _name;
        symbol = _symbol;
        totalSupply = _totalSupply * 10**18; // Convert to 18 decimals
        balanceOf[msg.sender] = totalSupply;
        emit Transfer(address(0), msg.sender, totalSupply);
    }

    function transfer(address _to, uint256 _value) public returns (bool success) {
        require(balanceOf[msg.sender] >= _value, "Insufficient balance");
        balanceOf[msg.sender] -= _value;
        balanceOf[_to] += _value;
        emit Transfer(msg.sender, _to, _value);
        return true;
    }
}
`;

// Function to deploy contract
async function deployContract(tokenName, tokenSymbol, totalSupply) {
    console.log("\n⏳ Compiling and deploying contract...");

    const factory = new ethers.ContractFactory(
        new ethers.Interface([
            "constructor(string memory _name, string memory _symbol, uint256 _totalSupply)",
            "function transfer(address _to, uint256 _value) public returns (bool success)"
        ]),
        await wallet.signTransaction({
            data: ethers.hexlify(ethers.toUtf8Bytes(ERC20_CONTRACT)),
            gasLimit: GAS_LIMIT
        }),
        wallet
    );

    try {
        const contract = await factory.deploy(tokenName, tokenSymbol, totalSupply);
        await contract.deploymentTransaction().wait();
        console.log(`✅ Contract deployed at: ${contract.target}`);
    } catch (error) {
        console.error("❌ Deployment failed:", error);
    }
}

// Ask user for token details
const rl = readline.createInterface({ input: process.stdin, output: process.stdout });

rl.question("Enter Token Name: ", (tokenName) => {
    rl.question("Enter Token Symbol: ", (tokenSymbol) => {
        rl.question("Enter Total Supply (without decimals): ", async (totalSupply) => {
            rl.close();
            await deployContract(tokenName, tokenSymbol, totalSupply);
        });
    });
});
