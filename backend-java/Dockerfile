# --- Build ---
FROM maven:3.9-eclipse-temurin-21 AS build
WORKDIR /src

# Los pom primero: cachea la capa de dependencias
COPY pom.xml .
COPY dnvcasas-domain/pom.xml         dnvcasas-domain/
COPY dnvcasas-application/pom.xml    dnvcasas-application/
COPY dnvcasas-infrastructure/pom.xml dnvcasas-infrastructure/
COPY dnvcasas-api/pom.xml            dnvcasas-api/
RUN mvn -B -q dependency:go-offline || true

COPY . .
RUN mvn -B -q package -DskipTests

# --- Runtime ---
FROM eclipse-temurin:21-jre AS runtime
WORKDIR /app

# La imagen de Temurin ya trae un usuario con UID 1000 — de ahí el 1001.
# El GID 2000 es el MISMO que el del contenedor .NET: los dos montan el volumen
# de uploads y sin un grupo común el que escribe primero deja al otro afuera con
# "Permission denied".
RUN groupadd -g 2000 dnvcasas && useradd -m -u 1001 -g 2000 appuser
COPY --from=build /src/dnvcasas-api/target/dnvcasas-api-*.jar app.jar

# g+w y setgid: lo que cree cualquiera de los dos queda escribible por el grupo.
RUN mkdir -p /app/wwwroot/uploads \
    && chown -R appuser:dnvcasas /app \
    && chmod -R 2775 /app/wwwroot
USER appuser

EXPOSE 8080

# MaxRAMPercentage: la JVM ya lee el límite del cgroup, pero su default es usar
# el 25% del heap. Con un límite de memoria en el contenedor, eso desperdicia
# tres cuartos.
#
# ExitOnOutOfMemoryError: sin esto, un OOM deja la JVM viva pero rota — responde
# el health check y sigue recibiendo tráfico que no puede atender. Mejor morir y
# que el orquestador la reinicie.
ENTRYPOINT ["java", \
  "-XX:MaxRAMPercentage=75", \
  "-XX:+ExitOnOutOfMemoryError", \
  "-jar", "/app/app.jar"]
