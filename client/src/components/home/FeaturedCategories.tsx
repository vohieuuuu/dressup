import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { Category } from "@shared/schema";

export function FeaturedCategories() {
  const { data: categories = [] } = useQuery<Category[]>({
    queryKey: ["/api/categories"],
  });

  const fallbackCategories = [
    { id: 1, name: "Áo sơ mi", slug: "ao-so-mi", image: "https://images.unsplash.com/photo-1551488831-00ddcb6c6bd3?ixlib=rb-4.0.3" },
    { id: 2, name: "Quần jean", slug: "quan-jean", image: "https://images.unsplash.com/photo-1584370848010-d7fe6bc767ec?ixlib=rb-4.0.3" },
    { id: 3, name: "Váy đầm", slug: "vay-dam", image: "https://images.unsplash.com/photo-1618932260643-eee4a2f652a6?ixlib=rb-4.0.3" },
    { id: 4, name: "Áo thun", slug: "ao-thun", image: "https://images.unsplash.com/photo-1588850561407-ed78c282e89b?ixlib=rb-4.0.3" },
    { id: 5, name: "Giày", slug: "giay", image: "https://images.unsplash.com/photo-1606107557195-0e29a4b5b4aa?ixlib=rb-4.0.3" },
    { id: 6, name: "Phụ kiện", slug: "phu-kien", image: "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?ixlib=rb-4.0.3" }
  ];

  // Use fetched categories or fallback if fetch is loading/failed
  const displayCategories = categories.length > 0 ? categories : fallbackCategories;

  return (
    <section className="bg-white py-8">
      <div className="container mx-auto px-4">
        <h2 className="heading text-2xl font-semibold mb-6">Danh mục nổi bật</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
          {displayCategories.map((category) => (
            <Link key={category.id} href={`/?category=${category.slug}`}>
              <a className="group">
                <div className="bg-neutral-100 rounded-lg overflow-hidden aspect-square relative">
                  <img 
                    src={category.image} 
                    alt={category.name} 
                    className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                  />
                </div>
                <p className="mt-2 text-center font-medium">{category.name}</p>
              </a>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
