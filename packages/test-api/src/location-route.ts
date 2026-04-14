import type { RouteState } from './types';
export function routeFromLocation(): RouteState {
    if (typeof globalThis.location === 'undefined') {
        return { pathname: '/', hash: '', search: '' };
    }
    const hash = globalThis.location.hash;
    const raw = hash.replace(/^#/, '');
    const pathname = raw === '' || raw === '/' ? '/' : raw;
    return {
        pathname,
        hash,
        search: globalThis.location.search,
    };
}
