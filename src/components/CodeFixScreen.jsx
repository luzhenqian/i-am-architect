import React, { useState, useRef } from 'react';
import Editor from "@monaco-editor/react";
import { motion } from "framer-motion";
import { IoCode, IoCheckmarkCircle, IoClose, IoTrophy } from "react-icons/io5";
import { getCodeChallenge } from '../config/challenges';
import Dialog from './Dialog';
import GridBackground from './GridBackground';

const CodeFixScreen = ({ gameState, onComplete, onSkip }) => {
  const editorRef = useRef(null);
  const [showDialog, setShowDialog] = useState(false);
  const [dialogConfig, setDialogConfig] = useState({});

  const calculateRewards = (timeTaken, codeQuality) => {
    const baseReward = 100 * (gameState.difficulty + 1);
    const timeBonus = Math.max(0, 30 - timeTaken) * 10;
    const qualityBonus = codeQuality * 50;
    
    return {
      gold: Math.floor(baseReward * 0.5 + timeBonus),
      health: Math.floor(baseReward * 0.1),
      score: baseReward + timeBonus + qualityBonus
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
    const code = editorRef.current.getValue();
    const challenge = getCodeChallenge(gameState.difficulty);

    try {
      const result = await challenge.verify(code);

      if (result.success) {
        const rewards = calculateRewards(result.timeTaken, result.codeQuality);
        setDialogConfig({
          title: '挑战成功',
          content: `恭喜你成功修复了这段远古代码！
            获得奖励：
            金币 +${rewards.gold}
            生命 +${rewards.health}
            分数 +${rewards.score}`,
          type: 'success',
          onConfirm: () => {
            setShowDialog(false);
            onComplete(rewards);
          }
        });
      } else {
        setDialogConfig({
          title: '修复失败',
          content: result.message || '代码似乎还有一些问题，请继续尝试',
          type: 'error',
          onConfirm: () => setShowDialog(false)
        });
      }
    } catch (error) {
      setDialogConfig({
        title: '运行错误',
        content: error.message,
        type: 'error',
        onConfirm: () => setShowDialog(false)
      });
    }

    setShowDialog(true);
  };

  const handleSkip = () => {
    const penalty = calculatePenalty();
    setDialogConfig({
      title: '确认跳过',
      content: `跳过这个挑战将损失：
        金币 -${penalty.gold}
        生命 -${penalty.health}
        分数 -${penalty.score}`,
      type: 'warning',
      showCancel: true,
      onConfirm: () => {
        setShowDialog(false);
        onSkip(penalty);
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
              <span className="text-gray-300">{gameState.score}</span>
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
            <Editor
              height="100%"
              defaultLanguage="javascript"
              theme="vs-dark"
              value={getCodeChallenge(gameState.difficulty).code}
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
          </div>
        </div>

        <div className="h-20 bg-gray-800/30 backdrop-blur-sm border-t border-gray-700/50 flex items-center justify-between px-6">
          <div className="text-sm text-gray-400">
            修复代码以继续游戏
          </div>
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleSubmit}
            className="flex items-center gap-2 px-6 py-3 bg-blue-500 hover:bg-blue-600 text-white rounded-lg font-medium transition-colors"
          >
            <IoCheckmarkCircle className="w-5 h-5" />
            提交修复
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