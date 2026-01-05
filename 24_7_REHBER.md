# 🖥️ 24 Saat Kesintisiz Çalıştırma Rehberi

Bilgisayarını robotların (scraper) verileri sürekli çekmesi için 24 saat açık bırakacaksan, sistemin sağlıklı çalışması için şu basit adımları izlemelisin:

### 1. Güç Ayarları (En Önemlisi!)
Bilgisayarının uyku moduna geçmemesi gerekir. Yoksa robotlar durur.
- **Denetim Masası > Güç Seçenekleri** kısmına git.
- **"Ekran ayarlarını değiştir"** veya **"Güç planını düzenle"** seçeneğine tıkla.
- **"Bilgisayarı uyku moduna geçir"** ayarını hem pilde hem de prizde **"HİÇBİR ZAMAN"** yap.

### 2. Robotların Başlatılması
Sistemi tek tıkla başlatmak için masaüstündeki veya klasördeki şu dosyayı kullan:
- **`baslat.bat`** dosyasına sağ tıkla ve **Yönetici Olarak Çalıştır** (daha sağlıklı olur).
- Açılan siyah pencereleri (CMD) **KAPATMA.** Bunlar arka planda robotları ve sunucuyu çalıştırır.

### 3. Tarayıcı Pencereleri (Robotlar)
Sen `baslat.bat` dediğinde robotlar (Forebet, OddsPortal vb. için) bazen Chrome pencereleri açabilir.
- Bu açılan tarayıcı pencerelerini **MANUEL OLARAK KAPATMA.** 
- Robotlar işi bitince kendileri kapatıp açar. Sen kapatırsan veri akışı kesilebilir.

### 4. İnternet ve Bağlantı
- Mümkünse bilgisayarın **Wi-Fi yerine Kablo (Ethernet)** ile bağlı olsun.
- İnternet giderse robotlar hata verir ama sistem kendini 30 saniye sonra tekrar başlatacak şekilde ayarlandı.

### 5. Verileri Kontrol Etme
Verilerin güncel olup olmadığını anlamak için:
- Dashboard (Panel) sayfasını aç.
- Sayfayı **Ctrl + Shift + R** tuşlarına basarak yenile (bu işlem eski verileri temizleyip en taze olanları getirir).
- Eğer panelde maçlar ve oranlar akıyorsa robotların çalışıyor demektir.

### 6. Haftalık Reset
Sistemin şişmemesi için:
- Haftada bir kez `baslat.bat` pencerelerini kapatıp bilgisayarı yeniden başlat (Restart) yaptıktan sonra tekrar `baslat.bat` ile açman iyi olur.

---
🚀 **Sistem hazır!** Tüm veriler artık buluta (Firebase) yedekleniyor, yani robotların burada çalışsa bile sen dünyanın her yerinden paneline girip maçları görebilirsin.
