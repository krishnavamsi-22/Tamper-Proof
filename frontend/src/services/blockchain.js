import { BrowserProvider, Contract } from 'ethers';

const CONTRACT_ADDRESS = '0x5FbDB2315678afecb367f032d93F642f64180aa3';
const CONTRACT_ABI = [
  "function registerTeacher(address teacherAddress) external",
  "function storeMarksHash(string memory studentId, string memory courseId, string memory hash) external",
  "function storeCertificateHash(string memory studentId, string memory courseId, string memory hash) external",
  "function verifyMarksHash(string memory studentId, string memory courseId, string memory hash) external view returns (bool)",
  "function verifyCertificateHash(string memory studentId, string memory courseId, string memory hash) external view returns (bool)",
  "function getMarksHash(string memory studentId, string memory courseId) external view returns (string memory)",
  "function getCertificateHash(string memory studentId, string memory courseId) external view returns (string memory)",
  "function getMarksRecord(string memory studentId, string memory courseId) external view returns (string memory hash, address approvedBy, uint256 timestamp)",
  "function getCertificateRecord(string memory studentId, string memory courseId) external view returns (string memory hash, address issuedBy, uint256 timestamp)",
  "function isTeacher(address account) external view returns (bool)",
  "function admin() external view returns (address)",
  "event TeacherRegistered(address indexed teacherAddress, uint256 timestamp)",
  "event MarksStored(string indexed studentId, string indexed courseId, string hash, address indexed approvedBy, uint256 timestamp)",
  "event CertificateStored(string indexed studentId, string indexed courseId, string hash, address indexed issuedBy, uint256 timestamp)"
];

let provider = null;
let signer = null;
let contract = null;

export async function connectWallet() {
  if (!window.ethereum) throw new Error('MetaMask not installed');
  
  try {
    // Request account access
    const accounts = await window.ethereum.request({ 
      method: 'eth_requestAccounts' 
    });
    
    // Check if on correct network
    const chainId = await window.ethereum.request({ method: 'eth_chainId' });
    const hardhatChainId = '0x7a69'; // 31337 in hex
    
    if (chainId !== hardhatChainId) {
      try {
        // Try to switch to Hardhat network
        await window.ethereum.request({
          method: 'wallet_switchEthereumChain',
          params: [{ chainId: hardhatChainId }],
        });
      } catch (switchError) {
        // Network doesn't exist, add it
        if (switchError.code === 4902) {
          await window.ethereum.request({
            method: 'wallet_addEthereumChain',
            params: [{
              chainId: hardhatChainId,
              chainName: 'Hardhat Local',
              rpcUrls: ['http://127.0.0.1:8545'],
              nativeCurrency: {
                name: 'ETH',
                symbol: 'ETH',
                decimals: 18
              }
            }],
          });
        } else {
          throw switchError;
        }
      }
    }
    
    provider = new BrowserProvider(window.ethereum);
    signer = await provider.getSigner();
    contract = new Contract(CONTRACT_ADDRESS, CONTRACT_ABI, signer);
    
    const address = await signer.getAddress();
    return address;
  } catch (error) {
    if (error.code === 4001) {
      throw new Error('User rejected the connection request');
    }
    throw error;
  }
}

export async function getConnectedAddress() {
  if (!signer) return null;
  return await signer.getAddress();
}

export async function registerTeacher(teacherAddress) {
  if (!contract) throw new Error('Connect wallet first');
  const tx = await contract.registerTeacher(teacherAddress);
  await tx.wait();
  return tx.hash;
}

export async function storeMarksHash(studentId, courseId, hash) {
  if (!contract) throw new Error('Connect wallet first');
  const tx = await contract.storeMarksHash(studentId, courseId, hash);
  await tx.wait();
  return tx.hash;
}

export async function storeCertificateHash(studentId, courseId, hash) {
  if (!contract) throw new Error('Connect wallet first');
  const tx = await contract.storeCertificateHash(studentId, courseId, hash);
  await tx.wait();
  return tx.hash;
}

export async function verifyMarksHash(studentId, courseId, hash) {
  if (!provider) provider = new BrowserProvider(window.ethereum);
  const readContract = new Contract(CONTRACT_ADDRESS, CONTRACT_ABI, provider);
  return await readContract.verifyMarksHash(studentId, courseId, hash);
}

export async function verifyCertificateHash(studentId, courseId, hash) {
  if (!provider) provider = new BrowserProvider(window.ethereum);
  const readContract = new Contract(CONTRACT_ADDRESS, CONTRACT_ABI, provider);
  return await readContract.verifyCertificateHash(studentId, courseId, hash);
}

export async function getMarksRecord(studentId, courseId) {
  if (!provider) provider = new BrowserProvider(window.ethereum);
  const readContract = new Contract(CONTRACT_ADDRESS, CONTRACT_ABI, provider);
  const [hash, approvedBy, timestamp] = await readContract.getMarksRecord(studentId, courseId);
  return { hash, approvedBy, timestamp: Number(timestamp) };
}

export async function getCertificateRecord(studentId, courseId) {
  if (!provider) provider = new BrowserProvider(window.ethereum);
  const readContract = new Contract(CONTRACT_ADDRESS, CONTRACT_ABI, provider);
  const [hash, issuedBy, timestamp] = await readContract.getCertificateRecord(studentId, courseId);
  return { hash, issuedBy, timestamp: Number(timestamp) };
}

export function calculateHash(data) {
  const encoder = new TextEncoder();
  const dataBuffer = encoder.encode(data);
  return crypto.subtle.digest('SHA-256', dataBuffer).then(hashBuffer => {
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  });
}

export { CONTRACT_ADDRESS };
