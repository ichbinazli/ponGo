#!/bin/bash

# ============================================================
# ft_transcendence - Self-Signed SSL Sertifika Oluşturucu
# Kullanım: chmod +x scripts/generate-ssl.sh && ./scripts/generate-ssl.sh
# ============================================================

set -e

SSL_DIR="./nginx/ssl"
BACKEND_CERTS_DIR="./ft_transcendence-backend/backend/certs"

echo "🔐 SSL Sertifikaları Oluşturuluyor..."

# Dizinleri oluştur
mkdir -p "$SSL_DIR"
mkdir -p "$BACKEND_CERTS_DIR"

# Self-signed sertifika oluştur
openssl req -x509 \
  -newkey rsa:4096 \
  -keyout "$SSL_DIR/key.pem" \
  -out "$SSL_DIR/cert.pem" \
  -days 365 \
  -nodes \
  -subj "/C=TR/ST=Istanbul/L=Istanbul/O=ft_transcendence/OU=DevOps/CN=localhost" \
  -addext "subjectAltName=DNS:localhost,IP:127.0.0.1"

echo "✅ Nginx SSL sertifikaları oluşturuldu: $SSL_DIR/"

# Backend için de kopyala
cp "$SSL_DIR/key.pem" "$BACKEND_CERTS_DIR/key.pem"
cp "$SSL_DIR/cert.pem" "$BACKEND_CERTS_DIR/cert.pem"

echo "✅ Backend sertifikaları kopyalandı: $BACKEND_CERTS_DIR/"

# İzinleri ayarla
chmod 600 "$SSL_DIR/key.pem"
chmod 644 "$SSL_DIR/cert.pem"
chmod 600 "$BACKEND_CERTS_DIR/key.pem"
chmod 644 "$BACKEND_CERTS_DIR/cert.pem"

echo ""
echo "🎉 SSL sertifikaları hazır!"
echo "   Nginx:   $SSL_DIR/cert.pem + key.pem"
echo "   Backend: $BACKEND_CERTS_DIR/cert.pem + key.pem"
echo ""
echo "⚠️  Bu self-signed sertifika yalnızca geliştirme/test içindir."
echo "    Tarayıcı güvenlik uyarısı alabilirsiniz. SSL hatasını bypass etmek için:"
echo "    Chrome: chrome://flags → 'Allow invalid certificates for resources loaded from localhost'"
