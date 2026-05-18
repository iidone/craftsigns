"use client";

import { useEffect, useState } from "react";
import { Eye, X } from "lucide-react";


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

  const close = () => {
    setIsClosing(true);
    window.setTimeout(() => {
      setSelectedItem(null);
      setIsClosing(false);
    }, 220);
  };


  useEffect(() => {
    const fetchPortfolio = async () => {
      try {
        const response = await fetch("/api/v1/portfolio_and_services/portfolio");
        if (!response.ok) {
          throw new Error("Не удалось загрузить портфолио");
        }
        setPortfolioItems(await response.json());
      } catch (err) {
        setError(err instanceof Error ? err.message : "Неизвестная ошибка");
      } finally {
        setLoading(false);
      }
    };

    void fetchPortfolio();
  }, []);

  return (
    <>
      <section id="portfolio" className="app-shell py-4">
        <div className="section-panel overflow-hidden p-5 sm:p-8 lg:p-10">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <div className="section-eyebrow">Портфолио</div>
              <h2 className="mt-5 text-3xl font-semibold text-white sm:text-4xl">
                Выполненные работы
              </h2>
              <p className="mt-3 max-w-2xl text-sm leading-6 text-zinc-500">
                Реальные позиции из административной части. Карточку можно открыть,
                чтобы рассмотреть изображение крупнее.
              </p>
            </div>
            <span className="rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-2 text-sm text-zinc-400">
              {loading ? "Загрузка" : `${portfolioItems.length} работ`}
            </span>
          </div>

          <StateBlock loading={loading} error={error} empty={!loading && !error && portfolioItems.length === 0} />

          {!loading && !error && portfolioItems.length > 0 && (
            <div className="portfolio-grid mt-8">
              {portfolioItems.map((item) => (
                <PortfolioCard key={item.id} item={item} onClick={setSelectedItem} />
              ))}
            </div>
          )}
        </div>
      </section>

      {(selectedItem || isClosing) && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4 backdrop-blur-md transition-all duration-200"
          style={{
            opacity: isClosing ? 0 : 1,
            transform: isClosing ? "translateY(10px) scale(0.98)" : "translateY(0) scale(1)",
          }}
          onClick={close}
        >
          <button
            className="absolute right-4 top-4 flex h-11 w-11 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.06] text-white transition hover:bg-white/10"
            onClick={close}
            type="button"
          >
            <X size={20} />
          </button>
          <div
            className="relative max-h-[90vh] max-w-[94vw] overflow-hidden rounded-[26px] border border-white/10 bg-[#0b0b0c] transition-all duration-200"
            style={{
              opacity: isClosing ? 0 : 1,
              transform: isClosing ? "translateY(10px) scale(0.98)" : "translateY(0) scale(1)",
            }}
            onClick={(event) => event.stopPropagation()}
          >
            {selectedItem ? (
              <>
                <img
                  src={selectedItem.photo_url ? `/api${selectedItem.photo_url}` : "/images/bg.jpg"}
                  alt={selectedItem.name}
                  className="max-h-[78vh] w-full object-contain"
                />
                <div className="border-t border-white/10 bg-[#0b0b0c] p-5">
                  <h3 className="text-xl font-semibold text-white">{selectedItem.name}</h3>
                  {selectedItem.description && (
                    <p className="mt-2 max-w-2xl text-sm leading-6 text-zinc-500">{selectedItem.description}</p>
                  )}
                </div>
              </>
            ) : null}
          </div>
        </div>
      )}
    </>
  );
};

const StateBlock = ({ loading, error, empty }: { loading: boolean; error: string | null; empty: boolean }) => {
  if (!loading && !error && !empty) return null;

  return (
    <div className="mt-8 rounded-[24px] border border-white/10 bg-white/[0.03] p-8 text-center text-sm text-zinc-400">
      {loading && "Загрузка работ..."}
      {error && `Ошибка: ${error}`}
      {empty && "Пока нет работ в портфолио"}
    </div>
  );
};

const PortfolioCard = ({ item, onClick }: { item: PortfolioItem; onClick: (item: PortfolioItem) => void }) => {
  const imageSrc = item.photo_url ? `/api${item.photo_url}` : "/images/bg.jpg";

  return (
    <button
      className="group overflow-hidden rounded-[24px] border border-white/10 bg-white/[0.03] text-left transition hover:border-white/20 hover:bg-white/[0.06]"
      onClick={() => onClick(item)}
      type="button"
    >
      <div className="aspect-[4/3] overflow-hidden bg-zinc-950">
        <img
          src={imageSrc}
          alt={item.name}
          className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
        />
      </div>
      <div className="p-4">
        <div className="flex items-start justify-between gap-3">
          <h3 className="text-base font-semibold text-white">{item.name}</h3>
          <Eye className="mt-0.5 shrink-0 text-zinc-500" size={18} />
        </div>
        {item.description && (
          <p className="mt-2 line-clamp-2 text-sm leading-6 text-zinc-500">{item.description}</p>
        )}
      </div>
    </button>
  );
};

export default Portfolio;
