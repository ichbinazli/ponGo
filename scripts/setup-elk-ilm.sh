#!/bin/bash

# ============================================================
# ft_transcendence - ELK ILM (Index Lifecycle Management) Kurulum
# Elasticsearch'de otomatik log silme politikası oluşturur.
# Kullanım: ./scripts/setup-elk-ilm.sh
# ============================================================

set -e

ELASTIC_HOST="http://localhost:9200"
ELASTIC_USER="elastic"
ELASTIC_PASS="${ELASTIC_PASSWORD:-changeme}"

echo "📋 ELK ILM Politikası Oluşturuluyor..."

# ILM politikası: 7 gün hot, 23 gün warm, 30 gün sonra sil
curl -s -u "$ELASTIC_USER:$ELASTIC_PASS" \
  -X PUT "$ELASTIC_HOST/_ilm/policy/ft-log-policy" \
  -H 'Content-Type: application/json' \
  -d '{
    "policy": {
      "phases": {
        "hot": {
          "min_age": "0ms",
          "actions": {
            "rollover": {
              "max_size": "5gb",
              "max_age": "7d"
            },
            "set_priority": {
              "priority": 100
            }
          }
        },
        "warm": {
          "min_age": "7d",
          "actions": {
            "shrink": {
              "number_of_shards": 1
            },
            "forcemerge": {
              "max_num_segments": 1
            },
            "set_priority": {
              "priority": 50
            }
          }
        },
        "delete": {
          "min_age": "30d",
          "actions": {
            "delete": {}
          }
        }
      }
    }
  }'

echo ""
echo "✅ ILM Politikası oluşturuldu: ft-log-policy"
echo "   Hot: 7 gün (rollover: 5GB)"
echo "   Warm: 7-30 gün"
echo "   Delete: 30 gün sonra otomatik silme"

# Index template oluştur
curl -s -u "$ELASTIC_USER:$ELASTIC_PASS" \
  -X PUT "$ELASTIC_HOST/_index_template/ft-transcendence" \
  -H 'Content-Type: application/json' \
  -d '{
    "index_patterns": ["ft-*"],
    "template": {
      "settings": {
        "number_of_shards": 1,
        "number_of_replicas": 0,
        "index.lifecycle.name": "ft-log-policy",
        "index.lifecycle.rollover_alias": "ft-logs"
      },
      "mappings": {
        "properties": {
          "@timestamp": { "type": "date" },
          "service_name": { "type": "keyword" },
          "log_level": { "type": "keyword" },
          "log_msg": { "type": "text" },
          "req_method": { "type": "keyword" },
          "req_url": { "type": "keyword" },
          "res_status": { "type": "integer" },
          "res_time": { "type": "float" },
          "client_ip": { "type": "ip" },
          "environment": { "type": "keyword" },
          "project": { "type": "keyword" }
        }
      }
    }
  }'

echo ""
echo "✅ Index template oluşturuldu: ft-transcendence"
echo "   Pattern: ft-*"
echo ""
echo "🎉 ELK ILM kurulumu tamamlandı!"
