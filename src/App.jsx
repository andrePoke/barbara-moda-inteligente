import React, { useState, useEffect } from 'react';
import { AuthProvider } from './context/AuthContext';
import { CartProvider } from './context/CartContext';
import { WishlistProvider } from './context/WishlistContext';
import { SettingsProvider } from './context/SettingsContext';

import AnnouncementBar from './components/AnnouncementBar';
import Header from './components/Header';
import CartDrawer from './components/CartDrawer';
import WhatsAppFloat from './components/WhatsAppFloat';
import Footer from './components/Footer';

// Pages
import HomePage from './pages/HomePage';
import CatalogPage from './pages/CatalogPage';
import ProductDetailPage from './pages/ProductDetailPage';
import CheckoutPage from './pages/CheckoutPage';
import OrderConfirmationPage from './pages/OrderConfirmationPage';
import AccountPage from './pages/AccountPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import ForgotPasswordPage from './pages/ForgotPasswordPage';
import AdminPanelPage from './pages/AdminPanelPage';
import InitialSetupPage from './pages/InitialSetupPage';
import { PrivacyPolicyPage, TermsPage, ExchangePage, ShippingInfoPage } from './pages/InstitutionalPages';

function AppContent() {
  const [currentRoute, setCurrentRoute] = useState('home');
  const [routeParams, setRouteParams] = useState({});
  const [lastOrder, setLastOrder] = useState(null);
  const [lastPaymentDetails, setLastPaymentDetails] = useState(null);
  const [needsSetup, setNeedsSetup] = useState(false);
  const [checkingSetup, setCheckingSetup] = useState(true);

  useEffect(() => {
    async function checkSetup() {
      try {
        const res = await fetch('/api/auth/setup-status');
        if (res.ok) {
          const data = await res.json();
          setNeedsSetup(data.needsSetup);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setCheckingSetup(false);
      }
    }
    checkSetup();
  }, []);

  const navigateTo = (route, params = {}) => {
    setCurrentRoute(route);
    setRouteParams(params);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleOrderSuccess = (order, paymentDetails) => {
    setLastOrder(order);
    setLastPaymentDetails(paymentDetails);
    navigateTo('order-confirmation');
  };

  if (checkingSetup) {
    return (
      <div className="min-h-screen bg-brand-50 flex items-center justify-center">
        <div className="font-serif text-lg text-brand-900 animate-pulse">Carregando Barbara Moda Inteligente...</div>
      </div>
    );
  }

  if (needsSetup) {
    return <InitialSetupPage onComplete={() => setNeedsSetup(false)} />;
  }

  return (
    <div className="min-h-screen flex flex-col bg-brand-50 text-brand-900 selection:bg-brand-wine selection:text-white">
      {/* Top Announcement Bar (Configurable in Admin) */}
      <AnnouncementBar />

      {/* Main Header */}
      <Header onNavigate={navigateTo} currentRoute={currentRoute} />

      {/* Slide-in Shopping Bag */}
      <CartDrawer onNavigate={navigateTo} />

      {/* Page Content */}
      <main className="flex-1">
        {currentRoute === 'home' && (
          <HomePage onNavigate={navigateTo} />
        )}

        {currentRoute === 'catalog' && (
          <CatalogPage onNavigate={navigateTo} initialFilters={routeParams} />
        )}

        {currentRoute === 'product' && (
          <ProductDetailPage slug={routeParams.slug} onNavigate={navigateTo} />
        )}

        {currentRoute === 'checkout' && (
          <CheckoutPage onNavigate={navigateTo} onOrderSuccess={handleOrderSuccess} />
        )}

        {currentRoute === 'order-confirmation' && (
          <OrderConfirmationPage 
            order={lastOrder} 
            paymentDetails={lastPaymentDetails} 
            onNavigate={navigateTo} 
          />
        )}

        {currentRoute === 'account' && (
          <AccountPage initialTab={routeParams.tab || 'pedidos'} onNavigate={navigateTo} />
        )}

        {currentRoute === 'wishlist' && (
          <AccountPage initialTab="favoritos" onNavigate={navigateTo} />
        )}

        {currentRoute === 'login' && (
          <LoginPage onNavigate={navigateTo} />
        )}

        {currentRoute === 'register' && (
          <RegisterPage onNavigate={navigateTo} />
        )}

        {currentRoute === 'forgot-password' && (
          <ForgotPasswordPage onNavigate={navigateTo} />
        )}

        {currentRoute === 'admin' && (
          <AdminPanelPage onNavigate={navigateTo} />
        )}

        {/* Institutional & Legal Pages */}
        {currentRoute === 'privacy' && (
          <PrivacyPolicyPage onNavigate={navigateTo} />
        )}

        {currentRoute === 'terms' && (
          <TermsPage onNavigate={navigateTo} />
        )}

        {currentRoute === 'exchange' && (
          <ExchangePage onNavigate={navigateTo} />
        )}

        {currentRoute === 'shipping' && (
          <ShippingInfoPage onNavigate={navigateTo} />
        )}
      </main>

      {/* Floating WhatsApp Assistance */}
      <WhatsAppFloat />

      {/* Footer */}
      <Footer onNavigate={navigateTo} />
    </div>
  );
}

export default function App() {
  return (
    <SettingsProvider>
      <AuthProvider>
        <WishlistProvider>
          <CartProvider>
            <AppContent />
          </CartProvider>
        </WishlistProvider>
      </AuthProvider>
    </SettingsProvider>
  );
}
