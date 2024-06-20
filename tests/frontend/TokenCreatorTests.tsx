import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { TokenCreator } from './TokenCreator';
import { ethers } from 'ethers';

jest.mock('ethers');

process.env.REACT_APP_CONTRACT_ADDRESS = '0xContractAddress';
process.env.REACT_APP_NETWORK = 'rinkeby';

describe('TokenCreator Component Tests', () => {
  test('should display error for empty form submission', async () => {
    render(<TokenCreator />);
    fireEvent.click(screen.getByRole('button', { name: /create token/i }));
    expect(await screen.findByText(/name is required/i)).toBeInTheDocument();
    expect(await screen.findByText(/symbol is required/i)).toBeInTheDocument();
    expect(await screen.findByText(/initial supply is required/i)).toBeInTheDocument();
  });

  test('should call Ethereum blockchain on form submission with valid inputs', async () => {
    const mockEthersProvider = new ethers.providers.Web3Provider(window.ethereum);
    const mockSigner = mockEthersProvider.getSigner();
    ethers.providers.Web3Provider.mockReturnValue(mockEthersProvider);
    mockEthersProvider.getSigner.mockReturnValue(mockSigner);
    mockSigner.sendTransaction = jest.fn().mockResolvedValue({
      transactionHash: '0xTransactionHash',
    });

    render(<TokenCreator />);

    fireEvent.change(screen.getByLabelText(/name/i), { target: { value: 'Test Token' } });
    fireEvent.change(screen.getByLabelText(/symbol/i), { target: { value: 'TST' } });
    fireEvent.change(screen.getByLabelText(/initial supply/i), { target: { value: '1000' } });
    fireEvent.click(screen.getByRole('button', { name: /create token/i }));

    await waitFor(() => expect(mockSigner.sendTransaction).toHaveBeenCalled());
  });

  test('should display transaction hash after successful blockchain call', async () => {
    const mockEthersProvider = new ethers.providers.Web3Provider(window.ethereum);
    const mockSigner = mockEthersProvider.getSigner();
    ethers.providers.Web3Provider.mockReturnValue(mockEthersProvider);
    mockEthersProvider.getSigner.mockReturnValue(mockSigner);
    mockSigner.sendTransaction = jest.fn().mockResolvedValue({
      transactionHash: '0xTransactionHash',
    });

    render(<TokenCreator />);

    fireEvent.change(screen.getByLabelText(/name/i), { target: { value: 'Test Token' } });
    fireEvent.change(screen.getByLabelText(/symbol/i), { target: { value: 'TST' } });
    fireEvent.change(screen.getByLabelText(/initial supply/i), { target: { value: '1000' } });
    fireEvent.click(screen.getByRole('button', { name: /create token/i }));

    expect(await screen.findByText(/transaction hash: 0xTransactionPath/i)).toBeInTheDocument();
  });
});