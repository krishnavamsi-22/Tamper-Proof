const hre = require("hardhat");
const fs = require("fs");
const path = require("path");

/**
 * DEPLOYMENT SCRIPT
 * 
 * This script:
 * 1. Compiles the smart contract
 * 2. Deploys it to the local Hardhat network
 * 3. Saves the contract address and ABI for frontend use
 * 
 * RUN WITH: npx hardhat run scripts/deploy.js --network localhost
 */
async function main() {
  console.log("🚀 Starting deployment...\n");

  // Get the deployer's wallet (first account from Hardhat)
  const [deployer] = await hre.ethers.getSigners();
  console.log("📝 Deploying contract with account:", deployer.address);
  console.log("💰 Account balance:", (await hre.ethers.provider.getBalance(deployer.address)).toString(), "wei\n");

  // Get the contract factory
  const EducationSystem = await hre.ethers.getContractFactory("EducationSystem");
  
  // Deploy the contract
  console.log("⏳ Deploying EducationSystem contract...");
  const educationSystem = await EducationSystem.deploy();
  
  // Wait for deployment to complete
  await educationSystem.waitForDeployment();
  
  const contractAddress = await educationSystem.getAddress();
  console.log("✅ EducationSystem deployed to:", contractAddress);
  console.log("👤 Admin address:", deployer.address, "\n");

  // Save contract address and ABI to a JSON file
  const contractData = {
    address: contractAddress,
    adminAddress: deployer.address,
    chainId: 31337,
    network: "localhost",
    deployedAt: new Date().toISOString()
  };

  // Create artifacts directory if it doesn't exist
  const artifactsDir = path.join(__dirname, "..", "artifacts");
  const contractArtifact = path.join(artifactsDir, "contracts", "EducationSystem.sol", "EducationSystem.json");
  
  // Read the ABI from compiled artifacts
  const artifact = JSON.parse(fs.readFileSync(contractArtifact, "utf8"));
  contractData.abi = artifact.abi;

  // Save to a file that frontend can import
  const deploymentPath = path.join(__dirname, "..", "deployment.json");
  fs.writeFileSync(deploymentPath, JSON.stringify(contractData, null, 2));
  
  console.log("📄 Contract data saved to:", deploymentPath);
  console.log("\n✨ Deployment complete!\n");
  
  console.log("📋 Next steps:");
  console.log("1. Copy the contract address above");
  console.log("2. Use it in your frontend to connect to the contract");
  console.log("3. Make sure MetaMask is connected to localhost:8545");
  console.log("4. Import the admin account to MetaMask using the private key from Hardhat\n");
}

// Execute deployment
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Deployment failed:", error);
    process.exit(1);
  });
