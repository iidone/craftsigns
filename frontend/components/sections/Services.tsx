"use client";

import { useEffect, useState, useRef } from "react";
import KeenSlider from "keen-slider";
import "keen-slider/keen-slider.min.css";

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
  const [currentSlide, setCurrentSlide] = useState(0);
  const [slidesPerView, setSlidesPerView] = useState(5);

  const sliderRef = useRef<HTMLDivElement>(null);
  const sliderInstance = useRef<any>(null);

  useEffect(() => {
    const fetchServices = async () => {
      try {
        const response = await fetch("/api/v1/portfolio_and_services/services");
        if (!response.ok) {
          throw new Error("Failed to fetch services");
        }
        const data = await response.json();
        setServices(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Unknown error");
      } finally {
        setLoading(false);
      }
    };

    fetchServices();
  }, []);

  useEffect(() => {
    const updateSlidesPerView = () => {
      const width = window.innerWidth;
      if (width < 768) return 1;
      if (width < 1024) return 2;
      if (width < 1280) return 3;
      return 4;
    };

    const handleResize = () => {
      setSlidesPerView(updateSlidesPerView());
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    if (!sliderRef.current || services.length === 0) return;

    const slider = new KeenSlider(sliderRef.current, {
      loop: true,
      mode: "free-snap",
      slides: {
        perView: slidesPerView,
        spacing: 20,
      },
      created: (instance) => {
        sliderInstance.current = instance;
      },
      slideChanged: (instance) => {
        setCurrentSlide(instance.track.details.rel);
      },
    });

    sliderInstance.current = slider;

    return () => {
      if (sliderInstance.current) {
        sliderInstance.current.destroy();
      }
    };
  }, [services.length, slidesPerView]);

  const handleCardClick = (item: ServiceItem) => {
    setSelectedService(item);
    setIsClosing(false);
  };

  const closeModal = () => {
    setIsClosing(true);
    setTimeout(() => {
      setSelectedService(null);
      setIsClosing(false);
    }, 300);
  };

  if (loading) {
    return (
      <section id="services" className="min-h-screen bg-gradient-to-br from-slate-600 via-slate-500 to-slate-400 flex items-center justify-center">
        <div className="text-white text-2xl font-light animate-pulse">Загрузка...</div>
      </section>
    );
  }

  if (error) {
    return (
      <section id="services" className="min-h-screen bg-gradient-to-br from-slate-600 via-slate-500 to-slate-400 flex items-center justify-center">
        <div className="text-red-300 text-xl">Ошибка: {error}</div>
      </section>
    );
  }

  if (services.length === 0) {
    return (
      <section id="services" className="min-h-screen bg-gradient-to-br from-slate-600 via-slate-500 to-slate-400 flex items-center justify-center">
        <div className="text-white text-xl">Пока нет услуг</div>
      </section>
    );
  }

  return (
    <>
      <section id="services" className="md:min-h-screen py-12 md:py-20 px-4 bg-gradient-to-br from-slate-600 via-slate-500 to-slate-400 relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-32 bg-gradient-to-b from-black/20 to-transparent pointer-events-none"></div>
        <div className="absolute bottom-0 left-0 w-full h-32 bg-gradient-to-t from-black/20 to-transparent pointer-events-none"></div>
        
        <div className="relative z-10 max-w-7xl mx-auto">
          <div className="text-center mb-12 md:mb-16">
            <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white tracking-wider uppercase drop-shadow-lg">
              Наши <span className="text-amber-400">Услуги</span>
            </h2>
            <p className="text-base font-light text-slate-300 mt-2 md:mt-4">Качественно. Надежно. В срок.</p>
          </div>

          <div className="relative px-12 md:px-16">
            {/* Navigation Buttons */}
            <button
              onClick={() => sliderInstance.current?.prev()}
              className="absolute left-0 top-1/2 -translate-y-1/2 z-30 w-10 h-10 md:w-12 md:h-12 rounded-full flex items-center justify-center bg-white/20 hover:bg-white/40 text-white backdrop-blur-sm transition-all duration-300 hover:scale-110"
              aria-label="Previous"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 md:w-6 md:h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>

            {/* Slider */}
            <div ref={sliderRef} className="keen-slider">
              {services.map((item, idx) => (
                <div
                  key={item.id}
                  className="keen-slider__slide"
                  style={{
                    minHeight: "380px",
                  }}
                >
                  <div 
                    className="cursor-pointer h-full"
                    onClick={() => handleCardClick(item)}
                  >
                    <ServiceCard item={item} />
                  </div>
                </div>
              ))}
            </div>

            <button
              onClick={() => sliderInstance.current?.next()}
              className="absolute right-0 top-1/2 -translate-y-1/2 z-30 w-10 h-10 md:w-12 md:h-12 rounded-full flex items-center justify-center bg-white/20 hover:bg-white/40 text-white backdrop-blur-sm transition-all duration-300 hover:scale-110"
              aria-label="Next"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 md:w-6 md:h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>

            {/* Dots Navigation */}
            {services.length > slidesPerView && (
              <div className="flex justify-center gap-2 mt-8">
                {Array.from({ length: Math.ceil(services.length / slidesPerView) }).map((_, idx) => (
                  <button
                    key={idx}
                    onClick={() => sliderInstance.current?.moveToIdx(idx * slidesPerView)}
                    className={`h-2 rounded-full transition-all duration-300 ${
                      currentSlide === idx * slidesPerView 
                        ? "w-8 bg-amber-400" 
                        : "w-2 bg-white/50 hover:bg-white/80"
                    }`}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Modal */}
      {selectedService && (
        <div 
          className={`fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-md p-4 ${
            isClosing ? 'animate-fade-out' : 'animate-fade-in'
          }`}
          onClick={closeModal}
        >
          <button 
            className="absolute top-4 right-4 w-12 h-12 rounded-full bg-white/20 hover:bg-white/40 flex items-center justify-center text-white transition-all hover:scale-110 z-10"
            onClick={closeModal}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
          
          <div 
            className={`max-w-[90vw] max-h-[90vh] relative ${
              isClosing ? 'animate-scale-out' : 'animate-scale-in'
            }`}
            onClick={(e) => e.stopPropagation()}
          >
            <img
              src={selectedService.photo_url ? `/api${selectedService.photo_url}` : "/images/paper-texture.jpg"}
              alt={selectedService.name}
              className="max-w-full max-h-[80vh] object-contain rounded-lg shadow-2xl"
            />
            <div className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-black/80 to-transparent rounded-b-lg">
              <h3 className="text-2xl md:text-3xl font-bold text-white mb-2">{selectedService.name}</h3>
              {selectedService.description && (
                <p className="text-slate-300 mb-4">{selectedService.description}</p>
              )}
              {selectedService.price && (
                <div className="text-xl md:text-2xl font-bold text-amber-400">{selectedService.price}</div>
              )}
            </div>
          </div>
        </div>
      )}

      <style jsx global>{`
        @keyframes fade-in {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }

        @keyframes fade-out {
          from {
            opacity: 1;
          }
          to {
            opacity: 0;
          }
        }

        @keyframes scale-in {
          from {
            transform: scale(0.9);
            opacity: 0;
          }
          to {
            transform: scale(1);
            opacity: 1;
          }
        }

        @keyframes scale-out {
          from {
            transform: scale(1);
            opacity: 1;
          }
          to {
            transform: scale(0.9);
            opacity: 0;
          }
        }

        .animate-fade-in {
          animation: fade-in 0.3s ease-out;
        }

        .animate-fade-out {
          animation: fade-out 0.3s ease-out;
        }

        .animate-scale-in {
          animation: scale-in 0.3s ease-out;
        }

        .animate-scale-out {
          animation: scale-out 0.3s ease-out;
        }
      `}</style>
    </>
  );
};

const ServiceCard = ({ item }: { item: ServiceItem }) => {
  const imageSrc = item.photo_url ? `/api${item.photo_url}` : "/images/paper-texture.jpg";

  return (
    <div className="group relative overflow-hidden rounded-2xl transition-all duration-500 h-full hover:shadow-amber-400/30">
      <div className="absolute inset-0 overflow-hidden">
        <img 
          src={imageSrc} 
          alt={item.name} 
          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" 
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent transition-opacity duration-500 opacity-70 group-hover:opacity-50" />
      </div>

      <div className="relative h-full flex flex-col justify-end p-5">
        <div className="transform transition-all duration-500">
          <h3 className="text-white text-lg md:text-xl font-bold mb-2 group-hover:-translate-y-1">
            {item.name}
          </h3>
          
          {item.description && (
            <p className="text-slate-300 text-sm line-clamp-2 group-hover:-translate-y-1 transition-transform duration-500">
              {item.description}
            </p>
          )}

          {item.price && (
            <div className="mt-3 text-amber-400 font-bold text-base md:text-lg group-hover:-translate-y-1 transition-transform duration-500">
              {item.price}
            </div>
          )}

          <div className="mt-4 opacity-0 transform translate-y-4 transition-all duration-500 group-hover:opacity-100 group-hover:translate-y-0">
            <span className="inline-flex items-center gap-2 text-amber-400 font-medium text-sm">
              Подробнее
              <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </span>
          </div>
        </div>
      </div>

      <div className="absolute inset-0 border-2 rounded-2xl transition-all duration-500 border-white/0 group-hover:border-amber-400/50 pointer-events-none" />
    </div>
  );
};