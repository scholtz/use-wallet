import { useStore } from '@tanstack/solid-store'
import algosdk from 'algosdk'
import { JSX, createContext, createMemo, onMount, useContext } from 'solid-js'
import type {
  NetworkId,
  WalletAccount,
  WalletId,
  WalletManager,
  WalletMetadata,
  WalletAVMState
} from 'avm-wallet'

export * from 'avm-wallet'

interface WalletProviderProps {
  manager: WalletManager
  children: JSX.Element
}

const WalletContext = createContext<() => WalletManager>()

export const WalletProvider = (props: WalletProviderProps) => {
  const store = () => props.manager

  onMount(async () => {
    try {
      await props.manager.resumeSessions()
    } catch (error) {
      console.error('Error resuming sessions:', error)
    }
  })

  return <WalletContext.Provider value={store}>{props.children}</WalletContext.Provider>
}

export const useWalletManager = (): WalletManager => {
  const manager = useContext(WalletContext)
  if (!manager) {
    throw new Error('useWalletManager must be used within a WalletProvider')
  }
  return manager()
}

export interface Wallet {
  id: () => string
  metadata: () => WalletMetadata
  accounts: () => WalletAccount[]
  activeAccount: () => WalletAccount | null
  isConnected: () => boolean
  isActive: () => boolean
  connect: (args?: Record<string, any>) => Promise<WalletAccount[]>
  disconnect: () => Promise<void>
  setActive: () => void
  setActiveAccount: (address: string) => void
}

export function useWallet() {
  const manager = createMemo(() => useWalletManager())

  const algodClient = useStore(manager().store, (state) => state.algodClient)

  const walletStore = useStore(manager().store, (state) => state.wallets)

  const walletAVMState = (walletId: WalletId): WalletAVMState | null => walletStore()[walletId] || null

  const avmActiveWalletId = useStore(manager().store, (state) => state.avmActiveWallet)

  const avmActiveWallet = () => manager().getWallet(avmActiveWalletId() as WalletId) || null

  const avmActiveWalletAVMState = () => walletAVMState(avmActiveWalletId() as WalletId)

  const avmActiveWalletAccounts = () => avmActiveWalletAVMState()?.accounts ?? null

  const avmActiveWalletAddresses = () =>
    avmActiveWalletAccounts()?.map((account) => account.address) ?? null

  const activeAccount = () => avmActiveWalletAVMState()?.activeAccount ?? null

  const activeAddress = () => activeAccount()?.address ?? null

  const isWalletActive = (walletId: WalletId) => walletId === avmActiveWalletId()
  const isWalletConnected = (walletId: WalletId) =>
    !!walletAVMState(walletId)?.accounts.length || false

  const activeNetwork = useStore(manager().store, (state) => state.activeNetwork)

  const setActiveNetwork = async (networkId: NetworkId): Promise<void> => {
    if (activeNetwork() === networkId) {
      return
    }

    console.info(`[Solid] Creating Algodv2 client for ${networkId}...`)

    const { token, baseServer, port, headers } = manager().networkConfig[networkId]
    const newClient = new algosdk.Algodv2(token, baseServer, port, headers)

    manager().store.setState((state) => ({
      ...state,
      activeNetwork: networkId,
      algodClient: newClient
    }))

    console.info(`[Solid] ✅ Active network set to ${networkId}.`)
  }

  const signTransactions = <T extends algosdk.Transaction[] | Uint8Array[]>(
    txnGroup: T | T[],
    indexesToSign?: number[]
  ): Promise<(Uint8Array | null)[]> => {
    const wallet = avmActiveWallet()
    if (!wallet) {
      throw new Error('No active wallet')
    }
    return wallet.signTransactions(txnGroup, indexesToSign)
  }

  const transactionSigner = (
    txnGroup: algosdk.Transaction[],
    indexesToSign: number[]
  ): Promise<Uint8Array[]> => {
    const wallet = avmActiveWallet()
    if (!wallet) {
      throw new Error('No active wallet')
    }
    return wallet.transactionSigner(txnGroup, indexesToSign)
  }

  return {
    avmActiveWalletId,
    walletStore,
    algodClient,
    activeNetwork,
    avmActiveWallet,
    avmActiveWalletAccounts,
    avmActiveWalletAddresses,
    avmActiveWalletAVMState,
    activeAccount,
    activeAddress,
    isWalletActive,
    isWalletConnected,
    setActiveNetwork,
    signTransactions,
    transactionSigner,
    wallets: manager().wallets
  }
}
