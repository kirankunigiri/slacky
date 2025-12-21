/** A plugin for Legend State to persist data to Chrome's sync storage via WXT storage */

/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */
import type { Change } from '@legendapp/state';
import { applyChanges, internal } from '@legendapp/state';
import type { ObservablePersistPlugin, ObservablePersistPluginOptions, PersistMetadata } from '@legendapp/state/sync';

const { safeParse, safeStringify } = internal;

export class ObservablePersistWXTStorage implements ObservablePersistPlugin {
	// Optional initialization method
	initialize?(_config: ObservablePersistPluginOptions): void | Promise<void> {
		// No initialization needed for WXT storage
	}

	private data: Record<string, any> = {};
	private loadingPromises = new Map<string, Promise<void>>();

	// Helper to get the full key with sync prefix
	private getKey(table: string): string {
		return `sync:${table}`;
	}

	// Load data from WXT storage asynchronously - PUBLIC because it's part of the interface
	public async loadTable(table: string, init: any): Promise<void> {
		const key = this.getKey(table) as `sync:${string}`;

		try {
			const value = await storage.getItem(key);
			this.data[table] = value !== null ? safeParse(value as string) : init;
		} catch (error) {
			console.error('[legend-state] ObservablePersistWXTStorage failed to parse', table, error);
			this.data[table] = init;
		}
	}

	// Get table data - returns cached data or undefined if not loaded
	public getTable(table: string, init: any) {
		// If data is already loaded, return it
		if (this.data[table] !== undefined) {
			return this.data[table];
		}

		// If not loading yet, start loading
		if (!this.loadingPromises.has(table)) {
			const promise = this.loadTable(table, init);
			this.loadingPromises.set(table, promise);

			// Clean up the promise when done
			promise.finally(() => {
				this.loadingPromises.delete(table);
			});
		}

		// Return undefined while loading (Legend State will wait)
		return undefined;
	}

	// Get metadata - we're ignoring metadata as requested
	public getMetadata(_table: string): PersistMetadata {
		return {};
	}

	// Set data with changes
	public set(table: string, changes: Change[]): void {
		if (!this.data[table]) {
			this.data[table] = {};
		}
		this.data[table] = applyChanges(this.data[table], changes);
		this.save(table);
	}

	// Set metadata - we're ignoring metadata as requested
	public setMetadata(_table: string, _metadata: PersistMetadata): void {
		// No-op as requested
	}

	// Delete table
	public deleteTable(table: string): void {
		delete this.data[table];
		const key = this.getKey(table) as `sync:${string}`;

		// Fire and forget - don't await
		storage.removeItem(key).catch((error) => {
			console.error('[legend-state] Failed to delete table', table, error);
		});
	}

	// Delete metadata - we're ignoring metadata as requested
	public deleteMetadata(_table: string): void {
		// No-op as requested
	}

	// Private save method
	private save(table: string): void {
		const v = this.data[table];
		const key = this.getKey(table) as `sync:${string}`;

		if (v !== undefined && v !== null) {
			// Fire and forget - don't await
			// storage.setItem(key, safeStringify(v)).catch((error) => {
			// 	console.error('[legend-state] Failed to save table', table, error);
			// });
			try {
				// Clone the object to remove any circular references or non-serializable data
				const cleanData = this.cleanForStorage(v);
				const stringified = safeStringify(cleanData);

				// Fire and forget - don't await
				storage.setItem(key, stringified).catch((error) => {
					console.error('[legend-state] Failed to save table', table, error);
				});
			} catch (error) {
				console.error('[legend-state] Failed to stringify data for table', table, error);
			}
		} else {
			storage.removeItem(key).catch((error) => {
				console.error('[legend-state] Failed to remove table', table, error);
			});
		}
	}

	// Clean data for storage by removing circular references and non-serializable data
	private cleanForStorage(obj: any): any {
		if (obj === null || obj === undefined) {
			return obj;
		}

		// Handle primitives
		if (typeof obj !== 'object') {
			return obj;
		}

		// Handle arrays
		if (Array.isArray(obj)) {
			return obj.map(item => this.cleanForStorage(item));
		}

		// Handle objects - filter out functions, symbols, and certain keys
		const cleaned: any = {};
		for (const key in obj) {
			// Skip non-enumerable properties, functions, symbols, and Legend State internal properties
			if (
				!Object.prototype.hasOwnProperty.call(obj, key)
				|| typeof obj[key] === 'function'
				|| typeof obj[key] === 'symbol'
				|| key === 'plugin'
				|| key === 'pluginLocal'
				|| key === 'pluginRemote'
				|| key.startsWith('_')
			) {
				continue;
			}

			cleaned[key] = this.cleanForStorage(obj[key]);
		}
		return cleaned;
	}
}
