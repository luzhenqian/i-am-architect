import React, { useState, useRef, useEffect } from 'react';
import Editor from "@monaco-editor/react";
import { motion } from "framer-motion";
import { IoCode, IoCheckmarkCircle, IoClose, IoTrophy } from "react-icons/io5";
import Dialog from './Dialog';
import GridBackground from './GridBackground';
import * as FingerprintJS from '@fingerprintjs/fingerprintjs';
import { api } from '../utils/http';

const CodeFixScreen = ({ gameState, onComplete, onSkip }) => {
  const editorRef = useRef(null);
  const [showDialog, setShowDialog] = useState(false);
  const [dialogConfig, setDialogConfig] = useState({});
  const [questionId, setQuestionId] = useState(null);
  const [userId, setUserId] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [code, setCode] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // 获取浏览器指纹
  useEffect(() => {
    const initFingerprint = async () => {
      try {
        const fp = await FingerprintJS.load();
        const result = await fp.get();
        setUserId(result.visitorId);
      } catch (error) {
        console.error('获取指纹失败:', error);
      }
    };

    initFingerprint();
  }, []);

  // 获取题目
  useEffect(() => {
    const fetchQuestion = async () => {
      if (!userId) return;

      setIsLoading(true);
      try {
        const response = await api.generateQuestion({
          userId,
          level: gameState.difficulty + 1
        });

        setQuestionId(response.id);
        setCode(response.content);
      } catch (error) {
        console.error('获取题目失败:', error);
        setDialogConfig({
          title: '错误',
          content: '获取题目失败，请刷新重试',
          type: 'error',
          onConfirm: () => setShowDialog(false)
        });
        setShowDialog(true);
      } finally {
        setIsLoading(false);
      }
    };

    fetchQuestion();
  }, [userId, gameState.difficulty]);

  const calculateRewards = (timeTaken, codeQuality) => {
    const baseReward = 100 * (gameState.difficulty + 1);// 基础奖励
    const timeBonus = Math.max(0, 30 - timeTaken) * 10;// 时间奖励

    return {
      gold: Math.floor(baseReward * 0.5 + timeBonus)
    };
  };

  const calculatePenalty = () => {
    const basePenalty = 50 * (gameState.difficulty + 1);
    return {
      gold: Math.floor(basePenalty * 0.3),
      health: Math.floor(basePenalty * 0.1),
      score: basePenalty
    };
  };

  const handleSubmit = async () => {
    if (!userId || !questionId || isSubmitting) return;

    setIsSubmitting(true);
    const code = editorRef.current.getValue();

    try {
      const result = await api.submitAnswer({
        userId,
        questionId,
        answer: code
      });
      const { isCorrect, reason } = result;

      if (isCorrect) {
        const rewards = calculateRewards(1, gameState.difficulty);
        setDialogConfig({
          title: '挑战成功',
          content: `恭喜你成功修复了这段远古代码！
            获得奖励：
            金币 +${rewards.gold}`,
          type: 'success',
          onConfirm: () => {
            setShowDialog(false);
            onComplete(rewards);
          }
        });
      } else {
        setDialogConfig({
          title: '修复失败',
          content: reason || '代码似乎还有一些问题，请继续尝试',
          type: 'error',
          onConfirm: () => {
            setShowDialog(false)
            onSkip(0);
          }
        });
      }
    } catch (error) {
      setDialogConfig({
        title: '运行错误',
        content: error.response?.data?.message || '服务器错误',
        type: 'error',
        onConfirm: () => setShowDialog(false)
      });
    } finally {
      setIsSubmitting(false);
    }

    setShowDialog(true);
  };

  const handleSkip = () => {
    const penalty = calculatePenalty();
    setDialogConfig({
      title: '确认跳过',
      content: `跳过这个挑战将失去奖励哦！`,
      type: 'warning',
      showCancel: true,
      onConfirm: () => {
        setShowDialog(false);
        onSkip(0);
      },
      onCancel: () => setShowDialog(false)
    });
    setShowDialog(true);
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="w-full h-screen flex flex-col relative isolate"
    >
      <GridBackground />

      <div className="relative flex flex-col flex-1">
        <div className="h-16 bg-gray-800/30 backdrop-blur-sm border-b border-gray-700/50 flex items-center px-6 justify-between">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-center justify-center">
              <IoCode className="text-blue-400 w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-white">远古代码修复挑战</h2>
              <p className="text-sm text-gray-400">遗迹 {gameState.difficulty + 1}</p>
            </div>
          </div>
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2">
              <IoTrophy className="text-yellow-400 w-5 h-5" />
            </div>
            <button
              onClick={handleSkip}
              className="text-gray-400 hover:text-gray-300 transition-colors"
            >
              <IoClose className="w-6 h-6" />
            </button>
          </div>
        </div>

        <div className="flex-1 p-6">
          <div className="h-full rounded-xl border border-gray-700/50 overflow-hidden backdrop-blur-sm bg-gray-800/20">
            {isLoading ? (
              <div className="h-full flex items-center justify-center">
                <div className="flex flex-col items-center gap-4">
                  <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                  <p className="text-gray-400">AI 正在实时从远古遗迹中提取代码...</p>
                </div>
              </div>
            ) : (
              <Editor
                height="100%"
                defaultLanguage="javascript"
                theme="vs-dark"
                value={code}
                options={{
                  fontSize: 16,
                  lineHeight: 24,
                  minimap: { enabled: false },
                  scrollBeyondLastLine: false,
                  folding: true,
                  lineNumbers: 'on',
                  renderLineHighlight: 'all',
                  automaticLayout: true,
                  padding: { top: 20 },
                  tabSize: 2,
                  wordWrap: 'on',
                  contextmenu: false,
                  smoothScrolling: true,
                  cursorBlinking: 'smooth',
                  cursorSmoothCaretAnimation: true
                }}
                onMount={(editor) => {
                  editorRef.current = editor;
                }}
              />
            )}
          </div>
        </div>

        <div className="h-20 bg-gray-800/30 backdrop-blur-sm border-t border-gray-700/50 flex items-center justify-between px-6">
          <div className="text-sm text-gray-400">
            修复代码以继续游戏
          </div>
          <motion.button
            whileHover={{ scale: isSubmitting ? 1 : 1.02 }}
            whileTap={{ scale: isSubmitting ? 1 : 0.98 }}
            onClick={handleSubmit}
            disabled={isSubmitting}
            className={`flex items-center gap-2 px-6 py-3 rounded-lg font-medium transition-colors ${isSubmitting
              ? 'bg-blue-500/50 cursor-not-allowed'
              : 'bg-blue-500 hover:bg-blue-600'
              } text-white`}
          >
            {isSubmitting ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                <span>提交中...</span>
              </>
            ) : (
              <>
                <IoCheckmarkCircle className="w-5 h-5" />
                <span>提交修复</span>
              </>
            )}
          </motion.button>
        </div>
      </div>

      {showDialog && (
        <Dialog
          {...dialogConfig}
          onClose={() => setShowDialog(false)}
        />
      )}
    </motion.div>
  );
};

export default CodeFixScreen; 