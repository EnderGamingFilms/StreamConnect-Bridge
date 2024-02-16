import { INTERNAL_EVENTS } from '../events/EventsHandler.js';
import { Emitting } from '../events/backend/Emmiting.js';
import { FileManager } from '../utils/FileManager.js';
import { ActionProvider, ActionData } from './backend/ActionProvider.js';

/**
 * This class is a manager for ActionProviders which store actions and categories that can be used to executed requests on 3rd-party applications
 */
export class ProviderManager extends Emitting {
	static PROVIDER_DATA_PATH: string = 'storage/provider_data';
	private providerMap: Map<string, ActionProvider<any>> = new Map(); // <service_id, provider>

	constructor(private fileManager: FileManager) {
		super();
	}

	/**
	 * Registers a provider with the manager
	 * @param provider the provider to register
	 */
	registerProvider<T extends ActionData>(provider: ActionProvider<T>) {
		if (this.providerMap.has(provider.providerId)) {
			this.emit(INTERNAL_EVENTS.ERROR, {
				data: {
					message: `TriggerManager >> Provider with id ${provider.providerId} already exists`
				}
			});
			return;
		}

		this.providerMap.set(provider.providerId, provider);
	}

	/**
	 * This method returns an array of all providers
	 * @returns an provider associated with the given id
	 */
	getProvider<T extends ActionData>(providerId: string): ActionProvider<T> | undefined {
		return this.providerMap.get(providerId);
	}

	/**
	 * Get all available providers
	 * @returns an list of providers stored in this manager
	 */
	getProviders<T extends ActionData>(): ActionProvider<T>[] {
		return Array.from(this.providerMap.values());
	}

	/**
	 * Searches for a provider that has the given category
	 * @param categoryId id of the category to look up
	 * @returns an provider associated with the given id, or undefined if not found
	 */
	lookupProvider<T extends ActionData>(categoryId: string): ActionProvider<T> | undefined {
		let provider: ActionProvider<T> | undefined = undefined;

		for (const _provider of this.providerMap.values()) {
			if (_provider.getActionMap(categoryId)) {
				provider = _provider;
				break;
			}
		}

		return provider;
	}
}