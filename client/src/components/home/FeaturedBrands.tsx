import { Link } from "wouter";

export function FeaturedBrands() {
  const brands = [
    { id: 1, name: "Brand 1", logo: "https://via.placeholder.com/150x50?text=Brand+Logo" },
    { id: 2, name: "Brand 2", logo: "https://via.placeholder.com/150x50?text=Brand+Logo" },
    { id: 3, name: "Brand 3", logo: "https://via.placeholder.com/150x50?text=Brand+Logo" },
    { id: 4, name: "Brand 4", logo: "https://via.placeholder.com/150x50?text=Brand+Logo" },
    { id: 5, name: "Brand 5", logo: "https://via.placeholder.com/150x50?text=Brand+Logo" },
    { id: 6, name: "Brand 6", logo: "https://via.placeholder.com/150x50?text=Brand+Logo" },
  ];

  return (
    <section className="bg-white py-8">
      <div className="container mx-auto px-4">
        <h2 className="heading text-2xl font-semibold mb-6">Thương hiệu nổi bật</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {brands.map(brand => (
            <Link key={brand.id} href={`/brand/${brand.id}`}>
              <a className="flex items-center justify-center border border-neutral-200 rounded-lg p-4 h-24 hover:shadow-md transition">
                <div className="text-center font-medium">
                  {brand.name}
                </div>
              </a>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
