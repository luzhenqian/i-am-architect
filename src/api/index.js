import http from "../utils/http";

const api = {
  autoLogin: async ({ fingerprint }) => {
    try {
      const response = await http.post('/auth/auto-login',
        {
          fingerprint
        });

      return response;
    } catch (error) {
      console.error('Auto login error:', error);
      throw error;
    }
  }
};

export default api;