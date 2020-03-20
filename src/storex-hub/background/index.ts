import io from 'socket.io-client'
import StorageManager from '@worldbrain/storex'
import { createStorexHubSocketClient } from '@worldbrain/storex-hub/lib/client'
import { StorexHubApi_v0 } from '@worldbrain/storex-hub/lib/public-api'
import { StorageOperationEvent } from '@worldbrain/storex-middleware-change-watcher/lib/types'
import { StorexHubSettingStore } from './types'

export class StorexHubBackground {
    private socket?: SocketIOClient.Socket
    private client?: StorexHubApi_v0
    private accessToken?: string

    constructor(
        private dependencies: {
            storageManager: StorageManager
            settingsStore: StorexHubSettingStore
        },
    ) { }

    async connect(options?: { port?: number; onlyIfPreviouslyUsed?: boolean }) {
        let subscriptionCount = 0
        this.accessToken = await this.dependencies.settingsStore.get(
            'accessToken',
        )
        if (!this.accessToken && options?.onlyIfPreviouslyUsed) {
            return
        }

        this.socket = io(`http://localhost:${options?.port || 3000}`)
        this.client = await createStorexHubSocketClient(this.socket, {
            callbacks: {
                handleRemoteOperation: async event => {
                    return {
                        result: await this.dependencies.storageManager.operation(
                            event.operation[0],
                            ...event.operation.slice(1),
                        ),
                    }
                },
                handleSubscription: async () => {
                    return { subscriptionId: (++subscriptionCount).toString() }
                },
            },
        })
        this.setupReidentificationAfterReconnect()

        if (this.accessToken) {
            await this.client.identifyApp({
                name: 'memex',
                accessToken: this.accessToken,
            })
        } else {
            const registrationResponse = await this.client.registerApp({
                name: 'memex',
                remote: true,
                identify: true,
            })
            if (registrationResponse.success) {
                this.accessToken = registrationResponse.accessToken
                await this.dependencies.settingsStore.set(
                    'accessToken',
                    registrationResponse.accessToken,
                )
            }
        }
    }

    handlePostStorageChange(event: StorageOperationEvent<'post'>) {
        if (!this.client) {
            return
        }

        this.client.emitEvent({
            event: { type: 'storage-change', info: event.info },
        })
    }

    setupReidentificationAfterReconnect() {
        let connected = true
        this.socket.on('disconnect', () => {
            connected = false
        })
        this.socket.on('reconnect', async () => {
            connected = true
            if (connected || !this.accessToken) {
                return
            }

            await this.client.identifyApp({
                name: 'memex',
                accessToken: this.accessToken,
            })
        })
    }
}
