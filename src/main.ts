import { initRouter } from './router';

const root = document.querySelector<HTMLElement>('#app');
if (!root) throw new Error('App root is missing.');

const dispose = initRouter(root);
if (import.meta.hot) import.meta.hot.dispose(dispose);
