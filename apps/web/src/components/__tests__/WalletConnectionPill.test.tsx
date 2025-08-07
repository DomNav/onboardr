import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import WalletConnectionPill from '../WalletConnectionPill';
import { useWallet } from '@/contexts/WalletContext';
import { useProfileStore } from '@/store/profile';

// Mock dependencies
vi.mock('@/contexts/WalletContext');
vi.mock('@/store/profile');
vi.mock('../wallet/WalletSelectModal', () => ({
  default: ({ isOpen, onClose }: any) => 
    isOpen ? <div data-testid="wallet-modal">Wallet Modal</div> : null
}));
vi.mock('../ProfileMenu', () => ({
  default: () => <div data-testid="profile-menu">Profile Menu</div>
}));

describe('WalletConnectionPill', () => {
  const mockConnect = vi.fn();
  const mockDisconnect = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    // Reset store mock
    (useProfileStore as any).mockReturnValue({
      hasProfileNFT: false
    });
  });

  describe('Disconnected State', () => {
    beforeEach(() => {
      (useWallet as any).mockReturnValue({
        isConnected: false,
        isConnecting: false,
        address: null,
        network: null,
        connect: mockConnect,
        disconnect: mockDisconnect
      });
    });

    it('should show animated Connect Wallet button when disconnected', () => {
      render(<WalletConnectionPill />);
      
      const connectButton = screen.getByText('Connect Wallet');
      expect(connectButton).toBeInTheDocument();
      
      // Check for wallet icon
      const walletIcon = connectButton.closest('button')?.querySelector('svg');
      expect(walletIcon).toBeInTheDocument();
      
      // Check for animation classes (framer-motion adds inline styles)
      const motionDiv = connectButton.closest('div');
      expect(motionDiv).toHaveStyle({ transform: expect.stringContaining('scale') });
    });

    it('should show "Connecting..." when isConnecting is true', () => {
      (useWallet as any).mockReturnValue({
        isConnected: false,
        isConnecting: true,
        address: null,
        network: null,
        connect: mockConnect,
        disconnect: mockDisconnect
      });

      render(<WalletConnectionPill />);
      
      expect(screen.getByText('Connecting...')).toBeInTheDocument();
      const button = screen.getByRole('button');
      expect(button).toBeDisabled();
    });

    it('should attempt to connect with Freighter on button click', async () => {
      render(<WalletConnectionPill />);
      
      const connectButton = screen.getByText('Connect Wallet');
      fireEvent.click(connectButton);
      
      await waitFor(() => {
        expect(mockConnect).toHaveBeenCalledWith('freighter');
      });
    });

    it('should open wallet modal if Freighter connection fails', async () => {
      mockConnect.mockRejectedValueOnce(new Error('Freighter not available'));
      
      render(<WalletConnectionPill />);
      
      const connectButton = screen.getByText('Connect Wallet');
      fireEvent.click(connectButton);
      
      await waitFor(() => {
        expect(screen.getByTestId('wallet-modal')).toBeInTheDocument();
      });
    });
  });

  describe('Connected State without Profile NFT', () => {
    beforeEach(() => {
      (useWallet as any).mockReturnValue({
        isConnected: true,
        isConnecting: false,
        address: 'GBCDEFGHIJKLMNOPQRSTUVWXYZABCDEF1234567890ABCDEFGHIJK',
        network: 'testnet',
        connect: mockConnect,
        disconnect: mockDisconnect
      });
    });

    it('should show formatted wallet address when connected', () => {
      render(<WalletConnectionPill />);
      
      // Should show shortened address
      expect(screen.getByText('GBCDEF...GHIJK')).toBeInTheDocument();
      
      // Should show network badge
      expect(screen.getByText('testnet')).toBeInTheDocument();
    });

    it('should show dropdown menu with wallet details on click', () => {
      render(<WalletConnectionPill />);
      
      const addressButton = screen.getByText('GBCDEF...GHIJK');
      fireEvent.click(addressButton);
      
      // Check dropdown content
      expect(screen.getByText('Wallet Connected')).toBeInTheDocument();
      expect(screen.getByText('GBCDEFGHIJKLMNOPQRSTUVWXYZABCDEF1234567890ABCDEFGHIJK')).toBeInTheDocument();
      expect(screen.getByText('Copy Address')).toBeInTheDocument();
      expect(screen.getByText('Disconnect Wallet')).toBeInTheDocument();
    });

    it('should copy address to clipboard when Copy Address is clicked', async () => {
      const mockClipboard = {
        writeText: vi.fn().mockResolvedValue(undefined)
      };
      Object.assign(navigator, { clipboard: mockClipboard });

      render(<WalletConnectionPill />);
      
      const addressButton = screen.getByText('GBCDEF...GHIJK');
      fireEvent.click(addressButton);
      
      const copyButton = screen.getByText('Copy Address');
      fireEvent.click(copyButton);
      
      await waitFor(() => {
        expect(mockClipboard.writeText).toHaveBeenCalledWith(
          'GBCDEFGHIJKLMNOPQRSTUVWXYZABCDEF1234567890ABCDEFGHIJK'
        );
      });
    });

    it('should disconnect wallet when Disconnect is clicked', () => {
      render(<WalletConnectionPill />);
      
      const addressButton = screen.getByText('GBCDEF...GHIJK');
      fireEvent.click(addressButton);
      
      const disconnectButton = screen.getByText('Disconnect Wallet');
      fireEvent.click(disconnectButton);
      
      expect(mockDisconnect).toHaveBeenCalled();
    });
  });

  describe('Connected State with Profile NFT', () => {
    beforeEach(() => {
      (useWallet as any).mockReturnValue({
        isConnected: true,
        isConnecting: false,
        address: 'GBCDEFGHIJKLMNOPQRSTUVWXYZABCDEF1234567890ABCDEFGHIJK',
        network: 'testnet',
        connect: mockConnect,
        disconnect: mockDisconnect
      });
      
      (useProfileStore as any).mockReturnValue({
        hasProfileNFT: true
      });
    });

    it('should render ProfileMenu when user has Profile NFT', () => {
      render(<WalletConnectionPill />);
      
      expect(screen.getByTestId('profile-menu')).toBeInTheDocument();
      
      // Should not show the regular wallet address button
      expect(screen.queryByText('GBCDEF...GHIJK')).not.toBeInTheDocument();
    });
  });

  describe('State Transitions', () => {
    it('should transition from disconnected to connected state', async () => {
      const { rerender } = render(<WalletConnectionPill />);
      
      // Initially disconnected
      expect(screen.getByText('Connect Wallet')).toBeInTheDocument();
      
      // Simulate wallet connection
      (useWallet as any).mockReturnValue({
        isConnected: true,
        isConnecting: false,
        address: 'GBCDEFGHIJKLMNOPQRSTUVWXYZABCDEF1234567890ABCDEFGHIJK',
        network: 'testnet',
        connect: mockConnect,
        disconnect: mockDisconnect
      });
      
      rerender(<WalletConnectionPill />);
      
      // Should now show connected state
      expect(screen.queryByText('Connect Wallet')).not.toBeInTheDocument();
      expect(screen.getByText('GBCDEF...GHIJK')).toBeInTheDocument();
    });

    it('should transition from connected to disconnected state', async () => {
      // Start connected
      (useWallet as any).mockReturnValue({
        isConnected: true,
        isConnecting: false,
        address: 'GBCDEFGHIJKLMNOPQRSTUVWXYZABCDEF1234567890ABCDEFGHIJK',
        network: 'testnet',
        connect: mockConnect,
        disconnect: mockDisconnect
      });
      
      const { rerender } = render(<WalletConnectionPill />);
      
      expect(screen.getByText('GBCDEF...GHIJK')).toBeInTheDocument();
      
      // Simulate wallet disconnection
      (useWallet as any).mockReturnValue({
        isConnected: false,
        isConnecting: false,
        address: null,
        network: null,
        connect: mockConnect,
        disconnect: mockDisconnect
      });
      
      rerender(<WalletConnectionPill />);
      
      // Should show Connect Wallet button again
      expect(screen.queryByText('GBCDEF...GHIJK')).not.toBeInTheDocument();
      expect(screen.getByText('Connect Wallet')).toBeInTheDocument();
    });
  });

  describe('Edge Cases', () => {
    it('should handle null or undefined address gracefully', () => {
      (useWallet as any).mockReturnValue({
        isConnected: true,
        isConnecting: false,
        address: null,
        network: 'testnet',
        connect: mockConnect,
        disconnect: mockDisconnect
      });

      render(<WalletConnectionPill />);
      
      // Should show "Connected" as fallback
      expect(screen.getByText('Connected')).toBeInTheDocument();
    });

    it('should handle very short addresses', () => {
      (useWallet as any).mockReturnValue({
        isConnected: true,
        isConnecting: false,
        address: 'SHORT',
        network: 'testnet',
        connect: mockConnect,
        disconnect: mockDisconnect
      });

      render(<WalletConnectionPill />);
      
      // Should still render without crashing
      expect(screen.getByRole('button')).toBeInTheDocument();
    });
  });
});