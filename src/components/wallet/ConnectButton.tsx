import React, { useState, useEffect } from 'react';
import { Button, Typography, Box, Chip, Tooltip } from '@mui/material';
import { styled } from '@mui/material/styles';
import AccountBalanceWalletIcon from '@mui/icons-material/AccountBalanceWallet';
import ErrorIcon from '@mui/icons-material/Error';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ExitToAppIcon from '@mui/icons-material/ExitToApp';

declare global {
  interface Window {
    ethereum?: any;
  }
}

const StyledButton = styled(Button)(() => ({
  color: "white",
  cursor: "pointer",
  textDecoration: "none",
  textTransform: "uppercase",
  fontWeight: 600,
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  fontSize: "14px",
  minWidth: "160px",
  height: "40px",
  borderRadius: "8px",
  backgroundColor: "#00dbe3",
  '&:hover': {
    backgroundColor: "#00c7d0",
  },
}));

const WalletInfo = styled(Box)(() => ({
  display: 'flex',
  alignItems: 'center',
  gap: '10px',
  padding: '6px 12px',
  backgroundColor: 'rgba(255, 255, 255, 0.1)',
  borderRadius: '20px',
  color: 'white',
  fontSize: "13px",
}));

interface WalletConnectionProps {
  onWalletConnected?: (address: string) => void;
}

const ConnectWallet: React.FC<WalletConnectionProps> = ({ onWalletConnected }) => {
  const [account, setAccount] = useState<string | null>(null);
  const [network, setNetwork] = useState<string | null>(null);
  const [balance, setBalance] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const isMetaMaskInstalled = () => typeof window.ethereum !== 'undefined';

  const getNetworkName = (chainId: string): string => {
    const networks: { [key: string]: string } = {
      '0x1': 'Ethereum Mainnet',
      '0x5': 'Goerli Testnet',
      '0xaa36a7': 'Sepolia Testnet',
      '0x38': 'BSC',
      '0x89': 'Polygon',
      '0x13881': 'Mumbai Testnet',
    };
    return networks[chainId] || `Chain ID: ${chainId}`;
  };

  const formatAddress = (address: string): string =>
    `${address.slice(0, 6)}...${address.slice(-4)}`;

  const formatBalance = (balance: string): string =>
    parseFloat(balance).toFixed(4);

  const connectWallet = async () => {
    try {
      setLoading(true);
      setError(null);

      if (!isMetaMaskInstalled()) {
        setError('MetaMask is not installed. Please install MetaMask to continue.');
        return;
      }

      const accounts: string[] = await window.ethereum.request({
        method: 'eth_requestAccounts',
      });

      if (accounts.length > 0) {
        const address = accounts[0];
        setAccount(address);
        onWalletConnected?.(address);
        await updateWalletInfo();
      }
    } catch (err: any) {
      console.error('Error connecting wallet:', err);
      if (err.code === 4001) {
        setError('User rejected the connection request');
      } else {
        setError('Failed to connect wallet');
      }
    } finally {
      setLoading(false);
    }
  };

  const updateWalletInfo = async () => {
    try {
      if (!window.ethereum) return;

      const chainId = await window.ethereum.request({ method: 'eth_chainId' });
      setNetwork(getNetworkName(chainId));

      const accounts: string[] = await window.ethereum.request({ method: 'eth_accounts' });
      if (accounts.length > 0) {
        const balanceHex: string = await window.ethereum.request({
          method: 'eth_getBalance',
          params: [accounts[0], 'latest'],
        });
        const balanceInEth = (Number(BigInt(balanceHex) / BigInt(1e14)) / 10000).toString();
        setBalance(balanceInEth);
      }
    } catch (err) {
      console.error('Error updating wallet info:', err);
    }
  };

  const disconnectWallet = () => {
    setAccount(null);
    setNetwork(null);
    setBalance(null);
    setError(null);
  };

  useEffect(() => {
    if (window.ethereum) {
      window.ethereum.request({ method: 'eth_accounts' }).then((accounts: string[]) => {
        if (accounts.length > 0) {
          setAccount(accounts[0]);
          updateWalletInfo();
        }
      });

      window.ethereum.on('accountsChanged', (accounts: string[]) => {
        if (accounts.length > 0) {
          setAccount(accounts[0]);
          updateWalletInfo();
        } else {
          disconnectWallet();
        }
      });

      window.ethereum.on('chainChanged', () => {
        updateWalletInfo();
      });
    }

    return () => {
      if (window.ethereum) {
        window.ethereum.removeAllListeners('accountsChanged');
        window.ethereum.removeAllListeners('chainChanged');
      }
    };
  }, []);

  if (error && !account) {
    return (
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <ErrorIcon sx={{ color: '#ff5252' }} />
        <Typography variant="body2" sx={{ color: '#ff5252' }}>
          {error}
        </Typography>
      </Box>
    );
  }

  if (account) {
    return (
      <WalletInfo>
        <CheckCircleIcon sx={{ color: '#4caf50', fontSize: 16 }} />
        <Tooltip title={`Address: ${account}`}>
          <Typography sx={{ fontWeight: 'bold', fontSize: "13px" }}>
            {formatAddress(account)}
          </Typography>
        </Tooltip>
        {network && (
          <Chip
            label={network}
            size="small"
            sx={{
              backgroundColor: 'rgba(255, 255, 255, 0.2)',
              color: 'white',
              fontSize: '11px'
            }}
          />
        )}
        {balance && (
          <Typography sx={{ fontSize: '12px' }}>
            {formatBalance(balance)} ETH
          </Typography>
        )}
        <StyledButton
          onClick={disconnectWallet}
          startIcon={<ExitToAppIcon />}
        >
          Disconnect
        </StyledButton>
      </WalletInfo>
    );
  }

  return (
    <StyledButton
      onClick={connectWallet}
      disabled={loading}
      startIcon={<AccountBalanceWalletIcon />}
    >
      {loading ? 'Connecting...' : 'Connect Wallet'}
    </StyledButton>
  );
};

export default ConnectWallet;