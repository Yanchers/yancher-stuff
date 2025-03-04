import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import App from './App.tsx';
import { store } from './store.ts';
import { Provider } from 'react-redux';
import { ConfigProvider, theme } from 'antd';

createRoot(document.getElementById('root')!).render(
    <StrictMode>
        <ConfigProvider
            theme={{
                algorithm: theme.darkAlgorithm,
            }}
        >
            <Provider store={store}>
                <App />
            </Provider>
        </ConfigProvider>
    </StrictMode>
);
