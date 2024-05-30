import { useState, useEffect } from 'react';
import Web3 from 'web3';
import { AbiItem } from 'web3-utils';
import tokenFactoryABI from './tokenFactoryABI.json';

const useTokenFactory = () => {
  const [account, setAccount] = useState<string>('');
  const [tokenFactoryContract, setTokenFactoryContract] = useState<any>(null);
  const [tokensCreatedByUser, setTokensCreatedByUser] = useState<Array<any>>([]);
  const [creationStatus, setCreationStatus] = useState<string>('');

  useEffect(() => {
    const web3 = new Web3(Web3.givenProvider || process.env.REACT_APP_INFURA_URL);
    const tokenFactory = new web3.eth.Contract(
      tokenFactoryABI as AbiItem[],
      process.env.REACT_APP_TOKEN_FACTORY_ADDRESS
    );
    setTokenFactoryContract(tokenFactory);
    const loadAccount = async () => {
      const accounts = await web3.eth.getAccounts();
      setAccount(accounts[0]);
    };
    loadAccount();
  }, []);

  const createToken = async (name: string, symbol: string, initialSupply: number) => {
    if (!tokenFactoryContract || !account) return;

    setCreationStatus('Creating...');
    try {
      await tokenFactoryContract.methods
        .createToken(name, symbol, initialSupply)
        .send({ from: account })
        .on('receipt', (receipt: any) => {
          setCreationStatus('Success');
          fetchTokensCreatedByUser();
        })
        .on('error', (error: any) => {
          setCreationStatus('Failed');
          console.error('Token creation error:', error);
        });
    } catch (error) {
      console.error(error);
      setCreationStatus('Failed');
    }
  };

  const fetchTokensCreatedByUser = async () => {
    if (!tokenFactoryContract || !account) return;

    try {
      const tokens = await tokenFactoryContract.methods.getTokensByOwner(account).call();
      setTokensCreatedByUser(tokens);
    } catch (error) {
      console.error(error);
    }
  };

  useEffect(() => {
    fetchTokensCreatedByUser();
  }, [tokenFactoryContract, account]);

  return { createToken, tokensCreatedByUser, creationStatus };
};

export default useTokenFactory;