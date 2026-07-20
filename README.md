# Vocamira

Web tabanlı, oyunlaştırılmış İngilizce kelime öğrenme ve test uygulaması.

## İlk sürüm

Bu sürümde kullanıcıya rastgele İngilizce kelimeler gösterilir ve dört Türkçe anlam seçeneğinden doğru olanı seçmesi istenir.

### Özellikler

- 10 soruluk kelime testi
- Dört seçenekli cevap yapısı
- Anında doğru ve yanlış geri bildirimi
- Test sonu puan ve başarı mesajı
- Mobil uyumlu sade arayüz
- JSON tabanlı kelime verisi

## Proje yapısı

```text
Vocamira/
├── index.html
├── assets/
│   ├── css/
│   │   └── style.css
│   └── js/
│       └── quiz.js
└── data/
    └── words.json
```

## Çalıştırma

JSON verileri `fetch` ile yüklendiği için projeyi doğrudan dosyaya çift tıklayarak değil, bir yerel sunucu üzerinden çalıştırın.

VS Code kullanıyorsanız **Live Server** eklentisiyle `index.html` dosyasını açabilirsiniz. Proje ayrıca GitHub Pages üzerinde yayınlanabilir.

## Planlanan geliştirmeler

- Türkçeden İngilizceye test modu
- Cümle tamamlama modu
- Seviye ve kategori seçimi
- Yanlış yapılan kelimelerin tekrar edilmesi
- Firebase kullanıcı hesabı ve ilerleme kaydı
- Aralıklı tekrar sistemi
