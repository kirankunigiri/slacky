import { syncState } from '@legendapp/state';
import { useValue } from '@legendapp/state/react';
import { ComponentType } from 'react';

import { settings$ } from '@/utils/store';

/** Hides children until settings are loaded to prevent flicker/jank with default values being used first */
export function withSettingsLoaded<P extends object>(Component: ComponentType<P>) {
	return function WrappedComponent(props: P) {
		const state$ = syncState(settings$);
		const isLoaded = useValue(state$.isLoaded);

		if (!isLoaded) {
			settings$.get();
			return null;
		}

		return <Component {...props} />;
	};
}
