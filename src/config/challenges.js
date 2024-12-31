export const getCodeChallenge = (level) => {
  const challenges = [
    {
      code: `function add(a, b) {
  // 这里有一个bug需要修复
  return a - b;
}`,
      verify: async (code) => {
        try {
          const fn = new Function(`
            ${code}
            return add(1, 2);
          `);
          const result = fn();
          if (result === 3) {
            return { success: true };
          }
          return { 
            success: false, 
            message: '函数返回值不正确，add(1, 2)应该返回3' 
          };
        } catch (error) {
          throw new Error('代码执行出错：' + error.message);
        }
      }
    },
    // 可以添加更多关卡
  ];

  return challenges[level] || challenges[0];
}; 