package com.dnvcasas.domain.vo;

import com.dnvcasas.domain.exception.DomainException;
import java.time.LocalDate;

/**
 * Value Object: un rango de fechas [from, to). Se usa para las temporadas de precio.
 *
 * Es un {@code record}, o sea inmutable: una vez creado no cambia. Al ser un Value
 * Object, dos rangos con las mismas fechas se consideran iguales (el record ya nos
 * da equals/hashCode por valor). Valida sus invariantes en el constructor: si las
 * fechas no son válidas, ni siquiera se llega a construir el objeto.
 */
public record DateRange(LocalDate from, LocalDate to) {

    // Constructor compacto de record: corre ANTES de asignar los campos.
    // Acá blindamos las reglas para que no exista un DateRange inválido.
    public DateRange {
        if (from == null || to == null)
            throw new DomainException("Las fechas son requeridas");
        if (!from.isBefore(to))
            throw new DomainException("La fecha de inicio debe ser anterior a la de fin");
    }

    /**
     * ¿Este rango se pisa con otro? Se usa para impedir que dos temporadas de
     * precio se solapen. La comparación es media-abierta [from, to): dos rangos
     * que solo se tocan en el extremo (uno termina justo donde el otro empieza)
     * NO se consideran superpuestos.
     */
    public boolean overlaps(DateRange other) {
        return from.isBefore(other.to) && to.isAfter(other.from);
    }
}
