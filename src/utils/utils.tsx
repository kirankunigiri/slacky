import { syncState } from '@legendapp/state';
import { useValue } from '@legendapp/state/react';
import { ComponentType } from 'react';

import { featureUsageCounts$, settings$ } from '@/utils/store';

/** Hides children until storage is loaded to prevent flicker/jank with default values being used first */
export function withStorageLoaded<P extends object>(Component: ComponentType<P>) {
	return function WrappedComponent(props: P) {
		const settingsState$ = syncState(settings$);
		const featureUsageState$ = syncState(featureUsageCounts$);
		const isSettingsLoaded = useValue(settingsState$.isLoaded);
		const isFeatureUsageLoaded = useValue(featureUsageState$.isLoaded);

		if (!isSettingsLoaded || !isFeatureUsageLoaded) {
			settings$.get();
			featureUsageCounts$.get();
			return null;
		}

		return <Component {...props} />;
	};
}
