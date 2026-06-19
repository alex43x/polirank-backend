#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Migracion transaccional de asignaturas: aplica EQUIVALENCIAS_ASIGNATURAS
y EQUIVALENCIAS_POR_CARRERA a los registros existentes en la BD.

Uso:
    python scripts/migrar_normalizacion.py --dry-run    # Solo mostrar cambios (default)
    python scripts/migrar_normalizacion.py --execute    # Aplicar cambios reales
"""

import argparse
import logging
import sys
import os
from collections import defaultdict

# ---------------------------------------------------------------------------
# Ajuste de sys.path para importar config/ y core/ desde scripts/
# Asume que el script se ejecuta desde utils/Scripts/dataTransfer_v2/
# ---------------------------------------------------------------------------
_SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
_ROOT_DIR = os.path.abspath(os.path.join(_SCRIPT_DIR, ".."))
if _ROOT_DIR not in sys.path:
    sys.path.insert(0, _ROOT_DIR)

import psycopg2
import psycopg2.extras

from config.settings import DB_CONFIG
from core.normalizers import (
    normalizar_texto,
    EQUIVALENCIAS_ASIGNATURAS,
    EQUIVALENCIAS_POR_CARRERA,
    CARRERA_MAP,
)

# ---------------------------------------------------------------------------
# BUG #4 fix: forzar UTF-8 en stdout para evitar UnicodeEncodeError en Windows
# ---------------------------------------------------------------------------
if sys.stdout.encoding and sys.stdout.encoding.lower() not in ("utf-8", "utf_8"):
    import io
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding="utf-8", errors="replace")

# ---------------------------------------------------------------------------
# Logging
# ---------------------------------------------------------------------------
logging.basicConfig(
    level=logging.INFO,
    format="%(levelname)s - %(message)s",
    stream=sys.stdout,
)
log = logging.getLogger(__name__)

# ---------------------------------------------------------------------------
# Banner de backup
# ---------------------------------------------------------------------------

BACKUP_BANNER = """
+--------------------------------------------------------------+
|  IMPORTANTE: Ejecuta este backup antes de continuar:        |
|                                                              |
|  pg_dump -h {host} -U {user} -d {db} \\                     |
|    --table=asignaturas --table=secciones \\                  |
|    --table=cursos --table=malla \\                           |
|    -f backup_pre_migracion.sql                               |
+--------------------------------------------------------------+
"""


def print_backup_banner():
    print(BACKUP_BANNER.format(
        host=DB_CONFIG.get("host", "localhost"),
        user=DB_CONFIG.get("user", "postgres"),
        db=DB_CONFIG.get("database", "polirankDB"),
    ))


# ---------------------------------------------------------------------------
# Estadisticas
# ---------------------------------------------------------------------------

class Stats:
    def __init__(self):
        self.renombradas: int = 0
        self.mergeadas: int = 0
        self.sin_cambios: int = 0
        self.secciones_repointadas: int = 0
        self.mallas_repointadas: int = 0
        self.intentos_repointados: int = 0
        self.errores: int = 0

    def print_summary(self):
        print()
        print("======= RESUMEN DE MIGRACION =======")
        print(f"  Asignaturas renombradas:  {self.renombradas:>6}")
        print(f"  Asignaturas mergeadas:    {self.mergeadas:>6}")
        print(f"  Asignaturas sin cambios:  {self.sin_cambios:>6}")
        print(f"  Secciones repointadas:    {self.secciones_repointadas:>6}")
        print(f"  Mallas repointadas:       {self.mallas_repointadas:>6}")
        print(f"  Intentos repointados:     {self.intentos_repointados:>6}")
        print(f"  Errores:                  {self.errores:>6}")
        print("====================================")


stats = Stats()

# ---------------------------------------------------------------------------
# Cache de asignaturas (cargado una vez para evitar N+1 queries)
# BUG #1 fix: el matching se hace en Python con normalizar_texto(), sin depender
# de la extension unaccent de PostgreSQL.
# ---------------------------------------------------------------------------
_cache_asignaturas: list[dict] | None = None


def _cargar_todas_asignaturas(cur) -> list[dict]:
    global _cache_asignaturas
    if _cache_asignaturas is None:
        cur.execute("SELECT id, nombre, depto FROM asignaturas")
        _cache_asignaturas = [
            {"id": r[0], "nombre": r[1], "depto": r[2]}
            for r in cur.fetchall()
        ]
    return _cache_asignaturas


def _invalidar_cache():
    """Llamar despues de cualquier INSERT/UPDATE/DELETE en asignaturas."""
    global _cache_asignaturas
    _cache_asignaturas = None


def buscar_asignatura_por_nombre(cur, nombre_buscado: str) -> list[dict]:
    """
    BUG #1 fix: busca asignaturas cuyo nombre normalizado coincida, usando
    Python en lugar de unaccent() de PostgreSQL.
    Funciona tanto con acentos (clave de EQUIVALENCIAS_ASIGNATURAS como
    "Fundamentos de Matematica") como sin acentos (clave de
    EQUIVALENCIAS_POR_CARRERA como "estadistica").
    """
    todas = _cargar_todas_asignaturas(cur)
    buscado_norm = normalizar_texto(nombre_buscado)
    return [a for a in todas if normalizar_texto(a["nombre"]) == buscado_norm]


def buscar_canonico_en_depto(cur, nombre_canonico: str, depto_id: int, excluir_id: int) -> int | None:
    """
    BUG #1 fix: busca el registro canonico en Python usando el cache,
    sin depender de funciones SQL de PostgreSQL.
    """
    todas = _cargar_todas_asignaturas(cur)
    canonico_norm = normalizar_texto(nombre_canonico)
    for a in todas:
        if (
            normalizar_texto(a["nombre"]) == canonico_norm
            and a["depto"] == depto_id
            and a["id"] != excluir_id
        ):
            return a["id"]
    return None


def contar_refs(cur, tabla: str, columna: str, asig_id: int) -> int:
    cur.execute(f"SELECT COUNT(*) FROM {tabla} WHERE {columna} = %s", (asig_id,))
    return cur.fetchone()[0]


def _siglas_a_carrera_ids(cur, siglas: list[str]) -> list[int]:
    """Convierte lista de siglas de carreras a sus ids en la tabla carreras."""
    if not siglas:
        return []
    siglas_upper = [s.upper() for s in siglas]
    placeholders = ', '.join(['%s'] * len(siglas_upper))
    cur.execute(
        f"SELECT id FROM carreras WHERE UPPER(nombre) IN ({placeholders})",
        siglas_upper,
    )
    return [r[0] for r in cur.fetchall()]


def _obtener_o_crear_asignatura(cur, nombre: str, depto_id: int,
                                excluir_id: int, dry_run: bool) -> int | None:
    """Retorna id de asignatura canonica existente, o la crea (si no dry_run)."""
    id_existente = buscar_canonico_en_depto(cur, nombre, depto_id, excluir_id)
    if id_existente is not None:
        return id_existente

    if dry_run:
        return None

    cur.execute(
        "INSERT INTO asignaturas (nombre, depto) VALUES (%s, %s) RETURNING id",
        (nombre, depto_id),
    )
    nuevo_id = cur.fetchone()[0]
    _invalidar_cache()
    log.info("[CREATE] '%s' (id=%d) en depto=%d", nombre, nuevo_id, depto_id)
    return nuevo_id


# ---------------------------------------------------------------------------
# Repointeo de FKs
# ---------------------------------------------------------------------------

def repoint_secciones(cur, id_viejo: int, id_canonico: int, dry_run: bool) -> int:
    """
    Mueve secciones de id_viejo a id_canonico respetando el UNIQUE (docente, asignatura).
    Retorna el numero de filas efectivamente actualizadas.
    """
    antes = contar_refs(cur, "secciones", "asignatura", id_viejo)
    if antes == 0:
        return 0

    if not dry_run:
        cur.execute(
            """
            UPDATE secciones SET asignatura = %s
            WHERE asignatura = %s
              AND NOT EXISTS (
                SELECT 1 FROM secciones s2
                WHERE s2.docente = secciones.docente
                  AND s2.asignatura = %s
              )
            """,
            (id_canonico, id_viejo, id_canonico),
        )
        actualizadas = cur.rowcount
    else:
        cur.execute(
            """
            SELECT COUNT(*) FROM secciones s
            WHERE s.asignatura = %s
              AND NOT EXISTS (
                SELECT 1 FROM secciones s2
                WHERE s2.docente = s.docente
                  AND s2.asignatura = %s
              )
            """,
            (id_viejo, id_canonico),
        )
        actualizadas = cur.fetchone()[0]

    return actualizadas


def repoint_malla_por_carreras(cur, id_viejo: int, id_canonico: int,
                                carrera_ids: list[int], dry_run: bool) -> int:
    """
    Repointa mallas de id_viejo a id_canonico SOLO para las carreras
    especificadas, respetando UNIQUE (carrera, asignatura, semestre).
    """
    if not carrera_ids:
        return 0

    placeholders = ', '.join(['%s'] * len(carrera_ids))

    cur.execute(
        f"""
        SELECT COUNT(*) FROM malla
        WHERE asignatura = %s
          AND carrera IN ({placeholders})
          AND NOT EXISTS (
            SELECT 1 FROM malla m2
            WHERE m2.carrera = malla.carrera
              AND m2.asignatura = %s
              AND m2.semestre = malla.semestre
          )
        """,
        (id_viejo, *carrera_ids, id_canonico),
    )
    candidates = cur.fetchone()[0]

    if candidates == 0:
        return 0

    if not dry_run:
        cur.execute(
            f"""
            UPDATE malla SET asignatura = %s
            WHERE asignatura = %s
              AND carrera IN ({placeholders})
              AND NOT EXISTS (
                SELECT 1 FROM malla m2
                WHERE m2.carrera = malla.carrera
                  AND m2.asignatura = %s
                  AND m2.semestre = malla.semestre
              )
            """,
            (id_canonico, id_viejo, *carrera_ids, id_canonico),
        )

    return candidates


def repoint_malla(cur, id_viejo: int, id_canonico: int, dry_run: bool) -> int:
    """
    Mueve malla de id_viejo a id_canonico respetando el UNIQUE (carrera, asignatura, semestre).
    Retorna el numero de filas efectivamente actualizadas.
    """
    antes = contar_refs(cur, "malla", "asignatura", id_viejo)
    if antes == 0:
        return 0

    if not dry_run:
        cur.execute(
            """
            UPDATE malla SET asignatura = %s
            WHERE asignatura = %s
              AND NOT EXISTS (
                SELECT 1 FROM malla m2
                WHERE m2.carrera = malla.carrera
                  AND m2.asignatura = %s
                  AND m2.semestre = malla.semestre
              )
            """,
            (id_canonico, id_viejo, id_canonico),
        )
        actualizadas = cur.rowcount
    else:
        cur.execute(
            """
            SELECT COUNT(*) FROM malla m
            WHERE m.asignatura = %s
              AND NOT EXISTS (
                SELECT 1 FROM malla m2
                WHERE m2.carrera = m.carrera
                  AND m2.asignatura = %s
                  AND m2.semestre = m.semestre
              )
            """,
            (id_viejo, id_canonico),
        )
        actualizadas = cur.fetchone()[0]

    return actualizadas


def repoint_intentos(cur, id_viejo: int, id_canonico: int, dry_run: bool) -> int:
    """
    BUG #7 fix: repointa intentos de id_viejo a id_canonico.
    La tabla intentos NO tiene UNIQUE(alumno, asignatura), por lo que
    no hay conflictos que manejar: un UPDATE simple es suficiente.
    """
    antes = contar_refs(cur, "intentos", "asignatura", id_viejo)
    if antes == 0:
        return 0

    if not dry_run:
        cur.execute(
            "UPDATE intentos SET asignatura = %s WHERE asignatura = %s",
            (id_canonico, id_viejo),
        )
        return cur.rowcount
    else:
        return antes


def limpiar_secciones_duplicadas(cur, id_viejo: int, id_canonico: int):
    """
    Resuelve secciones duplicadas repointando cursos hacia la seccion
    superviviente y eliminando los cursos conflictivos (con sus referencias).
    No aborta la transaccion.
    """
    # 1. Identificar los pares (seccion_origen, seccion_destino)
    cur.execute(
        """
        SELECT s.id, s2.id
        FROM secciones s
        JOIN secciones s2 ON s2.docente = s.docente AND s2.asignatura = %s
        WHERE s.asignatura = %s
        """,
        (id_canonico, id_viejo),
    )
    pares = cur.fetchall()  # [(origen, destino), ...]

    for id_origen, id_destino in pares:
        # 1a. Cursos del origen que NO tienen conflicto UNIQUE en el destino
        cur.execute(
            """
            UPDATE cursos SET seccion = %s
            WHERE seccion = %s
              AND (year, periodo) NOT IN (
                SELECT c2.year, c2.periodo FROM cursos c2
                WHERE c2.seccion = %s
              )
            """,
            (id_destino, id_origen, id_destino),
        )
        n_ok = cur.rowcount
        if n_ok:
            log.warning("  [CLEANUP] %d cursos repointados de seccion %d -> %d",
                        n_ok, id_origen, id_destino)

        # 1b. Cursos conflictivos: eliminar estadisticas + reviewcab, luego cursos
        cur.execute(
            "SELECT id FROM cursos WHERE seccion = %s", (id_origen,)
        )
        cursos_origen = [r[0] for r in cur.fetchall()]
        if cursos_origen:
            placeholders = ', '.join(['%s'] * len(cursos_origen))
            cur.execute(
                f"DELETE FROM estadisticas WHERE curso IN ({placeholders})",
                cursos_origen,
            )
            cur.execute(
                f"DELETE FROM reviewcont WHERE revcab IN "
                f"(SELECT id FROM reviewcab WHERE curso IN ({placeholders}))",
                cursos_origen,
            )
            cur.execute(
                f"DELETE FROM reviewcab WHERE curso IN ({placeholders})",
                cursos_origen,
            )
            cur.execute(
                f"DELETE FROM cursos WHERE id IN ({placeholders})",
                cursos_origen,
            )
            log.warning("  [CLEANUP] Eliminados %d cursos conflictivos (con sus estadisticas/reviews) de seccion %d",
                        len(cursos_origen), id_origen)

        # 1c. Eliminar la seccion origen
        cur.execute("DELETE FROM secciones WHERE id = %s", (id_origen,))
        log.warning("  [CLEANUP] Eliminada seccion duplicada %d.", id_origen)


# ---------------------------------------------------------------------------
# Logica de merge/rename por asignatura
# ---------------------------------------------------------------------------

def _aplicar_merge(cur, id_viejo: int, nombre_actual: str, id_canonico: int,
                   nombre_canonico: str, depto_id: int, dry_run: bool, contexto: str):
    """Logica de merge reutilizable (BUG #2 fix incluido)."""
    prefix = "[DRY-RUN] " if dry_run else ""

    log.info("%s[MERGE] '%s' (id=%d) -> '%s' (id=%d) en depto=%d%s",
             prefix, nombre_actual, id_viejo, nombre_canonico, id_canonico, depto_id,
             f" [{contexto}]" if contexto else "")

    n_sec = repoint_secciones(cur, id_viejo, id_canonico, dry_run)
    n_mal = repoint_malla(cur, id_viejo, id_canonico, dry_run)
    n_int = repoint_intentos(cur, id_viejo, id_canonico, dry_run)
    stats.secciones_repointadas += n_sec
    stats.mallas_repointadas += n_mal
    stats.intentos_repointados += n_int

    log.info("%s  -> %d secciones repointadas, %d mallas repointadas, %d intentos repointados%s",
             prefix, n_sec, n_mal, n_int, f" [{contexto}]" if contexto else "")

    if not dry_run:
        # BUG #2 fix: antes de verificar refs > 0, intentar limpiar duplicados
        refs_sec = contar_refs(cur, "secciones", "asignatura", id_viejo)
        if refs_sec > 0:
            log.warning(
                "  Quedan %d secciones no repointadas en id=%d. "
                "Intentando cleanup de duplicados...", refs_sec, id_viejo
            )
            limpiar_secciones_duplicadas(cur, id_viejo, id_canonico)
            # Reintentar repointeo tras el cleanup
            n_retry = repoint_secciones(cur, id_viejo, id_canonico, dry_run)
            stats.secciones_repointadas += n_retry
            if n_retry:
                log.info("  -> %d secciones adicionales repointadas tras cleanup.", n_retry)

        # Verificacion final (BUG #7: incluye intentos)
        refs_sec_final = contar_refs(cur, "secciones", "asignatura", id_viejo)
        refs_mal_final = contar_refs(cur, "malla", "asignatura", id_viejo)
        refs_int_final = contar_refs(cur, "intentos", "asignatura", id_viejo)

        if refs_sec_final > 0 or refs_mal_final > 0 or refs_int_final > 0:
            msg = (
                f"No se pudieron eliminar todas las referencias de id={id_viejo} "
                f"(secciones={refs_sec_final}, malla={refs_mal_final}, intentos={refs_int_final}). "
                f"Abortando transaccion."
            )
            log.error(msg)
            stats.errores += 1
            raise RuntimeError(msg)

        cur.execute("DELETE FROM asignaturas WHERE id = %s", (id_viejo,))
        _invalidar_cache()
        log.info("[DELETE] asignatura id=%d eliminada.", id_viejo)

    stats.mergeadas += 1


def procesar_asignatura(cur, nombre_viejo: str, nombre_canonico: str,
                        dry_run: bool, contexto: str = ""):
    """
    Aplica RENAME o MERGE para una asignatura segun si el canonico ya existe en la BD.
    """
    prefix = "[DRY-RUN] " if dry_run else ""
    ctx_str = f" [{contexto}]" if contexto else ""

    resultados = buscar_asignatura_por_nombre(cur, nombre_viejo)

    if not resultados:
        log.warning("No encontrada en BD: '%s'%s — omitida.", nombre_viejo, ctx_str)
        return

    for asig in resultados:
        id_viejo = asig["id"]
        nombre_actual = asig["nombre"]
        depto_id = asig["depto"]

        if normalizar_texto(nombre_actual) == normalizar_texto(nombre_canonico):
            log.info("%sSKIP (ya es canonico) '%s' (id=%d, depto=%d)%s",
                     prefix, nombre_actual, id_viejo, depto_id, ctx_str)
            stats.sin_cambios += 1
            continue

        id_canonico = buscar_canonico_en_depto(cur, nombre_canonico, depto_id, id_viejo)

        if id_canonico is None:
            # RENAME
            log.info("%s[RENAME] '%s' (id=%d, depto=%d) -> '%s'%s",
                     prefix, nombre_actual, id_viejo, depto_id, nombre_canonico, ctx_str)
            if not dry_run:
                cur.execute(
                    "UPDATE asignaturas SET nombre = %s WHERE id = %s",
                    (nombre_canonico, id_viejo),
                )
                _invalidar_cache()
            stats.renombradas += 1
        else:
            # MERGE
            _aplicar_merge(cur, id_viejo, nombre_actual, id_canonico,
                           nombre_canonico, depto_id, dry_run, contexto)


# ---------------------------------------------------------------------------
# Fase 1 — Equivalencias generales
# ---------------------------------------------------------------------------

def fase1_equivalencias_generales(cur, dry_run: bool):
    log.info("=" * 60)
    log.info("FASE 1: Equivalencias generales (%d entradas)", len(EQUIVALENCIAS_ASIGNATURAS))
    log.info("=" * 60)

    for nombre_viejo, nombre_canonico in EQUIVALENCIAS_ASIGNATURAS.items():
        try:
            procesar_asignatura(cur, nombre_viejo, nombre_canonico, dry_run)
        except RuntimeError:
            raise
        except Exception as exc:
            log.error("Error inesperado procesando '%s': %s", nombre_viejo, exc)
            stats.errores += 1
            raise


# ---------------------------------------------------------------------------
# Fase 2 — Equivalencias por carrera
# ---------------------------------------------------------------------------

def buscar_por_carrera(cur, titulo_norm: str, sigla_carrera: str) -> list[dict]:
    """
    BUG #6 fix: busca asignaturas cuyo nombre normalizado coincida con titulo_norm
    y que esten vinculadas a la carrera identificada por sigla_carrera.
    El matching de carrera soporta dos formatos de la tabla carreras:
      - Nombre completo: "Ingenieria en Electronica" -> CARRERA_MAP -> "IEK"
      - Sigla directa:   "IEK" == sigla_carrera  (caso real de esta BD)
    """
    sigla_upper = sigla_carrera.upper()
    cur.execute("SELECT id, nombre FROM carreras")
    ids_carrera = []
    for c_id, c_nombre in cur.fetchall():
        if not c_nombre:
            continue
        # Caso 1: el nombre es la sigla directamente (ej: nombre="IEK")
        if c_nombre.strip().upper() == sigla_upper:
            ids_carrera.append(c_id)
            continue
        # Caso 2: el nombre es completo, lo mapeamos via CARRERA_MAP
        sigla_encontrada = CARRERA_MAP.get(normalizar_texto(c_nombre))
        if sigla_encontrada == sigla_upper:
            ids_carrera.append(c_id)

    if not ids_carrera:
        log.warning("No se encontro ninguna carrera con sigla '%s' en la BD.", sigla_carrera)
        return []

    placeholders = ", ".join(["%s"] * len(ids_carrera))
    cur.execute(
        f"""
        SELECT DISTINCT a.id, a.nombre, a.depto
        FROM asignaturas a
        JOIN malla m ON m.asignatura = a.id
        WHERE m.carrera IN ({placeholders})
        """,
        ids_carrera,
    )
    candidatas = [{"id": r[0], "nombre": r[1], "depto": r[2]} for r in cur.fetchall()]

    # Filtrar en Python con normalizar_texto (insensible a acentos y espacios)
    return [a for a in candidatas if normalizar_texto(a["nombre"]) == titulo_norm]



def fase2_equivalencias_por_carrera(cur, dry_run: bool):
    log.info("=" * 60)
    log.info("FASE 2: Equivalencias por carrera (%d entradas)", len(EQUIVALENCIAS_POR_CARRERA))
    log.info("=" * 60)

    # 1. Group entries by titulo_norm to detect shared subjects
    grupos = defaultdict(list)
    for (titulo_norm, sigla_carrera), nombre_canonico in EQUIVALENCIAS_POR_CARRERA.items():
        grupos[titulo_norm].append((sigla_carrera, nombre_canonico))

    for titulo_norm, entries in grupos.items():
        prefix = "[DRY-RUN] " if dry_run else ""

        # Collect distinct canonical targets with their carreras
        targets: dict[str, list[str]] = {}
        for sigla, canon in entries:
            targets.setdefault(canon, []).append(sigla)
        target_items = list(targets.items())

        # ── Single target: original path ──────────────────────────────
        if len(target_items) == 1:
            for sigla, canon in entries:
                contexto = f"carrera={sigla}"
                resultados = buscar_por_carrera(cur, titulo_norm, sigla)

                if not resultados:
                    log.warning("No encontrada en BD: '%s' [%s] — omitida.", titulo_norm, sigla)
                    continue

                for asig in resultados:
                    id_viejo = asig["id"]
                    nombre_actual = asig["nombre"]
                    depto_id = asig["depto"]

                    if normalizar_texto(nombre_actual) == normalizar_texto(canon):
                        log.info("%sSKIP (ya es canonico) '%s' (id=%d) [%s]",
                                 prefix, nombre_actual, id_viejo, sigla)
                        stats.sin_cambios += 1
                        continue

                    id_canonico = buscar_canonico_en_depto(cur, canon, depto_id, id_viejo)

                    if id_canonico is None:
                        log.info("%s[RENAME] '%s' (id=%d, depto=%d) -> '%s' [%s]",
                                 prefix, nombre_actual, id_viejo, depto_id, canon, sigla)
                        if not dry_run:
                            cur.execute(
                                "UPDATE asignaturas SET nombre = %s WHERE id = %s",
                                (canon, id_viejo),
                            )
                            _invalidar_cache()
                        stats.renombradas += 1
                    else:
                        _aplicar_merge(cur, id_viejo, nombre_actual, id_canonico,
                                       canon, depto_id, dry_run, contexto)
            continue

        # ── Multiple distinct targets: split mallas per carrera ──────
        log.info("%s[MULTI-TARGET] '%s' -> %d targets distintos",
                 prefix, titulo_norm, len(target_items))

        resultados = buscar_asignatura_por_nombre(cur, titulo_norm)

        # ── Fallback: subject may have been merged/deleted in a prior run ──
        if not resultados:
            first_canon = target_items[0][0]
            resultados_fb = buscar_asignatura_por_nombre(cur, first_canon)
            if resultados_fb:
                log.info("%s  (fallback: origen '%s' no existe, usando '%s' id=%d como source)",
                         prefix, titulo_norm, first_canon, resultados_fb[0]["id"])
                resultados = resultados_fb

        if not resultados:
            log.warning("No encontrada en BD: '%s' — omitida (multi-target).", titulo_norm)
            continue

        for asig in resultados:
            id_viejo = asig["id"]
            nombre_actual = asig["nombre"]
            depto_id = asig["depto"]

            log.info("%s  Procesando '%s' (id=%d, depto=%d)", prefix, nombre_actual, id_viejo, depto_id)

            first = True
            for canon, siglas in target_items:
                ctx = f"carreras={','.join(siglas)}"

                if normalizar_texto(nombre_actual) == normalizar_texto(canon):
                    log.info("%s  SKIP (ya es canonico) '%s' (id=%d) [%s]",
                             prefix, nombre_actual, id_viejo, ctx)
                    stats.sin_cambios += 1
                    if first:
                        first = False
                    continue

                # Resolve carrera ids for this target
                carrera_ids = _siglas_a_carrera_ids(cur, siglas)

                # Ensure canonical subject exists (create if needed)
                id_canonico = _obtener_o_crear_asignatura(cur, canon, depto_id, id_viejo, dry_run)

                if id_canonico is None:
                    # dry-run and doesn't exist yet
                    log.info("%s  [DRY-RUN] Se crearia '%s' en depto=%d [%s]",
                             prefix, canon, depto_id, ctx)
                    if carrera_ids:
                        placeholders = ', '.join(['%s'] * len(carrera_ids))
                        cur.execute(
                            f"SELECT COUNT(*) FROM malla WHERE asignatura = %s AND carrera IN ({placeholders})",
                            (id_viejo, *carrera_ids),
                        )
                        n_est = cur.fetchone()[0]
                        if n_est:
                            log.info("%s  [DRY-RUN]   -> %d mallas serian repointadas [%s]",
                                     prefix, n_est, ctx)
                    if first:
                        first = False
                    continue

                # Repoint mallas for specific carreras only
                n_mal = repoint_malla_por_carreras(cur, id_viejo, id_canonico, carrera_ids, dry_run)
                stats.mallas_repointadas += n_mal
                if n_mal:
                    log.info("%s  -> %d mallas repointadas a '%s' (id=%d) [%s]",
                             prefix, n_mal, canon, id_canonico, ctx)

                if first:
                    n_sec = repoint_secciones(cur, id_viejo, id_canonico, dry_run)
                    n_int = repoint_intentos(cur, id_viejo, id_canonico, dry_run)
                    stats.secciones_repointadas += n_sec
                    stats.intentos_repointados += n_int
                    if n_sec or n_int:
                        log.info("%s  -> %d secciones, %d intentos repointados [%s]",
                                 prefix, n_sec, n_int, ctx)

                    # Cleanup duplicados (igual que en _aplicar_merge)
                    if not dry_run:
                        refs_sec = contar_refs(cur, "secciones", "asignatura", id_viejo)
                        if refs_sec > 0:
                            log.warning(
                                "  Quedan %d secciones no repointadas en id=%d. "
                                "Intentando cleanup de duplicados...", refs_sec, id_viejo
                            )
                            limpiar_secciones_duplicadas(cur, id_viejo, id_canonico)
                            n_retry = repoint_secciones(cur, id_viejo, id_canonico, dry_run)
                            stats.secciones_repointadas += n_retry
                            if n_retry:
                                log.info("  -> %d secciones adicionales repointadas tras cleanup.", n_retry)

                    first = False

                stats.mergeadas += 1

            # Cleanup old subject after all targets processed
            if not dry_run:
                refs_final = (contar_refs(cur, "secciones", "asignatura", id_viejo) +
                              contar_refs(cur, "malla", "asignatura", id_viejo) +
                              contar_refs(cur, "intentos", "asignatura", id_viejo))
                if refs_final == 0:
                    cur.execute("DELETE FROM asignaturas WHERE id = %s", (id_viejo,))
                    _invalidar_cache()
                    log.info("%s  [DELETE] asignatura id=%d eliminada (split multi-target).", prefix, id_viejo)


# ---------------------------------------------------------------------------
# BUG #3 fix: CREATE EXTENSION en conexion separada con autocommit=True
# para no contaminar la transaccion principal (ni provocar ROLLBACK parcial).
# ---------------------------------------------------------------------------

def setup_unaccent() -> bool:
    """Intenta habilitar unaccent en una conexion separada con autocommit."""
    try:
        conn_ext = psycopg2.connect(**DB_CONFIG)
        conn_ext.autocommit = True
        with conn_ext.cursor() as cur:
            cur.execute("CREATE EXTENSION IF NOT EXISTS unaccent;")
        conn_ext.close()
        return True
    except Exception:
        return False


# ---------------------------------------------------------------------------
# Entry point
# ---------------------------------------------------------------------------

def parse_args():
    parser = argparse.ArgumentParser(
        description="Migracion transaccional de normalizacion de asignaturas."
    )
    mode = parser.add_mutually_exclusive_group()
    mode.add_argument(
        "--dry-run",
        action="store_true",
        default=True,
        help="(Default) Solo muestra lo que haria, sin modificar la BD.",
    )
    mode.add_argument(
        "--execute",
        action="store_true",
        default=False,
        help="Aplica los cambios reales en la BD (requiere confirmacion).",
    )
    return parser.parse_args()


def main():
    args = parse_args()
    dry_run = not args.execute

    print_backup_banner()

    if not dry_run:
        resp = input("Ya ejecutaste el backup? (y/N): ").strip().lower()
        if resp != "y":
            print("Operacion cancelada. Ejecuta el backup primero.")
            sys.exit(1)  # BUG #5 fix: exit code 1 cuando el usuario cancela

    mode_label = "DRY-RUN (sin cambios reales)" if dry_run else "EXECUTE (cambios reales)"
    log.info("Modo: %s", mode_label)
    log.info("Conectando a BD: %s@%s/%s",
             DB_CONFIG["user"], DB_CONFIG["host"], DB_CONFIG["database"])

    # BUG #3 fix: intentar habilitar unaccent ANTES de abrir la transaccion principal
    # (ya no necesario para el matching, pero util si alguien agrega queries SQL directas)
    setup_unaccent()

    try:
        conn = psycopg2.connect(**DB_CONFIG)
    except psycopg2.Error as exc:
        log.error("No se pudo conectar a la BD: %s", exc)
        sys.exit(1)

    try:
        conn.autocommit = False
        with conn.cursor() as cur:
            try:
                fase1_equivalencias_generales(cur, dry_run)
                fase2_equivalencias_por_carrera(cur, dry_run)

                if dry_run:
                    log.info("Dry-run completado. Ningun cambio fue aplicado.")
                    conn.rollback()
                else:
                    conn.commit()
                    log.info("Transaccion confirmada (COMMIT).")

            except RuntimeError:
                conn.rollback()
                log.error("ROLLBACK total: la migracion fue revertida por errores.")
            except Exception as exc:
                conn.rollback()
                log.error("Error inesperado: %s — ROLLBACK ejecutado.", exc)
                stats.errores += 1
                raise

    finally:
        conn.close()

    stats.print_summary()

    if stats.errores > 0:
        sys.exit(1)


if __name__ == "__main__":
    main()
