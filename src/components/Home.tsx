import React, { useState, useMemo } from 'react';
import { knowledgeBase, PilatesKnowledge } from '../data/knowledge';

interface HomeProps {
  onSelectItem: (item: PilatesKnowledge) => void;
}

export default function Home({ onSelectItem }: HomeProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('all');

  // 动态生成分类列表，以便兼容后续知识库数据的随时扩展
  const dynamicCategories = useMemo(() => {
    const cats = new Set(knowledgeBase.map(item => item.category));
    const catList = Array.from(cats).map(cat => {
      let label = cat;
      if (cat.includes('-')) {
        label = cat.split('-')[1]; // 提取子类作为标签
        // 缩写常见标签以适应移动端展示空间
        if (label === '上肢与肩颈') label = '肩颈';
        if (label === '脊柱与胸廓') label = '脊柱';
        if (label === '骨盆与腰骶') label = '骨盆';
        if (label === '下肢与足踝') label = '下肢';
      } else {
        if (label === '损伤与病理') label = '损伤';
        if (label === '疑难杂症') label = '疑难';
      }
      return { id: cat, label };
    });
    return [{ id: 'all', label: '全部' }, ...catList];
  }, []);

  const filteredData = useMemo(() => {
    return knowledgeBase.filter(item => {
      const matchCategory = activeCategory === 'all' || item.category === activeCategory;
      const matchSearch = !searchQuery.trim() || 
        item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase())) ||
        item.category.toLowerCase().includes(searchQuery.toLowerCase()); // 增加分类名称的搜索权重
      return matchCategory && matchSearch;
    });
  }, [searchQuery, activeCategory]);

  return (
    <div className="h-full flex flex-col bg-lab-bg animate-[fadeIn_0.2s_ease-in]">
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
      `}</style>
      
      {/* Search Bar */}
      <div className="px-5 pt-4 pb-3 bg-white z-10">
        <div className="relative">
          <span className="iconify ph--magnifying-glass absolute left-3 top-1/2 -translate-y-1/2 text-lab-gray text-lg"></span>
          <input 
            type="text" 
            placeholder="搜索症状、部位或动作..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-lab-light border-none rounded-xl pl-10 pr-10 py-2.5 text-[14px] focus:outline-none focus:ring-1 focus:ring-lab-green transition-all shadow-sm inset-shadow-sm"
          />
          {searchQuery && (
            <button 
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-lab-gray hover:text-lab-dark"
            >
              <span className="iconify ph--x-circle-fill text-lg"></span>
            </button>
          )}
        </div>
      </div>

      {/* Category Tabs */}
      <div className="px-4 pb-3 bg-white border-b border-black/5 overflow-x-auto no-scrollbar flex items-center gap-2 flex-shrink-0">
        {dynamicCategories.map(cat => (
          <button
            key={cat.id}
            onClick={() => setActiveCategory(cat.id)}
            className={`whitespace-nowrap px-4 py-1.5 rounded-full text-[13px] font-bold transition-all ${
              activeCategory === cat.id 
                ? 'bg-lab-dark text-white shadow-md' 
                : 'bg-lab-light text-lab-gray hover:bg-gray-200'
            }`}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto px-5 py-4 space-y-3 pb-safe">
        {filteredData.length > 0 ? (
          filteredData.map(item => (
            <button 
              key={item.id}
              onClick={() => onSelectItem(item)}
              className="w-full bg-white rounded-xl p-4 flex items-center justify-between shadow-sm border border-black/[0.03] active:scale-[0.98] transition-transform text-left"
            >
              <div className="flex-1 pr-4 overflow-hidden">
                <div className="flex items-center gap-2 mb-1.5">
                  <span className="text-[10px] font-bold text-lab-green bg-lab-green/10 px-1.5 py-0.5 rounded-sm flex-shrink-0">
                    {item.category.includes('-') ? item.category.split('-')[1] : item.category}
                  </span>
                  <h3 className="text-[15px] font-bold text-lab-dark truncate">{item.name}</h3>
                </div>
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {item.tags.slice(0, 3).map(tag => (
                    <span key={tag} className="text-[11px] font-medium text-lab-gray bg-lab-bg px-2 py-0.5 rounded border border-black/5 truncate max-w-full">
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
              <span className="iconify ph--caret-right text-lab-gray text-lg opacity-50 flex-shrink-0"></span>
            </button>
          ))
        ) : (
          <div className="flex flex-col items-center justify-center py-20 text-lab-gray animate-[fadeIn_0.3s]">
            <span className="iconify ph--ghost text-4xl opacity-40 mb-3"></span>
            <p className="text-[13px] font-medium">没有找到相关内容</p>
          </div>
        )}
      </div>
    </div>
  );
}
