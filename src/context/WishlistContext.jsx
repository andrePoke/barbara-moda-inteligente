import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './AuthContext';

const WishlistContext = createContext();

export function WishlistProvider({ children }) {
  const { user, token } = useAuth();
  const [wishlistIds, setWishlistIds] = useState(() => {
    try {
      const saved = localStorage.getItem('bmi_wishlist');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // Sync with backend if logged in
  useEffect(() => {
    async function loadWishlist() {
      if (token && user) {
        try {
          const res = await fetch('/api/products/user/wishlist', {
            headers: { Authorization: `Bearer ${token}` }
          });
          if (res.ok) {
            const data = await res.json();
            const ids = (data.wishlist || []).map(p => p.id);
            setWishlistIds(ids);
            localStorage.setItem('bmi_wishlist', JSON.stringify(ids));
          }
        } catch (err) {
          console.error('Error fetching wishlist:', err);
        }
      }
    }
    loadWishlist();
  }, [token, user]);

  const toggleWishlist = async (productId) => {
    const isSaved = wishlistIds.includes(productId);
    let nextIds;
    if (isSaved) {
      nextIds = wishlistIds.filter(id => id !== productId);
    } else {
      nextIds = [...wishlistIds, productId];
    }
    setWishlistIds(nextIds);
    localStorage.setItem('bmi_wishlist', JSON.stringify(nextIds));

    // If logged in, update on server
    if (token) {
      try {
        await fetch(`/api/products/${productId}/wishlist`, {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}` }
        });
      } catch (err) {
        console.error('Error syncing wishlist with server:', err);
      }
    }
  };

  const isWishlisted = (productId) => wishlistIds.includes(productId);

  return (
    <WishlistContext.Provider value={{
      wishlistIds,
      toggleWishlist,
      isWishlisted,
      count: wishlistIds.length
    }}>
      {children}
    </WishlistContext.Provider>
  );
}

export function useWishlist() {
  return useContext(WishlistContext);
}
