import { useState, useEffect, useRef } from 'react';
import Spinner from '../../components/Spinner';

const STUDY_API = 'http://localhost:5003/api/study-materials';

const categoryConfig = {
  frontend:  { icon: '🎨', label: 'Frontend' },
  backend:   { icon: '⚙️', label: 'Backend' },
  database:  { icon: '🗄️', label: 'Database' },
  uiux:      { icon: '✏️', label: 'UI/UX Design' },
  other:     { icon: '📄', label: 'Other' },
};

export default function StudyMaterials() {
  const [materials, setMaterials] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState('All');
  const [highlightedId, setHighlightedId] = useState(null);
  const [highlightComplete, setHighlightComplete] = useState(false);
  const cardRefs = useRef({});

  // Fetch materials - sorted by newest first
  useEffect(() => {
    const fetchMaterials = async () => {
      try {
        const token = localStorage.getItem('token');
        const res = await fetch(STUDY_API, {
          headers: { Authorization: `Bearer ${token}` }
        });
        const data = await res.json();
        // Sort by createdAt date (newest first)
        const sortedData = [...data].sort((a, b) => {
          return new Date(b.createdAt) - new Date(a.createdAt);
        });
        console.log('📚 Sorted materials (newest first):', sortedData.map(m => ({ title: m.title, createdAt: m.createdAt, id: m._id })));
        setMaterials(sortedData);
      } catch (err) {
        console.error('Failed to fetch materials:', err);
        setError('Failed to load study materials');
      } finally {
        setLoading(false);
      }
    };
    fetchMaterials();
  }, []);

  // Handle highlight from URL parameter
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const highlight = params.get('highlight');
    
    console.log('🔍 URL highlight parameter:', highlight);
    console.log('📋 Available material IDs:', materials.map(m => m._id));
    
    if (highlight && materials.length > 0 && !highlightComplete) {
      // Check if the ID exists in materials
      const materialExists = materials.some(m => m._id === highlight);
      
      if (materialExists) {
        console.log('✅ Found matching material for ID:', highlight);
        setHighlightedId(highlight);
        
        // Find which category the material belongs to and set active category if needed
        const highlightedMaterial = materials.find(m => m._id === highlight);
        if (highlightedMaterial && highlightedMaterial.category !== activeCategory && activeCategory !== 'All') {
          // Optionally switch to the material's category
          console.log('📂 Material is in category:', highlightedMaterial.category);
        }
        
        // Wait for DOM to render then scroll and highlight
        setTimeout(() => {
          const element = cardRefs.current[highlight];
          console.log('🎯 Looking for element with ref:', highlight);
          console.log('🎯 Element found:', !!element);
          
          if (element) {
            // Scroll to element
            element.scrollIntoView({ behavior: 'smooth', block: 'center' });
            
            // Add highlight classes
            element.classList.add('ring-4', 'ring-orange-500', 'bg-orange-100', 'scale-[1.02]', 'shadow-xl');
            
            // Flash effect
            element.style.transition = 'all 0.3s ease';
            
            // Remove highlight after 4 seconds
            setTimeout(() => {
              element.classList.remove('ring-4', 'ring-orange-500', 'bg-orange-100', 'scale-[1.02]', 'shadow-xl');
              setHighlightComplete(true);
            }, 4000);
          } else {
            console.log('❌ Element NOT found for ID:', highlight);
            // Try again after a short delay
            setTimeout(() => {
              const retryElement = cardRefs.current[highlight];
              if (retryElement) {
                console.log('✅ Element found on retry!');
                retryElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
                retryElement.classList.add('ring-4', 'ring-orange-500', 'bg-orange-100', 'scale-[1.02]', 'shadow-xl');
                setTimeout(() => {
                  retryElement.classList.remove('ring-4', 'ring-orange-500', 'bg-orange-100', 'scale-[1.02]', 'shadow-xl');
                  setHighlightComplete(true);
                }, 4000);
              }
            }, 500);
          }
        }, 800);
      } else {
        console.log('❌ No material found with ID:', highlight);
        console.log('💡 Available IDs:', materials.map(m => m._id));
      }
    }
  }, [materials, highlightComplete, activeCategory]);

  const categories = ['All', 'frontend', 'backend', 'database', 'uiux', 'other'];

  const filtered = materials.filter(m => {
    const matchSearch = m.title.toLowerCase().includes(search.toLowerCase()) ||
      m.description?.toLowerCase().includes(search.toLowerCase());
    const matchCat = activeCategory === 'All' || m.category === activeCategory;
    return matchSearch && matchCat;
  });

  const getDisplayDate = (m) => {
    const isEdited = m.updatedAt && m.updatedAt !== m.createdAt;
    const date = new Date(isEdited ? m.updatedAt : m.createdAt);
    return {
      date: date.toLocaleDateString(),
      time: date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      isEdited
    };
  };

  // Clear highlight from URL without refreshing
  const clearHighlight = () => {
    const url = new URL(window.location);
    url.searchParams.delete('highlight');
    window.history.pushState({}, '', url);
    setHighlightedId(null);
    setHighlightComplete(false);
  };

  if (loading) return <Spinner message="Loading study materials..." />;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-gray-900 via-blue-900 to-gray-800 px-8 py-10">
        <div className="max-w-5xl mx-auto">
          <h1 className="text-3xl font-bold text-white mb-2">📚 Study Materials</h1>
          <p className="text-gray-400 mb-6">Access curated resources to prepare for your internship journey</p>

          {/* Search */}
          <div className="relative max-w-lg">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">🔍</span>
            <input
              type="text"
              placeholder="Search materials..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-11 pr-4 py-3 bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:border-orange-400/60 text-sm"
            />
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-8 py-8">
        {/* Clear Highlight Button */}
        {highlightedId && (
          <div className="mb-4 flex justify-end">
            <button
              onClick={clearHighlight}
              className="text-sm text-gray-500 hover:text-gray-700 bg-white px-3 py-1 rounded-full shadow-sm"
            >
              
            </button>
          </div>
        )}

        {/* Stats Row */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 mb-8 -mt-6">
          <div className="bg-white rounded-2xl shadow-sm p-4 border border-gray-100">
            <div className="text-2xl mb-1">📚</div>
            <div className="text-2xl font-bold text-gray-800">{materials.length}</div>
            <div className="text-gray-500 text-xs mt-1">Total Materials</div>
          </div>
          {Object.entries(categoryConfig).map(([key, config]) => {
            const count = materials.filter(m => m.category === key).length;
            if (count === 0) return null;
            return (
              <div key={key} className="bg-white rounded-2xl shadow-sm p-4 border border-gray-100">
                <div className="text-2xl mb-1">{config.icon}</div>
                <div className="text-2xl font-bold text-gray-800">{count}</div>
                <div className="text-gray-500 text-xs mt-1">{config.label}</div>
              </div>
            );
          })}
        </div>

        {/* Category Filter */}
        <div className="flex gap-2 mb-6 flex-wrap">
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                activeCategory === cat
                  ? 'bg-orange-500 text-white shadow-lg shadow-orange-200'
                  : 'bg-white text-gray-600 hover:bg-gray-50 border border-gray-200'
              }`}
            >
              {cat === 'All' ? '📋 All' : `${categoryConfig[cat]?.icon} ${categoryConfig[cat]?.label || cat}`}
            </button>
          ))}
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl mb-6">
            {error}
          </div>
        )}

        {filtered.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-sm p-12 text-center border border-gray-100">
            <div className="text-6xl mb-4">📭</div>
            <h3 className="text-xl font-semibold text-gray-700 mb-2">No Materials Found</h3>
            <p className="text-gray-400">Try changing your search or category filter.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filtered.map((material) => {
              const config = categoryConfig[material.category] || categoryConfig.other;
              const { date, time, isEdited } = getDisplayDate(material);
              const isHighlighted = highlightedId === material._id;
              
              return (
                <div
                  key={material._id}
                  ref={el => cardRefs.current[material._id] = el}
                  id={`material-${material._id}`}
                  className={`bg-white rounded-2xl shadow-sm border transition-all hover:shadow-md hover:border-orange-200 hover:-translate-y-0.5 overflow-hidden ${
                    isHighlighted 
                      ? 'border-orange-500 ring-4 ring-orange-300 bg-orange-100/50 scale-[1.02] shadow-xl' 
                      : 'border-gray-200'
                  }`}
                  style={{ transition: 'all 0.3s ease' }}
                >
                  {/* Card Top Banner */}
                  <div className="h-1.5 bg-gradient-to-r from-blue-900 to-blue-800"></div>

                  <div className="p-5">
                    {/* Header */}
                    <div className="flex items-start justify-between mb-3">
                      <div className="w-12 h-12 rounded-xl bg-slate-100 flex items-center justify-center text-2xl shadow-sm">
                        {config.icon}
                      </div>
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                        isHighlighted 
                          ? 'bg-orange-500 text-white' 
                          : 'bg-orange-50 text-orange-600 border border-orange-200'
                      }`}>
                        {config.label || material.category}
                      </span>
                    </div>

                    {/* Title & Description */}
                    <h3 className="text-lg font-bold text-gray-800 mb-2 line-clamp-1">{material.title}</h3>
                    <p className="text-gray-500 text-sm mb-4 line-clamp-2">
                      {material.description || 'No description available.'}
                    </p>

                    {/* Meta */}
                    <div className="flex items-center gap-2 text-xs text-gray-400 mb-4">
                      <span>📅 {date}</span>
                      <span>🕐 {time}</span>
                      {isEdited && (
                        <span className="text-orange-400 font-medium">✏️ updated</span>
                      )}
                    </div>

                    {/* Download Button */}
                    <a
                      href={material.fileUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={`flex items-center justify-center gap-2 w-full py-2.5 rounded-xl text-sm font-medium transition-all hover:shadow-lg ${
                        isHighlighted
                          ? 'bg-orange-500 hover:bg-orange-600 text-white'
                          : 'bg-blue-900 hover:bg-orange-500 text-white'
                      }`}
                    >
                      <span>⬇️</span> Download Material
                    </a>
                    
                    {/* New badge for highlighted material */}
                    {isHighlighted && (
                      <div className="mt-3 text-center">
                        <span className="inline-block px-2 py-1 bg-green-100 text-green-700 text-xs rounded-full">
                          ✨ Newly Added!
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}