import React, { useState } from 'react';
import Web3 from 'web3';
import TokenFactoryABI from './TokenFactoryABI.json';

const TokenCreationForm: React.FC = () => {
  const [web3, setWeb3] = useState<Web3 | null>(null);
  const [account, setAccount] = useState<string>('');
  const [tokenName, setTokenName] = useState('');
  const [tokenSymbol, setTokenSymbol] = useState('');
  const [tokenSupply, setTokenSupply] = useState('');
  const [transactionStatus, setTransactionStatus] = useState('');

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
    if(!web3) {
      setTransactionStatus('Web3 is not initialized.');
      return;
    }

    const tokenFactory = new web3.eth.Contract(
      TokenFactoryABI,
      process.env.REACT_APP_TOKEN_FACTORY_ADDRESS
    );

    try {
      setTransactionStatus('Deploying token...');
      const gas = await tokenFactory.methods.createToken(tokenName, tokenSymbol, Web3.utils.toWei(tokenSupply, 'ether')).estimateGas({ from: account });
      const response = await tokenFactory.methods
        .createToken(tokenName, tokenSymbol, Web3.utils.toWei(tokenSupply, 'ether'))
        .send({ from: account, gas });
      setTransactionStatus(`Token deployed successfully! Contract Address: ${response.events.TokenCreated.returnValues.tokenAddress}`);
    } catch (error) {
      setTransactionStatus('Failed to deploy token.');
    }
  };

  React.useEffect(() => {
    connectToBlockchain();
  }, []);

  return (
    <div>
      <h2>Create Your Token</h2>
      <div>
        <label>Name:</label>
        <input type="text" value={tokenName} onChange={e => setTokenName(e.target.value)}/>
      </div>
      <div>
        <label>Symbol:</label>
        <input type="text" value={tokenSymbol} onChange={e => setTokenSymbol(e.target.value)}/>
      </div>
      <div>
        <label>Supply:</label>
        <input type="text" value={tokenSupply} onChange={e => setTokenSupply(e.target.value)}/>
      </div>
      <button onClick={deployToken}>Deploy Token</button>
      <div>Status: {transactionStatus}</div>
    </div>
  );
};

export default TokenCreationForm;