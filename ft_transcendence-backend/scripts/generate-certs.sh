#!/bin/bash

# Generate self-signed SSL certificates for development
# Usage: ./generate-certs.sh

CERTS_DIR="./backend/certs"

# Create certs directory if not exists
mkdir -p "$CERTS_DIR"

# Generate private key and certificate
openssl req -x509 \
    -newkey rsa:4096 \
    -keyout "$CERTS_DIR/key.pem" \
    -out "$CERTS_DIR/cert.pem" \
    -days 365 \
    -nodes \
    -subj "/C=TR/ST=Istanbul/L=Istanbul/O=42Istanbul/OU=ft_transcendence/CN=localhost" \
    -addext "subjectAltName=DNS:localhost,IP:127.0.0.1"

# Set permissions
chmod 600 "$CERTS_DIR/key.pem"
chmod 644 "$CERTS_DIR/cert.pem"

echo "✅ SSL certificates generated successfully!"
echo "   Key: $CERTS_DIR/key.pem"
echo "   Cert: $CERTS_DIR/cert.pem"
