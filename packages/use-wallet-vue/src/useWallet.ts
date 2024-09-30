import { useStore } from '@tanstack/vue-store'
import { NetworkId, WalletManager, type WalletAccount, type WalletMetadata } from 'avm-wallet'
import algosdk from 'algosdk'
import { computed, inject, ref } from 'vue'

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

export type SetAlgodClient = (client: algosdk.Algodv2) => void

export function useWallet() {
  const manager = inject<WalletManager>('walletManager')
  const algodClient = inject<ReturnType<typeof ref<algosdk.Algodv2>>>('algodClient')
  const setAlgodClient = inject<SetAlgodClient>('setAlgodClient') as SetAlgodClient

  if (!manager) {
    throw new Error('WalletManager plugin is not properly installed')
  }
  if (!algodClient || !setAlgodClient) {
    throw new Error('Algod client or setter not properly installed')
  }

  const activeNetwork = useStore(manager.store, (state) => state.activeNetwork)
  const setActiveNetwork = async (networkId: NetworkId): Promise<void> => {
    if (networkId === activeNetwork.value) {
      return
    }

    console.info(`[Vue] Creating Algodv2 client for ${networkId}...`)

    const { token, baseServer, port, headers } = manager.networkConfig[networkId]
    const newClient = new algosdk.Algodv2(token, baseServer, port, headers)
    setAlgodClient(newClient)

    manager.store.setState((state) => ({
      ...state,
      activeNetwork: networkId
    }))

    console.info(`[Vue] ✅ Active network set to ${networkId}.`)
  }

  const walletStateMap = useStore(manager.store, (state) => state.wallets)
  const avmActiveWalletId = useStore(manager.store, (state) => state.avmActiveWallet)

  const wallets = computed(() => {
    return [...manager.wallets.values()].map((wallet): Wallet => {
      const walletState = walletStateMap.value[wallet.id]

      return {
        id: wallet.id,
        metadata: wallet.metadata,
        accounts: walletState?.accounts ?? [],
        activeAccount: walletState?.activeAccount ?? null,
        isConnected: !!walletState,
        isActive: wallet.id === avmActiveWalletId.value,
        connect: (args) => wallet.connect(args),
        disconnect: () => wallet.disconnect(),
        setActive: () => wallet.setActive(),
        setActiveAccount: (addr) => wallet.setActiveAccount(addr)
      }
    })
  })

  const avmActiveWallet = computed(() => {
    return avmActiveWalletId.value ? manager.getWallet(avmActiveWalletId.value) || null : null
  })

  const avmActiveWalletState = computed(() => {
    const wallet = avmActiveWallet.value
    return wallet ? walletStateMap.value[wallet.id] || null : null
  })

  const avmActiveWalletAccounts = computed(() => {
    return avmActiveWalletState.value?.accounts ?? null
  })

  const avmActiveWalletAddresses = computed(() => {
    return avmActiveWalletAccounts.value?.map((account) => account.address) ?? null
  })

  const activeAccount = computed(() => {
    return avmActiveWalletState.value?.activeAccount ?? null
  })

  const activeAddress = computed(() => {
    return activeAccount.value?.address ?? null
  })

  const signTransactions = <T extends algosdk.Transaction[] | Uint8Array[]>(
    txnGroup: T | T[],
    indexesToSign?: number[]
  ): Promise<(Uint8Array | null)[]> => {
    if (!avmActiveWallet.value) {
      throw new Error('No active wallet')
    }
    return avmActiveWallet.value.signTransactions(txnGroup, indexesToSign)
  }

  const transactionSigner = (
    txnGroup: algosdk.Transaction[],
    indexesToSign: number[]
  ): Promise<Uint8Array[]> => {
    if (!avmActiveWallet.value) {
      throw new Error('No active wallet')
    }
    return avmActiveWallet.value.transactionSigner(txnGroup, indexesToSign)
  }

  return {
    wallets,
    algodClient: computed(() => {
      if (!algodClient.value) {
        throw new Error('Algod client is undefined')
      }
      return algodClient.value
    }),
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
