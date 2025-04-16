import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { ProductCard } from "@/components/common/ProductCard";
import { Product } from "@shared/schema";

export function FlashSale() {
  const [countdown, setCountdown] = useState({ hours: 2, minutes: 45, seconds: 33 });
  
  const { data: products = [] } = useQuery<Product[]>({
    queryKey: ["/api/products", { flashSale: true }],
    queryFn: async () => {
      const response = await fetch("/api/products?flashSale=true");
      if (!response.ok) throw new Error("Failed to fetch flash sale products");
      return response.json();
    }
  });

  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown(prev => {
        let { hours, minutes, seconds } = prev;
        
        if (seconds > 0) {
          seconds -= 1;
        } else {
          seconds = 59;
          if (minutes > 0) {
            minutes -= 1;
          } else {
            minutes = 59;
            if (hours > 0) {
              hours -= 1;
            } else {
              hours = 2; // Reset to 2 hours when countdown reaches 0
              minutes = 45;
              seconds = 33;
            }
          }
        }
        
        return { hours, minutes, seconds };
      });
    }, 1000);
    
    return () => clearInterval(timer);
  }, []);

  const formatTime = (time: number) => {
    return time < 10 ? `0${time}` : time;
  };

  return (
    <section className="bg-white py-8">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center">
            <h2 className="heading text-2xl font-semibold text-primary">Flash Sale</h2>
            <div className="ml-4 flex items-center space-x-1">
              <span className="bg-secondary text-white px-1.5 py-0.5 rounded text-sm">
                {formatTime(countdown.hours)}
              </span>
              <span>:</span>
              <span className="bg-secondary text-white px-1.5 py-0.5 rounded text-sm">
                {formatTime(countdown.minutes)}
              </span>
              <span>:</span>
              <span className="bg-secondary text-white px-1.5 py-0.5 rounded text-sm">
                {formatTime(countdown.seconds)}
              </span>
            </div>
          </div>
          <Link href="/?sale=flash">
            <a className="text-primary font-medium">Xem tất cả &gt;</a>
          </Link>
        </div>
        
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
          {products.slice(0, 5).map(product => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      </div>
    </section>
  );
}
