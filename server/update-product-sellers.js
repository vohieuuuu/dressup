// Script để cập nhật sellerId của các sản phẩm
// Chạy script này để phân bổ các sản phẩm hiện có cho các shop khác nhau

// Phân bổ sản phẩm từ sellerId=1 sang các shop khác
export function updateProductSellers(products, sellers) {
  // Loại bỏ sellers[0] và sellers[1] vì đã là seller mặc định
  const availableSellers = sellers.slice(1);
  
  // Lấy categories từ các sản phẩm
  const categories = [...new Set(products.map(p => p.category))];
  
  // Phân bố sản phẩm cho các shop
  return products.map((product, index) => {
    // Tính toán sellerId mới dựa trên index
    let newSellerId;
    
    // Giữ lại 50% sản phẩm cho seller 1 (số chẵn, index % 2 === 0)
    if (index % 2 === 0) {
      newSellerId = 1;
    } else {
      // Phân phối các sản phẩm còn lại cho các seller khác
      // Mỗi seller sẽ ưu tiên được phân bổ sản phẩm thuộc mainCategory của họ
      const matchingSellers = availableSellers.filter(s => 
        s.mainCategory === product.category
      );
      
      if (matchingSellers.length > 0) {
        // Nếu có seller phù hợp với category, chọn một seller ngẫu nhiên từ danh sách đó
        const randomIndex = Math.floor(Math.random() * matchingSellers.length);
        newSellerId = matchingSellers[randomIndex].userId;
      } else {
        // Nếu không có seller phù hợp, chọn ngẫu nhiên một seller
        const randomIndex = Math.floor(Math.random() * availableSellers.length);
        newSellerId = availableSellers[randomIndex].userId;
      }
    }
    
    // Cập nhật sellerId cho sản phẩm
    return {
      ...product,
      sellerId: newSellerId
    };
  });
}