# ==============================================================
# ft_transcendence - Makefile
# Proje yönetimi için kısayol komutları
# ==============================================================

.PHONY: help setup ssl start stop restart logs clean status build remove

# Varsayılan: yardım ekranı göster
help:
	@echo ""
	@echo "╔══════════════════════════════════════════════════════╗"
	@echo "║       ft_transcendence - DevOps Komutları            ║"
	@echo "╚══════════════════════════════════════════════════════╝"
	@echo ""
	@echo "  make setup      - İlk kurulum (env + ssl + build)"
	@echo "  make ssl        - SSL sertifika oluştur"
	@echo "  make start      - Tüm servisleri başlat"
	@echo "  make stop       - Tüm servisleri durdur"
	@echo "  make restart    - Servisleri yeniden başlat"
	@echo "  make logs       - Tüm servis loglarını izle"
	@echo "  make status     - Servis durumlarını göster"
	@echo "  make build      - Docker image'larını yeniden derle"
	@echo "  make clean      - Tüm container + volume temizle"
	@echo "  make elk-setup  - ELK ILM politikasını kur"
	@echo ""
	@echo "  Servis Erişim Adresleri:"
	@echo "  ─────────────────────────────────────────────────────"
	@echo "  🌐 Uygulama:     https://localhost"
	@echo "  📊 Kibana:       http://localhost:5601"
	@echo "  📈 Grafana:      http://localhost:3001"
	@echo "  🔎 Prometheus:   http://localhost:9090"
	@echo ""

# ─────────────────────────────────────────────
# İLK KURULUM
# ─────────────────────────────────────────────

setup: ssl
	@echo "📦 Ortam dosyası hazırlanıyor..."
	@if [ ! -f .env ]; then \
		cp .env.example .env; \
		echo "✅ .env dosyası oluşturuldu. Değerleri doldurmayı unutma!"; \
	else \
		echo "ℹ️  .env dosyası zaten mevcut, atlanıyor."; \
	fi
	@echo "🐳 Docker image'ları derleniyor..."
	docker compose build
	@echo ""
	@echo "🎉 Kurulum tamamlandı! Başlatmak için: make start"

ssl:
	@chmod +x scripts/generate-ssl.sh
	@./scripts/generate-ssl.sh

# ─────────────────────────────────────────────
# SERVIS YÖNETİMİ
# ─────────────────────────────────────────────

start:
	@echo "🚀 Servisler başlatılıyor..."
	docker compose up -d
	@echo ""
	@echo "✅ Servisler çalışıyor! Durum için: make status"

stop:
	@echo "⏹️  Servisler durduruluyor..."
	docker compose down

restart:
	@echo "🔄 Servisler yeniden başlatılıyor..."
	docker compose restart

build:
	@echo "🔨 Docker image'ları yeniden derleniyor..."
	docker compose build --no-cache

status:
	@echo "📋 Servis Durumları:"
	@echo "──────────────────────────────────────────────────────"
	docker compose ps
	@echo ""
	@echo "📊 Health kontrolleri:"
	@docker compose ps --format "table {{.Name}}\t{{.Status}}" 2>/dev/null || true

logs:
	docker compose logs -f --tail=100

# Belirli servisin logları (make logs-backend)
logs-%:
	docker compose logs -f --tail=100 $*

# ─────────────────────────────────────────────
# ELK KURULUM
# ─────────────────────────────────────────────

elk-setup:
	@echo "📋 ELK ILM politikası kuruluyor..."
	@echo "⏳ Elasticsearch'in hazır olması bekleniyor..."
	@sleep 10
	@chmod +x scripts/setup-elk-ilm.sh
	@./scripts/setup-elk-ilm.sh

# ─────────────────────────────────────────────
# TEMİZLİK
# ─────────────────────────────────────────────

remove:
	@echo "🧹 Tüm container'lar temizleniyor..."
	@if [ -n "$$(docker ps -aq)" ]; then \
		docker rm -f $$(docker ps -aq); \
		echo "✅ Container'lar temizlendi."; \
	else \
		echo "ℹ️  Temizlenecek container bulunamadı."; \
	fi
	@docker compose down --remove-orphans 2>/dev/null || true

clean:
	@echo "🧹 Tüm container ve volume'lar temizleniyor..."
	@read -p "⚠️  DİKKAT: Tüm veriler silinecek! Emin misin? [y/N] " confirm; \
	if [ "$$confirm" = "y" ] || [ "$$confirm" = "Y" ]; then \
		docker compose down -v --remove-orphans; \
		echo "✅ Temizlik tamamlandı."; \
	else \
		echo "İptal edildi."; \
	fi

clean-images:
	@echo "🧹 Kullanılmayan Docker image'ları temizleniyor..."
	docker image prune -f

# ─────────────────────────────────────────────
# KONTROL VE DEBUG
# ─────────────────────────────────────────────

health:
	@echo "🏥 Servis sağlık kontrolleri:"
	@echo "─────────────────────────────────────────────"
	@echo -n "  Backend:       "; curl -sk http://localhost:3000/health 2>/dev/null | python3 -c "import sys,json; d=json.load(sys.stdin); print('✅ UP' if d else '❌ DOWN')" 2>/dev/null || echo "❌ ERİŞİLEMİYOR"
	@echo -n "  Elasticsearch: "; curl -sk -u elastic:$${ELASTIC_PASSWORD:-changeme} http://localhost:9200/_cluster/health 2>/dev/null | python3 -c "import sys,json; d=json.load(sys.stdin); print('✅', d.get('status','?').upper())" 2>/dev/null || echo "❌ ERİŞİLEMİYOR"
	@echo -n "  Kibana:        "; curl -sk http://localhost:5601/api/status 2>/dev/null | python3 -c "import sys,json; d=json.load(sys.stdin); print('✅ UP')" 2>/dev/null || echo "❌ ERİŞİLEMİYOR"
	@echo -n "  Prometheus:    "; curl -sk http://localhost:9090/-/healthy 2>/dev/null | grep -q "Healthy" && echo "✅ UP" || echo "❌ ERİŞİLEMİYOR"
	@echo -n "  Grafana:       "; curl -sk http://localhost:3001/api/health 2>/dev/null | python3 -c "import sys,json; d=json.load(sys.stdin); print('✅', d.get('database','?'))" 2>/dev/null || echo "❌ ERİŞİLEMİYOR"
