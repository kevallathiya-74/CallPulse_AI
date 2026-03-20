import { create } from 'zustand';

const useUiStore = create((set) => ({
  pricingBilling: 'annual', // 'monthly' | 'annual'
  mobileMenuOpen: false,
  toastQueue: [],

  setPricingBilling: (billing) => set({ pricingBilling: billing }),
  toggleMobileMenu: () => set((s) => ({ mobileMenuOpen: !s.mobileMenuOpen })),
  closeMobileMenu: () => set({ mobileMenuOpen: false }),
}));

export default useUiStore;
