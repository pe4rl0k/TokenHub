import express, { Request, Response } from 'express';
import bodyParser from 'body-parser';
import dotenv from 'dotenv';
import path from 'path';
import jwt from 'jsonwebtoken';
import Web3 from 'web3';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

app.use(bodyParser.json());

app.use(express.static(path.join(__dirname, '../client/build')));

const web3 = new Web3(new Web3.providers.HttpProvider(process.env.BLOCKCHAIN_PROVIDER_URL || 'http://localhost:8545'));

const verifyToken = (req: Request, res: Response, next: Function) => {
  const token = req.headers['authorization'];
  if (!token) return res.status(401).send('Access Denied / Unauthorized request');

  try {
    jwt.verify(token, process.env.TOKEN_SECRET_KEY as string);
    next();
  } catch (error) {
    res.status(400).send('Invalid Token');
  }
};

app.post('/api/authenticate', async (req: Request, res: Response) => {
  const { username, password } = req.body;
  if (username && password) {
    const token = jwt.sign({ username }, process.env.TOKEN_SECRET_KEY as string, {
      expiresIn: '1h',
    });
    res.json({ token });
  } else {
    res.status(400).send('Username or password is incorrect');
  }
});

app.get('/api/token/:tokenId', verifyToken, async (req: Request, res: Response) => {
  const tokenId = req.params.tokenId;
  try {
    const tokenData = await web3.eth.call({
      to: process.env.CONTRACT_ADDRESS,
      data: web3.eth.abi.encodeFunctionCall({
        name: 'getTokenDetails',
        type: 'function',
        inputs: [{type: 'uint256', name: 'tokenId'}]
      }, [tokenId])
    });
    res.json({data: web3.eth.abi.decodeParameter('string', tokenData)});
  } catch (error) {
    res.status(500).send('Failed to fetch token data from the blockchain');
  }
});

app.get('*', (req: Request, res: Response) => {
  res.sendFile(path.join(__dirname, '../client/build', 'index.html'));
});

app.listen(PORT, () => console.log(`Server is running on port ${PORT}`));