import { create } from 'zustand'
import { persist } from 'zustand/middleware'

const useAuthStore = create(
  persist(
    (set, get) => ({
      user: null,          // { id, full_name, role }
      accessToken: null,
      refreshToken: null,
      isAuthenticated: false,

      login: ({ access_token, refresh_token, user_id, full_name, role }) => {
        set({
          accessToken: access_token,
          refreshToken: refresh_token,
          user: { id: user_id, full_name, role },
          isAuthenticated: true,
        })
      },

      logout: () => {
        set({ user: null, accessToken: null, refreshToken: null, isAuthenticated: false })
      },

      updateTokens: (access_token, refresh_token) => {
        set({ accessToken: access_token, refreshToken: refresh_token })
      },

      // Role helpers
      isAdmin: () => get().user?.role === 'admin',
      isSalesManager: () => get().user?.role === 'sales_manager',
      isSalesExec: () => get().user?.role === 'sales_executive',
      isHR: () => get().user?.role === 'hr_executive',
      canManageLeads: () => ['admin', 'sales_manager', 'sales_executive'].includes(get().user?.role),
      canConvertLead: () => ['admin', 'sales_manager'].includes(get().user?.role),
      canManageHR: () => ['admin', 'hr_executive'].includes(get().user?.role),
      canManageUsers: () => get().user?.role === 'admin',
    }),
    {
      name: 'minicrm-auth',
      partialize: (state) => ({
        user: state.user,
        accessToken: state.accessToken,
        refreshToken: state.refreshToken,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
)

export default useAuthStore
