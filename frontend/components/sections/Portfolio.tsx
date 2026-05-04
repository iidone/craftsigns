"use client";

import { useEffect, useState, useRef } from "react";

interface PortfolioItem {
  id: number;
  name: string;
  description: string | null;
  photo_url: string | null;
}

export const Portfolio = () => {
  const [portfolioItems, setPortfolioItems] = useState<PortfolioItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedItem, setSelectedItem] = useState<PortfolioItem | null>(null);
  const [isClosing, setIsClosing] = useState(false);



  useEffect(() => {
    const fetchPortfolio = async () => {
      try {
        const response = await fetch("/api/v1/portfolio_and_services/portfolio");
        if (!response.ok) {
          throw new Error("Failed to fetch portfolio");
        }
        const data = await response.json();
        setPortfolioItems(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Unknown error");
      } finally {
        setLoading(false);
      }
    };

    fetchPortfolio();
  }, []);



  const handleCardClick = (item: PortfolioItem) => {
    setSelectedItem(item);
    setIsClosing(false);
  };

  const closeModal = () => {
    setIsClosing(true);
    setTimeout(() => {
      setSelectedItem(null);
      setIsClosing(false);
    }, 300);
  };

  if (loading) {
    return (
      <section id="portfolio" className="min-h-screen bg-slate-400/95 rounded-4xl flex items-center justify-center">
        <div className="text-white text-2xl font-light">Загрузка...</div>
      </section>
    );
  }

  if (error) {
    return (
      <section id="portfolio" className="min-h-screen bg-slate-400/95 flex items-center justify-center">
        <div className="text-red-300 text-xl">Ошибка: {error}</div>
      </section>
    );
  }

  if (portfolioItems.length === 0) {
    return (
      <section id="portfolio" className="min-h-screen bg-slate-400/95 flex items-center justify-center">
        <div className="text-white text-xl">Пока нет работ в портфолио</div>
      </section>
    );
  }

  return (
    <>
  <section id="portfolio" className="min-h-[100vh] md:min-h-screen w-full mx-auto py-6 md:py-10 px-4 md:px-8 overflow-hidden relative select-none portfolio-diagonal bg-gradient-to-br from-slate-900/95 via-slate-800/80 to-slate-900/95">
        <div className="absolute top-0 left-0 w-full h-32 bg-gradient-to-b from-black/30 to-transparent z-10"></div>
        <div className="absolute bottom-0 left-0 w-full h-32 bg-gradient-to-t from-black/30 to-transparent z-10"></div>
        
        <div className="relative z-20 pt-8 pb-6 md:pb-10 text-center px-4 md:px-6">
          <h2 className="text-4xl md:text-5xl lg:text-6xl select-none font-bold text-white tracking-wider uppercase drop-shadow-2xl animate-fade-in-up">
            Наши <span className="text-amber-400">Работы</span>
          </h2>
          <p className="text-base md:text-lg select-none font-light text-slate-300 animate-fade-in-up animation-delay-200">Все наши клиенты остаются довольными.</p>
        </div>

        <div className="relative portfolio-grid mb-16 md:mb-16">
          {portfolioItems.map((item, index) => (
            <div key={item.id} className="animate-fade-in-up animation-delay-[50ms] md:animation-delay-[100ms]" style={{ animationDelay: `${index * 100}ms` }}>
              <PortfolioCard item={item} onClick={handleCardClick} />
            </div>
          ))}
        </div>
      </section>

      {selectedItem && (
        <div 
          className={`fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-md ${
            isClosing ? 'animate-fade-out' : 'animate-fade-in'
          }`}
          onClick={closeModal}
        >
          <button 
            className="absolute cursor-pointer top-4 right-4 w-12 h-12 rounded-full bg-white/20 hover:bg-white/40 flex items-center justify-center text-white transition-all z-10"
            onClick={closeModal}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
          
          <div 
            className={`max-w-[95vw] max-h-[95vh] relative ${
              isClosing ? 'animate-scale-out' : 'animate-scale-in'
            }`}
            onClick={(e) => e.stopPropagation()}
          >
            <img
              src={selectedItem.photo_url ? `/api${selectedItem.photo_url}` : "/images/paper-texture.jpg"}
              alt={selectedItem.name}
              className="max-w-full max-h-[90vh] object-contain rounded-lg shadow-2xl"
            />
            <div className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-black/80 to-transparent rounded-b-lg">
      <h3 className="text-2xl md:text-3xl font-bold text-white mb-2">{selectedItem.name}</h3>
              {selectedItem.description && (
                <p className="text-slate-300">{selectedItem.description}</p>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
};

const PortfolioCard = ({ item, onClick }: { item: PortfolioItem; onClick: (item: PortfolioItem) => void }) => {
  const imageSrc = item.photo_url ? `/api${item.photo_url}` : "/images/paper-texture.jpg";

  return (
    <div 
      className="group relative overflow-hidden rounded-3xl transition-all duration-500 shadow-xl max-w-[22rem] mx-auto h-[300px] w-full select-none cursor-pointer hover:shadow-2xl hover:shadow-amber-400/40 portfolio-card"
      onClick={() => onClick(item)}
    >
      <div className="absolute inset-0 overflow-hidden rounded-3xl">
        <img 
          src={imageSrc} 
          alt={item.name} 
          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110 select-none" 
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent transition-opacity duration-500 select-none opacity-60 group-hover:opacity-30" />
      </div>

      <div className="absolute inset-0 flex flex-col justify-end p-6 select-none">
        <h3 className="text-white mb-2 transition-all duration-500 select-none text-base md:text-lg font-bold group-hover:-translate-y-2">
          {item.name}
        </h3>
        
        {item.description && (
          <p className="text-slate-300 text-sm line-clamp-2 transform translate-y-0 transition-all duration-500 delay-75 group-hover:-translate-y-2 select-none">
            {item.description}
          </p>
        )}

        <div className="mt-4 opacity-0 transform translate-y-4 transition-all duration-500 delay-100 group-hover:opacity-100 group-hover:translate-y-0 select-none">
          <span className="inline-flex items-center gap-2 text-amber-400 font-medium text-sm select-none">
            Нажмите для просмотра
            <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </span>
        </div>
      </div>

      <div className="absolute inset-0 border-2 rounded-3xl transition-all duration-500 select-none border-transparent group-hover:border-amber-400/60" />
    </div>
  );
};

export default Portfolio;