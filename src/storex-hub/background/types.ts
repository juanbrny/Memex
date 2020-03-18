import { SettingStore } from 'src/util/settings'

export interface StorexHubSettings {
    accessToken?: string
}

export type StorexHubSettingStore = SettingStore<StorexHubSettings>
