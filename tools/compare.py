#!/usr/bin/env python3
"""
Compara dos capturas de la API separando las divergencias aceptadas de las reales.

    ./tools/capture-golden.sh http://localhost:5254 golden/java
    python tools/compare.py

OJO: esto es una herramienta de inspección MANUAL, heredada del port. La
verificación real hoy la hace GoldenIT en `mvn verify`, que aplica exactamente
las mismas reglas de normalización que están acá abajo — si tocás una, tocá la
otra.

golden/contract/ es la última foto del backend .NET, que ya no existe. Es la
referencia del contrato y no se puede regenerar.

Un `diff -r` pelado no sirve: hay diferencias que no son bugs y taparían las que
sí. Sin esta separación, cada corrida mostraría ~27 diffs conocidos, nadie los
miraría, y una diferencia real pasaría entre el ruido.
"""

import json
import os
import sys
from glob import glob

DOTNET = "golden/contract"
JAVA = "golden/java"

# Divergencias deliberadas, con su razón. Cada una fue investigada, no asumida.
DIVERGENCIAS = {
    "amenities_order":
        "El .NET no tiene ORDER BY en amenities: el orden lo elige el optimizador y\n"
        "     CAMBIA con el pageSize (con 12 devuelve otro orden que con 3). El frontend ya\n"
        "     ve órdenes distintos según la página. Nunca fue contrato. Java lo fija por Id.",
    "traceId":
        "Diagnóstico propio de ASP.NET (W3C trace context). Spring no lo emite y\n"
        "     fabricar uno falso para igualar bytes sería peor. El frontend no lee\n"
        "     el body de los errores.",
    "createdAt_Z_en_POST":
        "El .NET es inconsistente consigo mismo: el POST devuelve createdAt CON Z\n"
        "     (DateTime.UtcNow tiene Kind=Utc) y el GET SIN Z (EF lee la columna\n"
        "     datetime(6) como Kind=Unspecified). O sea, new Date() interpreta la\n"
        "     misma marca como UTC o como hora local según el endpoint — eso es un\n"
        "     bug. Java siempre emite sin Z, que es lo que la columna guarda.\n"
        "     El frontend no lee createdAt (verificado). No aparece en el diff porque\n"
        "     el oráculo no captura POSTs exitosos; se verificó a mano.",
}


def leer(path):
    with open(path, encoding="utf-8") as fh:
        raw = fh.read()
    cabecera, _, cuerpo = raw.partition("--- body ---")
    return cabecera.strip(), cuerpo.strip()


def parsear(cuerpo):
    if not cuerpo:
        return None
    try:
        return json.loads(cuerpo)
    except json.JSONDecodeError:
        return cuerpo


def normalizar(o):
    """Aplica las divergencias aceptadas para que no tapen diffs reales."""
    if isinstance(o, dict):
        out = {}
        for k, v in o.items():
            if k == "traceId":
                continue                                   # ASP.NET-only
            if k == "amenities" and isinstance(v, list):
                out[k] = sorted(v)                         # orden indefinido en .NET
            else:
                out[k] = normalizar(v)
        return out
    if isinstance(o, list):
        return [normalizar(x) for x in o]
    return o


def main():
    if not os.path.isdir(DOTNET) or not os.path.isdir(JAVA):
        print(f"Faltan capturas. Se esperaban {DOTNET}/ y {JAVA}/")
        return 2

    identicos, aceptadas, reales, faltantes = [], [], [], []

    for f in sorted(glob(f"{DOTNET}/*.txt")):
        nombre = os.path.basename(f)
        j = f"{JAVA}/{nombre}"
        if not os.path.exists(j):
            faltantes.append(nombre)
            continue

        h_net, b_net = leer(f)
        h_java, b_java = leer(j)

        if h_net == h_java and b_net == b_java:
            identicos.append(nombre)
        elif h_net == h_java and normalizar(parsear(b_net)) == normalizar(parsear(b_java)):
            aceptadas.append(nombre)
        else:
            reales.append((nombre, h_net, h_java, b_net, b_java))

    total = len(identicos) + len(aceptadas) + len(reales)
    print(f"  idénticos:              {len(identicos):>3} / {total}")
    print(f"  divergencia aceptada:   {len(aceptadas):>3}")
    print(f"  DIFERENCIAS REALES:     {len(reales):>3}")
    if faltantes:
        print(f"  sin captura en Java:    {len(faltantes):>3}")

    if aceptadas:
        print("\n--- Divergencias aceptadas (documentadas) ---")
        for motivo, razon in DIVERGENCIAS.items():
            print(f"  · {motivo}: {razon}")

    if reales:
        print("\n--- DIFERENCIAS REALES ---")
        for nombre, h_net, h_java, b_net, b_java in reales:
            print(f"\n  ### {nombre}")
            if h_net != h_java:
                for ln, lj in zip(h_net.splitlines(), h_java.splitlines()):
                    if ln != lj:
                        print(f"      net  | {ln}")
                        print(f"      java | {lj}")
            if b_net != b_java:
                print(f"      net  | {b_net[:150] or '(vacío)'}")
                print(f"      java | {b_java[:150] or '(vacío)'}")

    print()
    if reales:
        print(f"FALTA: {len(reales)} diferencias reales por resolver.")
        return 1
    print("Sin diferencias reales.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
