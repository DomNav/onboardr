import { execSync } from 'child_process';
import { writeFileSync, readFileSync } from 'fs';
import { join } from 'path';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

interface DeploymentConfig {
  contractName: string;
  contractPath: string;
  networkUrl: string;
  networkPassphrase: string;
  deployerSecretKey?: string;
}

interface DeploymentResult {
  contractId: string;
  transactionHash: string;
  wasmHash: string;
  deploymentTime: string;
}

class SorobanDeployer {
  private config: DeploymentConfig;

  constructor(config: DeploymentConfig) {
    this.config = config;
  }

  /**
   * Build the Soroban contract
   */
  async buildContract(): Promise<string> {
    console.log(`📦 Building contract: ${this.config.contractName}`);
    
    try {
      const buildCommand = `cd ${this.config.contractPath} && cargo build --target wasm32-unknown-unknown --release`;
      execSync(buildCommand, { stdio: 'inherit' });
      
      const wasmPath = join(this.config.contractPath, 'target/wasm32-unknown-unknown/release', `${this.config.contractName}.wasm`);
      console.log(`✅ Contract built successfully: ${wasmPath}`);
      
      return wasmPath;
    } catch (error) {
      console.error('❌ Build failed:', error);
      throw error;
    }
  }

  /**
   * Deploy contract to Stellar testnet
   */
  async deployContract(): Promise<DeploymentResult> {
    console.log(`🚀 Deploying contract to testnet: ${this.config.networkUrl}`);
    
    // Build the contract first
    const wasmPath = await this.buildContract();
    
    try {
      // Install WASM
      console.log('📤 Installing WASM...');
      const installCommand = `soroban contract install --wasm ${wasmPath} --network testnet --source ${this.config.deployerSecretKey}`;
      const wasmHash = execSync(installCommand, { encoding: 'utf8' }).trim();
      console.log(`✅ WASM installed with hash: ${wasmHash}`);
      
      // Deploy contract
      console.log('🎯 Deploying contract instance...');
      const deployCommand = `soroban contract deploy --wasm-hash ${wasmHash} --network testnet --source ${this.config.deployerSecretKey}`;
      const contractId = execSync(deployCommand, { encoding: 'utf8' }).trim();
      console.log(`✅ Contract deployed with ID: ${contractId}`);
      
      // Initialize contract (if needed)
      if (this.config.contractName === 'swap_router') {
        await this.initializeSwapRouter(contractId);
      }
      
      const deploymentResult: DeploymentResult = {
        contractId,
        transactionHash: 'N/A', // Soroban CLI doesn't return tx hash directly
        wasmHash,
        deploymentTime: new Date().toISOString(),
      };
      
      // Save deployment info
      await this.saveDeploymentInfo(deploymentResult);
      
      return deploymentResult;
      
    } catch (error) {
      console.error('❌ Deployment failed:', error);
      throw error;
    }
  }

  /**
   * Initialize the SwapRouter contract
   */
  private async initializeSwapRouter(contractId: string): Promise<void> {
    console.log('🔧 Initializing SwapRouter contract...');
    
    try {
      // Get deployer's public key from secret key
      const getKeyCommand = `soroban keys address ${this.config.deployerSecretKey}`;
      const adminAddress = execSync(getKeyCommand, { encoding: 'utf8' }).trim();
      
      const initCommand = `soroban contract invoke --id ${contractId} --network testnet --source ${this.config.deployerSecretKey} -- initialize --admin ${adminAddress}`;
      execSync(initCommand, { stdio: 'inherit' });
      
      console.log('✅ SwapRouter initialized successfully');
    } catch (error) {
      console.error('❌ Initialization failed:', error);
      throw error;
    }
  }

  /**
   * Save deployment information to file
   */
  private async saveDeploymentInfo(result: DeploymentResult): Promise<void> {
    const deploymentInfo = {
      contract: this.config.contractName,
      network: 'testnet',
      ...result,
      explorerUrl: `https://testnet.stellarchain.io/contracts/${result.contractId}`,
    };
    
    const outputPath = join(__dirname, '..', 'contracts', 'deployments.json');
    
    // Read existing deployments or create new array
    let deployments: any[] = [];
    try {
      const existing = readFileSync(outputPath, 'utf8');
      deployments = JSON.parse(existing);
    } catch (error) {
      // File doesn't exist or is invalid, start fresh
    }
    
    // Add new deployment
    deployments.push(deploymentInfo);
    
    // Write updated deployments
    writeFileSync(outputPath, JSON.stringify(deployments, null, 2));
    console.log(`📄 Deployment info saved to: ${outputPath}`);
  }

  /**
   * Verify contract deployment
   */
  async verifyDeployment(contractId: string): Promise<boolean> {
    console.log('🔍 Verifying contract deployment...');
    
    try {
      const verifyCommand = `soroban contract invoke --id ${contractId} --network testnet --source ${this.config.deployerSecretKey} -- get_all_pools`;
      execSync(verifyCommand, { stdio: 'inherit' });
      
      console.log('✅ Contract verification successful');
      return true;
    } catch (error) {
      console.error('❌ Contract verification failed:', error);
      return false;
    }
  }
}

/**
 * Main deployment script
 */
async function main() {
  console.log('🌟 Onboardr Contract Deployment Script');
  console.log('=====================================');
  
  // Check required environment variables
  const deployerKey = process.env.STELLAR_DEPLOYER_SECRET_KEY;
  if (!deployerKey) {
    console.error('❌ STELLAR_DEPLOYER_SECRET_KEY environment variable is required');
    console.error('   Generate a testnet account at: https://laboratory.stellar.org/#account-creator');
    process.exit(1);
  }
  
  const config: DeploymentConfig = {
    contractName: 'swap_router',
    contractPath: join(__dirname, '..', '..', '..', 'contracts', 'swap_router'),
    networkUrl: 'https://soroban-testnet.stellar.org',
    networkPassphrase: 'Test SDF Network ; September 2015',
    deployerSecretKey: deployerKey,
  };
  
  const deployer = new SorobanDeployer(config);
  
  try {
    // Deploy the contract
    const result = await deployer.deployContract();
    
    console.log('\n🎉 Deployment Successful!');
    console.log('========================');
    console.log(`Contract ID: ${result.contractId}`);
    console.log(`WASM Hash: ${result.wasmHash}`);
    console.log(`Deployed at: ${result.deploymentTime}`);
    console.log(`Explorer: https://testnet.stellarchain.io/contracts/${result.contractId}`);
    
    // Verify deployment
    const isVerified = await deployer.verifyDeployment(result.contractId);
    if (isVerified) {
      console.log('\n✅ Contract is ready for use!');
      console.log('\nNext steps:');
      console.log('1. Update your frontend to use this contract ID');
      console.log('2. Add some test pools using add_pool function');
      console.log('3. Test swaps through your application');
    }
    
  } catch (error) {
    console.error('\n💥 Deployment failed:', error);
    process.exit(1);
  }
}

// Run the script if called directly
if (require.main === module) {
  main().catch(console.error);
}

export { SorobanDeployer, DeploymentConfig, DeploymentResult };