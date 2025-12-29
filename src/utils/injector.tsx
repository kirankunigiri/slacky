import React from 'react';
import ReactDOM from 'react-dom/client';

// TODO: Allow multiple React components to be injected using a single MutationObserver

export type InjectPosition = 'child-first' | 'child-last' | 'sibling-before' | 'sibling-after';

export interface InjectComponentOptions {
	parentSelector: string
	componentId: string
	Component: React.FC
	position?: InjectPosition
}

interface RenderComponentOptions {
	container: HTMLElement
	componentId: string
	Component: React.FC
	position: InjectPosition
}

/**
 * Checks recursively within added nodes to find a match with the specified selector.
 * @param node The node to start the search from.
 * @param selector The CSS selector to match.
 */
export function checkNestedNodesForSelector(node: Node, selector: string) {
	if (node.nodeType === Node.ELEMENT_NODE) {
		if ((node as HTMLElement).matches(selector)) {
			return true;
		}
		for (const child of node.childNodes) {
			if (checkNestedNodesForSelector(child, selector)) {
				return true;
			}
		}
	}
	return false;
}

/** Injects a component into the given parent */
export const injectComponent = ({ parentSelector, componentId, Component, position = 'child-last' }: InjectComponentOptions) => {
	// Initial check for the parent element on first call
	const initialParentComp = document.querySelector(parentSelector) as HTMLElement;
	const initialMyComp = document.getElementById(componentId);
	if (initialParentComp && !initialMyComp) {
		renderComponent({ container: initialParentComp, componentId, Component, position });
	}

	const observer = new MutationObserver((mutations) => {
		// Disconnect observer to prevent loop during component rendering
		observer.disconnect();

		// Get component and parent
		const parentComp = document.querySelector(parentSelector) as HTMLElement;

		// Check for the addition of the parent component in the mutations including nested nodes
		const parentAdded = mutations.some(mutation => Array.from(mutation.addedNodes).some(node => checkNestedNodesForSelector(node, parentSelector)));

		// If the parent was added, then render the component
		if (parentComp && parentAdded) renderComponent({ container: parentComp, componentId, Component, position });

		// Reconnect observer after update
		observer.observe(document.body, { childList: true, subtree: true });
	});

	// Start observer
	observer.observe(document.body, { childList: true, subtree: true });
};

/**
 * Renders a React component to the specified container
 * @param container The parent element to render the component into
 * @param componentId The CSS id assigned to the element
 * @param Component The React component to render
 * @param injectPosition Position to inject the component relative to the container
 */
const renderComponent = ({ container, componentId, Component, position }: RenderComponentOptions) => {
	console.log(`rendering component ${componentId}`);
	const root = document.createElement('div');
	root.id = `${componentId}-parent`;

	// Inject based on position
	switch (position) {
		case 'child-first':
			container.prepend(root);
			break;
		case 'child-last':
			container.appendChild(root);
			break;
		case 'sibling-before':
			container.parentNode?.insertBefore(root, container);
			break;
		case 'sibling-after':
			container.parentNode?.insertBefore(root, container.nextSibling);
			break;
	}

	ReactDOM.createRoot(root).render(
		<Component />,
	);
};
