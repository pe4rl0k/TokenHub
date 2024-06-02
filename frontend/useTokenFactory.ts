import { useState, useEffect, useCallback } from 'react';
import Web3 from 'web3';
import { AbiItem } from 'web3-utils';
import tokenFactoryABI from './tokenFactoryABI.json';

interface Token {
  name: string;
  symbol: string;
  address: string;
}

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
      const tokenFactory = new web3.eth.Contract(
        tokenFactoryABI as AbiItem[],
        process.env.REACT_APP_TOKEN_FACTORY_ADDRESS
      );
      setTokenFactoryContract(tokenFactory);
      try {
        const accounts = await web3.eth.getAccounts();
        setAccount(accounts[0]);
      } catch (e) {
        console.error("Error fetching accounts", e);
        setError('Failed to load user accounts');
      }
    };
    initWeb3();
  }, []);

  const createToken = async (name: string, symbol: string, initialSupply: number) => {
    if (!tokenFactoryContract || !account) return;

    setLoading(true);
    setCreationStatus('Creating...');
    setError(null);

    try {
      await tokenFactoryContract.methods
        .createToken(name, symbol, initialSupply)
        .send({ from: account })
        .on('transactionHash', (hash: string) => {
          console.log('Transaction Hash:', hash);
        })
        .on('receipt', (receipt: any) => {
          setCreationStatus('Success');
          setLoading(false);
          fetchTokensCreatedByUser();
        })
        .on('error', (error: any) => {
          setCreationStatus('Failed');
          setLoading(false);
          setError('Token creation failed');
          console.error('Token creation error:', error);
        });
    } catch (error) {
      setLoading(false);
      setError('Token creation transaction failed');
      console.error(error);
    }
  };

  const fetchTokensCreatedByUser = useCallback(async () => {
    if (!tokenFactoryContract || !account) return;

    setLoading(true);
    try {
      const tokens = await tokenFactoryContract.methods.getTokensByOwner(account).call();
      setTokensCreatedByUser(tokens.map((tokenAddr: string) => ({ name: "", symbol: "", address: tokenAddr }))); // Adjust to match how your contract structures tokens
      setLoading(false);
    } catch (error) {
      console.error(error);
      setLoading(false);
      setError('Error fetching tokens');
    }
  }, [account, tokenFactoryContract]);

  useEffect(() => {
    fetchTokensCreatedByUser();
  }, [fetchTokensCreatedByUser]);

  return { createToken, tokensCreatedByUser, creationStatus, loading, error };
};

export default useTokenFactory;