import React, { useState, useEffect } from 'react';
import Web3 from 'web3';
import TokenFactoryABI from './TokenFactoryABI.json';

const TokenCreationForm: React.FC = () => {
  const [web3Instance, setWeb3Instance] = useState<Web3 | null>(null);
  const [userAccount, setUserAccount] = useState<string>('');
  const [tokenName, setTokenName] = useState('');
  const [tokenSymbol, setTokenSymbol] = useState('');
  const [initialSupply, setInitialSupply] = useState('');
  const [decimalCount, setDecimalCount] = useState<string>('18');
  const [deploymentStatus, setDeploymentStatus] = useState('');
  const [resultingTokenAddress, setResultingTokenAddress] = useState('');

  const initiateBlockchainConnection = async () => {
    if (window.ethereum) {
      try {
        await window.ethereum.request({ method: 'eth_requestAccounts' });
        const web3 = new Web3(window.ethereum);
        setWeb3Instance(web3);
        const accounts = await web3.eth.getAccounts();
        setUserAccount(accounts[0]);
      } catch (error) {
        setDeploymentStatus('Failed to connect to the blockchain.');
      }
    } else {
      setDeploymentStatus('Please install MetaMask to use this feature.');
    }
  };

  const createTokenOnBlockchain = async () => {
    if (!web3Instance) {
      setDeploymentStatus('Web3 instance is not initialized.');
      return;
    }

    const tokenFactoryContract = new web3Instance.eth.Contract(
      TokenFactoryABI,
      process.env.REACT_APP_TOKEN_FACTORY_ADDRESS
    );

    const tokenDecimals = parseInt(decimalCount);
    const supplyAdjustedForDecimals = web3Instance.utils.toBN(initialSupply).mul(web3Instance.utils.toBN(10).pow(web3Instance.utils.toBN(tokenDecimals)));
    
    try {
      setDeploymentStatus('Deploying token...');
      const estimatedGas = await tokenFactoryContract.methods.createToken(tokenName, tokenSymbol, supplyAdjustedForDecimals.toString()).estimateGas({ from: userAccount });
      const deploymentResponse = await tokenFactoryContract.methods
        .createToken(tokenName, tokenSymbol, supplyAdjustedForDecimals.toString())
        .send({ from: userAccount, gas: estimatedGas });
      const newTokenAddress = deploymentResponse.events.TokenCreated.returnValues.tokenAddress;
      setResultingTokenAddress(newTokenAddress);
      setDeploymentStatus(`Token deployed successfully! Contract Address: ${newTokenAddress}`);
    } catch (error) {
      setDeploymentStatus('Failed to deploy token.');
    }
  };

  useEffect(() => {
    initiateBlockchainConnection();
  }, []);

  return (
    <div>
      <h2>Create Your Token</h2>
      <div>
        <label>Name:</label>
        <input type="text" value={tokenName} onChange={e => setTokenName(e.target.value)} />
      </div>
      <div>
        <label>Symbol:</label>
        <input type="text" value={tokenSymbol} onChange={e => setTokenSymbol(e.target.value)} />
      </div>
      <div>
        <label>Supply:</label>
        <input type="text" value={initialSupply} onChange={e => setInitialSupply(e.target.value)} />
      </div>
      <div>
        <label>Decimals:</label>
        <input type="text" value={decimalCount} onChange={e => setDecimalCount(e.target.value)} />
      </div>
      <button onClick={createTokenOnBlockchain}>Deploy Token</button>
      <div>Status: {deploymentStatus}</div>
      {resultingTokenAddress && (
        <div>
          <h3>Deployment Successful</h3>
          <a href={`https://etherscan.io/address/${resultingTokenAddress}`} target="_blank" rel="noopener noreferrer">View on Etherscan</a>
        </div>
      )}
    </div>
  );
};

export default TokenCreationForm;