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
        <div className="relative h-[280px] md:h-[400px] rounded-lg overflow-hidden">
          {banners.map((banner, index) => (
            <div 
              key={banner.id}
              className={`absolute inset-0 flex transition-opacity duration-500 ${index === activeIndex ? 'opacity-100 z-10' : 'opacity-0 z-0'}`}
            >
              <img 
                src={banner.image} 
                alt={banner.title} 
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-r from-black/60 to-transparent flex items-center">
                <div className="ml-8 md:ml-16 max-w-md text-white">
                  <h1 className="text-3xl md:text-5xl font-accent font-bold mb-4">{banner.title}</h1>
                  <p className="text-lg md:text-xl mb-6">{banner.description}</p>
                  <Link href={banner.link}>
                    <Button className="bg-primary text-white px-6 py-3 rounded-full font-medium hover:bg-primary/90 transition">
                      Mua ngay
                    </Button>
                  </Link>
                </div>
              </div>
            </div>
          ))}
          
          {/* Navigation arrows */}
          <button 
            onClick={handlePrevious}
            className="absolute top-1/2 left-4 z-20 -translate-y-1/2 bg-black/20 hover:bg-black/40 text-white p-2 rounded-full transition"
          >
            <ChevronLeft className="h-6 w-6" />
          </button>
          <button 
            onClick={handleNext}
            className="absolute top-1/2 right-4 z-20 -translate-y-1/2 bg-black/20 hover:bg-black/40 text-white p-2 rounded-full transition"
          >
            <ChevronRight className="h-6 w-6" />
          </button>
          
          {/* Banner Navigation Dots */}
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex space-x-2 z-20">
            {banners.map((_, index) => (
              <button 
                key={index}
                className={`w-3 h-3 rounded-full ${index === activeIndex ? 'bg-white/80' : 'bg-white/80 opacity-50'}`}
                onClick={() => setActiveIndex(index)}
              ></button>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
