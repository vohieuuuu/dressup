import { Link } from "wouter";
import { Facebook, Instagram, Linkedin, QrCode } from "lucide-react";

export function Footer() {
  // QR Code URL
  const qrCodeUrl = "https://placehold.co/150x150/png";
  
  return (
    <footer className="bg-gray-100 text-gray-700 pt-10 pb-6 border-t border-gray-200">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-8">
          {/* Dịch vụ khách hàng */}
          <div>
            <h4 className="text-sm font-medium uppercase mb-4">DỊCH VỤ KHÁCH HÀNG</h4>
            <ul className="space-y-2 text-sm">
              <li><Link href="#" className="hover:text-primary">Trung Tâm Trợ Giúp Shopee</Link></li>
              <li><Link href="#" className="hover:text-primary">Shopee Blog</Link></li>
              <li><Link href="#" className="hover:text-primary">Shopee Mall</Link></li>
              <li><Link href="#" className="hover:text-primary">Hướng Dẫn Mua Hàng/Đặt Hàng</Link></li>
              <li><Link href="#" className="hover:text-primary">Hướng Dẫn Bán Hàng</Link></li>
              <li><Link href="#" className="hover:text-primary">Vì ShopeePlay</Link></li>
              <li><Link href="#" className="hover:text-primary">Shopee Xu</Link></li>
              <li><Link href="#" className="hover:text-primary">Đơn Hàng</Link></li>
              <li><Link href="#" className="hover:text-primary">Trả Hàng/Hoàn Tiền</Link></li>
              <li><Link href="#" className="hover:text-primary">Liên Hệ Shopee</Link></li>
              <li><Link href="#" className="hover:text-primary">Chính Sách Bảo Hành</Link></li>
            </ul>
          </div>

          {/* Về Shopee */}
          <div>
            <h4 className="text-sm font-medium uppercase mb-4">SHOPEE VIỆT NAM</h4>
            <ul className="space-y-2 text-sm">
              <li><Link href="#" className="hover:text-primary">Về Shopee</Link></li>
              <li><Link href="#" className="hover:text-primary">Tuyển Dụng</Link></li>
              <li><Link href="#" className="hover:text-primary">Điều Khoản Shopee</Link></li>
              <li><Link href="#" className="hover:text-primary">Chính Sách Bảo Mật</Link></li>
              <li><Link href="#" className="hover:text-primary">Shopee Mall</Link></li>
              <li><Link href="#" className="hover:text-primary">Kênh Người Bán</Link></li>
              <li><Link href="#" className="hover:text-primary">Flash Sale</Link></li>
              <li><Link href="#" className="hover:text-primary">Tiếp Thị Liên Kết</Link></li>
              <li><Link href="#" className="hover:text-primary">Liên Hệ Truyền Thông</Link></li>
            </ul>
          </div>

          {/* Thanh toán */}
          <div>
            <h4 className="text-sm font-medium uppercase mb-4">THANH TOÁN</h4>
            <div className="grid grid-cols-3 gap-2 mb-8">
              <div className="bg-white p-1 rounded border">
                <img src="https://down-vn.img.susercontent.com/file/d4bbea4570b93bfd5fc652ca82a262a8" alt="Visa" className="h-8 w-auto object-contain" />
              </div>
              <div className="bg-white p-1 rounded border">
                <img src="https://down-vn.img.susercontent.com/file/a0a9062ebe19b45c1ae0506f16af5c16" alt="Mastercard" className="h-8 w-auto object-contain" />
              </div>
              <div className="bg-white p-1 rounded border">
                <img src="https://down-vn.img.susercontent.com/file/38fd98e55806c3b2e4535c4e4a6c4c08" alt="JCB" className="h-8 w-auto object-contain" />
              </div>
              <div className="bg-white p-1 rounded border">
                <img src="https://down-vn.img.susercontent.com/file/bc2a874caeee705449c164be385b796c" alt="American Express" className="h-8 w-auto object-contain" />
              </div>
              <div className="bg-white p-1 rounded border">
                <img src="https://down-vn.img.susercontent.com/file/9263fa8c83628f5deff55e2a90758b06" alt="COD" className="h-8 w-auto object-contain" />
              </div>
              <div className="bg-white p-1 rounded border">
                <img src="https://down-vn.img.susercontent.com/file/0217f1d345587aa0a300e69e2195c492" alt="Shopee Pay" className="h-8 w-auto object-contain" />
              </div>
            </div>
            
            <h4 className="text-sm font-medium uppercase mb-4">ĐƠN VỊ VẬN CHUYỂN</h4>
            <div className="grid grid-cols-3 gap-2">
              <div className="bg-white p-1 rounded border">
                <img src="https://down-vn.img.susercontent.com/file/vn-50009109-159200e3e365de418aae52b840f24185" alt="SPX" className="h-8 w-auto object-contain" />
              </div>
              <div className="bg-white p-1 rounded border">
                <img src="https://down-vn.img.susercontent.com/file/77bf96a871418fbc21cc63dd39fb5f15" alt="GiaoHangNhanh" className="h-8 w-auto object-contain" />
              </div>
              <div className="bg-white p-1 rounded border">
                <img src="https://down-vn.img.susercontent.com/file/59270fb2f3fbb7cbc92fca3877edde3f" alt="ViettelPost" className="h-8 w-auto object-contain" />
              </div>
              <div className="bg-white p-1 rounded border">
                <img src="https://down-vn.img.susercontent.com/file/0d349e22ca8d4337d51d3b485d6a4f35" alt="VietNamPost" className="h-8 w-auto object-contain" />
              </div>
              <div className="bg-white p-1 rounded border">
                <img src="https://down-vn.img.susercontent.com/file/3900aefbf52b1c180ba66e5ec91190e5" alt="JT Express" className="h-8 w-auto object-contain" />
              </div>
              <div className="bg-white p-1 rounded border">
                <img src="https://down-vn.img.susercontent.com/file/6e3be504f08f88a15a28a9a447d94d3d" alt="GrabExpress" className="h-8 w-auto object-contain" />
              </div>
            </div>
          </div>

          {/* Theo dõi */}
          <div>
            <h4 className="text-sm font-medium uppercase mb-4">THEO DÕI SHOPEE</h4>
            <ul className="space-y-3 text-sm">
              <li>
                <Link href="#" className="flex items-center hover:text-primary">
                  <Facebook className="h-5 w-5 mr-2" />
                  <span>Facebook</span>
                </Link>
              </li>
              <li>
                <Link href="#" className="flex items-center hover:text-primary">
                  <Instagram className="h-5 w-5 mr-2" />
                  <span>Instagram</span>
                </Link>
              </li>
              <li>
                <Link href="#" className="flex items-center hover:text-primary">
                  <Linkedin className="h-5 w-5 mr-2" />
                  <span>LinkedIn</span>
                </Link>
              </li>
            </ul>
          </div>

          {/* App Download */}
          <div>
            <h4 className="text-sm font-medium uppercase mb-4">TẢI ỨNG DỤNG SHOPEE</h4>
            <div className="flex space-x-2">
              <div className="bg-white p-2 rounded border">
                <QrCode className="h-24 w-24" />
              </div>
              <div className="flex flex-col justify-center space-y-2">
                <div className="bg-white p-1 rounded border">
                  <img src="https://down-vn.img.susercontent.com/file/ad01628e90ddf248076685f73497c163" alt="App Store" className="h-8 w-auto object-contain" />
                </div>
                <div className="bg-white p-1 rounded border">
                  <img src="https://down-vn.img.susercontent.com/file/ae7dced05f7243d0f3171f786e123def" alt="Google Play" className="h-8 w-auto object-contain" />
                </div>
                <div className="bg-white p-1 rounded border">
                  <img src="https://down-vn.img.susercontent.com/file/35352374f39bdd03b25e7b83542b2cb0" alt="App Gallery" className="h-8 w-auto object-contain" />
                </div>
              </div>
            </div>
          </div>
        </div>
        
        <div className="mt-10 pt-6 border-t border-gray-200 text-center text-gray-500 text-xs">
          <p className="mb-3">© 2023 Shopee. Tất cả các quyền được bảo lưu.</p>
          <div className="flex flex-wrap justify-center gap-x-3 mb-4">
            <span>Quốc gia & Khu vực:</span>
            <a href="#" className="hover:text-primary">Singapore</a>|
            <a href="#" className="hover:text-primary">Indonesia</a>|
            <a href="#" className="hover:text-primary">Thái Lan</a>|
            <a href="#" className="hover:text-primary">Malaysia</a>|
            <a href="#" className="hover:text-primary">Việt Nam</a>|
            <a href="#" className="hover:text-primary">Philippines</a>|
            <a href="#" className="hover:text-primary">Brazil</a>|
            <a href="#" className="hover:text-primary">México</a>|
            <a href="#" className="hover:text-primary">Colombia</a>|
            <a href="#" className="hover:text-primary">Chile</a>|
            <a href="#" className="hover:text-primary">Đài Loan</a>
          </div>
        </div>
        
        <div className="border-t border-gray-200 pt-6 text-center">
          <div className="flex justify-center space-x-8 mb-4 text-xs text-gray-500">
            <a href="#" className="hover:text-primary">CHÍNH SÁCH BẢO MẬT</a>
            <a href="#" className="hover:text-primary">QUY CHẾ HOẠT ĐỘNG</a>
            <a href="#" className="hover:text-primary">CHÍNH SÁCH VẬN CHUYỂN</a>
            <a href="#" className="hover:text-primary">CHÍNH SÁCH TRẢ HÀNG VÀ HOÀN TIỀN</a>
          </div>
          
          <div className="flex justify-center mb-4">
            <img src="https://down-vn.img.susercontent.com/file/d4bbea4570b93bfd5fc652ca82a262a8" alt="Chứng nhận" className="h-12" />
          </div>
          
          <div className="text-xs text-gray-500 max-w-4xl mx-auto">
            <p className="mb-2">Công ty TNHH Shopee</p>
            <p className="mb-2">Địa chỉ: Tầng 4-5-6, Tòa nhà Capital Place, số 29 đường Liễu Giai, Phường Ngọc Khánh, Quận Ba Đình, Thành phố Hà Nội, Việt Nam. Tổng đài hỗ trợ: 19001221 - Email: cskh@hotro.shopee.vn</p>
            <p className="mb-2">Chịu Trách Nhiệm Quản Lý Nội Dung: Nguyễn Đức Trí - Điện thoại liên hệ: 024 73081221 (ext 4678)</p>
            <p className="mb-2">Mã số doanh nghiệp: 0106773786 do Sở Kế hoạch & Đầu tư TP Hà Nội cấp lần đầu ngày 10/02/2015</p>
            <p>© 2015 - Bản quyền thuộc về Công ty TNHH Shopee</p>
          </div>
        </div>
      </div>
    </footer>
  );
}
