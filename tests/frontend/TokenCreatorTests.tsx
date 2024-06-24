import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { TokenCreator } from './TokenCreator';
import { ethers } from 'ethers';

jest.mock('ethers');

process.env.REACT_APP_CONTRACT_ADDRESS = '0xContractCreateAddress';
process.env.REACT_APP_NETWORK = 'rinkeby';

describe('TokenCreator Component Tests', () => {
  let mockEthersProvider;
  let mockSigner;

  function setUpMockProviderAndSigner(sendTransactionMock) {
    mockEthersProvider = new ethers.providers.Web3Provider(window.ethereum);
    mockSigner = mockEthersProvider.getSigner();
    ethers.providers.Web3Provider.mockReturnValue(mockEthersProvider);
    mockEthersProvider.getSigner.mockReturnValue(mockSigner);
    mockSigner.sendTransaction = jest.fn().mockImplementation(sendTransactionMock);
  }

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('should display error for empty form submission', async () => {
    render(<TokenCreator />);
    fireEvent.click(screen.getByRole('button', { name: /create token/i }));
    await waitFor(() => {
      expect(screen.getByText(/name is required/i)).toBeInTheDocument();
      expect(screen.getByText(/symbol is required/i)).toBeInTheDocument();
      expect(screen.getByText(/initial supply is required/i)).toBeInTheDocument();
    });
  });

  test('should call Ethereum blockchain on form submission with valid inputs', async () => {
    setUpMockProviderAndSigner(() => Promise.resolve({ transactionHash: '0xTransactionHash' }));

    render(<TokenCreator />);
    fireEvent.change(screen.getByLabelText(/name/i), { target: { value: 'Test Token' } });
    fireEvent.change(screen.getByLabelText(/symbol/i), { target: { value: 'TST' } });
    fireEvent.change(screen.getByLabelText(/initial supply/i), { target: { value: '1000' } });
    fireEvent.click(screen.getByRole('button', { name: /create token/i }));

    await waitFor(() => expect(mockSigner.sendTransaction).toHaveBeenCalled());
  });

  test('should display transaction hash after successful blockchain call', async () => {
    setUpMockProviderAndSigner(() => Promise.resolve({ transactionHash: '0xTransactionHash' }));

    render(<TokenCreator />);
    fillAndSubmitForm();
    expect(await screen.findByText(/transaction hash: 0xTransactionHash/i)).toBeInTheDocument();
  });

  test('should display error message after failed blockchain call', async () => {
    const expectedErrorMessage = "Blockchain transaction failed";
    setUpMockProviderAndSigner(() => Promise.reject(new Error(expectedErrorMessage)));

    render(<TokenCreator />);
    fillAndSubmitForm();

    expect(await screen.findByText(expectedErrorMessage)).toBeInTheDocument();
  });

  function fillAndSubmitForm() {
    fireEvent.change(screen.getByLabelText(/name/i), { target: { value: 'Test Token' } });
    fireEvent.change(screen.getByLabelText(/symbol/i), { target: { value: 'TST' } });
    fireEvent.change(screen.getByLabelText(/initial supply/i), { target: { value: '1000' } });
    fireEvent.click(screen.getByRole('button', { name: /create token/i }));
  }
});