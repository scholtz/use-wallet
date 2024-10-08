import { useStore } from '@tanstack/react-store'
import { NetworkId, WalletAccount, WalletManager, WalletMetadata } from 'avm-wallet'
import algosdk from 'algosdk'
import * as React from 'react'

export * from 'avm-wallet'

interface IWalletContext {
  manager: WalletManager
  algodClient: algosdk.Algodv2
  setAlgodClient: React.Dispatch<React.SetStateAction<algosdk.Algodv2>>
}

const WalletContext = React.createContext<IWalletContext | undefined>(undefined)

export interface Wallet {
  id: string
  metadata: WalletMetadata
  accounts: WalletAccount[]
  activeAccount: WalletAccount | null
  isConnected: boolean
  isActive: boolean
  connect: (args?: Record<string, any>) => Promise<WalletAccount[]>
  disconnect: () => Promise<void>
  setActive: () => void
  setActiveAccount: (address: string) => void
}

export const useWallet = () => {
  const context = React.useContext(WalletContext)

  if (!context) {
    throw new Error('useWallet must be used within the WalletProvider')
  }

  const { manager, algodClient, setAlgodClient } = context

  const activeNetwork = useStore(manager.store, (state) => state.activeNetwork)

  const setActiveNetwork = async (networkId: NetworkId): Promise<void> => {
    if (networkId === activeNetwork) {
      return
    }

    console.info(`[React] Creating Algodv2 client for ${networkId}...`)

    const { token = '', baseServer, port = '', headers = {} } = manager.networkConfig[networkId]
    const newClient = new algosdk.Algodv2(token, baseServer, port, headers)
    setAlgodClient(newClient)

    manager.store.setState((state) => ({
      ...state,
      activeNetwork: networkId
    }))

    console.info(`[React] ✅ Active network set to ${networkId}.`)
  }

  const walletAVMStateMap = useStore(manager.store, (state) => state.wallets)
  const avmActiveWalletId = useStore(manager.store, (state) => state.avmActiveWallet)

  const wallets = React.useMemo(() => {
    return [...manager.wallets.values()].map((wallet): Wallet => {
      const walletAVMState = walletAVMStateMap[wallet.id]

      return {
        id: wallet.id,
        metadata: wallet.metadata,
        accounts: walletAVMState?.accounts ?? [],
        activeAccount: walletAVMState?.activeAccount ?? null,
        isConnected: !!walletAVMState,
        isActive: wallet.id === avmActiveWalletId,
        connect: (args) => wallet.connect(args),
        disconnect: () => wallet.disconnect(),
        setActive: () => wallet.setActive(),
        setActiveAccount: (addr) => wallet.setActiveAccount(addr)
      }
    })
  }, [manager, walletAVMStateMap, avmActiveWalletId])

  const avmActiveWallet = avmActiveWalletId ? manager.getWallet(avmActiveWalletId) || null : null
  const avmActiveWalletAVMState = avmActiveWalletId ? walletAVMStateMap[avmActiveWalletId] || null : null

  const avmActiveWalletAccounts = avmActiveWalletAVMState?.accounts ?? null
  const avmActiveWalletAddresses = avmActiveWalletAccounts?.map((account) => account.address) ?? null
  const activeAccount = avmActiveWalletAVMState?.activeAccount ?? null
  const activeAddress = activeAccount?.address ?? null

  const signTransactions = <T extends algosdk.Transaction[] | Uint8Array[]>(
    txnGroup: T | T[],
    indexesToSign?: number[]
  ): Promise<(Uint8Array | null)[]> => {
    if (!avmActiveWallet) {
      throw new Error('No active wallet')
    }
    return avmActiveWallet.signTransactions(txnGroup, indexesToSign)
  }

  const transactionSigner = (
    txnGroup: algosdk.Transaction[],
    indexesToSign: number[]
  ): Promise<Uint8Array[]> => {
    if (!avmActiveWallet) {
      throw new Error('No active wallet')
    }
    return avmActiveWallet.transactionSigner(txnGroup, indexesToSign)
  }

  return {
    wallets,
    algodClient,
    activeNetwork,
    avmActiveWallet,
    avmActiveWalletAccounts,
    avmActiveWalletAddresses,
    activeAccount,
    activeAddress,
    setActiveNetwork,
    setAlgodClient,
    signTransactions,
    transactionSigner
  }
}

interface WalletProviderProps {
  manager: WalletManager
  children: React.ReactNode
}

export const WalletProvider = ({ manager, children }: WalletProviderProps): JSX.Element => {
  const [algodClient, setAlgodClient] = React.useState(manager.algodClient)

  React.useEffect(() => {
    manager.algodClient = algodClient
  }, [algodClient, manager])

  const resumedRef = React.useRef(false)

  React.useEffect(() => {
    const resumeSessions = async () => {
      try {
        await manager.resumeSessions()
      } catch (error) {
        console.error('Error resuming sessions:', error)
      }
    }

    if (!resumedRef.current) {
      resumeSessions()
      resumedRef.current = true
    }
  }, [manager])

  return (
    <WalletContext.Provider value={{ manager, algodClient, setAlgodClient }}>
      {children}
    </WalletContext.Provider>
  )
}
