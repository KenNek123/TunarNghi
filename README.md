# Time Portal Camera

Bản cập nhật này tinh chỉnh lại cách portal bám tay để đỡ lệch hơn và Việt hóa giao diện.

## Điểm mới

- **Hình tròn:** dùng **2 ngón trỏ** của hai tay để tính tâm và đường kính. Viền tròn bám theo hai ngón trỏ ổn định hơn cách cũ.
- **Bo góc / trái tim / ngôi sao:** dùng **2 ngón trỏ + 2 ngón cái** để ước lượng khung và kích cỡ.
  - `roundedRect`: giữ tỷ lệ chữ nhật bo góc.
  - `heart` và `star`: vẫn dùng 4 ngón để tính vị trí/kích cỡ, sau đó render shape đều hơn thay vì cố bám các góc quá sát.
- **Tiếng chụp “tách”:** phát bằng Web Audio API khi portal capture thành công.
- **Việt hóa UI:** toàn bộ màn hình chính, hướng dẫn và control panel đã chuyển sang tiếng Việt.
- **Giảm jitter:** giảm ngưỡng rung và rút ngắn thời gian giữ yên để trải nghiệm tự nhiên hơn.

## Chạy project

```bash
npm install
npm run dev
```

Mở trình duyệt tại địa chỉ mà Vite trả về, thường là:

```bash
http://localhost:5173
```

## Cách canh shape

### 1. Hình tròn
- Giơ **2 ngón trỏ**.
- App lấy **trung điểm** giữa hai đầu ngón làm tâm.
- Khoảng cách giữa hai ngón được dùng làm đường kính portal.

### 2. Hình bo góc
- Dùng **2 ngón trỏ + 2 ngón cái**.
- Mỗi tay tạo một cạnh dọc sơ bộ bằng khoảng cách giữa ngón trỏ và ngón cái.
- Khoảng cách giữa hai tay quyết định chiều ngang, còn độ mở giữa ngón trỏ/ngón cái quyết định chiều cao.

### 3. Hình trái tim / ngôi sao
- Cũng dùng **4 ngón** để xác định vị trí và kích cỡ.
- Sau khi có khung cơ sở, app ép về một vùng gần vuông để shape nhìn đẹp hơn.

## Ghi chú

- Hand tracking vẫn chạy bằng `@mediapipe/tasks-vision`.
- Sound effect được synth trực tiếp bằng Web Audio nên không cần thêm file âm thanh.
- Nếu muốn tiếp tục tối ưu, hướng tiếp theo nên là thêm **lock portal** trước khi capture và cho phép kéo/chỉnh size bằng chuột hoặc touch.
