import axios from 'axios';

const baseURL = process.env.REACT_APP_API_URL;

const http = axios.create({
  baseURL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json'
  },
  withCredentials: true
});

// 请求拦截器
http.interceptors.request.use(
  (config) => {
    // 这里可以添加统一的请求处理，比如添加token等
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// 响应拦截器
http.interceptors.response.use(
  (response) => {
    // 这里可以对响应数据做统一处理
    return response.data;
  },
  (error) => {
    // 统一的错误处理
    const errorMessage = error.response?.data?.message || '服务器错误';
    console.error('请求错误:', errorMessage);
    return Promise.reject(error);
  }
);

export const api = {
  // 生成题目
  generateQuestion: (data) => http.post('/questions/generate', data),

  // 提交答案
  submitAnswer: (data) => http.post('/questions/submit', data)
};

export default http; 