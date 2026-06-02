"use client";

import { useEffect, useRef, useState } from "react";
import KeenSlider, { type KeenSliderInstance } from "keen-slider";
import "keen-slider/keen-slider.min.css";
import { ChevronLeft, ChevronRight, X } from "lucide-react";

interface ServiceItem {
  id: number;
  name: string;
  description: string | null;
  photo_url: string | null;
  price: string | null;
}

export const Services = () => {
  const [services, setServices] = useState<ServiceItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedService, setSelectedService] = useState<ServiceItem | null>(null);
  const [isClosing, setIsClosing] = useState(false);
  const [slidesPerView, setSlidesPerView] = useState(4);

  const close = () => {
    setIsClosing(true);
    window.setTimeout(() => {
      setSelectedService(null);
      setIsClosing(false);
    }, 220);
  };

  const sliderRef = useRef<HTMLDivElement>(null);
  const sliderInstance = useRef<KeenSliderInstance | null>(null);

  useEffect(() => {
    const fetchServices = async () => {
      try {
        const response = await fetch("/api/v1/portfolio_and_services/services");
        if (!response.ok) {
          throw new Error("Не удалось загрузить услуги");
        }
        setServices(await response.json());
      } catch (err) {
        setError(err instanceof Error ? err.message : "Неизвестная ошибка");
      } finally {
        setLoading(false);
      }
    };

    void fetchServices();
  }, []);

  useEffect(() => {
    const handleResize = () => {
      const width = window.innerWidth;
      setSlidesPerView(width < 760 ? 1 : width < 1024 ? 2 : width < 1280 ? 3 : 4);
    };

    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    if (!sliderRef.current || services.length === 0) return;

    sliderInstance.current?.destroy();
    const slider = new KeenSlider(sliderRef.current, {
      loop: services.length > slidesPerView,
      mode: "free-snap",
      slides: {
        perView: slidesPerView,
        spacing: 14,
      },
    });

    sliderInstance.current = slider;
    return () => slider.destroy();
  }, [services.length, slidesPerView]);

  return (
    <>
      <section id="services" className="app-shell py-4">
        <div className="section-panel overflow-hidden p-5 sm:p-8 lg:p-10">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <div className="section-eyebrow">Услуги</div>
              <h2 className="mt-5 text-3xl font-semibold text-white sm:text-4xl">
                Что можно заказать
              </h2>
              <p className="mt-3 max-w-2xl text-sm leading-6 text-zinc-500">
                Мы предлагаем множество услуг, которые могут войти в стоимость Вашего заказа.
              </p>
            </div>
            <div className="flex gap-2">
              <button
                className="flex h-11 w-11 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.04] text-white transition hover:bg-white/10"
                onClick={() => sliderInstance.current?.prev()}
                type="button"
              >
                <ChevronLeft size={19} />
              </button>
              <button
                className="flex h-11 w-11 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.04] text-white transition hover:bg-white/10"
                onClick={() => sliderInstance.current?.next()}
                type="button"
              >
                <ChevronRight size={19} />
              </button>
            </div>
          </div>

          <StateBlock loading={loading} error={error} empty={!loading && !error && services.length === 0} />

          {!loading && !error && services.length > 0 && (
            <div ref={sliderRef} className="keen-slider mt-8">
              {services.map((item) => (
                <div key={item.id} className="keen-slider__slide min-h-[390px]">
                  <ServiceCard item={item} onClick={setSelectedService} />
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {(selectedService || isClosing) && (
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
            {selectedService ? (
              <>
                <img
                  src={selectedService.photo_url ? `/api${selectedService.photo_url}` : "/images/bg.jpg"}
                  alt={selectedService.name}
                  className="max-h-[72vh] w-full object-contain"
                />
                <div className="border-t border-white/10 bg-[#0b0b0c] p-5">
                  <h3 className="text-xl font-semibold text-white">{selectedService.name}</h3>
                  {selectedService.description && (
                    <p className="mt-2 max-w-2xl text-sm leading-6 text-zinc-500">{selectedService.description}</p>
                  )}
                  {selectedService.price && (
                    <p className="mt-4 text-base font-semibold text-white">{selectedService.price}</p>
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
      {loading && "Загрузка услуг..."}
      {error && error}
      {empty && "Пока нет услуг"}
    </div>
  );
};

const ServiceCard = ({ item, onClick }: { item: ServiceItem; onClick: (item: ServiceItem) => void }) => {
  const imageSrc = item.photo_url ? `/api${item.photo_url}` : "/images/bg.jpg";

  return (
    <button
      className="group flex h-full w-full flex-col overflow-hidden rounded-[24px] border border-white/10 bg-white/[0.03] text-left transition hover:border-white/20 hover:bg-white/[0.06]"
      onClick={() => onClick(item)}
      type="button"
    >
      <div className="h-56 overflow-hidden bg-zinc-950">
        <img
          src={imageSrc}
          alt={item.name}
          className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
        />
      </div>
      <div className="flex flex-1 flex-col p-4">
        <h3 className="text-base font-semibold text-white">{item.name}</h3>
        {item.description && (
          <p className="mt-2 line-clamp-3 text-sm leading-6 text-zinc-500">{item.description}</p>
        )}
        {item.price && (
          <p className="mt-auto pt-5 text-sm font-semibold text-white">{item.price} ₽</p>
        )}
      </div>
    </button>
  );
};
