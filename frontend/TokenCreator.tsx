import React, { useState, useEffect } from 'react';
import Web3 from 'web3';
import TokenFactoryABI from './TokenFactoryABI.json';

const TokenCreationForm: React.FC = () => {
  const [web3, setWeb3] = useState<Web3 | null>(null);
  const [account, setAccount] = useState<string>('');
  const [tokenName, setTokenName] = useState('');
  const [tokenSymbol, setTokenSymbol] = useState('');
  const [tokenSupply, setTokenSupply] = useState('');
  const [tokenDecimals, setTokenDecimals] = useState<string>('18');
  const [transactionStatus, setTransactionStatus] = useState('');
  const [deployedTokenAddress, setDeployedTokenAddress] = useState('');

  const connectToBlockchain = async () => {
    if (window.ethereum) {
      try {
        await window.ethereum.request({ method: 'eth_requestAccounts' });
        const localWeb3 = new Web3(window.ethereum);
        setWeb3(localWeb3);
        const accounts = await localWeb3.eth.getAccounts();
        setAccount(accounts[0]);
      } catch (error) {
        setTransactionStatus('Failed to connect to blockchain.');
      }
    } else {
      setTransactionStatus('Please install MetaMask to use this feature.');
    }
  };

  const deployToken = async () => {
    if (!web3) {
      setTransactionStatus('Web3 is not initialized.');
      return;
    }

    const tokenFactory = new web3.eth.Contract(
      TokenFactoryABI,
      process.env.REACT_APP_TOKEN_FACTORY_ADDRESS
    );

    const decimals = parseInt(tokenDecimals);
    const supplyWithDecimals = web3.utils.toBN(tokenSupply).mul(web3.utils.toBN(10).pow(web3.utils.toBN(decimals)));
    try {
      setTransactionStatus('Deploying token...');
      const gas = await tokenFactory.methods.createToken(tokenName, tokenSymbol, supplyWithDecimals.toString()).estimateGas({ from: account });
      const response = await tokenFactory.methods
        .createToken(tokenName, tokenSymbol, supplyWithDecimals.toString())
        .send({ from: account, gas });
      const tokenAddress = response.events.TokenCreated.returnValues.tokenAddress;
      setDeployedTokenAddress(tokenAddress);
      setTransactionStatus(`Token deployed successfully! Contract Address: ${tokenAddress}`);
    } catch (error) {
      setTransactionStatus('Failed to deploy token.');
    }
  };

  useEffect(() => {
    connectToBlockchain();
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
        <input type="text" value={tokenSupply} onChange={e => setTokenSupply(e.target.value)} />
      </div>
      <div>
        <label>Decimals:</label>
        <input type="text" value={tokenDecimals} onChange={e => setTokenDecimals(e.target.value)} />
      </div>
      <button onClick={deployToken}>Deploy Token</button>
      <div>Status: {transactionStatus}</div>
      {deployedTokenAddress && (
        <div>
          <h3>Deployment Successful</h3>
          <a href={`https://etherscan.io/address/${deployedTokenAddress}`} target="_blank" rel="noopener noreferrer">View on Etherscan</a>
        </div>
      )}
    </div>
  );
};

export default TokenCreationForm;