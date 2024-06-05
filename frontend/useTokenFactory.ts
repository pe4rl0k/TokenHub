import { useState, useEffect, useCallback } from 'react';
import Web3 from 'web3';
import { AbiItem } from 'web3-utils';
import tokenFactoryABI from './tokenFactoryABI.json';

interface Token {
  name: string;
  symbol: string;
  address: string;
}

interface ContractMethodResponse {
  status: string;
  message?: string;
  transactionHash?: string;
  receipt?: any; // Consider using a more specific type if your app will use properties from the receipt.
}

// Simple in-memory cache
const tokenCache = new Map<string, Array<Token>>();

const useTokenFactory = () => {
  const [account, setAccount] = useState<string>('');
  const [tokenFactoryContract, setTokenFactoryContract] = useState<any>(null);
  const [tokensCreatedByUser, setTokensCreatedByUser] = useState<Array<Token>>([]);
  const [creationStatus, setCreationStatus] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const initWeb3 = async () => {
      const web3 = new Web3(Web3.givenProvider || process.env.REACT_APP_INFURA_URL);
      try {
        const tokenFactory = new web3.eth.Contract(
          tokenFactoryABI as AbiItem[],
          process.env.REACT_APP_TOKEN_FACTORY_ADDRESS,
        );
        setTokenFactoryContract(tokenFactory);

        const accounts = await web3.eth.getAccounts();
        if (accounts.length > 0) setAccount(accounts[0]);
        else setError('No accounts found');
      } catch (error) {
        console.error("Error initializing Web3", error);
        setError('Failed to initialize Web3');
      }
    };
    initWeb3();
  }, []);

  const handleTransactionEvents = (transaction: Promise<ContractMethodResponse>) => {
    setLoading(true);
    setCreationStatus('Creating...');
    setError(null);

    transaction
      .then(({ status, message, transactionHash, receipt }) => {
        if (status === 'Success') {
          console.log('Transaction Hash:', transactionHash);
          setCreationStatus(status);
          // Invalidate cache after successful creation
          tokenCache.delete(account);
          fetchTokensCreatedByUser();
        } else {
          setError(message || 'Token creation failed');
          console.error(message || 'Token creation failed', { transactionHash, receipt });
        }
      })
      .catch(error => {
        console.error('Token creation error:', error);
        setError('Token creation transaction failed');
      })
      .finally(() => setLoading(false));
  };

  const createToken = (name: string, symbol: string, initialSupply: number) => {
    if (!tokenFactoryContract || !account) {
      setError('Token factory contract or account not set');
      return;
    }

    const transaction = tokenFactoryContract.methods
      .createToken(name, symbol, initialSupply)
      .send({ from: account })
      .on('transactionHash', (hash: string) => ({ status: 'Pending', transactionHash: hash }))
      .on('receipt', (receipt: any) => ({ status: 'Success', receipt }))
      .on('error', (error: any) => ({ status: 'Failed', message: 'Token creation failed', receipt: error }));

    handleTransactionEvents(transaction);
  };

  const fetchTokensCreatedByUser = useCallback(async () => {
    if (!tokenFactoryContract || !account) {
      setError('Token factory contract or account not set');
      return;
    }

    if (tokenCache.has(account)) {
      setTokensCreatedByUser(tokenCache.get(account)!);
      return;
    }

    setLoading(true);
    try {
      const tokens = await tokenFactoryContract.methods.getTokensByOwner(account).call();
      const tokenList = tokens.map((tokenAddr: string) => ({ name: "", symbol: "", address: tokenAddr }));
      tokenCache.set(account, tokenList);
      setTokensCreatedByUser(tokenList);
    } catch (error) {
      console.error('Error fetching tokens', error);
      setError('Error fetching tokens');
    } finally {
      setLoading(false);
    }
  }, [account, tokenFactoryContract]);

  useEffect(() => {
    if (account) fetchTokensCreatedByUser();
  }, [fetchTokensCreatedByUser, account]);

  return { createToken, tokensCreatedByUser, creationStatus, loading, error };
};

export default useTokenFactory;