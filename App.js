import React, { useState, useEffect, useRef } from 'react';
import { Activity, Utensils, Battery, BatteryCharging, Info, AlertCircle, Play, RotateCcw } from 'lucide-react';

const MetabolismSim = () => {
  // --- 狀態管理 ---
  // 0-100 的數值表示填充百分比
  const [stomachContent, setStomachContent] = useState(0);
  const [bloodSugar, setBloodSugar] = useState(50); // 理想值約 50 (代表正常血糖)
  const [glycogenStore, setGlycogenStore] = useState(30); // 肝醣 (短期儲存)
  const [fatStore, setFatStore] = useState(10); // 脂肪 (長期儲存)
  const [isDigesting, setIsDigesting] = useState(false);
  const [isExercising, setIsExercising] = useState(false);
  const [particles, setParticles] = useState([]);
  const [message, setMessage] = useState("請點擊「進食」開始觀察能量轉換過程。");
  
  // --- 常數與設定 ---
  const MAX_STOMACH = 100;
  const DIGESTION_RATE = 2;
  const ABSORPTION_RATE = 1.5;
  const BASAL_METABOLIC_RATE = 0.2; // 基礎代謝
  const EXERCISE_BURN_RATE = 3.0;
  const MAX_GLYCOGEN = 100;
  
  // --- 粒子動畫邏輯 ---
  // 產生一個唯一的 ID
  const generateId = () => Math.random().toString(36).substr(2, 9);

  // 新增粒子
  const addParticles = (count, type, startPos, endPos) => {
    const newParticles = [];
    for (let i = 0; i < count; i++) {
      newParticles.push({
        id: generateId(),
        type, // 'food', 'glucose', 'fat'
        start: startPos,
        end: endPos,
        progress: 0,
        speed: 0.01 + Math.random() * 0.01
      });
    }
    setParticles(prev => [...prev, ...newParticles]);
  };

  // --- 主要模擬循環 (Game Loop) ---
  useEffect(() => {
    const interval = setInterval(() => {
      
      // 1. 基礎代謝消耗 (優先消耗血糖，血糖不足消耗肝醣，再不足消耗脂肪)
      let energyNeeded = isExercising ? EXERCISE_BURN_RATE : BASAL_METABOLIC_RATE;
      
      // 消耗邏輯
      if (bloodSugar > 40) {
        setBloodSugar(prev => Math.max(30, prev - energyNeeded * 0.5)); // 血糖波動
        energyNeeded *= 0.5; // 剩餘需求
      }
      
      if (energyNeeded > 0 && glycogenStore > 0) {
        setGlycogenStore(prev => Math.max(0, prev - energyNeeded));
        // 視覺效果：肝醣分解為能量
        if (isExercising && Math.random() > 0.7) {
           addParticles(1, 'energy', 'liver', 'muscle');
        }
      } else if (energyNeeded > 0 && fatStore > 0) {
        setFatStore(prev => Math.max(0, prev - energyNeeded * 0.1)); // 脂肪燃燒較慢
         if (isExercising && Math.random() > 0.8) {
           addParticles(1, 'fat-burn', 'fat', 'muscle');
        }
      }

      // 2. 消化過程 (胃 -> 血液)
      if (stomachContent > 0) {
        setIsDigesting(true);
        const amountDigested = Math.min(stomachContent, DIGESTION_RATE);
        setStomachContent(prev => prev - amountDigested);
        
        // 血糖上升
        setBloodSugar(prev => prev + amountDigested * 1.2);
        
        // 產生消化粒子效果
        if (Math.random() > 0.5) {
          addParticles(1, 'glucose', 'stomach', 'blood');
        }
      } else {
        setIsDigesting(false);
      }

      // 3. 儲存過程 (胰島素作用：血液 -> 肝醣 -> 脂肪)
      if (bloodSugar > 60) { // 血糖過高，開始儲存
        const excessSugar = bloodSugar - 60;
        const storageRate = ABSORPTION_RATE;
        
        let amountToStore = Math.min(excessSugar, storageRate);
        
        // 降低血糖
        setBloodSugar(prev => prev - amountToStore);

        // 優先存入肝醣
        if (glycogenStore < MAX_GLYCOGEN) {
          setGlycogenStore(prev => Math.min(MAX_GLYCOGEN, prev + amountToStore));
          if (Math.random() > 0.5) addParticles(1, 'store-glycogen', 'blood', 'liver');
          setMessage("胰島素分泌中：正在將葡萄糖轉化為肝醣儲存。");
        } else {
          // 肝醣滿了，轉化為脂肪 (De novo lipogenesis)
          setFatStore(prev => prev + amountToStore * 0.8); // 轉換損耗
          if (Math.random() > 0.5) addParticles(1, 'store-fat', 'blood', 'fat');
          setMessage("肝醣庫已滿！多餘熱量正在轉化為脂肪堆積。");
        }
      } else if (stomachContent === 0 && !isExercising) {
        setMessage("身體處於平衡狀態。");
      } else if (isExercising) {
        setMessage("運動中：正在消耗肝醣與燃燒脂肪。");
      }

      // 4. 更新粒子位置
      setParticles(prevParticles => 
        prevParticles
          .map(p => ({ ...p, progress: p.progress + p.speed }))
          .filter(p => p.progress < 1)
      );

    }, 50);

    return () => clearInterval(interval);
  }, [stomachContent, bloodSugar, glycogenStore, fatStore, isExercising]);

  // --- 使用者操作 ---
  const handleEat = () => {
    if (stomachContent < 80) {
      setStomachContent(prev => prev + 30);
      setMessage("攝取食物：食物進入胃部，準備消化。");
    }
  };

  const toggleExercise = () => {
    setIsExercising(!isExercising);
  };

  const resetSim = () => {
    setStomachContent(0);
    setBloodSugar(50);
    setGlycogenStore(30);
    setFatStore(10);
    setParticles([]);
    setIsExercising(false);
    setMessage("模擬已重置。");
  };

  // --- SVG 座標定義 ---
  const coords = {
    stomach: { x: 300, y: 150 },
    blood: { x: 400, y: 300 }, // 血管中心
    liver: { x: 550, y: 200 }, // 肝臟/肌肉 (肝醣)
    fat: { x: 550, y: 450 },    // 脂肪組織
    muscle: { x: 250, y: 450 }  // 消耗端
  };

  // 取得路徑座標
  const getPath = (p) => {
    const start = coords[p.start];
    const end = coords[p.end];
    // 簡單的線性插值，實際路徑可以是曲線
    const currentX = start.x + (end.x - start.x) * p.progress;
    const currentY = start.y + (end.y - start.y) * p.progress;
    
    // 為了視覺效果增加一點隨機擾動或曲線
    const archY = p.progress < 0.5 ? p.progress * 40 : (1-p.progress) * 40;
    
    return { x: currentX, y: currentY - archY }; 
  };

  return (
    <div className="min-h-screen bg-slate-50 p-4 md:p-8 font-sans text-slate-800">
      <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* 標題與說明 */}
        <div className="lg:col-span-3 mb-4">
          <h1 className="text-3xl font-bold text-slate-900 flex items-center gap-3">
            <Activity className="text-red-500" />
            身體能量代謝互動模擬
          </h1>
          <p className="text-slate-600 mt-2">
            觀察食物如何被消化，轉化為血糖，並根據身體需求儲存為肝醣或脂肪。
          </p>
        </div>

        {/* 左側控制面板 */}
        <div className="lg:col-span-1 space-y-6">
          
          {/* 狀態監控卡片 */}
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
              <Info size={20} /> 身體狀態數值
            </h2>
            
            <div className="space-y-4">
              {/* 血糖 */}
              <div>
                <div className="flex justify-between mb-1">
                  <span className="text-sm font-medium">血糖 (Blood Glucose)</span>
                  <span className="text-sm text-slate-500">{bloodSugar.toFixed(0)} mg/dL (模擬)</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2.5">
                  <div 
                    className={`h-2.5 rounded-full transition-all duration-500 ${bloodSugar > 80 ? 'bg-red-500' : bloodSugar > 60 ? 'bg-yellow-400' : 'bg-green-500'}`}
                    style={{ width: `${Math.min(100, bloodSugar)}%` }}
                  ></div>
                </div>
                <p className="text-xs text-slate-400 mt-1">
                  {bloodSugar > 70 ? "胰島素正在大量分泌" : "血糖穩定"}
                </p>
              </div>

              {/* 肝醣 */}
              <div>
                <div className="flex justify-between mb-1">
                  <span className="text-sm font-medium text-blue-700">肝醣儲存 (Glycogen)</span>
                  <span className="text-sm text-slate-500">{glycogenStore.toFixed(0)}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2.5">
                  <div 
                    className="bg-blue-600 h-2.5 rounded-full transition-all duration-500" 
                    style={{ width: `${glycogenStore}%` }}
                  ></div>
                </div>
                <p className="text-xs text-slate-400 mt-1">短期能量庫 (肝臟與肌肉)</p>
              </div>

              {/* 脂肪 */}
              <div>
                <div className="flex justify-between mb-1">
                  <span className="text-sm font-medium text-yellow-700">脂肪儲存 (Body Fat)</span>
                  <span className="text-sm text-slate-500">{fatStore.toFixed(1)} 單位</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2.5">
                  <div 
                    className="bg-yellow-500 h-2.5 rounded-full transition-all duration-500" 
                    style={{ width: `${Math.min(100, fatStore)}%` }}
                  ></div>
                </div>
                <p className="text-xs text-slate-400 mt-1">長期無限能量庫</p>
              </div>
            </div>
          </div>

          {/* 控制按鈕 */}
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 space-y-3">
             <h2 className="text-xl font-semibold mb-4">行動控制</h2>
             
             <button 
                onClick={handleEat}
                disabled={stomachContent > 90}
                className="w-full py-3 px-4 bg-orange-100 hover:bg-orange-200 text-orange-700 rounded-xl flex items-center justify-center gap-2 transition-colors disabled:opacity-50"
             >
               <Utensils size={20} /> 
               攝取高熱量食物 (吃漢堡)
             </button>

             <button 
                onClick={toggleExercise}
                className={`w-full py-3 px-4 rounded-xl flex items-center justify-center gap-2 transition-colors ${isExercising ? 'bg-red-100 text-red-700 animate-pulse' : 'bg-blue-100 text-blue-700 hover:bg-blue-200'}`}
             >
               {isExercising ? <BatteryCharging size={20} /> : <Battery size={20} />}
               {isExercising ? '停止運動' : '開始高強度運動'}
             </button>

             <button 
                onClick={resetSim}
                className="w-full py-2 px-4 border border-slate-300 text-slate-600 rounded-xl flex items-center justify-center gap-2 hover:bg-slate-50 transition-colors mt-4"
             >
               <RotateCcw size={16} /> 重置模擬
             </button>
          </div>

          {/* 即時訊息 */}
          <div className={`p-4 rounded-xl border-l-4 transition-colors ${isExercising ? 'bg-red-50 border-red-400' : bloodSugar > 70 ? 'bg-yellow-50 border-yellow-400' : 'bg-blue-50 border-blue-400'}`}>
            <div className="flex gap-3">
              <AlertCircle size={24} className="shrink-0 opacity-70" />
              <p className="text-sm font-medium leading-relaxed">
                {message}
              </p>
            </div>
          </div>
        </div>

        {/* 右側 SVG 視覺化區域 */}
        <div className="lg:col-span-2 bg-white rounded-2xl shadow-lg border border-slate-200 overflow-hidden relative">
           <svg viewBox="0 0 800 600" className="w-full h-full select-none">
              {/* 定義濾鏡與漸層 */}
              <defs>
                <linearGradient id="gradBlood" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#ff9a9e" />
                  <stop offset="100%" stopColor="#fad0c4" />
                </linearGradient>
                <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
                  <feGaussianBlur stdDeviation="2" result="blur" />
                  <feComposite in="SourceGraphic" in2="blur" operator="over" />
                </filter>
              </defs>

              {/* 連接管路 (血管/路徑) */}
              <g stroke="#e2e8f0" strokeWidth="15" fill="none" strokeLinecap="round" strokeLinejoin="round">
                {/* 胃 -> 血管 */}
                <path d="M300 180 Q 300 300 370 300" /> 
                {/* 血管 -> 肝/肌 */}
                <path d="M430 300 L 520 230" />
                {/* 血管 -> 脂肪 */}
                <path d="M400 330 L 400 450 L 520 450" />
                {/* 脂肪/肝 -> 肌肉消耗 */}
                <path d="M550 230 Q 400 230 280 420" strokeOpacity={isExercising ? 1 : 0.2} stroke="#fb7185" />
                <path d="M520 450 Q 400 500 280 480" strokeOpacity={isExercising ? 1 : 0.2} stroke="#fb7185" />
              </g>

              {/* 1. 胃部 Stomach */}
              <g transform="translate(250, 80)">
                <text x="50" y="-10" textAnchor="middle" className="text-sm font-bold fill-slate-500">胃 (消化)</text>
                <path d="M20,0 C80,0 90,80 50,100 C10,120 -10,60 20,0" fill="#ffe4e6" stroke="#fda4af" strokeWidth="3" />
                {/* 食物填充動畫 */}
                <clipPath id="stomachClip">
                    <path d="M20,0 C80,0 90,80 50,100 C10,120 -10,60 20,0" />
                </clipPath>
                <rect x="-10" y={120 - stomachContent * 1.2} width="110" height="120" fill="#fb923c" clipPath="url(#stomachClip)" opacity="0.8" className="transition-all duration-1000" />
                {stomachContent > 0 && <text x="50" y="60" textAnchor="middle" fill="white" className="text-xs">消化中...</text>}
              </g>

              {/* 2. 血管系統 Bloodstream (中央樞紐) */}
              <g transform="translate(370, 270)">
                <circle r="40" fill={bloodSugar > 70 ? "#fca5a5" : "#fecaca"} stroke="#ef4444" strokeWidth={bloodSugar > 70 ? 4 : 2} className="transition-all duration-500" />
                <text x="0" y="5" textAnchor="middle" className="text-xs font-bold fill-red-800">血管/循環</text>
                <text x="0" y="20" textAnchor="middle" className="text-[10px] fill-red-600">
                   {bloodSugar > 60 ? "胰島素↑" : "運送中"}
                </text>
              </g>

              {/* 3. 肝醣庫 Glycogen (肝臟/肌肉) */}
              <g transform="translate(520, 150)">
                <text x="60" y="-10" textAnchor="middle" className="text-sm font-bold fill-slate-500">肝臟 & 肌肉 (肝醣)</text>
                {/* 外框 */}
                <path d="M0,20 L120,20 L120,100 L0,100 Z" fill="#dbeafe" stroke="#3b82f6" strokeWidth="3" rx="10" />
                {/* 填充條 */}
                <rect x="5" y={100 - (glycogenStore * 0.8)} width="110" height={glycogenStore * 0.8} fill="#3b82f6" className="transition-all duration-500" rx="4" />
                <path d="M10,40 L40,10 L70,40 L40,70 Z" fill="none" stroke="white" opacity="0.3" transform="translate(70, 20)" />
                <text x="60" y="60" textAnchor="middle" fill={glycogenStore > 50 ? "white" : "#1e40af"} className="text-xs">
                  {glycogenStore >= 100 ? "已滿!" : "儲存能量"}
                </text>
              </g>

              {/* 4. 脂肪組織 Adipose */}
              <g transform="translate(520, 400)">
                <text x="60" y="-10" textAnchor="middle" className="text-sm font-bold fill-slate-500">脂肪組織 (長期)</text>
                {/* 蜂巢狀結構代表脂肪細胞 */}
                <path d="M10,20 L35,10 L60,20 L60,50 L35,60 L10,50 Z" fill={fatStore > 5 ? "#fde047" : "#fef9c3"} stroke="#eab308" strokeWidth="2" />
                <path d="M65,20 L90,10 L115,20 L115,50 L90,60 L65,50 Z" fill={fatStore > 20 ? "#fde047" : "#fef9c3"} stroke="#eab308" strokeWidth="2" />
                <path d="M37,55 L62,45 L87,55 L87,85 L62,95 L37,85 Z" fill={fatStore > 50 ? "#fde047" : "#fef9c3"} stroke="#eab308" strokeWidth="2" />
                <text x="60" y="110" textAnchor="middle" fill="#854d0e" className="text-xs">
                  {fatStore > 20 ? "脂肪累積中" : "儲備"}
                </text>
              </g>

              {/* 5. 運動消耗端 (肌肉活動) */}
              <g transform="translate(200, 420)">
                 <text x="50" y="-15" textAnchor="middle" className="text-sm font-bold fill-slate-500">肌肉活動</text>
                 <rect x="0" y="0" width="100" height="60" rx="8" fill={isExercising ? "#fecaca" : "#f1f5f9"} stroke={isExercising ? "#ef4444" : "#cbd5e1"} strokeWidth="3" className="transition-colors duration-300" />
                 <path d="M20,30 L80,30" stroke={isExercising ? "#ef4444" : "#94a3b8"} strokeWidth="4" strokeLinecap="round" className={isExercising ? "animate-pulse" : ""} />
                 <text x="50" y="85" textAnchor="middle" fill="#64748b" className="text-xs">
                   {isExercising ? "消耗大量 ATP" : "基礎代謝"}
                 </text>
                 {/* 閃電圖示 */}
                 {isExercising && (
                   <g transform="translate(35, 15) scale(0.8)">
                     <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" fill="#ef4444" stroke="none">
                       <animate attributeName="opacity" values="1;0.2;1" dur="0.5s" repeatCount="indefinite" />
                     </path>
                   </g>
                 )}
              </g>

              {/* 渲染粒子 */}
              {particles.map(p => {
                const pos = getPath(p);
                let color = '#fb923c'; // 食物 (橘)
                if (p.type === 'glucose') color = '#ef4444'; // 葡萄糖 (紅)
                if (p.type === 'store-glycogen') color = '#3b82f6'; // 肝醣 (藍)
                if (p.type === 'store-fat') color = '#eab308'; // 脂肪 (黃)
                
                return (
                  <circle 
                    key={p.id} 
                    cx={pos.x} 
                    cy={pos.y} 
                    r={p.type === 'food' ? 4 : 3} 
                    fill={color}
                    stroke="white"
                    strokeWidth="1"
                  />
                );
              })}

              {/* 箭頭指引流向 */}
              <defs>
                <marker id="arrow" markerWidth="10" markerHeight="10" refX="5" refY="5" orient="auto">
                  <path d="M0,0 L10,5 L0,10" fill="#94a3b8" />
                </marker>
              </defs>
              
              {/* 說明文字標籤 (連接線上的) */}
              <text x="340" y="230" className="text-[10px] fill-slate-400" transform="rotate(60 340,230)">消化吸收</text>
              <text x="480" y="270" className="text-[10px] fill-slate-400">肝醣合成</text>
              <text x="470" y="400" className="text-[10px] fill-slate-400">脂肪生成</text>

           </svg>
           
           {/* 圖例 */}
           <div className="absolute top-4 right-4 bg-white/90 p-3 rounded-lg text-xs shadow border border-slate-200 backdrop-blur-sm">
              <div className="font-bold mb-2">圖例</div>
              <div className="flex items-center gap-2 mb-1"><div className="w-3 h-3 rounded-full bg-orange-400"></div> 食物/消化</div>
              <div className="flex items-center gap-2 mb-1"><div className="w-3 h-3 rounded-full bg-red-500"></div> 血糖 (葡萄糖)</div>
              <div className="flex items-center gap-2 mb-1"><div className="w-3 h-3 rounded-full bg-blue-500"></div> 肝醣 (短期)</div>
              <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-yellow-500"></div> 脂肪 (長期)</div>
           </div>
        </div>

      </div>
    </div>
  );
};

export default MetabolismSim;
