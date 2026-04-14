import { test } from './fixtures';

test('debug snapshot', async ({ spectra }) => {
    await spectra.assertRoute('/', { timeout: 5000 });
    const snap = await spectra.bridge.getSnapshot();
    console.log('ROUTE:', JSON.stringify(snap.route));
    console.log('FOCUSED:', JSON.stringify(snap.focused));
    function walk(node: any, depth: number): void {
        const prefix = '  '.repeat(depth);
        console.log(prefix + 'id=' + node.id + ' type=' + node.type + ' focused=' + node.focused);
        if (depth < 4)
            (node.children || []).forEach((c: any) => walk(c, depth + 1));
    }
    walk(snap.tree, 0);
});
