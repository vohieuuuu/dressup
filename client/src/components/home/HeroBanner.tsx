import { useState } from "react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface BannerItem {
  id: number;
  image: string;
  title: string;
  description: string;
  link: string;
}

export function HeroBanner() {
  const [activeIndex, setActiveIndex] = useState(0);
  
  const banners: BannerItem[] = [
    {
      id: 1,
      image: "https://images.unsplash.com/photo-1445205170230-053b83016050?ixlib=rb-4.0.3&auto=format&fit=crop",
      title: "Mùa Hè Rực Rỡ",
      description: "Khám phá BST mới với ưu đãi lên đến 50%",
      link: "/?sale=summer",
    },
    {
      id: 2,
      image: "https://images.unsplash.com/photo-1490481651871-ab68de25d43d?ixlib=rb-4.0.3&auto=format&fit=crop",
      title: "Thời Trang Thu Đông",
      description: "Bộ sưu tập mới nhất đã ra mắt",
      link: "/?collection=autumn",
    },
    {
      id: 3,
      image: "https://images.unsplash.com/photo-1507679799987-c73779587ccf?ixlib=rb-4.0.3&auto=format&fit=crop",
      title: "Phong Cách Công Sở",
      description: "Thanh lịch và chuyên nghiệp",
      link: "/?style=office",
    },
  ];

  const handlePrevious = () => {
    setActiveIndex((activeIndex - 1 + banners.length) % banners.length);
  };

  const handleNext = () => {
    setActiveIndex((activeIndex + 1) % banners.length);
  };

  return (
    <section className="bg-white py-4">
      <div className="container mx-auto px-4">
        <div className="relative h-[280px] md:h-[450px] rounded-xl overflow-hidden shadow-lg border border-neutral-100">
          {banners.map((banner, index) => (
            <div 
              key={banner.id}
              className={`absolute inset-0 flex transition-all duration-700 ${index === activeIndex ? 'opacity-100 z-10' : 'opacity-0 z-0'}`}
            >
              <img 
                src={banner.image} 
                alt={banner.title} 
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-r from-black/60 to-transparent flex items-center">
                <div className="ml-8 md:ml-16 max-w-md">
                  <div className="bg-white/10 backdrop-blur-sm p-6 rounded-lg border border-white/20 shadow-xl">
                    <h1 className="elegant-text text-3xl md:text-5xl font-bold mb-4">{banner.title}</h1>
                    <p className="text-white text-lg md:text-xl mb-6">{banner.description}</p>
                    <Link href={banner.link}>
                      <Button className="elegant-gradient text-white px-8 py-3 rounded-md font-semibold hover:shadow-lg transition duration-300 uppercase tracking-wider">
                        Mua ngay
                      </Button>
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          ))}
          
          {/* Navigation arrows */}
          <button 
            onClick={handlePrevious}
            className="absolute top-1/2 left-4 z-20 -translate-y-1/2 bg-primary/20 hover:bg-primary/40 text-white p-3 rounded-full transition duration-300 hover:scale-110"
          >
            <ChevronLeft className="h-6 w-6" />
          </button>
          <button 
            onClick={handleNext}
            className="absolute top-1/2 right-4 z-20 -translate-y-1/2 bg-primary/20 hover:bg-primary/40 text-white p-3 rounded-full transition duration-300 hover:scale-110"
          >
            <ChevronRight className="h-6 w-6" />
          </button>
          
          {/* Banner Navigation Dots */}
          <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex space-x-3 z-20">
            {banners.map((_, index) => (
              <button 
                key={index}
                className={`h-2 rounded-full transition-all duration-300 ${index === activeIndex ? 'bg-primary w-8' : 'bg-white/60 w-3 hover:bg-white'}`}
                onClick={() => setActiveIndex(index)}
              ></button>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
