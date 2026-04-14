import { onCleanup, onMount } from 'solid-js';
import { routeFromLocation } from './location-route';
export function createSpectraRouteTracking(): void {
    if (typeof window === 'undefined' || !window.__TEST_API__)
        return;
    onMount(() => {
        const handleHashChange = () => {
            window.__TEST_API__?._notifyRouteChange(routeFromLocation());
        };
        window.addEventListener('hashchange', handleHashChange);
        window.__TEST_API__?._notifyRouteChange(routeFromLocation());
        onCleanup(() => {
            window.removeEventListener('hashchange', handleHashChange);
        });
    });
}
