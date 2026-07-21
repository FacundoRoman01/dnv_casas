#!/usr/bin/env bash
# Captura las respuestas de la API en bytes crudos: status, content-type y body.
#
# ─────────────────────────────────────────────────────────────────────────────
# El backend .NET ya no existe (borrado en el cutover). golden/contract/ es su
# ÚLTIMA foto y NO se puede regenerar: es la referencia del contrato, congelada.
#
# La verificación de verdad hoy es GoldenIT, que replica esos archivos contra el
# Java en cada `mvn verify`. Este script sobrevive solo para inspeccionar la API
# a mano o para re-capturar un escenario nuevo.
#
# Si vas a cambiar el contrato a propósito, actualizá golden/contract/ con este
# script y explicá el cambio en el commit — esos archivos dejan de ser "lo que
# hacía el .NET" y pasan a ser "lo que decidimos que haga".
# ─────────────────────────────────────────────────────────────────────────────
#
# Uso:  ./capture-golden.sh [BASE_URL] [OUT_DIR]
#   Por defecto: http://localhost:5254 → golden/contract

set -uo pipefail

BASE="${1:-http://localhost:5254}"
OUT="${2:-golden/contract}"

ADMIN_EMAIL="admin@dnvcasas.com"
ADMIN_PASS="admin123"

mkdir -p "$OUT"
rm -f "$OUT"/*.txt 2>/dev/null || true

# Captura: nombre, método, path, [body], [token]
# Escribe <OUT>/<nombre>.txt con "HTTP <status>", content-type, y el body crudo.
cap() {
  local name="$1" method="$2" path="$3" body="${4:-}" token="${5:-}"
  local f="$OUT/$name.txt"
  local args=(-s -o "$OUT/.body" -w '%{http_code}|%{content_type}')

  [[ -n "$token" ]] && args+=(-H "Authorization: Bearer $token")
  if [[ -n "$body" ]]; then
    args+=(-H 'Content-Type: application/json' --data-raw "$body")
  fi
  args+=(-X "$method" "$BASE$path")

  local meta status ctype
  meta=$(curl "${args[@]}")
  status="${meta%%|*}"
  ctype="${meta#*|}"
  # Normalizar el content-type: .NET manda "application/json; charset=utf-8" y
  # Spring "application/json;charset=UTF-8". Es el MISMO header — los parámetros
  # son case-insensitive y el espacio es opcional (RFC 9110). Ningún cliente los
  # distingue, así que se normaliza en vez de perseguir igualdad de bytes.
  ctype=$(printf '%s' "$ctype" | tr 'A-Z' 'a-z' | tr -d ' ')

  {
    echo "### $method $path"
    [[ -n "$body" ]] && echo "### body: $body"
    echo "HTTP $status"
    echo "content-type: $ctype"
    echo "--- body ---"
    # Normalizar lo que cambia entre capturas — si no, el diff da falsos positivos siempre:
    #  · token → lleva iat/exp, distinto en cada login
    #  · traceId → W3C trace context, único por request (y Java ni lo emite)
    sed -E -e 's/"token":"ey[A-Za-z0-9._-]+"/"token":"<JWT_REDACTADO>"/g' \
           -e 's/"traceId":"[^"]*"/"traceId":"<TRACE_REDACTADO>"/g' "$OUT/.body"
    echo
  } > "$f"
  printf '  %-42s HTTP %s\n' "$name" "$status"
}

echo "Capturando desde $BASE → $OUT/"
echo ""
echo "PUBLICO — lecturas"
cap 'props_default'          GET '/api/properties'
cap 'props_page1_size3'      GET '/api/properties?page=1&pageSize=3'
cap 'props_page2_size3'      GET '/api/properties?page=2&pageSize=3'
cap 'props_pagesize_over100' GET '/api/properties?pageSize=500'          # clamp a 100, se refleja en el body
cap 'props_page_zero'        GET '/api/properties?page=0'                # bug conocido: 500
cap 'props_by_id_1'          GET '/api/properties/1'                     # alquiler, precio con escala
cap 'props_by_id_7'          GET '/api/properties/7'                     # intercambio, precio null
cap 'props_by_id_9'          GET '/api/properties/9'                     # compra, USD
cap 'props_by_id_404'        GET '/api/properties/99999'                 # 404 sin body
cap 'destinations'           GET '/api/destinations'
cap 'neighborhoods_all'      GET '/api/properties/neighborhoods'
cap 'neighborhoods_dest1'    GET '/api/properties/neighborhoods?destinationId=1'
cap 'neighborhoods_dest_none' GET '/api/properties/neighborhoods?destinationId=99999'

echo ""
echo "FILTROS — uno por uno"
cap 'f_category_0'      GET '/api/properties?category=0'
cap 'f_category_1'      GET '/api/properties?category=1'
cap 'f_category_2'      GET '/api/properties?category=2'
cap 'f_category_name'   GET '/api/properties?category=Alquiler'          # ASP.NET acepta el nombre
cap 'f_dest_1'          GET '/api/properties?destinationId=1'
cap 'f_dest_vacio'      GET '/api/properties?destinationId=3'            # Miami: 0 props
cap 'f_barrio'          GET '/api/properties?neighborhood=Centro'
cap 'f_barrio_lower'    GET '/api/properties?neighborhood=centro'        # collation case-insensitive
cap 'f_barrio_wildcard' GET '/api/properties?neighborhood=%25'           # LOCATE vs LIKE: %25 = '%'
cap 'f_barrio_underscore' GET '/api/properties?neighborhood=_'           # idem con '_'
cap 'f_guests_4'        GET '/api/properties?guests=4'
cap 'f_guests_99'       GET '/api/properties?guests=99'
cap 'f_bedrooms_2'      GET '/api/properties?bedrooms=2'
cap 'f_maxprice_90k'    GET '/api/properties?maxPrice=90000'             # INCLUYE las de precio null
cap 'f_maxprice_1'      GET '/api/properties?maxPrice=1'                 # solo las null deberian quedar
cap 'f_type_0'          GET '/api/properties?propertyType=0'
cap 'f_type_2'          GET '/api/properties?propertyType=2'
cap 'f_featured_true'   GET '/api/properties?featured=true'
cap 'f_featured_false'  GET '/api/properties?featured=false'             # NO-OP: no filtra
cap 'f_datefrom_solo'   GET '/api/properties?dateFrom=2026-08-01'        # sin dateTo: filtro desactivado
cap 'f_dateto_solo'     GET '/api/properties?dateTo=2026-08-10'
cap 'f_daterange'       GET '/api/properties?dateFrom=2026-08-01&dateTo=2026-08-10'

echo ""
echo "SORT — nulls al final en AMBAS direcciones"
cap 's_price_asc'       GET '/api/properties?sortBy=price_asc&pageSize=20'
cap 's_price_desc'      GET '/api/properties?sortBy=price_desc&pageSize=20'
cap 's_default'         GET '/api/properties?pageSize=20'
cap 's_basura'          GET '/api/properties?sortBy=basura&pageSize=20'  # cae al default
cap 's_mayusculas'      GET '/api/properties?sortBy=PRICE_ASC&pageSize=20' # case-sensitive: default

echo ""
echo "COMBINADOS"
cap 'c_cat_dest_sort'   GET '/api/properties?category=0&destinationId=1&sortBy=price_asc'
cap 'c_todo'            GET '/api/properties?category=0&destinationId=1&neighborhood=Centro&guests=2&bedrooms=1&maxPrice=200000&propertyType=1&sortBy=price_desc&page=1&pageSize=5'

echo ""
echo "AUTH — el login gasta cupo: 5 requests / 15 min GLOBALES."
echo "      Por eso el token va PRIMERO y los errores de login al final."
cap 'admin_sin_token'   GET  '/api/admin/properties'
cap 'login_ok'          POST '/api/auth/login' "{\"email\":\"$ADMIN_EMAIL\",\"password\":\"$ADMIN_PASS\"}"   # cupo 1/5

# El token sale del body CRUDO (.body), no del .txt — ahí ya está redactado.
# Hay que leerlo ya, antes de que el próximo cap() pise .body.
TOKEN=$(sed -n 's/.*"token":"\([^"]*\)".*/\1/p' "$OUT/.body")

if [[ -z "$TOKEN" ]]; then
  echo "  !! sin token — el rate limit está agotado. Reiniciá la API y reintentá:"
  echo "     docker compose restart api && sleep 8 && ./tools/capture-golden.sh"
  exit 1
else
  echo ""
  echo "ADMIN — lecturas"
  cap 'admin_props'        GET '/api/admin/properties' '' "$TOKEN"
  cap 'admin_props_paged'  GET '/api/admin/properties?page=1&pageSize=2' '' "$TOKEN"
  cap 'admin_prop_1'       GET '/api/admin/properties/1' '' "$TOKEN"
  cap 'admin_prop_404'     GET '/api/admin/properties/99999' '' "$TOKEN"
  cap 'admin_dests'        GET '/api/admin/destinations' '' "$TOKEN"

  echo ""
  echo "ADMIN — formas de error (SIN efectos de escritura)"
  cap 'e_status_invalido'  PATCH '/api/admin/properties/1/status' '99' "$TOKEN"     # {"message":...}
  cap 'e_status_deleted'   PATCH '/api/admin/properties/1/status' '2'  "$TOKEN"     # {"message":...}
  cap 'e_status_404'       PATCH '/api/admin/properties/99999/status' '0' "$TOKEN"
  cap 'e_featured_404'     PATCH '/api/admin/properties/99999/featured' 'true' "$TOKEN"
  cap 'e_crear_sin_titulo' POST '/api/admin/properties' \
      '{"title":"","description":"x","category":0,"propertyType":0,"destinationId":1,"neighborhood":"","price":1,"priceLabel":"","currency":"ARS","bedrooms":1,"bathrooms":1,"squareMeters":null,"landSize":"","capacity":1,"whatsAppMessage":"","amenities":[],"seasonPrices":[]}' "$TOKEN"
  cap 'e_crear_titulo_corto' POST '/api/admin/properties' \
      '{"title":"ab","description":"x","category":0,"propertyType":0,"destinationId":1,"neighborhood":"","price":1,"priceLabel":"","currency":"ARS","bedrooms":1,"bathrooms":1,"squareMeters":null,"landSize":"","capacity":1,"whatsAppMessage":"","amenities":[],"seasonPrices":[]}' "$TOKEN"
  cap 'e_intercambio_con_precio' POST '/api/admin/properties' \
      '{"title":"Test intercambio","description":"x","category":1,"propertyType":0,"destinationId":1,"neighborhood":"","price":5000,"priceLabel":"por noche","currency":"ARS","bedrooms":1,"bathrooms":1,"squareMeters":null,"landSize":"","capacity":1,"whatsAppMessage":"","amenities":[],"seasonPrices":[]}' "$TOKEN"
  cap 'e_temporadas_pisadas' POST '/api/admin/properties' \
      '{"title":"Test temporadas","description":"x","category":0,"propertyType":0,"destinationId":1,"neighborhood":"","price":1000,"priceLabel":"por noche","currency":"ARS","bedrooms":1,"bathrooms":1,"squareMeters":null,"landSize":"","capacity":2,"whatsAppMessage":"","amenities":[],"seasonPrices":[{"label":"Alta","pricePerNight":100,"dateFrom":"2026-01-01","dateTo":"2026-02-01"},{"label":"Media","pricePerNight":80,"dateFrom":"2026-01-15","dateTo":"2026-03-01"}]}' "$TOKEN"
  cap 'e_sin_amenities'    POST '/api/admin/properties' \
      '{"title":"Sin colecciones","description":"x","category":0,"propertyType":0,"destinationId":1,"neighborhood":"","price":1,"priceLabel":"","currency":"ARS","bedrooms":1,"bathrooms":1,"squareMeters":null,"landSize":"","capacity":1,"whatsAppMessage":""}' "$TOKEN"
  cap 'e_precio_negativo'  POST '/api/admin/properties' \
      '{"title":"Precio negativo","description":"x","category":0,"propertyType":0,"destinationId":1,"neighborhood":"","price":-5,"priceLabel":"","currency":"ARS","bedrooms":1,"bathrooms":1,"squareMeters":null,"landSize":"","capacity":1,"whatsAppMessage":"","amenities":[],"seasonPrices":[]}' "$TOKEN"
fi

echo ""
echo "LOGIN — errores. Van al final porque cada uno gasta cupo."
cap 'login_mal_pass'    POST '/api/auth/login' "{\"email\":\"$ADMIN_EMAIL\",\"password\":\"incorrecta\"}"   # 2/5
cap 'login_no_existe'   POST '/api/auth/login' '{"email":"nadie@nada.com","password":"x"}'                  # 3/5
cap 'login_email_malo'  POST '/api/auth/login' '{"email":"no-es-email","password":"x"}'                     # 4/5
cap 'login_vacio'       POST '/api/auth/login' '{}'                                                         # 5/5
# 6º → 503. El bucket es GLOBAL (no por IP) y responde con body VACIO, sin Retry-After.
cap 'login_rate_limit'  POST '/api/auth/login' "{\"email\":\"$ADMIN_EMAIL\",\"password\":\"$ADMIN_PASS\"}"  # 6/5 → 503

rm -f "$OUT/.body"
echo ""
echo "Listo: $(find "$OUT" -name '*.txt' | wc -l) respuestas en $OUT/"
echo "NOTA: el rate limit quedó agotado. Para re-correr: docker compose restart api && sleep 8"
