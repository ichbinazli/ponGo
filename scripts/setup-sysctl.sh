#!/bin/bash
# ─────────────────────────────────────────────
# Elasticsearch için Linux kernel parametrelerini ayarla
# Kullanım: sudo ./scripts/setup-sysctl.sh
# ─────────────────────────────────────────────

set -e

REQUIRED_MAP_COUNT=262144

echo "🔧 Elasticsearch kernel parametreleri ayarlanıyor..."

# Mevcut değeri kontrol et
CURRENT=$(cat /proc/sys/vm/max_map_count 2>/dev/null || echo 0)
echo "   Mevcut vm.max_map_count: $CURRENT"
echo "   Gereken vm.max_map_count: $REQUIRED_MAP_COUNT"

if [ "$CURRENT" -ge "$REQUIRED_MAP_COUNT" ]; then
    echo "✅ vm.max_map_count zaten yeterli."
else
    # Geçici olarak ayarla (anında etkili)
    sysctl -w vm.max_map_count=$REQUIRED_MAP_COUNT
    echo "✅ vm.max_map_count=$REQUIRED_MAP_COUNT olarak ayarlandı (geçici)."

    # Kalıcı olarak ayarla (/etc/sysctl.conf)
    if grep -q "^vm.max_map_count" /etc/sysctl.conf 2>/dev/null; then
        sed -i "s/^vm.max_map_count.*/vm.max_map_count=$REQUIRED_MAP_COUNT/" /etc/sysctl.conf
    else
        echo "vm.max_map_count=$REQUIRED_MAP_COUNT" >> /etc/sysctl.conf
    fi
    echo "✅ /etc/sysctl.conf güncellendi (kalıcı)."
fi

echo ""
echo "🎉 Tamamlandı! Artık 'make start' ile servisleri başlatabilirsiniz."
