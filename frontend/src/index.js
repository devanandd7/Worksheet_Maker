import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import { AuthProvider } from './context/AuthContext';
import { WorksheetProvider } from './context/WorksheetContext';
import { ToastContainer } from 'react-toastify';
import { ClerkProvider } from '@clerk/clerk-react';
import 'react-toastify/dist/ReactToastify.css';
import 'react-quill/dist/quill.snow.css';

const clerkPubKey = process.env.REACT_APP_CLERK_PUBLISHABLE_KEY;

if (!clerkPubKey) {
    console.error('Missing Clerk Publishable Key! Add REACT_APP_CLERK_PUBLISHABLE_KEY to your .env file');
}

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
    <React.StrictMode>
        <ClerkProvider
            publishableKey={clerkPubKey}
            appearance={{
                layout: {
                    socialButtonsPlacement: 'bottom',
                    socialButtonsVariant: 'iconButton',
                    logoPlacement: 'inside',
                },
                variables: {
                    colorPrimary: '#6366f1',
                    colorText: '#1e293b',
                    colorTextSecondary: '#475569',
                    colorBackground: '#ffffff',
                    colorInputBackground: '#f8fafc',
                    colorInputText: '#1e293b',
                    borderRadius: '1rem',
                    fontFamily: '"Outfit", sans-serif',
                },
                elements: {
                    card: {
                        boxShadow: '0 8px 32px 0 rgba(31, 38, 135, 0.15)',
                        backgroundColor: 'rgba(255, 255, 255, 0.9)',
                        backdropFilter: 'blur(20px)',
                        border: '1px solid rgba(255, 255, 255, 0.5)',
                    },
                    formButtonPrimary: {
                        backgroundColor: '#6366f1',
                        fontSize: '0.95rem',
                        textTransform: 'none',
                        "&:hover": {
                            backgroundColor: '#4f46e5',
                        },
                    },
                    headerTitle: {
                        fontFamily: '"Outfit", sans-serif',
                        fontWeight: 700,
                        color: '#6366f1',
                    },
                    headerSubtitle: {
                        color: '#64748b',
                    },
                    socialButtonsIconButton: {
                        borderColor: '#e2e8f0',
                        "&:hover": {
                            backgroundColor: '#f1f5f9',
                        }
                    },
                    footerActionLink: {
                        color: '#6366f1',
                        fontWeight: 600,
                    }
                }
            }}
        >
            <AuthProvider>
                <WorksheetProvider>
                    <App />
                    <ToastContainer
                        position="top-right"
                        autoClose={3000}
                        hideProgressBar={false}
                        newestOnTop
                        closeOnClick
                        rtl={false}
                        pauseOnFocusLoss
                        draggable
                        pauseOnHover
                        theme="light"
                    />
                </WorksheetProvider>
            </AuthProvider>
        </ClerkProvider>
    </React.StrictMode>
);
