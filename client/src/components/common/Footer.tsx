import { Link } from "wouter";
import { Facebook, Instagram, Youtube } from "lucide-react";

export function Footer() {
  return (
    <footer className="bg-secondary text-white pt-12 pb-8">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div>
            <h3 className="text-xl font-heading font-semibold mb-4">FashionConnect</h3>
            <p className="text-gray-300 mb-4">Nền tảng kết nối người bán và người mua hàng thời trang hàng đầu Việt Nam.</p>
            <div className="flex space-x-4">
              <a href="#" className="text-white hover:text-accent">
                <Facebook className="h-6 w-6" />
              </a>
              <a href="#" className="text-white hover:text-accent">
                <Instagram className="h-6 w-6" />
              </a>
              <a href="#" className="text-white hover:text-accent">
                <Youtube className="h-6 w-6" />
              </a>
            </div>
          </div>
          
          <div>
            <h4 className="text-lg font-medium mb-4">Về FashionConnect</h4>
            <ul className="space-y-2 text-gray-300">
              <li><Link href="#" className="hover:text-white">Giới thiệu</Link></li>
              <li><Link href="#" className="hover:text-white">Tuyển dụng</Link></li>
              <li><Link href="#" className="hover:text-white">Điều khoản</Link></li>
              <li><Link href="#" className="hover:text-white">Chính sách bảo mật</Link></li>
              <li><Link href="#" className="hover:text-white">Kênh người bán</Link></li>
            </ul>
          </div>
          
          <div>
            <h4 className="text-lg font-medium mb-4">Hỗ trợ khách hàng</h4>
            <ul className="space-y-2 text-gray-300">
              <li><Link href="#" className="hover:text-white">Trung tâm trợ giúp</Link></li>
              <li><Link href="#" className="hover:text-white">Hướng dẫn mua hàng</Link></li>
              <li><Link href="#" className="hover:text-white">Vận chuyển</Link></li>
              <li><Link href="#" className="hover:text-white">Thanh toán</Link></li>
              <li><Link href="#" className="hover:text-white">Chính sách đổi trả</Link></li>
            </ul>
          </div>
          
          <div>
            <h4 className="text-lg font-medium mb-4">Thanh toán & Vận chuyển</h4>
            <div className="grid grid-cols-3 gap-2 mb-4">
              <div className="bg-white p-1 rounded">
                <div className="h-6 flex items-center justify-center text-xs text-secondary font-bold">VISA</div>
              </div>
              <div className="bg-white p-1 rounded">
                <div className="h-6 flex items-center justify-center text-xs text-secondary font-bold">MC</div>
              </div>
              <div className="bg-white p-1 rounded">
                <div className="h-6 flex items-center justify-center text-xs text-secondary font-bold">JCB</div>
              </div>
              <div className="bg-white p-1 rounded">
                <div className="h-6 flex items-center justify-center text-xs text-secondary font-bold">MOMO</div>
              </div>
              <div className="bg-white p-1 rounded">
                <div className="h-6 flex items-center justify-center text-xs text-secondary font-bold">VNPAY</div>
              </div>
              <div className="bg-white p-1 rounded">
                <div className="h-6 flex items-center justify-center text-xs text-secondary font-bold">COD</div>
              </div>
            </div>
            
            <h4 className="text-lg font-medium mb-2">Đơn vị vận chuyển</h4>
            <div className="grid grid-cols-3 gap-2">
              <div className="bg-white p-1 rounded">
                <div className="h-6 flex items-center justify-center text-xs text-secondary font-bold">GHN</div>
              </div>
              <div className="bg-white p-1 rounded">
                <div className="h-6 flex items-center justify-center text-xs text-secondary font-bold">GHTK</div>
              </div>
              <div className="bg-white p-1 rounded">
                <div className="h-6 flex items-center justify-center text-xs text-secondary font-bold">VTP</div>
              </div>
            </div>
          </div>
        </div>
        
        <div className="mt-12 pt-8 border-t border-gray-700 text-center text-gray-400 text-sm">
          <p>© 2023 FashionConnect. Tất cả các quyền được bảo lưu.</p>
        </div>
      </div>
    </footer>
  );
}
