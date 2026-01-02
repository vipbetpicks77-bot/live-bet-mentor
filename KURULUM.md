# Live Bet Mentor - Kurulum Rehberi

Bu projeyi kendi bilgisayarınızda veya arkadaşınızın bilgisayarında çalıştırmak için aşağıdaki adımları takip edin.

## 1. Gereksinimler
Uygulamanın çalışması için bilgisayarınızda şunların yüklü olması gerekir:
- **Node.js**: [https://nodejs.org/](https://nodejs.org/) (LTS versiyonu önerilir)
- **Python 3.x**: [https://www.python.org/](https://www.python.org/) (Kurulumda "Add Python to PATH" seçeneğini işaretlemeyi unutmayın!)
- **Google Chrome**: Scraper'ın çalışması için Chrome yüklü olmalıdır.

## 2. Kurulum ve Çalıştırma
Projeyi ilk kez çalıştırırken:

1. Proje klasörünü açın.
2. `baslat.bat` dosyasına çift tıklayın.
3. İlk seferde gerekli kütüphaneleri otomatik olarak yükleyecektir (bu işlem birkaç dakika sürebilir).
4. Kurulum bittiğinde tarayıcınızda uygulama otomatik olarak açılacaktır.

## 3. Notlar
- Eğer `.env` dosyanız yoksa, `.env.example` dosyasının adını `.env` olarak değiştirin ve gerekli API anahtarlarını ekleyin.
- Herhangi bir hata alırsanız, `server/proxy.log` veya `server/scraper.log` dosyalarını kontrol ederek sorunu anlayabilirsiniz.
