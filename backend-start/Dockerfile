# 多阶段构建：构建阶段
FROM maven:3.9-eclipse-temurin-25 AS build

# 设置工作目录
WORKDIR /app

# 复制 pom.xml 文件（利用 Docker 缓存层）
COPY pom.xml .
COPY backend-common-redis/pom.xml ./backend-common-redis/
COPY backend-common-security/pom.xml ./backend-common-security/
COPY backend-common-web/pom.xml ./backend-common-web/
COPY backend-start/pom.xml ./backend-start/
COPY backend-system/pom.xml ./backend-system/
COPY backend-system-entity/pom.xml ./backend-system-entity/

# 下载依赖（利用缓存）
RUN mvn dependency:go-offline -B

# 复制源代码
COPY backend-common-redis/src ./backend-common-redis/src
COPY backend-common-security/src ./backend-common-security/src
COPY backend-common-web/src ./backend-common-web/src
COPY backend-start/src ./backend-start/src
COPY backend-system/src ./backend-system/src
COPY backend-system-entity/src ./backend-system-entity/src

# 构建应用
RUN mvn clean package -DskipTests -B

# 运行阶段
FROM eclipse-temurin:25-jre-alpine

# 设置工作目录
WORKDIR /app

# 创建非 root 用户
RUN addgroup -S spring && adduser -S spring -G spring

# 从构建阶段复制 JAR 文件
COPY --from=build /app/backend-start/target/*.jar app.jar

# 更改文件所有者
RUN chown spring:spring app.jar

# 切换到非 root 用户
USER spring:spring

# 暴露端口
EXPOSE 8080

# 健康检查
HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:8080/actuator/health || exit 1

# 启动应用
ENTRYPOINT ["java", "-jar", "app.jar"]

