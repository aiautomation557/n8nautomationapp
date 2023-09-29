import path from 'path';
import { realpath, access } from 'fs/promises';

import type { LoadNodesAndCredentials } from '@/LoadNodesAndCredentials';
import type { Push } from '@/push';

export const reloadNodesAndCredentials = async (
	loadNodesAndCredentials: LoadNodesAndCredentials,
	push: Push,
) => {
	const { default: debounce } = await import('lodash/debounce');
	// eslint-disable-next-line import/no-extraneous-dependencies
	const { watch } = await import('chokidar');

	Object.values(loadNodesAndCredentials.loaders).forEach(async (loader) => {
		try {
			await access(loader.directory);
		} catch {
			// If directory doesn't exist, there is nothing to watch
			return;
		}

		const realModulePath = path.join(await realpath(loader.directory), path.sep);
		const reloader = debounce(async () => {
			const modulesToUnload = Object.keys(require.cache).filter((filePath) =>
				filePath.startsWith(realModulePath),
			);
			modulesToUnload.forEach((filePath) => {
				delete require.cache[filePath];
			});

			loader.reset();
			await loader.loadAll();
			await loadNodesAndCredentials.postProcessLoaders();
			push.send('nodeDescriptionUpdated', undefined);
		}, 100);

		const toWatch = loader.isLazyLoaded
			? ['**/nodes.json', '**/credentials.json']
			: ['**/*.js', '**/*.json'];
		watch(toWatch, { cwd: realModulePath }).on('change', reloader);
	});
};
