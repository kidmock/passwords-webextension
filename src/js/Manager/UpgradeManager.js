import StorageService from '@js/Services/StorageService';
import Server from '@js/Models/Server/Server';
import uuid from 'uuidv4';
import LocalisationService from '@js/Services/LocalisationService';
import ServerRepository from '@js/Repositories/ServerRepository';
import SettingsService from '@js/Services/SettingsService';
import SystemService from '@js/Services/SystemService';

class UpgradeManager {

    get CURRENT_VERSION() {
        return 20001;
    }

    async run() {
        let version = await StorageService.get('version');

        if(version === null) {
            await StorageService.set('version', this.CURRENT_VERSION, StorageService.STORAGE_SYNC);
            return;
        } else if(version === this.CURRENT_VERSION) {
            return;
        }

        if(version < 20000) {
            await this._upgrade20000();
        }

        if(version < 20001) {
            await this._upgrade20001();
        }

        await StorageService.set('version', this.CURRENT_VERSION, StorageService.STORAGE_SYNC);
        await StorageService.set('version', this.CURRENT_VERSION, StorageService.STORAGE_LOCAL);
    }

    async _upgrade20000() {
        let {url, user, theme} = await SystemService.getBrowserApi().storage.sync.get(['url', 'user', 'theme']);
        let {password} = await SystemService.getBrowserApi().storage.local.get(['password']);

        if(url === null || user === null || password === null) return;
        if(url === undefined || user === undefined || password === undefined) return;
        if(url.substr(-1, 1) !== '/') url += '/';

        let server = new Server(
            {
                id         : uuid(),
                label      : LocalisationService.translate('MigrationAccountName'),
                baseUrl    : url,
                user,
                token      : password,
                rootFolder : '00000000-0000-0000-0000-000000000000',
                inboxFolder: null,
                inboxTag   : null
            }
        );

        await StorageService.remove('servers', StorageService.STORAGE_SYNC);
        await ServerRepository.create(server);
        await SettingsService.set('sync.server.default', server.getId());
        await this._removeOldVariables();
    }

    async _upgrade20001() {
        await this._removeOldVariables();
        if(await SettingsService.getValue('sync.server.default') === null) {
            let servers = await ServerRepository.findAll();

            if(servers.length > 0) {
                await SettingsService.set('sync.server.default', servers[0].getId());
            }
        }
    }

    async _removeOldVariables() {
        await StorageService.remove('initialized', StorageService.STORAGE_LOCAL);
        await StorageService.remove('password', StorageService.STORAGE_LOCAL);
        await StorageService.remove('updated', StorageService.STORAGE_LOCAL);
        await StorageService.remove('url', StorageService.STORAGE_SYNC);
        await StorageService.remove('user', StorageService.STORAGE_SYNC);
        await StorageService.remove('version', StorageService.STORAGE_LOCAL);
    }
}

export default new UpgradeManager();