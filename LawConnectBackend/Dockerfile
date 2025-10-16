# -------------------------------
# Stage 1: Build the Spring Boot app
# -------------------------------
FROM maven:3.9.5-eclipse-temurin-17 AS build

WORKDIR /app

# Copy pom.xml and download dependencies (cached layer)
COPY pom.xml .
RUN mvn dependency:go-offline -B

# Copy source code and build
COPY src ./src
RUN mvn clean package -DskipTests

# -------------------------------
# Stage 2: Runtime image
# -------------------------------
FROM eclipse-temurin:17-jre-alpine

# Metadata
LABEL maintainer="lawconnect-team"
LABEL version="1.0"
LABEL description="LawConnect Backend API"

# Create non-root user
RUN addgroup -S spring && adduser -S spring -G spring

# Set working directory
WORKDIR /app

# Install bash, netcat, dos2unix
RUN apk add --no-cache bash netcat-openbsd dos2unix

# Copy jar from build stage
COPY --from=build /app/target/*.jar app.jar

# Create startup script
RUN printf '#!/bin/bash\n\
echo "Waiting for MySQL..."\n\
while ! nc -z mysql 3306; do\n\
  sleep 1\n\
done\n\
echo "MySQL is up - starting application"\n\
exec java $JAVA_OPTS -jar app.jar\n' > /app/start.sh \
    && dos2unix /app/start.sh \
    && chmod +x /app/start.sh \
    && chown -R spring:spring /app

# Switch to non-root user
USER spring:spring

# Expose port
EXPOSE 8080

# JVM options
ENV JAVA_OPTS="-XX:+UseContainerSupport -XX:MaxRAMPercentage=75.0 -XX:+UseG1GC"

# ENTRYPOINT
ENTRYPOINT ["/app/start.sh"]

